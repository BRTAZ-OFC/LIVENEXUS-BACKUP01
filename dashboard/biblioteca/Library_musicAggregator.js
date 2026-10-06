// Camada de agregação da busca — consulta fontes independentes em paralelo,
// normaliza título/artista e deduplica antes de exibir. Se uma fonte falha ou
// limita, as outras continuam. Não toca no player/engine de reprodução.
//
// Fontes: YouTube Music, YouTube, MusicBrainz, Last.fm, Jamendo (descoberta).
// Saída: grupos no mesmo formato que a galeria já consome (song, youtube, artist,
// album, playlist, mix, mb_*, lastfm_track, jamendo_track).

import { searchAll, searchPlaylists, searchYouTube } from './Library_musicSearch';
import { searchMusicBrainz } from './Library_musicBrainz';
import { searchLastfm } from './Library_lastfm';
import { searchJamendo } from './Library_jamendo';
import { searchItunes } from './Library_itunes';
import { searchDeezer } from './Library_deezer';
import { searchBandcamp } from './Library_bandcamp';
import { searchAudius } from './Library_audius';
import { searchMixcloud } from './Library_mixcloud';

// Normaliza título+artista para chave de dedup: lowercase, sem acentos/pontuação,
// sem sufixos "feat./ft.".
export function normalizeKey(title, artist = '') {
  const norm = (s) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+(feat|ft)\s.*$/i, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  return `${norm(title)}|${norm(artist)}`;
}

