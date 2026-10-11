// Cliente de Signaling e Gerenciador WebRTC P2P para o Laboratório RTC
// Canal exclusivo: "livenexus-rtc-live"

export const RTC_PEER_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

export class RtcSignalingClient {
  constructor({ runtimeId, role, onLog, onStateChange, onDataReceived }) {
    this.runtimeId = runtimeId;
    this.role = role; // 'publisher' | 'consumer'
    this.onLog = onLog || (() => {});
    this.onStateChange = onStateChange || (() => {});
    this.onDataReceived = onDataReceived || (() => {});

    this.pc = null;
    this.dataChannel = null;
    this.lastSignalTimestamp = 0;
    this.pollingTimer = null;
    this.isDestroyed = false;
    this.processedSignalIds = new Set();
  }

  log(msg, detail = null, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    this.onLog({
      timestamp,
      role: this.role,
      message: msg,
      detail,
      type
    });
  }

  updateState(partialState) {
    this.onStateChange(partialState);
  }

  // Enviar sinal via HTTP para a fila do runtimeId
  async sendSignal(type, data = null, toRole = 'all') {
    if (this.isDestroyed || !this.runtimeId) return;
    try {
      this.log(`[Signaling OUT] Enviando ${type.toUpperCase()}`, { type, toRole });
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
      const resData = await res.json();
      if (!resData.ok) {
        this.log(`[Signaling ERRO] Falha ao enviar sinal ${type}: ${resData.error}`, null, 'error');
      }
    } catch (err) {
      this.log(`[Signaling ERRO] Exceção ao enviar sinal ${type}: ${err.message}`, null, 'error');
    }
  }

