// Publisher RTC Automático do LiveNexus
// Reproduz a fórmula funcional comprovada no laboratório de referência
// Canal oficial: "livenexus-rtc-live"

import { RtcSignalingManager, RTC_STUN_CONFIG } from './rtcSignaling.js';

export class RtcPublisher {
  constructor({ runtimeId, onStateChange = () => {}, onLog = () => {}, onDataChannelOpen = () => {} }) {
    if (!runtimeId || !runtimeId.trim()) {
      throw new Error('Identidade real da sessão não resolvida: runtimeId permanente obrigatório para o Publisher.');
    }

    this.runtimeId = runtimeId.trim();
    this.onStateChange = onStateChange;
    this.onLog = onLog;
    this.onDataChannelOpen = onDataChannelOpen;

    this.pc = null;
    this.dataChannel = null;
    this.signaling = null;
    this.isDestroyed = false;
    this.isNegotiating = false;
    this.negotiationStartTime = 0;
    this.pendingIceCandidates = [];
  }

  log(message, detail = null, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    this.onLog({ timestamp, role: 'publisher', message, detail, type });
  }

  updateState(partial) {
    this.onStateChange(partial);
  }

  start() {
    if (this.isDestroyed) return;
    this.close();

    this.log(`[Publisher Auto] Inicializando para runtimeId: ${this.runtimeId}`);
    this.updateState({ isStarting: true, dataChannelState: 'closed' });

    this.signaling = new RtcSignalingManager({
      runtimeId: this.runtimeId,
      role: 'publisher',
      onLog: (entry) => this.onLog(entry),
      onSignal: (sig) => this.handleSignal(sig)
    });

    this.initPeerConnection();
    this.signaling.startPolling();

    // Emite o sinal de pronto para anunciar presença ao Consumer
    this.signaling.send('ready');
  }

