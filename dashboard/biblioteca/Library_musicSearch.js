// Busca no YouTube Music — MODO ZERO CREDITS.
// Todas as buscas usam r.jina.ai (proxy de leitura gratuito, direto do frontend).
// NENHUMA chamada a base44.functions.invoke — zero Integration Credits por busca.
// As backend functions YoutubeMusicSearch/Album/Playlist/Mix permanecem no código
// mas NÃO são chamadas pelo frontend em modo zero-credit.
// NUNCA converte para youtube.com — preserva music.youtube.com sempre.

const SEARCH_TIMEOUT = 12000;

// Re-exporta parseMusicUrl do MusicUrlManager (substitui parseYouTubeUrl)
export { parseMusicUrl as parseYouTubeUrl } from './Library_musicUrlManager';
export { parseMusicUrl } from './Library_musicUrlManager';

// Cache em memória (LRU simples) — evita re-fetch do mesmo termo/filtro/continuation.
const searchCache = new Map();
const inFlightSearches = new Map();
const CACHE_MAX = 50;

function cacheKey(query, filter, continuation) {
  const normQuery = (query || '').trim().toLowerCase();
  return `${normQuery}::${filter || ''}::${continuation || ''}`;
}

function getCached(key) {
  return searchCache.get(key) || null;
}

function setCached(key, val) {
  if (searchCache.size >= CACHE_MAX) {
    const first = searchCache.keys().next().value;
    if (first) searchCache.delete(first);
  }
  searchCache.set(key, val);
}

// ZERO CREDITS: r.jina.ai é a rota de busca — direto do frontend, sem backend.
// Paginação (continuation) não é suportada pelo r.jina.ai — retorna vazio em modo zero-credit.
async function fetchSearch(query, filter, continuation) {
  const key = cacheKey(query, filter, continuation);
  const cached = getCached(key);
  if (cached) return cached;

  // Paginação indisponível em modo zero-credit (r.jina.ai não suporta continuation)
  if (continuation) return { results: [], continuation: '' };

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

  const result = { results: filtered, continuation: '' };
  setCached(key, result);
  return result;
}

