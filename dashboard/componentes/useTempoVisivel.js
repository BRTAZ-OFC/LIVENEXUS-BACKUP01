import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { StreamingContext } from '@dashboard/configuracao/Config_StreamingContext';

/**
 * Hook para gerenciar o "Tempo Visível" de elementos/widgets.
 * 
 * Modos suportados:
 * - 'always' (padrão): Sempre visível.
 * - 'interval': Visível por `tempoVisivelDuracao` (s), depois oculto por `tempoVisivelIntervalo` (s).
 * - 'event': Oculto até que ocorra um evento (chat, alerta, sub, teste), permanecendo visível por `tempoVisivelEventoDuracao` (s).
 * 
 * @param {Object} params
 * @param {Object} params.config - inst.config
 * @param {string} params.instanceId - inst.id
 * @param {boolean} params.isSelected - se está selecionado no editor
 * @param {boolean} params.isEditor - se está rodando no editor (true) ou no receiver/OBS (false)
 */
export function useTempoVisivel({ config = {}, instanceId, isSelected = false, isEditor = false }) {
  const streaming = useContext(StreamingContext);
  const mode = config?.tempoVisivel || 'always';
  const duration = Math.max(1, Number(config?.tempoVisivelDuracao) || 10);
  const interval = Math.max(1, Number(config?.tempoVisivelIntervalo) || 60);
  const eventDuration = Math.max(1, Number(config?.tempoVisivelEventoDuracao) || 8);

  // Estado de visibilidade temporal
  const [isTemporallyVisible, setIsTemporallyVisible] = useState(() => {
    if (mode === 'always') return true;
    if (mode === 'interval') return true;
    if (mode === 'event') return false;
    return true;
  });

  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Função para ativar temporariamente a exibição (usada por eventos e testes)
  const triggerEventAppearance = useCallback((customDuration) => {
    const dur = customDuration || (mode === 'interval' ? duration : eventDuration);
    setIsTemporallyVisible(true);
    setRemainingSeconds(dur);
  }, [mode, duration, eventDuration]);

  // Contagem regressiva de segundos restantes enquanto visível temporariamente
  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // Monitora atividades e eventos da live (StreamingContext)
  const lastLiveActivityCountRef = useRef(0);
  useEffect(() => {
    if (mode !== 'event') return;
    const items = streaming?.liveActivity?.items;
    if (Array.isArray(items)) {
      if (items.length > lastLiveActivityCountRef.current && lastLiveActivityCountRef.current > 0) {
        triggerEventAppearance();
      }
      lastLiveActivityCountRef.current = items.length;
    }
  }, [mode, streaming?.liveActivity?.items, triggerEventAppearance]);

  // Escuta eventos customizados de teste, alertas e eventos globais do LiveNexus
  useEffect(() => {
    const handleTrigger = (e) => {
      if (!e.detail?.instanceId || e.detail.instanceId === instanceId) {
        triggerEventAppearance(e.detail?.duration);
      }
    };

    const handleGenericEvent = () => {
      if (mode === 'event') {
        triggerEventAppearance();
      }
    };

    window.addEventListener('livenexus:trigger-tempo-visivel', handleTrigger);
    window.addEventListener('livenexus:live-event', handleGenericEvent);
    window.addEventListener('livenexus:alert', handleGenericEvent);
    window.addEventListener('livenexus:chat-message', handleGenericEvent);

    return () => {
      window.removeEventListener('livenexus:trigger-tempo-visivel', handleTrigger);
      window.removeEventListener('livenexus:live-event', handleGenericEvent);
      window.removeEventListener('livenexus:alert', handleGenericEvent);
      window.removeEventListener('livenexus:chat-message', handleGenericEvent);
    };
  }, [mode, instanceId, triggerEventAppearance]);

  // Lógica do Modo 'event'
  useEffect(() => {
    if (mode !== 'event') return;
    if (!isTemporallyVisible) return;

    const timer = setTimeout(() => {
      setIsTemporallyVisible(false);
      setRemainingSeconds(0);
    }, eventDuration * 1000);

    return () => clearTimeout(timer);
  }, [mode, isTemporallyVisible, eventDuration]);

  // Lógica do Modo 'interval' (De Tempo em Tempo)
  useEffect(() => {
    if (mode !== 'interval') {
      if (mode === 'always') {
        setIsTemporallyVisible(true);
        setRemainingSeconds(0);
      }
      return;
    }

    // Inicia ciclo visível
    setIsTemporallyVisible(true);
    setRemainingSeconds(duration);

    let hideTimer = null;
    let showTimer = null;
    let isCancelled = false;

    const cycle = () => {
      if (isCancelled) return;
      // 1. Torna visível por `duration` segundos
      setIsTemporallyVisible(true);
      setRemainingSeconds(duration);

      hideTimer = setTimeout(() => {
        if (isCancelled) return;
        // 2. Oculta por `interval` segundos
        setIsTemporallyVisible(false);
        setRemainingSeconds(0);

        showTimer = setTimeout(() => {
          if (isCancelled) return;
          cycle();
        }, interval * 1000);
      }, duration * 1000);
    };

    // Primeiro ciclo
    hideTimer = setTimeout(() => {
      if (isCancelled) return;
      setIsTemporallyVisible(false);
      setRemainingSeconds(0);

      showTimer = setTimeout(() => {
        if (isCancelled) return;
        cycle();
      }, interval * 1000);
    }, duration * 1000);

    return () => {
      isCancelled = true;
      if (hideTimer) clearTimeout(hideTimer);
      if (showTimer) clearTimeout(showTimer);
    };
  }, [mode, duration, interval]);

  // Cálculo de opacidade e interação
  const isHiddenPeriod = !isTemporallyVisible;
  const showGhostInEditor = isEditor && isSelected && isHiddenPeriod;

  let opacity = 1;
  let pointerEvents = 'auto';

  if (isEditor) {
    // No editor de cenário e de overlay, os elementos nunca somem. Ficam 100% visíveis (fixos) para fácil edição.
    opacity = 1;
    pointerEvents = 'auto';
  } else if (mode !== 'always') {
    if (isTemporallyVisible) {
      opacity = 1;
      pointerEvents = 'auto';
    } else {
      opacity = 0;
      pointerEvents = 'none';
    }
  }

  let statusBadge = null;
  if (mode === 'interval') {
    statusBadge = `Intervalo (${duration}s / ${interval}s)`;
  } else if (mode === 'event') {
    statusBadge = `Evento (${eventDuration}s)`;
  }

  return {
    mode,
    isTemporallyVisible,
    isHiddenPeriod,
    showGhostInEditor,
    opacity,
    pointerEvents,
    remainingSeconds,
    statusBadge,
    triggerTest: () => triggerEventAppearance(),
  };
}
