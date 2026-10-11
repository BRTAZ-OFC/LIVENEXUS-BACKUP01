// Cliente do Worker channel-verify (SEPARADO do youtubechat).
// Comunicação direta com o Worker via fetch.

// >>> TROQUE pelo URL do seu Worker channel-verify após o deploy <<<
const WORKER_URL = 'https://channel-verify.radiotweet.workers.dev';

async function post(path, body) {
  let r;
  try {
    r = await fetch(WORKER_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
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