// ==========================================
// CONSULTAS ÚNICAS VALIDADAS EM A + B + D + E
// ==========================================
export function getUnifiedSearchQueries(term) {
  const trimmed = (term || '').trim();
  if (!trimmed) return [];

  // 1. Teste A:
  //    - term
  //    - `${term} playlist`
  // 2. Teste B:
  //    - `${term} playlist` (duplicada com A)
  //    - `playlist ${term}`
  //    - `${term} melhores musicas playlist`
  //    - `${term} discografia playlist`
  //    - `${term} ao vivo playlist`
  // 3. Teste D:
  //    - Variações de B sobre base A (sem novas queries adicionais)
  // 4. Teste E:
  //    - Base A (term, term playlist)
  //    - `${term} album discografia`
  //    - `${term} artist channel`
  //    - `${term} community playlist`
  //
  // Total de consultas únicas deduplicadas = 9
  const rawQueries = [
    trimmed,
    `${trimmed} playlist`,
    `playlist ${trimmed}`,
    `${trimmed} melhores musicas playlist`,
    `${trimmed} discografia playlist`,
    `${trimmed} ao vivo playlist`,
    `${trimmed} album discografia`,
    `${trimmed} artist channel`,
    `${trimmed} community playlist`,
  ];

  return [...new Set(rawQueries)];
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

// Execução unificada de A + B + D + E em paralelo via Jina Proxy
async function fetchUnifiedSearch(term) {
  const queries = getUnifiedSearchQueries(term);
  if (queries.length === 0) return [];

  const queryPromises = queries.map(async (q) => {
    try {
      const text = await fetchViaJina(`https://music.youtube.com/search?q=${encodeURIComponent(q)}`);
      return parseSearchMarkdown(text);
    } catch (err) {
      console.warn(`[musicSearch] Consulta '${q}' falhou:`, err?.message || err);
      return [];
    }
  });

  const resultsArrays = await Promise.all(queryPromises);

  // Deduplicação por ID real com preservação de todas as entidades únicas encontradas
  const globalMap = new Map();

  for (const items of resultsArrays) {
    for (const item of items) {
      if (!item) continue;
      const key = getItemEntityKey(item);
      if (!key) continue;

      if (globalMap.has(key)) {
        const existing = globalMap.get(key);
        globalMap.set(key, mergeItemMetadata(existing, item));
      } else {
        globalMap.set(key, item);
      }
    }
  }

  return Array.from(globalMap.values());
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
// PARSER REPARADO DE PLAYLISTS E ÁLBUNS
// ==========================================
export async function getPlaylistItems(playlistId, _apiKey) {
  if (!playlistId) return [];
  try {
    const text = await fetchViaJina(`https://music.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`);
    return parseTracksFromMarkdown(text);
  } catch (err) {
    console.warn('[musicSearch] getPlaylistItems (jina) falhou:', err?.message || err);
    return [];
  }
}

// Resolução de faixas de ÁLBUNS (MPRE/MPSP) via r.jina.ai (ZERO CREDITS).
export async function getAlbumItems(albumId) {
  if (!albumId) return [];
  try {
    const text = await fetchViaJina(`https://music.youtube.com/browse/${encodeURIComponent(albumId)}`);
    return parseTracksFromMarkdown(text);
  } catch (err) {
    console.warn('[musicSearch] getAlbumItems (jina) falhou:', err?.message || err);
    return [];
  }
}

// Versão completa — via r.jina.ai (ZERO CREDITS).
export async function getAlbumItemsFull(albumId) {
  if (!albumId) return { tracks: [], album: null, unavailableTracks: 0 };
  try {
    const text = await fetchViaJina(`https://music.youtube.com/browse/${encodeURIComponent(albumId)}`);
    const tracks = parseTracksFromMarkdown(text);
    return { tracks, album: null, unavailableTracks: 0 };
  } catch (err) {
    console.warn('[musicSearch] getAlbumItemsFull (jina) falhou:', err?.message || err);
    return { tracks: [], album: null, unavailableTracks: 0 };
  }
}

// Resolução de faixas de MIX RD (radio/curated) via r.jina.ai (ZERO CREDITS).
export async function getMixItems(mixId) {
  if (!mixId) return [];
  try {
    const text = await fetchViaJina(`https://music.youtube.com/playlist?list=${encodeURIComponent(mixId)}`);
    return parseTracksFromMarkdown(text);
  } catch (err) {
    console.warn('[musicSearch] getMixItems (jina) falhou:', err?.message || err);
    return [];
  }
}

// Versão paginada do mix — via r.jina.ai (ZERO CREDITS).
export async function getMixItemsPaginated(mixId, continuation) {
  if (!mixId && !continuation) return { tracks: [], continuation: '', count: 0 };
  if (continuation) return { tracks: [], continuation: '', count: 0 };
  const tracks = await getMixItems(mixId);
  return { tracks, continuation: '', count: tracks.length };
}

// Versão paginada — via r.jina.ai (ZERO CREDITS).
export async function getPlaylistItemsPaginated(playlistId, continuation) {
  if (!playlistId && !continuation) return { tracks: [], continuation: '', count: 0 };
  if (continuation) return { tracks: [], continuation: '', count: 0 };
  const tracks = await getPlaylistItems(playlistId);
  return { tracks, continuation: '', count: tracks.length };
}

// Busca relacionados (recomendações por artista)
export async function getRelatedTracks(track, _apiKey, maxResults = 10) {
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

// --- Requisições via r.jina.ai ---
const JINA_BASE = 'https://r.jina.ai/';
const TIMEOUT_MS = 14000;

async function fetchViaJina(targetUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${JINA_BASE}${targetUrl}`, {
      signal: controller.signal,
      headers: { 'Accept': 'text/plain', 'X-Timeout': '12' },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Serviço indisponível (HTTP ${res.status}).`);
    const text = await res.text();
    if (!text || text.length < 50) throw new Error('Resposta vazia do serviço.');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// Parser de faixas reparado e resiliente (compatível com Markdown Links + Estrutura Tabular do Jina)
function parseTracksFromMarkdown(text) {
  if (!text || typeof text !== 'string') return [];
  const tracks = [];
  const seen = new Set();
  const lines = text.split('\n');

  function findTitleNearby(idx) {
    for (let j = idx + 1; j < Math.min(lines.length, idx + 6); j++) {
      const l = lines[j].trim();
      if (!l) continue;
      if (/^!\[/.test(l)) continue;
      if (/^\[.*\]\(https?:\/\//.test(l)) continue;
      if (/^(Song|Video|Playlist|Album|Artist|•)/i.test(l)) continue;
      if (/^\d{1,2}:\d{2}/.test(l)) continue;
      if (l.length > 1 && l.length < 150) return l;
    }
    return '';
  }

  // 1. Passagem Principal: Links Markdown tolerantes (music.youtube, www.youtube ou relativo /watch?v=)
  const linkRe = /\[([^\]]*)\]\((?:https?:\/\/(?:music\.|www\.)?youtube\.com)?\/watch\?v=([a-zA-Z0-9_-]{11})(?:[^\)]*)\)/;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(linkRe);
    if (!m) continue;
    let title = m[1].trim();
    const videoId = m[2];
    if (seen.has(videoId)) continue;

    // Se o texto do link for vazio ou imagem markdown, buscar título na linha mais próxima
    if (!title || title.startsWith('![') || title.startsWith('#')) {
      title = findTitleNearby(i);
    }

    // Coletar linhas de metadados próximas
    const meta = [];
    for (let j = i + 1; j < Math.min(i + 8, lines.length) && meta.length < 6; j++) {
      const l = lines[j].trim();
      if (l) meta.push(l);
    }

    let artist = '';
    let album = '';
    let durationStr = '';
    let isSong = true;

    const songLine = meta.find((l) => l.startsWith('Song'));
    const videoLine = meta.find((l) => l.startsWith('Video'));

    if (songLine || videoLine) {
      isSong = !!songLine;
      const line = songLine || videoLine;
      const artistMatch = line.match(/\[([^\]]+)\]\((?:https?:\/\/(?:music\.|www\.)?youtube\.com)?\/channel\//);
      if (artistMatch) artist = artistMatch[1].trim();
      const albumMatch = line.match(/\[([^\]]+)\]\((?:https?:\/\/(?:music\.|www\.)?youtube\.com)?\/browse\//);
      if (albumMatch) album = albumMatch[1].trim();
      const durMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*$/);
      if (durMatch) durationStr = durMatch[1];
    } else {
      const artistLine = meta.find((l) => /\[([^\]]+)\]\((?:https?:\/\/(?:music\.|www\.)?youtube\.com)?\/channel\//.test(l));
      if (artistLine) {
        artist = artistLine.match(/\[([^\]]+)\]/)?.[1]?.trim() || '';
      }
      const durLine = meta.find((l) => /^\d{1,2}:\d{2}(?::\d{2})?$/.test(l));
      if (durLine) durationStr = durLine;
    }

    // Se não encontrou duração nas linhas especiais, procurar padrão mm:ss em qualquer meta linha
    if (!durationStr) {
      for (const ml of meta) {
        const dm = ml.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/);
        if (dm) {
          durationStr = dm[1];
          break;
        }
      }
    }

    // Se não encontrou artista via link de canal, checar se a primeira linha de meta é o artista
    if (!artist && meta.length > 0) {
      const candidateArtist = meta[0];
      if (
        candidateArtist &&
        candidateArtist !== durationStr &&
        !candidateArtist.startsWith('http') &&
        !candidateArtist.startsWith('![') &&
        !candidateArtist.startsWith('#') &&
        candidateArtist.length < 80
      ) {
        artist = candidateArtist.replace(/^\[([^\]]+)\]\([^\)]*\)/, '$1').trim();
      }
    }

    // Extrair "Artista - Faixa" se o título contiver hífen
    const { artist: parsedArtist, song: parsedSong } = parseTitle(title, artist);
    const finalTitle = parsedSong || title || `Faixa ${videoId}`;
    const finalArtist = parsedArtist || artist || 'YouTube Music';

    seen.add(videoId);
    const duration = parseDurationStr(durationStr);

    tracks.push({
      videoId,
      title: finalTitle,
      artist: finalArtist,
      album: album || '',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration,
      durationStr: durationStr || '',
      type: 'song',
      source: 'YouTube Music',
      channelTitle: finalArtist,
      _type: isSong ? 'song' : 'video',
    });
  }

  // 2. Passagem Secundária: Extrair watch?v= soltos no texto bruto (tabelas e links sem padrão markdown)
  const allWatchMatches = [...text.matchAll(/watch\?v=([a-zA-Z0-9_-]{11})/g)];
  for (const wm of allWatchMatches) {
    const videoId = wm[1];
    if (seen.has(videoId)) continue;

    const matchIndex = wm.index || 0;
    const textBefore = text.slice(Math.max(0, matchIndex - 300), matchIndex);
    const textAfter = text.slice(matchIndex, matchIndex + 300);

    const localLines = (textBefore + '\n' + textAfter).split('\n').map((l) => l.trim()).filter(Boolean);
    let titleCandidate = '';
    let artistCandidate = '';
    let durCandidate = '';

    for (const l of localLines) {
      if (l.includes(videoId) || l.startsWith('http') || l.startsWith('![')) continue;
      const dm = l.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/);
      if (dm && !durCandidate) {
        durCandidate = dm[1];
        continue;
      }
      if (!titleCandidate && l.length > 2 && l.length < 120 && !l.startsWith('#')) {
        titleCandidate = l.replace(/^\[([^\]]+)\]\([^\)]*\)/, '$1').trim();
      } else if (!artistCandidate && l.length > 2 && l.length < 80 && !l.startsWith('#')) {
        artistCandidate = l.replace(/^\[([^\]]+)\]\([^\)]*\)/, '$1').trim();
      }
    }

    const { artist: parsedArtist, song: parsedSong } = parseTitle(titleCandidate, artistCandidate);
    seen.add(videoId);

    tracks.push({
      videoId,
      title: parsedSong || titleCandidate || `Faixa ${videoId}`,
      artist: parsedArtist || artistCandidate || 'YouTube Music',
      album: '',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: parseDurationStr(durCandidate),
      durationStr: durCandidate || '',
      type: 'song',
      source: 'YouTube Music',
      channelTitle: parsedArtist || artistCandidate || '',
      _type: 'song',
    });
  }

  return tracks;
}

