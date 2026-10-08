// Gerenciador de histórico de faixas tocadas com persistência via libraryCache e isolamento por userId
import { playerEvents } from './Library_playerEvents';
import { libraryCache as localCache, CACHE_NAMESPACES } from './Library_cache.js';
import { authClient } from '../login/authClient.js';

function getCurrentUserId() {
  try {
    return authClient.getUserDataCache()?.id || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

const MAX_ITEMS = 50;

class HistoryManager {
  constructor() {
    this.userId = getCurrentUserId();
    this.items = this.loadFromCache();
  }

  loadFromCache() {
    try {
      const cached = localCache.get(this.userId, CACHE_NAMESPACES.LIBRARY_HISTORY);
      return Array.isArray(cached) ? cached : [];
    } catch {
      return [];
    }
  }

  saveToCache() {
    try {
      localCache.set(this.userId, CACHE_NAMESPACES.LIBRARY_HISTORY, this.items);
    } catch { /* ignore */ }
  }

  getHistory() {
    const currentUserId = getCurrentUserId();
    if (currentUserId !== this.userId) {
      this.userId = currentUserId;
      this.items = this.loadFromCache();
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
      this.items = this.loadFromCache();
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
    this.saveToCache();

    playerEvents.emit('history_changed', this.getHistory());
  }

  async remove(trackId) {
    if (!trackId) return;
    this.items = this.getHistory().filter(item => (item.videoId || item.id) !== trackId);
    this.saveToCache();
    playerEvents.emit('history_changed', this.getHistory());
  }

  async clear() {
    this.items = [];
    this.saveToCache();
    playerEvents.emit('history_changed', []);
  }
}

export const historyManager = new HistoryManager();

