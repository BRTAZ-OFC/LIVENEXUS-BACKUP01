// Rótulos e ordem das fontes/plataformas — compartilhados entre a busca e a
// página de entidade (clique em metatag) para que ambas usem o mesmo formato.

export const PLATFORM_ORDER = [
  'YouTube Music',
  'Deezer',
  'Audius',
  'iTunes',
  'Bandcamp',
  'YouTube',
  'Mixcloud',
  'Jamendo',
  'MusicBrainz',
  'Last.fm',
];

export const CONTENT_TYPE_ORDER = [
  'community_playlist',
  'song',
  'artist',
  'album',
  'playlist',
];

export const CONTENT_TYPE_LABELS = {
  community_playlist: 'Playlist da Comunidade',
  song: 'Músicas',
  artist: 'Artistas',
  album: 'Álbuns',
  playlist: 'Playlists',
};

// Agrupa qualquer dicionário de resultados por Plataforma e Tipo de Conteúdo
// Estrutura de saída: { [platform]: { [contentType]: items[] } }
export function groupResultsByPlatformAndType(rawGroups) {
  if (!rawGroups || typeof rawGroups !== 'object') return {};

  const structured = {};
  for (const p of PLATFORM_ORDER) {
    structured[p] = {};
  }

  for (const [key, items] of Object.entries(rawGroups)) {
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      if (!it) continue;

      let platform = it.source;
      if (!platform) {
        if (key.startsWith('mb_')) platform = 'MusicBrainz';
        else if (key.startsWith('lastfm_')) platform = 'Last.fm';
        else if (key === 'jamendo_track') platform = 'Jamendo';
        else if (key.startsWith('itunes_')) platform = 'iTunes';
        else if (key.startsWith('deezer_')) platform = 'Deezer';
        else if (key.startsWith('bandcamp_')) platform = 'Bandcamp';
        else if (key.startsWith('audius_')) platform = 'Audius';
        else if (key.startsWith('mixcloud_')) platform = 'Mixcloud';
        else if (key === 'youtube') platform = 'YouTube';
        else platform = 'YouTube Music';
      }

      let type = it.type;
      if (
        type === 'community_playlist' ||
        (it.playlistId && it.playlistId.startsWith('PL')) ||
        (platform === 'Audius' && (it.trackCount || it.type === 'playlist' || it.type === 'community_playlist')) ||
        (platform === 'Deezer' && (it.type === 'community_playlist' || it.type === 'playlist')) ||
        platform === 'Mixcloud'
      ) {
        type = 'community_playlist';
      } else if (type === 'playlist' || type === 'mix') {
        type = 'playlist';
      } else if (type === 'artist' || type === 'mb_artist' || type === 'lastfm_artist') {
        type = 'artist';
      } else if (
        type === 'album' ||
        type === 'mb_release' ||
        type === 'lastfm_album' ||
        type === 'itunes_album' ||
        type === 'bandcamp_album'
      ) {
        type = 'album';
      } else {
        type = 'song';
      }

      if (!structured[platform]) structured[platform] = {};
      if (!structured[platform][type]) structured[platform][type] = [];
      structured[platform][type].push(it);
    }
  }

  // Filtra apenas plataformas e tipos que possuem itens reais
  const result = {};
  for (const p of PLATFORM_ORDER) {
    if (!structured[p]) continue;
    const typesObj = {};
    for (const t of CONTENT_TYPE_ORDER) {
      if (structured[p][t] && structured[p][t].length > 0) {
        typesObj[t] = structured[p][t];
      }
    }
    if (Object.keys(typesObj).length > 0) {
      result[p] = typesObj;
    }
  }

  return result;
}

export const TYPE_LABELS = {
  song: 'YouTube Music · Músicas', youtube: 'YouTube', artist: 'YouTube Music · Artistas',
  album: 'YouTube Music · Álbuns', playlist: 'YouTube Music · Playlists', mix: 'YouTube Music · Mixes',
  mb_artist: 'MusicBrainz · Artistas', mb_recording: 'MusicBrainz · Gravações', mb_release: 'MusicBrainz · Lançamentos',
  lastfm_artist: 'Last.fm · Artistas', lastfm_album: 'Last.fm · Álbuns', jamendo_track: 'Jamendo',
  itunes_track: 'iTunes · Músicas', itunes_album: 'iTunes · Álbuns', deezer_track: 'Deezer · Músicas',
  bandcamp_track: 'Bandcamp · Faixas', bandcamp_album: 'Bandcamp · Álbuns', audius_track: 'Audius · Músicas',
  mixcloud_mix: 'Mixcloud · Mixes',
};

export const TYPE_ORDER = [
  'song', 'youtube', 'artist', 'album', 'playlist', 'mix',
  'mb_artist', 'mb_recording', 'mb_release', 'lastfm_artist', 'lastfm_album', 'jamendo_track',
  'itunes_track', 'itunes_album', 'deezer_track', 'bandcamp_track', 'bandcamp_album', 'audius_track', 'mixcloud_mix',
];