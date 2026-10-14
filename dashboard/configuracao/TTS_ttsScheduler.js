// Managed Priority Scheduler — FASE 2B.
//
// Substitui o espelho FIFO (utterances.current) por uma fila real controlada.
// O browser recebe no MÁXIMO 1 utterance por vez. As demais aguardam na managedQueue.
//
// Estrutura: 4 filas por prioridade (P1-P4). P0 reservado para eventos futuros.
//
// Algoritmo de seleção:
//   1. Expiry: remove mensagens expiradas (TTL por classe).
//   2. Aging: P4 com idade > AGING_THRESHOLD recebe boost (selecionado antes de P3).
//   3. Fairness: a cada FAIRNESS_INTERVAL seleções, se P4 não-vazia, reservar 1 slot.
//   4. Priority: selecionar da fila de maior prioridade não-vazia (P1 > P2 > P3 > P4).
//
// Proteções:
//   - Geração/token: callbacks de utterances de gerações anteriores não ressuscitam a fila.
//   - Cap global: 200 mensagens. Se excedido, descarta P4 antigas, depois P3.
//   - Sem sort global. Sem timer por mensagem. Sem watchdog arbitrário.
//   - Pause: dispatcher não despacha nova utterance enquanto pausado.
//
const getSpeechSynthesis = () => {
  if (typeof window === 'undefined') return null;
  if (!('speechSynthesis' in window)) return null;
  return window.speechSynthesis;
};
// 
// --- Constantes (defaults internos — FASE 2B) ---
const FAIRNESS_INTERVAL = 5;
const AGING_THRESHOLD_MS = 20 * 1000;       // P4 com 20s+ recebe boost (antes do TTL de 30s)
const TTL_MS = {
  P1: 120 * 1000,   // broadcaster
  P2: 90 * 1000,    // moderator
  P3: 45 * 1000,    // vip/subscriber
  P4: 30 * 1000,    // normal
};
const CAP_GLOBAL = 200;

// --- Estado do scheduler (singleton module) ---
const queues = { P1: [], P2: [], P3: [], P4: [] };
const QUEUE_ORDER = ['P1', 'P2', 'P3', 'P4'];

let activeUtterance = null;     // utterance atualmente no browser (0 ou 1)
let activeGen = 0;              // geração atual (incrementada em clear/reset)
let selectionCounter = 0;       // contador de seleções para fairness
let isPaused = false;
let _getDelay = null;           // () => number (seconds) — delay dinâmico lido no dispatch
let pendingDispatchTimer = null; // único timer de delay entre utterances (FASE 0)

// Telemetria do scheduler
import { onTtsStart, onTtsEnd } from '../biblioteca/TTS_ttsMusicIntegration';

const stats = {
  totalEnqueued: 0,
  totalSelected: 0,
  totalExpired: 0,
  totalAged: 0,
  fairnessSelections: 0,
  capEvictions: 0,
  waitSums: { P1: 0, P2: 0, P3: 0, P4: 0 },
  waitCounts: { P1: 0, P2: 0, P3: 0, P4: 0 },
};

// --- Helpers ---
function tierToQueue(tier) {
  switch (tier) {
    case 'broadcaster': return 'P1';
    case 'moderator': return 'P2';
    case 'vip':
    case 'subscriber': return 'P3';
    default: return 'P4';
  }
}

function totalQueueSize() {
  return queues.P1.length + queues.P2.length + queues.P3.length + queues.P4.length;
}

function oldestQueuedAt() {
  let oldest = null;
  for (const q of QUEUE_ORDER) {
    for (const m of queues[q]) {
      if (oldest === null || m.queuedAt < oldest) oldest = m.queuedAt;
    }
  }
  return oldest;
}

// --- Expiry: remove mensagens expiradas de uma fila. Retorna count removido. ---
function expireQueue(queueName, now) {
  const ttl = TTL_MS[queueName];
  const q = queues[queueName];
  let removed = 0;
  for (let i = q.length - 1; i >= 0; i--) {
    if (now - q[i].queuedAt > ttl) {
      q.splice(i, 1);
      removed++;
      stats.totalExpired++;
    }
  }
  return removed;
}

// --- Cap global: se exceder, descarta P4 antigas, depois P3. Preserva P1/P2. ---
function enforceCap() {
  let total = totalQueueSize();
  if (total <= CAP_GLOBAL) return;
  // Descarta P4 mais antigas primeiro
  while (total > CAP_GLOBAL && queues.P4.length > 0) {
    queues.P4.shift();
    stats.capEvictions++;
    total--;
  }
  // Se ainda excede, descarta P3 mais antigas
  while (total > CAP_GLOBAL && queues.P3.length > 0) {
    queues.P3.shift();
    stats.capEvictions++;
    total--;
  }
  // P1/P2 sempre preservadas
}

