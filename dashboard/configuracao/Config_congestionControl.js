// Controle adaptativo de admissão PRÉ-FILA.
// NÃO fala mensagens. NÃO controla conexão.
// Recebe métricas (queueDelay) + metadados (roles) e retorna decisão de admissão.
//
// HISTERESE: upgrades exigem sustentação por MIN_STABLE_MS (3s). Downgrades são imediatos.
// Isso evita oscilação BUSY ↔ CONGESTED a cada pequena variação de atraso.
//
// Estados: NORMAL → BUSY → CONGESTED → CRITICAL
// Decisão baseada em queueDelay (atraso real da fila, não quantidade de mensagens).

const STATES = ['NORMAL', 'BUSY', 'CONGESTED', 'CRITICAL'];
const MIN_STABLE_MS = 3000;

const DEFAULT_THRESHOLDS = { busy: 15000, congested: 20000, critical: 60000 };

let currentState = 'NORMAL';
let candidateState = null;
let candidateSince = 0;

// FASE 3 (calibração): Histórico de estados de congestionamento.
// Acumula duração por estado quando ocorre mudança OU quando snapshot é solicitado.
// NENHUM timer por mensagem. Estado leve, singleton.
let stateHistory = {
  transitions: 0,
  previousState: null,
  enteredAt: Date.now(),
  totalTime: { NORMAL: 0, BUSY: 0, CONGESTED: 0, CRITICAL: 0 },
};

function recordStateChange(from, to) {
  const now = Date.now();
  if (stateHistory.enteredAt) {
    stateHistory.totalTime[from] = (stateHistory.totalTime[from] || 0) + (now - stateHistory.enteredAt);
  }
  stateHistory.previousState = from;
  stateHistory.enteredAt = now;
  stateHistory.transitions++;
}

function setState(newState) {
  if (currentState !== newState) {
    recordStateChange(currentState, newState);
    currentState = newState;
  }
}

export function getCongestionState() { return currentState; }

export function getCongestionHistory() {
  const now = Date.now();
  const totalTime = { ...stateHistory.totalTime };
  totalTime[currentState] = (totalTime[currentState] || 0) + (now - stateHistory.enteredAt);
  return {
    currentState,
    previousState: stateHistory.previousState,
    transitions: stateHistory.transitions,
    enteredAt: stateHistory.enteredAt,
    totalTime,
  };
}

export function resetCongestion() {
  currentState = 'NORMAL';
  candidateState = null;
  candidateSince = 0;
  stateHistory = {
    transitions: 0,
    previousState: null,
    enteredAt: Date.now(),
    totalTime: { NORMAL: 0, BUSY: 0, CONGESTED: 0, CRITICAL: 0 },
  };
}

function getThresholds(config) {
  return {
    busy: config?.busyThreshold ?? DEFAULT_THRESHOLDS.busy,
    congested: config?.congestedThreshold ?? DEFAULT_THRESHOLDS.congested,
    critical: config?.criticalThreshold ?? DEFAULT_THRESHOLDS.critical,
  };
}

function classifyState(queueDelayMs, thresholds) {
  if (queueDelayMs >= thresholds.critical) return 'CRITICAL';
  if (queueDelayMs >= thresholds.congested) return 'CONGESTED';
  if (queueDelayMs >= thresholds.busy) return 'BUSY';
  return 'NORMAL';
}

// Atualiza o estado com histerese. Retorna estado atual.
//
// FASE 2 — RESET/DECAY:
// - Fila vazia (queueLength === 0) OU delay zero → NORMAL imediato.
//   Sem histerese, sem candidate. O estado nunca fica preso em
//   CONGESTED/CRITICAL quando não há backlog real.
// - Downgrade (alívio com backlog): imediato.
// - Upgrade (agravamento): exige que o estado-alvo seja sustentado por MIN_STABLE_MS.
//
// Regra final de histerese:
//   queueLength === 0 || queueDelayMs === 0  →  NORMAL (reset direto, sem candidate)
//   targetRank < currentRank (com backlog)  →  downgrade imediato
//   targetRank > currentRank (com backlog)  →  upgrade exige MIN_STABLE_MS estável
export function updateCongestionState(queueDelayMs, config, queueLength = 0) {
  // FASE 2: Fila vazia ou delay zero → NORMAL imediato.
  // Garante que o estado nunca fica preso em CONGESTED/CRITICAL sem backlog real.
  if (queueLength === 0 || queueDelayMs === 0) {
    setState('NORMAL');
    candidateState = null;
    candidateSince = 0;
    return currentState;
  }

  const thresholds = getThresholds(config);
  const target = classifyState(queueDelayMs, thresholds);
  if (target === currentState) {
    candidateState = null;
    return currentState;
  }
  const targetRank = STATES.indexOf(target);
  const currentRank = STATES.indexOf(currentState);
  if (targetRank < currentRank) {
    setState(target);
    candidateState = null;
    return currentState;
  }
  if (candidateState !== target) {
    candidateState = target;
    candidateSince = Date.now();
    return currentState;
  }
  if (Date.now() - candidateSince >= MIN_STABLE_MS) {
    setState(target);
    candidateState = null;
  }
  return currentState;
}

export function roleTier(roles) {
  if (!roles || roles.length === 0) return 'normal';
  if (roles.includes('broadcaster')) return 'broadcaster';
  if (roles.includes('moderator')) return 'moderator';
  if (roles.includes('vip')) return 'vip';
  if (roles.includes('subscriber')) return 'subscriber';
  return 'normal';
}

// Multiplicador de cooldown por estado.
// NORMAL=1x, BUSY=2x, CONGESTED=3x, CRITICAL=3x (comuns bloqueados pela matriz).
export function cooldownMultiplier(state) {
  switch (state) {
    case 'BUSY': return 2;
    case 'CONGESTED': return 3;
    case 'CRITICAL': return 3;
    default: return 1;
  }
}

// Matriz de admissão por estado + tier.
// broadcaster e moderator SEMPRE admitidos (nunça bloqueados por congestionamento).
// VIP e subscriber preservados em CONGESTED, cortados em CRITICAL.
// normal cortado em CONGESTED e CRITICAL.
const ADMISSION_MATRIX = {
  NORMAL:     { broadcaster: true, moderator: true, vip: true, subscriber: true, normal: true },
  BUSY:       { broadcaster: true, moderator: true, vip: true, subscriber: true, normal: true },
  CONGESTED:  { broadcaster: true, moderator: true, vip: true, subscriber: true, normal: false },
  CRITICAL:   { broadcaster: true, moderator: true, vip: false, subscriber: false, normal: false },
};

export function admitByRole(state, tier) {
  return ADMISSION_MATRIX[state]?.[tier] ?? false;
}