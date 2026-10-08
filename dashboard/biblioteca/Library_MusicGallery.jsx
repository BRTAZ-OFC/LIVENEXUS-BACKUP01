import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, History, Trash2, Users, ArrowLeft } from 'lucide-react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import {
  searchAll, searchMusic, searchPlaylists, subscribeSearchProgress } from
'@dashboard/biblioteca/Library_musicSearch';
import { searchItunes } from '@dashboard/biblioteca/Library_itunes';
import { searchDeezer } from '@dashboard/biblioteca/Library_deezer';
import { searchBandcamp } from '@dashboard/biblioteca/Library_bandcamp';
import { searchAudius } from '@dashboard/biblioteca/Library_audius';
import { searchMixcloud } from '@dashboard/biblioteca/Library_mixcloud';
import { aggregateSearch, mergeProgressiveGroups } from '@dashboard/biblioteca/Library_musicAggregator';
import { queueManager } from '@dashboard/biblioteca/Library_queueManager';
import { playTrack } from '@dashboard/biblioteca/Library_youtubePlayer';
import { searchHistoryManager } from '@dashboard/biblioteca/Library_searchHistoryManager';
import { useUserLibrary } from '@dashboard/biblioteca/Library_useUserLibrary';
import MusicCarousel from './Library_MusicCarousel';
import SearchResultGroup from './Library_SearchResultGroup';
import MusicDetail from './Library_MusicDetail';
import EntityPage from './Library_EntityPage';
import {
  PLATFORM_ORDER,
  CONTENT_TYPE_ORDER,
  CONTENT_TYPE_LABELS,
  groupResultsByPlatformAndType,
} from '@dashboard/biblioteca/Library_sourceLabels';

// Galeria estilo YouTube Music — navegação por seção (carrosséis infinitos),
// filtro por categoria (chips) e busca global (cabeçalho fixo).
const TAGS = ['Pop', 'Rock', 'Sertanejo', 'Funk', 'Hip Hop', 'Eletrônica', 'MPB', 'Jazz', 'Lo-fi', 'Trap', 'Gospel', 'Clássica'];
// TYPE_LABELS/TYPE_ORDER importados de @dashboard/biblioteca/sourceLabels (compartilhados com EntityPage).

const SEED = {
  main: 'músicas mais tocadas 2026',
  mostPlayed: 'top músicas brasil 2026',
  community: 'playlist da comunidade'
};

// Mapa de filtro (chip) -> seção do browse.
const SECTIONS = {
  songs: { label: 'Músicas', variant: 'default' },
  artists: { label: 'Artistas', variant: 'default' },
  mostPlayed: { label: 'Mais tocadas', variant: 'default' },
  playlists: { label: 'Playlists', variant: 'default' },
  gallery: { label: 'Galeria', variant: 'default' },
  community: { label: 'Playlist da Comunidade', variant: 'featured' }
};