// --- Enqueue: O(1). NÃO cria utterance. NÃO chama speechSynthesis.speak(). ---
export function enqueue(message) {
  const qName = tierToQueue(message.tier || 'normal');
  queues[qName].push({
    text: message.text,
    author: message.author,
    authorId: message.authorId || null,
    platform: message.platform,
    tier: message.tier || 'normal',
    priority: message.priority || 0,
    queuedAt: Date.now(),
    diagnosticMessageId: message.diagnosticMessageId || null,
    eventType: message.eventType || null,
    eventMeta: message.eventMeta || null,
  });
  stats.totalEnqueued++;
  enforceCap();
}

// --- selectNext: escolhe próxima mensagem. NÃO cria utterance. ---
// Aplica: expiry → aging (boost) → fairness → priority.
function selectNext(now) {
  // 1. Expiry em todas as filas
  for (const q of QUEUE_ORDER) expireQueue(q, now);

  // 2. Aging: verifica se P4 tem mensagem com idade > AGING_THRESHOLD
  let p4Aged = false;
  for (const m of queues.P4) {
    if (now - m.queuedAt > AGING_THRESHOLD_MS) { p4Aged = true; break; }
  }

  // 3. Fairness: a cada FAIRNESS_INTERVAL seleções, se P4 não-vazia, reservar slot
  selectionCounter++;
  const fairnessSlot = (selectionCounter % FAIRNESS_INTERVAL === 0) && queues.P4.length > 0;

  // 4. Seleção por prioridade com boost de aging
  // Ordem efetiva: P1 > P2 > P3 > (P4-aged) > P4-normal
  // Fairness slot: força P4 (após verificar aging/boost)
  if (fairnessSlot) {
    const m = queues.P4.shift();
    stats.fairnessSelections++;
    stats.totalSelected++;
    recordWait(m, now);
    return m;
  }

  // Priority: P1 > P2 > P3
  for (const q of ['P1', 'P2', 'P3']) {
    if (queues[q].length > 0) {
      const m = queues[q].shift();
      stats.totalSelected++;
      recordWait(m, now);
      return m;
    }
  }

  // P4 com aging boost (antes de P4 normal)
  if (p4Aged) {
    // Encontra a P4 mais velha acima do threshold
    let oldestIdx = -1, oldestTime = Infinity;
    for (let i = 0; i < queues.P4.length; i++) {
      if (now - queues.P4[i].queuedAt > AGING_THRESHOLD_MS && queues.P4[i].queuedAt < oldestTime) {
        oldestTime = queues.P4[i].queuedAt;
        oldestIdx = i;
      }
    }
    if (oldestIdx >= 0) {
      const m = queues.P4.splice(oldestIdx, 1)[0];
      stats.totalAged++;
      stats.totalSelected++;
      recordWait(m, now);
      return m;
    }
  }

  // P4 normal (sem aging)
  if (queues.P4.length > 0) {
    const m = queues.P4.shift();
    stats.totalSelected++;
    recordWait(m, now);
    return m;
  }

  return null; // fila vazia
}

function recordWait(m, now) {
  const cls = tierToQueue(m.tier);
  const wait = now - m.queuedAt;
  stats.waitSums[cls] += wait;
  stats.waitCounts[cls]++;
}

// --- Dispatcher: entrega UMA utterance ao browser. Único ponto de speechSynthesis.speak(). ---
// Requer callbacks externos: onCreateUtterance(message) -> SpeechSynthesisUtterance configurada.
let _createUtterance = null;   // (message) => SpeechSynthesisUtterance
let _onSpeechStart = null;     // (message) => void
let _onSpeechEnd = null;       // (message) => void
let _onSpeechError = null;    // (message, errorEvent) => void

export function configureScheduler({ createUtterance, onSpeechStart, onSpeechEnd, onSpeechError, getDelay }) {
  _createUtterance = createUtterance;
  _onSpeechStart = onSpeechStart;
  _onSpeechEnd = onSpeechEnd;
  _onSpeechError = onSpeechError;
  _getDelay = getDelay || null;
}

