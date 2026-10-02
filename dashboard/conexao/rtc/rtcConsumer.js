// Consumer RTC Automático do LiveNexus
// Reproduz a fórmula funcional comprovada no laboratório de referência
// Canal oficial: "livenexus-rtc-live"

import { RtcSignalingManager, RTC_STUN_CONFIG } from './rtcSignaling.js';

export class RtcConsumer {
  constructor({ runtimeId, onStreamData = () => {}, onStateChange = () => {}, onLog = () => {} }) {
    if (!runtimeId || !runtimeId.trim()) {
      throw new Error('Identidade real da sessão não resolvida: runtimeId permanente obrigatório para o Consumer.');
    }

    this.runtimeId = runtimeId.trim();
    this.onStreamData = onStreamData;
    this.onStateChange = onStateChange;
    this.onLog = onLog;

    this.pc = null;
    this.dataChannel = null;
    this.signaling = null;
    this.isDestroyed = false;
    this.pendingIceCandidates = [];
    this.isAnswering = false;
    this.retryTimer = null;
    this.lastAttemptTime = 0;
  }

  log(message, detail = null, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    this.onLog({ timestamp, role: 'consumer', message, detail, type });
  }

  updateState(partial) {
    this.onStateChange(partial);
  }

  isConnected() {
    return Boolean(
      this.dataChannel &&
      this.dataChannel.readyState === 'open' &&
      this.pc &&
      this.pc.connectionState === 'connected'
    );
  }

  isNegotiating() {
    if (this.isAnswering) return true;
    if (!this.pc) return false;
    if (this.pc.signalingState === 'have-remote-offer') return true;
    if (this.pc.iceConnectionState === 'checking') return true;
    if (Date.now() - this.lastAttemptTime < 3500) return true;
    return false;
  }

  requestNegotiation(reason = 'tentativa') {
    if (this.isDestroyed || !this.signaling) return;
    if (this.isConnected()) return;

    if (this.isNegotiating()) {
      this.log(`[Consumer Auto Retry] Negociação já em andamento (${reason}). Aguardando conclusão.`);
      return;
    }

    if (!this.pc || this.pc.connectionState === 'failed' || this.pc.connectionState === 'closed') {
      this.log(`[Consumer Auto Retry] Recriando PeerConnection limpa para ${reason}...`);
      this.initPeerConnection();
    }

    this.lastAttemptTime = Date.now();
    this.log(`[Consumer Auto Retry] Solicitando conexão ao Publisher (${reason})...`);
    this.signaling.send('ready');
  }

  startRetryLoop(intervalMs = 4000) {
    this.stopRetryLoop();
    this.retryTimer = setInterval(() => {
      if (this.isDestroyed) {
        this.stopRetryLoop();
        return;
      }
      if (this.isConnected()) {
        // Conectado com sucesso: não faz novas tentativas
        return;
      }
      this.requestNegotiation('ciclo de persistência');
    }, intervalMs);
  }

  stopRetryLoop() {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }

  start() {
    if (this.isDestroyed) return;
    this.close();

    this.log(`[Consumer Auto] Inicializando para runtimeId: ${this.runtimeId}`);
    this.updateState({ isStarting: true, dataChannelState: 'closed' });

    this.signaling = new RtcSignalingManager({
      runtimeId: this.runtimeId,
      role: 'consumer',
      onLog: (entry) => this.onLog(entry),
      onSignal: (sig) => this.handleSignal(sig)
    });

    this.initPeerConnection();
    this.signaling.startPolling();

    // Primeira tentativa de conexão imediata
    this.requestNegotiation('inicial');

    // Continua tentando periodicamente enquanto não conectar
    this.startRetryLoop();
  }