function dedupeList(list) {
  const seen = new Set();
  const out = [];
  for (const it of (list || [])) {
    if (!it) continue;
    const key = it.videoId ? `v:${it.videoId}` : (it.playlistId ? `p:${it.playlistId}` : normalizeKey(it.title, it.artist));
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

// Agrega todas as fontes e devolve grupos prontos para a galeria.
export async function aggregateSearch(term) {
  const [ytMusic, ytPlaylists, yt, mb, lastfm, jamendo, itunes, deezer, bandcamp, audius, mixcloud] = await Promise.all([
    searchAll(term).catch(() => ({ items: [] })),
    searchPlaylists(term).catch(() => ({ items: [] })),
    searchYouTube(term).catch(() => ({ items: [] })),
    searchMusicBrainz(term).catch(() => ({ artists: [], recordings: [], releases: [] })),
    searchLastfm(term).catch(() => ({ artists: [], albums: [] })),
    searchJamendo(term).catch(() => []),
    searchItunes(term).catch(() => ({ tracks: [], albums: [] })),
    searchDeezer(term).catch(() => ({ tracks: [], playlists: [] })),
    searchBandcamp(term).catch(() => ({ tracks: [], albums: [] })),
    searchAudius(term).catch(() => ({ tracks: [], playlists: [] })),
    searchMixcloud(term).catch(() => []),
  ]);

  const groups = {};
  for (const it of (ytMusic.items || [])) {
    const t = it.type || 'song';
    (groups[t] = groups[t] || []).push(it);
  }
  for (const it of (ytPlaylists.items || [])) {
    const t = it.type || 'community_playlist';
    (groups[t] = groups[t] || []).push(it);
  }
  for (const it of (yt.items || [])) {
    if (it.type === 'community_playlist' || it.type === 'playlist') {
      (groups[it.type] = groups[it.type] || []).push(it);
    } else {
      (groups.youtube = groups.youtube || []).push(it);
    }
  }

  if (mb) {
    (groups.mb_artist = groups.mb_artist || []).push(...(mb.artists || []));
    (groups.mb_recording = groups.mb_recording || []).push(...(mb.recordings || []));
    (groups.mb_release = groups.mb_release || []).push(...(mb.releases || []));
  }

  // Dedup intra-grupo
  for (const k of Object.keys(groups)) groups[k] = dedupeList(groups[k]);

  // Itens já tocáveis (YT Music + YouTube) — descartam descobertas duplicadas
  const playables = new Set();
  for (const it of (groups.song || [])) playables.add(normalizeKey(it.title, it.artist));
  for (const it of (groups.youtube || [])) playables.add(normalizeKey(it.title, it.artist));

  const lastfmArtists = dedupeList(lastfm?.artists || []);
  const lastfmAlbums = dedupeList(lastfm?.albums || []);
  const jamendoTracks = dedupeList(jamendo).filter((it) => !playables.has(normalizeKey(it.title, it.artist)));
  if (lastfmArtists.length) groups.lastfm_artist = lastfmArtists;
  if (lastfmAlbums.length) groups.lastfm_album = lastfmAlbums;
  if (jamendoTracks.length) groups.jamendo_track = jamendoTracks;

  const itunesTracks = dedupeList(itunes?.tracks || []).filter((it) => !playables.has(normalizeKey(it.title, it.artist)));
  const itunesAlbums = dedupeList(itunes?.albums || []);
  const deezerTracksList = Array.isArray(deezer) ? deezer : (deezer?.tracks || []);
  const deezerPlaylistsList = Array.isArray(deezer?.playlists) ? deezer.playlists : [];
  const deezerTracks = dedupeList(deezerTracksList).filter((it) => !playables.has(normalizeKey(it.title, it.artist)));
  const deezerPlaylists = dedupeList(deezerPlaylistsList);

  const bandcampTracks = dedupeList(bandcamp?.tracks || []).filter((it) => !playables.has(normalizeKey(it.title, it.artist)));
  const bandcampAlbums = dedupeList(bandcamp?.albums || []);

  const audiusTracksList = Array.isArray(audius) ? audius : (audius?.tracks || []);
  const audiusPlaylistsList = Array.isArray(audius?.playlists) ? audius.playlists : [];
  const audiusTracks = dedupeList(audiusTracksList).filter((it) => !playables.has(normalizeKey(it.title, it.artist)));
  const audiusPlaylists = dedupeList(audiusPlaylistsList);

  const mixcloudMixes = dedupeList(mixcloud);

  if (itunesTracks.length) groups.itunes_track = itunesTracks;
  if (itunesAlbums.length) groups.itunes_album = itunesAlbums;
  if (deezerTracks.length) groups.deezer_track = deezerTracks;
  if (deezerPlaylists.length) (groups.community_playlist = groups.community_playlist || []).push(...deezerPlaylists);
  if (bandcampTracks.length) groups.bandcamp_track = bandcampTracks;
  if (bandcampAlbums.length) groups.bandcamp_album = bandcampAlbums;
  if (audiusTracks.length) groups.audius_track = audiusTracks;
  if (audiusPlaylists.length) (groups.community_playlist = groups.community_playlist || []).push(...audiusPlaylists);
  if (mixcloudMixes.length) groups.mixcloud_mix = mixcloudMixes;

  // Deduplicação final dos grupos com adições extras
  if (groups.community_playlist) groups.community_playlist = dedupeList(groups.community_playlist);

  return groups;
}

// Mescla resultados progressivos do InnerTube nos grupos existentes da galeria,
// preservando ordem, deduplicação por ID real, categorias, fontes e resultados já exibidos.
export function mergeProgressiveGroups(prevGroups, innerTubeResults) {
  if (!prevGroups || !Array.isArray(innerTubeResults)) return prevGroups || {};
  const next = { ...prevGroups };
  const seenKeys = new Map();

  for (const [cat, list] of Object.entries(next)) {
    const set = new Set();
    for (const it of (list || [])) {
      const k = it.videoId ? `v:${it.videoId}` : (it.playlistId ? `p:${it.playlistId}` : normalizeKey(it.title, it.artist));
      if (k) set.add(k);
    }
    seenKeys.set(cat, set);
  }

  for (const it of innerTubeResults) {
    if (!it) continue;
    let targetCat;
    if (it.source === 'YouTube') {
      if (it.type === 'community_playlist' || it.type === 'playlist') {
        targetCat = it.type;
      } else {
        targetCat = 'youtube';
      }
    } else {
      targetCat = it.type || 'song';
    }

    if (!next[targetCat]) next[targetCat] = [];
    if (!seenKeys.has(targetCat)) seenKeys.set(targetCat, new Set());

    const key = it.videoId ? `v:${it.videoId}` : (it.playlistId ? `p:${it.playlistId}` : normalizeKey(it.title, it.artist));
    if (key && !seenKeys.get(targetCat).has(key)) {
      seenKeys.get(targetCat).add(key);
      next[targetCat].push(it);
    }
  }

  return next;
}