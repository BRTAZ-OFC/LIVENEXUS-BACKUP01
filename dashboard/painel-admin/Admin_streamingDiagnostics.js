// Registro singleton de diagnóstico para o Laboratório (admin).
// APENAS leitura visual — não afeta lógica funcional, intervalos ou backoffs.
// Contadores/flags são best-effort, populados pelos módulos de chat e pelo StreamingContext.
import { useEffect, useState } from 'react';

const initial = {
  App: { activeSection: null, visibilityState: null, url: null, online: null },
  Kick: {
    socketsCreated: 0, socketsClosed: 0, metaTimersCreated: 0, metaTimersCleared: 0,
    socketActive: 0, pingTimerActive: 0, metaTimerActive: 0,
    connectedAt: null, disconnectedAt: null, disconnectReason: null,
    messagesReceived: 0, lastMessageAt: null,
    lastMetaStatus: null, lastCache: null, lastMetaAt: null, viewers: null, online: null,
    backoffIndex: 0, offlineStreak: 0, offlineEmitted: false, currentMetaDelay: null, nextMetaPollAt: null,
    reconnectSupported: false, recoveryStatus: null,
    lastError: null, lastErrorAt: null,
    rawEvents: [],
  },
  Twitch: {
    socketsCreated: 0, socketsClosed: 0, metaTimersCreated: 0, metaTimersCleared: 0,
    reconnectTimersCreated: 0, reconnectTimersCleared: 0,
    socketActive: 0, metaTimerActive: 0, reconnectTimerActive: 0,
    reconnectAttempts: 0, reconnectSuccessCount: 0, currentBackoff: null, reconnectScheduled: false,
    connectedAt: null, disconnectedAt: null, disconnectReason: null,
    messagesReceived: 0, lastMessageAt: null,
    lastMetaStatus: null, lastCache: null, lastMetaAt: null, viewers: null, online: null,
    backoffIndex: 0, offlineStreak: 0, offlineEmitted: false, currentMetaDelay: null, nextMetaPollAt: null,
    lastError: null, lastErrorAt: null,
  },
  TTS: {
    queueInstancesCreated: 0,
    enqueued: 0, speechStarts: 0, spoken: 0, skipped: 0, canceled: 0, errors: 0,
    prodEnqueued: 0, prodSpeechStarts: 0, prodSpoken: 0, prodErrors: 0,
    manualEnqueued: 0, manualSpeechStarts: 0, manualSpoken: 0, manualErrors: 0,
    queueLength: 0, speaking: false, pending: 0,
    currentMessage: null, currentAuthor: null, currentPlatform: null,
    selectedVoice: null, rate: null, pitch: null, volume: null, delay: null, maxChars: null,
    lastSpoken: null, lastSpeechStartAt: null, lastSpeechEndAt: null,
    lastTtsError: null, lastErrorCode: null, lastErrorEvent: null, lastErrorAt: null,
    spokenHistory: [],
  },
  Errors: [],
};

export const diag = JSON.parse(JSON.stringify(initial));

// --- Classificação de erro por camada (A-L) ---
const LAYERS = {
  A: 'A — UI', B: 'B — StreamingProvider', C: 'C — módulo de plataforma',
  D: 'D — navegador/WebSocket', E: 'E — Worker Cloudflare', F: 'F — API upstream',
  G: 'G — CORS', H: 'H — cache', I: 'I — TTS', J: 'J — fila',
  K: 'K — autenticação', L: 'L — desconhecido',
};

export function classifyLayer({ platform, step, status, message }) {
  const m = String(message || '').toLowerCase();
  const s = String(step || '').toLowerCase();
  if (/cors|access-control-allow-origin|blocked by origin/i.test(m + s)) return LAYERS.G;
  if (/quota|ratelimit|rate limit|dailyLimit|userRateLimit|403|401|keyinvalid|badkey|forbidden/i.test(m)) return LAYERS.F;
  if (/worker|502|503|radiotweet\.workers|cloudflare/i.test(m + s)) return LAYERS.E;
  if (/websocket|wss|pusher|irc|socket|onclose|onerror/i.test(m + s)) return LAYERS.D;
  if (platform === 'TTS' || /speechsynthesis|utterance|voice|tts|fila|queue|enqueue/i.test(m + s)) {
    if (/fila|queue|enqueue/i.test(m + s)) return LAYERS.J;
    return LAYERS.I;
  }
  if (/cache|hit|miss/i.test(m + s)) return LAYERS.H;
  if (/auth|token|login|unauthorized/i.test(m + s)) return LAYERS.K;
  if (platform && step) return LAYERS.C;
  if (status >= 500) return LAYERS.E;
  if (status === 0) return LAYERS.D;
  return LAYERS.L;
}

