import { useState, useRef, useEffect } from 'react';
import {
  RadioTower,
  Play,
  Square,
  Trash2,
  Activity,
  Users,
  MessageSquare,
  Clock,
  Globe
} from 'lucide-react';

export default function YouTubeTest1Section() {
  const [handleInput, setHandleInput] = useState('@gaules');
  const [status, setStatus] = useState('idle'); // idle | bootstrapping | polling | failed | stopped
  const [statusMessage, setStatusMessage] = useState('Pronto para iniciar o teste.');

  // Live / Channel Metadata
  const [liveData, setLiveData] = useState({
    author: null,
    title: null,
    videoId: null,
    isLive: false,
    concurrentViewers: null,
    targetUrl: null,
    finalUrl: null,
  });

  // Chat Messages
  const [messages, setMessages] = useState([]);
  const [hasNewMsgPulse, setHasNewMsgPulse] = useState(false);

  // Counters (17 counters mandated)
  const [metrics, setMetrics] = useState({
    bootstrapRequests: 0,
    backendRequestsTotal: 0,
    postBootstrapBackendRequests: 0,
    frontendRequestsTotal: 0,
    chatRequests: 0,
    messagesReceived: 0,
    continuationsReceived: 0,
    reconnects: 0,
    rebootstraps: 0,
    lastIntervalMs: 0,
    lastTimeoutMs: 0,
    http200: 0,
    http403: 0,
    http429: 0,
    otherHttpErrors: 0,
    corsErrors: 0,
    networkErrors: 0,
  });

  // Call Logs
  const [callLogs, setCallLogs] = useState([]);

  // Loop control refs
  const abortControllerRef = useRef(null);
  const activeLoopRef = useRef(false);
  const sequenceCounterRef = useRef(1);
  const lastPollTimeRef = useRef(0);
  const chatBottomRef = useRef(null);

  // Auto-scroll chat on new messages
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const addCallLog = (logEntry) => {
    const seq = sequenceCounterRef.current++;
    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    setCallLogs((prev) => [
      {
        seq,
        time: nowStr,
        ...logEntry,
      },
      ...prev.slice(0, 99), // Keep latest 100
    ]);
  };

  const handleStop = () => {
    activeLoopRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('stopped');
    setStatusMessage('Teste interrompido pelo usuário.');
  };

  const handleClearLogs = () => {
    setCallLogs([]);
    setMessages([]);
    sequenceCounterRef.current = 1;
    setMetrics({
      bootstrapRequests: 0,
      backendRequestsTotal: 0,
      postBootstrapBackendRequests: 0,
      frontendRequestsTotal: 0,
      chatRequests: 0,
      messagesReceived: 0,
      continuationsReceived: 0,
      reconnects: 0,
      rebootstraps: 0,
      lastIntervalMs: 0,
      lastTimeoutMs: 0,
      http200: 0,
      http403: 0,
      http429: 0,
      otherHttpErrors: 0,
      corsErrors: 0,
      networkErrors: 0,
    });
  };

  const startFrontendChatPolling = async (bootstrapData) => {
    let currentContinuation = bootstrapData.continuation;
    const apiKey = bootstrapData.apiKey;
    const clientContext = bootstrapData.clientContext || {
      client: {
        clientName: 'WEB',
        clientVersion: bootstrapData.clientVersion || '2.20240501.01.00',
        hl: 'pt',
        gl: 'BR',
      },
    };

    if (!currentContinuation) {
      setStatus('failed');
      setStatusMessage('Bootstrap concluído, mas nenhum token de continuação de chat foi encontrado.');
      return;
    }

    setStatus('polling');
    setStatusMessage('Bootstrap realizado com sucesso. Iniciando polling do chat via Worker...');
    activeLoopRef.current = true;

    let pollIndex = 1;

    while (activeLoopRef.current) {
      const pollStartTime = Date.now();
      if (lastPollTimeRef.current > 0) {
        const interval = pollStartTime - lastPollTimeRef.current;
        setMetrics((m) => ({ ...m, lastIntervalMs: interval }));
      }
      lastPollTimeRef.current = pollStartTime;

      setMetrics((m) => ({
        ...m,
        frontendRequestsTotal: m.frontendRequestsTotal + 1,
        chatRequests: m.chatRequests + 1,
      }));

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const endpoint = 'https://youtube-innertube.radiotweet.workers.dev/live-chat';
      const payload = {
        apiKey,
        clientContext,
        continuation: currentContinuation,
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal,
        });

        const durationMs = Date.now() - pollStartTime;
        const httpStatus = response.status;

        if (!response.ok) {
          if (httpStatus === 403) {
            setMetrics((m) => ({ ...m, http403: m.http403 + 1 }));
            addCallLog({
              origin: 'WORKER',
              purpose: `Chat Poll #${pollIndex}`,
              endpoint: 'youtube-innertube.radiotweet.workers.dev/live-chat',
              method: 'POST',
              status: 'HTTP 403',
              durationMs,
              result: 'HTTP 403 Forbidden retornado pelo Worker / YouTube',
            });
          } else if (httpStatus === 429) {
            setMetrics((m) => ({ ...m, http429: m.http429 + 1 }));
            addCallLog({
              origin: 'WORKER',
              purpose: `Chat Poll #${pollIndex}`,
              endpoint: 'youtube-innertube.radiotweet.workers.dev/live-chat',
              method: 'POST',
              status: 'HTTP 429',
              durationMs,
              result: 'HTTP 429 Too Many Requests (Rate limit)',
            });
          } else {
            setMetrics((m) => ({ ...m, otherHttpErrors: m.otherHttpErrors + 1 }));
            addCallLog({
              origin: 'WORKER',
              purpose: `Chat Poll #${pollIndex}`,
              endpoint: 'youtube-innertube.radiotweet.workers.dev/live-chat',
              method: 'POST',
              status: `HTTP ${httpStatus}`,
              durationMs,
              result: `Erro HTTP ${httpStatus}`,
            });
          }

          setStatus('failed');
          setStatusMessage(`Requisição de chat via Worker falhou com HTTP ${httpStatus}.`);
          activeLoopRef.current = false;
          break;
        }

        // Sucesso HTTP 200
        const data = await response.json();
        setMetrics((m) => ({ ...m, http200: m.http200 + 1 }));

        const chatContinuationObj = data?.continuationContents?.liveChatContinuation;
        const actions = chatContinuationObj?.actions || [];
        const nextConts = chatContinuationObj?.continuations || [];

        let newMsgs = [];
        for (const act of actions) {
          const item = act?.addChatItemAction?.item?.liveChatTextMessageRenderer;
          if (item) {
            const author = item?.authorName?.simpleText || 'Anônimo';
            const msgText = item?.message?.runs?.map((r) => r.text).join('') || '';
            const timestamp = item?.timestampUsec
              ? new Date(parseInt(item.timestampUsec, 10) / 1000).toLocaleTimeString('pt-BR')
              : new Date().toLocaleTimeString('pt-BR');
            const avatar = item?.authorPhoto?.thumbnails?.[0]?.url || null;
            newMsgs.push({
              id: item.id || crypto.randomUUID(),
              author,
              text: msgText,
              time: timestamp,
              avatar,
            });
          }
        }

        if (newMsgs.length > 0) {
          setMessages((prev) => [...prev, ...newMsgs].slice(-200));
          setMetrics((m) => ({ ...m, messagesReceived: m.messagesReceived + newMsgs.length }));
          setHasNewMsgPulse(true);
          setTimeout(() => setHasNewMsgPulse(false), 1200);
        }

        // Extrai próxima continuação e timeout
        let nextToken = null;
        let timeoutMs = 3000;
        if (nextConts.length > 0) {
          const c0 = nextConts[0];
          nextToken =
            c0.invalidationContinuationData?.continuation ||
            c0.timedContinuationData?.continuation ||
            c0.reloadContinuationData?.continuation;

          const tMs =
            c0.invalidationContinuationData?.timeoutMs ||
            c0.timedContinuationData?.timeoutMs ||
            c0.reloadContinuationData?.timeoutMs;

          if (typeof tMs === 'number' && tMs > 0) {
            timeoutMs = tMs;
          }
        }

        if (nextToken) {
          currentContinuation = nextToken;
          setMetrics((m) => ({
            ...m,
            continuationsReceived: m.continuationsReceived + 1,
            lastTimeoutMs: timeoutMs,
          }));
        }

        addCallLog({
          origin: 'WORKER',
          purpose: `Chat Poll #${pollIndex}`,
          endpoint: 'youtube-innertube.radiotweet.workers.dev/live-chat',
          method: 'POST',
          status: '200 OK',
          durationMs,
          result: `200 OK — ${newMsgs.length} msgs recebidas (próximo timeout: ${timeoutMs}ms)`,
        });

        pollIndex++;

        // Aguarda o timeout especificado pelo YouTube antes do próximo poll
        await new Promise((resolve) => setTimeout(resolve, Math.max(1000, timeoutMs)));
      } catch (err) {
        if (!activeLoopRef.current) break; // Interrupção intencional

        const durationMs = Date.now() - pollStartTime;
        const errMsg = err.message || String(err);
        const isCors = errMsg.toLowerCase().includes('cors') || errMsg.toLowerCase().includes('cross-origin');

        if (isCors) {
          setMetrics((m) => ({ ...m, corsErrors: m.corsErrors + 1 }));
          addCallLog({
            origin: 'WORKER',
            purpose: `Chat Poll #${pollIndex}`,
            endpoint: 'youtube-innertube.radiotweet.workers.dev/live-chat',
            method: 'POST',
            status: 'CORS Error',
            durationMs,
            result: 'FALHA TÉCNICA — CORS (Bloqueio de política Cross-Origin pelo navegador)',
          });
          setStatus('failed');
          setStatusMessage('FALHA TÉCNICA — CORS: O navegador bloqueou a requisição ao Worker.');
        } else {
          setMetrics((m) => ({ ...m, networkErrors: m.networkErrors + 1 }));
          addCallLog({
            origin: 'WORKER',
            purpose: `Chat Poll #${pollIndex}`,
            endpoint: 'youtube-innertube.radiotweet.workers.dev/live-chat',
            method: 'POST',
            status: 'Network Error',
            durationMs,
            result: 'INCONCLUSIVO — POSSÍVEL BLOQUEIO/AMBIENTE DE REDE (Falha na requisição fetch ao Worker)',
          });
          setStatus('failed');
          setStatusMessage('INCONCLUSIVO — POSSÍVEL BLOQUEIO/AMBIENTE DE REDE: Falha ao executar fetch ao Worker.');
        }

        activeLoopRef.current = false;
        break;
      }
    }
  };

  const handleConnect = async () => {
    if (!handleInput.trim()) {
      setStatusMessage('Digite um @handle ou URL do YouTube.');
      return;
    }

    handleStop();
    setStatus('bootstrapping');
    setStatusMessage('Executando Bootstrap (1-shot): Localizando canal e metadados da live...');

    setMetrics((m) => ({
      ...m,
      bootstrapRequests: m.bootstrapRequests + 1,
      backendRequestsTotal: m.backendRequestsTotal + 1,
    }));

    const startTime = Date.now();

    try {
      const resp = await fetch(`/api/admin/lab/youtube-test1/bootstrap?identifier=${encodeURIComponent(handleInput.trim())}`);
      const durationMs = Date.now() - startTime;
      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        setMetrics((m) => ({ ...m, otherHttpErrors: m.otherHttpErrors + 1 }));
        addCallLog({
          origin: 'BACKEND',
          purpose: 'Bootstrap / Resolução de Live',
          endpoint: '/api/admin/lab/youtube-test1/bootstrap',
          method: 'GET',
          status: `HTTP ${resp.status}`,
          durationMs,
          result: data.error || 'Erro na resolução da live pelo backend',
        });
        setStatus('failed');
        setStatusMessage(`Falha no Bootstrap: ${data.error || 'Não foi possível encontrar a transmissão.'}`);
        return;
      }

      setMetrics((m) => ({ ...m, http200: m.http200 + 1 }));

      setLiveData({
        author: data.author,
        title: data.title,
        videoId: data.videoId,
        isLive: data.isLive,
        concurrentViewers: data.concurrentViewers,
        targetUrl: data.targetUrl,
        finalUrl: data.finalUrl,
      });

      addCallLog({
        origin: 'BACKEND',
        purpose: 'Bootstrap / Resolução de Live',
        endpoint: '/api/admin/lab/youtube-test1/bootstrap',
        method: 'GET',
        status: '200 OK',
        durationMs,
        result: `Live ${data.isLive ? 'Ativa' : 'Não ativa'} (videoId: ${data.videoId || 'N/A'}, viewers: ${data.concurrentViewers || 'N/A'})`,
      });

      if (!data.isLive || !data.videoId) {
        setStatus('failed');
        setStatusMessage('Canal resolvido com sucesso, mas nenhuma live pública ativa foi encontrada no momento.');
        return;
      }

      if (!data.continuation) {
        setStatus('failed');
        setStatusMessage('Live ativa encontrada, mas nenhum token de chat foi disponibilizado.');
        return;
      }

      // Inicia a tentativa de polling direto no Frontend
      startFrontendChatPolling(data);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      setMetrics((m) => ({ ...m, networkErrors: m.networkErrors + 1 }));
      addCallLog({
        origin: 'BACKEND',
        purpose: 'Bootstrap / Resolução de Live',
        endpoint: '/api/admin/lab/youtube-test1/bootstrap',
        method: 'GET',
        status: 'Network Error',
        durationMs,
        result: `Erro de conexão com o endpoint de bootstrap: ${err.message || String(err)}`,
      });
      setStatus('failed');
      setStatusMessage('Falha ao conectar ao serviço de bootstrap.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Cabeçalho da Ferramenta */}
      <div className="rounded-2xl border border-red-500/20 bg-[#0c0f17] p-5 md:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 shadow-inner">
              <RadioTower size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">Teste YouTube 1</h3>
                <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-semibold text-red-300 uppercase tracking-wider">
                  Experimento Lab
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Teste de conexão com live pública SEM YouTube Data API v3 · Bootstrap 1-shot + tentativa de chat direto pelo Frontend.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition"
              title="Limpar mensagens, métricas e log de chamadas"
            >
              <Trash2 size={13} />
              <span>Limpar Registros</span>
            </button>
          </div>
        </div>

        {/* Barra de Entrada e Controles */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={handleInput}
              onChange={(e) => setHandleInput(e.target.value)}
              placeholder="Ex: @gaules, alanzoka, ou URL de live"
              className="w-full rounded-xl border border-white/10 bg-[#080b12] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50"
              disabled={status === 'bootstrapping' || status === 'polling'}
            />
          </div>

          {status === 'polling' || status === 'bootstrapping' ? (
            <button
              onClick={handleStop}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/20 transition"
            >
              <Square size={14} />
              <span>Interromper</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-500/20 transition"
            >
              <Play size={14} />
              <span>Conectar & Testar</span>
            </button>
          )}
        </div>

        {/* Estado da Conexão / Mensagem de Status */}
        <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2 shrink-0">
            {status === 'idle' && <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />}
            {status === 'bootstrapping' && <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />}
            {status === 'polling' && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />}
            {status === 'failed' && <span className="h-2.5 w-2.5 rounded-full bg-red-500" />}
            {status === 'stopped' && <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />}
            <span className="font-semibold text-slate-300">
              {status === 'idle' && 'Estado: Ocioso'}
              {status === 'bootstrapping' && 'Estado: Executando Bootstrap...'}
              {status === 'polling' && 'Estado: Polling de Chat no Frontend Ativo'}
              {status === 'failed' && 'Estado: Falha / Bloqueio Detectado'}
              {status === 'stopped' && 'Estado: Interrompido'}
            </span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 truncate">{statusMessage}</span>
        </div>
      </div>

      {/* Grid: Prova Física 1 (Metadados + Chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel de Metadados da Live */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0a0d15] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Globe size={14} className="text-red-400" />
                <span>Dados da Transmissão</span>
              </h4>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  liveData.isLive
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-500/15 border border-white/10 text-slate-400'
                }`}
              >
                {liveData.isLive ? 'LIVE DETECTADA' : 'SEM LIVE ATIVA'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-[11px]">Canal / Autor Encontrado:</span>
                <span className="font-semibold text-white bg-[#080b12] px-3 py-1.5 rounded-lg border border-white/5 truncate">
                  {liveData.author || '—'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-[11px]">Título da Live:</span>
                <span className="font-medium text-slate-200 bg-[#080b12] px-3 py-1.5 rounded-lg border border-white/5 line-clamp-2">
                  {liveData.title || '—'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 text-[11px]">Video ID:</span>
                  <span className="font-mono text-violet-300 bg-[#080b12] px-3 py-1.5 rounded-lg border border-white/5 truncate">
                    {liveData.videoId || '—'}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Users size={12} className="text-red-400" />
                    <span>Concurrent Viewers:</span>
                  </span>
                  <span className="font-bold text-red-300 bg-[#080b12] px-3 py-1.5 rounded-lg border border-white/5 truncate">
                    {liveData.concurrentViewers || 'Não disponível'}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-white/5">
                <span className="font-semibold text-slate-300">Aviso Metodológico:</span> O valor de <b className="text-red-400">Concurrent Viewers</b> é estritamente separado do total de visualizações do vídeo e só é preenchido se o YouTube retornar a contagem de espectadores simultâneos em tempo real.
              </div>
            </div>
          </div>

          {/* Resumo da Hipótese do Experimento */}
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-violet-300 font-bold">
              <Activity size={14} />
              <span>Hipótese sob Teste</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              O backend executa <b>somente 1 requisição inicial</b> de bootstrap. A partir daí, o frontend assume o recebimento do chat diretamente via InnerTube sem nenhuma requisição recorrente ao backend.
            </p>
          </div>
        </div>

        {/* Painel do Chat em Tempo Real */}
        <div className="lg:col-span-7 flex flex-col h-[400px] rounded-2xl border border-white/10 bg-[#0a0d15] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-[#080b12] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare size={15} className="text-red-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Feed de Chat Real</span>
              {hasNewMsgPulse && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" title="Nova mensagem recebida" />
              )}
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {messages.length} mensagens recebidas
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-sans">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <MessageSquare size={32} className="text-slate-600" />
                <p className="text-xs font-medium text-slate-400">Nenhuma mensagem recebida ainda.</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Inicie o teste para conectar e acompanhar as mensagens públicas reais do chat.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-white/5 bg-[#080b12] px-3.5 py-2 text-xs space-y-1 hover:border-white/10 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      {m.avatar ? (
                        <img
                          src={m.avatar}
                          alt={m.author}
                          referrerPolicy="no-referrer"
                          className="h-4 w-4 rounded-full"
                        />
                      ) : (
                        <span className="h-4 w-4 rounded-full bg-red-500/20 text-red-300 text-[10px] grid place-items-center font-bold">
                          {m.author.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="font-bold text-slate-200 truncate">{m.author}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">{m.time}</span>
                  </div>
                  <p className="text-slate-300 text-xs break-words">{m.text}</p>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>
        </div>
      </div>

      {/* Contadores e Diagnóstico Quantitativo */}
      <div className="rounded-2xl border border-white/10 bg-[#0a0d15] p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={14} className="text-violet-400" />
              <span>Diagnóstico Quantitativo & Contadores do Experimento</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Métricas detalhadas separando requisições de Bootstrap de chamadas Pós-Bootstrap.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-semibold">
              BACKEND: {metrics.backendRequestsTotal}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
              FRONTEND: {metrics.frontendRequestsTotal}
            </span>
          </div>
        </div>

        {/* Grid dos 17 Contadores */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {/* 1. bootstrapRequests */}
          <div className="rounded-xl border border-white/5 bg-[#080b12] p-3 space-y-1">
            <span className="text-[10px] font-medium text-slate-400">bootstrapRequests</span>
            <div className="text-lg font-bold text-white">{metrics.bootstrapRequests}</div>
          </div>

          {/* 2. backendRequestsTotal */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-1">
            <span className="text-[10px] font-medium text-blue-300">backendRequestsTotal</span>
            <div className="text-lg font-bold text-blue-200">{metrics.backendRequestsTotal}</div>
          </div>

          {/* 3. postBootstrapBackendRequests */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 space-y-1">
            <span className="text-[10px] font-medium text-purple-300">postBootstrapBackend</span>
            <div className="text-lg font-bold text-purple-200">{metrics.postBootstrapBackendRequests}</div>
          </div>

          {/* 4. frontendRequestsTotal */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
            <span className="text-[10px] font-medium text-emerald-300">frontendRequestsTotal</span>
            <div className="text-lg font-bold text-emerald-200">{metrics.frontendRequestsTotal}</div>
          </div>

          {/* 5. chatRequests */}
          <div className="rounded-xl border border-white/5 bg-[#080b12] p-3 space-y-1">
            <span className="text-[10px] font-medium text-slate-400">chatRequests</span>
            <div className="text-lg font-bold text-white">{metrics.chatRequests}</div>
          </div>

          {/* 6. messagesReceived */}
          <div className="rounded-xl border border-white/5 bg-[#080b12] p-3 space-y-1">
            <span className="text-[10px] font-medium text-slate-400">messagesReceived</span>
            <div className="text-lg font-bold text-white">{metrics.messagesReceived}</div>
          </div>

          {/* 7. continuationsReceived */}
          <div className="rounded-xl border border-white/5 bg-[#080b12] p-3 space-y-1">
            <span className="text-[10px] font-medium text-slate-400">continuationsReceived</span>
            <div className="text-lg font-bold text-white">{metrics.continuationsReceived}</div>
          </div>

          {/* 8. reconnects */}
          <div className="rounded-xl border border-white/5 bg-[#080b12] p-3 space-y-1">
            <span className="text-[10px] font-medium text-slate-400">reconnects</span>
            <div className="text-lg font-bold text-white">{metrics.reconnects}</div>
          </div>

          {/* 9. rebootstraps */}
          <div className="rounded-xl border border-white/5 bg-[#080b12] p-3 space-y-1">
            <span className="text-[10px] font-medium text-slate-400">rebootstraps</span>
            <div className="text-lg font-bold text-white">{metrics.rebootstraps}</div>
          </div>

          {/* 10. lastIntervalMs */}
          <div className="rounded-xl border border-white/5 bg-[#080b12] p-3 space-y-1">
            <span className="text-[10px] font-medium text-slate-400">lastIntervalMs</span>
            <div className="text-lg font-bold text-white">{metrics.lastIntervalMs}ms</div>
          </div>

          {/* 11. lastTimeoutMs */}
          <div className="rounded-xl border border-white/5 bg-[#080b12] p-3 space-y-1">
            <span className="text-[10px] font-medium text-slate-400">lastTimeoutMs</span>
            <div className="text-lg font-bold text-white">{metrics.lastTimeoutMs}ms</div>
          </div>

          {/* 12. http200 */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
            <span className="text-[10px] font-medium text-emerald-300">http200 (OK)</span>
            <div className="text-lg font-bold text-emerald-300">{metrics.http200}</div>
          </div>

          {/* 13. http403 */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
            <span className="text-[10px] font-medium text-amber-300">http403 (Forbidden)</span>
            <div className="text-lg font-bold text-amber-300">{metrics.http403}</div>
          </div>

          {/* 14. http429 */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
            <span className="text-[10px] font-medium text-amber-300">http429 (RateLimit)</span>
            <div className="text-lg font-bold text-amber-300">{metrics.http429}</div>
          </div>

          {/* 15. otherHttpErrors */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-1">
            <span className="text-[10px] font-medium text-red-300">otherHttpErrors</span>
            <div className="text-lg font-bold text-red-300">{metrics.otherHttpErrors}</div>
          </div>

          {/* 16. corsErrors */}
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 space-y-1">
            <span className="text-[10px] font-medium text-red-300">corsErrors</span>
            <div className="text-lg font-bold text-red-400">{metrics.corsErrors}</div>
          </div>

          {/* 17. networkErrors */}
          <div className="rounded-xl border border-slate-500/20 bg-slate-500/5 p-3 space-y-1">
            <span className="text-[10px] font-medium text-slate-300">networkErrors</span>
            <div className="text-lg font-bold text-slate-300">{metrics.networkErrors}</div>
          </div>
        </div>
      </div>

      {/* Registro Compacto das Chamadas Realizadas */}
      <div className="rounded-2xl border border-white/10 bg-[#0a0d15] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} className="text-slate-400" />
              <span>Registro Detalhado de Chamadas (Audit Log)</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Histórico cronológico das requisições disparadas pelo Backend e Frontend.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {callLogs.length} eventos registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] text-slate-400">
                <th className="py-2.5 px-3 font-semibold">#</th>
                <th className="py-2.5 px-3 font-semibold">Origem</th>
                <th className="py-2.5 px-3 font-semibold">Finalidade</th>
                <th className="py-2.5 px-3 font-semibold">Endpoint / Tipo</th>
                <th className="py-2.5 px-3 font-semibold">Método</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Duração</th>
                <th className="py-2.5 px-3 font-semibold">Horário</th>
                <th className="py-2.5 px-3 font-semibold">Resultado Resumido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {callLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-slate-500 text-xs">
                    Nenhuma chamada executada ainda.
                  </td>
                </tr>
              ) : (
                callLogs.map((log) => (
                  <tr key={log.seq} className="hover:bg-white/[0.02] transition">
                    <td className="py-2 px-3 font-mono text-slate-400">{log.seq}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.origin === 'BACKEND'
                            ? 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
                            : log.origin === 'WORKER'
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                            : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {log.origin}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-200">{log.purpose}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-300 max-w-[200px] truncate" title={log.endpoint}>
                      {log.endpoint}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-300">{log.method}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          log.status.includes('200')
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : log.status.includes('CORS')
                            ? 'bg-red-500/20 text-red-300 font-bold'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400">{log.durationMs}ms</td>
                    <td className="py-2 px-3 font-mono text-slate-400">{log.time}</td>
                    <td className="py-2 px-3 text-slate-300 max-w-[320px] truncate" title={log.result}>
                      {log.result}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
