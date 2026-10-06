// Cloudflare Worker & API Handler — YouTube Music InnerTube Bridge
// Sem scraping HTML/Markdown. Sem regex sobre páginas de busca. Sem Jina.
// Dados estruturados nativos obtidos via YouTube Music InnerTube API (WEB_REMIX).

const YT_CONTEXT = {
  client: {
    clientName: 'WEB_REMIX',
    clientVersion: '1.20240101.01.00',
    hl: 'pt',
    gl: 'BR',
  },
};

const YT_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Referer: 'https://music.youtube.com/',
};

// Parâmetros estruturados dos chips nativos do YouTube Music
const CATEGORY_PARAMS = {
  songs: 'EgWKAQIIAWoSEAUQCRAKEAMQDhAEEBAQFRAR',
  videos: 'EgWKAQIQAWoSEAUQCRAKEAMQDhAEEBAQFRAR',
  artists: 'EgWKAQIgAWoSEAUQCRAKEAMQDhAEEBAQFRAR',
  albums: 'EgWKAQIYAWoSEAUQCRAKEAMQDhAEEBAQFRAR',
  playlists: 'EgeKAQQoAEABahIQBRAJEAoQAxAOEAQQEBAVEBE%3D',
};

const YT_WEB_CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20240101.01.00',
    hl: 'pt',
    gl: 'BR',
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(),
  });
}

