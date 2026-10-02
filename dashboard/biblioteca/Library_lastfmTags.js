// Last.fm — tags do artista (gênero/estilo real), via r.jina.ai sem chave.
// Best-effort: algumas páginas não trazem a seção de tags; retorna [] se falhar.
import { localCache } from '@dashboard/configuracao/Config_localCache';

const JINA = 'https://r.jina.ai/';
const TIMEOUT = 10000;

const tagCache = new Map();

// Mesma busca de tags do artista, com cache em memória e localCache (chave: nome normalizado).
// Evita refetchar o mesmo artista ao classificar várias faixas do mesmo autor.
export async function fetchArtistTagsCached(artist) {
  const key = (artist || '').toLowerCase().trim();
  if (!key) return [];
  if (tagCache.has(key)) return tagCache.get(key);
  
  const disk = localCache.get('global', 'music_tags', key);
  if (Array.isArray(disk) && disk.length > 0) {
    tagCache.set(key, disk);
    return disk;
  }

  const tags = await fetchArtistTags(artist);
  tagCache.set(key, tags);
  if (Array.isArray(tags) && tags.length > 0) {
    localCache.set('global', 'music_tags', tags, key);
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