import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import WidgetElementRenderer from './editor/Scenario_WidgetElementRenderer';
import { matchesSubscenarioShortcut, broadcastScenarioChange, formatKeyFromEvent } from './Scenario_shortcutHelper';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import { StreamingContext } from '@dashboard/configuracao/Config_StreamingContext';
import { useRtcConsumer } from '@dashboard/conexao/rtc/useRtcConsumer';
import { triggerReloadRTC } from '@dashboard/conexao/rtc/ReloadRTC';
import { useTempoVisivel } from '@dashboard/componentes/useTempoVisivel';

function LiveInstanceItem({ inst, effectiveLiveActivity, effectiveConnections, effectiveStreamMeta }) {
  const { opacity, pointerEvents } = useTempoVisivel({
    config: inst.config,
    instanceId: inst.id,
    isSelected: false,
    isEditor: false,
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: `${inst.x}px`,
        top: `${inst.y}px`,
        width: inst.width ? `${inst.width}px` : '280px',
        height: inst.height ? `${inst.height}px` : 'auto',
        zIndex: inst.zIndex || 1,
        transform: `
          ${inst.config?.rotation ? `rotate(${inst.config.rotation}deg)` : ''} 
          ${inst.config?.flipH ? 'scaleX(-1)' : ''} 
          ${inst.config?.flipV ? 'scaleY(-1)' : ''}
        `.trim() || undefined,
        opacity,
        transition: 'opacity 0.4s ease-in-out',
        pointerEvents: pointerEvents === 'none' ? 'none' : (inst.id?.includes('react') ? 'auto' : 'none'),
      }}
      className={inst.id?.includes('react') ? 'pointer-events-auto' : 'pointer-events-none'}
    >
      <div className="w-full h-full overflow-hidden flex items-center justify-start p-0">
        <WidgetElementRenderer
          widgetId={inst.widgetId}
          elementKey={inst.elementKey}
          isFullWidget={inst.isFullWidget}
          config={inst.config}
          isEditing={false}
          instanceId={inst.id}
          instanceName={inst.name}
          liveActivity={effectiveLiveActivity}
          connections={effectiveConnections}
          streamMeta={effectiveStreamMeta}
        />
      </div>
    </div>
  );
}

