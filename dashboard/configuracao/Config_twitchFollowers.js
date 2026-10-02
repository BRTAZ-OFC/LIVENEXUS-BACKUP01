// twitchFollowers — busca follower count via Twitch GQL (frontend puro).
// CORS * confirmado; Client-ID público do web client da Twitch (não é segredo).
// Sem backend, sem worker. Apenas o totalCount é público anônimo — a LISTA de
// followers (edges/nomes) requer OAuth moderator:read:followers, indisponível
// no frontend sem expor token de usuário.
const GQL_URL = 'https://gql.twitch.tv/gql';
// Client-ID público embutido no web client da Twitch (não é segredo nem OAuth token).
const CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

function sanitizeLogin(login) {
  const v = (login || '').trim().toLowerCase().replace(/^@/, '');
  return /^[a-z0-9_]{1,25}$/.test(v) ? v : null;
}

// fetchFollowerCount(login) -> number | null
// Retorna o total de seguidores do canal, ou null em erro/canal inválido.
export async function fetchFollowerCount(login) {
  const chan = sanitizeLogin(login);
  if (!chan) return null;
  try {
    const r = await fetch(GQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Client-ID': CLIENT_ID },
      body: JSON.stringify([{ query: `query{user(login:"${chan}"){followers{totalCount}}}` }]),
    });
    if (!r.ok) return null;
    const arr = await r.json();
    const total = arr?.[0]?.data?.user?.followers?.totalCount;
    return Number.isFinite(total) ? total : null;
  } catch {
    return null;
  }
}