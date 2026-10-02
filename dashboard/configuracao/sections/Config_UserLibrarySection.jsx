// UserLibrarySection — Gerenciamento da Biblioteca Salva do Usuário com Reprodução Real
import React, { useState, useEffect, useCallback } from 'react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import { 
  Library, Plus, Edit3, Trash2, Check, X, RefreshCw, 
  Music, Play, Pause, ListPlus, Image as ImageIcon, Link2, Volume2, Sparkles, Copy 
} from 'lucide-react';
import { localCache } from '@dashboard/configuracao/Config_localCache';
import { playTrack, play, pause } from '@dashboard/biblioteca/Library_youtubePlayer';
import { queueManager } from '@dashboard/biblioteca/Library_queueManager';
import { useMusicPlayer } from '@dashboard/biblioteca/Library_useMusicPlayer';
import { parseMusicUrl, isValidVideoId } from '@dashboard/biblioteca/Library_musicUrlManager';

export default function UserLibrarySection() {
  const { libraryBranch, userId } = useNewUserDataCentral();
  const { track: currentPlayingTrack, isPlaying } = useMusicPlayer();

  const [libraryData, setLibraryData] = useState(() => {
    if (userId) {
      const cached = localCache.get(userId, 'library');
      if (cached && typeof cached === 'object') return cached;
    }
    return { songs: [], albums: [], artists: [], playlists: [] };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [creating, setCreating] = useState(false);

  // Playlist ID Extractor States
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [extractedPlaylistId, setExtractedPlaylistId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showExtractor, setShowExtractor] = useState(false);

  const extractPlaylistId = (url) => {
    if (!url) return '';
    try {
      const trimmed = url.trim();
      if (trimmed.startsWith('http')) {
        const urlObj = new URL(trimmed);
        const listId = urlObj.searchParams.get('list');
        if (listId) return listId;
      }
      const match = trimmed.match(/[&?]list=([^&]+)/);
      if (match && match[1]) return match[1];
      if (trimmed.startsWith('PL') || trimmed.startsWith('RD') || trimmed.startsWith('UU') || trimmed.startsWith('FL')) {
        return trimmed;
      }
    } catch (e) {
      const match = url.trim().match(/[&?]list=([^&]+)/);
      if (match && match[1]) return match[1];
    }
    return '';
  };

  // Form states
  const [form, setForm] = useState({
    title: '',
    artist: '',
    urlOrId: '',
    thumbnail: '',
  });

  const loadLibrary = useCallback(async () => {
    if (!userId) return;
    const cached = localCache.get(userId, 'library');
    if (cached) setLibraryData(cached);

    setLoading(!cached);
    setError('');
    try {
      const data = await libraryBranch('GET');
      if (data && typeof data === 'object') {
        setLibraryData(data);
        localCache.set(userId, 'library', data);
      }
    } catch (err) {
      if (!cached) setError(err.message || 'Erro ao carregar biblioteca salva.');
    } finally {
      setLoading(false);
    }
  }, [userId, libraryBranch]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const allSongs = Array.isArray(libraryData?.songs) ? libraryData.songs : [];

  // Extrai informações inteligentes de um link ou ID
  const parseInputToTrackData = (rawUrlOrId, customThumb = '', title = '', artist = '') => {
    const trimmed = (rawUrlOrId || '').trim();
    let videoId = null;
    let audioUrl = null;
    let streamUrl = null;

    if (trimmed) {
      const parsed = parseMusicUrl(trimmed);
      if (parsed && parsed.videoId) {
        videoId = parsed.videoId;
      } else if (isValidVideoId(trimmed)) {
        videoId = trimmed;
      } else if (/^https?:\/\/.*\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(trimmed)) {
        audioUrl = trimmed;
      } else if (/^https?:\/\//i.test(trimmed)) {
        streamUrl = trimmed;
      }
    }

    let resolvedThumbnail = (customThumb || '').trim();
    if (!resolvedThumbnail && videoId) {
      resolvedThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }

    return {
      videoId,
      audioUrl,
      streamUrl,
      thumbnail: resolvedThumbnail,
      title: title.trim() || (videoId ? `Faixa (${videoId})` : 'Música Sem Título'),
      artist: artist.trim() || 'Artista Desconhecido',
    };
  };

  const showFeedback = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Reproduzir música no Player Real
  const handlePlaySong = (song) => {
    const rawRef = song.rawRef || {};
    const parsed = parseInputToTrackData(song.url || song.videoId || song.audioUrl || song.id, song.thumbnail || song.cover || song.image, song.title, song.artist);
    
    const trackToPlay = {
      id: song.id,
      videoId: song.videoId || rawRef.videoId || parsed.videoId || (song.id.length === 11 ? song.id : null),
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

    // Configura a fila a partir de todas as músicas da biblioteca
    if (allSongs.length > 0) {
      const queueList = allSongs.map((s) => {
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
      queueManager.setQueue(queueList, currentIdx >= 0 ? currentIdx : 0);
    }

    playTrack(trackToPlay);
    showFeedback(`Reproduzindo: ${trackToPlay.title}`);
  };

  // Adicionar à fila do player
  const handleAddToQueue = (song) => {
    const parsed = parseInputToTrackData(song.url || song.videoId || song.audioUrl || song.id, song.thumbnail || song.cover || song.image, song.title, song.artist);
    const track = {
      id: song.id,
      videoId: song.videoId || parsed.videoId || song.id,
      title: song.title || song.name || parsed.title,
      artist: song.artist || parsed.artist,
      thumbnail: song.thumbnail || song.cover || song.image || parsed.thumbnail,
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
    setCreating(true);
  };

  // Iniciar edição
  const handleStartEdit = (song) => {
    setCreating(false);
    setEditingItem(song);
    setForm({
      title: song.title || song.name || '',
      artist: song.artist || '',
      urlOrId: song.url || song.videoId || (song.id.startsWith('song_') ? '' : song.id) || '',
      thumbnail: song.thumbnail || song.cover || song.image || '',
    });
  };

  // Salvar criação
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const parsed = parseInputToTrackData(form.urlOrId, form.thumbnail, form.title, form.artist);
    const songId = parsed.videoId || ('song_' + Date.now());

    const newSong = {
      id: songId,
      videoId: parsed.videoId || songId,
      title: parsed.title,
      artist: parsed.artist,
      thumbnail: parsed.thumbnail,
      url: form.urlOrId.trim(),
      audioUrl: parsed.audioUrl,
      streamUrl: parsed.streamUrl,
      addedAt: Date.now(),
      type: 'song',
      rawRef: {
        videoId: parsed.videoId || songId,
        title: parsed.title,
        artist: parsed.artist,
        thumbnail: parsed.thumbnail,
        audioUrl: parsed.audioUrl,
      }
    };

    try {
      await libraryBranch('POST', { kind: 'song', payload: { item: newSong } });
      setCreating(false);
      setForm({ title: '', artist: '', urlOrId: '', thumbnail: '' });
      await loadLibrary();
      showFeedback('Música adicionada à biblioteca com sucesso!');
    } catch (err) {
      setError(err.message || 'Falha ao adicionar item à biblioteca.');
    }
  };

  // Salvar edição
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    const parsed = parseInputToTrackData(form.urlOrId, form.thumbnail, form.title, form.artist);

    const changes = {
      title: parsed.title,
      artist: parsed.artist,
      thumbnail: parsed.thumbnail,
      url: form.urlOrId.trim(),
      videoId: parsed.videoId || editingItem.videoId || editingItem.id,
      audioUrl: parsed.audioUrl,
      streamUrl: parsed.streamUrl,
      rawRef: {
        ...(editingItem.rawRef || {}),
        videoId: parsed.videoId || editingItem.videoId || editingItem.id,
        title: parsed.title,
        artist: parsed.artist,
        thumbnail: parsed.thumbnail,
        audioUrl: parsed.audioUrl,
      }
    };

    try {
      await libraryBranch('PATCH', { id: editingItem.id, kind: 'song', payload: { changes } });
      setEditingItem(null);
      await loadLibrary();
      showFeedback('Música atualizada com sucesso!');
    } catch (err) {
      setError(err.message || 'Falha ao salvar alterações.');
    }
  };

  // Excluir música
  const handleDelete = async (id) => {
    try {
      await libraryBranch('DELETE', { id, kind: 'song' });
      setConfirmDeleteId(null);
      await loadLibrary();
      showFeedback('Música removida da biblioteca.');
    } catch (err) {
      setError(err.message || 'Falha ao excluir item da biblioteca.');
    }
  };

  // Auto-preenche a thumbnail ao digitar ou colar a URL do YouTube
  const handleUrlChange = (val) => {
    const updatedForm = { ...form, urlOrId: val };
    const parsed = parseMusicUrl(val);
    if (parsed?.videoId && !form.thumbnail) {
      updatedForm.thumbnail = `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`;
    } else if (isValidVideoId(val.trim()) && !form.thumbnail) {
      updatedForm.thumbnail = `https://i.ytimg.com/vi/${val.trim()}/hqdefault.jpg`;
    }
    setForm(updatedForm);
  };

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
                {allSongs.length} {allSongs.length === 1 ? 'música' : 'músicas'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Escolha, edite e toque suas faixas reais diretamente no player integrado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExtractor(!showExtractor)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition cursor-pointer active:scale-95 ${
              showExtractor 
                ? 'border-violet-500/50 bg-violet-500/10 text-violet-300' 
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Link2 size={14} /> Obter ID de Playlist
          </button>
          <button
            onClick={loadLibrary}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Sincronizar com o Ramal"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer shadow-lg shadow-violet-600/30 active:scale-95"
          >
            <Plus size={15} /> Adicionar Música
          </button>
        </div>
      </header>

      {/* Ferramenta de Extração de ID de Playlist */}
      {showExtractor && (
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#0c0f1d] to-[#070913] p-5 space-y-4 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-violet-400" />
              <h3 className="text-sm font-bold text-white">Extrator de ID de Playlist do YouTube / YouTube Music</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowExtractor(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] text-slate-400">
              Cole a URL completa de uma playlist do YouTube ou YouTube Music no campo abaixo. O ID correspondente será extraído automaticamente e poderá ser copiado para uso imediato em seus cenários, widgets e integrações.
            </p>

            <div className="grid gap-4 sm:grid-cols-3 items-end">
              {/* Campo para colar URL */}
              <div className="sm:col-span-2 space-y-1.5 font-sans">
                <label className="text-xs font-semibold text-slate-300">URL da Playlist</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/playlist?list=... ou watch?v=...&list=..."
                  value={playlistUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlaylistUrl(val);
                    const extractedId = extractPlaylistId(val);
                    setExtractedPlaylistId(extractedId);
                  }}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-violet-500 transition font-mono"
                />
              </div>

              {/* Resultado e Botão Copiar */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">ID Extraído</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    placeholder="Nenhum ID detectado"
                    value={extractedPlaylistId}
                    className="w-full rounded-xl border border-white/15 bg-slate-900/50 px-3 py-2 pr-10 text-xs font-semibold text-violet-300 font-mono select-all outline-none"
                  />
                  {extractedPlaylistId && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(extractedPlaylistId);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="absolute right-1.5 p-1.5 rounded-lg text-violet-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                      title="Copiar ID da playlist"
                    >
                      {copied ? <Check size={14} className="text-emerald-400 animate-scale-in" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mensagem de sucesso ao copiar */}
            {copied && (
              <span className="inline-block text-[11px] text-emerald-400 font-medium animate-pulse">
                ID da playlist copiado para a área de transferência!
              </span>
            )}
          </div>
        </div>
      )}

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

      {/* Formulário Unificado de Adicionar / Editar Música */}
      {(creating || editingItem) && (
        <form 
          onSubmit={creating ? handleCreate : handleSaveEdit} 
          className="rounded-2xl border border-violet-500/30 bg-[#0a0d15] p-5 space-y-4 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-violet-400" />
              {creating ? 'Adicionar Nova Música à Biblioteca' : `Editar: ${editingItem.title || 'Música'}`}
            </h3>
            <button
              type="button"
              onClick={() => { setCreating(false); setEditingItem(null); }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Título */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Título da Música / Áudio <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Bohemian Rhapsody"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-violet-500 transition"
              />
            </div>

            {/* Artista */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Artista / Banda
              </label>
              <input
                type="text"
                placeholder="Ex: Queen"
                value={form.artist}
                onChange={e => setForm({ ...form, artist: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-violet-500 transition"
              />
            </div>

            {/* Link ou Video ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Link2 size={13} className="text-violet-400" /> Link YouTube / YouTube Music ou ID
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Ex: URL ou dQw4w9WgXcQ</span>
              </label>
              <input
                type="text"
                placeholder="https://music.youtube.com/watch?v=... ou ID de 11 dígitos"
                value={form.urlOrId}
                onChange={e => handleUrlChange(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-violet-500 transition font-mono"
              />
            </div>

            {/* URL da Capa / Foto */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-violet-400" /> URL da Foto / Capa
                </span>
                <span className="text-[10px] text-violet-400/80 font-normal">Auto-gerada via YouTube se vazio</span>
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

          {/* Pré-visualização da Capa */}
          {form.thumbnail && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <img 
                src={form.thumbnail} 
                alt="Preview da capa" 
                className="h-12 w-12 rounded-lg object-cover border border-white/10 shadow-md"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{form.title || 'Título da Música'}</p>
                <p className="text-[11px] text-slate-400 truncate">{form.artist || 'Artista'}</p>
              </div>
            </div>
          )}

          {/* Botões de Ação do Form */}
          <div className="flex gap-2 justify-end pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => { setCreating(false); setEditingItem(null); }}
              className="rounded-xl bg-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/20 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2 text-xs font-semibold text-white transition cursor-pointer shadow-lg shadow-violet-600/30"
            >
              {creating ? 'Salvar Música' : 'Atualizar Música'}
            </button>
          </div>
        </form>
      )}

      {/* Estado Vazio ou Carregando */}
      {loading && !allSongs.length && (
        <div className="py-12 text-center text-xs text-slate-400">
          <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-violet-400" />
          Carregando músicas da sua biblioteca...
        </div>
      )}

      {!loading && !allSongs.length && !creating && (
        <div className="rounded-3xl border border-white/10 bg-[#0a0d15] p-12 text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
            <Music size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Sua biblioteca está vazia</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Adicione suas músicas favoritas com fotos e links reais para montar sua playlist e ouvir a qualquer momento.
            </p>
          </div>
          <button
            onClick={handleStartCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white transition cursor-pointer shadow-lg shadow-violet-600/30"
          >
            <Plus size={15} /> Adicionar Minha Primeira Música
          </button>
        </div>
      )}

      {/* Grid de Músicas com Player Real */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allSongs.map(song => {
          const isDeleting = confirmDeleteId === song.id;
          const songThumb = song.thumbnail || song.cover || song.image || (
            song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg` : null
          );

          // Verifica se esta música está tocando agora
          const isThisSongActive = currentPlayingTrack && (
            (song.videoId && currentPlayingTrack.videoId === song.videoId) ||
            (currentPlayingTrack.id === song.id)
          );
          const isThisSongPlaying = isThisSongActive && isPlaying;

          return (
            <div
              key={song.id}
              className={`rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between space-y-3 relative group overflow-hidden ${
                isThisSongActive 
                  ? 'border-violet-500 bg-violet-950/20 shadow-lg shadow-violet-950/50 ring-1 ring-violet-500/40' 
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
                      <Music size={22} />
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
                    title={isThisSongPlaying ? 'Pausar música' : 'Tocar agora'}
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
                    <span className="text-[10px] font-mono text-slate-500 truncate">
                      {song.videoId ? `ID: ${song.videoId}` : 'Áudio'}
                    </span>
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
                    <span className="text-[11px] text-rose-200 font-medium">Excluir música?</span>
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
                          : 'bg-white/10 text-white hover:bg-violet-600 hover:shadow-md'
                      }`}
                    >
                      {isThisSongPlaying ? (
                        <>
                          <Pause size={13} className="fill-current" /> Pausar
                        </>
                      ) : (
                        <>
                          <Play size={13} className="fill-current" /> Tocar
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1 text-slate-400">
                      {/* Botão Adicionar à Fila */}
                      <button
                        onClick={() => handleAddToQueue(song)}
                        className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer"
                        title="Adicionar à fila de reprodução"
                      >
                        <ListPlus size={15} />
                      </button>

                      {/* Botão Editar */}
                      <button
                        onClick={() => handleStartEdit(song)}
                        className="p-1.5 rounded-lg hover:bg-white/10 hover:text-violet-300 transition cursor-pointer"
                        title="Editar detalhes e foto"
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
