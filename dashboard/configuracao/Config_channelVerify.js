// Cliente do Worker channel-verify (SEPARADO do youtubechat).
// NÃO usa base44.functions.invoke nem integrações pagas.
//
// RISCO RESIDUAL: a verificationProof não está vinculada ao userId Base44.
// Ver docs no Worker (cloudflare-worker/channel-verify.js).

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
  challenge: (platform, channelIdentifier) =>
    post('/challenge', { platform: platform.toLowerCase(), channelIdentifier }),
  reemit: (challengeKey) => post('/challenge/reemit', { challengeKey }),
  verify: (platform, challengeId) =>
    post('/verify/' + platform.toLowerCase(), { challengeId }),
  validateProof: (proof) => post('/validate-proof', { proof }),
  revoke: (verificationProof, challengeKey) =>
    post('/revoke', { verificationProof, challengeKey }),
};