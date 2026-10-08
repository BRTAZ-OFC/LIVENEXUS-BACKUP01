// Gerenciador de histórico de buscas (queries digitadas) — unificado no libraryCache.
// Cap em 20 itens, deduplica (move para o topo se já existir).
import { libraryCache, CACHE_NAMESPACES } from './Library_cache.js';
import { authClient } from '../login/authClient.js';

const MAX_ITEMS = 20;

function getCurrentUserId() {
  try {
    return authClient.getUserDataCache()?.id || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

function load(userId) {
  try {
    // Migração transparente do armazenamento legado se existir
    if (typeof localStorage !== 'undefined') {
      const legacy = localStorage.getItem('streamspeak_music_search_history');
      if (legacy) {
        localStorage.removeItem('streamspeak_music_search_history');
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          libraryCache.set(userId, CACHE_NAMESPACES.LIBRARY_SEARCH_HISTORY, parsed);
          return parsed;
        }
      }
    }
    const cached = libraryCache.get(userId, CACHE_NAMESPACES.LIBRARY_SEARCH_HISTORY);
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
}

function save(userId, items) {
  try {
    libraryCache.set(userId, CACHE_NAMESPACES.LIBRARY_SEARCH_HISTORY, items);
  } catch { /* ignore */ }
}

class SearchHistoryManager {
  constructor() {
    this.userId = getCurrentUserId();
    this.items = load(this.userId);
  }

  getUserId() {
    const current = getCurrentUserId();
    if (current !== this.userId) {
      this.userId = current;
      this.items = load(this.userId);
    }
    return this.userId;
  }

  add(query) {
    if (!query || !query.trim()) return;
    const q = query.trim();
    const uid = this.getUserId();
    // Dedup: remove ocorrências anteriores
    this.items = this.items.filter((i) => (i?.query || '').toLowerCase() !== q.toLowerCase());
    this.items.unshift({ query: q, searchedAt: Date.now() });
    if (this.items.length > MAX_ITEMS) this.items = this.items.slice(0, MAX_ITEMS);
    save(uid, this.items);
  }

  list() {
    this.getUserId();
    return this.items;
  }

  clear() {
    const uid = this.getUserId();
    this.items = [];
    save(uid, this.items);
  }

  remove(query) {
    const uid = this.getUserId();
    this.items = this.items.filter((i) => i.query !== query);
    save(uid, this.items);
  }
}

export const searchHistoryManager = new SearchHistoryManager();