  initPeerConnection() {
    if (this.pc) {
      try { this.pc.close(); } catch {}
      this.pc = null;
    }
    this.pendingIceCandidates = [];
    this.isNegotiating = false;

    this.pc = new RTCPeerConnection(RTC_STUN_CONFIG);

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.log('[Publisher Auto ICE] Candidato local coletado');
        this.signaling.send('candidate', event.candidate.toJSON());
      } else {
        this.log('[Publisher Auto ICE] Coleta de candidatos finalizada');
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc ? this.pc.iceConnectionState : 'closed';
      this.log(`[Publisher Auto ICE State] ${state}`);
      this.updateState({ iceConnectionState: state });
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc ? this.pc.connectionState : 'closed';
      this.log(`[Publisher Auto Peer State] ${state}`);
      this.updateState({ peerConnectionState: state });
      if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        this.isNegotiating = false;
        this.updateState({ isConnected: false });
      }
    };

    this.pc.onsignalingstatechange = () => {
      const state = this.pc ? this.pc.signalingState : 'closed';
      this.log(`[Publisher Auto Signaling State] ${state}`);
      this.updateState({ signalingState: state });
    };

    // Criação do canal de dados "livenexus-rtc-live"
    this.log('[Publisher Auto] Criando DataChannel "livenexus-rtc-live"...');
    this.dataChannel = this.pc.createDataChannel('livenexus-rtc-live', { ordered: true });

    this.dataChannel.onopen = () => {
      this.log('[Publisher Auto DataChannel] Canal OPEN! Pronto para transmissão P2P.', null, 'success');
      this.isNegotiating = false;
      this.updateState({ dataChannelState: 'open', isConnected: true });
      try {
        this.onDataChannelOpen();
      } catch (err) {
        this.log(`[Publisher Auto DataChannel ERRO Callback] ${err.message}`, null, 'warn');
      }
    };

    this.dataChannel.onclose = () => {
      this.log('[Publisher Auto DataChannel] Canal fechado.', null, 'warn');
      this.isNegotiating = false;
      this.updateState({ dataChannelState: 'closed', isConnected: false });
    };

    this.dataChannel.onerror = (err) => {
      this.log(`[Publisher Auto DataChannel ERRO] ${err.message || String(err)}`, null, 'error');
      this.updateState({ dataChannelState: 'error' });
    };
  }

  async handleSignal(sig) {
    if (sig.type === 'ready') {
      if (this.dataChannel && this.dataChannel.readyState === 'open' && this.pc && this.pc.connectionState === 'connected') {
        this.log('[Publisher Auto] Conexão e DataChannel já estão OPEN. Ignorando sinal ready redundante.');
        return;
      }
      if (this.isNegotiating && (Date.now() - this.negotiationStartTime < 3500) && this.pc && this.pc.connectionState !== 'failed' && this.pc.connectionState !== 'closed') {
        this.log('[Publisher Auto] Negociação já em andamento. Aguardando conclusão da oferta antes de reiniciar.');
        return;
      }

      this.log('[Publisher Auto] Consumer anunciou presença / reconectou (ready). Reinicializando conexão P2P...');
      this.isNegotiating = true;
      this.negotiationStartTime = Date.now();
      
      // Reinicializa a PeerConnection e DataChannel para a nova sessão do Consumer
      this.initPeerConnection();
      
      this.log('[Publisher Auto] Criando oferta SDP para o Consumer...');
      await this.createAndSendOffer();
    } else if (sig.type === 'answer') {
      if (!this.pc) return;
      try {
        if (this.pc.signalingState !== 'have-local-offer') {
          this.log(`[Publisher Auto Answer IGNORADO] signalingState atual (${this.pc.signalingState}) não espera resposta SDP.`);
          return;
        }
        await this.pc.setRemoteDescription(new RTCSessionDescription(sig.data));
        this.log('[Publisher Auto] Resposta SDP remota configurada com sucesso.');
        this.isNegotiating = false;

        // Aplicar candidatos ICE pendentes no buffer
        if (this.pendingIceCandidates.length > 0) {
          this.log(`[Publisher Auto ICE] Aplicando ${this.pendingIceCandidates.length} candidatos remotos pendentes...`);
          for (const cand of this.pendingIceCandidates) {
            try {
              await this.pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (cErr) {
              this.log(`[Publisher Auto ICE ERRO Pendente] ${cErr.message}`, null, 'warn');
            }
          }
          this.pendingIceCandidates = [];
        }
      } catch (err) {
        this.isNegotiating = false;
        this.log(`[Publisher Auto ERRO Answer] ${err.message}`, null, 'error');
      }
    } else if (sig.type === 'candidate' && sig.data) {
      if (!this.pc) return;
      try {
        if (this.pc.remoteDescription) {
          await this.pc.addIceCandidate(new RTCIceCandidate(sig.data));
          this.log('[Publisher Auto ICE] Candidato remoto aplicado com sucesso.');
        } else {
          this.log('[Publisher Auto ICE] Candidato recebido antes da resposta SDP; armazenando no buffer.');
          this.pendingIceCandidates.push(sig.data);
        }
      } catch (err) {
        this.log(`[Publisher Auto ERRO Candidate] ${err.message}`, null, 'error');
      }
    } else if (sig.type === 'close') {
      this.log('[Publisher Auto] Consumer solicitou encerramento da conexão.', null, 'warn');
      this.close();
    }
  }

  async createAndSendOffer() {
    if (!this.pc) return;
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.log('[Publisher Auto] Oferta SDP local criada e configurada.');
      await this.signaling.send('offer', offer);
    } catch (err) {
      this.log(`[Publisher Auto ERRO Offer] ${err.message}`, null, 'error');
    }
  }

  setLatestScenarioData(scenarioData) {
    if (scenarioData) {
      this.latestScenarioData = scenarioData;
    }
  }

  sendScenarioUpdate(scenarioData) {
    if (scenarioData) {
      this.latestScenarioData = scenarioData;
    }
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return false;
    }
    try {
      const payload = {
        type: 'LIVENEXUS_SCENARIO_UPDATE',
        scenarioData: this.latestScenarioData,
        timestamp: Date.now()
      };
      const raw = JSON.stringify(payload);
      this.dataChannel.send(raw);
      this.log(`[Publisher Auto DataChannel] Cenário atualizado enviado via RTC (${raw.length} bytes)`, null, 'success');
      return true;
    } catch (err) {
      this.log(`[Publisher Auto ERRO Envio Cenário] ${err.message}`, null, 'error');
      return false;
    }
  }

  sendStreamState(liveActivity, connections, streamMeta) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return false;
    }

    try {
      const payload = {
        type: 'LIVENEXUS_STREAM_DATA',
        liveActivity: liveActivity || { items: [] },
        connections: connections || {},
        streamMeta: streamMeta || {},
        scenarioData: this.latestScenarioData || null,
        timestamp: Date.now()
      };
      const raw = JSON.stringify(payload);
      this.dataChannel.send(raw);
      
      const itemCount = payload.liveActivity?.items?.length || 0;
      const onlineList = Object.entries(payload.connections || {})
        .filter(([_, c]) => c?.status === 'connected')
        .map(([p]) => p);

      console.log(`[RTC AUTO][WIDGET STATE OUT] size=${raw.length}b items=${itemCount} online=[${onlineList.join(',')}]`);
      this.log(`[RTC AUTO][WIDGET STATE OUT] ${raw.length} bytes P2P`, {
        itemCount,
        onlinePlatforms: onlineList
      });
      return true;
    } catch (err) {
      console.error(`[RTC AUTO][ERRO OUT] ${err.message}`);
      this.log(`[Publisher Auto ERRO Envio] ${err.message}`, null, 'error');
      return false;
    }
  }

  close() {
    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch {}
      this.dataChannel = null;
    }
    if (this.pc) {
      try { this.pc.close(); } catch {}
      this.pc = null;
    }
    this.isNegotiating = false;
    this.pendingIceCandidates = [];
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
