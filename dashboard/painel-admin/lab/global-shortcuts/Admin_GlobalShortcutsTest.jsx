import { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Terminal,
  EyeOff,
  Eye,
  Info,
  Zap,
  Gamepad2,
  Trash2,
  AlertTriangle,
  Clock,
  Layers
} from 'lucide-react';

// Formata a descrição sucinta de um elemento DOM
const formatElementDescription = (el) => {
  if (!el) return 'null';
  if (typeof window !== 'undefined' && el === window) return 'WINDOW';
  if (typeof document !== 'undefined' && el === document) return 'DOCUMENT';

  try {
    const tagName = el.tagName ? el.tagName.toLowerCase() : 'element';
    const idStr = el.id ? `#${el.id}` : '';
    const classStr = el.className && typeof el.className === 'string'
      ? `.${el.className.split(' ').filter(Boolean).slice(0, 2).join('.')}`
      : '';
    return `${tagName}${idStr}${classStr}` || 'unknown';
  } catch {
    return 'unknown';
  }
};

export default function AdminGlobalShortcutsTest() {
  const [logs, setLogs] = useState([]);
  const [windowFocused, setWindowFocused] = useState(
    typeof document !== 'undefined' ? document.hasFocus() : true
  );
  const [visibilityState, setVisibilityState] = useState(
    typeof document !== 'undefined' ? document.visibilityState : 'visible'
  );

  // Contadores detalhados de telemetria
  const [counts, setCounts] = useState({
    total: 0,
    focused: 0,
    unfocused: 0,
    keydown: 0,
    keyup: 0,
    focus: 0,
    blur: 0,
    visibilitychange: 0,
    orphanKeyups: 0,
    rapidTransitions: 0,
  });

  const [copiedReport, setCopiedReport] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'UNFOCUSED' | 'ORPHAN_KEYUPS' | 'FOCUS_BLUR'
  const logContainerRef = useRef(null);

  // Mapeamento em memória para identificar Keyups Órfãos e deltas de tempo
  const activeKeysRef = useRef(new Set());
  const lastTransitionTimeRef = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());

  // Auto-scroll no console quando novos eventos chegam
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Registrador genérico de telemetria bruta em tempo real
  const recordEvent = (eventType, eventObj = {}) => {
    const timeNow = new Date();
    const formattedTime = `${timeNow.toLocaleTimeString()}.${String(timeNow.getMilliseconds()).padStart(3, '0')}`;
    const nowPerf = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const timeDeltaMs = Math.round(nowPerf - lastTransitionTimeRef.current);
    lastTransitionTimeRef.current = nowPerf;

    const isFocused = typeof document !== 'undefined' ? document.hasFocus() : false;
    const currentVisState = typeof document !== 'undefined' ? document.visibilityState : 'unknown';

    const key = eventObj.key !== undefined ? eventObj.key : '-';
    const code = eventObj.code !== undefined ? eventObj.code : '-';
    const ctrlKey = Boolean(eventObj.ctrlKey);
    const shiftKey = Boolean(eventObj.shiftKey);
    const altKey = Boolean(eventObj.altKey);
    const metaKey = Boolean(eventObj.metaKey);
    const repeat = Boolean(eventObj.repeat);
    const isTrusted = eventObj.isTrusted !== undefined ? Boolean(eventObj.isTrusted) : true;

    const activeElementStr = typeof document !== 'undefined' ? formatElementDescription(document.activeElement) : 'null';
    const targetStr = formatElementDescription(eventObj.target);
    const relatedTargetStr = formatElementDescription(eventObj.relatedTarget);

    // Lógica para detecção de KEYUP Órfão (keyup recebido sem keydown prévio registrado)
    let isOrphanKeyUp = false;
    if (eventType === 'keydown') {
      const keyCode = code !== '-' ? code : key;
      if (keyCode && keyCode !== '-') {
        activeKeysRef.current.add(keyCode);
      }
    } else if (eventType === 'keyup') {
      const keyCode = code !== '-' ? code : key;
      if (keyCode && keyCode !== '-') {
        if (!activeKeysRef.current.has(keyCode)) {
          isOrphanKeyUp = true;
        } else {
          activeKeysRef.current.delete(keyCode);
        }
      }
    }

    // Identifica transição rápida de focus/blur (< 200ms)
    const isRapidFocusBlur = (eventType === 'focus' || eventType === 'blur') && timeDeltaMs < 200;

    const newLogItem = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: formattedTime,
      type: eventType,
      key,
      code,
      ctrlKey,
      shiftKey,
      altKey,
      metaKey,
      repeat,
      isTrusted,
      hasFocus: isFocused,
      visibilityState: currentVisState,
      activeElement: activeElementStr,
      target: targetStr,
      relatedTarget: relatedTargetStr,
      isOrphanKeyUp,
      timeDeltaMs,
    };

    setLogs((prev) => [...prev.slice(-499), newLogItem]); // Mantém os últimos 500 eventos

    // Atualiza os contadores
    setCounts((prev) => ({
      ...prev,
      total: prev.total + 1,
      focused: isFocused ? prev.focused + 1 : prev.focused,
      unfocused: !isFocused ? prev.unfocused + 1 : prev.unfocused,
      [eventType]: (prev[eventType] || 0) + 1,
      orphanKeyups: isOrphanKeyUp ? prev.orphanKeyups + 1 : prev.orphanKeyups,
      rapidTransitions: isRapidFocusBlur ? prev.rapidTransitions + 1 : prev.rapidTransitions,
    }));
  };

  // Captura bruta de eventos de teclado, foco e visibilidade
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Handlers de Teclado (keydown / keyup) em modo capture
    const handleKeyDown = (e) => {
      recordEvent('keydown', e);
    };

    const handleKeyUp = (e) => {
      recordEvent('keyup', e);
    };

    // 2. Handlers de Foco (focus / blur)
    const handleFocus = (e) => {
      setWindowFocused(true);
      recordEvent('focus', e);
    };

    const handleBlur = (e) => {
      setWindowFocused(false);
      recordEvent('blur', e);
    };

    // 3. Handler de Visibilidade (visibilitychange)
    const handleVisibilityChange = (e) => {
      const currentVis = document.visibilityState;
      setVisibilityState(currentVis);
      recordEvent('visibilitychange', e);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('focus', handleFocus, true);
    window.addEventListener('blur', handleBlur, true);
    document.addEventListener('visibilitychange', handleVisibilityChange, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('focus', handleFocus, true);
      window.removeEventListener('blur', handleBlur, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange, true);
    };
  }, []);

  // Limpar histórico e contadores
  const handleClear = () => {
    setLogs([]);
    activeKeysRef.current.clear();
    setCounts({
      total: 0,
      focused: 0,
      unfocused: 0,
      keydown: 0,
      keyup: 0,
      focus: 0,
      blur: 0,
      visibilitychange: 0,
      orphanKeyups: 0,
      rapidTransitions: 0,
    });
  };

  // Gerar e Copiar Relatório Completo com Telemetria Avançada
  const buildReport = () => {
    const timeStr = new Date().toLocaleString();
    const userAgentStr = typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconhecido';
    const isSteamOverlay = userAgentStr.toLowerCase().includes('valve') || userAgentStr.toLowerCase().includes('steam');

    const reportLines = [
      '===================================================================',
      'RELATÓRIO DE TELEMETRIA AVANÇADA DE EVENTOS: STEAM GAMEOVERLAY / CHROMIUM',
      '===================================================================',
      `Data/Hora do Teste          : ${timeStr}`,
      `User Agent                  : ${userAgentStr}`,
      `Detecção de Steam Overlay   : ${isSteamOverlay ? 'SIM (Navegador do Steam GameOverlay)' : 'NÃO (Navegador Padrão / Chrome / Edge)'}`,
      `Estado do Foco Atual        : ${windowFocused ? 'FOCADO (document.hasFocus() = true)' : 'SEM FOCO (document.hasFocus() = false)'}`,
      `Estado da Visibilidade      : ${visibilityState} (document.visibilityState)`,
      `Elemento Ativo Atual        : ${typeof document !== 'undefined' ? formatElementDescription(document.activeElement) : 'N/A'}`,
      '-------------------------------------------------------------------',
      'METRICAS DE TELEMETRIA E CONTADORES:',
      `• Total de Eventos Registrados : ${counts.total}`,
      `• Eventos Recebidos COM FOCO   : ${counts.focused}`,
      `• Eventos Recebidos SEM FOCO   : ${counts.unfocused}`,
      `• Eventos 'keydown'            : ${counts.keydown}`,
      `• Eventos 'keyup'              : ${counts.keyup}`,
      `• Eventos 'focus'              : ${counts.focus}`,
      `• Eventos 'blur'               : ${counts.blur}`,
      `• Eventos 'visibilitychange'   : ${counts.visibilitychange}`,
      `• KEYUPS ÓRFÃOS (sem keydown)  : ${counts.orphanKeyups}`,
      `• Transições Rápidas Focus/Blur: ${counts.rapidTransitions}`,
      '-------------------------------------------------------------------',
      'HISTÓRICO DETALHADO DOS EVENTOS CAPTURADOS:',
      ...(logs.length === 0
        ? ['(Nenhum evento capturado até o momento)']
        : logs.map((l, idx) => {
            const mods = [
              l.ctrlKey ? 'Ctrl' : null,
              l.shiftKey ? 'Shift' : null,
              l.altKey ? 'Alt' : null,
              l.metaKey ? 'Meta' : null,
            ]
              .filter(Boolean)
              .join('+');

            const modStr = mods ? ` [Modificadores: ${mods}]` : '';
            const repStr = l.repeat ? ' (repeat: true)' : '';
            const trustedStr = l.isTrusted ? 'isTrusted: true' : 'isTrusted: FALSE';
            const orphanStr = l.isOrphanKeyUp ? ' [KEYUP ÓRFÃO!]' : '';

            return `${String(idx + 1).padStart(3, ' ')}. [${l.timestamp}] Evento: ${l.type.toUpperCase().padEnd(16, ' ')} | Key: "${l.key}" | Code: "${l.code}"${modStr}${repStr}${orphanStr} | ${trustedStr} | Foco: ${l.hasFocus ? 'COM_FOCO' : 'SEM_FOCO'} | Vis: ${l.visibilityState} | ActiveElem: ${l.activeElement} | Target: ${l.target} | RelatedTarget: ${l.relatedTarget} | Δt: ${l.timeDeltaMs}ms`;
          })),
      '===================================================================',
      'FIM DO RELATÓRIO DE TELEMETRIA AVANÇADA DE TECLADO, FOCO E ALVO',
      '==================================================================='
    ];

    return reportLines.join('\n');
  };

  const handleCopyReport = () => {
    const rep = buildReport();
    navigator.clipboard.writeText(rep);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (filterType === 'UNFOCUSED') return !l.hasFocus;
    if (filterType === 'ORPHAN_KEYUPS') return l.isOrphanKeyUp;
    if (filterType === 'FOCUS_BLUR') return l.type === 'focus' || l.type === 'blur' || l.type === 'visibilitychange';
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Banner Principal e Status de Telemetria Avançada */}
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-[#070a14] via-[#0d1222] to-[#080b18] p-6 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-12 w-12 place-items-center rounded-2xl border transition-all ${
                windowFocused
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/20 animate-pulse'
              }`}
            >
              <Gamepad2 size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Laboratório: Telemetria Avançada (Focus, Blur & Keyup Órfão)</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono">
                    STEAM OVERLAY / CHROMIUM DIAGNOSTIC
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Investigação de transições rápidas de foco, vazamento de teclas e Keyups sem Keydown correspondente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition cursor-pointer"
              title="Limpar todos os logs e zera os contadores"
            >
              <RotateCcw size={13} />
              <span>Limpar</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition cursor-pointer"
            >
              {copiedReport ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
              <span>{copiedReport ? 'Relatório Copiado!' : 'Copiar Relatório'}</span>
            </button>
          </div>
        </div>

        {/* Indicadores Visuais LED do Estado Atual e Novas Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs relative z-10">
          {/* Status do Foco */}
          <div className="rounded-xl border border-white/10 bg-black/80 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">document.hasFocus()</span>
              <span
                className={`font-bold flex items-center gap-1.5 ${
                  windowFocused ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
                }`}
              >
                {windowFocused ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{windowFocused ? 'COM FOCO' : 'SEM FOCO'}</span>
              </span>
            </div>
          </div>

          {/* Status da Visibilidade */}
          <div className="rounded-xl border border-white/10 bg-black/80 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">visibilityState</span>
              <span
                className={`font-bold uppercase ${
                  visibilityState === 'visible' ? 'text-cyan-300' : 'text-slate-400'
                }`}
              >
                {visibilityState}
              </span>
            </div>
          </div>

          {/* Keyups Órfãos (Keyup sem Keydown) */}
          <div className={`rounded-xl border p-3 flex items-center justify-between ${
            counts.orphanKeyups > 0 ? 'border-red-500/40 bg-red-950/30' : 'border-white/10 bg-black/80'
          }`}>
            <div className="space-y-0.5">
              <span className="text-[10px] text-red-400 uppercase font-bold block">Keyups Órfãos</span>
              <span className={`text-lg font-bold ${counts.orphanKeyups > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                {counts.orphanKeyups}
              </span>
            </div>
            <AlertTriangle size={18} className={counts.orphanKeyups > 0 ? 'text-red-400' : 'text-slate-600'} />
          </div>

          {/* Transições Rápidas Focus/Blur */}
          <div className="rounded-xl border border-white/10 bg-black/80 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-purple-400 uppercase font-bold block">Transições Rápidas</span>
              <span className="text-lg font-bold text-purple-300">{counts.rapidTransitions}</span>
            </div>
            <Clock size={18} className="text-purple-400/50" />
          </div>

          {/* Eventos SEM FOCO */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-amber-400 uppercase font-bold block">Eventos Sem Foco</span>
              <span className="text-lg font-bold text-amber-300">{counts.unfocused}</span>
            </div>
            <Zap size={18} className="text-amber-400/50" />
          </div>
        </div>
      </div>

      {/* DETALHAMENTO DE ELEMENTOS DOM E ALVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Métricas de Alvo e Foco Ativo (5 colunas) */}
        <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/70 p-5 space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-2">
              <Layers size={14} />
              Alvos e Elemento Ativo Atual
            </h4>
            <span className="text-[10px] text-slate-500">Total: {counts.total}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl border border-white/5 bg-[#060810] space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">document.activeElement:</span>
              <span className="text-emerald-300 font-bold break-all block">
                {typeof document !== 'undefined' ? formatElementDescription(document.activeElement) : 'N/A'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl border border-white/5 bg-[#060810]">
                <span className="text-slate-500 block text-[10px]">keydown:</span>
                <strong className="text-white text-sm">{counts.keydown}</strong>
              </div>

              <div className="p-2.5 rounded-xl border border-white/5 bg-[#060810]">
                <span className="text-slate-500 block text-[10px]">keyup:</span>
                <strong className="text-white text-sm">{counts.keyup}</strong>
              </div>

              <div className="p-2.5 rounded-xl border border-white/5 bg-[#060810]">
                <span className="text-slate-500 block text-[10px]">focus:</span>
                <strong className="text-emerald-400 text-sm">{counts.focus}</strong>
              </div>

              <div className="p-2.5 rounded-xl border border-white/5 bg-[#060810]">
                <span className="text-slate-500 block text-[10px]">blur:</span>
                <strong className="text-amber-400 text-sm">{counts.blur}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Explicação do Diagnóstico de Keyup Órfão e Focus Leaks (7 colunas) */}
        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/70 p-5 space-y-3 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-violet-300 font-bold uppercase tracking-wider pb-2 border-b border-white/10">
            <Info size={15} />
            <span>O que investigar nas perdas de foco do Steam GameOverlay</span>
          </div>

          <div className="space-y-2 text-slate-300">
            <p>
              <strong className="text-white">1. Keyups Órfãos (Keyup sem Keydown):</strong> Ocorre quando o usuário pressiona e segura uma tecla enquanto a janela perde o foco (o <code className="text-violet-300">keydown</code> é consumido pelo jogo), mas ao soltar a tecla quando a janela recupera o foco, o Chromium do Steam Overlay entrega um <code className="text-amber-300">keyup</code> isolado.
            </p>
            <p>
              <strong className="text-white">2. Transições Rápidas (Δt &lt; 200ms):</strong> Durante o acionamento do atalho do Steam Overlay (<code className="text-slate-300">Shift+Tab</code>), o navegador pode disparar rajadas rápidas de <code className="text-cyan-300">focus</code> e <code className="text-amber-300">blur</code> consecutivas.
            </p>
            <p>
              <strong className="text-white">3. Alvos e `isTrusted`:</strong> Verifique a coluna <code className="text-slate-300">isTrusted</code> e <code className="text-slate-300">relatedTarget</code> para confirmar se os eventos são nativos do SO ou sintéticos.
            </p>
          </div>
        </div>
      </div>

      {/* CONSOLE DE HISTÓRICO BRUTO COM NOVOS CAMPOS DE TELEMETRIA */}
      <div className="rounded-2xl border border-white/10 bg-black/80 p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-violet-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Histórico de Telemetria ({filteredLogs.length} exibidos de {logs.length})
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtros de Exibição */}
            <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-white/10 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'ALL' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({logs.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('UNFOCUSED')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'UNFOCUSED' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sem Foco ({counts.unfocused})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('ORPHAN_KEYUPS')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'ORPHAN_KEYUPS' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Keyups Órfãos ({counts.orphanKeyups})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('FOCUS_BLUR')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'FOCUS_BLUR' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Focus/Blur ({counts.focus + counts.blur + counts.visibilitychange})
              </button>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
              title="Limpar Histórico"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Tabela de Eventos Brutos com os Novos Campos Solicitados */}
        <div
          ref={logContainerRef}
          className="max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-black font-mono text-[11px]"
        >
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0a0d18] border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider z-10">
              <tr>
                <th className="p-2.5">Horário</th>
                <th className="p-2.5">Evento</th>
                <th className="p-2.5">Key / Code</th>
                <th className="p-2.5">Mod / Repeat</th>
                <th className="p-2.5">isTrusted</th>
                <th className="p-2.5">hasFocus()</th>
                <th className="p-2.5">activeElement</th>
                <th className="p-2.5">Target / Related</th>
                <th className="p-2.5">Δt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500 font-sans italic">
                    Nenhum evento capturado até o momento. Pressione teclas ou altere o foco da janela para testar.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => {
                  const isKeyDown = l.type === 'keydown';
                  const isKeyUp = l.type === 'keyup';
                  const isFocus = l.type === 'focus';
                  const isBlur = l.type === 'blur';

                  const mods = [
                    l.ctrlKey ? 'Ctrl' : null,
                    l.shiftKey ? 'Shift' : null,
                    l.altKey ? 'Alt' : null,
                    l.metaKey ? 'Meta' : null,
                  ]
                    .filter(Boolean)
                    .join('+');

                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-white/5 transition-colors ${
                        l.isOrphanKeyUp
                          ? 'bg-red-950/40 text-red-200 font-bold'
                          : !l.hasFocus
                          ? 'bg-amber-500/10'
                          : ''
                      }`}
                    >
                      <td className="p-2.5 text-slate-400 shrink-0">{l.timestamp}</td>
                      <td className="p-2.5 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            l.isOrphanKeyUp
                              ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                              : isKeyDown
                              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                              : isKeyUp
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : isFocus
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isBlur
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {l.type}
                          {l.isOrphanKeyUp ? ' (ÓRFÃO)' : ''}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-white max-w-[130px] truncate">
                        {l.key !== '-' ? `${l.key} (${l.code})` : '-'}
                      </td>
                      <td className="p-2.5 text-violet-300">
                        {mods || 'Nenhum'}{l.repeat ? ' [Repeat]' : ''}
                      </td>
                      <td className="p-2.5">
                        <span className={l.isTrusted ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                          {l.isTrusted ? 'true' : 'FALSE'}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold">
                        <span className={l.hasFocus ? 'text-emerald-400' : 'text-amber-400 font-black'}>
                          {l.hasFocus ? 'true' : 'FALSE'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300 max-w-[120px] truncate" title={l.activeElement}>
                        {l.activeElement}
                      </td>
                      <td className="p-2.5 text-slate-400 max-w-[140px] truncate" title={`Target: ${l.target} | Related: ${l.relatedTarget}`}>
                        {l.target} / {l.relatedTarget}
                      </td>
                      <td className="p-2.5 text-slate-500">{l.timeDeltaMs}ms</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
