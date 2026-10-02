// Matriz de permissões: (actionId, source) -> boolean.
// MVP 1: somente origens 'keyboard' e 'panel'. Todas as 3 actions permitidas para ambas.
// Qualquer source desconhecido -> FORBIDDEN.

export const SOURCES = ['keyboard', 'panel'];

const ALLOWED = {
  'tts.toggle': ['keyboard', 'panel'],
  'tts.clearQueue': ['keyboard', 'panel'],
  'tts.test': ['keyboard', 'panel'],
  'tts.skip': ['keyboard', 'panel'],
};

export function isAllowed(actionId, source) {
  if (!SOURCES.includes(source)) return false;
  const list = ALLOWED[actionId];
  return Array.isArray(list) && list.includes(source);
}