// UserLibrarySection — Gerenciamento da Biblioteca Pessoal do Usuário com suporte a Músicas e Playlists (InnerTube)
import React, { useState, useEffect, useCallback } from 'react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import { 
  Library, Plus, Edit3, Trash2, Check, X, RefreshCw, 
  Music, Play, Pause, ListPlus, Link2, Volume2, Sparkles, Disc, ListMusic 
} from 'lucide-react';
import { playTrack, play, pause } from '@dashboard/biblioteca/Library_youtubePlayer';
import { queueManager } from '@dashboard/biblioteca/Library_queueManager';
import { useMusicPlayer } from '@dashboard/biblioteca/Library_useMusicPlayer';
import { parseMusicUrl, isValidVideoId } from '@dashboard/biblioteca/Library_musicUrlManager';

// Helper de resolução de Playlist via InnerTube (youtubei/v1/browse)
export async function fetchPlaylistViaInnerTube(playlistId) {
  if (!playlistId) throw new Error('playlistId ausente');
  const cleanId = playlistId.replace(/^[?&]list=/, '').trim();
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

  // Parser de fallback para árvore 'raw' se necessário
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
          thumbnail: `https://i.ytimg.com/vi/${tVideoId}/hqdefault.jpg`,
          source: 'YouTube Music',
          type: 'song',
        });
      }
    }
  }

  // Mapear tracks preservando a ordem original
  const cleanTracks = tracks.map((t, idx) => ({
    id: t.videoId || `track_${idx}`,
    videoId: t.videoId,
    title: t.title,
    artist: t.artist || subtitle || 'YouTube Music',
    album: t.album || '',
    browseId: t.browseId || '',
    durationStr: t.durationStr || '',
    thumbnail: t.thumbnail || (t.videoId ? `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg` : thumbnail),
    source: 'YouTube Music',
    type: 'song',
  }));

  if (!thumbnail && cleanTracks[0]?.thumbnail) {
    thumbnail = cleanTracks[0].thumbnail;
  }

  return {
    playlistId: cleanId.replace(/^VL/, ''),
    browseId,
    title,
    author: subtitle,
    thumbnail,
    tracksCount: cleanTracks.length,
    tracks: cleanTracks,
  };
}

// Parser de URL do YouTube e YouTube Music (músicas e playlists)
export function classifyItemKind(item) {
  if (!item) return 'song';
  const rawType = String(item.type || item.rawRef?.type || '').toLowerCase().trim();
  const id = String(item.id || item.playlistId || item.videoId || item.browseId || '');
  const playlistId = String(item.playlistId || item.rawRef?.playlistId || '');
  const browseId = String(item.browseId || item.rawRef?.browseId || '');

  // 1. Playlists (inclui mixes e playlists da comunidade)
  if (
    rawType === 'playlist' ||
    rawType === 'mix' ||
    rawType === 'community_playlist' ||
    (playlistId && !playlistId.startsWith('OLAK5uy_') && !item.videoId) ||
    id.startsWith('PL') ||
    id.startsWith('RD') ||
    id.startsWith('VLPL') ||
    id.startsWith('VLRD')
  ) {
    return 'playlist';
  }

  // 2. Álbuns
  if (
    rawType === 'album' ||
    rawType === 'mb_release' ||
    rawType === 'lastfm_album' ||
    rawType === 'itunes_album' ||
    rawType === 'bandcamp_album' ||
    playlistId.startsWith('OLAK5uy_') ||
    id.startsWith('OLAK5uy_') ||
    browseId.startsWith('MPRE') ||
    browseId.startsWith('MPSP') ||
    browseId.startsWith('MP')
  ) {
    return 'album';
  }

  // 3. Artistas
  if (
    rawType === 'artist' ||
    rawType === 'mb_artist' ||
    rawType === 'lastfm_artist' ||
    browseId.startsWith('UC') ||
    (id.startsWith('UC') && !item.videoId)
  ) {
    return 'artist';
  }

  // 4. Músicas (padrão)
  return 'song';
}

export function normalizeLibraryCategories(rawLib) {
  const allEntries = [
    ...(rawLib?.songs || []),
    ...(rawLib?.albums || []),
    ...(rawLib?.artists || []),
    ...(rawLib?.playlists || []),
  ];
  const seen = new Set();
  const normalized = {
    songs: [],
    albums: [],
    artists: [],
    playlists: [],
  };

  for (const item of allEntries) {
    if (!item) continue;
    const id = String(item.id || item.videoId || item.playlistId || item.browseId || item.title);
    if (seen.has(id)) continue;
    seen.add(id);

    const kind = classifyItemKind(item);
    const itemWithKind = { ...item, type: kind };

    if (kind === 'playlist') normalized.playlists.push(itemWithKind);
    else if (kind === 'album') normalized.albums.push(itemWithKind);
    else if (kind === 'artist') normalized.artists.push(itemWithKind);
    else normalized.songs.push(itemWithKind);
  }

  return normalized;
}

function parseUserLibraryUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const baseParsed = parseMusicUrl(trimmed);
  let videoId = null;
  let playlistId = null;

  // 1. Extrair videoId (11 caracteres)
  const videoMatch = trimmed.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  if (videoMatch && isValidVideoId(videoMatch[1])) {
    videoId = videoMatch[1];
  } else if (isValidVideoId(trimmed)) {
    videoId = trimmed;
  } else if (baseParsed?.videoId) {
    videoId = baseParsed.videoId;
  }

  // 2. Extrair playlistId (qualquer param list= ou IDs PL, RD, OLAK5uy_, UU, FL)
  const playlistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/) || trimmed.match(/list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch && playlistMatch[1]) {
    playlistId = playlistMatch[1];
  } else if (baseParsed?.playlistId) {
    playlistId = baseParsed.playlistId;
  } else if (/^(PL|RD|UU|FL|OLAK5uy_)[a-zA-Z0-9_-]+/.test(trimmed)) {
    playlistId = trimmed;
  }

  if (!videoId && !playlistId && !baseParsed) return null;

  let type = 'song';
  if (playlistId) {
    if (playlistId.startsWith('RD')) type = 'mix';
    else if (playlistId.startsWith('OLAK5uy_')) type = 'album';
    else type = 'playlist';
  } else if (videoId) {
    type = 'video';
  } else if (baseParsed?.type) {
    type = baseParsed.type;
  }

  return {
    ok: true,
    type,
    videoId,
    playlistId,
    url: trimmed,
  };
}

