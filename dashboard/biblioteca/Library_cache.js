// Library_cache.js — Gerenciador ÚNICO e Exclusivo de Cache da Biblioteca Global do LiveNexus.
//
// REGRAS ARQUITETURAIS:
// - Único mecanismo de cache do projeto, exclusivo para a Biblioteca Musical Global.
// - Não existem caches paralelos em memória ou chaves avulsas no localStorage.
// - Isolamento estrito por userId.
// - TTL padrão de 24 horas (86.400.000 ms).
// - Não armazena dados de autenticação ou credenciais.
// - Não interfere em Johnsons, bancos JSON de persistência ou ramais do backend.

import { safeStorage } from '../login/safeStorage.js';

const CACHE_PREFIX = 'livenexus:library_cache:';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

export const CACHE_NAMESPACES = {
  LIBRARY: 'library',
  LIBRARY_HISTORY: 'playback_history',
  LIBRARY_SEARCH: 'music_search',
  LIBRARY_SEARCH_HISTORY: 'music_search_history',
  MUSIC_SETTINGS: 'music_settings',
  MUSIC_TAGS: 'music_tags',
};

function resolveUserId(userId) {
  if (userId && typeof userId === 'string' && userId.trim()) {
    return userId.trim();
  }
  if (typeof window !== 'undefined') {
    try {
      const rawUser = safeStorage.getItem('livenexus_current_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u?.id) return String(u.id).trim();
      }
    } catch {}
  }
  return 'anonymous';
}

function buildKey(userId, namespace, subKey = '') {
  const safeUser = resolveUserId(userId);
  const safeNs = (namespace && typeof namespace === 'string') ? namespace.trim() : 'general';
  const safeSub = subKey ? `:${String(subKey).trim()}` : '';
  return `${CACHE_PREFIX}${safeUser}:${safeNs}${safeSub}`;
}

export const libraryCache = {
  /**
   * READ: Recupera o dado do cache da Biblioteca se válido e dentro da janela de 24 horas.
   */
  get(userId, namespace, subKey = '') {
    const key = buildKey(userId, namespace, subKey);
    try {
      const raw = safeStorage.getItem(key);
      if (!raw) return null;
      const envelope = JSON.parse(raw);
      if (!envelope || typeof envelope !== 'object') {
        safeStorage.removeItem(key);
        return null;
      }

      const now = Date.now();
      const age = now - (envelope.timestamp || 0);
      if (age > CACHE_TTL_MS || (envelope.expiresAt && now > envelope.expiresAt)) {
        safeStorage.removeItem(key);
        return null;
      }

      return envelope.data;
    } catch (e) {
      console.warn(`[libraryCache] Erro ao ler ${key}:`, e);
      return null;
    }
  },

  /**
   * CREATE / UPDATE: Persiste no cache da Biblioteca com envelope temporal de 24 horas.
   */
  set(userId, namespace, data, subKey = '') {
    const safeUser = resolveUserId(userId);
    const key = buildKey(safeUser, namespace, subKey);
    try {
      const now = Date.now();
      const envelope = {
        userId: safeUser,
        namespace,
        subKey: subKey || null,
        timestamp: now,
        expiresAt: now + CACHE_TTL_MS,
        data,
      };
      safeStorage.setItem(key, JSON.stringify(envelope));
      return true;
    } catch (e) {
      console.warn(`[libraryCache] Erro ao gravar ${key}:`, e);
      return false;
    }
  },

  /**
   * INVALIDATE: Invalida e remove chave ou namespace específico de um usuário.
   */
  invalidate(userId, namespace, subKey = '') {
    const safeUser = resolveUserId(userId);
    const key = buildKey(safeUser, namespace, subKey);
    try {
      safeStorage.removeItem(key);
      if (!subKey && typeof window !== 'undefined' && window.localStorage) {
        const fullPrefix = `${CACHE_PREFIX}${safeUser}:${namespace}:`;
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(fullPrefix)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => safeStorage.removeItem(k));
      }
    } catch (e) {
      console.warn(`[libraryCache] Erro ao invalidar ${key}:`, e);
    }
  },

  /**
   * CLEAR: Remove todo o cache local pertencente àquele userId neste dispositivo.
   */
  clearUser(userId) {
    const safeUser = resolveUserId(userId);
    const userPrefix = `${CACHE_PREFIX}${safeUser}:`;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && (k.startsWith(userPrefix) || k.includes(`:${safeUser}:`) || k.endsWith(`:${safeUser}`))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => safeStorage.removeItem(k));
      }
    } catch (e) {
      console.warn(`[libraryCache] Erro ao limpar cache do usuário ${safeUser}:`, e);
    }
  },

  /**
   * Limpeza preventiva de chaves expiradas no dispositivo.
   */
  sweepExpired() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const now = Date.now();
      const keysToRemove = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          try {
            const raw = window.localStorage.getItem(k);
            if (raw) {
              const env = JSON.parse(raw);
              if (env && env.expiresAt && now > env.expiresAt) {
                keysToRemove.push(k);
              }
            }
          } catch {}
        }
      }
      keysToRemove.forEach(k => safeStorage.removeItem(k));
    } catch {}
  }
};

// Sweep leve automático ao carregar o módulo
if (typeof window !== 'undefined') {
  try {
    libraryCache.sweepExpired();
  } catch {}
}
