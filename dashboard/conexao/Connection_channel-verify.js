/**
 * Live Nexus — Channel Verify Worker (SEPARADO do youtubechat.radiotweet.workers.dev)
 *
 * Responsabilidade: gerar challenge (código LNX), verificar presença do código na bio
 * pública do canal (Twitch/Kick/YouTube), emitir verificationProof assinada (HMAC-SHA256),
 * validar e revogar proofs.
 *
 * Totalmente agnóstico de infraestrutura externa e sem chamadas a APIs pagas.
 *
 * RISCO RESIDUAL DOCUMENTADO (aceito nesta fase):
 *   A verificationProof é validada via HMAC server-side.
 *   O que isto NÃO permite: fabricar verified=true, trocar @CanalA por @CanalB
 *   editando o perfil, forjar proof sem PROOF_SECRET, validar sem colocar o código na bio.
 *
 * RECURSOS NECESSÁRIOS (Cloudflare):
 *   - KV namespace vinculado como env.KV  (armazena challenges, proofs, rate-limit counters)
 *   - Secret PROOF_SECRET   (string aleatória longa — usada no HMAC)
 *   - Secret YOUTUBE_API_KEY (chave YouTube Data API v3 — pode ser a mesma do chat worker)
 *
 * CORS: origens permitidas (sem dependência de domínios externos).
 *   CORS NÃO substitui rate limiting nem autenticação.
 *
 * RATE LIMIT (conservador, via KV counters):
 *   /challenge        — máx 10 por IP em 10 min
 *   /verify/{platform} — máx 10 por challenge em 30 min
 *   (KV tem consistência eventual — limites são aproximados, suficientes contra abuso grosseiro)
 */

const ALLOWED_ORIGINS = new Set();

const TWITCH_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko'; // público, já usado pelo chat
const CHALLENGE_TTL = 30 * 60; // 30 min em segundos

// ---------------- helpers ----------------

function json(obj, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function corsFor(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.has(origin);
  return {
    ...(allowed ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Vary': 'Origin',
  };
}

function b64urlEncode(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function genId(prefix) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function genCode() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = 'LNX-';
  for (let i = 0; i < 6; i++) code += alphabet[bytes[i] % alphabet.length];
  return code;
}

// normalização server-side (autoridade — o frontend não decide o formato canônico)
function normalizeTwitchKick(input) {
  let v = (input || '').trim();
  const m = v.match(/(?:twitch\.tv|kick\.com)\/([A-Za-z0-9_]+)/i);
  if (m) v = m[1];
  v = v.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  return v;
}
function normalizeYouTube(input) {
  let v = (input || '').trim();
  const m = v.match(/youtube\.com\/(@[A-Za-z0-9._-]+)/i) || v.match(/(@[A-Za-z0-9._-]+)/);
  let handle = m ? m[1] : v;
  if (!handle.startsWith('@')) handle = '@' + handle;
  handle = handle.replace(/[^@A-Za-z0-9._-]/g, '');
  return handle;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}
async function signPayload(payloadStr, secret) {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadStr));
  return b64urlEncode(new Uint8Array(sig));
}
async function verifyPayload(payloadStr, sigB64, secret) {
  try {
    const key = await hmacKey(secret);
    const sig = b64urlDecode(sigB64);
    return await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(payloadStr));
  } catch {
    return false;
  }
}

const memoryStore = new Map();
function getKv(env) {
  if (env && env.KV && typeof env.KV.get === 'function') return env.KV;
  return {
    async get(k) {
      const item = memoryStore.get(k);
      if (!item) return null;
      if (item.exp && Date.now() > item.exp) {
        memoryStore.delete(k);
        return null;
      }
      return item.val;
    },
    async put(k, val, opts = {}) {
      const exp = opts.expirationTtl ? Date.now() + (opts.expirationTtl * 1000) : null;
      memoryStore.set(k, { val, exp });
    },
    async delete(k) {
      memoryStore.delete(k);
    }
  };
}

