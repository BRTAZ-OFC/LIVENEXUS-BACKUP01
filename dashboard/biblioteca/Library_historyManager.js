// Gerenciador de histórico de faixas tocadas com persistência via Cache_Biblioteca.
import { playerEvents } from './Library_playerEvents';
import { Cache_Biblioteca, getActiveUserId } from './cache/Cache_Biblioteca';

class HistoryManager {
  constructor() {
    this.userId = getActiveUserId();
    this.inMemoryFallback = [];
  }

  getHistory() {
    const currentUserId = getActiveUserId();
    if (currentUserId) {
      this.userId = currentUserId;
      return Cache_Biblioteca.getHistory(currentUserId);
    }
    return [...this.inMemoryFallback];
  }

  async add(track) {
    if (!track) return;
    const key = track.videoId || track.id;
    if (!key) return;

    const currentUserId = getActiveUserId();
    let updated = [];

    if (currentUserId) {
      this.userId = currentUserId;
      updated = Cache_Biblioteca.addHistory(track, currentUserId);
    } else {
      const filtered = this.inMemoryFallback.filter(item => (item.videoId || item.id) !== key);
      filtered.unshift({
        ...track,
        playedAt: Date.now(),
      });
      this.inMemoryFallback = filtered;
      updated = [...this.inMemoryFallback];
    }

    playerEvents.emit('history_changed', updated);
    return updated;
  }

  async remove(trackId) {
    if (!trackId) return;
    const currentUserId = getActiveUserId();
    let updated = [];

    if (currentUserId) {
      this.userId = currentUserId;
      updated = Cache_Biblioteca.removeHistory(trackId, currentUserId);
    } else {
      this.inMemoryFallback = this.inMemoryFallback.filter(item => (item.videoId || item.id) !== trackId);
      updated = [...this.inMemoryFallback];
    }

    playerEvents.emit('history_changed', updated);
    return updated;
  }

  async clear() {
    const currentUserId = getActiveUserId();
    if (currentUserId) {
      this.userId = currentUserId;
      Cache_Biblioteca.clearHistory(currentUserId);
    }
    this.inMemoryFallback = [];
    playerEvents.emit('history_changed', []);
  }
}

export const historyManager = new HistoryManager();


