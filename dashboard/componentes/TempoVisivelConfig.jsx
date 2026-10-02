import React from 'react';
import { Clock, Eye, Zap, Timer, Sparkles } from 'lucide-react';

/**
 * Componente de configuração do "Tempo Visível" para elementos no Editor de Cenários e Editor de Overlays.
 * Oferece 3 modos de exibição:
 * 1. Sempre Visível ('always')
 * 2. De Tempo em Tempo ('interval')
 * 3. Somente com Evento ('event')
 */
export default function TempoVisivelConfig({ instance, onUpdateInstance }) {
  if (!instance) return null;

  const config = instance.config || {};
  const currentMode = config.tempoVisivel || 'always'; // 'always' | 'interval' | 'event'
  const intervalDuration = config.tempoVisivelDuracao ?? 10; // Segundos que fica visível no modo intervalo
  const intervalPeriod = config.tempoVisivelIntervalo ?? 60; // Segundos entre as exibições
  const eventDuration = config.tempoVisivelEventoDuracao ?? 8; // Segundos que fica visível quando há evento

  const handleSetMode = (mode) => {
    onUpdateInstance(instance.id, {
      config: {
        ...config,
        tempoVisivel: mode,
      },
    });
  };

  const handleUpdateField = (field, value) => {
    onUpdateInstance(instance.id, {
      config: {
        ...config,
        [field]: value,
      },
    });
  };

  const handleTestAppearance = () => {
    window.dispatchEvent(
      new CustomEvent('livenexus:trigger-tempo-visivel', {
        detail: { instanceId: instance.id }
      })
    );
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5 space-y-3 font-sans">
      {/* Cabeçalho com Título e Badge do Modo Ativo */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Tempo Visível
          </span>
        </div>

        <span
          className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
            currentMode === 'always'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : currentMode === 'interval'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}
        >
          {currentMode === 'always' && 'Sempre Visível'}
          {currentMode === 'interval' && 'De Tempo em Tempo'}
          {currentMode === 'event' && 'Somente com Evento'}
        </span>
      </div>

      {/* 3 Botões de Seleção de Modo */}
      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
        {/* Botão 1: Sempre Visível */}
        <button
          type="button"
          onClick={() => handleSetMode('always')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all cursor-pointer border ${
            currentMode === 'always'
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/50'
              : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 text-slate-400 hover:text-white'
          }`}
          title="O elemento fica sempre visível na tela"
        >
          <Eye className={`h-4 w-4 mb-1 ${currentMode === 'always' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-[10px] font-bold leading-tight">Sempre Visível</span>
        </button>

        {/* Botão 2: De Tempo em Tempo */}
        <button
          type="button"
          onClick={() => handleSetMode('interval')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all cursor-pointer border ${
            currentMode === 'interval'
              ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/50'
              : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 text-slate-400 hover:text-white'
          }`}
          title="O elemento aparece periodicamente por um tempo determinado"
        >
          <Timer className={`h-4 w-4 mb-1 ${currentMode === 'interval' ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span className="text-[10px] font-bold leading-tight">De Tempo em Tempo</span>
        </button>

        {/* Botão 3: Somente com Evento */}
        <button
          type="button"
          onClick={() => handleSetMode('event')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all cursor-pointer border ${
            currentMode === 'event'
              ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/50'
              : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 text-slate-400 hover:text-white'
          }`}
          title="O elemento aparece apenas quando um evento/alerta acontecer"
        >
          <Zap className={`h-4 w-4 mb-1 ${currentMode === 'event' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className="text-[10px] font-bold leading-tight">Somente com Evento</span>
        </button>
      </div>

      {/* Caixa de Configuração Dinâmica para "De Tempo em Tempo" */}
      {currentMode === 'interval' && (
        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-cyan-300 text-[11px] font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Configuração do Intervalo Periódico</span>
          </div>

          {/* Duração visível na tela */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-300">Tempo Visível na Tela:</span>
              <span className="text-cyan-300 font-bold">{intervalDuration} segundos</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={2}
                max={120}
                step={1}
                value={intervalDuration}
                onChange={(e) => handleUpdateField('tempoVisivelDuracao', parseInt(e.target.value) || 10)}
                className="flex-1 accent-cyan-500 h-1.5 bg-black/60 rounded-lg cursor-pointer"
              />
              <input
                type="number"
                min={1}
                max={600}
                value={intervalDuration}
                onChange={(e) => handleUpdateField('tempoVisivelDuracao', Math.max(1, parseInt(e.target.value) || 10))}
                className="w-16 bg-black/80 border border-cyan-500/40 rounded-lg px-2 py-1 text-xs text-center text-white font-mono"
              />
            </div>
          </div>

          {/* Intervalo entre aparições */}
          <div className="space-y-1.5 border-t border-cyan-500/20 pt-2">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-300">Reaparecer a Cada:</span>
              <span className="text-cyan-300 font-bold">
                {intervalPeriod >= 60
                  ? `${Math.floor(intervalPeriod / 60)}m ${intervalPeriod % 60 ? `${intervalPeriod % 60}s` : ''}`
                  : `${intervalPeriod}s`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={600}
                step={5}
                value={intervalPeriod}
                onChange={(e) => handleUpdateField('tempoVisivelIntervalo', parseInt(e.target.value) || 60)}
                className="flex-1 accent-cyan-500 h-1.5 bg-black/60 rounded-lg cursor-pointer"
              />
              <input
                type="number"
                min={5}
                max={3600}
                value={intervalPeriod}
                onChange={(e) => handleUpdateField('tempoVisivelIntervalo', Math.max(5, parseInt(e.target.value) || 60))}
                className="w-16 bg-black/80 border border-cyan-500/40 rounded-lg px-2 py-1 text-xs text-center text-white font-mono"
              />
            </div>
          </div>

          {/* Atalhos rápidos de tempo */}
          <div className="flex items-center gap-1 pt-1">
            <span className="text-[9px] text-slate-400 font-mono">Predefinições:</span>
            {[
              { label: '30s / 1m', dur: 30, int: 60 },
              { label: '15s / 2m', dur: 15, int: 120 },
              { label: '10s / 5m', dur: 10, int: 300 },
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  handleUpdateField('tempoVisivelDuracao', preset.dur);
                  handleUpdateField('tempoVisivelIntervalo', preset.int);
                }}
                className="px-2 py-0.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-[9px] text-cyan-300 font-mono transition"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Caixa de Configuração Dinâmica para "Somente com Evento" */}
      {currentMode === 'event' && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-bold">
            <Zap className="h-3.5 w-3.5" />
            <span>Configuração do Evento</span>
          </div>

          {/* Duração em que o elemento fica visível durante o evento */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-300">Duração de Exibição do Evento:</span>
              <span className="text-amber-300 font-bold">{eventDuration} segundos</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={2}
                max={60}
                step={1}
                value={eventDuration}
                onChange={(e) => handleUpdateField('tempoVisivelEventoDuracao', parseInt(e.target.value) || 8)}
                className="flex-1 accent-amber-500 h-1.5 bg-black/60 rounded-lg cursor-pointer"
              />
              <input
                type="number"
                min={1}
                max={300}
                value={eventDuration}
                onChange={(e) => handleUpdateField('tempoVisivelEventoDuracao', Math.max(1, parseInt(e.target.value) || 8))}
                className="w-16 bg-black/80 border border-amber-500/40 rounded-lg px-2 py-1 text-xs text-center text-white font-mono"
              />
            </div>
          </div>

          {/* Atalhos rápidos de tempo para evento */}
          <div className="flex items-center gap-1 pt-1">
            <span className="text-[9px] text-slate-400 font-mono">Predefinições:</span>
            {[5, 8, 12, 20].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleUpdateField('tempoVisivelEventoDuracao', sec)}
                className={`px-2 py-0.5 rounded-lg border text-[9px] font-mono transition ${
                  eventDuration === sec
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold'
                    : 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/30 text-amber-300'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botão de Teste Rápido de Aparição para Intervalo e Evento */}
      {currentMode !== 'always' && (
        <div className="pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={handleTestAppearance}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-200 text-xs font-semibold transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>Testar Aparição na Tela</span>
          </button>
        </div>
      )}
    </div>
  );
}