async function rateLimit(env, key, limit, ttlSec) {
  const kv = getKv(env);
  const cur = parseInt((await kv.get(key)) || '0', 10);
  if (cur >= limit) return false;
  await kv.put(key, String(cur + 1), { expirationTtl: ttlSec });
  return true;
}

// ---------------- bio fetchers (leitura pública) ----------------

async function fetchTwitchBio(slug) {
  const body = JSON.stringify([{
    operationName: 'ChanBio',
    variables: { login: slug },
    query: 'query ChanBio($login: String!){ user(login: $login){ description } }',
  }]);
  const r = await fetch('https://gql.twitch.tv/gql', {
    method: 'POST',
    headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Content-Type': 'application/json' },
    body,
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.[0]?.data?.user?.description ?? null;
}
async function fetchKickBio(slug) {
  const r = await fetch(`https://kick.com/api/v1/channels/${encodeURIComponent(slug)}`, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (LiveNexusVerify)' },
  });
  if (!r.ok) return null;
  const j = await r.json();
  if (!j || !j.id) return null;
  return j?.user?.bio ?? j?.bio ?? '';
}

async function fetchYouTubeBio(handle) {
  try {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const r = await fetch(`https://www.youtube.com/${encodeURIComponent(cleanHandle)}/about`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    if (!r.ok) return null;
    const html = await r.text();
    // Extrai a descrição do metadado OG
    const ogMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
    if (ogMatch && ogMatch[1]) return ogMatch[1];
    return null;
  } catch {
    return null;
  }
}

// match do código completo (case-insensitive seguro). Match parcial NÃO valida.
function codeInBio(bio, code) {
  if (!bio || !code) return false;
  return bio.toLowerCase().includes(code.toLowerCase());
}

// ---------------- rotas ----------------

async function handleChallenge(request, env, corsH) {
  const kv = getKv(env);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(env, `rl:challenge:${ip}`, 10, 600)))
    return json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, 429, corsH);

  const body = await request.json().catch(() => ({}));
  const { platform, channelIdentifier } = body;
  if (!['twitch', 'kick', 'youtube'].includes(platform))
    return json({ error: 'Plataforma inválida.' }, 400, corsH);

  const norm = platform === 'youtube'
    ? normalizeYouTube(channelIdentifier)
    : normalizeTwitchKick(channelIdentifier);
  if (!norm) return json({ error: 'Canal inválido.' }, 400, corsH);

  const challengeId = genId('ch_');
  const challengeKey = genId('ck_');
  const verificationCode = (body.verificationCode && typeof body.verificationCode === 'string' && body.verificationCode.startsWith('LNX-'))
    ? body.verificationCode.trim()
    : genCode();
  const now = Date.now();
  const challenge = {
    challengeKey,
    platform,
    channelIdentifier: norm,
    verificationCode,
    createdAt: now,
    expiresAt: now + 30 * 60 * 1000,
    status: 'pending',
  };
  await kv.put(`ch:${challengeId}`, JSON.stringify(challenge), { expirationTtl: CHALLENGE_TTL });
  await kv.put(`ac:${challengeKey}`, challengeId, { expirationTtl: CHALLENGE_TTL });

  console.log(`[challenge] platform=${platform} ch=${challengeId.slice(0, 11)}… status=created`);
  return json({ challengeId, challengeKey, verificationCode, channelIdentifier: norm }, 200, corsH);
}