// FASE 0: Dispatcher com delay dinâmico. Um ÚNICO timer (pendingDispatchTimer)
// aplica o delay entre utterances. O valor é lido via _getDelay() no momento
// do dispatch — sempre o mais recente. A mensagem é selecionada APÓS o timer
// (não antes), para que mensagens de maior prioridade que cheguem durante o
// delay sejam priorizadas corretamente.
export function dispatch() {
  if (isPaused) return;
  if (activeUtterance !== null) return;
  if (pendingDispatchTimer !== null) return;
  //
  const synth = getSpeechSynthesis();

if (!synth) {
  return;
}

if (synth.speaking) return;
  //
  if (totalQueueSize() === 0) return;

  const delay = _getDelay ? Number(_getDelay()) || 0 : 0;
  if (delay > 0) {
    const gen = activeGen;
    pendingDispatchTimer = setTimeout(() => {
      pendingDispatchTimer = null;
      if (isPaused || gen !== activeGen) return;
      const msg = selectNext(Date.now());
      if (!msg) return;
      speakNow(msg, activeGen);
    }, delay * 1000);
    return;
  }

  const msg = selectNext(Date.now());
  if (!msg) return;
  speakNow(msg, activeGen);
}

function speakNow(msg, gen) {
  if (!_createUtterance) { console.error('[ttsScheduler] createUtterance not configured'); return; }
  const u = _createUtterance(msg);
  if (!u) return;

  u._schedulerGen = gen;
  u._schedulerMsg = msg;

  u.onstart = () => {
    if (u._schedulerGen !== activeGen) return;
    u._speechStartTime = Date.now(); // tempo real de início para estimativa de progresso
    try { onTtsStart(); } catch {}
    if (_onSpeechStart) _onSpeechStart(msg);
  };

  u.onend = () => {
    if (u._schedulerGen !== activeGen) {
      try { onTtsEnd(); } catch {}
      return;
    }
    if (u._skipped) {
      finalizeSkipped(u);
      return;
    }
    activeUtterance = null;
    if (_onSpeechEnd) _onSpeechEnd(msg);
    try { onTtsEnd(); } catch {}
    dispatch();
  };

  u.onerror = (ev) => {
    if (u._schedulerGen !== activeGen) {
      try { onTtsEnd(); } catch {}
      return;
    }
    if (u._skipped) {
      finalizeSkipped(u);
      return;
    }
    activeUtterance = null;
    if (_onSpeechError) _onSpeechError(msg, ev);
    try { onTtsEnd(); } catch {}
    dispatch();
  };

  activeUtterance = u;
  u._speechStartTime = Date.now(); // baseline antes do speak (onstart pode atrasar)
  try { onTtsStart(); } catch {}
  if (typeof u.speak === 'function') {
    u.speak();
  //
    } else {
  const synth = getSpeechSynthesis();
  if (synth) {
    synth.speak(u);
  }
}
  //
}

// --- Finalização idempotente de utterance pulada (FASE 2A robustez) ---
// ÚNICO ponto que limpa activeUtterance e despacha a próxima para o caminho de skip.
// Idempotente: se o callback do browser E o fallback ambos chamarem, só o primeiro executa.
//
// Guardas:
//   1. u._schedulerGen !== activeGen → clear()/reset() ocorreu; não ressuscita fila.
//   2. activeUtterance !== u → já finalizada (callback ou fallback) ou outra utterance ativa.
//
// Não marca spoken nem error (skip não é telemetria de fala completada).
// dispatch() respeita isPaused: se pausado, não inicia a próxima.
function finalizeSkipped(u) {
  if (!u) return false;
  if (u._schedulerGen !== activeGen) {
    try { onTtsEnd(); } catch {}
    return false; // clear/reset invalidou
  }
  if (activeUtterance !== u) return false;          // já finalizada ou substituída
  activeUtterance = null;
  try { onTtsEnd(); } catch {}
  dispatch();
  return true;
}

