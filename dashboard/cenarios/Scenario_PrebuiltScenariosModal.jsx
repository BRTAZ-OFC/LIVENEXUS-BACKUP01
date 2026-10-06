import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Sparkles, 
  Plus, 
  Layers, 
  Tv, 
  Check, 
  Search, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { PREBUILT_SCENARIO_PACKS } from './Scenario_prebuiltScenariosCatalog';

const ITEMS_PER_PAGE = 6;

const CATEGORIES = [
  'Todas',
  'Original',
  'Gamer / Tecnologia',
  'Dark / Fantasia',
  'Retro / Estilizado'
];

const PACK_GROUPS = {
  Original: ['pack-live-completa-pro'],
  'Gamer / Tecnologia': [
    'pack-gamer', 'pack-gamer-esports', 'pack-cyberpunk-2099', 'pack-futurista-ultra',
    'pack-scifi-command', 'pack-synthwave-80s', 'pack-glitch-protocol',
    'pack-hud-tactical', 'pack-holografico-light', 'pack-techwear-industrial',
    'pack-streamer-rgb'
  ],
  'Dark / Fantasia': [
    'pack-dark', 'pack-dark-fantasy', 'pack-military', 'pack-post-apocalyptic',
    'pack-industrial', 'pack-steampunk', 'pack-horror-gamer', 'pack-gotico',
    'pack-fantasy-rpg', 'pack-neon-racing'
  ],
  'Retro / Estilizado': [
    'pack-anime-gamer', 'pack-retro-gaming', 'pack-pixel-art',
    'pack-space-cosmic', 'pack-terminal-hacker', 'pack-voxel',
    'pack-cartoon-gamer', 'pack-comic-hq', 'pack-pop-gamer',
    'pack-minimal-gamer'
  ]
};

const groupOf = (pack) => CATEGORIES.slice(1).find((group) => PACK_GROUPS[group].includes(pack.id));

