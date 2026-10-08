// Last.fm — tags do artista (gênero/estilo real), via r.jina.ai sem chave.
// Best-effort: algumas páginas não trazem a seção de tags; retorna [] se falhar.
import { libraryCache, CACHE_NAMESPACES } from './Library_cache.js';

const JINA = 'https://r.jina.ai/';
const TIMEOUT = 10000;

// Busca de tags do artista unificada exclusivamente no libraryCache (chave: nome normalizado).
export async function fetchArtistTagsCached(artist) {
  const key = (artist || '').toLowerCase().trim();
  if (!key) return [];
  
  const cached = libraryCache.get('global', CACHE_NAMESPACES.MUSIC_TAGS, key);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  const tags = await fetchArtistTags(artist);
  if (Array.isArray(tags) && tags.length > 0) {
    libraryCache.set('global', CACHE_NAMESPACES.MUSIC_TAGS, tags, key);
  }
  return tags;
}

export async function fetchArtistTags(artist) {
  if (!artist || !artist.trim()) return [];
  try {
    const res = await fetch(`${JINA}https://www.last.fm/music/${encodeURIComponent(artist.trim())}`, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { Accept: 'text/plain', 'X-Timeout': '8' },
    });
    if (!res.ok) return [];
    const text = await res.text();
    const re = /\[([^\]]+)\]\(https:\/\/www\.last\.fm\/tag\/[^)]+\)/g;
    const tags = [];
    let m;
    while ((m = re.exec(text)) !== null && tags.length < 6) {
      const t = m[1].trim();
      if (!tags.includes(t)) tags.push(t);
    }
    return tags;
  } catch {
    return [];
  }
}