// pushError({ platform, step, status, message, context }) -> classifica e empilha (cap 100)
export function pushError(e = {}) {
  const layer = classifyLayer(e);
  const entry = {
    layer, ts: new Date().toISOString(),
    platform: e.platform || null, step: e.step || null, status: e.status ?? null,
    message: e.message || null, context: e.context || null,
    cause: e.cause || probableCause(layer, e),
    source: e.source || null,
  };
  diag.Errors.unshift(entry);
  if (diag.Errors.length > 100) diag.Errors.length = 100;
  return entry;
}

// TEMPORARY: raw Kick event capture for diagnostic (no behavior change).
// Buffer em memória dos 10 últimos eventos brutos antes da classificação.
export function pushKickRawEvent(entry) {
  if (!diag.Kick.rawEvents) diag.Kick.rawEvents = [];
  diag.Kick.rawEvents.unshift(entry);
  if (diag.Kick.rawEvents.length > 10) diag.Kick.rawEvents.length = 10;
}

function probableCause(layer, e) {
  switch (layer) {
    case LAYERS.G: return 'Navegador bloqueou requisição cross-origin (CORS).';
    case LAYERS.F: return 'API upstream recusou (cota, chave, rate limit ou proibido).';
    case LAYERS.E: return 'Worker Cloudflare retornou erro ou indisponibilidade.';
    case LAYERS.D: return 'Falha de transporte WebSocket/IRC no navegador.';
    case LAYERS.I: return 'Falha no motor speechSynthesis do navegador.';
    case LAYERS.J: return 'Anomalia na fila de fala (duplicação/perda/ordem).';
    case LAYERS.H: return 'Comportamento anômalo de cache.';
    case LAYERS.K: return 'Falha de autenticação/token.';
    case LAYERS.C: return 'Erro interno do módulo de plataforma.';
    default: return 'Causa não determinada.';
  }
}

// --- Estado de app/UI ---
export function setAppSection(section) { diag.App.activeSection = section; }
export function setVisibility(v) { diag.App.visibilityState = v; }

// --- Snapshot/persistência ---
let persistenceSnapshot = null;
export const snapshotDiag = () => JSON.parse(JSON.stringify(diag));
export const startPersistenceTest = () => { persistenceSnapshot = snapshotDiag(); return persistenceSnapshot; };
export const getPersistenceSnapshot = () => persistenceSnapshot;
export const clearPersistenceSnapshot = () => { persistenceSnapshot = null; };

// --- Store de sessão do laboratório (resultados de testes, fora do diag de produção) ---
export const labStore = { workerResults: [], queueTest: null, multiTest: null, cacheTest: null, burstTest: null, ttsEvents: [], currentTestRunId: null };
export function addWorkerResult(r) { labStore.workerResults.unshift(r); if (labStore.workerResults.length > 60) labStore.workerResults.length = 60; }
export function setQueueTest(r) { labStore.queueTest = r; }
export function setMultiTest(r) { labStore.multiTest = r; }
export function setCacheTest(r) { labStore.cacheTest = r; }
export function setBurstTest(r) { labStore.burstTest = r; }

// --- Isolamento de execução de teste (testRunId) + eventos de ciclo de vida TTS ---
// diag-only: não altera comportamento da fila. Só registra quando um teste está ativo.
let _evtSeq = 0;
export function startTestRun() { const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random()); labStore.currentTestRunId = id; return id; }
export function endTestRun() { labStore.currentTestRunId = null; }
export function pushTtsEvent(ev) {
  ev.ts = ev.ts || new Date().toISOString();
  updateBacklog(ev); // always-on, diag-only: mede a fila REAL (mesmo sem teste ativo)
  if (!labStore.currentTestRunId) return;
  ev.testRunId = labStore.currentTestRunId;
  ev.seq = ++_evtSeq;
  labStore.ttsEvents.unshift(ev);
  if (labStore.ttsEvents.length > 2000) labStore.ttsEvents.length = 2000;
}
export function getTestRunEvents(testRunId) { return labStore.ttsEvents.filter(e => e.testRunId === testRunId); }

