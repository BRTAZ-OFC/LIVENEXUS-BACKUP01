// Config_localCache.js — Camada Unificada de Cache Local do LiveNexus.
//
// Expande o mecanismo de armazenamento local existente (safeStorage / localStorage)
// para prover uma camada rápida de persistência temporária (cache-first / stale-while-revalidate)
// para as áreas mais pesadas do sistema.
//
// REGRAS:
// - LOCAL ao navegador/dispositivo (nunca enviado a D1, Worker ou servidor).
// - Isolamento estrito por userId e dispositivo.
// - TTL máximo de 24 horas (86.400.000 ms).
// - NENHUM dado sensível de autenticação, senha, hash ou secrets é armazenado.
// - No logout, limpa todos os dados do userId no dispositivo atual.

import { safeStorage } from '@dashboard/login/safeStorage';

const CACHE_PREFIX = 'livenexus:cache:';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// Namespace constants restritos exclusivamente à Biblioteca Musical
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

export const localCache = {
  /**
   * READ: Recupera o dado do cache se válido e dentro da janela de 24 horas.
   * Se expirado (> 24h), invalida e remove automaticamente, retornando null.
   */
  get(userId, namespace, subKey = '') {
    if (typeof window === 'undefined') return null;
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
        // Expirado após 24 horas: remove e força recarregamento da fonte oficial
        safeStorage.removeItem(key);
        return null;
      }
      
      return envelope.data;
    } catch (e) {
      console.warn(`[localCache] Erro ao ler ${key}:`, e);
      return null;
    }
  },

  /**
   * CREATE / UPDATE: Persiste ou atualiza o cache com envelope temporal de 24 horas.
   */
  set(userId, namespace, data, subKey = '') {
    if (typeof window === 'undefined') return false;
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
      console.warn(`[localCache] Erro ao gravar ${key}:`, e);
      return false;
    }
  },

  /**
   * INVALIDATE: Invalida e remove chave ou namespace específico de um usuário.
   */
  invalidate(userId, namespace, subKey = '') {
    if (typeof window === 'undefined') return;
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
      console.warn(`[localCache] Erro ao invalidar ${key}:`, e);
    }
  },

  /**
   * CLEAR: Remove todo o cache local pertencente àquele userId neste dispositivo (usado no logout).
   */
  clearUser(userId) {
    if (typeof window === 'undefined') return;
    const safeUser = resolveUserId(userId);
    const userPrefix = `${CACHE_PREFIX}${safeUser}:`;
    try {
      if (window.localStorage) {
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
      console.warn(`[localCache] Erro ao limpar cache do usuário ${safeUser}:`, e);
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

// Executa sweep leve ao carregar o módulo
if (typeof window !== 'undefined') {
  try {
    localCache.sweepExpired();
  } catch {}
}