export default function PrebuiltScenariosModal({ isOpen, onClose, onSelectPack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [currentPage, setCurrentPage] = useState(0);
  const categoryScrollRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset page when search or category changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, selectedCategory]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedCategory('Todas');
      setCurrentPage(0);
    }
  }, [isOpen]);

  // Filter packs based on category and search term
  const filteredPacks = useMemo(() => {
    return PREBUILT_SCENARIO_PACKS.filter((pack) => {
      // Category match
      const group = groupOf(pack);
      const matchesCategory = selectedCategory === 'Todas' || group === selectedCategory;

      // Search term match
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        pack.name?.toLowerCase().includes(term) ||
        pack.tagline?.toLowerCase().includes(term) ||
        pack.description?.toLowerCase().includes(term) ||
        pack.category?.toLowerCase().includes(term) ||
        group?.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredPacks.length / ITEMS_PER_PAGE));

  // Ensure current page remains within valid bounds
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);

  const currentPacks = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredPacks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPacks, currentPage]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleAddPack = (pack) => {
    if (!pack) return;
    const newId = Date.now().toString();

    // Deep clone the scenario pack with all its embedded subscenarios intact
    const clonedData = JSON.parse(JSON.stringify(pack.data));
    const firstSub = clonedData.subcenarios[0];

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const newScenario = {
      ...clonedData,
      id: newId,
      name: clonedData.name || 'Cenário Pré-Montado',
      mode: 'LOCAL',
      localUrl: `${origin}/cenario/${newId}`,
      broadcastUrl: `${origin}/cenario/receiver/${newId}`,
      visualizerSize: clonedData.visualizerSize || { width: 1920, height: 1080 },
      gridSettings: clonedData.gridSettings || {
        showGrid: false,
        gridSize: 20,
        snapToGrid: false,
        showSafeAreas: false,
        verticalGuides: [],
        horizontalGuides: []
      },
      instances: firstSub?.instances || [],
      background: firstSub?.background || { type: 'transparent' },
      activeSubcenarioId: firstSub?.id || 'default',
      subcenarios: clonedData.subcenarios
    };

    onSelectPack(newScenario);
    onClose();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-white/10 rounded-2xl w-[95vw] max-w-6xl h-[88vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Fixed Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Catálogo de Cenários Pré-Montados
                <span className="text-[10px] font-mono uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-semibold">
                  {PREBUILT_SCENARIO_PACKS.length} Pacotes
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Selecione um pacote completo com seus 7 Subcenários para iniciar sua transmissão profissional.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar catálogo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Fixed Top Bar: Search & Category Filter Submenu */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Search Input Box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar cenário por nome ou estilo..."
              className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category controls stay outside the clipped scrolling area, 3 px from it. */}
          <nav aria-label="Categorias de cenários" className="flex flex-1 basis-full md:basis-0 min-w-[160px] max-w-full items-center gap-[3px] py-1">
            <button
              type="button"
              aria-label="Categorias anteriores"
              onClick={() => categoryScrollRef.current?.scrollBy({ left: -categoryScrollRef.current.clientWidth * 0.8, behavior: 'smooth' })}
              className="w-8 h-8 shrink-0 rounded text-2xl leading-none text-slate-400 hover:bg-white/10 hover:text-white active:bg-white/20 active:text-white"
            >‹</button>
            <div ref={categoryScrollRef} className="flex flex-1 min-w-0 items-center gap-1.5 overflow-x-auto overscroll-x-contain whitespace-nowrap scrollbar-none scroll-smooth">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  aria-current={selectedCategory === cat ? 'true' : undefined}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-violet-600 text-white font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5 hover:border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Próximas categorias"
              onClick={() => categoryScrollRef.current?.scrollBy({ left: categoryScrollRef.current.clientWidth * 0.8, behavior: 'smooth' })}
              className="w-8 h-8 shrink-0 rounded text-2xl leading-none text-slate-400 hover:bg-white/10 hover:text-white active:bg-white/20 active:text-white"
            >›</button>
          </nav>
        </div>

        {/* 3. Main Catalog View with Navigation Controls ◀ ▶ and Bounded Cards Area */}
        <div className="flex-1 px-6 py-4 flex items-center justify-between gap-4 overflow-hidden relative">
          {/* Left Control ◀ */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="w-11 h-11 rounded-xl bg-slate-900 border border-white/10 hover:border-violet-500/50 hover:bg-violet-600/20 active:scale-95 text-white disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-lg z-20 group"
            title="Página Anterior (◀)"
          >
            <ChevronLeft className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
          </button>

          {/* Bounded Cards Area (No scrollbars, strictly bounded layout) */}
          <div className="flex-1 h-full border border-white/10 bg-slate-950/50 rounded-2xl p-4 overflow-hidden flex flex-col justify-between">
            {currentPacks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full content-start">
                {currentPacks.map((pack) => {
                  const mainSub = pack.data?.subcenarios?.[0];

                  return (
                    <div 
                      key={pack.id}
                      className="bg-slate-900/90 border border-white/10 hover:border-violet-500/50 rounded-xl p-3 flex flex-col justify-between transition-all duration-200 group shadow-md hover:shadow-violet-950/30 overflow-hidden h-full max-h-[290px]"
                    >
                      <div>
                        {/* Compact 16:9 Visual Preview Box */}
                        <div className="w-full aspect-video rounded-lg border border-white/10 bg-[#090d16] relative overflow-hidden mb-2 shadow-inner flex items-center justify-center select-none group-hover:border-violet-500/30 transition-colors shrink-0">
                          {/* Background Gradient */}
                          <div 
                            className="absolute inset-0 opacity-90"
                            style={{
                              background: mainSub?.background?.gradient || 'radial-gradient(ellipse at 50% 40%, #1e1b4b 0%, #09090b 70%, #020617 100%)'
                            }}
                          />

                          {/* Visual mockup badges */}
                          <div className="relative z-10 w-full h-full p-2.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-1">
                              <span className="bg-black/60 backdrop-blur-md border border-white/10 text-violet-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Tv className="w-2.5 h-2.5" /> 1080p
                              </span>
                              <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded truncate max-w-[120px]">
                                {groupOf(pack)}
                              </span>
                            </div>

                            {/* Center Title Preview */}
                            <div className="text-center py-1">
                              <span className="text-[9px] font-mono tracking-widest text-violet-400 font-bold block uppercase opacity-80">
                                PACOTE COMPLETO
                              </span>
                              <h4 className="text-xs font-bold text-white tracking-wide drop-shadow truncate px-1">
                                {pack.name}
                              </h4>
                            </div>

                            {/* Bottom Info */}
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-300 bg-black/60 backdrop-blur-sm border border-white/5 px-2 py-0.5 rounded">
                              <span className="flex items-center gap-1 font-semibold text-white">
                                <Layers className="w-3 h-3 text-violet-400" /> {pack.subcenariosCount} Subcenários
                              </span>
                              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Pronto
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Text Information */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h3 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                              {pack.name}
                            </h3>
                          </div>
                          <p className="text-[11px] text-slate-300 font-medium truncate">
                            {pack.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Add Action Button */}
                      <div className="pt-2 border-t border-white/5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddPack(pack)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20 active:scale-[0.98] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar Pacote Completo
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty Search / Filter Result State */
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Nenhum cenário pré-montado encontrado</h3>
                <p className="text-xs text-slate-400 max-w-md mb-4">
                  Não foram encontrados pacotes para a pesquisa "{searchTerm}" na categoria "{selectedCategory}".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('Todas');
                  }}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Limpar Filtros e Ver Todos
                </button>
              </div>
            )}
          </div>

          {/* Right Control ▶ */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="w-11 h-11 rounded-xl bg-slate-900 border border-white/10 hover:border-violet-500/50 hover:bg-violet-600/20 active:scale-95 text-white disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-lg z-20 group"
            title="Próxima Página (▶)"
          >
            <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* 4. Fixed Footer: Pagination Status & Indicators */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-300">
              Mostrando {filteredPacks.length > 0 ? currentPage * ITEMS_PER_PAGE + 1 : 0}–
              {Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredPacks.length)} de {filteredPacks.length} cenários
            </span>
            {selectedCategory !== 'Todas' && (
              <span className="bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[10px] px-2 py-0.5 rounded-full">
                {selectedCategory}
              </span>
            )}
          </div>

          {/* Page Indicator & Dots */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-400">
              Página <strong className="text-white">{currentPage + 1}</strong> de <strong className="text-white">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentPage(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentPage === idx ? 'w-5 bg-violet-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={`Ir para página ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
