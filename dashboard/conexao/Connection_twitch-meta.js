/**
 * Live Nexus — Twitch Meta Worker (Helix oficial)
 * SEPARADO do channel-meta. Sem setInterval. Sob demanda direta.
 *
 * Rota:
 *   POST /twitch/meta { login } -> { online, streamId, title, viewers, startedAt, thumbnail } | { error }
 *
 * Fonte: Twitch Helix oficial (GET /helix/streams?user_login=).
 * App access token: obtido server-side via client_credentials sob demanda.
 * CORS: produção ou origens permitidas.
 * Rate limit: contador in-memory por isolate (soft, best-effort) — /twitch/meta máx 30/min/IP.
 * Secrets: env.TWITCH_CLIENT_ID e env.TWITCH_CLIENT_SECRET (NUNCA hardcoded, NUNCA retornados).
 * Sem setInterval.
 */
function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return u.protocol === 'https:' || u.protocol === 'http:';
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

// --- App access token (client credentials) ---
async function getAppToken(env) {
  const params = new URLSearchParams({
    client_id: env.TWITCH_CLIENT_ID,
    client_secret: env.TWITCH_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });
  const r = await fetch(`${TOKEN_URL}?${params}`, { method: 'POST', headers: { 'Accept': 'application/json' } });
  if (!r.ok) return null;
  const d = await r.json().catch(() => null);
  return d?.access_token || null;
}

// Consulta Helix /streams sob demanda
async function fetchHelix(login, env) {
  const token = await getAppToken(env);
  if (!token) return { error: 'token' };
  const url = `${HELIX_STREAMS}?user_login=${encodeURIComponent(login)}`;
  const r = await fetch(url, { headers: { 'Client-ID': env.TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` } });
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
  const res = await fetchHelix(login, env);
  if (res.error === 'token') return json({ error: 'Erro ao obter token de acesso da Twitch.' }, 502, corsH);
  if (res.error === 'helix') return json({ error: 'Erro ao consultar a Twitch.' }, 502, corsH);
  const meta = buildMeta(res.data);
  return json(meta, 200, corsH);
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