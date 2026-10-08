// Gerenciador de histórico de faixas tocadas em tempo de execução.
import { playerEvents } from './Library_playerEvents';
import { authClient } from '../login/authClient.js';

function getCurrentUserId() {
  try {
    return authClient.getUser()?.id || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

const MAX_ITEMS = 50;

class HistoryManager {
  constructor() {
    this.userId = getCurrentUserId();
    this.items = [];
  }

  getHistory() {
    const currentUserId = getCurrentUserId();
    if (currentUserId !== this.userId) {
      this.userId = currentUserId;
      this.items = [];
    }
    return [...this.items];
  }

  async add(track) {
    if (!track) return;
    const key = track.videoId || track.id;
    if (!key) return;

    const currentUserId = getCurrentUserId();
    if (currentUserId !== this.userId) {
      this.userId = currentUserId;
      this.items = [];
    }

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


