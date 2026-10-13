import React, { useState, useRef } from 'react';
import { Radio, Play, Square, ShieldAlert, CheckCircle2, AlertTriangle, Globe, MessageSquare, Terminal, Cpu, Layers } from 'lucide-react';

export default function AdminMetaConnectionTest() {
  const [targetType, setTargetType] = useState('page'); // 'page' | 'profile'
  const [urlInput, setUrlInput] = useState('');
  const [directStreamUrl, setDirectStreamUrl] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [streamStatus, setStreamStatus] = useState('INDETERMINADO'); // ONLINE | OFFLINE | INDETERMINADO
  const [authRequired, setAuthRequired] = useState(true);
  const [comments, setComments] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [logs, setLogs] = useState([]);
  const abortControllerRef = useRef(null);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleStartTest = async () => {
    if (!urlInput.trim()) {
      alert('Informe a URL do perfil ou Página do Facebook.');
      return;
    }

    setIsRunning(true);
    setStreamStatus('INDETERMINADO');
    setComments([]);
    setDiagnostics(null);
    setLogs([]);
    addLog(`Iniciando investigação de conexão Meta (${targetType === 'page' ? 'Página do Facebook' : 'Perfil Pessoal'})...`);
    addLog(`Alvo: ${urlInput}`);
    if (directStreamUrl) addLog(`URL de Transmissão Direta: ${directStreamUrl}`);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const startTime = performance.now();

    try {
      addLog('Iniciando diagnóstico técnico...');
      
      // 1. Investigação de transporte HTTP
      addLog('Testando conectividade de transporte HTTP...');
      let httpResult = { ok: false, status: 0, error: null };
      
      try {
        const testUrl = directStreamUrl.trim() || urlInput.trim();
        const res = await fetch(testUrl, { signal }).catch(err => {
          if (err.name === 'AbortError') throw err;
          return { ok: false, status: 0, statusText: err.message };
        });
        
        httpResult.ok = res.ok;
        httpResult.status = res.status;
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        httpResult.error = err.message;
      }

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // 2. Diagnóstico estruturado
      const diagData = {
        methodInvestigated: 'HTTP Transport Probe',
        endpointUsed: directStreamUrl.trim() || urlInput.trim(),
        httpCode: httpResult.status || 'ERR_CONNECTION',
        authRequired: 'Sim (Sessão / Token)',
        liveDiscoveryResult: 'INCONCLUSIVO - Requer análise técnica de conteúdo',
        commentsReadingResult: 'NÃO TESTADO - Requer WebSocket/Graph API',
        incrementalUpdate: 'NÃO TESTADO',
        responseTime: `${responseTime}ms`,
        limitations: httpResult.error || (httpResult.ok ? 'Transporte funcional, conteúdo requer autenticação.' : 'Bloqueado por CORS ou Proteções'),
        classification: 'INCONCLUSIVO'
      };

      setDiagnostics(diagData);
      setAuthRequired(true);
      setStreamStatus('INDETERMINADO');
      addLog('Diagnóstico técnico concluído.');
      
    } catch (err) {
      if (err.name === 'AbortError') {
        addLog('Teste interrompido pelo operador.');
      } else {
        addLog(`Erro durante o teste: ${err.message}`);
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopTest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    addLog('Teste encerrado manualmente pelo operador.');
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#070a12] text-white p-6 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-600/20 rounded-xl border border-violet-500/30 text-violet-400">
            <Radio size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">Teste Conexão Meta</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                EXPERIMENTAL / LAB
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers size={16} className="text-violet-400" /> Parâmetros
          </h2>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">URL do Perfil ou Página</label>
            <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://www.facebook.com/..." className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div className="pt-2">
            {!isRunning ? (
              <button onClick={handleStartTest} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-xs">
                <Play size={14} /> Iniciar Teste
              </button>
            ) : (
              <button onClick={handleStopTest} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl text-xs">
                <Square size={14} /> Encerrar Teste
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe size={16} className="text-violet-400" /> Status
          </h2>
          <div className="h-32 bg-black/60 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1">
            {logs.map((log, idx) => <div key={idx}>{log}</div>)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-violet-400" /> Comentários ({comments.length})
          </h2>
          <div className="h-64 bg-black/40 border border-white/10 rounded-xl p-4 overflow-y-auto">
            <p className="text-xs text-slate-500 text-center">Nenhum dado capturado.</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu size={16} className="text-violet-400" /> Diagnóstico
          </h2>
          <div className="h-64 bg-black/40 border border-white/10 rounded-xl p-4 overflow-y-auto text-xs space-y-3">
            {diagnostics ? (
              <pre className="font-mono text-[10px] text-slate-300">{JSON.stringify(diagnostics, null, 2)}</pre>
            ) : (
              <p className="text-xs text-slate-500 text-center">Aguardando resultados...</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-white">Avaliação de Compatibilidade</h2>
        <p className="text-xs text-slate-300">
          Assinatura: <code className="bg-black/40 px-1.5 py-0.5 rounded text-violet-300 font-mono">connectFacebook(channel, onMessage, onStatus, onMeta) → {'{ disconnect }'}</code>
        </p>
      </div>
    </div>
  );
}