export default function LiveScenarioViewer() {
  const { userId, scenarioBranch } = useNewUserDataCentral();
  const { scenarioId } = useParams();
  const [searchParams] = useSearchParams();
  const sid = String(scenarioId || '');

  // Extrai parâmetros de URL e runtimeId dinâmicos
  const urlSearchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlRuntimeId = searchParams.get('runtimeId') || urlSearchParams?.get('runtimeId') || null;
  const isBroadcast = Boolean(urlRuntimeId && urlRuntimeId.trim());

  // Inicializa o Consumer RTC automático caso o runtimeId seja fornecido na URL (modo Broadcast / OBS)
  const rtcConsumer = useRtcConsumer({ runtimeId: urlRuntimeId, enabled: isBroadcast });

  // Indicador visual de conexão RTC para links Broadcast
  const [indicatorStatus, setIndicatorStatus] = useState(() => (isBroadcast ? 'connecting' : 'hidden'));

  useEffect(() => {
    if (!isBroadcast) {
      setIndicatorStatus('hidden');
      return;
    }

    if (rtcConsumer.isConnected) {
      setIndicatorStatus('connected');
      const timer = setTimeout(() => {
        setIndicatorStatus('hidden');
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setIndicatorStatus('connecting');
    }
  }, [isBroadcast, rtcConsumer.isConnected]);

  const [cenario, setCenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const cenarioRef = useRef(null);
  cenarioRef.current = cenario;

  const [activeSubId, setActiveSubId] = useState(() => {
    if (typeof window !== 'undefined' && sid) {
      try {
        const stored = window.localStorage.getItem(`scenario_active_sub_${sid}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.subscenarioId) return parsed.subscenarioId;
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  const activeSubIdRef = useRef(activeSubId);
  activeSubIdRef.current = activeSubId;

  const lastLocalSwitchTimeRef = useRef(0);

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  const containerRef = useRef(null);

  useEffect(() => {
    try {
      containerRef.current?.focus();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Force both HTML and Body backgrounds to be fully transparent for OBS overlays
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    const originalBodyBgColor = document.body.style.backgroundColor;
    const originalBodyBgImage = document.body.style.backgroundImage;

    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    document.body.style.backgroundImage = 'none';

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      document.documentElement.style.backgroundColor = originalHtmlBg;
      document.body.style.backgroundColor = originalBodyBgColor;
      document.body.style.backgroundImage = originalBodyBgImage;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 1. Re-fetch completo do cenário/overlay (equivalente a F5 acionado por evento)
  const fetchScenario = useCallback(() => {
    if (!sid) return;

    const fetchPublicScenario = () => {
      fetch(`/api/cenarios?scenarioId=${encodeURIComponent(sid)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.ok && data.cenario) {
            setCenario(data.cenario);
            setError(null);
            if (Date.now() - lastLocalSwitchTimeRef.current > 3000) {
              if (data.cenario.activeSubcenarioId) {
                setActiveSubId(data.cenario.activeSubcenarioId);
              } else if (!activeSubIdRef.current) {
                setActiveSubId('default');
              }
            } else if (!activeSubIdRef.current) {
              setActiveSubId(data.cenario.activeSubcenarioId || 'default');
            }
          } else {
            setError('Cenário não encontrado.');
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Erro ao buscar cenário público:', err);
          setError('Erro de conexão ao buscar cenário.');
          setLoading(false);
        });
    };

    if (userId && scenarioBranch) {
      scenarioBranch('GET', { id: sid })
        .then((scenario) => {
          if (scenario) {
            setCenario(scenario);
            setError(null);
            if (Date.now() - lastLocalSwitchTimeRef.current > 3000) {
              if (scenario.activeSubcenarioId) {
                setActiveSubId(scenario.activeSubcenarioId);
              } else if (!activeSubIdRef.current) {
                setActiveSubId('default');
              }
            } else if (!activeSubIdRef.current) {
              setActiveSubId(scenario.activeSubcenarioId || 'default');
            }
          } else {
            fetchPublicScenario();
          }
          setLoading(false);
        })
        .catch(() => {
          fetchPublicScenario();
        });
    } else {
      fetchPublicScenario();
    }
  }, [sid, userId, scenarioBranch]);

  // Executa a busca inicial do cenário para carregar a estrutura estática
  useEffect(() => {
    fetchScenario();
  }, [fetchScenario]);

  // Gatilho do 'connect': Sempre que uma nova conexão ativa for estabelecida (isConnected === true),
  // o receptor/consumer busca imediatamente os dados mais recentes do cenário do servidor
  // sem persistir ou reter estados/dados antigos desatualizados.
  useEffect(() => {
    if (rtcConsumer.isConnected) {
      console.log('[RTC AUTO][CONNECT GATILHO] Conexão ativa estabelecida no Receptor. Atualizando dados...');
      fetchScenario();
    }
  }, [rtcConsumer.isConnected, fetchScenario]);

  // 2. Cross-tab, Cross-window, OBS Studio BroadcastChannel & storage synchronization
  useEffect(() => {
    if (!sid || typeof window === 'undefined') return;

    let channel = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel(`scenario_channel_${sid}`);
        channel.onmessage = (event) => {
          if (event.data?.type === 'SWITCH_SUBSCENARIO' && event.data.subscenarioId) {
            lastLocalSwitchTimeRef.current = Date.now();
            setActiveSubId(event.data.subscenarioId);
            // Dispara atualização completa da página receptora
            fetchScenario();
          } else if (event.data?.type === 'OVERLAY_UPDATE') {
            lastLocalSwitchTimeRef.current = Date.now();
            fetchScenario();
          }
        };
      }
    } catch (err) {
      console.error('BroadcastChannel error:', err);
    }

    const handleStorage = (e) => {
      if (e.key === `scenario_active_sub_${sid}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.subscenarioId) {
            lastLocalSwitchTimeRef.current = Date.now();
            setActiveSubId(parsed.subscenarioId);
            // Dispara atualização completa da página receptora (equivalente a F5 disparado pelo atalho)
            fetchScenario();
          }
        } catch {
          // ignore
        }
      } else if (e.key === `overlay_updated_${sid}`) {
        lastLocalSwitchTimeRef.current = Date.now();
        fetchScenario();
      }
    };

    window.addEventListener('storage', handleStorage);

    const handleDeathAction = (e) => {
      const { action } = e.detail || {};
      if (!action) return;

      setCenario((prev) => {
        if (!prev) return prev;
        const updateInstanceList = (list = []) => list.map(inst => {
          if (inst.widgetId !== 'manual-death-counter') return inst;
          const current = Math.max(0, Number(inst.config?.deathCount) || 0);
          let next = current;
          if (action === 'INCREMENT') next = current + 1;
          else if (action === 'DECREMENT') next = Math.max(0, current - 1);
          else if (action === 'RESET') next = 0;
          return {
            ...inst,
            config: {
              ...inst.config,
              deathCount: next
            }
          };
        });

        return {
          ...prev,
          instances: updateInstanceList(prev.instances),
          subcenarios: (prev.subcenarios || []).map(s => ({
            ...s,
            instances: updateInstanceList(s.instances)
          }))
        };
      });
    };

    window.addEventListener('livenexus:death-counter-action', handleDeathAction);

    const handleRtcScenarioUpdate = (e) => {
      const scData = e.detail;
      if (!scData) return;
      if (scData.activeSubcenarioId) {
        lastLocalSwitchTimeRef.current = Date.now();
        setActiveSubId(scData.activeSubcenarioId);
      }
      if (scData.scenario && String(scData.scenario.id) === String(sid)) {
        setCenario(scData.scenario);
      }
      fetchScenario();
    };

    window.addEventListener('livenexus:rtc-scenario-update', handleRtcScenarioUpdate);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('livenexus:death-counter-action', handleDeathAction);
      window.removeEventListener('livenexus:rtc-scenario-update', handleRtcScenarioUpdate);
    };
  }, [sid, fetchScenario]);

  // 3. Robust Permanent Keyboard Shortcut Listener for OBS Studio & Prism Live Overlays
  useEffect(() => {
    if (!sid || typeof window === 'undefined') return;

    const heldKeys = new Set();

    const handleKeyDown = (e) => {
      // Ignore if user is typing in a form input or editable area
      if (document.activeElement && (
          document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA' || 
          document.activeElement.isContentEditable)) {
        return;
      }

      const formatted = formatKeyFromEvent(e);
      if (formatted) {
        heldKeys.add(formatted.toUpperCase());
      }
      if (e.key === 'Shift') heldKeys.add('SHIFT');
      if (e.key === 'Control' || e.key === 'Ctrl') heldKeys.add('CTRL');
      if (e.key === 'Alt') heldKeys.add('ALT');
      if (e.key === 'Meta' || e.key === 'OS') heldKeys.add('WIN');

      const currentCenario = cenarioRef.current;
      if (!currentCenario || !currentCenario.subcenarios || currentCenario.subcenarios.length === 0) {
        return;
      }

      const matchedSub = currentCenario.subcenarios.find((s) => matchesSubscenarioShortcut(e, s, heldKeys));
      if (matchedSub) {
        e.preventDefault();
        e.stopPropagation();

        lastLocalSwitchTimeRef.current = Date.now();
        setActiveSubId(matchedSub.id);

        // Notify server and sync to localStorage + BroadcastChannel
        scenarioBranch('POST', { id: sid, payload: { activeSubcenarioId: matchedSub.id } })
          .catch((err) => console.error('Erro ao atualizar subcenário ativo no servidor:', err));

        broadcastScenarioChange(sid, matchedSub.id);

        // Dispara recarga e reconexão RTC enviando os novos valores
        triggerReloadRTC('shortcut-receiver', {
          scenarioId: sid,
          activeSubcenarioId: matchedSub.id,
          timestamp: Date.now()
        });
      }
    };

    const handleKeyUp = (e) => {
      const formatted = formatKeyFromEvent(e);
      if (formatted) {
        heldKeys.delete(formatted.toUpperCase());
      }
      if (e.key === 'Shift') heldKeys.delete('SHIFT');
      if (e.key === 'Control' || e.key === 'Ctrl') heldKeys.delete('CTRL');
      if (e.key === 'Alt') heldKeys.delete('ALT');
      if (e.key === 'Meta' || e.key === 'OS') heldKeys.delete('WIN');
    };

    const handleBlur = () => {
      heldKeys.clear();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [sid]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center text-slate-400 font-mono text-sm">
        Carregando cenário...
      </div>
    );
  }

  if (error || !cenario) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center text-rose-400 font-mono text-sm p-4 text-center">
        {error || 'Cenário não disponível.'}
      </div>
    );
  }

  const activeSub = cenario.subcenarios?.find((s) => s.id === activeSubId) || 
                    cenario.subcenarios?.[0] || {
    instances: cenario.instances || [],
    background: cenario.background || { type: 'transparent' }
  };

  const getBackgroundStyle = () => {
    const bg = activeSub.background || { type: 'transparent' };
    const style = {};

    if (bg.type === 'transparent') {
      style.backgroundColor = 'transparent';
    } else if (bg.type === 'solid') {
      style.backgroundColor = bg.color || '#020617';
    } else if (bg.type === 'gradient') {
      style.backgroundImage = bg.gradient || 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)';
    } else if (bg.type === 'image' && bg.image) {
      style.backgroundImage = `url(${bg.image})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
      style.backgroundRepeat = 'no-repeat';
    }

    const filters = [];
    if (bg.blur > 0) filters.push(`blur(${bg.blur}px)`);
    if (bg.brightness !== undefined && bg.brightness !== 100) filters.push(`brightness(${bg.brightness}%)`);
    if (bg.contrast !== undefined && bg.contrast !== 100) filters.push(`contrast(${bg.contrast}%)`);
    if (bg.saturate !== undefined && bg.saturate !== 100) filters.push(`saturate(${bg.saturate}%)`);

    if (filters.length > 0) {
      style.filter = filters.join(' ');
    }

    return style;
  };

  const logicalW = cenario.visualizerSize?.width || 1920;
  const logicalH = cenario.visualizerSize?.height || 1080;
  const bgStyle = getBackgroundStyle();

  // Dynamic scale: scale down proportionally when viewport is smaller than 1080p,
  // but cap at 1.0 so when the viewport is larger, elements retain their exact logical scale/pixels.
  const scale = Math.min(1.0, windowSize.width / logicalW, windowSize.height / logicalH);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onClick={() => {
        try {
          containerRef.current?.focus();
        } catch {
          // ignore
        }
      }}
      className="fixed inset-0 w-screen h-screen flex items-center justify-center overflow-hidden bg-transparent outline-none focus:outline-none"
    >
      {/* 1920x1080 logical canvas centered and scaled */}
      <div
        style={{
          width: `${logicalW}px`,
          height: `${logicalH}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'relative',
          overflow: 'hidden',
          ...bgStyle,
          opacity: (activeSub.background?.opacity !== undefined ? activeSub.background.opacity : 100) / 100,
        }}
        className="shrink-0"
      >
        {/* Conteúdo de instâncias (alimentado via RTC quando urlRuntimeId estiver presente) */}
        {(() => {
          const bridgeState = rtcConsumer.bridgeState || rtcConsumer.streamState || {};
          const effectiveLiveActivity = urlRuntimeId ? (bridgeState.liveActivity || { items: [] }) : undefined;
          const effectiveConnections = urlRuntimeId ? (bridgeState.connections || {}) : undefined;
          const effectiveStreamMeta = urlRuntimeId ? (bridgeState.streamMeta || {}) : undefined;

          const instancesList = activeSub.instances && activeSub.instances
            .filter((inst) => inst.visible !== false)
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map((inst) => (
              <LiveInstanceItem
                key={inst.id}
                inst={inst}
                effectiveLiveActivity={effectiveLiveActivity}
                effectiveConnections={effectiveConnections}
                effectiveStreamMeta={effectiveStreamMeta}
              />
            ));

          if (urlRuntimeId) {
            console.log(`[RTC AUTO][WIDGET APPLY] count=${activeSub.instances?.length || 0} aplicado=${rtcConsumer.isConnected} dataChannel=${rtcConsumer.dataChannelState}`);
            console.log("[RTC AUTO][DEBUG] effectiveConnections:", effectiveConnections);
            
            return (
              <StreamingContext.Provider value={{
                liveActivity: effectiveLiveActivity || { items: [] },
                connections: effectiveConnections || {},
                streamMeta: effectiveStreamMeta || {},
                isOnline: Object.values(effectiveConnections || {}).some(c => c?.status === 'connected')
              }}>
                {instancesList}
              </StreamingContext.Provider>
            );
          }

          return instancesList;
        })()}
      </div>

      {/* Indicador visual de conexão RTC para links Broadcast */}
      {isBroadcast && indicatorStatus !== 'hidden' && (
        <div
          className="fixed bottom-4 right-4 z-[99999] pointer-events-none select-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/85 border text-xs font-mono shadow-2xl backdrop-blur-md transition-all duration-300"
          style={{
            borderColor: indicatorStatus === 'connected' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)',
            color: indicatorStatus === 'connected' ? '#34d399' : '#f87171',
          }}
        >
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              indicatorStatus === 'connected'
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]'
            }`}
          />
          <span className="font-semibold tracking-wide">
            {indicatorStatus === 'connected' ? 'Connected' : 'Connecting'}
          </span>
        </div>
      )}
    </div>
  );
}