  // Polling de sinais direcionados a este papel
  startPolling() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);

    const poll = async () => {
      if (this.isDestroyed || !this.runtimeId) return;
      try {
        const url = `/api/admin/lab/rtc/signal?runtimeId=${encodeURIComponent(this.runtimeId)}&role=${this.role}&since=${this.lastSignalTimestamp}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && Array.isArray(data.signals)) {
          for (const sig of data.signals) {
            if (this.processedSignalIds.has(sig.id)) continue;
            this.processedSignalIds.add(sig.id);
            if (sig.timestamp > this.lastSignalTimestamp) {
              this.lastSignalTimestamp = sig.timestamp;
            }
            await this.handleIncomingSignal(sig);
          }
        }
      } catch (err) {
        // Erro de rede ou indisponibilidade temporária
        this.log(`[Signaling Poll] Erro no polling: ${err.message}`, null, 'warn');
      }
    };

    poll();
    this.pollingTimer = setInterval(poll, 800);
  }

  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  // Tratar sinais recebidos
  async handleIncomingSignal(sig) {
    this.log(`[Signaling IN] Recebido ${sig.type.toUpperCase()} de ${sig.fromRole}`, sig.data);

    if (sig.type === 'ready') {
      this.updateState({ signalingState: 'peer_ready' });
      // Se formos Publisher e o Consumer sinalizar ready, iniciamos a oferta
      if (this.role === 'publisher') {
        this.log('[Publisher] Peer Consumer está pronto. Criando Offer...');
        await this.createAndSendOffer();
      }
    } else if (sig.type === 'offer') {
      if (this.role === 'consumer') {
        this.log('[Consumer] Offer recebida. Configurando remote description...');
        await this.handleOffer(sig.data);
      }
    } else if (sig.type === 'answer') {
      if (this.role === 'publisher') {
        this.log('[Publisher] Answer recebida. Configurando remote description...');
        await this.handleAnswer(sig.data);
      }
    } else if (sig.type === 'candidate') {
      if (sig.data) {
        try {
          if (this.pc && this.pc.remoteDescription) {
            await this.pc.addIceCandidate(new RTCIceCandidate(sig.data));
            this.log('[ICE] Candidato remoto adicionado');
          } else {
            this.log('[ICE] Candidato recebido antes de remote description; postergando');
          }
        } catch (err) {
          this.log(`[ICE ERRO] Falha ao adicionar candidato: ${err.message}`, null, 'error');
        }
      }
    } else if (sig.type === 'close') {
      this.log('[Signaling] Peer fechou a conexão.', null, 'warn');
      this.closePeer();
    }
  }

  // Inicializar RTCPeerConnection
  initPeerConnection() {
    this.closePeer();

    this.log(`[WebRTC] Inicializando RTCPeerConnection (${this.role})...`);
    this.pc = new RTCPeerConnection(RTC_PEER_CONFIG);

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.log('[ICE Local] Novo candidato gerado', event.candidate.candidate);
        this.sendSignal('candidate', event.candidate.toJSON());
      } else {
        this.log('[ICE Local] Coleta de candidatos finalizada');
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc ? this.pc.iceConnectionState : 'closed';
      this.log(`[ICE State] ${state}`);
      this.updateState({ iceConnectionState: state });
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc ? this.pc.connectionState : 'closed';
      this.log(`[PeerConnection State] ${state}`);
      this.updateState({ peerConnectionState: state });
    };

    this.pc.onsignalingstatechange = () => {
      const state = this.pc ? this.pc.signalingState : 'closed';
      this.log(`[Signaling State] ${state}`);
      this.updateState({ signalingState: state });
    };

    if (this.role === 'publisher') {
      // Publisher cria o DataChannel
      this.log('[Publisher] Criando DataChannel "livenexus-rtc-live"...');
      this.dataChannel = this.pc.createDataChannel('livenexus-rtc-live', {
        ordered: true
      });
      this.setupDataChannel(this.dataChannel);
    } else {
      // Consumer escuta o DataChannel criado pelo Publisher
      this.pc.ondatachannel = (event) => {
        this.log(`[Consumer] DataChannel recebido: "${event.channel.label}"`);
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };
    }

    this.startPolling();
  }

  setupDataChannel(channel) {
    channel.onopen = () => {
      this.log(`[DataChannel] "${channel.label}" está OPEN! Canal P2P ativo.`, null, 'success');
      this.updateState({ dataChannelState: 'open' });
    };

    channel.onclose = () => {
      this.log(`[DataChannel] "${channel.label}" foi fechado.`, null, 'warn');
      this.updateState({ dataChannelState: 'closed' });
    };

    channel.onerror = (err) => {
      this.log(`[DataChannel ERRO] Erro no canal: ${err.message || String(err)}`, null, 'error');
      this.updateState({ dataChannelState: 'error' });
    };

    channel.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.log(`[DataChannel MSG IN] Mensagem recebida (${event.data.length} bytes)`, { type: payload.type });
        this.onDataReceived(payload);
      } catch (err) {
        this.log(`[DataChannel MSG IN] Dado recebido não-JSON: ${event.data.slice(0, 100)}`, null, 'warn');
      }
    };
  }

  // Publisher cria offer
  async createAndSendOffer() {
    if (!this.pc) return;
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.log('[Publisher] Local Description (Offer) configurada');
      await this.sendSignal('offer', offer);
    } catch (err) {
      this.log(`[Publisher ERRO] Falha ao criar offer: ${err.message}`, null, 'error');
    }
  }

  // Consumer recebe offer e responde answer
  async handleOffer(offerData) {
    if (!this.pc) return;
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(offerData));
      this.log('[Consumer] Remote Description (Offer) configurada');
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.log('[Consumer] Local Description (Answer) configurada');
      await this.sendSignal('answer', answer);
    } catch (err) {
      this.log(`[Consumer ERRO] Falha ao processar offer: ${err.message}`, null, 'error');
    }
  }

  // Publisher recebe answer
  async handleAnswer(answerData) {
    if (!this.pc) return;
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(answerData));
      this.log('[Publisher] Remote Description (Answer) configurada');
    } catch (err) {
      this.log(`[Publisher ERRO] Falha ao processar answer: ${err.message}`, null, 'error');
    }
  }

  // Enviar dados pelo DataChannel (somente se open)
  sendData(payload) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      this.log('[DataChannel] Tentativa de envio com canal fechado ou não aberto.', null, 'warn');
      return false;
    }
    try {
      const raw = JSON.stringify(payload);
      this.dataChannel.send(raw);
      this.log(`[DataChannel MSG OUT] Enviado payload de ${raw.length} bytes`, { type: payload.type });
      return true;
    } catch (err) {
      this.log(`[DataChannel ERRO] Falha ao enviar dado: ${err.message}`, null, 'error');
      return false;
    }
  }

  closePeer() {
    this.stopPolling();
    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch {}
      this.dataChannel = null;
    }
    if (this.pc) {
      try { this.pc.close(); } catch {}
      this.pc = null;
    }
    this.updateState({
      peerConnectionState: 'closed',
      iceConnectionState: 'closed',
      dataChannelState: 'closed'
    });
  }

  destroy() {
    this.isDestroyed = true;
    this.closePeer();
  }
}
