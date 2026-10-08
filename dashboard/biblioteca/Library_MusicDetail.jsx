import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Plus, Check, Play, AlertCircle } from 'lucide-react';
import { useUserLibrary } from '@dashboard/biblioteca/Library_useUserLibrary';
import {
  searchMusic, getAlbumItems, getPlaylistItems, getMixItems, getRelatedTracks,
} from '@dashboard/biblioteca/Library_musicSearch';
import { buildItemTags } from '@dashboard/biblioteca/Library_buildTags';
import { fetchArtistTags } from '@dashboard/biblioteca/Library_lastfmTags';

// Detalhe aberto "in-place" (sem nova página) ao clicar numa miniatura.
// Lista as faixas do artista/álbum/playlist/mix ou relacionadas (para música).
// O usuário seleciona uma faixa para tocar — não toca automaticamente.
export default function MusicDetail({ item, onBack, onSelect, onAdd, onOpenEntity }) {
  const { isSaved } = useUserLibrary();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lfmTags, setLfmTags] = useState([]);
  const [artistTagMap, setArtistTagMap] = useState({});

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null); setTracks([]);
    (async () => {
      try {
        let list = [];
        if (item.type === 'album' && item.browseId) {
          list = await getAlbumItems(item.browseId);
        } else if (item.playlistId) {
          list = item.type === 'mix' ? await getMixItems(item.playlistId) : await getPlaylistItems(item.playlistId);
        } else if (item.type === 'artist') {
          const r = await searchMusic(item.artist || item.title);
          list = r.items || [];
        } else if (item.type === 'mb_artist' || item.type === 'lastfm_artist') {
          const r = await searchMusic(item.title);
          list = r.items || [];
        } else if (['mb_recording', 'mb_release', 'lastfm_album', 'jamendo_track', 'itunes_track', 'itunes_album', 'deezer_track', 'bandcamp_track', 'bandcamp_album', 'audius_track', 'mixcloud_mix'].includes(item.type)) {
          const q = `${item.artist || ''} ${item.title}`.trim();
          const r = await searchMusic(q);
          list = r.items || [];
        } else if (item.videoId) {
          list = [item];
          try {
            const rel = await getRelatedTracks(item, null, 20);
            const seen = new Set([item.videoId]);
            for (const t of (rel || [])) {
              if (t && t.videoId && !seen.has(t.videoId)) { list.push(t); seen.add(t.videoId); }
            }
          } catch { /* ignore */ }
        }
        if (alive) setTracks((list || []).filter((t) => t && t.videoId));
      } catch (e) {
        if (alive) setError(e.message || 'Erro ao carregar');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [item]);

  useEffect(() => {
    const artist = item.artist || item.channelTitle;
    if (!artist) { setLfmTags([]); return; }
    setLfmTags([]);
    let alive = true;
    fetchArtistTags(artist).then((tags) => { if (alive && tags.length) setLfmTags(tags); });
    return () => { alive = false; };
  }, [item]);

  // Busca tags (Last.fm) por artista de cada faixa diretamente
  useEffect(() => {
    if (!tracks.length) return;
    let alive = true;
    const artists = [...new Set(tracks.map((t) => (t.artist || t.channelTitle || '').trim()).filter(Boolean))].slice(0, 30);
    let idx = 0;
    const worker = async () => {
      while (idx < artists.length && alive) {
        const a = artists[idx++];
        try {
          const tags = await fetchArtistTags(a);
          if (alive && tags.length) setArtistTagMap((prev) => ({ ...prev, [a.toLowerCase()]: tags }));
        } catch { /* ignore */ }
      }
    };
    Promise.all(Array.from({ length: Math.min(4, artists.length) }, worker));
    return () => { alive = false; };
  }, [tracks]);

  const sub = item.artist || item.channelTitle
    || (item.type === 'album' ? 'Álbum' : item.type === 'playlist' ? 'Playlist' : item.type === 'mix' ? 'Mix' : item.type === 'artist' ? 'Artista' : item.type === 'mb_artist' ? 'Artista (MusicBrainz)' : item.type === 'mb_recording' ? 'Gravação (MusicBrainz)' : item.type === 'mb_release' ? 'Lançamento (MusicBrainz)' : item.type === 'lastfm_artist' ? 'Artista (Last.fm)' : item.type === 'lastfm_album' ? 'Álbum (Last.fm)' : item.type === 'jamendo_track' ? 'Jamendo' : item.type === 'itunes_track' ? 'Música (iTunes)' : item.type === 'itunes_album' ? 'Álbum (iTunes)' : item.type === 'deezer_track' ? 'Música (Deezer)' : item.type === 'bandcamp_track' ? 'Faixa (Bandcamp)' : item.type === 'bandcamp_album' ? 'Álbum (Bandcamp)' : item.type === 'audius_track' ? 'Música (Audius)' : item.type === 'mixcloud_mix' ? 'Mix (Mixcloud)' : '');

  // Meta-tags clicáveis: levam à busca de tudo daquela música/playlist/artista.
  const tags = buildItemTags(item, lfmTags);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#B3B3B3] hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar à galeria
      </button>

      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 shrink-0">
          {item.thumbnail && (
            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold text-white truncate">{item.title}</div>
          <div className="text-xs text-[#B3B3B3] truncate">{sub}</div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => onOpenEntity?.({ name: tag.query, kind: tag.kind, label: tag.label })}
                  className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-[#B3B3B3] hover:text-[#FF9E9E] hover:border-[#FF9E9E]/40 transition-colors"
                  title={`Ver tudo de ${tag.label}`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          )}
          {(() => {
            const saved = isSaved(item);
            return (
              <button
                onClick={() => onAdd(item)}
                className={`mt-2 flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] transition-colors ${
                  saved
                    ? 'bg-[#FF9E9E]/25 border-[#FF9E9E] text-white'
                    : 'bg-[#FF9E9E]/15 border-[#FF9E9E]/30 text-[#FF9E9E] hover:bg-[#FF9E9E]/25'
                }`}
              >
                {saved ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {saved ? 'Salvo na biblioteca' : 'Adicionar à biblioteca'}
              </button>
            );
          })()}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-[#B3B3B3]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando faixas...
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-md p-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}
      {!loading && !error && tracks.length === 0 && (
        <div className="text-center py-8 text-sm text-[#B3B3B3]">Nenhuma faixa encontrada.</div>
      )}

      {!loading && tracks.length > 0 && (
        <div className="space-y-1">
          {tracks.map((t, i) => {
            const tTags = buildItemTags(t, artistTagMap[(t.artist || t.channelTitle || '').toLowerCase()] || []);
            const tSaved = isSaved(t);
            return (
              <div key={(t.videoId || 't') + '-' + i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 group">
                <button onClick={() => onSelect(t, tracks)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-white/5 shrink-0 relative">
                    {t.thumbnail && (
                      <img src={t.thumbnail} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                    <Play className="w-4 h-4 text-white/80 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">{t.title}</div>
                    <div className="text-[11px] text-[#B3B3B3] truncate">{t.artist || t.channelTitle}</div>
                    {tTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tTags.map((tag, ti) => (
                          <button
                            key={ti}
                            onClick={() => onOpenEntity?.({ name: tag.query, kind: tag.kind, label: tag.label })}
                            className="px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-[#B3B3B3] hover:text-[#FF9E9E] hover:border-[#FF9E9E]/40 transition-colors"
                            title={`Ver tudo de ${tag.label}`}
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => onAdd(t)}
                  className={`p-1.5 shrink-0 transition-colors ${tSaved ? 'text-[#FF9E9E] hover:text-rose-300' : 'text-[#B3B3B3] hover:text-white'}`}
                  title={tSaved ? 'Remover da biblioteca' : 'Adicionar à biblioteca'}
                >
                  {tSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}