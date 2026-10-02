// Audius — API pública, CORS, sem chave. Música e Playlists da Comunidade independentes.
const HOST = 'https://discoveryprovider.audius.co';
const TIMEOUT = 12000;

export async function searchAudius(query) {
  if (!query || !query.trim()) return { tracks: [], playlists: [] };
  try {
    const [tRes, pRes] = await Promise.all([
      fetch(`${HOST}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=25`, {
        signal: AbortSignal.timeout(TIMEOUT),
      }).catch(() => null),
      fetch(`${HOST}/v1/playlists/search?query=${encodeURIComponent(query)}&limit=15`, {
        signal: AbortSignal.timeout(TIMEOUT),
      }).catch(() => null),
    ]);

    const tracks = [];
    const playlists = [];

    if (tRes && tRes.ok) {
      const j = await tRes.json();
      for (const t of (j.data || [])) {
        tracks.push({
          title: t.title || '',
          artist: t.user?.name || '',
          type: 'song',
          thumbnail: t.artwork?.['480x480'] || t.artwork?.['150x150'] || '',
          source: 'Audius',
          music_url: t.permalink ? `https://audius.co/${t.permalink}` : '',
          genres: t.genre ? [t.genre] : [],
        });
      }
    }

    if (pRes && pRes.ok) {
      const pj = await pRes.json();
      for (const p of (pj.data || [])) {
        playlists.push({
          title: p.playlist_name || p.title || '',
          artist: p.user?.name ? `Comunidade: ${p.user.name}` : 'Audius Community',
          type: 'community_playlist',
          thumbnail: p.artwork?.['480x480'] || p.artwork?.['150x150'] || '',
          source: 'Audius',
          music_url: p.permalink ? `https://audius.co/${p.permalink}` : '',
          description: p.description || '',
          trackCount: p.track_count || 0,
        });
      }
    }

    return { tracks, playlists };
  } catch (err) {
    console.warn('[audius] falhou:', err?.message || err);
    return { tracks: [], playlists: [] };
  }
}