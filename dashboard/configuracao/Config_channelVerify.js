// Cliente do Worker channel-verify (SEPARADO do youtubechat).
// Comunicação direta com o Worker via fetch.

// >>> Endpoint do verificador (local integrado ou Worker Cloudflare remoto) <<<
const LOCAL_ENDPOINT = '/api/channel-verify';
const REMOTE_WORKER_URL = 'https://channel-verify.radiotweet.workers.dev';

async function post(path, body) {
  let r;

  // 1. Tenta endpoint integrado local (/api/channel-verify)
  try {
    r = await fetch(LOCAL_ENDPOINT + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    r = null;
  }

  // 2. Se falhar ou retornar 404/502/503, tenta Worker Cloudflare remoto
  if (!r || !r.ok) {
    try {
      const remoteRes = await fetch(REMOTE_WORKER_URL + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (remoteRes.ok || (remoteRes.status < 500 && remoteRes.status !== 404)) {
        r = remoteRes;
      }
    } catch {
      // Mantém r se já tinha uma resposta ou null
    }
  }

  if (!r) {
    throw new Error('Não foi possível conectar ao verificador. Tente novamente.');
  }

  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Não foi possível validar a plataforma agora. Tente novamente.');
  return j;
}

export const channelVerify = {
  challenge: async (platform, channelIdentifier, verificationCode) => {
    return await post('/challenge', {
      platform: platform.toLowerCase(),
      channelIdentifier,
      ...(verificationCode ? { verificationCode } : {}),
    });
  },
  reemit: (challengeKey, verificationCode) => post('/challenge/reemit', {
    challengeKey,
    ...(verificationCode ? { verificationCode } : {}),
  }),
  verify: async (platform, challengeId) => {
    return await post('/verify/' + platform.toLowerCase(), { challengeId });
  },
  validateProof: (proof) => post('/validate-proof', { proof }),
  revoke: (verificationProof, challengeKey) =>
    post('/revoke', { verificationProof, challengeKey }),
};