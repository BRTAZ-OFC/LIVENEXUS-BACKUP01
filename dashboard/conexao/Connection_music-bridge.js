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
  artists: 'EgWKAQIgAWoSEAUQCRAKEAMQDhAEEBAQFRAR',
  albums: 'EgWKAQIYAWoSEAUQCRAKEAMQDhAEEBAQFRAR',
  playlists: 'EgeKAQQoAEABahIQBRAJEAoQAxAOEAQQEBAVEBE%3D',
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

// 1. Busca estruturada para UMA categoria específica no YouTube Music
async function fetchCategory(query, type) {
  const params = CATEGORY_PARAMS[type];
  if (!params) return [];

  const res = await fetch('https://music.youtube.com/youtubei/v1/search', {
    method: 'POST',
    headers: YT_HEADERS,
    body: JSON.stringify({
      context: YT_CONTEXT,
      query,
      params,
    }),
  });

  if (!res.ok) {
    throw new Error(`InnerTube search failed with status ${res.status}`);
  }

  const data = await res.json();
  const shelf =
    data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content
      ?.sectionListRenderer?.contents?.[0]?.musicShelfRenderer;

  const items = [];
  for (const it of shelf?.contents || []) {
    const r = it.musicResponsiveListItemRenderer;
    if (!r) continue;

    const flex0 = r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
    const flex1 = r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
    const flex2 = r.flexColumns?.[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];

    const title = flex0.map((x) => x.text).join('').trim();
    const line1 = flex1.map((x) => x.text).join('').trim();
    const line2 = flex2.map((x) => x.text).join('').trim();

    const videoId =
      r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
        ?.playNavigationEndpoint?.watchEndpoint?.videoId ||
      r.playlistItemData?.videoId;

    const browseId = r.navigationEndpoint?.browseEndpoint?.browseId;
    const thumb =
      r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
      (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

    if (type === 'songs') {
      if (!videoId) continue;
      const durMatch = `${line1} ${line2}`.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);
      items.push({
        type: 'song',
        videoId,
        title,
        artist: line1.split('•')[0]?.trim() || 'Artista',
        album: line1.includes('•') ? line1.split('•')[1]?.trim() : '',
        durationStr: durMatch ? durMatch[0] : '',
        thumbnail: thumb,
      });
    } else if (type === 'artists') {
      items.push({
        type: 'artist',
        browseId: browseId || '',
        name: title,
        subtitle: line1,
        thumbnail: thumb,
      });
    } else if (type === 'albums') {
      items.push({
        type: 'album',
        browseId: browseId || '',
        title,
        artist: line1.replace(/Álbum\s*•\s*/i, '').split('•')[0]?.trim() || '',
        year: (line1.match(/\b(19\d{2}|20\d{2})\b/) || [])[0] || '',
        thumbnail: thumb,
      });
    } else if (type === 'playlists') {
      const plId = browseId?.replace(/^VL/, '') || '';
      items.push({
        type: 'playlist',
        browseId: browseId || '',
        playlistId: plId,
        title,
        author: line1.split('•')[0]?.trim() || '',
        itemCountStr: line1.split('•')[1]?.trim() || '',
        thumbnail: thumb,
      });
    }
  }

  return items;
}

// 2. Busca do PACOTE COMPLETO estruturado (Músicas, Artistas, Álbuns, Playlists)
// Executa as consultas necessárias no InnerTube e retorna UM único pacote estruturado.
export async function handleSearchBundle(query) {
  if (!query || !query.trim()) {
    return jsonResponse({
      ok: false,
      error: 'Termo de busca vazio',
      query: '',
      songs: [],
      artists: [],
      albums: [],
      playlists: [],
      internalRequestsCount: 0,
    }, 400);
  }

  const q = query.trim();

  // Executa as 4 buscas categorizadas no InnerTube em lote
  const [songsRes, artistsRes, albumsRes, playlistsRes] = await Promise.allSettled([
    fetchCategory(q, 'songs'),
    fetchCategory(q, 'artists'),
    fetchCategory(q, 'albums'),
    fetchCategory(q, 'playlists'),
  ]);

  const songs = songsRes.status === 'fulfilled' ? songsRes.value : [];
  const artists = artistsRes.status === 'fulfilled' ? artistsRes.value : [];
  const albums = albumsRes.status === 'fulfilled' ? albumsRes.value : [];
  const playlists = playlistsRes.status === 'fulfilled' ? playlistsRes.value : [];

  return jsonResponse({
    ok: true,
    query: q,
    internalRequestsCount: 4, // 4 consultas estruturadas ao InnerTube para os 4 tipos nativos
    songs,
    artists,
    albums,
    playlists,
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
    if (pathname.endsWith('/bundle') || pathname.endsWith('/search')) {
      let query = url.searchParams.get('q') || url.searchParams.get('query');
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        query = body.query || body.q || query;
      }
      return await handleSearchBundle(query);
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
