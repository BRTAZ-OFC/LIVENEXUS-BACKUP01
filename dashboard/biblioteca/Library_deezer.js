// Deezer — descoberta via r.jina.ai (sem chave).
// Extrai faixas (seção Tracks) e Playlists da Comunidade (via search/playlist).
const JINA = 'https://r.jina.ai/';
const TIMEOUT = 15000;

export async function searchDeezer(query) {
  if (!query || !query.trim()) return { tracks: [], playlists: [] };
  try {
    const [tracksRes, playlistsRes] = await Promise.all([
      fetch(`${JINA}https://www.deezer.com/search/${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(TIMEOUT),
        headers: { Accept: 'text/plain', 'X-Timeout': '10' },
      }).catch(() => null),
      fetch(`${JINA}https://api.deezer.com/search/playlist?q=${encodeURIComponent(query)}&limit=15`, {
        signal: AbortSignal.timeout(TIMEOUT),
        headers: { Accept: 'application/json', 'X-Timeout': '10' },
      }).catch(() => null),
    ]);

    const tracks = [];
    const playlists = [];
    const seen = new Set();

    if (tracksRes && tracksRes.ok) {
      const text = await tracksRes.text();
      const section = text.split('### Tracks')[1] || '';
      const lines = section.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/!\[Image \d+\]\((https:\/\/cdn-images\.dzcdn\.net\/[^)]+)\)/);
        if (!m) continue;
        const thumb = m[1];
        let title = '';
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const t = lines[j].trim();
          if (t && !/^\d{1,2}:\d{2}$/.test(t) && !t.startsWith('![') && !t.startsWith('###')) { title = t; break; }
        }
        if (title && !seen.has(title)) {
          seen.add(title);
          tracks.push({ title, artist: '', type: 'song', thumbnail: thumb, source: 'Deezer' });
        }
      }
    }

    if (playlistsRes && playlistsRes.ok) {
      try {
        const d = await playlistsRes.json();
        const raw = JSON.parse(d?.data?.content || '{}');
        for (const p of (raw.data || [])) {
          if (!p.title) continue;
          playlists.push({
            title: p.title,
            artist: p.user?.name ? `Comunidade: ${p.user.name}` : 'Deezer Community',
            type: 'community_playlist',
            thumbnail: p.picture_medium || p.picture_big || p.picture || '',
            source: 'Deezer',
            music_url: p.link || '',
            trackCount: p.nb_tracks || 0,
          });
        }
      } catch { /* ignore playlist parse failure */ }
    }

    return { tracks, playlists };
  } catch (err) {
    console.warn('[deezer] falhou:', err?.message || err);
    return { tracks: [], playlists: [] };
  }
}