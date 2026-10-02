// twitchStreamInfo — metadata da live Twitch via GQL anônima (FRONTEND, sem Worker).
// Reutiliza o mesmo Client-ID público do web client da Twitch já usado em
// twitchFollowers.js (CORS * confirmado). Sem backend, sem OAuth, sem Helix.
//
// Retorna:
//   { online, viewers, title, game, startedAt, streamId, thumbnailUrl } | null
//
// online=false quando o canal está offline (user.stream == null).
// Usado pelo poll de 60s em twitchChat.js (fonte ÚNICA de viewer count + meta
// da live Twitch) — evita polls duplicados.
const GQL_URL = 'https://gql.twitch.tv/gql';
const CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

function sanitizeLogin(login) {
  const v = (login || '').trim().toLowerCase().replace(/^@/, '');
  return /^[a-z0-9_]{1,25}$/.test(v) ? v : null;
}

export async function fetchTwitchStreamInfo(login) {
  const chan = sanitizeLogin(login);
  if (!chan) return null;
  try {
    const r = await fetch(GQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Client-ID': CLIENT_ID },
      body: JSON.stringify([{ query: `query{user(login:"${chan}"){stream{id viewersCount title createdAt game{id name}}}}` }]),
    });
    if (!r.ok) return null;
    const arr = await r.json();
    const stream = arr?.[0]?.data?.user?.stream;
    if (!stream) return { online: false, viewers: null, title: null, game: null, startedAt: null, streamId: null, thumbnailUrl: null };
    return {
      online: true,
      viewers: typeof stream.viewersCount === 'number' ? stream.viewersCount : null,
      title: stream.title || null,
      game: stream.game?.name || null,
      startedAt: stream.createdAt || null,
      streamId: stream.id != null ? String(stream.id) : null,
      thumbnailUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${chan}-440x248.jpg`,
    };
  } catch {
    return null;
  }
}