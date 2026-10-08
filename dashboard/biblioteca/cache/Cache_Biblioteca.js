// Cache_Biblioteca.js — Único sistema de cache local persistente da Biblioteca do LiveNexus.
// Isolado estritamente por userId para:
//   1. Início da Biblioteca (carregamento principal e progressivo)
//   2. Pesquisa (resultados agregados e progressivos por termo)
//   3. Histórico de reprodução (músicas efetivamente reproduzidas, sem expiração por tempo)
//
// REGRA: O cache não muda por tempo. O cache só muda quando os dados mudam.
// ISOLAMENTO TOTAL: Não acessa nem integra Johnsons, CRUDs, D1, Ramais, Biblioteca do Usuário ou outros módulos.

import { safeStorage } from '../../login/safeStorage.js';
import { authClient } from '../../login/authClient.js';

const STORAGE_PREFIX = 'livenexus_biblioteca_cache';

/**
 * Valida e resolve o userId ativo da sessão.
 * Retorna null se não houver um usuário válido e autenticado.
 */
export function getActiveUserId(overrideUserId) {
  if (overrideUserId && typeof overrideUserId === 'string' && overrideUserId.trim().length > 0 && overrideUserId !== 'anonymous') {
    return overrideUserId.trim();
  }
  try {
    const user = authClient.getUser();
    if (user && typeof user.id === 'string' && user.id.trim().length > 0 && user.id !== 'anonymous') {
      return user.id.trim();
    }
  } catch {
    // Falha segura se authClient não estiver disponível
  }
  return null;
}

// Helpers internos para chaves isoladas por userId
function keyForHome(userId) {
  return `${STORAGE_PREFIX}:${userId}:biblioteca`;
}

function keyForSearch(userId) {
  return `${STORAGE_PREFIX}:${userId}:pesquisa`;
}

function keyForHistory(userId) {
  return `${STORAGE_PREFIX}:${userId}:historico_reproducao`;
}

// Helper seguro para leitura de JSON no safeStorage
function readJson(key, defaultValue = null) {
  try {
    const raw = safeStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

// Helper seguro para escrita de JSON no safeStorage
function writeJson(key, value) {
  try {
    safeStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('[Cache_Biblioteca] Falha ao persistir no armazenamento local:', err);
    return false;
  }
}

/**
 * Comparador canônico de conteúdo relevante.
 * Compara estruturas profundamente ignorando propriedades voláteis (timestamps efêmeros como savedAt/playedAt).
 * Evita regravações falsas quando a consulta externa retorna os mesmos dados.
 */
function isPrimitive(val) {
  return val === null || typeof val !== 'object';
}

function getRelevantKeys(obj) {
  return Object.keys(obj).filter(k => 
    k !== 'savedAt' && 
    k !== 'playedAt' && 
    k !== 'timestamp' && 
    k !== '_cache' && 
    k !== 'isStale' && 
    obj[k] !== undefined
  );
}

export function isContentEqual(a, b) {
  if (a === b) return true;
  if (isPrimitive(a) || isPrimitive(b)) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isContentEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = getRelevantKeys(a);
  const keysB = getRelevantKeys(b);

  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isContentEqual(a[key], b[key])) return false;
  }
  return true;
}