// --- Skip: cancela SOMENTE a fala atual, preserva a fila restante ---
// Autossuficiente: NÃO depende exclusivamente de onend/onerror do browser.
//
// Fluxo:
//   1. Marca activeUtterance._skipped = true (token de skip — afeta SÓ esta utterance).
//   2. Chama speechSynthesis.cancel() (cancela a fala no browser).
//   3. Agenda fallback setTimeout(0) para finalizeSkipped(u).
//
// Dois caminhos de finalização, ambos idempotentes via finalizeSkipped():
//   CAMINHO A (preferencial): browser dispara onend/onerror → handler vê _skipped → finalizeSkipped(u).
//   CAMINHO B (fallback): setTimeout(0) dispara → finalizeSkipped(u).
//   Se AMBOS ocorrerem, finalizeSkipped executa apenas UMA vez (guarda activeUtterance !== u).
//
// Por que setTimeout(0) e não microtask:
//   speechSynthesis.cancel() é síncrono, mas onend/onerror são macrotasks enfileirados pelo browser.
//   setTimeout(0) também é macrotask, mas enfileirado APÓS os eventos de cancelamento já na fila.
//   Assim, se o browser vai disparar onend, ele dispara ANTES do fallback → fallback é no-op.
//   Se o browser NÃO dispara, o fallback finaliza. Microtask rodaria antes do macrotask do browser,
//   podendo disparar dispatch() e speak(B) antes de o browser processar o cancel() — risco de
//   cancelar B. setTimeout(0) dá ao browser a chance de processar o cancel primeiro.
//
// Não incrementa activeGen (callbacks da próxima utterance permanecem válidos).
// finalizeSkipped verifica _schedulerGen !== activeGen: se clear() ocorrer antes do fallback,
// o fallback é no-op (não ressuscita fila). Ver K10.
// Não toca nas filas P1–P4, fairness, aging ou TTL.
export function skipCurrent() {
  if (activeUtterance === null) return { ok: false, reason: 'NO_ACTIVE_UTTERANCE' };
  if (activeUtterance._skipped) return { ok: false, reason: 'ALREADY_SKIPPING' };
  const u = activeUtterance;
  u._skipped = true;
  if (typeof u._cancel === 'function') {
    try { u._cancel(); } catch {}
  }
  //modificacao
  const synth = getSpeechSynthesis();
if (synth) {
  try { synth.cancel(); } catch {}
}
  // Fallback assíncrono mínimo: se o browser não entregar onend/onerror, finaliza mesmo assim.
  setTimeout(() => finalizeSkipped(u), 0);
  return { ok: true };
}

// --- Restart: cancela a utterance atual e re-enfileira o texto restante a partir
// do último boundary (onboundary). Usado para aplicar mudanças de rate/volume/pitch
// durante a fala — o browser não atualiza esses campos numa utterance em reprodução.
// Preserva a continuidade: recria a partir da última palavra falada (charIndex).
// Guarda _skipped evita reiniciar a mesma utterance duas vezes (arrasto rápido).
export function restartCurrent() {
  if (activeUtterance === null) return false;
  const u = activeUtterance;
  if (u._skipped) return false;
  const msg = u._schedulerMsg;
  if (!msg || !msg.text) return false;
  // Ponto atual da fala:
  //   1. onboundary charIndex (preciso, quando o browser/voz suporta).
  //   2. Estimativa temporal (fallback universal — browsers/vozes sem boundary).
  // Sem este fallback, _lastCharIndex permanece undefined e a fala reinicia do começo.
  let fromChar = 0;
  if (typeof u._lastCharIndex === 'number' && u._lastCharIndex > 0) {
    fromChar = u._lastCharIndex;
  } else if (typeof u._speechStartTime === 'number') {
    const elapsedMs = Date.now() - u._speechStartTime;
    if (elapsedMs > 0) {
      const rate = Number(u.rate) || 1;
      const charsPerSec = 15 * rate; // ~15 chars/seg a rate=1 (pt-BR)
      fromChar = Math.floor(charsPerSec * elapsedMs / 1000);
    }
  }
  fromChar = Math.max(0, Math.min(fromChar, msg.text.length));
  // Se não foi possível estimar progresso (fromChar=0), NÃO reiniciar —
  // deixa a fala atual terminar; novos settings aplicam à próxima mensagem.
  if (fromChar === 0) return false;
  const remaining = msg.text.slice(fromChar).trim();
  if (!remaining) return false;
  u._skipped = true;
  if (typeof u._cancel === 'function') {
    try { u._cancel(); } catch {}
  }
  // modificacao
  const synth = getSpeechSynthesis();
if (synth) {
  try { synth.cancel(); } catch {}
}
  // Re-enfileira o texto restante na FRENTE da mesma fila de prioridade para
  // preservar a continuidade (falado a seguir, antes de mensagens aguardando).
  queues[tierToQueue(msg.tier || 'normal')].unshift({
    text: remaining,
    author: msg.author,
    authorId: msg.authorId || null,
    platform: msg.platform,
    tier: msg.tier || 'normal',
    priority: msg.priority || 0,
    queuedAt: Date.now(),
    diagnosticMessageId: (msg.diagnosticMessageId || crypto.randomUUID()) + '-r',
    eventType: msg.eventType || null,
    eventMeta: msg.eventMeta || null,
  });
  stats.totalEnqueued++;
  // Fallback assíncrono: finaliza a utterance cancelada e despacha a próxima.
  setTimeout(() => finalizeSkipped(u), 0);
  return true;
}