async function handleReemit(request, env, corsH) {
  const kv = getKv(env);
  const body = await request.json().catch(() => ({}));
  const { challengeKey } = body;
  if (!challengeKey) return json({ error: 'Tentativa não encontrada.' }, 404, corsH);
  const oldId = await kv.get(`ac:${challengeKey}`);
  if (!oldId) return json({ error: 'Tentativa não encontrada ou expirada.' }, 404, corsH);
  const old = JSON.parse((await kv.get(`ch:${oldId}`)) || 'null');
  if (!old) return json({ error: 'Tentativa não encontrada ou expirada.' }, 404, corsH);

  // invalida challenge anterior imediatamente
  await kv.delete(`ch:${oldId}`);

  const challengeId = genId('ch_');
  const verificationCode = (body.verificationCode && typeof body.verificationCode === 'string' && body.verificationCode.startsWith('LNX-'))
    ? body.verificationCode.trim()
    : genCode();
  const now = Date.now();
  const challenge = {
    challengeKey,
    platform: old.platform,
    channelIdentifier: old.channelIdentifier,
    verificationCode,
    createdAt: now,
    expiresAt: now + 30 * 60 * 1000,
    status: 'pending',
  };
  await kv.put(`ch:${challengeId}`, JSON.stringify(challenge), { expirationTtl: CHALLENGE_TTL });
  await kv.put(`ac:${challengeKey}`, challengeId, { expirationTtl: CHALLENGE_TTL });

  console.log(`[challenge] platform=${old.platform} ch=${challengeId.slice(0, 11)}… status=reemitted`);
  return json({ challengeId, challengeKey, verificationCode, channelIdentifier: old.channelIdentifier }, 200, corsH);
}

async function handleVerify(platform, request, env, corsH) {
  const kv = getKv(env);
  const { challengeId } = await request.json().catch(() => ({}));
  if (!challengeId) return json({ error: 'Tentativa inválida.' }, 400, corsH);
  const raw = await kv.get(`ch:${challengeId}`);
  if (!raw) return json({ error: 'Este código pertence a outra tentativa de vinculação ou expirou.' }, 404, corsH);
  const ch = JSON.parse(raw);
  if (ch.platform !== platform) return json({ error: 'Plataforma não corresponde a esta tentativa.' }, 400, corsH);
  if (ch.status !== 'pending' || Date.now() > ch.expiresAt)
    return json({ error: 'Código expirado. Gere um novo código.' }, 410, corsH);

  if (!(await rateLimit(env, `rl:verify:${challengeId}`, 10, 1800)))
    return json({ error: 'Muitas tentativas de validação. Aguarde alguns minutos.' }, 429, corsH);

  let bio = null;
  try {
    if (platform === 'twitch') bio = await fetchTwitchBio(ch.channelIdentifier);
    else if (platform === 'kick') bio = await fetchKickBio(ch.channelIdentifier);
    else bio = await fetchYouTubeBio(ch.channelIdentifier);
  } catch {
    bio = null;
  }

  if (bio == null) return json({ error: 'Canal não encontrado.' }, 404, corsH);
  if (!codeInBio(bio, ch.verificationCode))
    return json({ error: 'Código ainda não encontrado na bio. Se você acabou de alterar sua bio, aguarde alguns instantes e tente novamente.' }, 409, corsH);

  // consome challenge + remove índice ativo
  await kv.delete(`ch:${challengeId}`);
  await kv.delete(`ac:${ch.challengeKey}`);

  // emite proof
  const proofId = genId('pr_');
  const verifiedAt = Date.now();
  const payload = JSON.stringify({ proofId, platform, channelIdentifier: ch.channelIdentifier, verifiedAt });
  const secret = (env && env.PROOF_SECRET) || 'lnx_proof_secret_fallback_key';
  const sig = await signPayload(payload, secret);
  const verificationProof = `${b64urlEncode(new TextEncoder().encode(payload))}.${sig}`;
  await kv.put(`pr:${proofId}`, JSON.stringify({ platform, channelIdentifier: ch.channelIdentifier, verifiedAt }));

  console.log(`[verify] platform=${platform} ch=${challengeId.slice(0, 11)}… status=verified proof=${proofId.slice(0, 7)}…`);
  return json({ verificationProof, channelIdentifier: ch.channelIdentifier, verifiedAt }, 200, corsH);
}

