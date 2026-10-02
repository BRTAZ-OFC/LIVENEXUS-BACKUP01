import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check, Search, Filter, Layers, Camera, Bell, LayoutGrid, Award } from 'lucide-react';
import { PREBUILT_OVERLAYS_CATALOG } from './Overlay_prebuiltOverlayCatalog';
import HorizontalScrollContainer from './Overlay_HorizontalScrollContainer';

const CATEGORY_ICONS = {
  'Todos': LayoutGrid,
  'Overlays Completos': Layers,
  'Molduras / Webcam': Camera,
  'Alertas / Eventos': Bell,
  'Barras / HUD': LayoutGrid,
  'Metas / Goals': Award
};

const CATEGORIES = [
  'Todos',
  'Overlays Completos',
  'Molduras / Webcam',
  'Alertas / Eventos',
  'Barras / HUD',
  'Metas / Goals'
];

export default function PrebuiltOverlayGalleryModal({
  open,
  onClose,
  onSelect,
  currentImage = ''
}) {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedSource, setSelectedSource] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Escape key to close modal
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const filteredAssets = useMemo(() => {
    return PREBUILT_OVERLAYS_CATALOG.filter((item) => {
      // Category filter
      if (activeCategory !== 'Todos' && item.category !== activeCategory) {
        return false;
      }
      // Source filter
      if (selectedSource !== 'Todas' && item.source !== selectedSource) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesSrc = item.source.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesSrc) {
          return false;
        }
      }
      return true;
    });
  }, [activeCategory, selectedSource, searchQuery]);

  if (!open) return null;

  const handleApply = (asset) => {
    onSelect(asset.url);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[88vh] max-h-[850px] flex flex-col rounded-2xl border border-white/10 bg-[#0c101c] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Galeria Pré-Montada de Overlays & Widgets</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300">
                  {PREBUILT_OVERLAYS_CATALOG.length} Ativos
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Galeria oficial de overlays e fundos pré-montados.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white p-2.5 transition-all active:scale-95 group border border-white/5"
            title="Fechar Galeria (ESC)"
          >
            <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        {/* Controls & Category Filter Bar */}
        <div className="px-6 py-3 border-b border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Category Tabs Carousel */}
          <HorizontalScrollContainer className="flex-1 min-w-0 max-w-xl" contentClassName="gap-1.5 py-0.5">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || LayoutGrid;
              const isActive = activeCategory === cat;
              const count = cat === 'Todos'
                ? PREBUILT_OVERLAYS_CATALOG.length
                : PREBUILT_OVERLAYS_CATALOG.filter(a => a.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </HorizontalScrollContainer>

          {/* Search & Source Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar asset..."
                className="bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder:text-slate-500 w-44 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-lg p-0.5 text-xs">
              {['Todas', 'PosterMyWall', 'Behance'].map((src) => (
                <button
                  key={src}
                  onClick={() => setSelectedSource(src)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    selectedSource === src
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/40">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Filter className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-300">Nenhuma imagem cadastrada na Galeria Pré-Montada.</p>
              <p className="text-xs text-slate-500 mt-1">A galeria está vazia e pronta para novos conteúdos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => {
                const isSelected = currentImage === asset.url;
                const isBehance = asset.source === 'Behance';

                return (
                  <div
                    key={asset.id}
                    onClick={() => handleApply(asset)}
                    className={`group relative flex flex-col rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/20'
                        : 'bg-black/40 border-white/10 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-600/10'
                    }`}
                  >
                    {/* Thumbnail Container */}
                    <div className="relative aspect-video w-full bg-slate-900/80 overflow-hidden flex items-center justify-center p-2">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        loading="lazy"
                        className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Source & Category Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start pointer-events-none">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-tight shadow ${
                          isBehance ? 'bg-blue-600/90 text-white' : 'bg-pink-600/90 text-white'
                        }`}>
                          {asset.source}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}

                      {/* Hover Overlay with Action Button */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <Check className="h-3.5 w-3.5" /> Aplicar ao Fundo
                        </span>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-2.5 bg-black/60 border-t border-white/5 flex flex-col gap-0.5">
                      <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-purple-300 transition-colors" title={asset.name}>
                        {asset.name}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="truncate">{asset.category}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span>Exibindo <strong className="text-white">{filteredAssets.length}</strong> de <strong className="text-white">{PREBUILT_OVERLAYS_CATALOG.length}</strong> assets</span>
          </div>

          <div className="text-[11px] text-slate-500">
            Galeria Pré-Montada de Imagens &amp; Overlays.
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