// --- Pause/Resume ---
export function pause() {
  isPaused = true;
  if (pendingDispatchTimer) { clearTimeout(pendingDispatchTimer); pendingDispatchTimer = null; }
  if (activeUtterance && typeof activeUtterance._pause === 'function') {
    try { activeUtterance._pause(); } catch {}
  }
  //modifocacao
  const synth = getSpeechSynthesis();
if (synth?.speaking) {
  try { synth.pause(); } catch {}
}
  //Modifocacao
  try { onTtsEnd(); } catch {}
}
export function resume() {
  isPaused = false;
  if (activeUtterance && typeof activeUtterance._resume === 'function') {
    try { activeUtterance._resume(); } catch {}
    try { onTtsStart(); } catch {}
    // Modificacao
    } else {
  const synth = getSpeechSynthesis();
  if (synth?.paused) {
    try { synth.resume(); } catch {}
    try { onTtsStart(); } catch {}
  }
}
   // Modificacao
  if (activeUtterance === null) dispatch();
}
export function isSchedulerPaused() { return isPaused; }
export function hasActiveUtterance() { return activeUtterance !== null; }

// --- Clear: cancela browser + limpa managedQueue + incrementa geração ---
export function clear() {
  activeGen++; // invalida callbacks de utterances anteriores
  if (pendingDispatchTimer) { clearTimeout(pendingDispatchTimer); pendingDispatchTimer = null; }
  if (activeUtterance && typeof activeUtterance._cancel === 'function') {
    try { activeUtterance._cancel(); } catch {}
  }
  // modificacao
  const synth = getSpeechSynthesis();
if (synth) {
  try { synth.cancel(); } catch {}
}
  // modificacao
  activeUtterance = null;
  try { onTtsEnd(); } catch {}
  queues.P1.length = 0;
  queues.P2.length = 0;
  queues.P3.length = 0;
  queues.P4.length = 0;
  selectionCounter = 0;
}

// --- Reset completo (logout/disconnect) ---
export function reset() {
  clear();
  try { onTtsEnd(); } catch {}
  isPaused = false;
  stats.totalEnqueued = 0;
  stats.totalSelected = 0;
  stats.totalExpired = 0;
  stats.totalAged = 0;
  stats.fairnessSelections = 0;
  stats.capEvictions = 0;
  stats.waitSums = { P1: 0, P2: 0, P3: 0, P4: 0 };
  stats.waitCounts = { P1: 0, P2: 0, P3: 0, P4: 0 };
}

// --- Telemetria ---
export function getSchedulerStats() {
  const now = Date.now();
  const byQueue = {};
  let oldestAge = null;
  for (const q of QUEUE_ORDER) {
    byQueue[q] = { waiting: queues[q].length };
    if (queues[q].length > 0) {
      const oldest = Math.min(...queues[q].map(m => m.queuedAt));
      byQueue[q].oldestAgeMs = now - oldest;
      if (oldestAge === null || oldest < oldestAge) oldestAge = now - oldest;
    } else {
      byQueue[q].oldestAgeMs = null;
    }
  }
  const avgWait = {};
  for (const q of QUEUE_ORDER) {
    avgWait[q] = stats.waitCounts[q] > 0 ? Math.round(stats.waitSums[q] / stats.waitCounts[q]) : null;
  }
  return {
    totalQueue: totalQueueSize(),
    byQueue,
    activeUtterance: activeUtterance !== null,
    pendingDispatchTimer: pendingDispatchTimer !== null,
    oldestQueuedAgeMs: oldestAge,
    oldestQueuedAt: oldestQueuedAt(),
    totalEnqueued: stats.totalEnqueued,
    totalSelected: stats.totalSelected,
    totalExpired: stats.totalExpired,
    totalAged: stats.totalAged,
    fairnessSelections: stats.fairnessSelections,
    capEvictions: stats.capEvictions,
    avgWaitMs: avgWait,
    isPaused,
  };
}

// --- Para testes sintéticos: expor estado interno (NÃO usar em produção) ---
export function __test__getInternalState() {
  return {
    queues: { P1: [...queues.P1], P2: [...queues.P2], P3: [...queues.P3], P4: [...queues.P4] },
    activeUtterance: activeUtterance !== null,
    activeGen,
    selectionCounter,
    isPaused,
    pendingDispatchTimer: pendingDispatchTimer !== null,
  };
}