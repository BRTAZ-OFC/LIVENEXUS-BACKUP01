import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Radio, 
  Copy, 
  Check, 
  Activity, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Monitor, 
  Layers, 
  Trash2, 
  Play, 
  Square,
  MessageSquare,
  User,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@dashboard/login/AuthContext';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import { useStreaming, StreamingContext } from '@dashboard/configuracao/Config_StreamingContext';
import TwitchChatBox from '@dashboard/widgets/twitch/Widget_TwitchChatBox';
import { RtcSignalingClient } from './rtcSignalingClient';

export default function AdminRtcTestLabSection() {
  const { user, isAuthenticated } = useAuth();
  const central = useNewUserDataCentral();
  const globalStreaming = useStreaming();

  // Obter runtimeId estável do sistema
  const [runtimeIdInput, setRuntimeIdInput] = useState('');
  const [role, setRole] = useState('publisher'); // 'publisher' | 'consumer'
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Estados técnicos observáveis do RTC
  const [rtcState, setRtcState] = useState({
    signalingState: 'idle',
    peerConnectionState: 'closed',
    iceConnectionState: 'closed',
    dataChannelState: 'closed',
  });

  // Estatísticas de tráfego
  const [stats, setStats] = useState({
    messagesSent: 0,
    messagesReceived: 0,
    lastSentTimestamp: null,
    lastReceivedTimestamp: null,
    lastPayloadSample: null
  });

  // Logs técnicos do laboratório
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Estado remoto recebido pelo Consumer via RTCDataChannel
  const [remoteStreamState, setRemoteStreamState] = useState({
    liveActivity: { items: [], lastMessage: null, lastEvent: null },
    connections: { Twitch: { status: 'idle' }, Kick: { status: 'idle' }, YouTube: { status: 'idle' } }
  });

  const clientRef = useRef(null);

  // Inicializar o runtimeId padrão a partir da Central/Johnson
  useEffect(() => {
    if (central?.runtimeId && !runtimeIdInput) {
      setRuntimeIdInput(central.runtimeId);
    }
  }, [central?.runtimeId]);

  // Verificar se há parâmetros na URL (ex: aberto em dispositivo móvel como Consumer)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('rtc_role');
    const urlId = params.get('rtc_id');
    if (urlRole === 'consumer' || urlRole === 'publisher') {
      setRole(urlRole);
    }
    if (urlId) {
      setRuntimeIdInput(urlId);
    }
  }, []);

  const addLog = useCallback((logEntry) => {
    setLogs((prev) => [...prev.slice(-150), logEntry]);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Manipulador de dados recebidos no Consumer via RTCDataChannel
  const handleDataReceived = useCallback((payload) => {
    if (!payload) return;

    if (payload.type === 'LIVENEXUS_TWITCH_STREAM_STATE') {
      setRemoteStreamState({
        liveActivity: payload.liveActivity || { items: [] },
        connections: payload.connections || {}
      });

      setStats((prev) => ({
        ...prev,
        messagesReceived: prev.messagesReceived + 1,
        lastReceivedTimestamp: new Date().toLocaleTimeString('pt-BR'),
        lastPayloadSample: {
          type: payload.type,
          itemCount: payload.liveActivity?.items?.length || 0,
          timestamp: payload.timestamp
        }
      }));
    }
  }, []);

  // Iniciar sessão RTC (Publisher ou Consumer)
  const startRtc = useCallback(() => {
    if (!runtimeIdInput || !runtimeIdInput.trim()) {
      addLog({
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        role,
        message: 'RuntimeId não definido. Impossível iniciar WebRTC.',
        type: 'error'
      });
      return;
    }

    if (clientRef.current) {
      clientRef.current.destroy();
    }

    setIsConnecting(true);
    const client = new RtcSignalingClient({
      runtimeId: runtimeIdInput.trim(),
      role,
      onLog: addLog,
      onStateChange: (partial) => setRtcState((prev) => ({ ...prev, ...partial })),
      onDataReceived: handleDataReceived
    });

    clientRef.current = client;
    client.initPeerConnection();

    // Notificar sinal "ready" para os peers
    client.sendSignal('ready');
  }, [runtimeIdInput, role, addLog, handleDataReceived]);

  // Encerrar sessão RTC
  const stopRtc = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.sendSignal('close');
      clientRef.current.destroy();
      clientRef.current = null;
    }
    setIsConnecting(false);
    setRtcState({
      signalingState: 'idle',
      peerConnectionState: 'closed',
      iceConnectionState: 'closed',
      dataChannelState: 'closed'
    });
    addLog({
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      role,
      message: 'Sessão WebRTC finalizada localmente.',
      type: 'warn'
    });
  }, [role, addLog]);

  // Limpar sinais no servidor
  const clearServerSignals = async () => {
    if (!runtimeIdInput) return;
    try {
      await fetch(`/api/admin/lab/rtc/signal?runtimeId=${encodeURIComponent(runtimeIdInput)}`, {
        method: 'DELETE'
      });
      addLog({
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        role,
        message: 'Fila de sinais no servidor foi limpa.',
        type: 'info'
      });
    } catch (err) {
      addLog({
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        role,
        message: `Falha ao limpar sinais: ${err.message}`,
        type: 'error'
      });
    }
  };

  // Publisher: Enviar fluxo real do TwitchChatBox sempre que o liveActivity ou connections atualizar
  useEffect(() => {
    if (role !== 'publisher') return;
    if (!clientRef.current || rtcState.dataChannelState !== 'open') return;

    const streamPayload = {
      type: 'LIVENEXUS_TWITCH_STREAM_STATE',
      liveActivity: globalStreaming.liveActivity,
      connections: globalStreaming.connections,
      timestamp: Date.now()
    };

    const sent = clientRef.current.sendData(streamPayload);
    if (sent) {
      setStats((prev) => ({
        ...prev,
        messagesSent: prev.messagesSent + 1,
        lastSentTimestamp: new Date().toLocaleTimeString('pt-BR'),
        lastPayloadSample: {
          type: streamPayload.type,
          itemCount: streamPayload.liveActivity?.items?.length || 0,
          timestamp: streamPayload.timestamp
        }
      }));
    }
  }, [role, rtcState.dataChannelState, globalStreaming.liveActivity, globalStreaming.connections]);

  // Desconectar ao desmontar
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.destroy();
      }
    };
  }, []);

  // Copiar link para abrir em outro dispositivo como Consumer
  const copyConsumerLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('rtc_role', 'consumer');
    url.searchParams.set('rtc_id', runtimeIdInput);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isDataChannelOpen = rtcState.dataChannelState === 'open';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Cabeçalho do Laboratório RTC */}
      <div className="rounded-2xl border border-violet-500/20 bg-[#0a0d15] p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
              <Radio size={24} className={isDataChannelOpen ? 'animate-pulse text-emerald-400' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Laboratório RTC — Prova Ponta a Ponta</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono uppercase">
                  WebRTC P2P
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cadeia real: <span className="text-slate-200">Widget_TwitchChatBox</span> → Publisher → Signaling HTTP → RTCDataChannel ("livenexus-rtc-live") → Consumer Remoto
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copyConsumerLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition"
              title="Copiar link com parâmetros de Consumer para abrir em outro dispositivo (celular/navegador)"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link Consumer'}</span>
            </button>
            <button
              onClick={clearServerSignals}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 border border-white/10 transition"
              title="Limpar fila de sinais no servidor"
            >
              <Trash2 size={14} />
              <span>Limpar Sinais</span>
            </button>
          </div>
        </div>

        {/* Identidade Real da Sessão Autenticada */}
        <div className="rounded-xl border border-white/5 bg-[#06080e] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <User size={14} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Identidade Real da Sessão</span>
              <div className="flex items-center gap-2 font-mono text-slate-200 mt-0.5">
                {isAuthenticated && user?.id ? (
                  <>
                    <span className="text-violet-300 font-semibold">{user.name || user.email || 'Usuário Autenticado'}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 text-[11px] bg-white/5 px-2 py-0.5 rounded border border-white/10" title="Chave técnica real do usuário">
                      ID: {user.id}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-semibold">
                      {user.role || 'user'}
                    </span>
                  </>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                    <AlertTriangle size={13} /> Identidade real da sessão não resolvida.
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Sem identidades fictícias · Sem fallback artificial</span>
          </div>
        </div>

        {/* Configuração de Sessão: Role & Runtime ID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
          {/* Seletor de Papel */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers size={13} /> Papel Atual
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#06080e] p-1 rounded-xl border border-white/10">
              <button
                disabled={isConnecting}
                onClick={() => setRole('publisher')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                  role === 'publisher'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor size={14} /> Publisher (Emissor)
              </button>
              <button
                disabled={isConnecting}
                onClick={() => setRole('consumer')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                  role === 'consumer'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone size={14} /> Consumer (Receptor)
              </button>
            </div>
          </div>

          {/* Runtime ID Permanente */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Runtime ID Permanente</span>
              <span className="text-[10px] text-violet-400 font-mono">Fonte: RtcIdentity_Johnson</span>
            </label>
            <input
              type="text"
              disabled={isConnecting}
              value={runtimeIdInput}
              onChange={(e) => setRuntimeIdInput(e.target.value)}
              placeholder="rtc_xxxxxxxx..."
              className="w-full bg-[#06080e] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          {/* Ações de Conexão */}
          <div className="space-y-1.5 flex flex-col justify-end">
            {!isConnecting ? (
              <button
                onClick={startRtc}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-lg shadow-violet-600/20"
              >
                <Play size={14} /> Iniciar Conexão RTC P2P
              </button>
            ) : (
              <button
                onClick={stopRtc}
                className="w-full flex items-center justify-center gap-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 py-2.5 px-4 rounded-xl text-xs font-bold transition"
              >
                <Square size={14} /> Desconectar RTC
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Monitor Técnico de Estados WebRTC (Observabilidade Obrigatória) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Signaling State */}
        <div className="rounded-xl border border-white/10 bg-[#0a0d15] p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Signaling State</span>
          <div className="text-sm font-mono font-semibold text-violet-300 truncate">
            {rtcState.signalingState}
          </div>
        </div>

        {/* PeerConnection State */}
        <div className="rounded-xl border border-white/10 bg-[#0a0d15] p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">PeerConnection</span>
          <div className={`text-sm font-mono font-semibold flex items-center gap-1.5 ${
            rtcState.peerConnectionState === 'connected' ? 'text-emerald-400' :
            rtcState.peerConnectionState === 'connecting' ? 'text-amber-400' :
            rtcState.peerConnectionState === 'failed' ? 'text-rose-400' : 'text-slate-400'
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              rtcState.peerConnectionState === 'connected' ? 'bg-emerald-400' :
              rtcState.peerConnectionState === 'connecting' ? 'bg-amber-400 animate-pulse' :
              rtcState.peerConnectionState === 'failed' ? 'bg-rose-400' : 'bg-slate-600'
            }`} />
            {rtcState.peerConnectionState}
          </div>
        </div>

        {/* ICE Connection State */}
        <div className="rounded-xl border border-white/10 bg-[#0a0d15] p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">ICE State</span>
          <div className={`text-sm font-mono font-semibold flex items-center gap-1.5 ${
            rtcState.iceConnectionState === 'connected' || rtcState.iceConnectionState === 'completed' ? 'text-emerald-400' :
            rtcState.iceConnectionState === 'checking' ? 'text-amber-400' :
            rtcState.iceConnectionState === 'failed' ? 'text-rose-400' : 'text-slate-400'
          }`}>
            {rtcState.iceConnectionState}
          </div>
        </div>

        {/* DataChannel State */}
        <div className="rounded-xl border border-white/10 bg-[#0a0d15] p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">DataChannel ("livenexus-rtc-live")</span>
          <div className={`text-sm font-mono font-semibold flex items-center gap-1.5 ${
            isDataChannelOpen ? 'text-emerald-400' :
            rtcState.dataChannelState === 'connecting' ? 'text-amber-400' :
            rtcState.dataChannelState === 'error' ? 'text-rose-400' : 'text-slate-400'
          }`}>
            {isDataChannelOpen ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} />}
            {rtcState.dataChannelState.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Seção Principal: Renderização do Fluxo Real & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel do Widget Real TwitchChatBox (7 Colunas) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0a0d15] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-violet-300" />
                <h4 className="text-sm font-bold text-white">
                  {role === 'publisher' ? 'Fluxo Real Local (TwitchChatBox)' : 'Fluxo Real Remoto (Recebido via RTCDataChannel)'}
                </h4>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                role === 'publisher'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {role === 'publisher' ? 'EMISSÃO ATIVA' : 'RECEPÇÃO REMOTA'}
              </span>
            </div>

            {/* Renderização do Widget Real sem mocks */}
            <div className="h-80 w-full rounded-xl border border-white/10 bg-[#06080e] overflow-hidden relative">
              {role === 'publisher' ? (
                // Publisher: renderiza usando o streaming context global real
                <TwitchChatBox config={{ platform: 'Twitch', platforms: ['Twitch', 'Kick', 'YouTube'] }} />
              ) : (
                // Consumer: renderiza injetando estritamente os dados recebidos pelo DataChannel
                isDataChannelOpen ? (
                  <StreamingContext.Provider value={{
                    liveActivity: remoteStreamState.liveActivity,
                    connections: remoteStreamState.connections,
                    isOnline: true
                  }}>
                    <TwitchChatBox config={{ platform: 'Twitch', platforms: ['Twitch', 'Kick', 'YouTube'] }} />
                  </StreamingContext.Provider>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                    <WifiOff size={28} className="text-slate-600" />
                    <p className="text-xs font-semibold text-slate-400">Canal RTC Fechado / Aguardando Conexão</p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      O Consumer só renderiza dados após o DataChannel "livenexus-rtc-live" ficar OPEN e receber o primeiro payload.
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Metadados de Tráfego */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
              <div className="bg-[#06080e] p-2.5 rounded-lg border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase">Mensagens {role === 'publisher' ? 'Enviadas' : 'Recebidas'}</span>
                <p className="text-sm font-bold text-slate-200">
                  {role === 'publisher' ? stats.messagesSent : stats.messagesReceived}
                </p>
              </div>
              <div className="bg-[#06080e] p-2.5 rounded-lg border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase">Último Timestamp</span>
                <p className="text-xs font-semibold text-slate-300">
                  {(role === 'publisher' ? stats.lastSentTimestamp : stats.lastReceivedTimestamp) || '—'}
                </p>
              </div>
              <div className="bg-[#06080e] p-2.5 rounded-lg border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase">Itens no Buffer</span>
                <p className="text-sm font-bold text-violet-300">
                  {role === 'publisher'
                    ? globalStreaming.liveActivity?.items?.length || 0
                    : remoteStreamState.liveActivity?.items?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Painel de Observabilidade / Terminal de Logs (5 Colunas) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0a0d15] p-5 space-y-3 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-violet-300" />
                <h4 className="text-sm font-bold text-white">Observabilidade em Tempo Real</h4>
              </div>
              <button
                onClick={() => setLogs([])}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition"
              >
                Limpar Logs
              </button>
            </div>

            {/* Terminal de Eventos do RTC */}
            <div className="flex-1 min-h-[300px] max-h-[380px] overflow-y-auto font-mono text-[11px] p-3 rounded-xl bg-[#06080e] border border-white/10 space-y-1.5 no-scrollbar">
              {logs.length === 0 ? (
                <div className="text-slate-600 text-center py-12 italic">
                  Nenhum evento registrado. Clique em "Iniciar Conexão RTC P2P" para iniciar o processo.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed break-all ${
                      log.type === 'error' ? 'text-rose-400' :
                      log.type === 'warn' ? 'text-amber-300' :
                      log.type === 'success' ? 'text-emerald-400 font-semibold' :
                      'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-600 mr-1.5">[{log.timestamp}]</span>
                    <span className="text-violet-400 font-bold mr-1">[{log.role?.toUpperCase()}]</span>
                    <span>{log.message}</span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>

            <div className="p-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 text-[11px] text-violet-200">
              Canal: <code className="font-mono text-white">livenexus-rtc-live</code> · Sem dados artificiais · Sem fallback local
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