// --- Backlog/latência TTS (diag-only, always-on) ---
// Espelha a fila REAL do speechSynthesis para medir backlog/latência sem alterar a fila.
const _activeQueue = new Map();   // diagnosticMessageId -> enqueuedAtMs (mensagens na fila)
const _receivedTs = [];           // timestamps (ms) de RECEIVED — janela rolante 120s
const _spokenTs = [];             // timestamps (ms) de SPEECH_ENDED — janela rolante 120s
const _speechDurations = [];      // durações de fala (ms), cap 50
const _waits = [];                // totalLatencyMs (ended-received) de concluídas, cap 100
const _queueWaits = [];           // queueWaitMs (started-enqueued) de iniciadas, cap 100
const _lifecycle = new Map();     // diagnosticMessageId -> { receivedAt, enqueuedAt, speechStartedAt, speechEndedAt, platform }
let _peakQueue = 0;
let _canceled = 0;
let _ttsErrors = 0;
const HORIZON_MS = 120000;

function trimRolling() {
  const cutoff = Date.now() - HORIZON_MS;
  while (_receivedTs.length && _receivedTs[0] < cutoff) _receivedTs.shift();
  while (_spokenTs.length && _spokenTs[0] < cutoff) _spokenTs.shift();
}

function updateBacklog(ev) {
  const now = Date.now();
  const id = ev.diagnosticMessageId;
  if (ev.stage === 'RECEIVED') {
    _receivedTs.push(now);
    if (id) { const r = _lifecycle.get(id) || {}; r.receivedAt = ev.ts; r.platform = ev.platform; _lifecycle.set(id, r); if (_lifecycle.size > 500) _lifecycle.delete(_lifecycle.keys().next().value); }
  } else if (ev.stage === 'ENQUEUED') {
    _activeQueue.set(id, now);
    if (_activeQueue.size > _peakQueue) _peakQueue = _activeQueue.size;
    if (id) { const r = _lifecycle.get(id) || {}; r.enqueuedAt = ev.ts; _lifecycle.set(id, r); }
  } else if (ev.stage === 'SPEECH_STARTED') {
    if (id) {
      const r = _lifecycle.get(id) || {};
      r.speechStartedAt = ev.ts; _lifecycle.set(id, r);
      if (r.enqueuedAt) { const qw = Date.parse(r.speechStartedAt) - Date.parse(r.enqueuedAt); if (!isNaN(qw)) { _queueWaits.push(qw); if (_queueWaits.length > 100) _queueWaits.shift(); } }
    }
  } else if (ev.stage === 'SPEECH_ENDED') {
    _activeQueue.delete(id);
    _spokenTs.push(now);
    if (id) {
      const r = _lifecycle.get(id) || {};
      r.speechEndedAt = ev.ts; _lifecycle.set(id, r);
      if (r.speechStartedAt) { const d = Date.parse(r.speechEndedAt) - Date.parse(r.speechStartedAt); if (!isNaN(d)) { _speechDurations.push(d); if (_speechDurations.length > 50) _speechDurations.shift(); } }
      if (r.receivedAt) { const w = Date.parse(r.speechEndedAt) - Date.parse(r.receivedAt); if (!isNaN(w)) { _waits.push(w); if (_waits.length > 100) _waits.shift(); } }
    }
  } else if (ev.stage === 'SPEECH_ERROR') {
    _activeQueue.delete(id); _ttsErrors++;
  } else if (ev.stage === 'QUEUE_CANCELED') {
    _canceled += _activeQueue.size; _activeQueue.clear();
  }
  trimRolling();
}

export function resetBacklogQueue() { _canceled += _activeQueue.size; _activeQueue.clear(); }