export default function UserLibrarySection() {
  const { libraryBranch, userId } = useNewUserDataCentral();
  const { track: currentPlayingTrack, isPlaying } = useMusicPlayer();

  const [libraryData, setLibraryData] = useState({ songs: [], albums: [], artists: [], playlists: [] });

  const [filter, setFilter] = useState('all'); // all | songs | albums | artists | playlists
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [creating, setCreating] = useState(false);

  // Estados de prévia da URL
  const [previewTracks, setPreviewTracks] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Form states
  const [form, setForm] = useState({
    title: '',
    artist: '',
    urlOrId: '',
    thumbnail: '',
  });

  const loadLibrary = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const data = await libraryBranch('GET');
      if (data && typeof data === 'object') {
        const normalized = normalizeLibraryCategories(data);
        setLibraryData(normalized);
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar biblioteca salva.');
    } finally {
      setLoading(false);
    }
  }, [userId, libraryBranch]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const normalized = normalizeLibraryCategories(libraryData);
  const songsList = normalized.songs || [];
  const albumsList = normalized.albums || [];
  const artistsList = normalized.artists || [];
  const playlistsList = normalized.playlists || [];
  const allItems = [...songsList, ...albumsList, ...artistsList, ...playlistsList];

  const displayedItems = (() => {
    if (filter === 'songs') return songsList;
    if (filter === 'albums') return albumsList;
    if (filter === 'artists') return artistsList;
    if (filter === 'playlists') return playlistsList;
    return allItems;
  })();

  // Extrai informações inteligentes de um link ou ID
  const parseInputToTrackData = (rawUrlOrId, customThumb = '', title = '', artist = '') => {
    const trimmed = (rawUrlOrId || '').trim();
    let videoId = null;
    let playlistId = null;
    let detectedType = 'song';
    let audioUrl = null;
    let streamUrl = null;

    if (trimmed) {
      const parsed = parseUserLibraryUrl(trimmed);
      if (parsed) {
        detectedType = parsed.type || 'song';
        if (parsed.videoId) videoId = parsed.videoId;
        if (parsed.playlistId) playlistId = parsed.playlistId;
      } else if (/^https?:\/\/.*\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(trimmed)) {
        audioUrl = trimmed;
        detectedType = 'audio';
      } else if (/^https?:\/\//i.test(trimmed)) {
        streamUrl = trimmed;
        detectedType = 'stream';
      }
    }

    let resolvedThumbnail = (customThumb || '').trim();
    if (!resolvedThumbnail && videoId) {
      resolvedThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }

    return {
      videoId,
      playlistId,
      type: detectedType,
      audioUrl,
      streamUrl,
      thumbnail: resolvedThumbnail,
      title: title.trim() || (videoId ? `Faixa (${videoId})` : playlistId ? `Playlist (${playlistId})` : 'Item Sem Título'),
      artist: artist.trim() || (playlistId ? 'YouTube Music' : 'Artista Desconhecido'),
    };
  };

  const showFeedback = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // Reproduzir música ou playlist
  const handlePlaySong = async (song) => {
    if (song.playlistId || song.type === 'playlist' || song.type === 'mix' || song.type === 'album') {
      setLoading(true);
      setError('');
      try {
        let tracksToPlay = song.rawRef?.tracks || song.tracks || [];

        // Se a playlist salva não tiver as faixas em cache, obtém via InnerTube direto
        if (tracksToPlay.length === 0) {
          const res = await fetchPlaylistViaInnerTube(song.playlistId || song.id);
          tracksToPlay = res.tracks;
        }

        if (tracksToPlay.length === 0) {
          setError(`Nenhuma faixa encontrada com videoId para a playlist: ${song.playlistId || song.id}.`);
          setLoading(false);
          return;
        }

        // Mapeia para a fila do queueManager preservando a ordem original
        const queueTracks = tracksToPlay.map((t, idx) => ({
          id: t.videoId || `${song.playlistId || song.id}_${idx}`,
          videoId: t.videoId,
          title: t.title,
          artist: t.artist || song.artist || 'YouTube Music',
          album: t.album || '',
          durationStr: t.durationStr || '',
          thumbnail: t.thumbnail || (t.videoId ? `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg` : song.thumbnail),
          source: 'YouTube Music',
          type: 'song',
        }));

        queueManager.setQueue(queueTracks, 0);
        playTrack(queueTracks[0]);
        showFeedback(`Reproduzindo Playlist (${queueTracks.length} faixas): ${song.title}`);
      } catch (err) {
        setError(`Erro ao carregar playlist: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    const rawRef = song.rawRef || {};
    const parsed = parseInputToTrackData(song.url || song.videoId || song.audioUrl || song.id, song.thumbnail || song.cover || song.image, song.title, song.artist);
    
    const trackToPlay = {
      id: song.id,
      videoId: song.videoId || rawRef.videoId || parsed.videoId || (song.id?.length === 11 ? song.id : null),
      playlistId: song.playlistId || rawRef.playlistId || parsed.playlistId || null,
      title: song.title || song.name || parsed.title,
      artist: song.artist || parsed.artist,
      thumbnail: song.thumbnail || song.cover || song.image || parsed.thumbnail,
      audioUrl: song.audioUrl || rawRef.audioUrl || parsed.audioUrl || null,
      streamUrl: song.streamUrl || rawRef.streamUrl || parsed.streamUrl || null,
      durationStr: song.durationStr || rawRef.durationStr || '',
      source: song.source || (parsed.audioUrl ? 'audio' : 'youtube'),
    };

    // Se já estiver tocando esta mesma música, alterna pause/play
    const isCurrentActive = currentPlayingTrack && (
      (trackToPlay.videoId && currentPlayingTrack.videoId === trackToPlay.videoId) ||
      (currentPlayingTrack.id === song.id)
    );

    if (isCurrentActive) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
      return;
    }

    // Configura a fila a partir de todas as músicas individuais da biblioteca
    if (songsList.length > 0) {
      const queueList = songsList.filter(s => classifyItemKind(s) === 'song').map((s) => {
        const sParsed = parseInputToTrackData(s.url || s.videoId || s.audioUrl || s.id, s.thumbnail || s.cover || s.image, s.title, s.artist);
        return {
          id: s.id,
          videoId: s.videoId || s.rawRef?.videoId || sParsed.videoId || s.id,
          title: s.title || s.name || sParsed.title,
          artist: s.artist || sParsed.artist,
          thumbnail: s.thumbnail || s.cover || s.image || sParsed.thumbnail,
          audioUrl: s.audioUrl || s.rawRef?.audioUrl || sParsed.audioUrl || null,
          streamUrl: s.streamUrl || s.rawRef?.streamUrl || sParsed.streamUrl || null,
          durationStr: s.durationStr || s.rawRef?.durationStr || '',
        };
      });

      const currentIdx = queueList.findIndex((item) => 
        (trackToPlay.videoId && item.videoId === trackToPlay.videoId) || item.id === trackToPlay.id
      );
      if (queueList.length > 0) {
        queueManager.setQueue(queueList, currentIdx >= 0 ? currentIdx : 0);
      }
    }

    playTrack(trackToPlay);
    showFeedback(`Reproduzindo: ${trackToPlay.title}`);
  };

  // Adicionar à fila do player
  const handleAddToQueue = (song) => {
    const itemKind = classifyItemKind(song);
    if (itemKind === 'playlist' || song.playlistId || song.type === 'playlist') {
      showFeedback(`Playlist completa — clique em Tocar para carregar todas as faixas.`);
      return;
    }
    const parsed = parseInputToTrackData(song.url || song.videoId || song.audioUrl || song.id, song.thumbnail || song.cover || song.image, song.title, song.artist);
    const track = {
      id: song.id,
      videoId: song.videoId || parsed.videoId || song.id,
      title: song.title || song.name || parsed.title,
      artist: song.artist || parsed.artist,
      thumbnail: song.thumbnail || parsed.thumbnail,
      audioUrl: song.audioUrl || parsed.audioUrl || null,
      streamUrl: song.streamUrl || parsed.streamUrl || null,
    };
    queueManager.add(track);
    showFeedback(`Adicionada à fila: ${track.title}`);
  };

  // Iniciar criação
  const handleStartCreate = () => {
    setEditingItem(null);
    setForm({
      title: '',
      artist: '',
      urlOrId: '',
      thumbnail: '',
    });
    setPreviewTracks([]);
    setCreating(true);
  };

  // Iniciar edição
  const handleStartEdit = (song) => {
    setCreating(false);
    setEditingItem(song);
    setForm({
      title: song.title || song.name || '',
      artist: song.artist || '',
      urlOrId: song.url || song.videoId || song.playlistId || (song.id?.startsWith('song_') ? '' : song.id) || '',
      thumbnail: song.thumbnail || song.cover || song.image || '',
    });
    setPreviewTracks(song.rawRef?.tracks || song.tracks || []);
  };

  // Salvar criação (Música ou Playlist)
  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    const parsed = parseInputToTrackData(form.urlOrId, form.thumbnail, form.title, form.artist);
    let finalTitle = form.title.trim() || parsed.title;
    let finalArtist = form.artist.trim() || parsed.artist;
    let finalThumbnail = form.thumbnail.trim() || parsed.thumbnail;
    const itemId = parsed.playlistId || parsed.videoId || ('item_' + Date.now());

    let tracksToSave = previewTracks;

    // Se for playlist e ainda não tiver faixas em memória, obtém via InnerTube
    if (parsed.playlistId && tracksToSave.length === 0) {
      setLoading(true);
      try {
        const plRes = await fetchPlaylistViaInnerTube(parsed.playlistId);
        tracksToSave = plRes.tracks;
        if (!finalTitle || finalTitle.startsWith('Playlist (')) finalTitle = plRes.title;
        if (!finalArtist || finalArtist === 'YouTube Music') finalArtist = plRes.author;
        if (!finalThumbnail) finalThumbnail = plRes.thumbnail;
      } catch (fetchErr) {
        setError(`Falha ao obter dados da playlist: ${fetchErr.message || fetchErr}`);
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    const firstTrackStr = tracksToSave[0] ? `${tracksToSave[0].title} — ${tracksToSave[0].artist}` : '—';
    const lastTrackStr = tracksToSave.length > 0 ? `${tracksToSave[tracksToSave.length - 1].title} — ${tracksToSave[tracksToSave.length - 1].artist}` : '—';

    const newItem = {
      id: itemId,
      videoId: parsed.videoId,
      playlistId: parsed.playlistId,
      type: parsed.type,
      title: finalTitle || (parsed.playlistId ? `Playlist (${parsed.playlistId})` : 'Música Sem Título'),
      artist: finalArtist || (parsed.playlistId ? 'YouTube Music' : 'Artista Desconhecido'),
      thumbnail: finalThumbnail || (tracksToSave[0]?.thumbnail) || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
      url: form.urlOrId.trim(),
      audioUrl: parsed.audioUrl,
      streamUrl: parsed.streamUrl,
      addedAt: Date.now(),
      rawRef: {
        videoId: parsed.videoId,
        playlistId: parsed.playlistId,
        type: parsed.type,
        title: finalTitle,
        artist: finalArtist,
        tracksCount: tracksToSave.length,
        firstTrack: firstTrackStr,
        lastTrack: lastTrackStr,
        tracks: tracksToSave,
      }
    };

    const kind = classifyItemKind(newItem);

    try {
      await libraryBranch('POST', { kind, payload: { item: newItem } });
      setCreating(false);
      setForm({ title: '', artist: '', urlOrId: '', thumbnail: '' });
      setPreviewTracks([]);
      await loadLibrary();
      showFeedback(parsed.playlistId ? `Playlist "${newItem.title}" adicionada com sucesso!` : 'Música adicionada com sucesso!');
    } catch (err) {
      setError(err.message || 'Falha ao salvar item na biblioteca.');
    }
  };

  // Salvar edição
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setError('');

    const parsed = parseInputToTrackData(form.urlOrId, form.thumbnail, form.title, form.artist);
    const finalTitle = form.title.trim() || parsed.title;
    const finalArtist = form.artist.trim() || parsed.artist;

    let tracksToSave = previewTracks;
    if (parsed.playlistId && tracksToSave.length === 0) {
      try {
        const plRes = await fetchPlaylistViaInnerTube(parsed.playlistId);
        tracksToSave = plRes.tracks;
      } catch (fetchErr) {
        setError(`Falha ao obter dados da playlist: ${fetchErr.message || fetchErr}`);
        return;
      }
    }

    const firstTrackStr = tracksToSave[0] ? `${tracksToSave[0].title} — ${tracksToSave[0].artist}` : (editingItem.rawRef?.firstTrack || '—');
    const lastTrackStr = tracksToSave.length > 0 ? `${tracksToSave[tracksToSave.length - 1].title} — ${tracksToSave[tracksToSave.length - 1].artist}` : (editingItem.rawRef?.lastTrack || '—');

    const changes = {
      title: finalTitle,
      artist: finalArtist,
      thumbnail: form.thumbnail.trim() || parsed.thumbnail || (tracksToSave[0]?.thumbnail) || '',
      url: form.urlOrId.trim(),
      videoId: parsed.videoId,
      playlistId: parsed.playlistId,
      type: parsed.type,
      audioUrl: parsed.audioUrl,
      streamUrl: parsed.streamUrl,
      rawRef: {
        ...(editingItem.rawRef || {}),
        videoId: parsed.videoId,
        playlistId: parsed.playlistId,
        type: parsed.type,
        title: finalTitle,
        artist: finalArtist,
        tracksCount: tracksToSave.length > 0 ? tracksToSave.length : (editingItem.rawRef?.tracksCount || 0),
        firstTrack: firstTrackStr,
        lastTrack: lastTrackStr,
        tracks: tracksToSave.length > 0 ? tracksToSave : (editingItem.rawRef?.tracks || []),
      }
    };

    const kind = classifyItemKind(changes);

    try {
      await libraryBranch('PATCH', { id: editingItem.id, kind, payload: { changes } });
      setEditingItem(null);
      setPreviewTracks([]);
      await loadLibrary();
      showFeedback('Item atualizado com sucesso!');
    } catch (err) {
      setError(err.message || 'Falha ao salvar alterações.');
    }
  };

  // Excluir música ou playlist
  const handleDelete = async (id) => {
    try {
      const itemToDelete = allItems.find(it => String(it.id || it.videoId || it.playlistId) === String(id));
      const kind = classifyItemKind(itemToDelete);
      await libraryBranch('DELETE', { id, kind });
      setConfirmDeleteId(null);
      await loadLibrary();
      showFeedback('Item removido da biblioteca.');
    } catch (err) {
      setError(err.message || 'Falha ao excluir item da biblioteca.');
    }
  };

  // Captura inteligente e automática ao colar link
  const handleUrlChange = async (val) => {
    const updatedForm = { ...form, urlOrId: val };
    const parsed = parseUserLibraryUrl(val);
    setError('');

    if (parsed) {
      if (parsed.videoId && !form.thumbnail) {
        updatedForm.thumbnail = `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`;
      }
      if (parsed.playlistId) {
        setPreviewLoading(true);
        try {
          const innerTubeRes = await fetchPlaylistViaInnerTube(parsed.playlistId);
          setPreviewTracks(innerTubeRes.tracks);
          if (innerTubeRes.tracks.length > 0) {
            if (!form.title || form.title.startsWith('Playlist (')) updatedForm.title = innerTubeRes.title;
            if (!form.artist || form.artist === 'YouTube Music') updatedForm.artist = innerTubeRes.author;
            if (!form.thumbnail && innerTubeRes.thumbnail) {
              updatedForm.thumbnail = innerTubeRes.thumbnail;
            }
          }
        } catch {
          // Mantém fallback limpo sem travar o form
        } finally {
          setPreviewLoading(false);
        }
      } else {
        setPreviewTracks([]);
      }
    } else if (isValidVideoId(val.trim()) && !form.thumbnail) {
      updatedForm.thumbnail = `https://i.ytimg.com/vi/${val.trim()}/hqdefault.jpg`;
      setPreviewTracks([]);
    } else {
      setPreviewTracks([]);
    }
    setForm(updatedForm);
  };

  const currentPreviewParsed = form.urlOrId ? parseUserLibraryUrl(form.urlOrId) : null;
  const isPlaylistFlow = currentPreviewParsed?.type === 'playlist' || currentPreviewParsed?.type === 'mix' || currentPreviewParsed?.type === 'album' || Boolean(currentPreviewParsed?.playlistId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-editor-fade-in pb-12">
      {/* Cabeçalho */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-300 shadow-lg shadow-violet-950/40">
            <Library size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Minha Biblioteca Pessoal
              <span className="text-xs font-mono font-normal text-violet-400 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-full">
                {allItems.length} {allItems.length === 1 ? 'item' : 'itens'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Adicione músicas e playlists do YouTube ou YouTube Music para ouvir a qualquer momento
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLibrary}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Atualizar itens da biblioteca"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer shadow-lg shadow-violet-600/30 active:scale-95"
          >
            <Plus size={15} /> Adicionar Item
          </button>
        </div>
      </header>

      {/* Filtros por Categoria */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
            filter === 'all'
              ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30'
              : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          Tudo ({allItems.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('songs')}
          className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
            filter === 'songs'
              ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30'
              : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          Músicas ({songsList.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('albums')}
          className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
            filter === 'albums'
              ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30'
              : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          Álbuns ({albumsList.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('artists')}
          className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
            filter === 'artists'
              ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30'
              : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          Artistas ({artistsList.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('playlists')}
          className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
            filter === 'playlists'
              ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30'
              : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          Playlists ({playlistsList.length})
        </button>
      </div>

      {/* Alertas de Sucesso e Erro */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2.5 text-xs text-emerald-300 shadow-md animate-fade-in">
          <Check size={15} className="shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-2.5 text-xs text-rose-300 shadow-md animate-fade-in">
          <X size={15} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulário Unificado de Adicionar / Editar */}
      {(creating || editingItem) && (
        <form 
          onSubmit={creating ? handleCreate : handleSaveEdit} 
          className="rounded-2xl border border-violet-500/30 bg-[#0a0d15] p-5 space-y-4 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-violet-400" />
              {creating ? (isPlaylistFlow ? 'Adicionar Playlist' : 'Adicionar Música') : `Editar: ${editingItem.title || 'Item'}`}
            </h3>
            <button
              type="button"
              onClick={() => { setCreating(false); setEditingItem(null); setPreviewTracks([]); }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Link do YouTube / YouTube Music */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Link2 size={13} className="text-violet-400" /> Link do YouTube ou YouTube Music (Música ou Playlist)
                </span>
                <span className="text-[10px] text-violet-400/90 font-normal">Identificação automática</span>
              </label>
              <input
                type="text"
                placeholder="https://music.youtube.com/watch?v=... ou https://music.youtube.com/playlist?list=..."
                value={form.urlOrId}
                onChange={e => handleUrlChange(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-violet-500 transition font-mono"
              />
            </div>

            {/* Título */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Título <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={isPlaylistFlow ? "Ex: Minha Playlist Favorita" : "Ex: Bohemian Rhapsody"}
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-violet-500 transition"
              />
            </div>

            {/* Artista / Canal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Artista / Canal
              </label>
              <input
                type="text"
                placeholder={isPlaylistFlow ? "Ex: Canal Oficial / Autor" : "Ex: Queen"}
                value={form.artist}
                onChange={e => setForm({ ...form, artist: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-violet-500 transition"
              />
            </div>

            {/* URL da Capa */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>URL da Capa (Opcional)</span>
                <span className="text-[10px] text-slate-500">Auto-preenchida a partir do link</span>
              </label>
              <input
                type="text"
                placeholder="https://exemplo.com/capa.jpg"
                value={form.thumbnail}
                onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-violet-500 transition"
              />
            </div>
          </div>

          {/* Prévia Visual Limpa */}
          {(form.thumbnail || previewLoading || previewTracks.length > 0) && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                  <Disc size={14} className={previewLoading ? 'animate-spin' : ''} />
                  Prévia {isPlaylistFlow ? 'da Playlist' : 'da Música'}
                </span>
                {previewLoading && (
                  <span className="text-[11px] text-cyan-300 animate-pulse">Obtendo faixas...</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <img 
                  src={form.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150'} 
                  alt="Prévia da capa" 
                  className="h-14 w-14 rounded-xl object-cover border border-white/10 shadow-md shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                      isPlaylistFlow 
                        ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/30' 
                        : 'text-violet-300 bg-violet-500/20 border border-violet-500/30'
                    }`}>
                      {isPlaylistFlow ? 'Playlist' : 'Música'}
                    </span>
                    {isPlaylistFlow && previewTracks.length > 0 && (
                      <span className="text-[10px] text-slate-400">
                        • {previewTracks.length} faixas
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white truncate">{form.title || 'Título do Item'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{form.artist || 'Artista / Canal'}</p>
                </div>
              </div>

              {/* Lista compacta de faixas da playlist */}
              {isPlaylistFlow && previewTracks.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-300">
                    Faixas incluídas ({previewTracks.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {previewTracks.slice(0, 5).map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                        <span className="text-violet-400 font-mono w-4">{idx + 1}.</span>
                        <span className="truncate text-white flex-1">{t.title}</span>
                        <span className="truncate text-slate-400 max-w-[120px]">{t.artist}</span>
                      </div>
                    ))}
                    {previewTracks.length > 5 && (
                      <p className="text-[10px] text-slate-500 text-center italic">
                        + {previewTracks.length - 5} outras faixas
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botões de Ação do Form */}
          <div className="flex gap-2 justify-end pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => { setCreating(false); setEditingItem(null); setPreviewTracks([]); }}
              className="rounded-xl bg-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/20 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2 text-xs font-semibold text-white transition cursor-pointer shadow-lg shadow-violet-600/30 flex items-center gap-2"
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Plus size={15} />}
              {creating ? (isPlaylistFlow ? 'Salvar Playlist' : 'Salvar Música') : 'Atualizar Item'}
            </button>
          </div>
        </form>
      )}

      {/* Estado Vazio ou Carregando */}
      {loading && !allItems.length && (
        <div className="py-12 text-center text-xs text-slate-400">
          <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-violet-400" />
          Carregando itens da sua biblioteca...
        </div>
      )}

      {!loading && !allItems.length && !creating && (
        <div className="rounded-3xl border border-white/10 bg-[#0a0d15] p-12 text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
            <Music size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Sua biblioteca está vazia</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Cole links de músicas ou playlists do YouTube e YouTube Music para salvar na sua biblioteca pessoal.
            </p>
          </div>
          <button
            onClick={handleStartCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white transition cursor-pointer shadow-lg shadow-violet-600/30"
          >
            <Plus size={15} /> Adicionar Primeiro Item
          </button>
        </div>
      )}

      {!loading && allItems.length > 0 && displayedItems.length === 0 && !creating && (
        <div className="rounded-2xl border border-white/10 bg-[#0a0d15] p-8 text-center space-y-2">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
            <Library size={22} />
          </div>
          <h3 className="text-sm font-bold text-white">Nenhum item nesta categoria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não há itens salvos classificados como {filter === 'songs' ? 'músicas' : filter === 'albums' ? 'álbuns' : filter === 'artists' ? 'artistas' : 'playlists'}.
          </p>
        </div>
      )}

      {/* Grid de Músicas e Playlists com Player Real */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayedItems.map(song => {
          const isDeleting = confirmDeleteId === song.id;
          const itemKind = classifyItemKind(song);
          const isPlaylist = itemKind === 'playlist' || itemKind === 'album' || song.type === 'playlist' || song.type === 'mix' || Boolean(song.playlistId);
          const songThumb = song.thumbnail || song.cover || song.image || (
            song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg` : null
          );

          // Verifica se esta música/playlist está tocando agora
          const isThisSongActive = currentPlayingTrack && (
            (song.videoId && currentPlayingTrack.videoId === song.videoId) ||
            (currentPlayingTrack.id === song.id)
          );
          const isThisSongPlaying = isThisSongActive && isPlaying;

          const tracksList = song.rawRef?.tracks || song.tracks || [];
          const tracksCount = song.rawRef?.tracksCount || tracksList.length || 0;

          return (
            <div
              key={song.id}
              className={`rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between space-y-3 relative group overflow-hidden ${
                isThisSongActive 
                  ? 'border-violet-500 bg-violet-950/20 shadow-lg shadow-violet-950/50 ring-1 ring-violet-500/40' 
                  : isPlaylist
                    ? 'border-cyan-500/30 bg-[#08101a] hover:border-cyan-500/60 hover:bg-[#0c1624]'
                    : 'border-white/10 bg-[#0a0d15] hover:border-violet-500/40 hover:bg-[#0e121d]'
              }`}
            >
              {/* Topo do Card com Capa e Dados */}
              <div className="flex items-start gap-3">
                {/* Capa com Botão de Play */}
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 shadow-md">
                  {songThumb ? (
                    <img
                      src={songThumb}
                      alt={song.title}
                      className={`h-full w-full object-cover transition duration-300 ${isThisSongPlaying ? 'scale-105' : 'group-hover:scale-105'}`}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center bg-gradient-to-br from-violet-900/40 to-slate-900 text-violet-300">
                      {isPlaylist ? <ListMusic size={22} /> : <Music size={22} />}
                    </div>
                  )}

                  {/* Overlay de Play Rápido */}
                  <button
                    type="button"
                    onClick={() => handlePlaySong(song)}
                    className={`absolute inset-0 grid place-items-center transition backdrop-blur-xs cursor-pointer ${
                      isThisSongActive
                        ? 'bg-violet-900/70 text-white opacity-100'
                        : 'bg-black/60 text-white opacity-0 group-hover:opacity-100'
                    }`}
                    title={isThisSongPlaying ? 'Pausar' : (isPlaylist ? 'Tocar Playlist' : 'Tocar')}
                  >
                    {isThisSongPlaying ? (
                      <Pause size={20} className="fill-white" />
                    ) : (
                      <Play size={20} className="fill-white ml-0.5" />
                    )}
                  </button>

                  {/* Indicador de reprodução ativa */}
                  {isThisSongPlaying && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-violet-600 shadow-sm">
                      <span className="w-1 h-2 bg-white rounded-full animate-pulse"></span>
                      <span className="w-1 h-3 bg-white rounded-full animate-pulse delay-75"></span>
                      <span className="w-1 h-1.5 bg-white rounded-full animate-pulse delay-150"></span>
                    </div>
                  )}
                </div>

                {/* Título, Artista e Badges */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    {isThisSongActive && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase font-mono bg-violet-500 text-white px-1.5 py-0.5 rounded-sm shadow-xs">
                        <Volume2 size={10} /> Tocando
                      </span>
                    )}
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                      itemKind === 'playlist' 
                        ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/30' 
                        : itemKind === 'album'
                          ? 'text-amber-300 bg-amber-500/20 border border-amber-500/30'
                          : itemKind === 'artist'
                            ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30'
                            : 'text-violet-300 bg-violet-500/15 border border-violet-500/30'
                    }`}>
                      {itemKind === 'playlist' ? 'Playlist' : itemKind === 'album' ? 'Álbum' : itemKind === 'artist' ? 'Artista' : 'Música'}
                    </span>
                    {isPlaylist && tracksCount > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {tracksCount} faixas
                      </span>
                    )}
                  </div>

                  <h3 
                    className={`text-xs font-bold truncate leading-tight cursor-pointer hover:text-violet-300 transition ${
                      isThisSongActive ? 'text-violet-200' : 'text-white'
                    }`}
                    onClick={() => handlePlaySong(song)}
                    title={song.title || song.name}
                  >
                    {song.title || song.name || 'Sem título'}
                  </h3>

                  <p className="text-[11px] text-slate-400 truncate mt-0.5" title={song.artist}>
                    {song.artist || 'Artista Desconhecido'}
                  </p>
                </div>
              </div>

              {/* Barra de Ações Rápidas */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-1 text-xs">
                {isDeleting ? (
                  <div className="w-full flex items-center justify-between bg-rose-950/80 p-1.5 rounded-xl border border-rose-500/40 animate-fade-in">
                    <span className="text-[11px] text-rose-200 font-medium">Excluir item?</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(song.id)}
                        className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] px-2 py-1 rounded-lg transition cursor-pointer"
                      >
                        Não
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Botão de Tocar / Pausar */}
                    <button
                      onClick={() => handlePlaySong(song)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95 ${
                        isThisSongPlaying
                          ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-md shadow-violet-600/40'
                          : isPlaylist
                            ? 'bg-cyan-600/80 text-white hover:bg-cyan-500 shadow-md'
                            : 'bg-white/10 text-white hover:bg-violet-600 hover:shadow-md'
                      }`}
                    >
                      {isThisSongPlaying ? (
                        <>
                          <Pause size={13} className="fill-current" /> Pausar
                        </>
                      ) : (
                        <>
                          <Play size={13} className="fill-current" /> {isPlaylist ? 'Tocar Playlist' : 'Tocar'}
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1 text-slate-400">
                      {/* Botão Adicionar à Fila (Apenas para músicas individuais) */}
                      {!isPlaylist && (
                        <button
                          onClick={() => handleAddToQueue(song)}
                          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer"
                          title="Adicionar à fila de reprodução"
                        >
                          <ListPlus size={15} />
                        </button>
                      )}

                      {/* Botão Editar */}
                      <button
                        onClick={() => handleStartEdit(song)}
                        className="p-1.5 rounded-lg hover:bg-white/10 hover:text-violet-300 transition cursor-pointer"
                        title="Editar detalhes"
                      >
                        <Edit3 size={14} />
                      </button>

                      {/* Botão Excluir */}
                      <button
                        onClick={() => setConfirmDeleteId(song.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 transition cursor-pointer"
                        title="Remover da biblioteca"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
