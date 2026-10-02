import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, LayoutGrid, Check, Plus, MessageSquare, Bell, Award, Users, Activity, Vote, Tv, Sparkles } from 'lucide-react';
import { WIDGET_CATEGORIES_CATALOG, getTemplatesForWidget } from './templates/Overlay_index';
import { TWITCH_WIDGETS_CATALOG } from '@dashboard/widgets/Widget_twitchWidgetsCatalog';
import StructuralWidgetRenderer from './Overlay_StructuralWidgetRenderer';
import HorizontalScrollContainer from './Overlay_HorizontalScrollContainer';

const CATEGORY_ICONS = {
  'chat': MessageSquare,
  'alerts-events': Bell,
  'goals': Award,
  'labels-counters': Users,
  'analytics': Activity,
  'interactive': Vote,
  'stream-info': Tv,
  'fun': Sparkles
};

export default function PrebuiltStructuralOverlaysModal({
  open,
  onClose,
  onApplyStructuralPreset
}) {
  const [selectedCatId, setSelectedCatId] = useState('chat');
  const [selectedWidgetId, setSelectedWidgetId] = useState('twitch-chat-box');

  // Handle ESC key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Sync selected widget when category changes
  useEffect(() => {
    const currentCat = WIDGET_CATEGORIES_CATALOG.find(c => c.id === selectedCatId);
    if (currentCat && currentCat.widgets.length > 0) {
      if (!currentCat.widgets.some(w => w.id === selectedWidgetId)) {
        setSelectedWidgetId(currentCat.widgets[0].id);
      }
    }
  }, [selectedCatId, selectedWidgetId]);

  if (!open) return null;

  const currentCatObj = WIDGET_CATEGORIES_CATALOG.find(c => c.id === selectedCatId) || WIDGET_CATEGORIES_CATALOG[0];
  const activeWidgetCatalog = TWITCH_WIDGETS_CATALOG.find(w => w.id === selectedWidgetId) || TWITCH_WIDGETS_CATALOG[0];
  const templates = getTemplatesForWidget(selectedWidgetId);

  const handleApplyTemplate = (tpl) => {
    if (!onApplyStructuralPreset) return;

    if (!tpl) {
      // Padrão Original
      const isChat = selectedWidgetId.startsWith('chat');
      const isGoal = selectedWidgetId.includes('goal');
      const defaultW = isChat ? 340 : isGoal ? 320 : 260;
      const defaultH = isChat ? 300 : isGoal ? 120 : 120;

      onApplyStructuralPreset({
        targetWidgetId: activeWidgetCatalog.id,
        archetypeName: `${activeWidgetCatalog.name} (Padrão Original)`,
        width: defaultW,
        height: defaultH,
        config: {
          ...(activeWidgetCatalog.defaultConfig || {})
        }
      });
    } else {
      // Modelo estrutural próprio da widget
      onApplyStructuralPreset({
        targetWidgetId: activeWidgetCatalog.id,
        archetypeName: `${activeWidgetCatalog.name} - ${tpl.name}`,
        width: tpl.defaultWidth,
        height: tpl.defaultHeight,
        config: {
          ...(activeWidgetCatalog.defaultConfig || {}),
          structuralPreset: tpl.id,
          widgetCategory: selectedCatId
        }
      });
    }

    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 pointer-events-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl h-[92vh] max-h-[920px] flex flex-col rounded-2xl border border-white/10 bg-[#0a0d18] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-500 p-0.5 shadow-lg flex items-center justify-center text-white">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Overlays Pré-Montadas: Biblioteca de Templates</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300">
                  Modelos por Widget
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cada widget mostra somente os modelos disponíveis para sua função.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white p-2.5 transition-all active:scale-95 group border border-white/5 cursor-pointer"
            title="Fechar (ESC)"
          >
            <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        {/* Categories Bar */}
        <HorizontalScrollContainer
          className="px-6 py-2.5 border-b border-white/10 bg-black/50 shrink-0"
          contentClassName="gap-2"
          scrollAmount={240}
        >
          {WIDGET_CATEGORIES_CATALOG.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || LayoutGrid;
            const isSelected = selectedCatId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/50'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-purple-400'}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </HorizontalScrollContainer>

        {/* Widgets Selector Bar inside the selected category */}
        <HorizontalScrollContainer
          key={selectedCatId}
          className="px-6 py-2 border-b border-white/10 bg-slate-950/60 shrink-0"
          contentClassName="gap-2"
          scrollAmount={200}
        >
          <span className="text-[10px] font-mono text-purple-400 uppercase font-bold mr-1 shrink-0">Widgets:</span>
          {currentCatObj.widgets.map((w) => {
            const isSelected = selectedWidgetId === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedWidgetId(w.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {w.name}
              </button>
            );
          })}
        </HorizontalScrollContainer>

        {/* Content Body: Padrão Original + 10 Distinct Templates */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#080b14]">
          {/* Active Widget Banner */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-600/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{activeWidgetCatalog.name}</div>
                <div className="text-xs text-slate-400">Selecione a apresentação original ou um dos {templates.length} modelos próprios.</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
                1 original + {templates.length} modelos
              </span>
            </div>
          </div>

          {/* Apresentação original e modelos disponíveis. */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            {/* Card PADRÃO ORIGINAL */}
            <div className="flex flex-col justify-between rounded-2xl bg-[#0e1322] border border-purple-500/40 p-4 shadow-xl group">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-[10px] font-black font-mono text-purple-300">
                    ★
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      Padrão Original
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">Layout inicial nativo da widget</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
                  ORIGINAL
                </span>
              </div>

              {/* Preview Container */}
              <div className="w-full h-44 rounded-xl bg-[#06080e] border border-white/5 p-3 flex items-center justify-center relative overflow-hidden my-1 shadow-inner">
                <div className="w-full h-full flex items-center justify-center select-none scale-90">
                  {activeWidgetCatalog.component ? (
                    <activeWidgetCatalog.component config={activeWidgetCatalog.defaultConfig} />
                  ) : (
                    <div className="text-xs font-mono text-slate-500">Visualização Padrão</div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3 flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                <p className="text-[11px] text-slate-400 line-clamp-2 flex-1 leading-tight">
                  Apresentação inicial original da widget sem templates estruturais.
                </p>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Aplicar Padrão</span>
                </button>
              </div>
            </div>

            {/* Modelos próprios desta widget. */}
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex flex-col justify-between rounded-2xl bg-[#0e1322] border border-white/10 hover:border-cyan-500/40 transition-all p-4 shadow-xl hover:shadow-cyan-950/30 group"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-black font-mono text-white">
                      {String(tpl.number).padStart(2, '0')}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        Template {String(tpl.number).padStart(2, '0')}: {tpl.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">Dimensão recomendada: {tpl.aspectRatio}px</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0">
                    {tpl.badge}
                  </span>
                </div>

                {/* Structure Visual Preview Container */}
                <div className="w-full h-44 rounded-xl bg-[#06080e] border border-white/5 p-3 flex items-center justify-center relative overflow-hidden my-1 shadow-inner">
                  <div className="flex items-center justify-center w-full max-w-[420px] max-h-[140px] transition-transform group-hover:scale-[1.02]">
                    <StructuralWidgetRenderer
                      widgetId={selectedWidgetId}
                      presetId={tpl.id}
                      isMiniPreview={true}
                    />
                  </div>
                </div>

                {/* Footer description & Apply button */}
                <div className="mt-3 flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                  <p className="text-[11px] text-slate-400 line-clamp-2 flex-1 leading-tight">
                    {tpl.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20 active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Aplicar Template</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
