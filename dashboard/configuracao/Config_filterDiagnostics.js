// Diagnóstico de filtros PRÉ-TTS (produção + Lab). Contadores + eventos de bloqueio.
// Singleton de produção (filterDiag) + factory de collectors de Lab.
// Mesma lógica compartilhada — NÃO há pipeline paralelo, apenas alvo de gravação diferente.
// Local, diag-only. Não altera a fila real.
import { useEffect, useState } from 'react';

// Fonte de verdade ÚNICA dos motivos exibidos em Rel. Filtros e usados pelos collectors.
// (A) = bloqueio da mensagem recebida; (B) = contador operacional de mensagens antigas removidas da fila.
export const REASONS = [
  // (A) Bloqueio da mensagem recebida — filterEngine
  'BLOCKED_TRIGGER', 'BLOCKED_REPEAT', 'BLOCKED_COOLDOWN', 'BLOCKED_ROLE',
  'BLOCKED_LINK', 'BLOCKED_EMOTE', 'BLOCKED_LENGTH',
  // (A) Bloqueio da mensagem recebida — receive() pós-pipeline
  'ANTI_FLOOD_REPEAT', 'CHARACTER_LIMIT', 'INITIAL_BACKLOG',
  'USER_COOLDOWN', 'DUPLICATE', 'FLOOD', 'CONGESTION',
  // (A) Bloqueio da mensagem recebida — limite de fila (reject / preserve_priority negado)
  'BLOCKED_QUEUE_LIMIT',
  // (B) Contador operacional — mensagens antigas removidas da fila (drop_oldest / preserve_priority)
  'DROPPED_QUEUE_LIMIT',
];

function fresh() {
  return {
    received: 0, allowed: 0, blocked: 0, enqueued: 0,
    byReason: Object.fromEntries(REASONS.map(r => [r, 0])),
    byPlatform: { Twitch: { received: 0, allowed: 0, blocked: 0, enqueued: 0 }, Kick: { received: 0, allowed: 0, blocked: 0, enqueued: 0 } },
    events: [],
  };
}

// --- Singleton de produção ---
export const filterDiag = fresh();
export function resetFilterDiag() { Object.assign(filterDiag, fresh()); }

// --- Factory + reset de collectors de Lab (mesmo shape, estado isolado) ---
export function createFilterCollector() { return fresh(); }
export function resetFilterCollector(target) { Object.assign(target, fresh()); }

// --- Lógica compartilhada (ÚNICA implementação — production e Lab usam as mesmas funções) ---
function _recordFilter(target, { messageId, platform, author, decision, reason, trigger }) {
  target.received++;
  const pp = target.byPlatform[platform];
  if (pp) pp.received++;
  if (decision === 'ALLOWED') { target.allowed++; if (pp) pp.allowed++; }
  else { target.blocked++; if (pp) pp.blocked++; if (reason && target.byReason[reason] != null) target.byReason[reason]++; }
  target.events.unshift({ ts: new Date().toISOString(), messageId, platform, author, decision, reason: reason || null, trigger: trigger || null });
  if (target.events.length > 200) target.events.length = 200;
}
function _recordEnqueued(target, platform) {
  target.enqueued++;
  const pp = target.byPlatform[platform];
  if (pp) pp.enqueued++;
}
function _recordDropped(target, count) {
  target.byReason.DROPPED_QUEUE_LIMIT += count;
}

// --- API de produção (delegam para o singleton filterDiag) ---
export function recordFilter(args) { _recordFilter(filterDiag, args); }
export function recordEnqueued(platform) { _recordEnqueued(filterDiag, platform); }
export function recordDropped(count) { _recordDropped(filterDiag, count); }

// --- API de Lab (mesma lógica, alvo explícito — NÃO é uma implementação divergente) ---
export function recordFilterInto(target, args) { _recordFilter(target, args); }
export function recordEnqueuedInto(target, platform) { _recordEnqueued(target, platform); }
export function recordDroppedInto(target, count) { _recordDropped(target, count); }

export const useFilterDiagTick = (ms = 1000) => {
  const [, setT] = useState(0);
  useEffect(() => { const i = setInterval(() => setT(v => v + 1), ms); return () => clearInterval(i); }, [ms]);
  return filterDiag;
};