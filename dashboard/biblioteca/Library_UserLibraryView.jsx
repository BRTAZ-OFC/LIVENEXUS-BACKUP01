import React, { useState } from 'react';
import { Library, Music, Disc, User, ListMusic, Play, Trash2, ArrowLeft } from 'lucide-react';
import { useUserLibrary, classifyItemKind } from '@dashboard/biblioteca/Library_useUserLibrary';
import { playTrack } from '@dashboard/biblioteca/Library_youtubePlayer';
import { queueManager } from '@dashboard/biblioteca/Library_queueManager';

export default function UserLibraryView({ onBack, onActivate }) {
  const { songs, albums, artists, playlists, totalCount, remove } = useUserLibrary();
  const [filter, setFilter] = useState('all'); // all | songs | albums | artists | playlists

  const displayedItems = (() => {
    if (filter === 'songs') return songs;
    if (filter === 'albums') return albums;
    if (filter === 'artists') return artists;
    if (filter === 'playlists') return playlists;
    return [...songs, ...albums, ...artists, ...playlists];
  })();

  const handlePlay = async (item) => {
    const itemKind = classifyItemKind(item);
    const raw = item.rawRef || {};
    const isPlaylist = itemKind === 'playlist' || itemKind === 'album' || item.type === 'playlist' || item.type === 'mix' || Boolean(item.playlistId) || Boolean(raw.playlistId);

    if (isPlaylist) {
      let tracksToPlay = raw.tracks || item.tracks || [];
      const pId = item.playlistId || raw.playlistId || item.id;
      if (tracksToPlay.length === 0 && pId) {
        try {
          const { getPlaylistItems } = await import('@dashboard/biblioteca/Library_musicSearch');
          tracksToPlay = await getPlaylistItems(pId);
        } catch {}
      }
      if (tracksToPlay.length > 0) {
        const queueTracks = tracksToPlay.map((t, idx) => ({
          id: t.videoId || `${pId}_${idx}`,
          videoId: t.videoId,
          title: t.title,
          artist: t.artist || item.artist || 'YouTube Music',
          album: t.album || '',
          durationStr: t.durationStr || '',
          thumbnail: t.thumbnail || item.thumbnail,
          source: t.source || 'YouTube Music',
          type: 'song',
        }));
        queueManager.setQueue(queueTracks, 0);
        playTrack(queueTracks[0]);
        return;
      }
    }

    const track = {
      videoId: raw.videoId || item.videoId || (itemKind === 'song' ? item.id : null),
      title: item.title,
      artist: item.artist,
      thumbnail: item.thumbnail,
      durationStr: raw.durationStr || '',
      streamUrl: raw.streamUrl || null,
      audioUrl: raw.audioUrl || null,
    };

    if (track.videoId || track.streamUrl || track.audioUrl) {
      if (songs.length > 0) {
        const queueTracks = songs.map((s) => ({
          videoId: s.rawRef?.videoId || s.videoId || s.id,
          title: s.title,
          artist: s.artist,
          thumbnail: s.thumbnail,
          durationStr: s.rawRef?.durationStr || '',
        }));
        const idx = queueTracks.findIndex((t) => t.videoId === track.videoId);
        queueManager.setQueue(queueTracks, idx >= 0 ? idx : 0);
      }
      playTrack(track);
    } else if (onActivate) {
      onActivate(item);
    }
  };

  const getIcon = (kind) => {
    switch (kind) {
      case 'album': return Disc;
      case 'artist': return User;
      case 'playlist': return ListMusic;
      default: return Music;
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra superior de controle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-white/5 text-[#B3B3B3] hover:text-white hover:bg-white/10 transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-base font-bold text-white leading-tight flex items-center gap-2">
              <Library className="w-4 h-4 text-[#FF9E9E]" /> Sua Biblioteca Pessoal
            </h2>
            <p className="text-[11px] text-[#B3B3B3]">
              {totalCount} {totalCount === 1 ? 'item salvo' : 'itens salvos'} sincronizados na sua conta
            </p>
          </div>
        </div>
      </div>

      {/* Filtros por categoria */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full transition-colors ${
            filter === 'all'
              ? 'bg-[#FF9E9E] text-slate-950 font-bold'
              : 'bg-white/5 text-[#B3B3B3] hover:text-white hover:bg-white/10'
          }`}
        >
          Tudo ({totalCount})
        </button>
        <button
          onClick={() => setFilter('songs')}
          className={`px-3 py-1 rounded-full transition-colors ${
            filter === 'songs'
              ? 'bg-[#FF9E9E] text-slate-950 font-bold'
              : 'bg-white/5 text-[#B3B3B3] hover:text-white hover:bg-white/10'
          }`}
        >
          Músicas ({songs.length})
        </button>
        <button
          onClick={() => setFilter('albums')}
          className={`px-3 py-1 rounded-full transition-colors ${
            filter === 'albums'
              ? 'bg-[#FF9E9E] text-slate-950 font-bold'
              : 'bg-white/5 text-[#B3B3B3] hover:text-white hover:bg-white/10'
          }`}
        >
          Álbuns ({albums.length})
        </button>
        <button
          onClick={() => setFilter('artists')}
          className={`px-3 py-1 rounded-full transition-colors ${
            filter === 'artists'
              ? 'bg-[#FF9E9E] text-slate-950 font-bold'
              : 'bg-white/5 text-[#B3B3B3] hover:text-white hover:bg-white/10'
          }`}
        >
          Artistas ({artists.length})
        </button>
        <button
          onClick={() => setFilter('playlists')}
          className={`px-3 py-1 rounded-full transition-colors ${
            filter === 'playlists'
              ? 'bg-[#FF9E9E] text-slate-950 font-bold'
              : 'bg-white/5 text-[#B3B3B3] hover:text-white hover:bg-white/10'
          }`}
        >
          Playlists ({playlists.length})
        </button>
      </div>

      {/* Lista ou estado vazio */}
      {displayedItems.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#FF9E9E]/10 border border-[#FF9E9E]/20 text-[#FF9E9E] flex items-center justify-center mx-auto">
            <Library className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-white">Sua biblioteca está vazia nesta categoria</p>
          <p className="text-xs text-[#B3B3B3] max-w-sm mx-auto">
            Toque no botão "+" em qualquer música, artista, álbum ou playlist da Galeria para adicionar à sua coleção pessoal permanente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {displayedItems.map((item, index) => {
            const itemKind = classifyItemKind(item);
            const Icon = getIcon(itemKind);
            const isSong = itemKind === 'song';
            const itemKey = item.id || item.videoId || item.playlistId || item.browseId || String(index);
            return (
              <div
                key={itemKey}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all group"
              >
                {/* Thumbnail / avatar com play overlay */}
                <button
                  onClick={() => (isSong ? handlePlay(item) : onActivate?.(item))}
                  className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0"
                >
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      <Icon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </button>

                {/* Metadados */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => (isSong ? handlePlay(item) : onActivate?.(item))}
                >
                  <div className="text-xs font-semibold text-white truncate">{item.title}</div>
                  <div className="text-[11px] text-[#B3B3B3] truncate flex items-center gap-1.5 mt-0.5">
                    <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                      {itemKind === 'song' ? 'música' : itemKind === 'artist' ? 'artista' : itemKind === 'album' ? 'álbum' : 'playlist'}
                    </span>
                    {item.artist && <span>{item.artist}</span>}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => remove(item)}
                    className="p-1.5 rounded-lg text-[#B3B3B3] hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="Remover da biblioteca"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