// Parser do markdown da página de search do YouTube Music (via r.jina.ai).
function parseSearchMarkdown(text) {
  if (!text || typeof text !== 'string') return [];
  const results = [];
  const seen = new Set();
  const lines = text.split('\n');

  // Músicas — reusa o parser reparado de watch links
  const songs = parseTracksFromMarkdown(text);
  for (const s of songs) {
    if (seen.has(s.videoId)) continue;
    seen.add(s.videoId);
    results.push({ ...s, type: 'song' });
  }

  function nearbyImage(idx) {
    for (let j = Math.max(0, idx - 4); j <= Math.min(lines.length - 1, idx + 4); j++) {
      const im = lines[j].match(/!\[[^\]]*\]\((https?:\/\/[^\)]+)\)/);
      if (im) return im[1];
    }
    return '';
  }

  function nextTitle(idx) {
    for (let j = idx + 1; j < Math.min(lines.length, idx + 6); j++) {
      const l = lines[j].trim();
      if (!l) continue;
      if (/^!\[/.test(l)) continue;
      if (/^\[.*\]\(https?:\/\//.test(l)) continue;
      if (/^(Song|Video|Playlist|Album|Artist|•)/i.test(l)) continue;
      if (/^\d{1,2}:\d{2}/.test(l)) continue;
      return l;
    }
    return '';
  }

  const linkRe = /\[([^\]]*)\]\((https:\/\/music\.youtube\.com\/(?:watch\?v=|channel\/|browse\/|playlist\?list=)[^\)]*)\)/;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(linkRe);
    if (!m) continue;
    const linkText = m[1].trim();
    const url = m[2];

    if (url.includes('/watch?v=')) continue; // músicas já capturadas acima

    if (url.includes('/channel/UC') || url.includes('/browse/UC')) {
      const bidMatch = url.match(/\/(?:channel|browse)\/(UC[a-zA-Z0-9_-]+)/);
      if (!bidMatch) continue;
      const bid = bidMatch[1];
      if (seen.has(bid)) continue;
      const title = linkText || nextTitle(i);
      if (!title) continue;
      seen.add(bid);
      results.push({
        title,
        artist: title,
        type: 'artist',
        browseId: bid,
        thumbnail: nearbyImage(i),
        music_url: url,
        source: 'YouTube Music',
      });
    } else if (url.includes('/browse/MP')) {
      const bidMatch = url.match(/\/browse\/(MP[a-zA-Z0-9_-]+)/);
      if (!bidMatch) continue;
      const bid = bidMatch[1];
      if (seen.has(bid)) continue;
      const title = linkText || nextTitle(i);
      if (!title) continue;
      seen.add(bid);
      results.push({
        title,
        type: 'album',
        browseId: bid,
        thumbnail: nearbyImage(i),
        music_url: url,
        source: 'YouTube Music',
      });
    } else if (url.includes('/playlist?list=')) {
      const pidMatch = url.match(/list=([a-zA-Z0-9_-]+)/);
      if (!pidMatch) continue;
      const pid = pidMatch[1];
      if (seen.has(pid)) continue;
      const title = linkText || nextTitle(i);
      if (!title) continue;
      seen.add(pid);
      const isMix = pid.startsWith('RD');
      const isCommunity = pid.startsWith('PL') || (!isMix && !pid.startsWith('OLAK'));
      results.push({
        title,
        type: isMix ? 'mix' : (isCommunity ? 'community_playlist' : 'playlist'),
        playlistId: pid,
        thumbnail: nearbyImage(i),
        music_url: url,
        source: 'YouTube Music',
      });
    }
  }

  return results;
}

