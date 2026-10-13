import { metricasJohnson } from './cruds/metricas_johnson.js';

export function metricasRamal(action, userId, ...args) {
  if (typeof metricasJohnson[action] !== 'function') {
    throw new Error(`Ação ${action} não encontrada em metricasRamal.`);
  }
  return metricasJohnson[action](userId, ...args);
}