// Parser modular reutilizável para itens do YouTube Music (suporta responsiveListItem e twoRowItem)
function parseMusicItemRenderer(it, type) {
  if (!it) return null;

  // Suporte a musicTwoRowItemRenderer (carrosséis/grades)
  if (it.musicTwoRowItemRenderer) {
    const r = it.musicTwoRowItemRenderer;
    const title = r.title?.runs?.map((x) => x.text).join('') || '';
    const subtitle = r.subtitle?.runs?.map((x) => x.text).join('') || '';
    const videoId =
      r.navigationEndpoint?.watchEndpoint?.videoId ||
      r.onTap?.watchEndpoint?.videoId;
    const browseId =
      r.navigationEndpoint?.browseEndpoint?.browseId ||
      r.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
    const thumb =
      r.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
      (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

    if (type === 'songs' || type === 'videos') {
      if (!videoId) return null;
      const durMatch = subtitle.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);
      return {
        type: 'song',
        videoId,
        title: title || 'Música',
        artist: subtitle.split('•')[0]?.trim() || (type === 'videos' ? 'YouTube' : 'Artista'),
        album: subtitle.includes('•') ? subtitle.split('•')[1]?.trim() : '',
        durationStr: durMatch ? durMatch[0] : '',
        thumbnail: thumb,
        source: type === 'videos' ? 'YouTube' : 'YouTube Music',
        channelTitle: subtitle.split('•')[0]?.trim() || (type === 'videos' ? 'YouTube' : 'Artista'),
      };
    } else if (type === 'artists') {
      return {
        type: 'artist',
        browseId: browseId || '',
        name: title || subtitle,
        title: title || subtitle,
        subtitle,
        thumbnail: thumb,
        source: 'YouTube Music',
      };
    } else if (type === 'albums') {
      return {
        type: 'album',
        browseId: browseId || '',
        title,
        artist: subtitle.replace(/Álbum\s*•\s*/i, '').split('•')[0]?.trim() || '',
        year: (subtitle.match(/\b(19\d{2}|20\d{2})\b/) || [])[0] || '',
        thumbnail: thumb,
        source: 'YouTube Music',
      };
    } else if (type === 'playlists') {
      const plId = browseId?.replace(/^VL/, '') || '';
      const isMix = plId.startsWith('RD');
      const isCommunity = plId.startsWith('PL');
      return {
        type: isMix ? 'mix' : isCommunity ? 'community_playlist' : 'playlist',
        browseId: browseId || '',
        playlistId: plId,
        title,
        author: subtitle.split('•')[0]?.trim() || '',
        itemCountStr: subtitle.split('•')[1]?.trim() || '',
        thumbnail: thumb,
        source: 'YouTube Music',
      };
    }
    return null;
  }

  // Suporte a musicResponsiveListItemRenderer (listas verticais)
  const r = it.musicResponsiveListItemRenderer;
  if (!r) return null;

  const flex0 = r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
  const flex1 = r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
  const flex2 = r.flexColumns?.[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];

  const title = flex0.map((x) => x.text).join('').trim();
  const line1 = flex1.map((x) => x.text).join('').trim();
  const line2 = flex2.map((x) => x.text).join('').trim();

  const videoId =
    r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
      ?.playNavigationEndpoint?.watchEndpoint?.videoId ||
    r.playlistItemData?.videoId ||
    r.navigationEndpoint?.watchEndpoint?.videoId;

  const browseId =
    r.navigationEndpoint?.browseEndpoint?.browseId ||
    flex0[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
    r.thumbnail?.musicThumbnailRenderer?.thumbnail?.navigationEndpoint?.browseEndpoint?.browseId ||
    '';

  const navPlaylistId =
    r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
      ?.playNavigationEndpoint?.watchEndpoint?.playlistId ||
    r.navigationEndpoint?.watchEndpoint?.playlistId ||
    '';

  const thumb =
    r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
    (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

  if (type === 'songs' || type === 'videos') {
    if (!videoId) return null;
    const durMatch = `${line1} ${line2}`.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);
    return {
      type: 'song',
      videoId,
      title: title || 'Música',
      artist: line1.split('•')[0]?.trim() || (type === 'videos' ? 'YouTube' : 'Artista'),
      album: line1.includes('•') ? line1.split('•')[1]?.trim() : '',
      durationStr: durMatch ? durMatch[0] : '',
      thumbnail: thumb,
      source: type === 'videos' ? 'YouTube' : 'YouTube Music',
      channelTitle: line1.split('•')[0]?.trim() || (type === 'videos' ? 'YouTube' : 'Artista'),
    };
  } else if (type === 'artists') {
    return {
      type: 'artist',
      browseId: browseId || '',
      name: title || line1,
      title: title || line1,
      subtitle: line1,
      thumbnail: thumb,
      source: 'YouTube Music',
    };
  } else if (type === 'albums') {
    return {
      type: 'album',
      browseId: browseId || '',
      title,
      artist: line1.replace(/Álbum\s*•\s*/i, '').split('•')[0]?.trim() || '',
      year: (line1.match(/\b(19\d{2}|20\d{2})\b/) || [])[0] || '',
      thumbnail: thumb,
      source: 'YouTube Music',
    };
  } else if (type === 'playlists') {
    const rawPlId = navPlaylistId || browseId?.replace(/^VL/, '') || '';
    const plId = rawPlId;
    const isMix = plId.startsWith('RD');
    const isCommunity = plId.startsWith('PL');
    return {
      type: isMix ? 'mix' : isCommunity ? 'community_playlist' : 'playlist',
      browseId: browseId || (plId ? `VL${plId}` : ''),
      playlistId: plId,
      title: title || 'Playlist',
      author: line1.split('•')[0]?.trim() || '',
      itemCountStr: line1.split('•')[1]?.trim() || '',
      thumbnail: thumb,
      source: 'YouTube Music',
    };
  }
  return null;
}

// Extrai o token de continuação seguro de um array continuations
function extractContinuationToken(continuations) {
  if (!Array.isArray(continuations)) return null;
  for (const c of continuations) {
    if (c?.nextContinuationData?.continuation) {
      return c.nextContinuationData.continuation;
    }
  }
  return null;
}

// Localiza musicShelfRenderer na resposta inicial do InnerTube
function findMusicShelf(data) {
  if (!data) return null;
  const tabs = data.contents?.tabbedSearchResultsRenderer?.tabs;
  if (Array.isArray(tabs)) {
    for (const tab of tabs) {
      const secContents = tab?.tabRenderer?.content?.sectionListRenderer?.contents;
      if (Array.isArray(secContents)) {
        for (const sec of secContents) {
          if (sec?.musicShelfRenderer) return sec.musicShelfRenderer;
        }
      }
    }
  }
  const secContents = data.contents?.sectionListRenderer?.contents;
  if (Array.isArray(secContents)) {
    for (const sec of secContents) {
      if (sec?.musicShelfRenderer) return sec.musicShelfRenderer;
    }
  }
  if (data.contents?.musicShelfRenderer) return data.contents.musicShelfRenderer;
  return null;
}

// Localiza musicShelfContinuation na resposta de continuação do InnerTube
function findMusicShelfContinuation(contData) {
  if (!contData) return null;
  if (contData.continuationContents?.musicShelfContinuation) {
    return contData.continuationContents.musicShelfContinuation;
  }
  const secContents = contData.continuationContents?.sectionListContinuation?.contents;
  if (Array.isArray(secContents)) {
    for (const c of secContents) {
      if (c?.musicShelfContinuation) return c.musicShelfContinuation;
    }
  }
  return null;
}

// 1. Passo individual de continuação do InnerTube (devolve itens e o token seguinte)
export async function fetchCategoryStep(query, type, continuationToken = null) {
  const params = CATEGORY_PARAMS[type];
  const items = [];
  let nextContinuation = null;

  try {
    if (continuationToken) {
      // 2. Enquanto existir continuation, faça nova requisição ao endpoint InnerTube /search enviando o token como:
      // continuation=TOKEN
      // ctoken=TOKEN
      const contUrl = `https://music.youtube.com/youtubei/v1/search?continuation=${encodeURIComponent(continuationToken)}&ctoken=${encodeURIComponent(continuationToken)}`;
      const res = await fetch(contUrl, {
        method: 'POST',
        headers: YT_HEADERS,
        body: JSON.stringify({
          context: YT_CONTEXT,
          continuation: continuationToken,
        }),
      });

      if (res.ok) {
        const contData = await res.json();
        // 3. Nas respostas seguintes, leia:
        // continuationContents → musicShelfContinuation → contents
        const shelfCont = findMusicShelfContinuation(contData);

        const contItems = shelfCont?.contents || [];
        for (const it of contItems) {
          const parsed = parseMusicItemRenderer(it, type);
          if (parsed) items.push(parsed);
        }

        // 4. Extraia o próximo token em:
        // musicShelfContinuation → continuations → nextContinuationData.continuation
        nextContinuation = extractContinuationToken(shelfCont?.continuations);
      }
    } else {
      // 1. Na busca inicial, preserve os resultados e extraia:
      // musicShelfRenderer.continuations → nextContinuationData.continuation
      if (!params) return { items: [], continuation: null };
      const res = await fetch('https://music.youtube.com/youtubei/v1/search', {
        method: 'POST',
        headers: YT_HEADERS,
        body: JSON.stringify({
          context: YT_CONTEXT,
          query,
          params,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const shelf = findMusicShelf(data);

        for (const it of shelf?.contents || []) {
          const parsed = parseMusicItemRenderer(it, type);
          if (parsed) items.push(parsed);
        }

        nextContinuation = extractContinuationToken(shelf?.continuations);
      }
    }
  } catch (err) {
    console.warn(`[Connection_music-bridge] fetchCategoryStep (${type}) falhou:`, err?.message || err);
  }

  return { items, continuation: nextContinuation };
}

// 2. Busca com paginação completa no YouTube Music (percorre toda a cadeia sem limite artificial)
export async function fetchCategory(query, type) {
  const allItems = [];
  const seenIds = new Set();
  const seenTokens = new Set();

  function addItem(item) {
    if (!item) return;
    const id = item.videoId || item.playlistId || item.browseId || item.id;
    if (!id || seenIds.has(id)) return;
    seenIds.add(id);
    allItems.push(item);
  }

  // 1. Na busca inicial, preserve os resultados e extraia continuation
  let step = await fetchCategoryStep(query, type, null);
  for (const it of step.items || []) addItem(it);

  // 2. Enquanto existir continuation, faça nova requisição ao endpoint InnerTube /search enviando o token
  // 5. Continue até o InnerTube não fornecer mais continuation.
  let currentToken = step.continuation;
  let emptyStepCount = 0;

  while (currentToken && !seenTokens.has(currentToken)) {
    seenTokens.add(currentToken);
    const nextStep = await fetchCategoryStep(query, type, currentToken);
    const stepItems = nextStep.items || [];

    if (stepItems.length > 0) {
      emptyStepCount = 0;
      for (const it of stepItems) addItem(it);
    } else {
      emptyStepCount += 1;
      if (emptyStepCount >= 3) break;
    }

    // 4. Extraia o próximo token em: musicShelfContinuation → continuations → nextContinuationData.continuation
    currentToken = nextStep.continuation;
  }

  // 6. Acumule os resultados preservando a ordem e eliminando duplicados pelo ID real do item.
  return allItems;
}

// 1.1 Passo individual de busca nativa do YouTube via InnerTube (youtubei/v1/search)
export async function fetchYouTubeInnerTubeStep(query, continuationToken = null) {
  if (!query || !query.trim()) return { items: [], continuation: null };
  const q = query.trim();
  const items = [];
  const seen = new Set();

  function addItem(item) {
    if (!item) return;
    const id = item.videoId || item.playlistId || item.id;
    if (!id || seen.has(id)) return;
    seen.add(id);
    items.push(item);
  }

  let nextContinuation = null;

  try {
    if (continuationToken) {
      const contRes = await fetch(
        `https://www.youtube.com/youtubei/v1/search?continuation=${encodeURIComponent(continuationToken)}&ctoken=${encodeURIComponent(continuationToken)}`,
        {
          method: 'POST',
          headers: YT_HEADERS,
          body: JSON.stringify({
            context: YT_WEB_CONTEXT,
            continuation: continuationToken,
          }),
        }
      );

      if (contRes.ok) {
        const contData = await contRes.json();
        const actions = contData.onResponseReceivedCommands || [];

        for (const act of actions) {
          const contItems = act.appendContinuationItemsAction?.continuationItems || [];
          for (const it of contItems) {
            if (it.videoRenderer) {
              const vr = it.videoRenderer;
              const videoId = vr.videoId;
              if (!videoId) continue;
              const title = vr.title?.runs?.map((x) => x.text).join('') || vr.title?.simpleText || '';
              const artist = vr.ownerText?.runs?.map((x) => x.text).join('') || vr.shortBylineText?.runs?.map((x) => x.text).join('') || 'YouTube';
              const durStr = vr.lengthText?.simpleText || vr.lengthText?.runs?.map((x) => x.text).join('') || '';
              const thumb = vr.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
              if (title) {
                addItem({
                  videoId,
                  title,
                  artist,
                  album: '',
                  durationStr: durStr,
                  thumbnail: thumb,
                  type: 'song',
                  source: 'YouTube',
                  channelTitle: artist,
                });
              }
            } else if (it.playlistRenderer) {
              const pr = it.playlistRenderer;
              const playlistId = pr.playlistId;
              if (!playlistId) continue;
              const title = pr.title?.simpleText || pr.title?.runs?.map((x) => x.text).join('') || '';
              const artist = pr.shortBylineText?.runs?.map((x) => x.text).join('') || 'Comunidade YouTube';
              const thumb = pr.thumbnails?.[0]?.thumbnails?.slice(-1)[0]?.url || '';
              if (title) {
                addItem({
                  playlistId,
                  title,
                  artist,
                  type: playlistId.startsWith('PL') ? 'community_playlist' : 'playlist',
                  source: 'YouTube',
                  thumbnail: thumb,
                });
              }
            } else if (it.continuationItemRenderer) {
              nextContinuation =
                it.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || null;
            }
          }
        }
      }
    } else {
      const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
        method: 'POST',
        headers: YT_HEADERS,
        body: JSON.stringify({
          context: YT_WEB_CONTEXT,
          query: q,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const twoCol = data.contents?.twoColumnSearchResultsRenderer;
        const sections = twoCol?.primaryContents?.sectionListRenderer?.contents || [];

        for (const sec of sections) {
          const itemSec = sec.itemSectionRenderer?.contents || [];
          for (const it of itemSec) {
            if (it.videoRenderer) {
              const vr = it.videoRenderer;
              const videoId = vr.videoId;
              if (!videoId) continue;
              const title = vr.title?.runs?.map((x) => x.text).join('') || vr.title?.simpleText || '';
              const artist = vr.ownerText?.runs?.map((x) => x.text).join('') || vr.shortBylineText?.runs?.map((x) => x.text).join('') || 'YouTube';
              const durStr = vr.lengthText?.simpleText || vr.lengthText?.runs?.map((x) => x.text).join('') || '';
              const thumb = vr.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
              if (title) {
                addItem({
                  videoId,
                  title,
                  artist,
                  album: '',
                  durationStr: durStr,
                  thumbnail: thumb,
                  type: 'song',
                  source: 'YouTube',
                  channelTitle: artist,
                });
              }
            } else if (it.playlistRenderer) {
              const pr = it.playlistRenderer;
              const playlistId = pr.playlistId;
              if (!playlistId) continue;
              const title = pr.title?.simpleText || pr.title?.runs?.map((x) => x.text).join('') || '';
              const artist = pr.shortBylineText?.runs?.map((x) => x.text).join('') || 'Comunidade YouTube';
              const thumb = pr.thumbnails?.[0]?.thumbnails?.slice(-1)[0]?.url || '';
              if (title) {
                addItem({
                  playlistId,
                  title,
                  artist,
                  type: playlistId.startsWith('PL') ? 'community_playlist' : 'playlist',
                  source: 'YouTube',
                  thumbnail: thumb,
                });
              }
            }
          }

          if (sec.continuationItemRenderer) {
            nextContinuation =
              sec.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || null;
          }
        }

        if (!nextContinuation) {
          const lastSec = sections[sections.length - 1];
          if (lastSec?.continuationItemRenderer) {
            nextContinuation =
              lastSec.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || null;
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Connection_music-bridge] fetchYouTubeInnerTubeStep falhou:', err?.message || err);
  }

  return { items, continuation: nextContinuation };
}

// 1.2 Busca nativa do YouTube via InnerTube com paginação completa (youtubei/v1/search)
export async function fetchYouTubeInnerTube(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim();
  const items = [];
  const seen = new Set();
  const seenTokens = new Set();

  function addItem(item) {
    if (!item) return;
    const id = item.videoId || item.playlistId || item.id;
    if (!id || seen.has(id)) return;
    seen.add(id);
    items.push(item);
  }

  let step = await fetchYouTubeInnerTubeStep(q, null);
  for (const it of step.items) addItem(it);

  let currentToken = step.continuation;
  while (currentToken && !seenTokens.has(currentToken)) {
    seenTokens.add(currentToken);
    const nextStep = await fetchYouTubeInnerTubeStep(q, currentToken);
    for (const it of nextStep.items) addItem(it);
    currentToken = nextStep.continuation;
  }

  // Fallback InnerTube via vídeos do YouTube Music (com continuation) se YouTube web estiver vazio
  if (items.length === 0) {
    try {
      const vids = await fetchCategory(q, 'videos');
      for (const v of vids) addItem(v);
    } catch {}
  }

  return items;
}

// 2. Busca do PACOTE ESTRUTURADO (Músicas, Artistas, Álbuns, Playlists, YouTube)
// Modo 'initial': entrega a 1ª página imediatamente e devolve os tokens de continuation para carregamento progressivo.
// Modo 'full': aguarda toda a cadeia de continuation ser percorrida.
export async function handleSearchBundle(query, mode = 'initial') {
  if (!query || !query.trim()) {
    return jsonResponse({
      ok: false,
      error: 'Termo de busca vazio',
      query: '',
      songs: [],
      artists: [],
      albums: [],
      playlists: [],
      youtube: [],
      continuations: {},
      internalRequestsCount: 0,
    }, 400);
  }

  const q = query.trim();

  if (mode === 'full') {
    // Executa as buscas completas percorrendo toda a cadeia de continuação
    const [songsRes, artistsRes, albumsRes, playlistsRes, ytRes] = await Promise.allSettled([
      fetchCategory(q, 'songs'),
      fetchCategory(q, 'artists'),
      fetchCategory(q, 'albums'),
      fetchCategory(q, 'playlists'),
      fetchYouTubeInnerTube(q),
    ]);

    const songs = songsRes.status === 'fulfilled' ? songsRes.value : [];
    const artists = artistsRes.status === 'fulfilled' ? artistsRes.value : [];
    const albums = albumsRes.status === 'fulfilled' ? albumsRes.value : [];
    const playlists = playlistsRes.status === 'fulfilled' ? playlistsRes.value : [];
    const youtube = ytRes.status === 'fulfilled' ? ytRes.value : [];

    return jsonResponse({
      ok: true,
      query: q,
      mode: 'full',
      internalRequestsCount: 5,
      songs,
      artists,
      albums,
      playlists,
      youtube,
      continuations: {},
    });
  }

  // Modelo progressivo / lazy loading: executa a 1ª página de cada categoria em paralelo
  // Entrega esses resultados imediatamente e preserva os tokens de continuation para as páginas seguintes
  const [songsStepRes, artistsStepRes, albumsStepRes, playlistsStepRes, ytStepRes] = await Promise.allSettled([
    fetchCategoryStep(q, 'songs', null),
    fetchCategoryStep(q, 'artists', null),
    fetchCategoryStep(q, 'albums', null),
    fetchCategoryStep(q, 'playlists', null),
    fetchYouTubeInnerTubeStep(q, null),
  ]);

  const songsStep = songsStepRes.status === 'fulfilled' ? songsStepRes.value : { items: [], continuation: null };
  const artistsStep = artistsStepRes.status === 'fulfilled' ? artistsStepRes.value : { items: [], continuation: null };
  const albumsStep = albumsStepRes.status === 'fulfilled' ? albumsStepRes.value : { items: [], continuation: null };
  const playlistsStep = playlistsStepRes.status === 'fulfilled' ? playlistsStepRes.value : { items: [], continuation: null };
  const ytStep = ytStepRes.status === 'fulfilled' ? ytStepRes.value : { items: [], continuation: null };

  return jsonResponse({
    ok: true,
    query: q,
    mode: 'initial',
    internalRequestsCount: 5,
    songs: songsStep.items,
    artists: artistsStep.items,
    albums: albumsStep.items,
    playlists: playlistsStep.items,
    youtube: ytStep.items,
    continuations: {
      songs: songsStep.continuation || '',
      artists: artistsStep.continuation || '',
      albums: albumsStep.continuation || '',
      playlists: playlistsStep.continuation || '',
      youtube: ytStep.continuation || '',
    },
  });
}

// 3. Browse estruturado de Álbum, Playlist ou Artista
export async function handleBrowse(browseId) {
  if (!browseId) {
    return jsonResponse({ ok: false, error: 'browseId é obrigatório' }, 400);
  }

  const res = await fetch('https://music.youtube.com/youtubei/v1/browse', {
    method: 'POST',
    headers: YT_HEADERS,
    body: JSON.stringify({
      context: YT_CONTEXT,
      browseId,
    }),
  });

  if (!res.ok) {
    return jsonResponse({ ok: false, error: `Browse falhou (${res.status})` }, res.status);
  }

  const data = await res.json();
  const twoCol = data.contents?.twoColumnBrowseResultsRenderer;

  // Se for Álbum ou Playlist (estrutura twoColumnBrowseResultsRenderer)
  if (twoCol) {
    const tab0 = twoCol.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0];
    const header = tab0?.musicResponsiveHeaderRenderer;
    const title = header?.title?.runs?.map((x) => x.text).join('') || 'Sem título';
    const subtitle = header?.subtitle?.runs?.map((x) => x.text).join('') || '';
    const thumbnail =
      header?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url || '';

    const trackShelf =
      twoCol.secondaryContents?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer ||
      twoCol.secondaryContents?.sectionListRenderer?.contents?.[0]?.musicShelfRenderer;

    const tracks = [];
    for (const t of trackShelf?.contents || []) {
      const item = t.musicResponsiveListItemRenderer;
      if (!item) continue;
      const tTitle =
        item.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
          ?.map((x) => x.text)
          .join('') || '';
      const tArtist =
        item.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
          ?.map((x) => x.text)
          .join('') || '';
      const tDur =
        item.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs
          ?.map((x) => x.text)
          .join('') || '';

      const tVideoId =
        item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
          ?.playNavigationEndpoint?.watchEndpoint?.videoId ||
        item.playlistItemData?.videoId;

      if (tVideoId && tTitle) {
        tracks.push({
          videoId: tVideoId,
          title: tTitle,
          artist: tArtist,
          durationStr: tDur,
          thumbnail: `https://i.ytimg.com/vi/${tVideoId}/hqdefault.jpg`,
        });
      }
    }

    return jsonResponse({
      ok: true,
      browseId,
      title,
      subtitle,
      thumbnail,
      tracksCount: tracks.length,
      tracks,
      internalRequestsCount: 1,
    });
  }

  // Se for Artista (estrutura singleColumnBrowseResultsRenderer)
  const singleCol = data.contents?.singleColumnBrowseResultsRenderer;
  if (singleCol) {
    const header =
      data.header?.musicImmersiveHeaderRenderer || data.header?.musicVisualHeaderRenderer;
    const artistName = header?.title?.runs?.map((x) => x.text).join('') || 'Artista';
    const description = header?.description?.runs?.map((x) => x.text).join('') || '';
    const thumbnail =
      header?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url || '';

    const sections = singleCol.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    const parsedSections = [];

    for (const s of sections) {
      const shelf = s.musicShelfRenderer || s.musicCarouselShelfRenderer;
      if (!shelf) continue;
      const sTitle =
        shelf.title?.runs?.map((x) => x.text).join('') ||
        shelf.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.map((x) => x.text).join('') ||
        '';

      const sItems = [];
      for (const it of shelf.contents || []) {
        const itemR = it.musicResponsiveListItemRenderer || it.musicTwoRowItemRenderer;
        if (!itemR) continue;
        const itTitle =
          itemR.title?.runs?.map((x) => x.text).join('') ||
          itemR.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map((x) => x.text).join('') ||
          '';
        const itSub =
          itemR.subtitle?.runs?.map((x) => x.text).join('') ||
          itemR.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map((x) => x.text).join('') ||
          '';
        const itVideoId =
          itemR.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
            ?.playNavigationEndpoint?.watchEndpoint?.videoId ||
          itemR.navigationEndpoint?.watchEndpoint?.videoId;
        const itBrowseId = itemR.navigationEndpoint?.browseEndpoint?.browseId;

        sItems.push({
          title: itTitle,
          subtitle: itSub,
          videoId: itVideoId || null,
          browseId: itBrowseId || null,
        });
      }

      if (sItems.length > 0) {
        parsedSections.push({ title: sTitle, items: sItems });
      }
    }

    return jsonResponse({
      ok: true,
      browseId,
      name: artistName,
      description,
      thumbnail,
      sections: parsedSections,
      internalRequestsCount: 1,
    });
  }

  return jsonResponse({ ok: true, browseId, raw: data, internalRequestsCount: 1 });
}

// 4. Continuidade estruturada: Rádio / Related / Next
export async function handleNextRadio(videoId) {
  if (!videoId) {
    return jsonResponse({ ok: false, error: 'videoId é obrigatório' }, 400);
  }

  const res = await fetch('https://music.youtube.com/youtubei/v1/next', {
    method: 'POST',
    headers: YT_HEADERS,
    body: JSON.stringify({
      context: YT_CONTEXT,
      videoId,
      playlistId: `RDAMVM${videoId}`, // Lista automática de rádio gerada pelo YouTube Music
    }),
  });

  if (!res.ok) {
    return jsonResponse({ ok: false, error: `Next/Radio falhou (${res.status})` }, res.status);
  }

  const data = await res.json();
  const playlistTracks =
    data.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer
      ?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer
      ?.content?.playlistPanelRenderer?.contents || [];

  const tracks = [];
  for (const it of playlistTracks) {
    const r = it.playlistPanelVideoRenderer;
    if (!r || !r.videoId) continue;
    const title = r.title?.runs?.map((x) => x.text).join('') || '';
    const byline = r.longBylineText?.runs?.map((x) => x.text).join('') || '';
    const dur = r.lengthText?.runs?.map((x) => x.text).join('') || '';
    tracks.push({
      videoId: r.videoId,
      title,
      artist: byline.split('•')[0]?.trim() || '',
      durationStr: dur,
      thumbnail: `https://i.ytimg.com/vi/${r.videoId}/hqdefault.jpg`,
    });
  }

  return jsonResponse({
    ok: true,
    videoId,
    radioTracksCount: tracks.length,
    tracks,
    internalRequestsCount: 1,
  });
}

// Handler de requisições HTTP (padrão Fetch / Cloudflare Worker / Node Express / Vite)
export async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    if (pathname.endsWith('/bundle')) {
      let query = url.searchParams.get('q') || url.searchParams.get('query');
      let mode = url.searchParams.get('mode') || (url.searchParams.get('all') === 'true' ? 'full' : 'initial');
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        query = body.query || body.q || query;
        if (body.mode) mode = body.mode;
        else if (body.all) mode = 'full';
      }
      return await handleSearchBundle(query, mode);
    }

    if (pathname.endsWith('/category') || pathname.endsWith('/search')) {
      let query = url.searchParams.get('q') || url.searchParams.get('query') || '';
      let type = url.searchParams.get('type') || url.searchParams.get('filter') || '';
      let continuation = url.searchParams.get('continuation') || url.searchParams.get('ctoken') || '';
      let stepOnly = url.searchParams.get('step') === 'true';

      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        query = body.query || body.q || query;
        type = body.type || body.filter || type;
        continuation = body.continuation || body.ctoken || continuation;
        if (body.step !== undefined) stepOnly = Boolean(body.step);
      }

      // Se token de continuação foi fornecido ou stepOnly foi solicitado
      if (continuation || stepOnly) {
        const effectiveType = type && CATEGORY_PARAMS[type] ? type : 'songs';
        const step = await fetchCategoryStep(query, effectiveType, continuation || null);
        return jsonResponse({
          ok: true,
          query,
          type: effectiveType,
          items: step.items,
          continuation: step.continuation || '',
          hasMore: Boolean(step.continuation),
          internalRequestsCount: 1,
        });
      }

      // Se nenhum tipo de categoria for especificado, executa o bundle completo
      if (!type || type === 'all' || type === 'bundle') {
        return await handleSearchBundle(query);
      }

      // Busca na categoria específica percorrendo toda a cadeia de continuação do InnerTube
      const effectiveType = CATEGORY_PARAMS[type] ? type : 'songs';
      const items = await fetchCategory(query, effectiveType);
      return jsonResponse({
        ok: true,
        query,
        type: effectiveType,
        items,
        continuation: '',
        hasMore: false,
      });
    }

    if (pathname.endsWith('/youtube')) {
      let query = url.searchParams.get('q') || url.searchParams.get('query');
      let continuation = url.searchParams.get('continuation') || url.searchParams.get('ctoken');
      let stepOnly = url.searchParams.get('step') === 'true';
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        query = body.query || body.q || query;
        continuation = body.continuation || body.ctoken || continuation;
        if (body.step !== undefined) stepOnly = Boolean(body.step);
      }
      if (continuation || stepOnly) {
        const step = await fetchYouTubeInnerTubeStep(query, continuation || null);
        return jsonResponse({
          ok: true,
          query,
          items: step.items,
          continuation: step.continuation || '',
          hasMore: Boolean(step.continuation),
          internalRequestsCount: 1,
        });
      }
      const items = await fetchYouTubeInnerTube(query);
      return jsonResponse({ ok: true, query, items, internalRequestsCount: 1 });
    }

    if (pathname.endsWith('/browse')) {
      let browseId = url.searchParams.get('browseId');
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        browseId = body.browseId || browseId;
      }
      return await handleBrowse(browseId);
    }

    if (pathname.endsWith('/radio') || pathname.endsWith('/next')) {
      let videoId = url.searchParams.get('videoId');
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        videoId = body.videoId || videoId;
      }
      return await handleNextRadio(videoId);
    }

    return jsonResponse({ ok: false, error: `Rota não encontrada: ${pathname}` }, 404);
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || String(err) }, 500);
  }
}

export default {
  fetch: handleRequest,
};