// Busca no YouTube (youtube.com) via r.jina.ai — ZERO CREDITS, frontend.
export async function searchYouTube(query, opts = {}) {
  if (!query || !query.trim()) return { items: [], continuation: '' };
  try {
    const text = await fetchViaJina(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
    const allItems = parseYouTubeMarkdown(text);
    const items = typeof opts.maxResults === 'number' && opts.maxResults > 0 ? allItems.slice(0, opts.maxResults) : allItems;
    return { items, continuation: '' };
  } catch (err) {
    console.warn('[musicSearch] searchYouTube (jina) falhou:', err?.message || err);
    return { items: [], continuation: '' };
  }
}

// Parser do markdown da página de resultados do YouTube (via r.jina.ai).
function parseYouTubeMarkdown(text) {
  const items = [];
  const seen = new Set();

  // Músicas/vídeos
  const re = /\[([^\]]+)\]\(https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[^\)]*)?\)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const title = m[1].trim();
    const videoId = m[2];
    if (seen.has(videoId)) continue;
    seen.add(videoId);
    const { artist, song } = parseTitle(title, '');
    items.push({
      videoId,
      title: song,
      artist,
      album: '',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: 0,
      durationStr: '',
      type: 'song',
      source: 'YouTube',
      channelTitle: artist,
    });
  }

  // Playlists da comunidade encontradas na busca do YouTube
  const plRe = /\[([^\]]+)\]\(https?:\/\/(?:www\.|m\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]{10,})(?:[^\)]*)?\)/g;
  let plMatch;
  while ((plMatch = plRe.exec(text)) !== null) {
    const title = plMatch[1].trim();
    const playlistId = plMatch[2];
    if (seen.has(playlistId)) continue;
    seen.add(playlistId);
    const isCommunity = playlistId.startsWith('PL');
    items.push({
      playlistId,
      title,
      artist: 'Comunidade YouTube',
      type: isCommunity ? 'community_playlist' : 'playlist',
      source: 'YouTube',
      thumbnail: '',
      music_url: `https://www.youtube.com/playlist?list=${playlistId}`,
    });
  }

  return items;
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
