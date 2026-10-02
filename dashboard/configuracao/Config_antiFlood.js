// B.4.3 — Anti-flood de repeticao CONSECUTIVA por usuario.
// Estado local, singleton, zero custos externos.
//
// Rastreia a ultima mensagem normalizada de cada usuario. Se a proxima
// mensagem for igual, incrementa repeatCount. Se exceder o limite, bloqueia.
// Se a mensagem mudar, reinicia a sequencia (repeatCount=1).
//
// Sem ban, sem timeout, sem punicao temporal — apenas anti-repeticao consecutiva.
//
// Estado limitado: eviccao por tempo (10 min sem atividade) e por quantidade (max 5000).

const MAX_USERS = 5000;
const EVICT_AFTER_MS = 10 * 60 * 1000; // 10 minutos

// Map: userKey -> { lastNormalizedText, repeatCount, lastSeenAt }
const state = new Map();

function evictStale(now) {
  for (const [k, e] of state) {
    if (now - e.lastSeenAt > EVICT_AFTER_MS) state.delete(k);
  }
}

function evictOldestHalf() {
  const entries = [...state.entries()].sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt);
  for (let i = 0; i < Math.floor(entries.length / 2); i++) state.delete(entries[i][0]);
}

// checkAntiFlood(userKey, normalizedText, limit) -> boolean (true = permitido)
export function checkAntiFlood(userKey, normalizedText, limit) {
  const now = Date.now();
  // Eviccao preguicoso: so roda se o mapa estiver crescendo
  if (state.size > 100) evictStale(now);
  if (state.size > MAX_USERS) evictOldestHalf();

  const entry = state.get(userKey);
  if (!entry || entry.lastNormalizedText !== normalizedText) {
    // Usuario novo ou mensagem diferente: reinicia sequencia
    state.set(userKey, { lastNormalizedText: normalizedText, repeatCount: 1, lastSeenAt: now });
    return true;
  }
  // Mensagem igual: incrementa e verifica limite
  entry.repeatCount++;
  entry.lastSeenAt = now;
  return entry.repeatCount <= limit;
}

export function resetAntiFlood() {
  state.clear();
}

// Para diagnostico/lab: retorna tamanho do estado (nao expoe conteudo)
export function antiFloodStateSize() {
  return state.size;
}