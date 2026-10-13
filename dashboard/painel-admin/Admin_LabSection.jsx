import { useState } from 'react';
import { FlaskConical, ChevronRight, ChevronLeft, Layers, Radio } from 'lucide-react';
import { useAutoScroll } from '@dashboard/componentes/useAutoScroll';

const LAB_TOOLS = [];

export default function AdminLabSection() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeToolId, setActiveToolId] = useState(null);

  // Auto-scroll padronizado do LiveNexus nas zonas de borda do drawer (desktop)
  const {
    ref: drawerNavRef,
    handleMouseMove: handleDrawerMouseMove,
    stopAutoScroll: stopDrawerAutoScroll,
  } = useAutoScroll({
    zone: 70,
    minSpeed: 1.5,
    maxSpeed: 6.0,
    checkButtons: false,
  });

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-6rem)] overflow-x-hidden flex flex-col">
      {/* Barra superior de controle do Lab */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/15 px-6 pt-2 shrink-0 bg-[#070a12]">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
            <FlaskConical size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Laboratório</h2>
            <p className="text-xs text-slate-400">Painel Admin → Laboratório → Ferramentas → Teste Conexão Meta</p>
          </div>
        </div>

        {/* Botão retrátil para abrir/fechar o Drawer de Ferramentas */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition z-30 shadow-lg ${
            drawerOpen
              ? 'bg-violet-500 text-white shadow-violet-500/20'
              : 'border border-violet-500/30 bg-[#0e121d] text-violet-200 hover:bg-violet-500/20'
          }`}
          title={drawerOpen ? 'Recolher seletor de ferramentas' : 'Abrir seletor de ferramentas'}
        >
          <Layers size={14} />
          <span>Ferramentas</span>
          {drawerOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Área Principal da Ferramenta Ativa */}
      <div className="flex-1 w-full min-w-0 flex items-center justify-center">
        {(() => {
          const tool = LAB_TOOLS.find(t => t.id === activeToolId);
          if (tool && tool.component) {
            const ToolComp = tool.component;
            return <ToolComp />;
          }
          return (
            <div className="text-center space-y-3 max-w-md bg-[#0e121d]/60 border border-white/10 rounded-2xl p-8 shadow-xl">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-300 mx-auto">
                <FlaskConical size={24} />
              </div>
              <h3 className="text-base font-bold text-white">Laboratório</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Selecione uma ferramenta no menu lateral para iniciar a experimentação.
              </p>
            </div>
          );
        })()}
      </div>

      {/* Drawer deslizante de ferramentas (à direita) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex justify-end transition-opacity">
          <div
            ref={drawerNavRef}
            onMouseMove={handleDrawerMouseMove}
            onMouseLeave={stopDrawerAutoScroll}
            className="w-full max-w-sm bg-[#080b11] border-l border-white/10 p-6 flex flex-col h-full shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-violet-400" />
                <h3 className="text-sm font-bold text-white">Ferramentas do Laboratório</h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                Fechar
              </button>
            </div>
            <div className="space-y-2.5">
              {LAB_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeToolId === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveToolId(tool.id);
                      setDrawerOpen(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isActive
                        ? 'border-violet-500/50 bg-violet-500/15 text-white shadow-lg shadow-violet-500/10'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-slate-300'
                    }`}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg mt-0.5 ${isActive ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-300'}`}>
                      <Icon size={16} />
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{tool.name}</span>
                        <span className="text-[10px] text-violet-400 font-mono">{tool.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{tool.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