export default function MusicGallery({ externalQuery, onSearch, filter }) {
  const central = useNewUserDataCentral();
  const { toggle } = useUserLibrary();
  const [groups, setGroups] = useState({});
  const [browse, setBrowse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [history, setHistory] = useState(() => searchHistoryManager.list());
  const [nav, setNav] = useState([]);
  const pushView = (v) => setNav((n) => [...n, v]);
  const popView = () => setNav((n) => n.slice(0, -1));
  const currentView = nav[nav.length - 1] || null;

  useEffect(() => {loadBrowse();}, []);

  useEffect(() => {
    const t = (externalQuery || '').trim();
    if (t) {
      setSelectedPlatform('all');
      setNav([]);
      runSearch(t);
    } else {
      setSearched(false);
      setGroups({});
      setError(null);
    }
  }, [externalQuery]);

  // Carregamento progressivo lazy loading: conforme novas páginas chegam do InnerTube,
  // acrescenta os resultados aos existentes preservando ordem, deduplicação por ID real,
  // categorias e fontes já exibidas.
  useEffect(() => {
    const unsubscribe = subscribeSearchProgress(({ query: q, results }) => {
      const currentTerm = (externalQuery || '').trim();
      if (q && currentTerm && q.toLowerCase() === currentTerm.toLowerCase()) {
        setGroups((prev) => mergeProgressiveGroups(prev, results));
      }
    });
    return unsubscribe;
  }, [externalQuery]);

  async function loadBrowse() {
    setBrowseLoading(true);
    try {
      const [main, most, comm, it, bc, au, dz, mx] = await Promise.all([
        searchAll(SEED.main).catch(() => ({ items: [] })),
        searchMusic(SEED.mostPlayed).catch(() => ({ items: [] })),
        searchPlaylists(SEED.community).catch(() => ({ items: [] })),
        searchItunes('top músicas 2026').catch(() => ({ tracks: [], albums: [] })),
        searchBandcamp('brazil indie').catch(() => ({ tracks: [], albums: [] })),
        searchAudius('trending').catch(() => ({ tracks: [], playlists: [] })),
        searchDeezer('top brasil 2026').catch(() => ({ tracks: [], playlists: [] })),
        searchMixcloud('dj mix').catch(() => []),
      ]);
      const all = main?.items || [];
      const g = {};
      for (const itm of all) { const t = itm.type || 'song'; (g[t] = g[t] || []).push(itm); }

      const auTracks = Array.isArray(au) ? au : (au?.tracks || []);
      const dzTracks = Array.isArray(dz) ? dz : (dz?.tracks || []);
      const auPlaylists = Array.isArray(au?.playlists) ? au.playlists : [];
      const dzPlaylists = Array.isArray(dz?.playlists) ? dz.playlists : [];

      setBrowse({
        community: [
          ...(comm?.items || []).filter((p) => p.playlistId),
          ...dzPlaylists,
          ...auPlaylists,
        ],
        songs: g.song || [],
        artists: g.artist || [],
        mostPlayed: (most?.items || []).filter((t) => t.videoId),
        playlists: g.playlist || [],
        gallery: g.album || [],
        itunes: (it?.tracks || []).slice(0, 20),
        bandcamp: [...(bc?.tracks || []), ...(bc?.albums || [])].slice(0, 20),
        audius: auTracks.slice(0, 20),
        deezer: dzTracks.slice(0, 20),
        mixcloud: (Array.isArray(mx) ? mx : []).slice(0, 20),
      });
    } catch (e) {
      console.warn('[MusicGallery] loadBrowse falhou:', e);
    } finally {
      setBrowseLoading(false);
    }
  }

  async function runSearch(q) {
    const term = (q || '').trim();
    if (!term) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    setNav([]);
    searchHistoryManager.add(term);
    setHistory(searchHistoryManager.list());
    try {
      const g = await aggregateSearch(term);
      setGroups(g);
    } catch (err) {
      setError(err.message || 'Erro na busca');
    } finally {
      setLoading(false);
    }
  }

  function handleActivate(item) {pushView({ type: 'detail', item });}
  function handleOpenEntity(e) {pushView({ type: 'entity', ...e });}

  function handleSelect(track, tracks) {
    const idx = tracks.findIndex((t) => t.videoId === track.videoId);
    queueManager.setQueue(tracks, idx >= 0 ? idx : 0);
    playTrack(track);
  }

  function handleAdd(item) {
    toggle(item).catch(error => console.error('Erro ao salvar item na biblioteca:', error));
  }

  if (currentView?.type === 'entity') {
    return (
      <EntityPage
        name={currentView.name}
        kind={currentView.kind}
        label={currentView.label}
        onBack={popView}
        onActivate={handleActivate}
        onAdd={handleAdd}
        onSearch={(q) => {setNav([]);onSearch?.(q);}} />);


  }
  if (currentView?.type === 'detail') {
    return (
      <MusicDetail
        item={currentView.item}
        onBack={popView}
        onSelect={handleSelect}
        onAdd={handleAdd}
        onOpenEntity={handleOpenEntity} />);


  }

  const inSearch = searched && (externalQuery || '').trim().length > 0;
  const inFilter = !inSearch && !!filter && !!SECTIONS[filter];
  const sectionItems = inFilter && browse ? browse[filter] || [] : [];

  return (
    <div className="space-y-4">
      {(inSearch || inFilter) &&
      <button onClick={() => onSearch?.('')} className="flex items-center gap-1.5 text-xs text-[#B3B3B3] hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar à galeria
        </button>
      }

      {/* Tags de gênero — só nos modos browse e busca */}
      {!inFilter &&
      <div className="flex gap-2 overflow-x-auto pb-1 hidden">
          {TAGS.map((t) =>
        <button
          key={t}
          onClick={() => onSearch?.(t)}
          className="shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#B3B3B3] hover:text-white hover:border-[#FF9E9E]/40 transition-colors">
          
              {t}
            </button>
        )}
        </div>
      }

      {/* Buscas recentes — só no modo browse */}
      {!inSearch && !inFilter && history.length > 0 &&
      <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-[#B3B3B3]"><History className="w-3 h-3" /> Buscas recentes</div>
            <button onClick={() => {searchHistoryManager.clear();setHistory([]);}} className="flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200">
              <Trash2 className="w-3 h-3" /> Limpar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {history.slice(0, 10).map((h) =>
          <button key={h.query} onClick={() => onSearch?.(h.query)} className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-[#B3B3B3] hover:border-[#FF9E9E]/40 hover:text-white transition-colors">
                {h.query}
              </button>
          )}
          </div>
        </div>
      }

      {error &&
      <div className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-md p-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      }

      {inSearch ? (
        <>
          {loading && (
            <div className="flex items-center justify-center py-12 text-[#B3B3B3]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Buscando em YouTube Music, YouTube, Deezer, Audius, iTunes, Bandcamp, Mixcloud, Jamendo, MusicBrainz, Last.fm...
            </div>
          )}

          {(() => {
            const platformGroups = groupResultsByPlatformAndType(groups);
            const availablePlatforms = PLATFORM_ORDER.filter((p) => platformGroups[p]);
            const totalResultCount = availablePlatforms.reduce(
              (acc, p) => acc + Object.values(platformGroups[p] || {}).reduce((subAcc, list) => subAcc + (list?.length || 0), 0),
              0
            );

            if (!loading && availablePlatforms.length === 0 && !error) {
              return (
                <div className="text-center py-12 text-sm text-[#B3B3B3]">
                  Nenhum resultado. Tente outro termo ou tag.
                </div>
              );
            }

            if (!loading && availablePlatforms.length > 0) {
              const displayedPlatforms = selectedPlatform === 'all'
                ? availablePlatforms
                : [selectedPlatform].filter((p) => platformGroups[p]);

              return (
                <div className="space-y-6">
                  {/* Faixa compacta de seleção / filtro superior por plataforma */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    <button
                      onClick={() => setSelectedPlatform('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
                        selectedPlatform === 'all'
                          ? 'bg-[#FF9E9E] text-black font-semibold'
                          : 'bg-white/5 border border-white/10 text-[#B3B3B3] hover:text-white hover:border-white/20'
                      }`}
                    >
                      Todas as plataformas ({totalResultCount})
                    </button>
                    {availablePlatforms.map((p) => {
                      const count = Object.values(platformGroups[p] || {}).reduce((acc, list) => acc + (list?.length || 0), 0);
                      const isSelected = selectedPlatform === p;
                      return (
                        <button
                          key={p}
                          onClick={() => setSelectedPlatform(isSelected ? 'all' : p)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#FF9E9E] text-black font-semibold'
                              : 'bg-white/5 border border-white/10 text-[#B3B3B3] hover:text-white hover:border-white/20'
                          }`}
                        >
                          {p} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Hierarquia: PLATAFORMA -> TIPO DE CONTEÚDO -> RESULTADOS */}
                  {displayedPlatforms.map((platform) => {
                    const typesForPlatform = platformGroups[platform] || {};
                    const platformTotal = Object.values(typesForPlatform).reduce((acc, list) => acc + (list?.length || 0), 0);

                    return (
                      <div key={platform} className="space-y-4 pt-4 border-t border-white/10 first:border-t-0 first:pt-0">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9E9E]" />
                            <h3 className="text-base font-bold text-white tracking-wide">{platform}</h3>
                          </div>
                          <span className="text-xs text-[#B3B3B3]">
                            {platformTotal} {platformTotal === 1 ? 'resultado' : 'resultados'}
                          </span>
                        </div>

                        <div className="space-y-5">
                          {CONTENT_TYPE_ORDER.map((contentType) => {
                            const items = typesForPlatform[contentType];
                            if (!items || !items.length) return null;
                            return (
                              <SearchResultGroup
                                key={platform + '-' + contentType}
                                title={CONTENT_TYPE_LABELS[contentType]}
                                contentType={contentType}
                                items={items}
                                initialRows={1}
                                onActivate={handleActivate}
                                onAdd={handleAdd}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            return null;
          })()}
        </>
      ) :
      inFilter ?
      <>
          {browseLoading &&
        <div className="flex items-center justify-center py-12 text-[#B3B3B3]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
            </div>
        }
          {!browseLoading && sectionItems.length === 0 &&
        <div className="text-center py-12 text-sm text-[#B3B3B3]">Nada por aqui ainda.</div>
        }
          {!browseLoading && sectionItems.length > 0 &&
        <SearchResultGroup
          title={SECTIONS[filter].label}
          items={sectionItems}
          onActivate={handleActivate}
          onAdd={handleAdd} />

        }
        </> :

      <>
        {browseLoading && (
          <div className="flex items-center justify-center py-12 text-[#B3B3B3]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando galeria...
          </div>
        )}

        {!browseLoading && (
          <>
            {browse?.community?.length > 0 && (
              <MusicCarousel
                title="Playlist da Comunidade"
                subtitle="Playlists criadas pela comunidade — toque e descubra"
                icon={Users}
                items={browse?.community}
                onActivate={handleActivate}
                onAdd={handleAdd}
                variant="featured"
              />
            )}
            <MusicCarousel title="Músicas" items={browse?.songs} onActivate={handleActivate} onAdd={handleAdd} />
            <MusicCarousel title="Artistas" items={browse?.artists} onActivate={handleActivate} onAdd={handleAdd} />
            <MusicCarousel title="Mais tocadas" items={browse?.mostPlayed} onActivate={handleActivate} onAdd={handleAdd} />
            <MusicCarousel title="Playlists" items={browse?.playlists} onActivate={handleActivate} onAdd={handleAdd} />
            <MusicCarousel title="Galeria" items={browse?.gallery} onActivate={handleActivate} onAdd={handleAdd} />
            <MusicCarousel title="iTunes · Destaques" items={browse?.itunes} onActivate={handleActivate} onAdd={handleAdd} />
            <MusicCarousel title="Deezer · Destaques" items={browse?.deezer} onActivate={handleActivate} onAdd={handleAdd} />
            <MusicCarousel title="Bandcamp · Destaques" items={browse?.bandcamp} onActivate={handleActivate} onAdd={handleAdd} />
            <MusicCarousel title="Audius · Destaques" items={browse?.audius} onActivate={handleActivate} onAdd={handleAdd} />
            <MusicCarousel title="Mixcloud · Destaques" items={browse?.mixcloud} onActivate={handleActivate} onAdd={handleAdd} />
          </>
        )}
      </>
      }
    </div>);

}