  initPeerConnection() {
    if (this.pc) {
      try { this.pc.close(); } catch {}
      this.pc = null;
    }
    this.pendingIceCandidates = [];
    this.isAnswering = false;

    this.pc = new RTCPeerConnection(RTC_STUN_CONFIG);

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.log('[Consumer Auto ICE] Candidato local coletado');
        this.signaling.send('candidate', event.candidate.toJSON());
      } else {
        this.log('[Consumer Auto ICE] Coleta de candidatos finalizada');
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc ? this.pc.iceConnectionState : 'closed';
      this.log(`[Consumer Auto ICE State] ${state}`);
      this.updateState({ iceConnectionState: state });
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc ? this.pc.connectionState : 'closed';
      this.log(`[Consumer Auto Peer State] ${state}`);
      this.updateState({ peerConnectionState: state });
      if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        this.isAnswering = false;
        this.updateState({ isConnected: false });
        if (state === 'failed' || state === 'closed') {
          setTimeout(() => {
            if (!this.isConnected()) {
              this.requestNegotiation('queda de peer connection');
            }
          }, 1500);
        }
      }
    };

    this.pc.onsignalingstatechange = () => {
      const state = this.pc ? this.pc.signalingState : 'closed';
      this.log(`[Consumer Auto Signaling State] ${state}`);
      this.updateState({ signalingState: state });
    };

    // Consumer aguarda o DataChannel criado pelo Publisher
    this.pc.ondatachannel = (event) => {
      const channel = event.channel;
      this.log(`[Consumer Auto] DataChannel recebido: "${channel.label}"`);
      this.dataChannel = channel;

      channel.onopen = () => {
        this.log(`[Consumer Auto DataChannel] "${channel.label}" está OPEN! Recepção P2P ativa.`, null, 'success');
        this.isAnswering = false;
        this.updateState({ dataChannelState: 'open', isConnected: true });
      };

      channel.onclose = () => {
        this.log(`[Consumer Auto DataChannel] "${channel.label}" fechado.`, null, 'warn');
        this.updateState({ dataChannelState: 'closed', isConnected: false });
        setTimeout(() => {
          if (!this.isConnected()) {
            this.requestNegotiation('queda de canal');
          }
        }, 1500);
      };

      channel.onerror = (err) => {
        this.log(`[Consumer Auto DataChannel ERRO] ${err.message || String(err)}`, null, 'error');
        this.updateState({ dataChannelState: 'error' });
      };

      channel.onmessage = (msgEvent) => {
        try {
          const payload = JSON.parse(msgEvent.data);
          const itemCount = payload.liveActivity?.items?.length || 0;
          const onlineList = Object.entries(payload.connections || {})
            .filter(([_, c]) => c?.status === 'connected')
            .map(([p]) => p);

          console.log(`[RTC AUTO][WIDGET STATE IN] size=${msgEvent.data.length}b items=${itemCount} online=[${onlineList.join(',')}]`);
          this.log(`[RTC AUTO][WIDGET STATE IN] Payload recebido (${msgEvent.data.length} bytes)`, {
            type: payload.type,
            itemCount,
            onlinePlatforms: onlineList
          });

          if (payload.type === 'LIVENEXUS_TWITCH_STREAM_STATE' || payload.type === 'LIVENEXUS_STREAM_DATA') {
            this.onStreamData(payload);
          }

          if (payload.type === 'LIVENEXUS_SCENARIO_UPDATE' || payload.scenarioData) {
            const scData = payload.scenarioData || payload;
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('livenexus:rtc-scenario-update', { detail: scData })
              );
            }
          }
        } catch (err) {
          console.error(`[RTC AUTO][ERRO IN] ${err.message}`);
          this.log(`[Consumer Auto Mensagem ERRO] Falha ao processar JSON recebido: ${err.message}`, null, 'error');
        }
      };
    };
  }

  async handleSignal(sig) {
    if (sig.type === 'offer') {
      if (!this.pc || this.pc.signalingState !== 'stable') {
        this.log('[Consumer Auto] Reinicializando PeerConnection para processar nova oferta SDP...');
        this.initPeerConnection();
      }
      if (this.dataChannel && this.dataChannel.readyState === 'open' && this.pc.connectionState === 'connected') {
        this.log('[Consumer Auto] Conexão e DataChannel já estão OPEN. Ignorando oferta SDP redundante.');
        return;
      }
      if (this.isAnswering) {
        this.log('[Consumer Auto] Resposta SDP já em processamento. Ignorando oferta concorrente.');
        return;
      }

      this.isAnswering = true;
      try {
        await this.pc.setRemoteDescription(new RTCSessionDescription(sig.data));
        this.log('[Consumer Auto] Oferta SDP remota configurada. Criando resposta...');

        // Aplicar candidatos ICE pendentes no buffer
        if (this.pendingIceCandidates.length > 0) {
          this.log(`[Consumer Auto ICE] Aplicando ${this.pendingIceCandidates.length} candidatos remotos pendentes...`);
          for (const cand of this.pendingIceCandidates) {
            try {
              await this.pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (cErr) {
              this.log(`[Consumer Auto ICE ERRO Pendente] ${cErr.message}`, null, 'warn');
            }
          }
          this.pendingIceCandidates = [];
        }

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.log('[Consumer Auto] Resposta SDP local configurada. Enviando ao Publisher...');
        await this.signaling.send('answer', answer);
      } catch (err) {
        this.log(`[Consumer Auto ERRO Offer] ${err.message}`, null, 'error');
      } finally {
        this.isAnswering = false;
      }
    } else if (sig.type === 'candidate' && sig.data) {
      if (!this.pc) return;
      try {
        if (this.pc.remoteDescription) {
          await this.pc.addIceCandidate(new RTCIceCandidate(sig.data));
          this.log('[Consumer Auto ICE] Candidato remoto aplicado com sucesso.');
        } else {
          this.log('[Consumer Auto ICE] Candidato recebido antes da oferta SDP; armazenando no buffer.');
          this.pendingIceCandidates.push(sig.data);
        }
      } catch (err) {
        this.log(`[Consumer Auto ERRO Candidate] ${err.message}`, null, 'error');
      }
    } else if (sig.type === 'ready') {
      if (!this.isConnected() && !this.isNegotiating()) {
        this.log('[Consumer Auto] Publisher anunciou presença (ready). Solicitando oferta...');
        this.requestNegotiation('publisher disponível');
      }
    } else if (sig.type === 'close') {
      this.log('[Consumer Auto] Publisher encerrou a transmissão.', null, 'warn');
      this.close();
    }
  }

  close() {
    this.stopRetryLoop();
    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch {}
      this.dataChannel = null;
    }
    if (this.pc) {
      try { this.pc.close(); } catch {}
      this.pc = null;
    }
    this.pendingIceCandidates = [];
    this.isAnswering = false;
    if (this.signaling) {
      this.signaling.destroy();
      this.signaling = null;
    }
    this.updateState({
      dataChannelState: 'closed',
      peerConnectionState: 'closed',
      iceConnectionState: 'closed',
      isConnected: false
    });
  }

  destroy() {
    this.isDestroyed = true;
    this.close();
  }
}
