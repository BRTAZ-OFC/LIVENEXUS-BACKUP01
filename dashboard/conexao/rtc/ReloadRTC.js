// ReloadRTC.js — Módulo inteligente para recarga, reconexão e sincronização do Publisher RTC.
// Sincroniza atalhos globais, mantém a constância da sessão e garante reconexão e envio de novos valores.

let activePublisherInstance = null;
let activeSnapshotCallback = null;
let activeReloadCallback = null;
let latestScenarioValues = null;
let reloadTimeoutId = null;

// Canal Broadcast global para sincronização entre múltiplas abas/janelas/OBS
let rtcBroadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    rtcBroadcastChannel = new BroadcastChannel('livenexus_rtc_reload');
    rtcBroadcastChannel.onmessage = (event) => {
      const data = event.data;
      if (data && data.reason) {
        handleIncomingReload(data.reason, data.newValues, false);
      }
    };
  } catch (err) {
    console.warn('[ReloadRTC] Falha ao inicializar BroadcastChannel:', err);
  }
}

// Sincronização via localStorage (fallback de comunicação inter-janelas)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'livenexus_rtc_reload_trigger' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && parsed.reason) {
          handleIncomingReload(parsed.reason, parsed.newValues, false);
        }
      } catch {
        // ignore
      }
    }
  });
}

/**
 * Processa a ordem de recarga internamente quando acionada localmente ou recebida de outra aba.
 */
function handleIncomingReload(reason, newValues, broadcast = true) {
  if (newValues !== undefined && newValues !== null) {
    latestScenarioValues = newValues;
  }

  // Se solicitado, transmite a outras abas
  if (broadcast && typeof window !== 'undefined') {
    try {
      if (rtcBroadcastChannel) {
        rtcBroadcastChannel.postMessage({
          reason,
          newValues: latestScenarioValues,
          timestamp: Date.now()
        });
      }
      window.localStorage.setItem(
        'livenexus_rtc_reload_trigger',
        JSON.stringify({ reason, newValues: latestScenarioValues, timestamp: Date.now() })
      );
    } catch {
      // ignore
    }
  }

  // Notifica componentes e listeners da janela atual
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('livenexus:reload-rtc-publisher', {
        detail: { reason, newValues: latestScenarioValues, timestamp: Date.now() }
      })
    );
  }

  // 1. Envio imediato dos novos valores se o canal estiver aberto no Publisher ativo
  if (activePublisherInstance) {
    try {
      if (latestScenarioValues && typeof activePublisherInstance.setLatestScenarioData === 'function') {
        activePublisherInstance.setLatestScenarioData(latestScenarioValues);
      }
      if (latestScenarioValues && typeof activePublisherInstance.sendScenarioUpdate === 'function') {
        activePublisherInstance.sendScenarioUpdate(latestScenarioValues);
      }
      if (typeof activeSnapshotCallback === 'function') {
        activeSnapshotCallback(latestScenarioValues);
      }
    } catch (sendErr) {
      console.warn('[ReloadRTC] Aviso ao enviar snapshot imediato:', sendErr);
    }
  }

  // 2. Reconexão controlada (Reload) mantendo a constância (debounce de 200ms para evitar colisões SDP)
  if (reloadTimeoutId) {
    clearTimeout(reloadTimeoutId);
  }

  reloadTimeoutId = setTimeout(() => {
    try {
      if (typeof activeReloadCallback === 'function') {
        activeReloadCallback(latestScenarioValues);
      } else if (activePublisherInstance && typeof activePublisherInstance.start === 'function') {
        if (latestScenarioValues && typeof activePublisherInstance.setLatestScenarioData === 'function') {
          activePublisherInstance.setLatestScenarioData(latestScenarioValues);
        }
        activePublisherInstance.start();
      }
    } catch (reconnectErr) {
      console.warn('[ReloadRTC] Erro no reconnect do RTC:', reconnectErr);
    }
  }, 200);
}

/**
 * Registra a instância ativa do Publisher RTC e seus callbacks de snapshot e reload.
 * @param {Object} publisher Instância do RtcPublisher
 * @param {Object} options Callbacks de ação
 * @param {Function} [options.onSnapshot] Callback para disparo de snapshot com novos valores
 * @param {Function} [options.onReload] Callback para reinicialização/reconexão completa da conexão
 */
export function registerActivePublisher(publisher, { onSnapshot = null, onReload = null } = {}) {
  activePublisherInstance = publisher;
  activeSnapshotCallback = onSnapshot;
  activeReloadCallback = onReload;

  // Se já houver valores recentes armazenados, injeta imediatamente na nova instância
  if (latestScenarioValues && publisher && typeof publisher.setLatestScenarioData === 'function') {
    publisher.setLatestScenarioData(latestScenarioValues);
  }
}

/**
 * Remove o registro da instância quando o Publisher for desmontado ou desativado.
 * @param {Object} publisher Instância a ser removida
 */
export function unregisterActivePublisher(publisher) {
  if (activePublisherInstance === publisher) {
    activePublisherInstance = null;
    activeSnapshotCallback = null;
    activeReloadCallback = null;
  }
}

/**
 * Retorna os últimos valores de cenário/subcenário capturados para transmissão RTC.
 */
export function getLatestScenarioValues() {
  return latestScenarioValues;
}

/**
 * Define ou atualiza os últimos valores de cenário para futuras reconexões.
 */
export function setLatestScenarioValues(values) {
  latestScenarioValues = values;
}

/**
 * Dispara o ciclo de reload do sistema RTC:
 * - Transmite instantaneamente os novos valores
 * - Executa a reconexão completa (reconnect) do WebRTC mantendo a constância
 * - Sincroniza em tempo real entre todas as abas e instâncias do OBS Studio
 * 
 * @param {string} [reason='shortcut'] Motivo do disparo
 * @param {Object} [newValues=null] Novos valores de cenário, subcenário ou mortes a serem transmitidos
 * @returns {boolean} Sucesso do acionamento
 */
export function triggerReloadRTC(reason = 'shortcut', newValues = null) {
  try {
    handleIncomingReload(reason, newValues, true);
    return true;
  } catch (err) {
    console.warn('[ReloadRTC] Erro ao disparar triggerReloadRTC:', err);
    return false;
  }
}

export default {
  registerActivePublisher,
  unregisterActivePublisher,
  triggerReloadRTC,
  getLatestScenarioValues,
  setLatestScenarioValues
};
