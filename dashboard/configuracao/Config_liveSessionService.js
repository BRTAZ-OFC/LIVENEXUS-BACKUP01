// liveSessionService — camada de serviço para LiveSession do LiveNexus.
// Totalmente desacoplado de SDKs proprietários, utilizando liveSessionRepository.
// Isola TODO acesso a dados de lives da UI.
//
// NÃO há polling, interval, loop de sincronização ou chamadas em render/import.
// Cada operação é pontual: load on mount, save/edit/delete on user action.

import { liveSessionRepository } from '@dashboard/configuracao/Config_liveNexusDataAdapter';
import { discoverVod } from '@dashboard/configuracao/Config_vodDiscovery';

export const liveSessionService = {
  // Lista todas as LiveSessions do usuário
  async listUserSessions(userId, limit = 50) {
    return liveSessionRepository.list({}, '-created_date', limit);
  },

  // Lista somente LiveSessions com VOD disponível (para o carrossel do Dashboard)
  async listAvailableSessions(userId, limit = 10) {
    return liveSessionRepository.list({ vodStatus: 'available' }, '-created_date', limit);
  },

  async getSession(sessionId, userId) {
    return liveSessionRepository.get(sessionId);
  },

  async saveSession(userId, data) {
    return liveSessionRepository.create(data);
  },

  async updateSession(sessionId, userId, changes) {
    return liveSessionRepository.update(sessionId, changes);
  },

  async deleteSession(sessionId, userId) {
    return liveSessionRepository.delete(sessionId);
  },

  // JANELA DE CARÊNCIA — descoberta silenciosa de VOD após o fim da live.
  // Sonda discoverVod repetidamente durante uma janela TOTAL de 120s. Para
  // imediatamente assim que um VOD real (available) é confirmado. Se 120s
  // expira sem confirmação, retorna null (descartar pendência, sem LiveSession).
  async discoverVodWithGraceWindow(platform, liveData) {
    const GRACE_WINDOW_MS = 120000; // 2 minutos — teto absoluto
    const POLL_INTERVAL_MS = 15000; // ~8 tentativas no máximo
    const deadline = Date.now() + GRACE_WINDOW_MS;
    while (Date.now() < deadline) {
      const result = await discoverVod(platform, liveData);
      // Só aceita VOD confirmado e correspondente à transmissão encerrada.
      if (result?.vodStatus === 'available') return result;
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await new Promise(r => setTimeout(r, Math.min(POLL_INTERVAL_MS, remaining)));
    }
    return null; // janela expirada — VOD não disponível
  },

  // Re-verifica sessões pending. Tempo máximo TOTAL = 30s por item.
  // Itens presos há mais de 30s são expirados e removidos SEM nova tentativa.
  // Sem polling, interval, retry ou loop. Uma passagem por mount.
  async recheckPendingSessions() {
    const sessions = await liveSessionRepository.list({ vodStatus: 'pending' }, '-created_date', 50);
    const now = Date.now();
    const MAX_AGE_MS = 30000;
    await Promise.all(sessions.map(async (session) => {
      const createdAt = new Date(session.created_date).getTime();
      const age = now - createdAt;
      // Já passou do tempo máximo (ou data inválida) => expirar e remover, sem tentar de novo.
      if (!isFinite(age) || age > MAX_AGE_MS) {
        try { await liveSessionRepository.delete(session.id); } catch (e) { console.error('Failed to expire pending session:', e); }
        return;
      }
      // Dentro da janela — uma única tentativa (bounded pelo timeout de 30s do vodDiscovery).
      const result = await discoverVod(session.platform, {
        channelName: session.channelName,
        streamId: session.streamId,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        title: session.title,
      });
      if (result?.vodStatus === 'available') {
        try {
          await liveSessionRepository.update(session.id, {
            vodStatus: 'available',
            vodId: result.vodId || session.vodId,
            streamUrl: result.streamUrl || session.streamUrl,
            thumbnailUrl: result.thumbnailUrl || session.thumbnailUrl,
            duration: result.duration || session.duration,
            views: result.views || session.views,
          });
        } catch (e) { console.error('Failed to update session:', e); }
        return;
      }
      // Não confirmado => remover. Não persiste pendente.
      try { await liveSessionRepository.delete(session.id); } catch (e) { console.error('Failed to delete unconfirmed session:', e); }
    }));
  },
};
