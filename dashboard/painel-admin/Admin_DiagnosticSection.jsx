import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDiagnostic } from '@dashboard/painel-admin/Admin_DiagnosticContext';
import { recordDiagnosticEvent } from '@dashboard/painel-admin/diagnostic/Admin_diagnosticService';
import {
  Play,
  Square,
  Trash2,
  Copy,
  Check,
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export default function DiagnosticSection() {
  const {
    events,
    isCapturing,
    startCapture,
    stopCapture,
    clearEvents,
    copyReport,
  } = useDiagnostic();

  const [testUrl, setTestUrl] = useState('');
  const [isTestingRoute, setIsTestingRoute] = useState(false);
  const [testIframeSrc, setTestIframeSrc] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [filterLevel, setFilterLevel] = useState('all'); // 'all' | 'error' | 'warn'
  const [filterModule, setFilterModule] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDetails, setExpandedDetails] = useState({});

  const listEndRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll para os eventos mais recentes se habilitado
  useEffect(() => {
    if (autoScroll && listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events.length, autoScroll]);

  const handleCopy = async (eventItem) => {
    const res = await copyReport(eventItem);
    if (res?.success) {
      setCopiedId(eventItem.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const toggleExpand = (id) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleRunRouteTest = (e) => {
    e.preventDefault();
    const cleanUrl = (testUrl || '').trim();
    if (!cleanUrl) return;

    // Normaliza para rota relativa se for passada com protocolo
    let normalized = cleanUrl;
    try {
      if (cleanUrl.startsWith('http')) {
        const parsed = new URL(cleanUrl);
        normalized = parsed.pathname + parsed.search;
      }
    } catch {}

    setIsTestingRoute(true);
    recordDiagnosticEvent({
      level: 'info',
      module: 'Diagnóstico',
      component: 'TesteDeRota',
      action: 'Início do teste de rota',
      message: `Iniciando execução em ambiente de teste para rota: ${normalized}`,
      details: { route: normalized },
    });

    setTestIframeSrc(normalized);

    // Permite que o React e os componentes do iframe sejam montados e executados
    setTimeout(() => {
      setIsTestingRoute(false);
      setTestIframeSrc(null);
      recordDiagnosticEvent({
        level: 'info',
        module: 'Diagnóstico',
        component: 'TesteDeRota',
        action: 'Conclusão do teste de rota',
        message: `Execução em ambiente de teste concluída para: ${normalized}`,
        details: { route: normalized },
      });
    }, 4000);
  };

  // Módulos únicos encontrados nos eventos para o filtro
  const availableModules = useMemo(() => {
    const set = new Set(['all']);
    events.forEach((ev) => {
      if (ev.module) set.add(ev.module);
    });
    return Array.from(set);
  }, [events]);

  // Filtragem dos eventos
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterLevel === 'error' && ev.level !== 'error') return false;
      if (filterLevel === 'warn' && ev.level !== 'warn' && ev.level !== 'error') return false;
      if (filterModule !== 'all' && ev.module !== filterModule) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchMsg = ev.message?.toLowerCase().includes(q);
        const matchMod = ev.module?.toLowerCase().includes(q);
        const matchComp = ev.component?.toLowerCase().includes(q);
        const matchAct = ev.action?.toLowerCase().includes(q);
        if (!matchMsg && !matchMod && !matchComp && !matchAct) return false;
      }
      return true;
    });
  }, [events, filterLevel, filterModule, searchQuery]);

  const totalErrors = useMemo(() => events.filter((e) => e.level === 'error').length, [events]);
  const totalWarns = useMemo(() => events.filter((e) => e.level === 'warn').length, [events]);

  return (
    <div className="flex flex-col h-full bg-[#080b12] text-slate-100 p-6 overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Diagnóstico de Erros</h1>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                isCapturing
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCapturing ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {isCapturing ? 'Captura Ativa' : 'Captura Pausada'}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registro cronológico da execução real do LiveNexus e identificação de falhas em tempo real.
          </p>
        </div>

        {/* Controles de Captura */}
        <div className="flex items-center gap-2">
          {isCapturing ? (
            <button
              type="button"
              onClick={stopCapture}
              className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Pausar registro de eventos"
            >
              <Square size={14} className="fill-current" />
              <span>Parar Captura</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startCapture}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow-md cursor-pointer"
              title="Iniciar registro contínuo da execução"
            >
              <Play size={14} className="fill-current" />
              <span>Iniciar Captura</span>
            </button>
          )}

          <button
            type="button"
            onClick={clearEvents}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            title="Limpar todos os registros capturados"
          >
            <Trash2 size={14} />
            <span>Limpar Registros</span>
          </button>
        </div>
      </div>

      {/* Barra de métricas e status rápido */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-white/5 text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-4">
          <span>
            Total de eventos: <strong className="text-white font-mono">{events.length}</strong>
          </span>
          <span>
            Erros detectados:{' '}
            <strong className={`font-mono ${totalErrors > 0 ? 'text-red-400' : 'text-slate-300'}`}>
              {totalErrors}
            </strong>
          </span>
          <span>
            Avisos:{' '}
            <strong className={`font-mono ${totalWarns > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {totalWarns}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-black/40 border-white/20 text-violet-500 focus:ring-0"
            />
            <span>Rolar automaticamente ao final</span>
          </label>
        </div>
      </div>

      {/* Formulário para Testar Rota da Aplicação */}
      <div className="my-3 p-3 bg-white/[0.03] border border-white/10 rounded-xl shrink-0">
        <form onSubmit={handleRunRouteTest} className="flex flex-col sm:flex-row gap-2 items-center">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="Testar URL ou rota interna do LiveNexus (ex: /painel-admin)"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
              disabled={isTestingRoute}
            />
          </div>
          <button
            type="submit"
            disabled={isTestingRoute || !testUrl.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer"
          >
            {isTestingRoute ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Testando execução...</span>
              </>
            ) : (
              <>
                <ExternalLink size={13} />
                <span>Testar Rota</span>
              </>
            )}
          </button>
        </form>
        {isTestingRoute && (
          <p className="text-[11px] text-violet-300 mt-2 flex items-center gap-1.5 animate-pulse">
            <Info size={12} />
            Renderizando componentes da rota em ambiente isolado para capturar erros reais em tempo de execução...
          </p>
        )}
      </div>

      {/* Sandbox oculta para execução e captura da rota de teste */}
      {testIframeSrc && (
        <iframe
          src={testIframeSrc}
          title="Sandbox de Teste de Diagnóstico"
          className="hidden"
          sandbox="allow-scripts allow-same-origin"
          aria-hidden="true"
        />
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterLevel('all')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                filterLevel === 'all' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterLevel('error')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                filterLevel === 'error' ? 'bg-red-500/20 text-red-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Apenas Erros ({totalErrors})
            </button>
            <button
              type="button"
              onClick={() => setFilterLevel('warn')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                filterLevel === 'warn' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Erros & Avisos ({totalErrors + totalWarns})
            </button>
          </div>

          {availableModules.length > 2 && (
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">Todos os módulos</option>
              {availableModules
                .filter((m) => m !== 'all')
                .map((m) => (
                  <option key={m} value={m}>
                    Módulo: {m}
                  </option>
                ))}
            </select>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar registros..."
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
          />
        </div>
      </div>

      {/* Lista de Registros Cronológicos */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 rounded-lg">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center">
            <Info size={28} className="text-slate-500 mb-2" />
            <p className="text-sm font-medium text-slate-300">Nenhum registro encontrado</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {events.length === 0
                ? 'Inicie a captura e execute ações no LiveNexus para acompanhar o fluxo de execução em tempo real.'
                : 'Nenhum registro corresponde aos filtros selecionados.'}
            </p>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isError = ev.level === 'error';
            const isWarn = ev.level === 'warn';
            const isExpanded = expandedDetails[ev.id];
            const isCopied = copiedId === ev.id;

            return (
              <div
                key={ev.id}
                className={`rounded-xl border transition p-3.5 ${
                  isError
                    ? 'bg-red-950/25 border-red-500/30 hover:border-red-500/50 shadow-sm'
                    : isWarn
                    ? 'bg-amber-950/15 border-amber-500/25 hover:border-amber-500/40'
                    : 'bg-white/[0.03] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {isError ? (
                        <AlertCircle size={16} className="text-red-400" />
                      ) : isWarn ? (
                        <AlertTriangle size={16} className="text-amber-400" />
                      ) : (
                        <Info size={16} className="text-blue-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-1">
                        <span className="font-mono text-slate-400">{ev.timeFormatted}</span>
                        <span
                          className={`font-semibold uppercase px-1.5 py-0.5 rounded text-[10px] ${
                            isError
                              ? 'bg-red-500/20 text-red-300'
                              : isWarn
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          [{ev.level}]
                        </span>
                        <span className="font-medium text-slate-200 bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
                          {ev.module}
                        </span>
                        {ev.component && (
                          <span className="text-slate-400 bg-white/5 px-1.5 py-0.5 rounded text-[10px]">
                            {ev.component}
                          </span>
                        )}
                        {ev.action && (
                          <span className="text-slate-500 text-[10px]">· {ev.action}</span>
                        )}
                      </div>

                      <p
                        className={`text-xs break-words ${
                          isError ? 'font-semibold text-red-200' : 'text-slate-200'
                        }`}
                      >
                        {isError ? `Houve um erro em ${ev.module}: ${ev.message}` : ev.message}
                      </p>

                      {/* Rota onde ocorreu */}
                      {ev.route && (
                        <p className="text-[10px] text-slate-500 mt-1 truncate">
                          Rota: <span className="font-mono text-slate-400">{ev.route}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações do item */}
                  <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                    {/* Botão de Cópia Técnica */}
                    <button
                      type="button"
                      onClick={() => handleCopy(ev)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isError
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
                          : 'bg-white/10 hover:bg-white/15 text-slate-200'
                      }`}
                      title="Copiar relatório técnico completo deste registro para transferência"
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} className="text-emerald-300" />
                          <span className="text-emerald-300">COPIADO!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>COPIAR RELATÓRIO</span>
                        </>
                      )}
                    </button>

                    {/* Toggle de Detalhes Técnicos */}
                    {(ev.error?.stack || ev.componentStack || ev.details) && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(ev.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                        title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes técnicos'}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Detalhes Técnicos Expandidos (Exclusivo da Visualização Admin) */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-[11px] font-mono">
                    {ev.error?.stack && (
                      <div>
                        <span className="text-red-400 font-semibold block mb-1">Stack Trace:</span>
                        <pre className="bg-black/60 p-2.5 rounded border border-red-500/20 text-red-200/90 whitespace-pre-wrap overflow-x-auto max-h-48 text-[10px]">
                          {ev.error.stack}
                        </pre>
                      </div>
                    )}

                    {ev.componentStack && (
                      <div>
                        <span className="text-violet-400 font-semibold block mb-1">Component Stack:</span>
                        <pre className="bg-black/60 p-2.5 rounded border border-white/10 text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-48 text-[10px]">
                          {ev.componentStack}
                        </pre>
                      </div>
                    )}

                    {ev.details && (
                      <div>
                        <span className="text-slate-400 font-semibold block mb-1">Contexto adicional:</span>
                        <pre className="bg-black/60 p-2.5 rounded border border-white/10 text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-36 text-[10px]">
                          {JSON.stringify(ev.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={listEndRef} />
      </div>
    </div>
  );
}
