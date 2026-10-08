// Busca no YouTube e YouTube Music via InnerTube API.
// Dados estruturados nativos obtidos via InnerTube (sem Jina, sem scraping).
const SEARCH_TIMEOUT = 12000;

// Re-exporta parseMusicUrl do MusicUrlManager (substitui parseYouTubeUrl)
export { parseMusicUrl as parseYouTubeUrl } from './Library_musicUrlManager.js';
export { parseMusicUrl } from './Library_musicUrlManager.js';

const inFlightSearches = new Map();

let activeSearchSessionId = 0;
const searchListeners = new Set();

export function subscribeSearchProgress(listener) {
  searchListeners.add(listener);
  return () => {
    searchListeners.delete(listener);
  };
}

export function notifySearchProgress(term, results) {
  for (const listener of searchListeners) {
    try {
      listener({ query: term, results });
    } catch (e) {
      console.warn('[musicSearch] progress listener error:', e);
    }
  }
}

function formatSearchItem(it) {
  if (!it) return null;
  const isVideo = it.source === 'YouTube' || it.type === 'video' || it._type === 'video';
  const duration = typeof it.duration === 'number' ? it.duration : parseDurationStr(it.durationStr);
  const thumb = it.thumbnail || (it.videoId ? `https://i.ytimg.com/vi/${it.videoId}/hqdefault.jpg` : '');

  if (it.type === 'artist') {
    return {
      title: it.name || it.title,
      artist: it.name || it.title,
      type: 'artist',
      browseId: it.browseId,
      thumbnail: thumb,
      source: 'YouTube Music',
    };
  }

  if (it.type === 'album') {
    return {
      title: it.title,
      artist: it.artist,
      type: 'album',
      browseId: it.browseId,
      thumbnail: thumb,
      source: 'YouTube Music',
    };
  }

  if (it.type === 'playlist' || it.type === 'community_playlist' || it.type === 'mix') {
    const isMix = it.type === 'mix' || it.playlistId?.startsWith('RD');
    const isCommunity = it.type === 'community_playlist' || it.playlistId?.startsWith('PL');
    return {
      title: it.title,
      artist: it.author || it.artist || 'YouTube Music',
      type: isMix ? 'mix' : isCommunity ? 'community_playlist' : 'playlist',
      playlistId: it.playlistId,
      browseId: it.browseId,
      thumbnail: thumb,
      source: 'YouTube Music',
    };
  }

  return {
    videoId: it.videoId,
    title: it.title,
    artist: it.artist || (isVideo ? 'YouTube' : 'YouTube Music'),
    album: it.album || '',
    durationStr: it.durationStr || '',
    duration,
    thumbnail: thumb,
    type: 'song',
    source: isVideo ? 'YouTube' : 'YouTube Music',
    channelTitle: it.artist || (isVideo ? 'YouTube' : 'YouTube Music'),
    _type: isVideo ? 'video' : 'song',
  };
}