export const Cache_Biblioteca = {
  /**
   * Retorna o userId da sessão autenticada.
   */
  getUserId(overrideUserId) {
    return getActiveUserId(overrideUserId);
  },

  /* ========================================================================= */
  /* 1. INÍCIO DA BIBLIOTECA (Home / Browse / Carregamento Progressivo)        */
  /* ========================================================================= */

  /**
   * Recupera os dados em cache do início da biblioteca para o usuário ativo.
   * Não expira por tempo — os dados permanecem válidos entre sessões.
   * @param {string} [overrideUserId]
   * @param {number} [_ignoredTtl] Mantido apenas para compatibilidade de assinatura
   * @returns {object|null} Dados do início ou null se inexistente
   */
  getHome(overrideUserId, _ignoredTtl) {
    const uid = getActiveUserId(overrideUserId);
    if (!uid) return null;

    const record = readJson(keyForHome(uid));
    if (!record || !record.data) {
      return null;
    }

    return record.data;
  },

  /**
   * Recupera os dados do início com metadados para compatibilidade.
   * @param {string} [overrideUserId]
   * @param {number} [_ignoredTtl] Mantido para compatibilidade
   * @returns {{ data: object, isStale: boolean, savedAt: number } | null}
   */
  getHomeWithMetadata(overrideUserId, _ignoredTtl) {
    const uid = getActiveUserId(overrideUserId);
    if (!uid) return null;

    const record = readJson(keyForHome(uid));
    if (!record || !record.data) {
      return null;
    }

    return {
      data: record.data,
      isStale: false, // Nunca expira por tempo
      savedAt: record.savedAt || 0,
    };
  },

  /**
   * Salva os dados do início da biblioteca somente se houver alteração real de conteúdo.
   * Não regravar se os novos resultados forem idênticos aos já armazenados.
   * @param {object} data Seções do início (músicas, playlists, artistas, etc.)
   * @param {string} [overrideUserId]
   * @returns {boolean} true se os dados foram efetivamente gravados; false se eram idênticos
   */
  setHome(data, overrideUserId) {
    const uid = getActiveUserId(overrideUserId);
    if (!uid || !data || typeof data !== 'object') return false;

    const existingRecord = readJson(keyForHome(uid));
    if (existingRecord && existingRecord.data && isContentEqual(existingRecord.data, data)) {
      // Conteúdo idêntico ao já salvo: NÃO executa nova gravação no storage
      return false;
    }

    const record = {
      savedAt: Date.now(),
      data,
    };
    return writeJson(keyForHome(uid), record);
  },

  /**
   * Limpa o cache do início da biblioteca do usuário por ação explícita.
   */
  clearHome(overrideUserId) {
    const uid = getActiveUserId(overrideUserId);
    if (!uid) return;
    try {
      safeStorage.removeItem(keyForHome(uid));
    } catch {}
  },

  /* ========================================================================= */
  /* 2. PESQUISA (Resultados agregados e progressivos por termo)              */
  /* ========================================================================= */

  /**
   * Normaliza termo de pesquisa para chave do cache.
   */
  normalizeQuery(query) {
    return (query || '').trim().toLowerCase();
  },

  /**
   * Recupera resultados em cache para uma pesquisa específica do usuário ativo.
   * Não expira por tempo — resultados anteriores continuam disponíveis.
   * @param {string} query Termo pesquisado
   * @param {string} [overrideUserId]
   * @param {number} [_ignoredTtl] Mantido para compatibilidade
   * @returns {object|null} Grupos de resultados da pesquisa ou null
   */
  getSearch(query, overrideUserId, _ignoredTtl) {
    const uid = getActiveUserId(overrideUserId);
    const q = this.normalizeQuery(query);
    if (!uid || !q) return null;

    const store = readJson(keyForSearch(uid), { queries: {}, order: [] });
    const entry = store.queries?.[q];
    if (!entry || !entry.results) {
      return null;
    }

    return entry.results;
  },

  /**
   * Salva resultados de pesquisa somente se houver alteração real nos dados.
   * Não trata uma consulta repetida como alteração de conteúdo se os resultados forem idênticos.
   * @param {string} query
   * @param {object} results Grupos de resultados agregados
   * @param {string} [overrideUserId]
   * @returns {boolean} true se gravado; false se idêntico
   */
  setSearch(query, results, overrideUserId) {
    const uid = getActiveUserId(overrideUserId);
    const q = this.normalizeQuery(query);
    if (!uid || !q || !results) return false;

    const store = readJson(keyForSearch(uid), { queries: {}, order: [] });
    const queries = store.queries || {};
    const existingEntry = queries[q];

    // Se a pesquisa já existe e os resultados são idênticos, NÃO regravar no storage
    if (existingEntry && existingEntry.results && isContentEqual(existingEntry.results, results)) {
      return false;
    }

    let order = Array.isArray(store.order) ? store.order.filter(term => term !== q) : [];
    order.unshift(q);
    queries[q] = {
      savedAt: Date.now(),
      results,
    };

    return writeJson(keyForSearch(uid), { queries, order });
  },

  /**
   * Limpa todas as pesquisas em cache do usuário ativo.
   */
  clearSearch(overrideUserId) {
    const uid = getActiveUserId(overrideUserId);
    if (!uid) return;
    try {
      safeStorage.removeItem(keyForSearch(uid));
    } catch {}
  },

  /* ========================================================================= */
  /* 3. HISTÓRICO DE REPRODUÇÃO (Persistente entre sessões, sem expiração)     */
  /* ========================================================================= */

  /**
   * Recupera o histórico de reprodução do usuário ativo.
   * Não aplica expiração automática.
   * @param {string} [overrideUserId]
   * @returns {Array} Lista de faixas efetivamente reproduzidas
   */
  getHistory(overrideUserId) {
    const uid = getActiveUserId(overrideUserId);
    if (!uid) return [];

    const items = readJson(keyForHistory(uid), []);
    return Array.isArray(items) ? items : [];
  },

  /**
   * Registra uma música efetivamente reproduzida no histórico persistente do usuário.
   * Não regravar se a faixa já for a mais recente no topo do histórico com dados idênticos.
   * @param {object} track
   * @param {string} [overrideUserId]
   */
  addHistory(track, overrideUserId) {
    const uid = getActiveUserId(overrideUserId);
    if (!uid || !track) return [];

    const trackId = track.videoId || track.id;
    if (!trackId) return this.getHistory(uid);

    const currentHistory = this.getHistory(uid);

    // Evita regravação inútil se a faixa atual já for o item mais recente no topo do histórico
    if (currentHistory.length > 0) {
      const top = currentHistory[0];
      const topId = top.videoId || top.id;
      if (topId === trackId && top.title === track.title && top.artist === (track.artist || track.channelTitle)) {
        return currentHistory;
      }
    }

    // Remove ocorrências anteriores da mesma música para colocá-la no topo (ordem mais recente)
    const filtered = currentHistory.filter(item => (item.videoId || item.id) !== trackId);

    const entry = {
      videoId: track.videoId || track.id,
      id: track.id || track.videoId,
      title: track.title || 'Música sem título',
      artist: track.artist || track.channelTitle || 'Artista desconhecido',
      thumbnail: track.thumbnail || '',
      durationStr: track.durationStr || '',
      duration: track.duration || 0,
      playedAt: Date.now(),
    };

    filtered.unshift(entry);
    writeJson(keyForHistory(uid), filtered);
    return filtered;
  },

  /**
   * Remove uma faixa específica do histórico do usuário.
   * Não regravar se a faixa não estiver no histórico.
   * @param {string} trackId
   * @param {string} [overrideUserId]
   */
  removeHistory(trackId, overrideUserId) {
    const uid = getActiveUserId(overrideUserId);
    if (!uid || !trackId) return [];

    const currentHistory = this.getHistory(uid);
    const hasItem = currentHistory.some(item => (item.videoId || item.id) === trackId);
    if (!hasItem) {
      return currentHistory;
    }

    const updated = currentHistory.filter(item => (item.videoId || item.id) !== trackId);
    writeJson(keyForHistory(uid), updated);
    return updated;
  },

  /**
   * Limpa integralmente o histórico de reprodução do usuário por ação explícita.
   * Não regravar se já estiver vazio.
   * @param {string} [overrideUserId]
   */
  clearHistory(overrideUserId) {
    const uid = getActiveUserId(overrideUserId);
    if (!uid) return [];

    const currentHistory = this.getHistory(uid);
    if (currentHistory.length === 0) {
      return [];
    }

    writeJson(keyForHistory(uid), []);
    return [];
  },

  /* ========================================================================= */
  /* MANUTENÇÃO GERAL DO CACHE                                                 */
  /* ========================================================================= */

  /**
   * Limpa todos os dados locais de cache pertencentes ao usuário ativo.
   */
  clearAll(overrideUserId) {
    const uid = getActiveUserId(overrideUserId);
    if (!uid) return;
    this.clearHome(uid);
    this.clearSearch(uid);
    this.clearHistory(uid);
  }
};

export default Cache_Biblioteca;