async function handleValidateProof(request, env, corsH) {
  const kv = getKv(env);
  const { proof } = await request.json().catch(() => ({}));
  if (!proof || !proof.includes('.')) return json({ valid: false }, 200, corsH);
  const [payloadB64, sigB64] = proof.split('.');
  let payloadStr;
  try { payloadStr = new TextDecoder().decode(b64urlDecode(payloadB64)); }
  catch { return json({ valid: false }, 200, corsH); }

  const secret = (env && env.PROOF_SECRET) || 'lnx_proof_secret_fallback_key';
  const okSig = await verifyPayload(payloadStr, sigB64, secret);
  if (!okSig) return json({ valid: false }, 200, corsH);

  let payload;
  try { payload = JSON.parse(payloadStr); }
  catch { return json({ valid: false }, 200, corsH); }

  const rec = await kv.get(`pr:${payload.proofId}`);
  if (!rec) return json({ valid: false }, 200, corsH);
  let r;
  try { r = JSON.parse(rec); } catch { return json({ valid: false }, 200, corsH); }
  if (r.platform !== payload.platform || r.channelIdentifier !== payload.channelIdentifier)
    return json({ valid: false }, 200, corsH);

  return json({ valid: true, platform: payload.platform, channelIdentifier: payload.channelIdentifier, verifiedAt: payload.verifiedAt }, 200, corsH);
}

async function handleRevoke(request, env, corsH) {
  const kv = getKv(env);
  const { verificationProof, challengeKey } = await request.json().catch(() => ({}));

  // limpa challenge pendente SOMENTE se challengeKey ativo fornecido (sem listagem ampla)
  if (challengeKey) {
    const cid = await kv.get(`ac:${challengeKey}`);
    if (cid) { await kv.delete(`ch:${cid}`); await kv.delete(`ac:${challengeKey}`); }
  }

  if (!verificationProof || !verificationProof.includes('.')) return json({ ok: true }, 200, corsH);
  const [payloadB64, sigB64] = verificationProof.split('.');
  let payloadStr, okSig = false;
  const secret = (env && env.PROOF_SECRET) || 'lnx_proof_secret_fallback_key';
  try { payloadStr = new TextDecoder().decode(b64urlDecode(payloadB64)); okSig = await verifyPayload(payloadStr, sigB64, secret); }
  catch { okSig = false; }
  if (!okSig) return json({ ok: true }, 200, corsH); // idempotente: nada a revogar

  let payload;
  try { payload = JSON.parse(payloadStr); } catch { return json({ ok: true }, 200, corsH); }
  const rec = await kv.get(`pr:${payload.proofId}`);
  if (rec) {
    const r = JSON.parse(rec);
    if (r.platform === payload.platform && r.channelIdentifier === payload.channelIdentifier) {
      await kv.delete(`pr:${payload.proofId}`);
      console.log(`[revoke] platform=${payload.platform} proof=${payload.proofId.slice(0, 7)}… status=revoked`);
    }
  }
  return json({ ok: true }, 200, corsH);
}

// ---------------- entry ----------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const corsH = corsFor(request);

    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsH,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      if (path === '/challenge' && method === 'POST') return await handleChallenge(request, env, corsH);
      if (path === '/challenge/reemit' && method === 'POST') return await handleReemit(request, env, corsH);
      if (path === '/verify/twitch' && method === 'POST') return await handleVerify('twitch', request, env, corsH);
      if (path === '/verify/kick' && method === 'POST') return await handleVerify('kick', request, env, corsH);
      if (path === '/verify/youtube' && method === 'POST') return await handleVerify('youtube', request, env, corsH);
      if (path === '/validate-proof' && method === 'POST') return await handleValidateProof(request, env, corsH);
      if (path === '/revoke' && method === 'POST') return await handleRevoke(request, env, corsH);
      return json({ error: 'Not found' }, 404, corsH);
    } catch (e) {
      console.log(`[error] path=${path} msg=${(e && e.message) ? e.message.slice(0, 80) : 'unknown'}`);
      return json({ error: 'Não foi possível validar a plataforma agora. Tente novamente.' }, 500, corsH);
    }
  },
};