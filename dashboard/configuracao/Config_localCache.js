// Config_localCache.js — Ponto de compatibilidade para o Gerenciador ÚNICO de Cache da Biblioteca Global.
// A autoridade de cache reside exclusivamente em /dashboard/biblioteca/Library_cache.js.

export {
  libraryCache,
  libraryCache as localCache,
  CACHE_NAMESPACES,
  CACHE_TTL_MS,
} from '../biblioteca/Library_cache.js';

