// Last.fm — tags do artista (gênero/estilo real), via r.jina.ai sem chave.
// Best-effort: algumas páginas não trazem a seção de tags; retorna [] se falhar.

const JINA = 'https://r.jina.ai/';
const TIMEOUT = 10000;

// Busca de tags do artista diretamente na fonte oficial sem cache.
export async function fetchArtistTagsCached(artist) {
  return fetchArtistTags(artist);
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