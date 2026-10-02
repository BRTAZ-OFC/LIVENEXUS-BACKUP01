// vodDiscovery.js — descoberta e normalização de VOD por plataforma.
// Frontend-first. Sem polling. Chamado em momentos pontuais:
// - fim da live (recordPastLive no StreamingContext)
// - abertura de Dashboard/Perfil/Todas as Lives (recheck pending)
//
// Retorna:
// { vodStatus: 'available', vodId, title, streamUrl, thumbnailUrl, duration, views, createdAt }
// { vodStatus: 'pending' }     — VOD ainda não disponível, pode aparecer depois
// { vodStatus: 'unavailable' } — VOD definitivamente não existe (404/401)
// null                          — descoberta falhou (rede/CORS), manter pendente em localStorage

// Client-Id público do Twitch web (usado por extensões de browser).
const TWITCH_GQL_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

// Janela de tolerância para casar VOD com a transmissão específica (60 min).
const MATCH_WINDOW_MS = 60 * 60 * 1000;

// Tempo máximo TOTAL de uma tentativa de descoberta de VOD (30s).
// Ultrapassado => aborta o fetch real (AbortController), retorna { vodStatus: 'unavailable' },
// não salva LiveSession, não envia ao carrossel, remove a pendência temporária da UI.
// Sem retry, polling, setInterval ou loop. Uma única tentativa por chamada.
const DISCOVERY_TIMEOUT_MS = 30000;

async function discoverVodInner(platform, liveData, signal) {
  if (platform === 'Twitch') return discoverTwitchVod(liveData, signal);
  if (platform === 'YouTube') return discoverYouTubeVod(liveData, signal);
  if (platform === 'Kick') return discoverKickVod(liveData, signal);
  return null;
}

export async function discoverVod(platform, liveData) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DISCOVERY_TIMEOUT_MS);
  try {
    return await discoverVodInner(platform, liveData, controller.signal);
  } catch (e) {
    if (e?.name === 'AbortError' || controller.signal.aborted) {
      console.warn(`VOD discovery aborted (${platform}) after ${DISCOVERY_TIMEOUT_MS}ms`);
      return { vodStatus: 'unavailable' };
    }
    console.error(`VOD discovery error (${platform}):`, e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// --- Twitch ---
// Usa GQL público (Client-Id web) para listar VODs archive do canal.
// Casa o VOD com a transmissão específica comparando createdAt com startedAt.
// NÃO pega "último vídeo do canal" genericamente — seleciona o mais próximo da stream.
async function discoverTwitchVod(liveData, signal) {
  const { channelName, startedAt } = liveData;
  if (!channelName) return null;
  try {
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      signal,
      headers: {
        'Client-Id': TWITCH_GQL_CLIENT_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query($login: String!) {
          user(login: $login) {
            videos(first: 10, type: ARCHIVE, sort: TIME) {
              edges { node { id title createdAt lengthSeconds thumbnailURLs(count: 1) viewCount } }
            }
          }
        }`,
        variables: { login: channelName },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.errors) return null;
    const edges = data?.data?.user?.videos?.edges || [];
    if (!edges.length) return { vodStatus: 'pending' };

    const streamStart = startedAt ? new Date(startedAt).getTime() : Date.now();
    let best = null, bestDiff = Infinity;
    for (const e of edges) {
      const v = e.node;
      const t = new Date(v.createdAt).getTime();
      if (isNaN(t)) continue;
      const diff = Math.abs(t - streamStart);
      if (diff < bestDiff) { bestDiff = diff; best = v; }
    }
    if (best && bestDiff < MATCH_WINDOW_MS) {
      return {
        vodStatus: 'available',
        vodId: best.id,
        title: best.title,
        streamUrl: `https://www.twitch.tv/videos/${best.id}`,
        thumbnailUrl: best.thumbnailURLs?.[0] || null,
        duration: best.lengthSeconds || null,
        views: best.viewCount || null,
        createdAt: best.createdAt,
      };
    }
    return { vodStatus: 'pending' };
  } catch (e) {
    console.error('Twitch VOD discovery failed:', e);
    return null;
  }
}

// --- YouTube ---
// O videoId já é conhecido (é o streamId). Usa oEmbed para verificar disponibilidade.
// NÃO usa métricas agregadas do canal — trabalha com a transmissão específica.
async function discoverYouTubeVod(liveData, signal) {
  const { streamId, channelName } = liveData;
  if (!streamId) return null;
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${streamId}&format=json`,
      { signal }
    );
    if (res.ok) {
      const data = await res.json();
      return {
        vodStatus: 'available',
        vodId: streamId,
        title: data.title || liveData.title,
        streamUrl: `https://www.youtube.com/watch?v=${streamId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${streamId}/hqdefault.jpg`,
        channelName: data.author_name || channelName,
        createdAt: null,
        duration: null,
        views: null,
      };
    }
    if (res.status === 401 || res.status === 404) {
      // Vídeo privado/removido — definitivamente indisponível
      return { vodStatus: 'unavailable' };
    }
    // Outros erros — pode estar processando ainda
    return { vodStatus: 'pending' };
  } catch (e) {
    console.error('YouTube VOD discovery failed:', e);
    return null;
  }
}

// --- Kick ---
// Usa a API pública do Kick para listar vídeos do canal (replays/VODs).
// Casa o VOD com a transmissão comparando createdAt com startedAt.
// O VOD da Kick pode não aparecer imediatamente — retorna pending se não encontrado.
async function discoverKickVod(liveData, signal) {
  const { channelName, startedAt } = liveData;
  if (!channelName) return null;
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${channelName}/videos`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const videos = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    if (!videos.length) return { vodStatus: 'pending' };

    const streamStart = startedAt ? new Date(startedAt).getTime() : Date.now();
    let best = null, bestDiff = Infinity;
    for (const v of videos) {
      const t = new Date(v.created_at || v.createdAt || '').getTime();
      if (isNaN(t)) continue;
      const diff = Math.abs(t - streamStart);
      if (diff < bestDiff) { bestDiff = diff; best = v; }
    }
    if (best && bestDiff < MATCH_WINDOW_MS) {
      return {
        vodStatus: 'available',
        vodId: String(best.id || ''),
        title: best.thumbnail?.[0]?.label || best.title || liveData.title,
        streamUrl: best.url || `https://kick.com/video/${best.id}`,
        thumbnailUrl: best.thumbnail?.[0]?.src || best.thumbnail_url || null,
        duration: best.duration || null,
        views: best.views || null,
        createdAt: best.created_at || best.createdAt,
      };
    }
    return { vodStatus: 'pending' };
  } catch (e) {
    console.error('Kick VOD discovery failed:', e);
    return null;
  }
}