async function fetchSearch(query, filter, continuation) {
  if (continuation) {
    if (filter === 'youtube') {
      try {
        const res = await fetch(`/api/ytmusic/youtube?continuation=${encodeURIComponent(continuation)}&q=${encodeURIComponent(query || '')}`, {
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          const items = (data.items || []).map((it) => ({
            ...it,
            source: 'YouTube',
            duration: parseDurationStr(it.durationStr),
          })).filter(Boolean);
          return { results: items, continuation: data.continuation || '' };
        }
      } catch (err) {
        console.warn('[musicSearch] fetchSearch youtube continuation falhou:', err?.message || err);
      }
      return { results: [], continuation: '' };
    }

    let type = 'songs';
    if (filter === 'artists') type = 'artists';
    else if (filter === 'albums') type = 'albums';
    else if (filter === 'playlists') type = 'playlists';

    try {
      const res = await fetch(`/api/ytmusic/search?continuation=${encodeURIComponent(continuation)}&type=${type}&q=${encodeURIComponent(query || '')}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          const items = (data.items || []).map((it) => formatSearchItem(it)).filter(Boolean);
          return { results: items, continuation: data.continuation || '' };
        }
      }
    } catch (err) {
      console.warn('[musicSearch] fetchSearch continuation falhou:', err?.message || err);
    }
    return { results: [], continuation: '' };
  }

  const normKey = (query || '').trim().toLowerCase();
  let searchPromise = inFlightSearches.get(normKey);
  if (!searchPromise) {
    searchPromise = fetchUnifiedSearch(query).finally(() => {
      inFlightSearches.delete(normKey);
    });
    inFlightSearches.set(normKey, searchPromise);
  }

  const allResults = await searchPromise;

  // Filtros dedicados
  let filtered = allResults;
  if (filter === 'artists') filtered = allResults.filter((t) => t && t.type === 'artist');
  else if (filter === 'albums') filtered = allResults.filter((t) => t && t.type === 'album');
  else if (filter === 'playlists') filtered = allResults.filter((t) => t && (t.type === 'playlist' || t.type === 'community_playlist' || t.type === 'mix' || t.playlistId));
  else if (filter === 'youtube') filtered = allResults.filter((t) => t && t.source === 'YouTube' && t.type !== 'community_playlist' && t.type !== 'playlist');

  return { results: filtered, continuation: '' };
}

// Consultas únicas mantidas para compatibilidade
export function getUnifiedSearchQueries(term) {
  const trimmed = (term || '').trim();
  if (!trimmed) return [];
  return [trimmed];
}

// Chave unívoca de identificação real para deduplicação sem perda de entidades
function getItemEntityKey(item) {
  if (!item) return null;
  if (item.videoId) return `song:${item.videoId}`;
  if (item.browseId) {
    if (item.type === 'artist' || item.browseId.startsWith('UC')) return `artist:${item.browseId}`;
    if (item.type === 'album' || item.browseId.startsWith('MP')) return `album:${item.browseId}`;
    return `browse:${item.browseId}`;
  }
  if (item.playlistId) {
    if (item.type === 'mix' || item.playlistId.startsWith('RD')) return `mix:${item.playlistId}`;
    if (item.type === 'community_playlist' || item.playlistId.startsWith('PL')) return `community_playlist:${item.playlistId}`;
    return `playlist:${item.playlistId}`;
  }
  if (item.id) return `${item.type || 'entity'}:${item.id}`;
  const title = (item.title || '').toLowerCase().trim();
  const artist = (item.artist || '').toLowerCase().trim();
  return title ? `meta:${title}|${artist}` : null;
}

// Mescla metadados úteis quando o mesmo ID for encontrado por mais de uma consulta
function mergeItemMetadata(existing, incoming) {
  if (!existing) return incoming;
  if (!incoming) return existing;

  const merged = { ...existing };
  const isGeneric = (s) => typeof s === 'string' && /^(Música|Faixa|Artista|Álbum|Playlist)\s+[a-zA-Z0-9_-]+$/i.test(s);

  for (const [key, val] of Object.entries(incoming)) {
    if (val === undefined || val === null || val === '') continue;

    const currentVal = merged[key];
    if (currentVal === undefined || currentVal === null || currentVal === '') {
      merged[key] = val;
    } else if (typeof val === 'string' && typeof currentVal === 'string') {
      if (isGeneric(currentVal) && !isGeneric(val)) {
        merged[key] = val;
      } else if (val.length > currentVal.length && !isGeneric(val) && currentVal.length < 3) {
        merged[key] = val;
      }
    } else if (typeof val === 'number' && val > 0 && (!currentVal || currentVal === 0)) {
      merged[key] = val;
    }
  }

  // Refinamento de classificação
  if (merged.playlistId) {
    if (merged.playlistId.startsWith('RD')) merged.type = 'mix';
    else if (merged.playlistId.startsWith('PL')) merged.type = 'community_playlist';
    else if (incoming.type === 'community_playlist' || existing.type === 'community_playlist') {
      merged.type = 'community_playlist';
    }
  }

  return merged;
}

// Carregamento progressivo em segundo plano das páginas de continuação do InnerTube
async function runProgressiveContinuations(term, globalMap, continuations, sessionId) {
  const categories = Object.keys(continuations || {});

  for (const cat of categories) {
    let token = continuations[cat];
    const seenTokens = new Set();
    let emptyCount = 0;

    while (token && !seenTokens.has(token)) {
      if (sessionId !== activeSearchSessionId) {
        // Nova busca iniciada, encerra o ciclo da busca anterior
        return;
      }
      seenTokens.add(token);

      try {
        const url = cat === 'youtube'
          ? `/api/ytmusic/youtube?continuation=${encodeURIComponent(token)}&q=${encodeURIComponent(term)}`
          : `/api/ytmusic/search?continuation=${encodeURIComponent(token)}&type=${cat}&q=${encodeURIComponent(term)}`;

        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) break;

        const data = await res.json();
        const items = data.items || [];

        if (items.length > 0) {
          emptyCount = 0;
          for (const raw of items) {
            const formatted = formatSearchItem(raw);
            if (!formatted) continue;
            const key = getItemEntityKey(formatted);
            if (!key) continue;
            if (globalMap.has(key)) {
              globalMap.set(key, mergeItemMetadata(globalMap.get(key), formatted));
            } else {
              globalMap.set(key, formatted);
            }
          }

          // Notifica os ouvintes da interface para acréscimo progressivo
          const accumulated = Array.from(globalMap.values());
          notifySearchProgress(term, accumulated);
        } else {
          emptyCount += 1;
          if (emptyCount >= 3) break;
        }

        token = data.continuation || null;
      } catch (err) {
        console.warn(`[musicSearch] erro na continuação progressiva (${cat}):`, err?.message || err);
        break;
      }
    }
  }
}

// Execução unificada de busca via InnerTube (sem Jina)
async function fetchUnifiedSearch(term) {
  const trimmed = (term || '').trim();
  if (!trimmed) return [];

  const currentSessionId = ++activeSearchSessionId;

  try {
    const res = await fetch(`/api/ytmusic/bundle?q=${encodeURIComponent(trimmed)}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ok) {
        const songs = (data.songs || []).map((s) => ({
          videoId: s.videoId,
          title: s.title,
          artist: s.artist || 'YouTube Music',
          album: s.album || '',
          durationStr: s.durationStr || '',
          duration: parseDurationStr(s.durationStr),
          thumbnail: s.thumbnail || (s.videoId ? `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg` : ''),
          type: 'song',
          source: 'YouTube Music',
          channelTitle: s.artist || 'YouTube Music',
          _type: 'song',
        }));

        const artists = (data.artists || []).map((a) => ({
          title: a.name || a.title,
          artist: a.name || a.title,
          type: 'artist',
          browseId: a.browseId,
          thumbnail: a.thumbnail,
          source: 'YouTube Music',
        }));

        const albums = (data.albums || []).map((al) => ({
          title: al.title,
          artist: al.artist,
          type: 'album',
          browseId: al.browseId,
          thumbnail: al.thumbnail,
          source: 'YouTube Music',
        }));

        const playlists = (data.playlists || []).map((p) => {
          const isMix = p.playlistId?.startsWith('RD');
          const isCommunity = p.playlistId?.startsWith('PL');
          return {
            title: p.title,
            artist: p.author || 'YouTube Music',
            type: isMix ? 'mix' : isCommunity ? 'community_playlist' : 'playlist',
            playlistId: p.playlistId,
            browseId: p.browseId,
            thumbnail: p.thumbnail,
            source: 'YouTube Music',
          };
        });

        const ytVideos = (data.youtube || []).map((y) => ({
          videoId: y.videoId,
          title: y.title,
          artist: y.artist || 'YouTube',
          album: '',
          durationStr: y.durationStr || '',
          duration: parseDurationStr(y.durationStr),
          thumbnail: y.thumbnail || (y.videoId ? `https://i.ytimg.com/vi/${y.videoId}/hqdefault.jpg` : ''),
          type: y.type || 'song',
          source: 'YouTube',
          channelTitle: y.artist,
          _type: 'video',
        }));

        const all = [...songs, ...artists, ...albums, ...playlists, ...ytVideos];

        const globalMap = new Map();
        for (const item of all) {
          const key = getItemEntityKey(item);
          if (!key) continue;
          if (globalMap.has(key)) {
            globalMap.set(key, mergeItemMetadata(globalMap.get(key), item));
          } else {
            globalMap.set(key, item);
          }
        }

        const initialResults = Array.from(globalMap.values());

        // Inicia carregamento progressivo em segundo plano se houver tokens de continuação
        if (data.continuations && Object.keys(data.continuations).length > 0) {
          runProgressiveContinuations(trimmed, globalMap, data.continuations, currentSessionId);
        }

        return initialResults;
      }
    }
  } catch (err) {
    console.warn('[musicSearch] InnerTube fetchUnifiedSearch falhou:', err?.message || err);
  }

  return [];
}

// Busca músicas (aba "Músicas") — Songs + Videos tocáveis (com videoId).
export async function searchMusic(query, _apiKey, opts = {}) {
  if (!query || !query.trim()) return { items: [], continuation: '' };
  const { results, continuation } = await fetchSearch(query, '');
  const songs = results.filter((t) => t && t.videoId);
  const items = typeof opts.maxResults === 'number' && opts.maxResults > 0 ? songs.slice(0, opts.maxResults) : songs;
  return { items, continuation };
}

// Busca artistas (aba "Artistas") — filter 'artists'.
export async function searchArtists(query, opts = {}) {
  if (!query || !query.trim()) return { items: [], continuation: '' };
  const { results, continuation } = await fetchSearch(query, 'artists');
  const artists = results.filter((t) => t && t.type === 'artist');
  const items = typeof opts.maxResults === 'number' && opts.maxResults > 0 ? artists.slice(0, opts.maxResults) : artists;
  return { items, continuation };
}

// Busca álbuns (aba "Álbuns") — álbuns oficiais, singles, EPs. Filter 'albums'.
export async function searchAlbums(query, opts = {}) {
  if (!query || !query.trim()) return { items: [], continuation: '' };
  const { results, continuation } = await fetchSearch(query, 'albums');
  const albums = results.filter((t) => t && t.type === 'album');
  const items = typeof opts.maxResults === 'number' && opts.maxResults > 0 ? albums.slice(0, opts.maxResults) : albums;
  return { items, continuation };
}

// Busca playlists (aba "Playlists") — oficiais e da comunidade. Filter 'playlists'.
export async function searchPlaylists(query, _apiKey, opts = {}) {
  if (!query || !query.trim()) return { items: [], continuation: '' };
  const { results, continuation } = await fetchSearch(query, 'playlists');
  const playlists = results.filter((t) => t && (t.type === 'playlist' || t.type === 'community_playlist' || t.playlistId));
  const items = typeof opts.maxResults === 'number' && opts.maxResults > 0 ? playlists.slice(0, opts.maxResults) : playlists;
  return { items, continuation };
}

// Busca mixes (aba "Mixes") — recomendações/radio.
export async function searchMixes(query, opts = {}) {
  if (!query || !query.trim()) return { items: [], continuation: '' };
  const { results, continuation } = await fetchSearch(query, '');
  const mixes = results.filter((t) => t && t.type === 'mix');
  const items = typeof opts.maxResults === 'number' && opts.maxResults > 0 ? mixes.slice(0, opts.maxResults) : mixes;
  return { items, continuation };
}

// Busca mista — retorna TODOS os tipos encontrados na união.
export async function searchAll(query, opts = {}) {
  if (!query || !query.trim()) return { items: [], continuation: '' };
  const { results, continuation } = await fetchSearch(query, '');
  const items = typeof opts.maxResults === 'number' && opts.maxResults > 0 ? results.slice(0, opts.maxResults) : results;
  return { items, continuation };
}

// Paginação via continuation — mantida para compatibilidade
export async function searchMore(query, filter, continuation, opts = {}) {
  if (!query || !continuation) return { items: [], continuation: '' };
  const { results, continuation: nextContinuation } = await fetchSearch(query, filter, continuation);
  const items = typeof opts.maxResults === 'number' && opts.maxResults > 0 ? results.slice(0, opts.maxResults) : results;
  return { items, continuation: nextContinuation };
}

// ==========================================
// RESOLUÇÃO DE PLAYLISTS E ÁLBUNS VIA INNERTUBE (WEB_REMIX)
// ==========================================

export async function fetchPlaylistViaInnerTube(playlistId) {
  if (!playlistId) throw new Error('playlistId ausente');
  const cleanId = String(playlistId).replace(/^[?&]list=/, '').trim();
  const browseId = cleanId.startsWith('VL') ? cleanId : `VL${cleanId}`;
  const url = `/api/ytmusic/browse?browseId=${encodeURIComponent(browseId)}`;
  
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) {
    throw new Error(`InnerTube HTTP ${res.status}: ${res.statusText}`);
  }
  const json = await res.json();
  if (json.ok === false) {
    throw new Error(json.error || 'Falha na resposta do InnerTube');
  }

  let tracks = json.tracks || [];
  let title = json.title || `Playlist (${cleanId})`;
  let subtitle = json.subtitle || json.author || 'YouTube Music';
  let thumbnail = json.thumbnail || '';

  if (tracks.length === 0 && json.raw) {
    const raw = json.raw;
    const twoCol = raw.contents?.twoColumnBrowseResultsRenderer;
    const singleCol = raw.contents?.singleColumnBrowseResultsRenderer;

    const header = raw.header?.musicResponsiveHeaderRenderer || 
      raw.header?.musicDetailHeaderRenderer ||
      twoCol?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicResponsiveHeaderRenderer;
    
    if (header?.title?.runs?.[0]?.text) {
      title = header.title.runs.map(r => r.text).join('');
    }
    if (header?.subtitle?.runs?.[0]?.text) {
      subtitle = header.subtitle.runs.map(r => r.text).join('');
    }
    if (header?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url) {
      thumbnail = header.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails.slice(-1)[0].url;
    }

    const shelf = twoCol?.secondaryContents?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer ||
      twoCol?.secondaryContents?.sectionListRenderer?.contents?.[0]?.musicShelfRenderer ||
      twoCol?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer ||
      singleCol?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer;

    for (const item of shelf?.contents || []) {
      const r = item.musicResponsiveListItemRenderer;
      if (!r) continue;

      const flex0 = r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
      const flex1 = r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
      const flex2 = r.flexColumns?.[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
      const fixed0 = r.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs || [];

      const tTitle = flex0.map(x => x.text).join('').trim();
      const tArtist = flex1[0]?.text?.trim() || flex1.map(x => x.text).join('').trim() || 'Artista';
      const tAlbum = flex2.map(x => x.text).join('').trim() || (flex1.length > 2 ? flex1[2]?.text?.trim() : '');
      const tBrowseId = flex1[0]?.navigationEndpoint?.browseEndpoint?.browseId || flex2[0]?.navigationEndpoint?.browseEndpoint?.browseId || '';
      const tDur = fixed0.map(x => x.text).join('').trim();

      const tVideoId = r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
        r.playlistItemData?.videoId ||
        r.navigationEndpoint?.watchEndpoint?.videoId;

      if (tTitle && tVideoId) {
        tracks.push({
          id: tVideoId,
          videoId: tVideoId,
          title: tTitle,
          artist: tArtist,
          album: tAlbum,
          browseId: tBrowseId,
          durationStr: tDur,
          duration: parseDurationStr(tDur),
          thumbnail: `https://i.ytimg.com/vi/${tVideoId}/hqdefault.jpg`,
          source: 'YouTube Music',
          type: 'song',
          channelTitle: tArtist,
          _type: 'song',
        });
      }
    }
  }

  const cleanTracks = tracks.map((t, idx) => ({
    id: t.videoId || `track_${idx}`,
    videoId: t.videoId,
    title: t.title,
    artist: t.artist || subtitle || 'YouTube Music',
    album: t.album || '',
    browseId: t.browseId || '',
    durationStr: t.durationStr || '',
    duration: typeof t.duration === 'number' ? t.duration : parseDurationStr(t.durationStr),
    thumbnail: t.thumbnail || (t.videoId ? `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg` : thumbnail),
    source: t.source || 'YouTube Music',
    type: 'song',
    channelTitle: t.artist || subtitle || 'YouTube Music',
    _type: 'song',
  }));

  return {
    playlistId: cleanId.replace(/^VL/, ''),
    browseId,
    title,
    author: subtitle,
    thumbnail: thumbnail || cleanTracks[0]?.thumbnail || '',
    tracksCount: cleanTracks.length,
    tracks: cleanTracks,
  };
}

// Resolução de faixas de PLAYLISTS via InnerTube (VL + playlistId -> youtubei/v1/browse)
export async function getPlaylistItems(playlistId, _apiKey) {
  if (!playlistId) return [];
  try {
    const res = await fetchPlaylistViaInnerTube(playlistId);
    if (res.tracks && res.tracks.length > 0) {
      return res.tracks;
    }
  } catch (err) {
    console.warn('[musicSearch] InnerTube getPlaylistItems falhou:', err?.message || err);
  }
  return [];
}

// Resolução de faixas de ÁLBUNS via InnerTube (sem Jina)
export async function getAlbumItems(albumId) {
  if (!albumId) return [];
  const cleanId = String(albumId).trim();
  try {
    const browseId = cleanId.startsWith('VL') ? cleanId : (cleanId.startsWith('OLAK') ? `VL${cleanId}` : cleanId);
    const url = `/api/ytmusic/browse?browseId=${encodeURIComponent(browseId)}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      if (json.tracks && json.tracks.length > 0) {
        return json.tracks.map((t, idx) => ({
          id: t.videoId || `track_${idx}`,
          videoId: t.videoId,
          title: t.title,
          artist: t.artist || json.subtitle || 'YouTube Music',
          album: t.album || json.title || '',
          durationStr: t.durationStr || '',
          duration: typeof t.duration === 'number' ? t.duration : parseDurationStr(t.durationStr),
          thumbnail: t.thumbnail || (t.videoId ? `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg` : json.thumbnail || ''),
          source: 'YouTube Music',
          type: 'song',
          channelTitle: t.artist || json.subtitle || 'YouTube Music',
          _type: 'song',
        }));
      }
    }
  } catch (err) {
    console.warn('[musicSearch] InnerTube getAlbumItems falhou:', err?.message || err);
  }

  // Se for OLAK ou playlist de álbum, tenta via fetchPlaylistViaInnerTube
  if (cleanId.startsWith('OLAK') || cleanId.startsWith('VLOLAK')) {
    try {
      const plRes = await fetchPlaylistViaInnerTube(cleanId);
      if (plRes.tracks && plRes.tracks.length > 0) {
        return plRes.tracks;
      }
    } catch {}
  }

  return [];
}

// Versão completa de álbum
export async function getAlbumItemsFull(albumId) {
  if (!albumId) return { tracks: [], album: null, unavailableTracks: 0 };
  const tracks = await getAlbumItems(albumId);
  return { tracks, album: null, unavailableTracks: 0 };
}

// Resolução de faixas de MIX RD (radio/curated) via InnerTube (sem Jina)
export async function getMixItems(mixId) {
  if (!mixId) return [];
  try {
    const res = await fetchPlaylistViaInnerTube(mixId);
    if (res.tracks && res.tracks.length > 0) {
      return res.tracks;
    }
  } catch (err) {
    console.warn('[musicSearch] InnerTube getMixItems falhou:', err?.message || err);
  }

  // Tenta rádio se tiver videoId no RDAMVM
  const clean = String(mixId).replace(/^RDAMVM/, '').replace(/^RD/, '');
  if (clean.length === 11) {
    try {
      const res = await fetch(`/api/ytmusic/radio?videoId=${encodeURIComponent(clean)}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.tracks && json.tracks.length > 0) {
          return json.tracks.map((t, idx) => ({
            id: t.videoId || `mix_${idx}`,
            videoId: t.videoId,
            title: t.title,
            artist: t.artist || 'YouTube Music',
            album: '',
            durationStr: t.durationStr || '',
            duration: parseDurationStr(t.durationStr),
            thumbnail: t.thumbnail || `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg`,
            source: 'YouTube Music',
            type: 'song',
            channelTitle: t.artist || 'YouTube Music',
            _type: 'song',
          }));
        }
      }
    } catch {}
  }

  return [];
}

