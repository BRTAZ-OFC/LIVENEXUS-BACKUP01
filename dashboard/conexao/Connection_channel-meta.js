/**
 * Live Nexus — Channel Meta Worker (Kick resolve + meta)
 * SEPARADO do channel-verify. Sem setInterval. Sob demanda direta.
 *
 * Rotas:
 *   POST /kick/resolve { slug } -> { chatroomId } | { error }
 *   POST /kick/meta    { slug } -> { streamId, title, thumbnail, startedAt, viewers, online } | { error }
 *
 * CORS: produção (livenexus.base44.app) + preview Base44 (https://*.base44.app).
 * Rate limit: contador in-memory por isolate (soft, best-effort) — /kick/meta máx 30/min/IP.
 * Sem secrets. Sem Base44. Sem setInterval.
 */
const PRODUCTION_ORIGIN = 'https://livenexus.base44.app';

// Validação de origin: produção (livenexus.base44.app) + preview da Base44 (subdomínios sob base44.app, https only).
// NÃO usa wildcard '*'; restringe ao eTLD+1 base44.app (plataforma Base44). Não abre para base44.com ou origens arbitrárias.
function isAllowedOrigin(origin) {
  if (origin === PRODUCTION_ORIGIN) return true;
  try {
    const u = new URL(origin);
    return u.protocol === 'https:' && u.hostname.endsWith('.base44.app') && u.hostname !== 'base44.app';
  } catch { return false; }
}
const KICK_URLS = ['https://kick.com/api/v1/channels/', 'https://kick.com/api/v2/channels/'];
const META_TTL = 25_000;
const RESOLVE_TTL = 60_000;

function json(obj, status = 200, corsH = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...corsH } });
}
function corsFor(request) {
  const origin = request.headers.get('Origin') || '';
  return isAllowedOrigin(origin) ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' } : { 'Vary': 'Origin' };
}

function normalizeSlug(input) {
  const v = (input || '').trim().toLowerCase();
  const m = v.match(/kick\.com\/([a-z0-9_.]+)/i);
  let slug = m ? m[1] : v;
  slug = slug.replace(/^@/, '').replace(/[^a-z0-9_.]/g, '');
  return slug;
}

async function fetchKick(slug) {
  for (const base of KICK_URLS) {
    try {
      const r = await fetch(base + encodeURIComponent(slug), {
        headers: { 'User-Agent': 'Mozilla/5.0 (LiveNexusMeta)', 'Accept': 'application/json' },
      });
      if (r.ok) return await r.json();
    } catch {}
  }
  return null;
}

// soft rate limit (in-memory por isolate)
const rlCounters = new Map();
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const e = rlCounters.get(key);
  if (!e || now > e.expires) { rlCounters.set(key, { count: 1, expires: now + windowMs }); return true; }
  if (e.count >= limit) return false;
  e.count++;
  return true;
}

// Normaliza thumbnail para STRING de URL.
// ls.thumbnail string -> direto | ls.thumbnail.url -> .url | data.thumbnail.src -> .src | data.thumbnail string -> direto | null
function normalizeThumbnail(ls, data) {
  const t = ls?.thumbnail;
  if (typeof t === 'string') return t;
  if (t && typeof t === 'object' && typeof t.url === 'string') return t.url;
  if (data?.thumbnail && typeof data.thumbnail === 'object' && typeof data.thumbnail.src === 'string') return data.thumbnail.src;
  if (typeof data?.thumbnail === 'string') return data.thumbnail;
  return null;
}

function buildMeta(data) {
  const ls = data?.livestream || data?.current_livestream;
  const followers = typeof data?.followers_count === 'number' ? data.followers_count : null;
  let subs = null;
  if (typeof data?.subscriber_count === 'number') subs = data.subscriber_count;
  else if (Array.isArray(data?.subscribers)) subs = data.subscribers.length;
  if (ls) {
    const v = ls.viewer_count ?? ls.viewers;
    return {
      streamId: ls.id != null ? String(ls.id) : (data.id != null ? String(data.id) : null),
      title: ls.session_title || data.channel_title || null,
      thumbnail: normalizeThumbnail(ls, data),
      startedAt: ls.created_at || null,
      viewers: typeof v === 'number' ? v : null,
      online: true,
      followers,
      subscribers: subs,
    };
  }
  return { streamId: null, title: null, thumbnail: null, startedAt: null, viewers: null, online: false, followers, subscribers: subs };
}

async function handleResolve(request, corsH) {
  const body = await request.json().catch(() => ({}));
  const slug = normalizeSlug(body.slug);
  if (!slug) return json({ error: 'Canal inválido.' }, 400, corsH);
  const data = await fetchKick(slug);
  if (!data || !data.chatroom?.id) return json({ error: 'Não foi possível obter o chatroom ID do canal.' }, 404, corsH);
  const chatroomId = data.chatroom.id;
  return json({ chatroomId }, 200, corsH);
}

async function handleMeta(request, corsH) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!rateLimit(`meta:${ip}`, 30, 60_000)) return json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, 429, corsH);
  const body = await request.json().catch(() => ({}));
  const slug = normalizeSlug(body.slug);
  if (!slug) return json({ error: 'Canal inválido.' }, 400, corsH);
  const data = await fetchKick(slug);
  if (!data) return json({ error: 'Canal não encontrado.' }, 404, corsH);
  const meta = buildMeta(data);
  return json(meta, 200, corsH);
}

