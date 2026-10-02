// Hook para inicialização e ciclo de vida do Consumer RTC Automático
import { useEffect, useRef, useState, useCallback } from 'react';
import { RtcConsumer } from './rtcConsumer.js';

export function useRtcConsumer({ runtimeId, enabled = true } = {}) {
  const [streamState, setStreamState] = useState({
    liveActivity: { items: [], lastMessage: null, lastEvent: null },
    connections: { Twitch: { status: 'idle' }, Kick: { status: 'idle' }, YouTube: { status: 'idle' } },
    streamMeta: {}
  });

  const [rtcState, setRtcState] = useState({
    isConnected: false,
    dataChannelState: 'closed',
    peerConnectionState: 'closed',
    iceConnectionState: 'closed',
    signalingState: 'idle'
  });

  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({
    messagesReceived: 0,
    lastReceivedTimestamp: null
  });
  const consumerRef = useRef(null);

  const addLog = useCallback((entry) => {
    setLogs((prev) => [...prev.slice(-100), entry]);
  }, []);

  const handleStreamData = useCallback((payload) => {
    setMetrics(prev => ({
      messagesReceived: prev.messagesReceived + 1,
      lastReceivedTimestamp: new Date().toLocaleTimeString('pt-BR')
    }));
    setStreamState(prev => ({
      ...prev,
      liveActivity: payload.liveActivity || prev.liveActivity,
      connections: payload.connections || prev.connections,
      streamMeta: payload.streamMeta || prev.streamMeta
    }));
  }, []);

  // Limpar dados antigos quando houver qualquer conexão/reconexão em andamento ("connecting" / "checking")
  // para que o consumer sempre receba os dados novos sem manter a persistência de informações antigas.
  useEffect(() => {
    const isConnecting = rtcState.peerConnectionState === 'connecting' || 
                         rtcState.iceConnectionState === 'checking' ||
                         rtcState.dataChannelState === 'connecting';
    
    if (isConnecting) {
      setStreamState({
        liveActivity: { items: [], lastMessage: null, lastEvent: null },
        connections: { Twitch: { status: 'idle' }, Kick: { status: 'idle' }, YouTube: { status: 'idle' } },
        streamMeta: {}
      });
    }
  }, [rtcState.peerConnectionState, rtcState.iceConnectionState, rtcState.dataChannelState]);

  useEffect(() => {
    if (!enabled || !runtimeId || !runtimeId.trim()) {
      if (consumerRef.current) {
        consumerRef.current.destroy();
        consumerRef.current = null;
      }
      return;
    }

    const cons = new RtcConsumer({
      runtimeId: runtimeId.trim(),
      onStreamData: handleStreamData,
      onStateChange: (partial) => setRtcState((prev) => ({ ...prev, ...partial })),
      onLog: addLog
    });

    consumerRef.current = cons;
    cons.start();

    return () => {
      cons.destroy();
      consumerRef.current = null;
    };
  }, [enabled, runtimeId, handleStreamData, addLog]);

  const getDetailedDiagnostics = useCallback(() => {
    const pc = consumerRef.current?.pc;
    const dc = consumerRef.current?.dataChannel;
    const signaling = consumerRef.current?.signaling;

    return {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      runtimeId,
      rtcStates: rtcState,
      metrics,
      streamState,
      peerConnection: pc ? {
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        iceGatheringState: pc.iceGatheringState,
        signalingState: pc.signalingState,
        hasRemoteDescription: Boolean(pc.remoteDescription),
        remoteDescriptionType: pc.remoteDescription?.type || null,
        hasLocalDescription: Boolean(pc.localDescription),
        localDescriptionType: pc.localDescription?.type || null,
      } : null,
      dataChannel: dc ? {
        label: dc.label,
        readyState: dc.readyState,
        bufferedAmount: dc.bufferedAmount
      } : null,
      signalingManager: signaling ? {
        lastSignalTimestamp: signaling.lastSignalTimestamp,
        isDestroyed: signaling.isDestroyed
      } : null,
      logsCount: logs.length,
      recentLogs: logs.slice(-20)
    };
  }, [runtimeId, rtcState, metrics, streamState, logs]);

  return {
    runtimeId,
    streamState,
    bridgeState: streamState,
    isConnected: rtcState.isConnected,
    dataChannelState: rtcState.dataChannelState,
    peerConnectionState: rtcState.peerConnectionState,
    iceConnectionState: rtcState.iceConnectionState,
    signalingState: rtcState.signalingState,
    messagesReceived: metrics.messagesReceived,
    lastReceivedTimestamp: metrics.lastReceivedTimestamp,
    getDetailedDiagnostics,
    logs
  };
}
