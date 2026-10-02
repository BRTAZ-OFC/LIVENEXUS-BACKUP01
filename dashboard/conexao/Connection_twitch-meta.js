/**
 * Live Nexus — Twitch Meta Worker (Helix oficial)
 * SEPARADO do channel-meta. Sem setInterval. Sob demanda + cache.
 *
 * Rota:
 *   POST /twitch/meta { login } -> { online, streamId, title, viewers, startedAt, thumbnail, _cache } | { error }
 *
 * Fonte: Twitch Helix oficial (GET /helix/streams?user_login=).
 * App access token: obtido server-side via client_credentials, cacheado em memória do isolate,
 *   renovado antes de expirar, invalidado e re-obtido uma única vez em caso de 401.
 * Cache meta: Cache API (caches.default), TTL 25s por login.
 * CORS: produção (livenexus.base44.app) + preview Base44 (https://*.base44.app).
 * Rate limit: contador in-memory por isolate (soft, best-effort) — /twitch/meta máx 30/min/IP.
 * Secrets: env.TWITCH_CLIENT_ID e env.TWITCH_CLIENT_SECRET (NUNCA hardcoded, NUNCA retornados).
 * Sem Base44. Sem setInterval.
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

const HELIX_STREAMS = 'https://api.twitch.tv/helix/streams';
const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const META_TTL = 25_000; // 25s

function json(obj, status = 200, corsH = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...corsH } });
}
function corsFor(request) {
  const origin = request.headers.get('Origin') || '';
  return isAllowedOrigin(origin) ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' } : { 'Vary': 'Origin' };
}
function cacheKey(path) {
  return new Request('https://twitch-meta.internal' + path, { method: 'GET' });
}

// Normaliza login Twitch: aceita "xqc", "@xqc", "https://twitch.tv/xqc", "https://www.twitch.tv/xqc".
// Valida caracteres de username Twitch (a-z0-9_, 4-25 chars). Retorna null se inválido.
function normalizeLogin(input) {
  const v = (input || '').trim();
  if (!v) return null;
  const m = v.match(/twitch\.tv\/([A-Za-z0-9_]+)/i);
  let login = m ? m[1] : v;
  login = login.replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9_]{1,25}$/.test(login)) return null;
  return login;
}

async function getCache(path, ttl) {
  try {
    const cached = await caches.default.match(cacheKey(path));
    if (!cached) return null;
    const { data, cachedAt } = await cached.json();
    if (Date.now() - cachedAt < ttl) return { data, cachedAt };
  } catch {}
  return null;
}
async function putCache(path, data) {
  try {
    const body = JSON.stringify({ data, cachedAt: Date.now() });
    await caches.default.put(cacheKey(path), new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=120' } }));
  } catch {}
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

// --- App access token (client credentials) — cache em memória do isolate ---
let tokenCache = { token: null, expiresAt: 0 };
const TOKEN_REFRESH_MARGIN = 60_000; // renova 60s antes de expirar

async function getAppToken(env) {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt - now > TOKEN_REFRESH_MARGIN) return tokenCache.token;
  const params = new URLSearchParams({
    client_id: env.TWITCH_CLIENT_ID,
    client_secret: env.TWITCH_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });
  const r = await fetch(`${TOKEN_URL}?${params}`, { method: 'POST', headers: { 'Accept': 'application/json' } });
  if (!r.ok) return null;
  const d = await r.json().catch(() => null);
  if (!d?.access_token) return null;
  tokenCache = { token: d.access_token, expiresAt: now + (d.expires_in || 0) * 1000 };
  return tokenCache.token;
}
function invalidateToken() { tokenCache = { token: null, expiresAt: 0 }; }

// Consulta Helix /streams. Em 401, invalida o token, re-obtém uma única vez e refaz a chamada.
async function fetchHelix(login, env) {
  const token = await getAppToken(env);
  if (!token) return { error: 'token' };
  const url = `${HELIX_STREAMS}?user_login=${encodeURIComponent(login)}`;
  const doFetch = (tk) => fetch(url, { headers: { 'Client-ID': env.TWITCH_CLIENT_ID, 'Authorization': `Bearer ${tk}` } });
  let r = await doFetch(token);
  if (r.status === 401) {
    invalidateToken();
    const tk2 = await getAppToken(env);
    if (!tk2) return { error: 'token' };
    r = await doFetch(tk2);
  }
  if (!r.ok) return { error: 'helix', status: r.status };
  const d = await r.json().catch(() => null);
  return { data: d };
}

// Helix thumbnail_url vem com placeholders {width}/{height}; normaliza para 1280x720.
function normalizeThumbnail(url) {
  if (typeof url !== 'string' || !url) return null;
  return url.replace('{width}', '1280').replace('{height}', '720');
}

function buildMeta(d) {
  const s = d?.data?.[0];
  if (!s) return { online: false, streamId: null, title: null, viewers: null, startedAt: null, thumbnail: null };
  return {
    online: true,
    streamId: s.id != null ? String(s.id) : null,
    title: s.title || null,
    viewers: typeof s.viewer_count === 'number' ? s.viewer_count : null,
    startedAt: s.started_at || null,
    thumbnail: normalizeThumbnail(s.thumbnail_url),
  };
}

async function handleMeta(request, env, corsH) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!rateLimit(`tmeta:${ip}`, 30, 60_000)) return json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, 429, corsH);
  const body = await request.json().catch(() => ({}));
  const login = normalizeLogin(body.login);
  if (!login) return json({ error: 'Canal inválido.' }, 400, corsH);
  const path = `/twitch/meta/${login}`;
  const hit = await getCache(path, META_TTL);
  if (hit) return json({ ...hit.data, _cache: 'HIT' }, 200, corsH);
  const res = await fetchHelix(login, env);
  if (res.error === 'token') return json({ error: 'Erro ao obter token de acesso da Twitch.' }, 502, corsH);
  if (res.error === 'helix') return json({ error: 'Erro ao consultar a Twitch.' }, 502, corsH);
  const meta = buildMeta(res.data);
  await putCache(path, meta);
  return json({ ...meta, _cache: 'MISS' }, 200, corsH);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const corsH = corsFor(request);
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...corsH, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    try {
      if (path === '/twitch/meta' && method === 'POST') return await handleMeta(request, env, corsH);
      return json({ error: 'Not found' }, 404, corsH);
    } catch (e) {
      return json({ error: 'Erro no Worker.' }, 500, corsH);
    }
  },
};