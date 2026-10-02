import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, ChevronDown, ChevronUp, Users, Disc3, User, ListMusic } from 'lucide-react';
import { useUserLibrary } from '@dashboard/biblioteca/Library_useUserLibrary';

// Lista em grade para resultados de pesquisa e seções filtradas.
// Na apresentação recolhida, ocupa SOMENTE UMA FAIXA compacta (1 linha de colunas responsivas).
// "Ver mais" expande verticalmente; "Ver menos" recolhe de volta a 1 linha.
function useCols() {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w >= 1024) setCols(6);
      else if (w >= 768) setCols(5);
      else if (w >= 640) setCols(4);
      else setCols(3);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  return cols;
}

export default function SearchResultGroup({ title, items, contentType, initialRows = 1, onActivate, onAdd }) {
  const { isSaved } = useUserLibrary();
  const cols = useCols();
  const itemsArr = items || [];
  const initialCount = initialRows * cols;
  const [expanded, setExpanded] = useState(false);

  if (!itemsArr.length) return null;

  const visible = expanded ? itemsArr : itemsArr.slice(0, initialCount);
  const hasMore = itemsArr.length > initialCount;
  const remaining = itemsArr.length - initialCount;
  const sub = (it) => it.artist || it.channelTitle || '';

  // Determina o tipo visual do item
  const getItemType = (it) => {
    if (contentType) return contentType;
    if (it.type === 'community_playlist' || (it.playlistId && it.playlistId.startsWith('PL'))) return 'community_playlist';
    if (it.type === 'playlist' || it.type === 'mix') return 'playlist';
    if (it.type === 'artist' || it.type === 'mb_artist' || it.type === 'lastfm_artist') return 'artist';
    if (it.type === 'album' || it.type === 'mb_release' || it.type === 'lastfm_album' || it.type === 'itunes_album' || it.type === 'bandcamp_album') return 'album';
    return 'song';
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {contentType === 'community_playlist' && (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FF9E9E]/20 text-[#FF9E9E] border border-[#FF9E9E]/30">
              <Users className="w-3 h-3" /> Comunidade
            </span>
          )}
          <h4 className="text-sm font-semibold text-white/95">{title}</h4>
        </div>
        <span className="text-[11px] text-[#B3B3B3]">{itemsArr.length}</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
        {visible.map((it, i) => {
          const type = getItemType(it);
          const key = (it.videoId || it.playlistId || it.browseId || it.title) + '-' + i;
          const saved = isSaved(it);

          // 1. TIPO ARTISTA (foto circular, nome de perfil)
          if (type === 'artist') {
            return (
              <div key={key} className="flex flex-col items-center text-center space-y-1.5 p-1 group">
                <button
                  onClick={() => onActivate?.(it)}
                  className="relative w-full aspect-square rounded-full overflow-hidden bg-white/5 border border-white/10 hover:border-[#FF9E9E]/60 transition-all shadow-sm"
                  title={it.title}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-[#FF9E9E]/30">
                    <User className="w-8 h-8 opacity-40" />
                  </div>
                  {it.thumbnail && (
                    <img
                      src={it.thumbnail}
                      alt=""
                      className="relative w-full h-full object-cover rounded-full"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                    <Play className="w-6 h-6 text-white drop-shadow" />
                  </div>
                </button>
                <div className="w-full min-w-0">
                  <div className="text-xs font-semibold text-white truncate group-hover:text-[#FF9E9E] transition-colors">{it.title}</div>
                  <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-medium rounded-full bg-white/5 text-[#B3B3B3] border border-white/10">Artista</span>
                </div>
              </div>
            );
          }

          // 2. TIPO ÁLBUM (capa real com conceito de vinil/disco)
          if (type === 'album') {
            return (
              <div key={key} className="space-y-1.5 group">
                <button
                  onClick={() => onActivate?.(it)}
                  className="relative block w-full rounded-xl overflow-hidden bg-white/5 aspect-square border border-white/10 hover:border-amber-400/50 transition-all shadow-sm"
                  title={it.title}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/5 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center text-amber-400/30">
                    <Disc3 className="w-8 h-8 opacity-40" />
                  </div>
                  {it.thumbnail && (
                    <img
                      src={it.thumbnail}
                      alt=""
                      className="relative w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-amber-400/30 text-[9px] font-medium text-amber-300 flex items-center gap-1 z-10 shadow">
                    <Disc3 className="w-2.5 h-2.5" /> Álbum
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-6 h-6 text-white drop-shadow" />
                  </div>
                </button>
                <div className="flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate group-hover:text-amber-300 transition-colors">{it.title}</div>
                    <div className="text-[11px] text-[#B3B3B3] truncate">{sub(it)}</div>
                  </div>
                  <button
                    onClick={() => onAdd?.(it)}
                    className={`p-1 shrink-0 transition-colors ${saved ? 'text-[#FF9E9E] hover:text-rose-300' : 'text-[#B3B3B3] hover:text-white'}`}
                    title={saved ? 'Remover da biblioteca' : 'Adicionar à biblioteca'}
                  >
                    {saved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          }

          // 3. TIPO PLAYLIST DA COMUNIDADE (identificação visual explícita, badge destacado, cor e ícone)
          if (type === 'community_playlist') {
            return (
              <div key={key} className="space-y-1.5 group">
                <button
                  onClick={() => onActivate?.(it)}
                  className="relative block w-full rounded-xl overflow-hidden bg-white/5 aspect-square border border-[#FF9E9E]/30 hover:border-[#FF9E9E]/70 transition-all shadow-sm"
                  title={it.title}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />
                  <div className="absolute inset-0 flex items-center justify-center text-[#FF9E9E]/30">
                    <Users className="w-8 h-8 opacity-40" />
                  </div>
                  {it.thumbnail && (
                    <img
                      src={it.thumbnail}
                      alt=""
                      className="relative w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div className="absolute top-1.5 left-1.5 z-20 px-2 py-0.5 rounded-full bg-[#FF9E9E] text-black text-[9px] font-bold flex items-center gap-1 shadow">
                    <Users className="w-2.5 h-2.5" /> Comunidade
                  </div>
                  <div className="absolute inset-0 z-20 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-6 h-6 text-white drop-shadow" />
                  </div>
                </button>
                <div className="flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate group-hover:text-[#FF9E9E] transition-colors">{it.title}</div>
                    <div className="text-[11px] text-[#FF9E9E]/85 truncate">{sub(it) || 'Curadoria Comunitária'}</div>
                  </div>
                  <button
                    onClick={() => onAdd?.(it)}
                    className={`p-1 shrink-0 transition-colors ${saved ? 'text-[#FF9E9E] hover:text-rose-300' : 'text-[#B3B3B3] hover:text-white'}`}
                    title={saved ? 'Remover da biblioteca' : 'Adicionar à biblioteca'}
                  >
                    {saved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          }

          // 4. TIPO PLAYLIST REGULAR / MIX (thumbnail normal, badge Playlist)
          if (type === 'playlist') {
            return (
              <div key={key} className="space-y-1.5 group">
                <button
                  onClick={() => onActivate?.(it)}
                  className="relative block w-full rounded-xl overflow-hidden bg-white/5 aspect-square border border-white/10 hover:border-violet-400/50 transition-all shadow-sm"
                  title={it.title}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-violet-400/30">
                    <ListMusic className="w-8 h-8 opacity-40" />
                  </div>
                  {it.thumbnail && (
                    <img
                      src={it.thumbnail}
                      alt=""
                      className="relative w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-violet-400/30 text-[9px] font-medium text-violet-300 flex items-center gap-1 z-10 shadow">
                    <ListMusic className="w-2.5 h-2.5" /> Playlist
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-6 h-6 text-white drop-shadow" />
                  </div>
                </button>
                <div className="flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate group-hover:text-violet-300 transition-colors">{it.title}</div>
                    <div className="text-[11px] text-[#B3B3B3] truncate">{sub(it)}</div>
                  </div>
                  <button
                    onClick={() => onAdd?.(it)}
                    className={`p-1 shrink-0 transition-colors ${saved ? 'text-[#FF9E9E] hover:text-rose-300' : 'text-[#B3B3B3] hover:text-white'}`}
                    title={saved ? 'Remover da biblioteca' : 'Adicionar à biblioteca'}
                  >
                    {saved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          }

          // 5. TIPO MÚSICA (item compacto, thumbnail menor, título/artista legíveis)
          return (
            <div key={key} className="space-y-1 group">
              <button
                onClick={() => onActivate?.(it)}
                className="relative block w-full rounded-lg overflow-hidden bg-white/5 aspect-square border border-white/5 hover:border-[#FF9E9E]/40 transition-all shadow-sm"
                title={it.title}
              >
                <div className="absolute inset-0 flex items-center justify-center text-[#FF9E9E]/30">
                  <Play className="w-5 h-5" />
                </div>
                {it.thumbnail && (
                  <img
                    src={it.thumbnail}
                    alt=""
                    className="relative w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="w-5 h-5 text-white" />
                </div>
              </button>
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-white truncate group-hover:text-[#FF9E9E] transition-colors">{it.title}</div>
                  <div className="text-[11px] text-[#B3B3B3] truncate">{sub(it)}</div>
                </div>
                <button
                  onClick={() => onAdd?.(it)}
                  className={`p-1 shrink-0 transition-colors ${saved ? 'text-[#FF9E9E] hover:text-rose-300' : 'text-[#B3B3B3] hover:text-white'}`}
                  title={saved ? 'Remover da biblioteca' : 'Adicionar à biblioteca'}
                >
                  {saved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-[#B3B3B3] hover:text-white px-1 py-1 rounded hover:bg-white/5 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5 text-[#FF9E9E]" /> Ver menos</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5 text-[#FF9E9E]" /> Ver mais ({remaining})</>
          )}
        </button>
      )}
    </section>
  );
}