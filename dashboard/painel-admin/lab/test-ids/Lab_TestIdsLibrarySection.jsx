// Lab_TestIdsLibrarySection — Laboratório de Teste e Identificação de IDs (Músicas e Playlists do YouTube / YouTube Music)
// Implementação do fluxo InnerTube nativo (youtubei/v1/browse) para Playlists e Músicas
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

// Helper de resolução completa de Playlists via InnerTube (WEB_REMIX) — Sem Jina / Sem Regex de HTML
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

  // Parser de fallback para árvore 'raw' caso o backend retorne o json puro do YouTube Music
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

  // Mapear tracks para formato do player preservando rigorosamente a ordem original
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

export default function LabTestIdsLibrarySection() {
  const { libraryBranch, userId } = useNewUserDataCentral();
  const { track: currentPlayingTrack, isPlaying } = useMusicPlayer();

  const [libraryData, setLibraryData] = useState({ songs: [], albums: [], artists: [], playlists: [] });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [creating, setCreating] = useState(false);

  // Preview state for URL paste in form
  const [previewTracks, setPreviewTracks] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [playlistDiagnostics, setPlaylistDiagnostics] = useState(null);

  // Última playlist adicionada com sucesso no laboratório para exibição em destaque
  const [lastAddedPlaylist, setLastAddedPlaylist] = useState(null);

  // Estados específicos para o Teste Isolado do InnerTube (youtubei/v1/browse)
  const [innertubeBrowseId, setInnertubeBrowseId] = useState('VLPLQp1FGU1CGdOsSxuRg1mVulPOE9Jm83WC');
  const [innertubePlaylistId, setInnertubePlaylistId] = useState('PLQp1FGU1CGdOsSxuRg1mVulPOE9Jm83WC');
  const [innertubeLoading, setInnertubeLoading] = useState(false);
  const [innertubeResult, setInnertubeResult] = useState(null);
  const [innertubeError, setInnertubeError] = useState('');

  // Função isolada de chamada ao InnerTube youtubei/v1/browse
  const handleExecuteInnerTubeTest = useCallback(async (customBrowseId = null) => {
    const targetBrowseId = (customBrowseId || innertubeBrowseId || 'VLPLQp1FGU1CGdOsSxuRg1mVulPOE9Jm83WC').trim();
    setInnertubeLoading(true);
    setInnertubeError('');

    try {
      const url = `/api/ytmusic/browse?browseId=${encodeURIComponent(targetBrowseId)}`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      const httpStatus = `HTTP ${res.status} ${res.statusText}`;
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.ok === false) {
        throw new Error(`${httpStatus} — ${json.error || 'Falha na resposta do InnerTube'}`);
      }

      let tracks = json.tracks || [];
      let playlistTitle = json.title || 'Playlist Sem Título';
      let continuationToken = json.continuation || '';

      // Parser de fallback caso o JSON retorne a árvore bruta 'raw'
      if (tracks.length === 0 && json.raw) {
        const raw = json.raw;
        const twoCol = raw.contents?.twoColumnBrowseResultsRenderer;
        const singleCol = raw.contents?.singleColumnBrowseResultsRenderer;
        
        const header = raw.header?.musicResponsiveHeaderRenderer || 
          raw.header?.musicDetailHeaderRenderer ||
          twoCol?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicResponsiveHeaderRenderer;
        
        if (header?.title?.runs?.[0]?.text) {
          playlistTitle = header.title.runs.map(r => r.text).join('');
        }

        const shelf = twoCol?.secondaryContents?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer ||
          twoCol?.secondaryContents?.sectionListRenderer?.contents?.[0]?.musicShelfRenderer ||
          twoCol?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer ||
          singleCol?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer;

        continuationToken = shelf?.continuations?.[0]?.nextContinuationData?.continuation ||
          shelf?.continuations?.[0]?.reloadContinuationData?.continuation || '';

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

          if (tTitle) {
            tracks.push({
              videoId: tVideoId || null,
              title: tTitle,
              artist: tArtist,
              album: tAlbum,
              browseId: tBrowseId,
              durationStr: tDur,
              thumbnail: tVideoId ? `https://i.ytimg.com/vi/${tVideoId}/hqdefault.jpg` : '',
              type: 'song',
              source: 'YouTube Music',
            });
          }
        }
      }

      const cleanTracks = tracks.map((t, idx) => ({
        id: t.videoId || `track_${idx}`,
        videoId: t.videoId,
        title: t.title,
        artist: t.artist || 'YouTube Music',
        album: t.album || '',
        browseId: t.browseId || '',
        durationStr: t.durationStr || '',
        thumbnail: t.thumbnail || (t.videoId ? `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg` : ''),
        type: 'song',
        source: 'YouTube Music',
      }));

      const videoIdsCount = cleanTracks.filter(t => Boolean(t.videoId)).length;

      setInnertubeResult({
        statusHttp: httpStatus,
        endpoint: 'https://music.youtube.com/youtubei/v1/browse',
        browseId: targetBrowseId,
        playlistTitle,
        tracks: cleanTracks,
        tracksCount: cleanTracks.length,
        videoIdsCount,
        continuationToken: continuationToken || 'Nenhuma (Lote único retornado)',
        error: '',
      });
    } catch (err) {
      setInnertubeError(err.message || String(err));
      setInnertubeResult({
        statusHttp: 'Erro na requisição',
        endpoint: 'https://music.youtube.com/youtubei/v1/browse',
        browseId: targetBrowseId,
        playlistTitle: '—',
        tracks: [],
        tracksCount: 0,
        videoIdsCount: 0,
        continuationToken: '—',
        error: err.message || String(err),
      });
    } finally {
      setInnertubeLoading(false);
    }
  }, [innertubeBrowseId]);

  // Execução automática na inicialização para inspecionar os IDs de teste
  useEffect(() => {
    handleExecuteInnerTubeTest('VLPLQp1FGU1CGdOsSxuRg1mVulPOE9Jm83WC');
  }, [handleExecuteInnerTubeTest]);

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
        setLibraryData(data);
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

  const allSongs = Array.isArray(libraryData?.songs) ? libraryData.songs : [];

  // Parser robusto ampliado usando o motor da Biblioteca principal + captura simultânea videoId + playlistId
  const parseLabMusicUrl = (url) => {
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
  };

  const parseInputToTrackData = (rawUrlOrId, customThumb = '', title = '', artist = '') => {
    const trimmed = (rawUrlOrId || '').trim();
    let videoId = null;
    let playlistId = null;
    let detectedType = 'song';
    let audioUrl = null;
    let streamUrl = null;

    if (trimmed) {
      const parsed = parseLabMusicUrl(trimmed);
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

        // Se a playlist salva não tiver as faixas em cache, obtém via InnerTube direto (sem Jina/pesquisa)
        if (tracksToPlay.length === 0) {
          const res = await fetchPlaylistViaInnerTube(song.playlistId || song.id);
          tracksToPlay = res.tracks;
        }

        if (tracksToPlay.length === 0) {
          setError(`[Play Playlist] Nenhuma faixa encontrada com videoId para a playlist: ${song.playlistId || song.id}.`);
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
        setError(`Erro ao carregar playlist (InnerTube): ${err.message || err}`);
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

    if (allSongs.length > 0) {
      const queueList = allSongs.filter(s => !s.playlistId && s.type !== 'playlist').map((s) => {
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

  const handleAddToQueue = (song) => {
    if (song.playlistId || song.type === 'playlist') {
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

  const handleStartCreate = () => {
    setEditingItem(null);
    setForm({
      title: '',
      artist: '',
      urlOrId: '',
      thumbnail: '',
    });
    setPreviewTracks([]);
    setPlaylistDiagnostics(null);
    setError('');
    setCreating(true);
  };

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
    setPlaylistDiagnostics(null);
    setError('');
  };

  // Salvar playlist do InnerTube diretamente na biblioteca
  const handleAddInnerTubePlaylistToLibrary = async (targetBrowseId = null) => {
    const bId = (targetBrowseId || innertubeBrowseId || 'VLPLQp1FGU1CGdOsSxuRg1mVulPOE9Jm83WC').trim();
    const pId = bId.replace(/^VL/, '');
    setLoading(true);
    setError('');

    try {
      const res = await fetchPlaylistViaInnerTube(pId);
      if (!res.tracks || res.tracks.length === 0) {
        throw new Error('O InnerTube não retornou faixas válidas para este browseId.');
      }

      const finalTitle = res.title || `Playlist (${pId})`;
      const finalArtist = res.author || 'YouTube Music';
      const finalThumbnail = res.thumbnail || res.tracks[0]?.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150';

      const firstTrackStr = res.tracks[0] ? `${res.tracks[0].title} — ${res.tracks[0].artist}` : '—';
      const lastTrackStr = res.tracks.length > 0 ? `${res.tracks[res.tracks.length - 1].title} — ${res.tracks[res.tracks.length - 1].artist}` : '—';

      const newItem = {
        id: pId,
        playlistId: pId,
        type: 'playlist',
        title: finalTitle,
        artist: finalArtist,
        thumbnail: finalThumbnail,
        url: `https://music.youtube.com/playlist?list=${pId}`,
        addedAt: Date.now(),
        rawRef: {
          playlistId: pId,
          browseId: bId,
          type: 'playlist',
          title: finalTitle,
          artist: finalArtist,
          tracksCount: res.tracks.length,
          firstTrack: firstTrackStr,
          lastTrack: lastTrackStr,
          tracks: res.tracks,
        }
      };

      const kind = classifyItemKind(newItem);
      await libraryBranch('POST', { kind, payload: { item: newItem } });
      await loadLibrary();
      
      setLastAddedPlaylist({
        playlistId: pId,
        title: finalTitle,
        artist: finalArtist,
        thumbnail: finalThumbnail,
        tracksCount: res.tracks.length,
        firstTrack: firstTrackStr,
        lastTrack: lastTrackStr,
        tracks: res.tracks,
      });

      showFeedback(`Playlist "${finalTitle}" (${res.tracks.length} faixas) salva com sucesso na biblioteca!`);
    } catch (err) {
      setError(`Falha ao salvar playlist na biblioteca: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Tocar a playlist do InnerTube diretamente no Player
  const handlePlayInnerTubePlaylistSample = (tracksToPlay = null, plTitle = null) => {
    const list = tracksToPlay || innertubeResult?.tracks || [];
    if (!list || list.length === 0) {
      setError('Nenhuma faixa retornada pelo InnerTube para tocar.');
      return;
    }
    const queueTracks = list.map((t, idx) => ({
      id: t.videoId || `innertube_${idx}`,
      videoId: t.videoId,
      title: t.title,
      artist: t.artist || plTitle || 'YouTube Music',
      album: t.album || '',
      durationStr: t.durationStr || '',
      thumbnail: t.thumbnail || (t.videoId ? `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg` : ''),
      source: 'YouTube Music',
      type: 'song',
    }));
    queueManager.setQueue(queueTracks, 0);
    playTrack(queueTracks[0]);
    showFeedback(`Reproduzindo Playlist InnerTube (${queueTracks.length} faixas): ${queueTracks[0].title}`);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    const parsed = parseInputToTrackData(form.urlOrId, form.thumbnail, form.title, form.artist);
    let finalTitle = form.title.trim() || parsed.title;
    let finalArtist = form.artist.trim() || parsed.artist;
    let finalThumbnail = form.thumbnail.trim() || parsed.thumbnail;
    const itemId = parsed.playlistId || parsed.videoId || ('item_' + Date.now());

    let tracksToSave = previewTracks;

    // Se for playlist e ainda não tiver faixas carregadas, buscar direto pelo InnerTube (sem Jina)
    if (parsed.playlistId && tracksToSave.length === 0) {
      setLoading(true);
      try {
        const plRes = await fetchPlaylistViaInnerTube(parsed.playlistId);
        tracksToSave = plRes.tracks;
        if (!finalTitle || finalTitle.startsWith('Playlist (')) finalTitle = plRes.title;
        if (!finalArtist || finalArtist === 'YouTube Music') finalArtist = plRes.author;
        if (!finalThumbnail) finalThumbnail = plRes.thumbnail;
      } catch (fetchErr) {
        setError(`[Adicionar Playlist] Falha ao obter dados via InnerTube: ${fetchErr.message || fetchErr}`);
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
      setPlaylistDiagnostics(null);
      await loadLibrary();

      if (parsed.playlistId) {
        setLastAddedPlaylist({
          playlistId: parsed.playlistId,
          title: newItem.title,
          artist: newItem.artist,
          thumbnail: newItem.thumbnail,
          tracksCount: tracksToSave.length,
          firstTrack: firstTrackStr,
          lastTrack: lastTrackStr,
          tracks: tracksToSave,
        });
      }

      showFeedback(parsed.playlistId ? `Playlist "${newItem.title}" (${tracksToSave.length} faixas) adicionada!` : 'Música adicionada com sucesso!');
    } catch (err) {
      setError(`Falha ao salvar no backend/Ramal: ${err.message || err}`);
    }
  };

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
        setError(`[Salvar Edição] Falha ao obter dados da playlist: ${fetchErr.message || fetchErr}`);
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
      setPlaylistDiagnostics(null);
      await loadLibrary();
      showFeedback('Item atualizado com sucesso!');
    } catch (err) {
      setError(`Falha ao salvar alterações: ${err.message || err}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      const allEntries = [...(libraryData.songs || []), ...(libraryData.albums || []), ...(libraryData.artists || []), ...(libraryData.playlists || [])];
      const itemToDelete = allEntries.find(it => String(it.id || it.videoId || it.playlistId) === String(id));
      const kind = classifyItemKind(itemToDelete);
      await libraryBranch('DELETE', { id, kind });
      setConfirmDeleteId(null);
      await loadLibrary();
      showFeedback('Item removido da biblioteca.');
    } catch (err) {
      setError(err.message || 'Falha ao excluir item da biblioteca.');
    }
  };

  // Captura automática e resolução direta via InnerTube
  const handleUrlChange = async (val) => {
    const updatedForm = { ...form, urlOrId: val };
    const parsed = parseLabMusicUrl(val);
    setError('');
    setPlaylistDiagnostics(null);

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

          setPlaylistDiagnostics({
            status: `InnerTube Sucesso (${innerTubeRes.tracks.length} faixas com videoId nativo)`,
            received: 'sim',
            endpoint: 'youtubei/v1/browse',
            browseId: innerTubeRes.browseId,
            tracksCount: innerTubeRes.tracks.length,
            videoIdsCount: innerTubeRes.tracks.filter(t => Boolean(t.videoId)).length,
            firstTrack: innerTubeRes.tracks[0] ? `${innerTubeRes.tracks[0].title} — ${innerTubeRes.tracks[0].artist}` : '—',
            lastTrack: innerTubeRes.tracks.length > 0 ? `${innerTubeRes.tracks[innerTubeRes.tracks.length - 1].title} — ${innerTubeRes.tracks[innerTubeRes.tracks.length - 1].artist}` : '—',
            error: '',
          });
        } catch (err) {
          setPlaylistDiagnostics({
            status: 'Falha no InnerTube',
            received: 'não',
            endpoint: 'youtubei/v1/browse',
            browseId: `VL${parsed.playlistId}`,
            tracksCount: 0,
            videoIdsCount: 0,
            firstTrack: '—',
            lastTrack: '—',
            error: err.message || String(err),
          });
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

  const currentPreviewParsed = form.urlOrId ? parseLabMusicUrl(form.urlOrId) : null;
  const isPlaylistFlow = currentPreviewParsed?.type === 'playlist' || currentPreviewParsed?.type === 'mix' || currentPreviewParsed?.type === 'album' || Boolean(currentPreviewParsed?.playlistId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-editor-fade-in pb-12">
      {/* Banner de Laboratório */}
      <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4 flex items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/20 text-violet-300">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Laboratório Test-IDs — InnerTube Direto & Fila do Player</h3>
            <p className="text-xs text-slate-400">Captura de playlists via browseId nativo (VL+ID) com videoIds reais e reprodução imediata</p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> InnerTube Online
        </span>
      </div>

      {/* SEÇÃO ISOLADA: TESTE DO MÉTODO INNERTUBE (youtubei/v1/browse) */}
      <section className="rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-[#081220] to-[#0a0d15] p-5 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-cyan-400" />
              Teste Isolado: Método InnerTube (youtubei/v1/browse)
            </h3>
            <p className="text-xs text-slate-400">
              Consulta direta ao endpoint nativo WEB_REMIX do YouTube Music (OpenTune / InnerTube client)
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-md">
            Mapeamento Direto de videoIds
          </span>
        </div>

        {/* Formulário de IDs do Teste */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 bg-black/50 p-3.5 rounded-xl border border-white/10 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-semibold">Playlist ID:</label>
            <input
              type="text"
              value={innertubePlaylistId}
              onChange={e => {
                const val = e.target.value;
                setInnertubePlaylistId(val);
                if (val.startsWith('PL') || val.startsWith('RD') || val.startsWith('OLAK5uy_')) {
                  setInnertubeBrowseId(val.startsWith('VL') ? val : `VL${val}`);
                }
              }}
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-1.5 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-semibold">Browse ID (VL + PlaylistID):</label>
            <input
              type="text"
              value={innertubeBrowseId}
              onChange={e => setInnertubeBrowseId(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-1.5 text-cyan-300 font-bold outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled={innertubeLoading}
              onClick={() => handleExecuteInnerTubeTest(innertubeBrowseId)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white transition shadow-lg shadow-cyan-600/30 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <RefreshCw size={14} className={innertubeLoading ? 'animate-spin' : ''} />
              {innertubeLoading ? 'Consultando InnerTube...' : 'Executar Chamada InnerTube'}
            </button>
          </div>
        </div>

        {/* Diagnóstico Visível da Chamada InnerTube */}
        {innertubeResult && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono text-slate-200 bg-black/60 p-3.5 rounded-xl border border-cyan-500/30">
              <div>STATUS HTTP:<br/><span className={innertubeResult.statusHttp?.includes('200') ? 'text-emerald-400 font-bold text-xs' : 'text-rose-400 font-bold text-xs'}>{innertubeResult.statusHttp}</span></div>
              <div>ENDPOINT:<br/><span className="text-cyan-300 font-bold text-xs truncate block" title={innertubeResult.endpoint}>youtubei/v1/browse</span></div>
              <div>BROWSE ID:<br/><span className="text-amber-300 font-bold text-xs truncate block">{innertubeResult.browseId}</span></div>
              <div>NOME DA PLAYLIST:<br/><span className="text-white font-bold text-xs truncate block" title={innertubeResult.playlistTitle}>{innertubeResult.playlistTitle}</span></div>
              <div>QUANTIDADE DE ITENS:<br/><span className="text-violet-300 font-bold text-xs">{innertubeResult.tracksCount} faixas</span></div>
              <div>QUANTIDADE DE VIDEO IDs:<br/><span className="text-emerald-300 font-bold text-xs">{innertubeResult.videoIdsCount} IDs</span></div>
              <div className="col-span-2">1ª FAIXA:<br/><span className="text-emerald-300 font-semibold text-xs truncate block">{innertubeResult.tracks?.[0] ? `${innertubeResult.tracks[0].title} — ${innertubeResult.tracks[0].artist}` : '—'}</span></div>
              <div className="col-span-2 sm:col-span-4">ÚLTIMO ITEM:<br/><span className="text-slate-300 font-semibold text-xs truncate block">{innertubeResult.tracks?.length ? `${innertubeResult.tracks[innertubeResult.tracks.length - 1].title} — ${innertubeResult.tracks[innertubeResult.tracks.length - 1].artist}` : '—'}</span></div>
              {innertubeResult.error && (
                <div className="col-span-2 sm:col-span-4 text-rose-400 font-bold">ERRO REAL: {innertubeResult.error}</div>
              )}
            </div>

            {/* BOTÕES DE AÇÃO DO INNERTUBE: ADICIONAR À BIBLIOTECA & REPRODUZIR NO PLAYER */}
            {innertubeResult.tracks && innertubeResult.tracks.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-cyan-950/40 p-3 rounded-xl border border-cyan-500/30">
                <div className="text-xs font-mono text-cyan-200">
                  <span className="font-bold text-white">{innertubeResult.playlistTitle}</span> — <span className="text-emerald-400 font-bold">{innertubeResult.tracks.length} faixas com videoId</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddInnerTubePlaylistToLibrary(innertubeResult.browseId)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-violet-600/30 active:scale-95 disabled:opacity-50"
                  >
                    <Plus size={14} /> Adicionar à Biblioteca Pessoal
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlayInnerTubePlaylistSample(innertubeResult.tracks, innertubeResult.playlistTitle)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-emerald-600/30 active:scale-95"
                  >
                    <Play size={14} className="fill-white" /> Testar/Reproduzir Playlist ({innertubeResult.tracks.length} faixas)
                  </button>
                </div>
              </div>
            )}

            {/* TABELA DE FAIXAS ESTRUTURADAS RETORNADAS PELO INNERTUBE */}
            {innertubeResult.tracks && innertubeResult.tracks.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                    <Sparkles size={14} /> Faixas Estruturadas do InnerTube ({innertubeResult.tracks.length} faixas com videoId nativo):
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Extração direta de musicResponsiveListItemRenderer
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-cyan-500/30 bg-black/80 max-h-64">
                  <table className="w-full text-left text-[11px] font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-cyan-500/20 bg-cyan-950/40 text-cyan-300 text-[10px] uppercase">
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th className="py-2.5 px-3">TÍTULO DA FAIXA</th>
                        <th className="py-2.5 px-3">ARTISTA</th>
                        <th className="py-2.5 px-3">VIDEO ID</th>
                        <th className="py-2.5 px-3">BROWSE ID / ÁLBUM</th>
                        <th className="py-2.5 px-3 w-20">DURAÇÃO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {innertubeResult.tracks.map((t, idx) => (
                        <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                          <td className="py-2 px-3 text-cyan-400 font-bold">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-white truncate max-w-[220px]">{t.title}</td>
                          <td className="py-2 px-3 text-slate-300 truncate max-w-[150px]">{t.artist}</td>
                          <td className="py-2 px-3">
                            {t.videoId ? (
                              <span className="text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                                {t.videoId}
                              </span>
                            ) : (
                              <span className="text-rose-400 italic">Ausente</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-400 truncate max-w-[150px]">{t.album || t.browseId || '—'}</td>
                          <td className="py-2 px-3 text-amber-300 font-mono">{t.durationStr || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* DESTAQUE DA PLAYLIST ADICIONADA RECENTEMENTE */}
      {lastAddedPlaylist && (
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-black to-emerald-950/30 p-4 space-y-3 shadow-xl animate-fade-in font-mono text-xs">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
            <span className="text-emerald-300 font-bold flex items-center gap-2">
              <Check size={16} className="text-emerald-400" /> Playlist Adicionada com Sucesso à Biblioteca Pessoal:
            </span>
            <span className="text-[10px] text-slate-400">ID: {lastAddedPlaylist.playlistId}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Título da Playlist</span>
              <span className="text-white font-bold text-sm truncate block">{lastAddedPlaylist.title}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Quantidade de Faixas</span>
              <span className="text-emerald-300 font-bold text-sm block">{lastAddedPlaylist.tracksCount} faixas</span>
            </div>
            <div className="truncate">
              <span className="text-slate-400 text-[10px] uppercase block">1ª Faixa</span>
              <span className="text-slate-200 font-medium truncate block">{lastAddedPlaylist.firstTrack}</span>
            </div>
            <div className="truncate">
              <span className="text-slate-400 text-[10px] uppercase block">Último Item</span>
              <span className="text-slate-200 font-medium truncate block">{lastAddedPlaylist.lastTrack}</span>
            </div>
          </div>
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => handlePlaySong({ playlistId: lastAddedPlaylist.playlistId, title: lastAddedPlaylist.title, artist: lastAddedPlaylist.artist, thumbnail: lastAddedPlaylist.thumbnail, tracks: lastAddedPlaylist.tracks })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer"
            >
              <Play size={15} className="fill-white" /> Testar/Reproduzir Playlist no Player
            </button>
          </div>
        </div>
      )}

      {/* Cabeçalho da Biblioteca */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-300 shadow-lg shadow-violet-950/40">
            <Library size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Biblioteca Pessoal (Lab Test-IDs)
              <span className="text-xs font-mono font-normal text-violet-400 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-full">
                {allSongs.length} {allSongs.length === 1 ? 'item' : 'itens'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Colar link → Capturar via InnerTube → Mostrar prévia → Adicionar à Biblioteca
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLibrary}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
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

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2.5 text-xs text-emerald-300 shadow-md animate-fade-in">
          <Check size={15} className="shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/60 p-4 text-xs text-rose-200 shadow-xl animate-fade-in font-mono">
          <X size={16} className="shrink-0 text-rose-400 mt-0.5" />
          <div className="space-y-1 overflow-x-auto">
            <p className="font-bold text-rose-300 font-sans">Erro Detectado:</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Formulário de Criação / Edição */}
      {(creating || editingItem) && (
        <form 
          onSubmit={creating ? handleCreate : handleSaveEdit} 
          className="rounded-2xl border border-violet-500/30 bg-[#0a0d15] p-5 space-y-4 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-violet-400" />
              {creating ? (isPlaylistFlow ? 'Adicionar Playlist via InnerTube' : 'Adicionar Música') : 'Editar Item'}
            </h3>
            <button
              type="button"
              onClick={() => { setCreating(false); setEditingItem(null); setPreviewTracks([]); setPlaylistDiagnostics(null); }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Link2 size={13} className="text-violet-400" /> Colar Link do YouTube ou YouTube Music (Música ou Playlist)
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Captura Automática (InnerTube)</span>
              </label>
              <input
                type="text"
                required
                placeholder="https://music.youtube.com/playlist?list=PL... ou https://music.youtube.com/watch?v=..."
                value={form.urlOrId}
                onChange={e => handleUrlChange(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-violet-500 transition font-mono"
              />
            </div>

            {form.urlOrId && (() => {
              const previewParsed = parseLabMusicUrl(form.urlOrId);
              const isValid = previewParsed !== null && (Boolean(previewParsed.videoId) || Boolean(previewParsed.playlistId));
              return (
                <div className="md:col-span-2 rounded-xl bg-violet-950/30 border border-violet-500/30 p-3 space-y-1.5 text-xs font-mono">
                  <p className="text-violet-300 font-bold flex items-center gap-1.5">
                    <Sparkles size={13} /> Diagnóstico do Link Detectado:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                    <div>Status: <span className={isValid ? 'text-emerald-400 font-bold' : 'text-rose-400'}>{isValid ? 'Válido' : 'Inválido'}</span></div>
                    <div>Tipo: <span className="text-violet-300 font-bold">{previewParsed?.type || 'N/A'}</span></div>
                    <div>Video ID: <span className="text-emerald-300 font-bold">{previewParsed?.videoId || 'N/A'}</span></div>
                    <div>Playlist ID: <span className="text-amber-300 font-bold">{previewParsed?.playlistId || 'N/A'}</span></div>
                  </div>
                </div>
              );
            })()}

            {/* PAINEL DE DIAGNÓSTICO DO INNERTUBE NO FORMULÁRIO */}
            {playlistDiagnostics && (
              <div className="md:col-span-2 rounded-2xl bg-black/90 border border-cyan-500/60 p-4 space-y-3 text-xs font-mono shadow-2xl animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <p className="text-cyan-300 font-bold flex items-center gap-1.5 text-sm">
                    <Sparkles size={16} /> DIAGNÓSTICO INNERTUBE (youtubei/v1/browse):
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Engine: YouTube Music InnerTube Client
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-200 bg-white/5 p-3 rounded-xl border border-white/10">
                  <div>STATUS:<br/><span className={playlistDiagnostics.status?.includes('Sucesso') ? 'text-emerald-400 font-bold text-xs' : 'text-amber-400 font-bold text-xs'}>{playlistDiagnostics.status}</span></div>
                  <div>BROWSE ID:<br/><span className="text-amber-300 font-bold text-xs">{playlistDiagnostics.browseId}</span></div>
                  <div>QUANTIDADE DE FAIXAS:<br/><span className="text-violet-300 font-bold text-xs">{playlistDiagnostics.tracksCount} faixas</span></div>
                  <div>1ª FAIXA:<br/><span className="text-emerald-300 font-bold text-xs truncate block">{playlistDiagnostics.firstTrack}</span></div>
                  <div>ÚLTIMO ITEM:<br/><span className="text-slate-300 font-bold text-xs truncate block">{playlistDiagnostics.lastTrack}</span></div>
                  <div>ERRO REAL:<br/><span className="text-rose-400 font-bold text-xs">{playlistDiagnostics.error || 'Nenhum'}</span></div>
                </div>
              </div>
            )}

            {(form.thumbnail || previewLoading || previewTracks.length > 0) && (
              <div className="md:col-span-2 rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                    <Disc size={14} className={previewLoading ? 'animate-spin' : ''} /> Prévia {isPlaylistFlow ? 'da Playlist (InnerTube)' : 'da Música'}
                  </span>
                  {previewLoading && <span className="text-[11px] text-cyan-300 animate-pulse font-mono">Obtendo faixas via InnerTube...</span>}
                </div>

                <div className="flex items-center gap-3">
                  <img 
                    src={form.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150'} 
                    alt="Capa" 
                    className="h-16 w-16 rounded-xl object-cover border border-white/10 shadow-md shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Título</label>
                      <input
                        type="text"
                        required
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Artista / Canal</label>
                      <input
                        type="text"
                        value={form.artist}
                        onChange={e => setForm({ ...form, artist: e.target.value })}
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {isPlaylistFlow && previewTracks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                      <span>Faixas retornadas pelo InnerTube com videoId ({previewTracks.length}):</span>
                      <span className="text-[10px] text-emerald-400 font-mono">100% videoIds nativos</span>
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono">
                      {previewTracks.slice(0, 5).map((t, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                          <span className="font-mono text-cyan-400 w-5">{idx + 1}.</span>
                          <span className="truncate text-white font-medium flex-1">{t.title}</span>
                          <span className="truncate text-slate-400 max-w-[120px]">{t.artist}</span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">{t.videoId}</span>
                        </div>
                      ))}
                      {previewTracks.length > 5 && (
                        <p className="text-[10px] text-slate-500 text-center italic font-sans">+ {previewTracks.length - 5} outras faixas</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões de Ação do Formulário */}
          <div className="flex gap-2 justify-end pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => { setCreating(false); setEditingItem(null); setPreviewTracks([]); setPlaylistDiagnostics(null); }}
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
              {creating ? (isPlaylistFlow ? 'Adicionar Playlist' : 'Adicionar Música') : 'Atualizar Item'}
            </button>
          </div>
        </form>
      )}

      {loading && !allSongs.length && (
        <div className="py-12 text-center text-xs text-slate-400">
          <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-violet-400" />
          Carregando itens...
        </div>
      )}

      {!loading && !allSongs.length && !creating && (
        <div className="rounded-3xl border border-white/10 bg-[#0a0d15] p-12 text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
            <Music size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Laboratório vazio</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Adicione músicas ou playlists do YouTube / YouTube Music.
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

      {/* Grid de Itens Salvos na Biblioteca */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allSongs.map(song => {
          const isDeleting = confirmDeleteId === song.id;
          const isPlaylist = song.type === 'playlist' || song.type === 'mix' || song.type === 'album' || Boolean(song.playlistId);
          const songThumb = song.thumbnail || song.cover || song.image || (
            song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150'
          );

          const isThisSongActive = currentPlayingTrack && (
            (song.videoId && currentPlayingTrack.videoId === song.videoId) ||
            (currentPlayingTrack.id === song.id)
          );
          const isThisSongPlaying = isThisSongActive && isPlaying;

          const tracksList = song.rawRef?.tracks || song.tracks || [];
          const tracksCount = song.rawRef?.tracksCount || tracksList.length || 0;
          const firstTrackStr = song.rawRef?.firstTrack || (tracksList[0] ? `${tracksList[0].title} — ${tracksList[0].artist}` : '—');
          const lastTrackStr = song.rawRef?.lastTrack || (tracksList.length > 0 ? `${tracksList[tracksList.length - 1].title} — ${tracksList[tracksList.length - 1].artist}` : '—');

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
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 shadow-md">
                  <img
                    src={songThumb}
                    alt={song.title}
                    className={`h-full w-full object-cover transition duration-300 ${isThisSongPlaying ? 'scale-105' : 'group-hover:scale-105'}`}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />

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

                  {isThisSongPlaying && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-violet-600 shadow-sm">
                      <span className="w-1 h-2 bg-white rounded-full animate-pulse"></span>
                      <span className="w-1 h-3 bg-white rounded-full animate-pulse delay-75"></span>
                      <span className="w-1 h-1.5 bg-white rounded-full animate-pulse delay-150"></span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    {isThisSongActive && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase font-mono bg-violet-500 text-white px-1.5 py-0.5 rounded-sm shadow-xs">
                        <Volume2 size={10} /> Tocando
                      </span>
                    )}
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                      isPlaylist 
                        ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/40' 
                        : 'text-violet-300 bg-violet-500/15 border border-violet-500/30'
                    }`}>
                      {isPlaylist ? 'PLAYLIST' : 'MÚSICA'}
                    </span>
                    {song.videoId && (
                      <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded" title="Video ID">
                        vid: {song.videoId}
                      </span>
                    )}
                    {song.playlistId && (
                      <span className="text-[9px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded" title="Playlist ID">
                        pid: {song.playlistId}
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

              {/* Informações estendidas da Playlist: Quantidade de faixas, 1ª faixa e Último item */}
              {isPlaylist && (
                <div className="bg-black/60 rounded-xl p-2.5 border border-white/5 space-y-1 text-[10px] font-mono text-slate-300">
                  <div className="flex items-center justify-between text-cyan-300 font-bold">
                    <span className="flex items-center gap-1"><ListMusic size={12} /> {tracksCount} Faixas Salvas</span>
                    <span className="text-[9px] text-slate-500">InnerTube</span>
                  </div>
                  <div className="truncate text-slate-400">
                    <span className="text-slate-500">1ª:</span> {firstTrackStr}
                  </div>
                  <div className="truncate text-slate-400">
                    <span className="text-slate-500">Última:</span> {lastTrackStr}
                  </div>
                </div>
              )}

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
                      {!isPlaylist && (
                        <button
                          onClick={() => handleAddToQueue(song)}
                          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer"
                          title="Adicionar à fila"
                        >
                          <ListPlus size={15} />
                        </button>
                      )}

                      <button
                        onClick={() => handleStartEdit(song)}
                        className="p-1.5 rounded-lg hover:bg-white/10 hover:text-violet-300 transition cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDelete(song.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 transition cursor-pointer"
                        title="Remover"
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