export function getBacklogMetrics() {
  trimRolling();
  const now = Date.now();
  const queueLength = _activeQueue.size;
  let oldestAge = null, newestAge = null;
  if (queueLength > 0) {
    let mn = Infinity, mx = -Infinity;
    for (const t of _activeQueue.values()) { if (t < mn) mn = t; if (t > mx) mx = t; }
    oldestAge = now - mn; newestAge = now - mx;
  }
  const received60 = _receivedTs.filter(t => t > now - 60000).length;
  const spoken60 = _spokenTs.filter(t => t > now - 60000).length;
  const received30 = _receivedTs.filter(t => t > now - 30000).length;
  const spoken30 = _spokenTs.filter(t => t > now - 30000).length;
  const receiveRate = received30 >= 3 ? received30 * 2 : received60;     // msg/min
  const speechRate = spoken30 >= 3 ? spoken30 * 2 : spoken60;            // msg/min
  const queueGrowth = receiveRate - speechRate;
  const avgWait = _waits.length ? Math.round(_waits.reduce((a, b) => a + b, 0) / _waits.length) : null;
  const maxWait = _waits.length ? Math.max(..._waits) : null;
  const minWait = _waits.length ? Math.min(..._waits) : null;
  const avgQueueWait = _queueWaits.length ? Math.round(_queueWaits.reduce((a, b) => a + b, 0) / _queueWaits.length) : null;
  const maxQueueWait = _queueWaits.length ? Math.max(..._queueWaits) : null;
  const avgDur = _speechDurations.length ? Math.round(_speechDurations.reduce((a, b) => a + b, 0) / _speechDurations.length) : null;
  const lastDur = _speechDurations.length ? _speechDurations[_speechDurations.length - 1] : null;
  let estDrain = null;
  if (queueLength > 0 && speechRate > 0) estDrain = Math.round((queueLength / speechRate) * 60000);
  return {
    queueLength, peakQueueLength: _peakQueue, oldestQueuedMessageAgeMs: oldestAge, newestQueuedMessageAgeMs: newestAge,
    avgWaitMs: avgWait, maxWaitMs: maxWait, minWaitMs: minWait,
    avgQueueWaitMs: avgQueueWait, maxQueueWaitMs: maxQueueWait,
    avgSpeechDurationMs: avgDur, lastSpeechDurationMs: lastDur,
    messagesPerMinuteReceived: receiveRate, messagesPerMinuteSpoken: speechRate,
    receivedLast60s: received60, spokenLast60s: spoken60,
    queueGrowthPerMinute: queueGrowth, estimatedDrainTimeMs: estDrain,
    canceled: _canceled, ttsErrors: _ttsErrors,
  };
}

export function getBacklogByPlatform() {
  const byPlat = {};
  for (const p of ['Kick', 'Twitch']) byPlat[p] = { received: 0, enqueued: 0, spoken: 0, pending: 0, avgWaitMs: null, maxWaitMs: null, _w: [] };
  for (const r of _lifecycle.values()) {
    if (!r.platform || !byPlat[r.platform]) continue;
    const pp = byPlat[r.platform];
    if (r.receivedAt) pp.received++;
    if (r.enqueuedAt) pp.enqueued++;
    if (r.speechEndedAt) { pp.spoken++; if (r.receivedAt) { const w = Date.parse(r.speechEndedAt) - Date.parse(r.receivedAt); if (!isNaN(w)) pp._w.push(w); } }
  }
  for (const p of Object.keys(byPlat)) {
    const pp = byPlat[p];
    pp.pending = Math.max(0, pp.enqueued - pp.spoken);
    pp.avgWaitMs = pp._w.length ? Math.round(pp._w.reduce((a, b) => a + b, 0) / pp._w.length) : null;
    pp.maxWaitMs = pp._w.length ? Math.max(...pp._w) : null;
    delete pp._w;
  }
  return byPlat;
}

// Limites EXPLÍCITOS de classificação de backlog (mostrados no UI — não silenciosos).
export const BACKLOG_LIMITS = { delayThresholdMs: 10000, criticalGrowthPerMin: 5, growingGrowthPerMin: 0 };

export function classifyBacklog(m) {
  const L = BACKLOG_LIMITS;
  if (m.queueGrowthPerMinute >= L.criticalGrowthPerMin && m.queueLength > 0) return 'CRITICAL';
  if (m.queueGrowthPerMinute > L.growingGrowthPerMin && m.queueLength > 0) return 'GROWING';
  if (m.maxWaitMs != null && m.maxWaitMs > L.delayThresholdMs) return 'DELAYED';
  return 'HEALTHY';
}

export const resetDiag = () => {
  Object.assign(diag.Kick, initial.Kick);
  Object.assign(diag.Twitch, initial.Twitch);
  Object.assign(diag.TTS, initial.TTS);
  diag.Errors.length = 0;
  diag.App.activeSection = null; diag.App.visibilityState = null;
  persistenceSnapshot = null;
  labStore.workerResults = []; labStore.queueTest = null; labStore.multiTest = null; labStore.cacheTest = null; labStore.burstTest = null; labStore.ttsEvents = []; labStore.currentTestRunId = null;
  _activeQueue.clear(); _receivedTs.length = 0; _spokenTs.length = 0; _speechDurations.length = 0; _waits.length = 0; _queueWaits.length = 0; _lifecycle.clear(); _peakQueue = 0; _canceled = 0; _ttsErrors = 0;
};

// Hook: re-rendera o componente a cada `ms` para refletir o estado mutável do diag.
export const useDiagTick = (ms = 1000) => {
  const [, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT(v => v + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
  return diag;
};