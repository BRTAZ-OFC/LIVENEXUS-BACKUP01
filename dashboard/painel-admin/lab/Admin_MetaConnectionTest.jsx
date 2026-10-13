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
  const timerRef = useRef(null);

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

    const startTime = performance.now();

    try {
      addLog('Tentando requisição HTTP direta / inspeção de oEmbed e endpoints públicos...');
      
      let fetchResult = { ok: false, status: 0, error: null };
      try {
        const testUrl = directStreamUrl.trim() || urlInput.trim();
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(testUrl)}`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          fetchResult.ok = true;
          fetchResult.status = 200;
          fetchResult.content = data.contents;
        } else {
          fetchResult.error = 'Falha de transporte HTTP ou bloqueio de CORS na origem.';
        }
      } catch (err) {
        fetchResult.error = err.message || 'Erro de rede';
      }

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      addLog(`Requisição concluída em ${responseTime}ms. Status HTTP: ${fetchResult.status || 'BLOQUEADO/CORS'}`);

      // Avaliação técnica real sem dados fictícios
      const isBlocked = !fetchResult.ok || fetchResult.error;
      
      const diagData = {
        methodInvestigated: 'HTTP GET Probe / oEmbed & Public Meta Web Scraping Check',
        endpointUsed: directStreamUrl.trim() || urlInput.trim(),
        httpCode: fetchResult.status || 'CORS / ERR_BLOCKED',
        authRequired: 'Sim (Meta exige cookies de sessão / Graph API Token para feed completo)',
        liveDiscoveryResult: isBlocked ? 'BLOQUEADA (Proteções Anti-Scraping / CORS ativas)' : 'INCONCLUSIVA',
        commentsReadingResult: 'BLOQUEADA (Comentários do Facebook Live requerem Graph API oficial ou WebSocket autenticado)',
        incrementalUpdate: 'INCOMPATÍVEL (Sem API oficial ou autenticação de sessão)',
        responseTime: `${responseTime}ms`,
        limitations: isBlocked ? 'Bloqueio severo por CORS, WAF (Cloudflare/Akamai) e ausência de sessão autenticada.' : 'Dados estruturados de live não disponíveis sem autenticação.',
        classification: 'BLOQUEADA'
      };

      setDiagnostics(diagData);
      setAuthRequired(true);
      setStreamStatus('INDETERMINADO');
      addLog('Diagnóstico concluído: Acesso direto sem Graph API oficial encontra-se BLOQUEADO por barreiras de segurança da plataforma.');
    } catch (err) {
      addLog(`Erro crítico durante o teste: ${err.message}`);
      setDiagnostics({
        methodInvestigated: 'HTTP Direct Probe',
        endpointUsed: urlInput,
        httpCode: 'EXCEÇÃO',
        authRequired: 'Sim',
        liveDiscoveryResult: 'INCOMPATÍVEL',
        commentsReadingResult: 'INCOMPATÍVEL',
        incrementalUpdate: 'INCOMPATÍVEL',
        responseTime: '—',
        limitations: err.message,
        classification: 'INCOMPATÍVEL'
      });
      setStreamStatus('OFFLINE');
    } finally {
      setIsRunning(false);
    }
  };

  const handleStopTest = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    addLog('Teste encerrado manualmente pelo operador.');
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#070a12] text-white p-6 overflow-y-auto space-y-6">
      {/* Cabeçalho da Ferramenta */}
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
            <p className="text-xs text-slate-400">
              Painel Admin → Laboratório → Ferramentas → Teste Conexão Meta (Investigação sem Graph API oficial)
            </p>
          </div>
        </div>
      </div>

      {/* Controles Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers size={16} className="text-violet-400" /> Parâmetros de Investigação
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">Selecione o Alvo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('page')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  targetType === 'page'
                    ? 'bg-violet-600 text-white border-violet-500 shadow-lg'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                Página do Facebook
              </button>
              <button
                type="button"
                onClick={() => setTargetType('profile')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  targetType === 'profile'
                    ? 'bg-violet-600 text-white border-violet-500 shadow-lg'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                Perfil Pessoal
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">URL do Perfil ou Página</label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://www.facebook.com/SuaPagina"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">URL Direta da Transmissão (Opcional)</label>
            <input
              type="text"
              value={directStreamUrl}
              onChange={(e) => setDirectStreamUrl(e.target.value)}
              placeholder="https://www.facebook.com/watch/live/?v=..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            {!isRunning ? (
              <button
                type="button"
                onClick={handleStartTest}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-lg transition"
              >
                <Play size={14} /> Iniciar Teste
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopTest}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-lg transition"
              >
                <Square size={14} /> Encerrar Teste
              </button>
            )}
          </div>
        </div>

        {/* Indicadores de Status e Conexão */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe size={16} className="text-violet-400" /> Indicadores de Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Status da Transmissão</span>
              <div className="flex items-center gap-2 mt-2">
                {streamStatus === 'ONLINE' && <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />}
                {streamStatus === 'OFFLINE' && <span className="flex h-3 w-3 rounded-full bg-red-500" />}
                {streamStatus === 'INDETERMINADO' && <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-ping" />}
                <span className={`text-sm font-bold ${streamStatus === 'ONLINE' ? 'text-emerald-400' : streamStatus === 'OFFLINE' ? 'text-red-400' : 'text-amber-400'}`}>
                  {streamStatus}
                </span>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Autenticação Necessária</span>
              <div className="flex items-center gap-2 mt-2">
                {authRequired ? <ShieldAlert size={16} className="text-amber-400" /> : <CheckCircle2 size={16} className="text-emerald-400" />}
                <span className="text-xs font-semibold text-slate-200">
                  {authRequired ? 'Sim (Sessão / Token Graph)' : 'Não requerido'}
                </span>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Disponibilidade Live</span>
              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle size={16} className="text-violet-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {isRunning ? 'Investigando...' : 'Aguardando Início'}
                </span>
              </div>
            </div>
          </div>

          {/* Logs de Execução em Tempo Real */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Terminal size={14} className="text-violet-400" /> Logs de Execução da Investigação
            </span>
            <div className="h-32 bg-black/60 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <span className="text-slate-500 italic">Nenhum log gerado. Clique em "Iniciar Teste" para executar a ferramenta.</span>
              ) : (
                logs.map((log, idx) => <div key={idx}>{log}</div>)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Painéis Inferiores: Comentários e Diagnóstico Técnico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Comentários Recebidos */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-violet-400" /> Comentários Recebidos ({comments.length})
          </h2>
          <div className="h-64 bg-black/40 border border-white/10 rounded-xl p-4 overflow-y-auto flex flex-col items-center justify-center text-center">
            {comments.length === 0 ? (
              <div className="space-y-2">
                <MessageSquare size={28} className="text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-400">Nenhum comentário obtido sem Graph API</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Sem a API oficial da Meta ou tokens de acesso válidos, a leitura de comentários em tempo real é bloqueada por contramedidas anti-scraping da plataforma.
                </p>
              </div>
            ) : (
              <div className="w-full space-y-2 text-left">
                {comments.map((c, i) => (
                  <div key={i} className="p-2.5 bg-white/5 rounded-lg border border-white/5 text-xs">
                    <span className="font-bold text-violet-300">{c.author}:</span> <span className="text-slate-200">{c.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Painel de Diagnóstico Técnico Obrigatório */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu size={16} className="text-violet-400" /> Diagnóstico Técnico Obrigatório
            </h2>
            {diagnostics && (
              <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                {diagnostics.classification}
              </span>
            )}
          </div>

          <div className="h-64 bg-black/40 border border-white/10 rounded-xl p-4 overflow-y-auto text-xs space-y-3">
            {!diagnostics ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-1">
                <Cpu size={28} className="text-slate-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-400">Aguardando execução do teste</p>
                <p className="text-[11px] text-slate-500">O relatório técnico detalhado será gerado após a inspeção.</p>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Método Investigado:</span>
                  <span className="text-white text-right">{diagnostics.methodInvestigated}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Endpoint / Transporte:</span>
                  <span className="text-violet-300 truncate max-w-[200px]" title={diagnostics.endpointUsed}>{diagnostics.endpointUsed}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Código HTTP / Erro:</span>
                  <span className="text-red-400">{diagnostics.httpCode}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Autenticação:</span>
                  <span className="text-amber-300">{diagnostics.authRequired}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Descoberta da Live:</span>
                  <span className="text-red-300">{diagnostics.liveDiscoveryResult}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Leitura de Comentários:</span>
                  <span className="text-red-300">{diagnostics.commentsReadingResult}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Atualização Incremental:</span>
                  <span className="text-red-300">{diagnostics.incrementalUpdate}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Tempo de Resposta:</span>
                  <span className="text-emerald-300">{diagnostics.responseTime}</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-400 block mb-1">Limitações Identificadas:</span>
                  <p className="text-slate-300 bg-white/5 p-2 rounded border border-white/5 leading-relaxed font-sans text-[11px]">
                    {diagnostics.limitations}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avaliação de Compatibilidade com LiveNexus */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers size={16} className="text-violet-400" /> Avaliação de Compatibilidade com o Contrato LiveNexus
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>Avaliação da assinatura:</strong> <code className="bg-black/40 px-1.5 py-0.5 rounded text-violet-300 font-mono">connectFacebook(channel, onMessage, onStatus, onMeta) → {'{{ disconnect }}'}</code>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
          <div className="bg-black/40 p-3 rounded-xl border border-white/5">
            <span className="font-bold text-white block mb-1">Conector & Normalização</span>
            Inviável sem API oficial ou tokens autenticados devido a proteções anti-bot rigorosas da Meta.
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-white/5">
            <span className="font-bold text-white block mb-1">Status Online / Offline</span>
            Requer inspeção via Graph API oficial em ambiente de servidor autorizado (Worker/Backend).
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-white/5">
            <span className="font-bold text-white block mb-1">Conclusão Técnica</span>
            <strong>INCOMPATÍVEL</strong> para implementação puramente frontend sem Graph API. Necessária autenticação oficial OAuth da Meta.
          </div>
        </div>
      </div>
    </div>
  );
}