// ─── /lab-kick-viewer-token — TESTE ISOLADO (Camimho A) ─────────────────────
// Verifica se o Worker consegue obter o viewer token do gateway realtime da Kick
// (https://websockets.kick.com/viewer/v1/token) sem cookie/sessão privada.
// Três tentativas: A (direto), B (headers navegador), C (visita kick.com + cookie).
// NUNCA retorna token/cookie completo. Sem persistência de cookies.
const X_CLIENT_TOKEN_LAB = 'e1393935a959b4020a4491574f6490129f678acdaa92760471263db43487f823';
const TOKEN_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function attemptToken(headers, cookieStr) {
  const h = { ...headers };
  if (cookieStr) h['Cookie'] = cookieStr;
  try {
    const r = await fetchWithTimeout('https://websockets.kick.com/viewer/v1/token', { method: 'GET', headers: h }, TOKEN_TIMEOUT_MS);
    const text = await r.text().catch(() => '');
    let parsed = null;
    try { parsed = JSON.parse(text); } catch {}
    const token = parsed?.data?.token || parsed?.token || null;
    return {
      status: r.status,
      contentType: r.headers.get('content-type') || null,
      server: r.headers.get('server') || null,
      cfRay: r.headers.get('cf-ray') || null,
      bodyLength: text.length,
      bodyPreview: text.slice(0, 300),
      jsonParsed: parsed !== null,
      tokenPresent: !!token,
      tokenLength: token ? token.length : 0,
      error: null,
    };
  } catch (e) {
    return { status: 0, contentType: null, server: null, cfRay: null, bodyLength: 0, bodyPreview: '', jsonParsed: false, tokenPresent: false, tokenLength: 0, error: e.message || String(e) };
  }
}

async function handleLabKickViewerToken(request, corsH) {
  const ts = new Date().toISOString();

  // Tentativa A — token direto (headers mínimos)
  const attemptA = await attemptToken({
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0',
  });

  // Tentativa B — token com headers de navegador + X-CLIENT-TOKEN
  const attemptB = await attemptToken({
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://kick.com',
    'Referer': 'https://kick.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
    'X-CLIENT-TOKEN': X_CLIENT_TOKEN_LAB,
  });

  // Tentativa C — visita kick.com + token com cookie
  let kickHomepage = { status: 0, setCookiePresent: false, cookieNames: [], cloudflareCookiePresent: false, error: null };
  let attemptC = { status: 0, contentType: null, server: null, cfRay: null, bodyLength: 0, bodyPreview: '', jsonParsed: false, tokenPresent: false, tokenLength: 0, error: 'skipped' };
  try {
    const homeRes = await fetchWithTimeout('https://kick.com/', {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' },
    }, TOKEN_TIMEOUT_MS);
    kickHomepage.status = homeRes.status;
    const setCookie = homeRes.headers.get('set-cookie') || '';
    kickHomepage.setCookiePresent = !!setCookie;
    if (setCookie) {
      const names = [];
      for (const part of setCookie.split(/,(?=[^;]+=)/)) {
        const m = part.match(/^\s*([^=;]+)/);
        if (m && m[1]) names.push(m[1].trim());
      }
      kickHomepage.cookieNames = [...new Set(names)];
      kickHomepage.cloudflareCookiePresent = names.some(n => /cf_clearance|__cf_bm|cf_chl/i.test(n));
      // monta cookie string apenas com cookies desta resposta (não persiste)
      if (kickHomepage.setCookiePresent) {
        const cookiePairs = [];
        for (const part of setCookie.split(/,(?=[^;]+=)/)) {
          const m = part.match(/^\s*([^=]+)=([^;]*)/);
          if (m) cookiePairs.push(`${m[1].trim()}=${m[2].trim()}`);
        }
        const cookieStr = cookiePairs.join('; ');
        attemptC = await attemptToken({
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://kick.com',
          'Referer': 'https://kick.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
          'X-CLIENT-TOKEN': X_CLIENT_TOKEN_LAB,
        }, cookieStr);
      }
    }
  } catch (e) {
    kickHomepage.error = e.message || String(e);
  }

  // Veredito
  const anyToken = attemptA.tokenPresent || attemptB.tokenPresent || attemptC.tokenPresent;
  const allStatus = [attemptA.status, attemptB.status, attemptC.status].filter(s => s > 0);
  const any403 = allStatus.includes(403);
  const anyBlock = allStatus.some(s => [401, 429, 500, 502, 503].includes(s));
  const allFailed = allStatus.every(s => s === 0) && allStatus.length === 0;
  let verdict;
  if (anyToken) verdict = 'WORKER_TOKEN_AVAILABLE';
  else if (any403) verdict = 'WORKER_TOKEN_BLOCKED_403';
  else if (anyBlock) verdict = 'WORKER_TOKEN_BLOCKED_OTHER';
  else if (kickHomepage.setCookiePresent && !anyToken) verdict = 'WORKER_TOKEN_REQUIRES_BROWSER_SESSION';
  else if (allFailed || allStatus.length === 0) verdict = 'WORKER_TOKEN_NETWORK_FAILURE';
  else verdict = 'INCONCLUSIVE';

  return json({ test: 'kick-viewer-token-worker', timestamp: ts, attemptA, attemptB, kickHomepage, attemptC, verdict }, 200, corsH);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const corsH = corsFor(request);
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...corsH, 'Access-Control-Allow-Methods': 'POST, OPTIONS, GET', 'Access-Control-Allow-Headers': 'Content-Type' } });
    try {
      if (path === '/kick/resolve' && method === 'POST') return await handleResolve(request, corsH);
      if (path === '/kick/meta' && method === 'POST') return await handleMeta(request, corsH);
      if (path === '/lab-kick-viewer-token' && method === 'GET') return await handleLabKickViewerToken(request, corsH);
      return json({ error: 'Not found' }, 404, corsH);
    } catch (e) {
      return json({ error: 'Erro no Worker.' }, 500, corsH);
    }
  },
};