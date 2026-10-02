// Action Engine — núcleo de execução independente da origem do comando.
// Não importa React nem StreamingContext. Handlers são injetados via setHandlers().
//
// dispatch(actionId, { source, payload, context }) -> resultado padronizado:
//   { ok: true, actionId }
//   { ok: false, actionId, reason: 'NOT_FOUND' }
//   { ok: false, actionId, reason: 'FORBIDDEN' }
//   { ok: false, actionId, reason: 'NO_HANDLER' }
//   { ok: false, actionId, reason: 'ERROR', error }

import { getAction } from './Config_actionRegistry';
import { isAllowed } from './Config_permissionMatrix';

const handlers = {}; // actionId -> fn(payload, context)

export function setHandlers(map) {
  if (!map || typeof map !== 'object') return;
  for (const k of Object.keys(handlers)) delete handlers[k];
  for (const k of Object.keys(map)) {
    if (typeof map[k] === 'function') handlers[k] = map[k];
  }
}

export function clearHandlers() {
  for (const k of Object.keys(handlers)) delete handlers[k];
}

// Registro incremental (merge): adiciona/substitui somente os handlers informados,
// sem remover os demais. Permite múltiplos donos coexistirem (ex: CommandsSection
// para TTS + bridges dedicados para outros widgets) sem um limpar o outro.
export function registerHandlers(map) {
  if (!map || typeof map !== 'object') return;
  for (const k of Object.keys(map)) {
    if (typeof map[k] === 'function') handlers[k] = map[k];
  }
}

// Remove somente os handlers informados (não afeta os demais).
export function unregisterHandlers(ids) {
  if (!Array.isArray(ids)) return;
  for (const k of ids) delete handlers[k];
}

export function getHandler(actionId) {
  return handlers[actionId] || null;
}

/**
 * Despacha uma action a partir de uma origem.
 * @param {string} actionId - ID estável da action (ex: 'tts.toggle').
 * @param {{ source?: string, payload?: any, context?: any }} [opts]
 * @returns {{ ok: boolean, actionId: string, reason?: string, error?: any }}
 */
export function dispatch(actionId, opts = {}) {
  const { source, payload, context } = opts;
  const action = getAction(actionId);
  if (!action) return { ok: false, actionId, reason: 'NOT_FOUND' };
  if (!isAllowed(actionId, source)) return { ok: false, actionId, reason: 'FORBIDDEN' };
  const handler = handlers[actionId];
  if (typeof handler !== 'function') return { ok: false, actionId, reason: 'NO_HANDLER' };
  try {
    handler(payload, context);
    return { ok: true, actionId };
  } catch (error) {
    return { ok: false, actionId, reason: 'ERROR', error };
  }
}