// Versão paginada do mix — via InnerTube
export async function getMixItemsPaginated(mixId, continuation) {
  if (!mixId && !continuation) return { tracks: [], continuation: '', count: 0 };
  const tracks = await getMixItems(mixId);
  return { tracks, continuation: '', count: tracks.length };
}

// Versão paginada da playlist — via InnerTube
export async function getPlaylistItemsPaginated(playlistId, continuation) {
  if (!playlistId && !continuation) return { tracks: [], continuation: '', count: 0 };
  const tracks = await getPlaylistItems(playlistId);
  return { tracks, continuation: '', count: tracks.length };
}

// Busca relacionados via InnerTube (rádio ou busca direta)
export async function getRelatedTracks(track, _apiKey, maxResults = 10) {
  if (track?.videoId) {
    try {
      const res = await fetch(`/api/ytmusic/radio?videoId=${encodeURIComponent(track.videoId)}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.tracks && json.tracks.length > 0) {
          return json.tracks.slice(0, maxResults).map((t, idx) => ({
            id: t.videoId || `rel_${idx}`,
            videoId: t.videoId,
            title: t.title,
            artist: t.artist || 'YouTube Music',
            album: '',
            durationStr: t.durationStr || '',
            duration: parseDurationStr(t.durationStr),
            thumbnail: t.thumbnail || `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg`,
            source: 'YouTube Music',
            type: 'song',
            channelTitle: t.artist || 'YouTube Music',
          }));
        }
      }
    } catch {}
  }

  const query = track?.artist ? `${track.artist} topic` : (track?.title ? `${track.title} official audio` : null);
  if (!query) return [];
  const { items } = await searchMusic(query, null, { maxResults });
  return items;
}

// Obtém info de um vídeo via oEmbed.
export async function getVideoInfo(videoId) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      const { artist, song } = parseTitle(data.title, data.author_name);
      return {
        videoId,
        title: song,
        artist,
        album: '',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: 0,
        durationStr: '',
        type: 'song',
        source: 'YouTube Music',
        channelTitle: data.author_name || '',
      };
    }
  } catch { /* fallback abaixo */ }
  return {
    videoId,
    title: 'Música carregada',
    artist: 'YouTube Music',
    album: '',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: 0,
    durationStr: '',
    type: 'song',
    source: 'YouTube Music',
    channelTitle: '',
  };
}

// Busca no YouTube via InnerTube (sem Jina)
export async function searchYouTube(query, opts = {}) {
  if (!query || !query.trim()) return { items: [], continuation: '' };
  const { results, continuation } = await fetchSearch(query, 'youtube');
  const items = typeof opts.maxResults === 'number' && opts.maxResults > 0 ? results.slice(0, opts.maxResults) : results;
  return { items, continuation };
}

// --- Helpers ---

function parseTitle(title, channelTitle) {
  if (!title) return { artist: channelTitle || 'Artista desconhecido', song: 'Título desconhecido' };
  const parts = title.split(' - ');
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), song: parts.slice(1).join(' - ').trim() };
  }
  return { artist: channelTitle || 'Artista desconhecido', song: title };
}

function parseDurationStr(str) {
  if (!str) return 0;
  const parts = str.split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}
