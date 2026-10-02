// Gerenciador de histórico de faixas tocadas
import { playerEvents } from './Library_playerEvents';

const MAX_ITEMS = 50;

class HistoryManager {
  constructor() {
    this.items = [];
  }

  getHistory() {
    return [...this.items];
  }

  async add(track) {
    if (!track) return;
    const key = track.videoId || track.id;
    if (!key) return;

    this.items = this.getHistory().filter(item => (item.videoId || item.id) !== key);
    const entry = {
      ...track,
      playedAt: Date.now(),
    };
    this.items.unshift(entry);
    if (this.items.length > MAX_ITEMS) {
      this.items = this.items.slice(0, MAX_ITEMS);
    }

    playerEvents.emit('history_changed', this.getHistory());
  }

  async remove(trackId) {
    if (!trackId) return;
    this.items = this.getHistory().filter(item => (item.videoId || item.id) !== trackId);
    playerEvents.emit('history_changed', this.getHistory());
  }

  async clear() {
    this.items = [];
    playerEvents.emit('history_changed', []);
  }
}

export const historyManager = new HistoryManager();
