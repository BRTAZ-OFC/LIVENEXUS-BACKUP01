// Cliente de Signaling HTTP para a infraestrutura RTC Automática do LiveNexus
// Reproduz com precisão a fórmula comprovada no laboratório de referência.

export const RTC_STUN_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

export class RtcSignalingManager {
  constructor({ runtimeId, role, onLog = () => {}, onSignal = () => {} }) {
    if (!runtimeId || !runtimeId.trim()) {
      throw new Error('Identidade real da sessão não resolvida: runtimeId é obrigatório para o signaling.');
    }
    this.runtimeId = runtimeId.trim();
    this.role = role; // 'publisher' | 'consumer'
    this.onLog = onLog;
    this.onSignal = onSignal;
    // Inicia a leitura a partir do momento atual para ignorar sinais residuais de sessões anteriores
    this.lastSignalTimestamp = Date.now() - 1000;
    this.pollingTimer = null;
    this.isDestroyed = false;
    this.processedSignalIds = new Set();
  }

  log(message, detail = null, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    this.onLog({ timestamp, role: this.role, message, detail, type });
  }

  async send(type, data = null, toRole = 'all') {
    if (this.isDestroyed || !this.runtimeId) return false;
    try {
      this.log(`[Signaling Auto OUT] Enviando ${type.toUpperCase()}`, { type, toRole });
      const res = await fetch(`/api/admin/lab/rtc/signal?runtimeId=${encodeURIComponent(this.runtimeId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runtimeId: this.runtimeId,
          fromRole: this.role,
          toRole,
          type,
          data
        })
      });
      const result = await res.json();
      if (!result.ok) {
        this.log(`[Signaling Auto ERRO] Resposta de falha: ${result.error}`, null, 'error');
        return false;
      }
      return true;
    } catch (err) {
      this.log(`[Signaling Auto EXCEÇÃO] ${err.message}`, null, 'error');
      return false;
    }
  }

  startPolling(intervalMs = 800) {
    this.stopPolling();
    const poll = async () => {
      if (this.isDestroyed || !this.runtimeId) return;
      try {
        const url = `/api/admin/lab/rtc/signal?runtimeId=${encodeURIComponent(this.runtimeId)}&role=${this.role}&since=${this.lastSignalTimestamp}`;
const res = await fetch(url);
//troca de codigo
if (!res.ok) {
  document.body.insertAdjacentHTML('afterbegin', `
    <div style="position:fixed;top:0;left:0;z-index:999999;background:#900;color:white;padding:15px;font-size:18px;font-family:monospace">
      RTC SIGNALING HTTP ERROR: ${res.status} ${res.statusText}
    </div>
  `);
  return;
}
//final 
const data = await res.json();
        if (data.ok && Array.isArray(data.signals)) {
          for (const sig of data.signals) {
            if (this.processedSignalIds.has(sig.id)) continue;
            this.processedSignalIds.add(sig.id);
            if (sig.timestamp > this.lastSignalTimestamp) {
              this.lastSignalTimestamp = sig.timestamp;
            }
            this.log(`[Signaling Auto IN] Recebido ${sig.type.toUpperCase()} de ${sig.fromRole}`, sig.data);
            await this.onSignal(sig);
          }
        }
        // troca de codigo 2
     } catch (err) {
  this.log(`[Signaling Auto Poll] ${err.message}`, null, 'warn');

  document.body.insertAdjacentHTML('afterbegin', `
    <div style="position:fixed;top:0;left:0;z-index:999999;background:#900;color:white;padding:15px;font-size:18px;font-family:monospace">
      RTC SIGNALING FETCH ERROR: ${String(err)}
    </div>
  `);
}
      // fim 
    };

    poll();
    this.pollingTimer = setInterval(poll, intervalMs);
  }

  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.stopPolling();
    this.processedSignalIds.clear();
  }
}
