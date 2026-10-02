// Anti-spam PRÉ-FILA: cooldown por usuário + deduplicação temporal + flood simples.
// Estado em Maps com evicção. NENHUM timer por usuário/mensagem.
// Determinístico, local, zero créditos.
//
// checkCooldown -> true = permitido (fora do cooldown)
// checkDedup    -> true = permitido (não é duplicata recente)
// checkFlood    -> true = mensagem válida (não é flood)

const MAX_COOLDOWN_ENTRIES = 5000;
const EVICT_COOLDOWN_AFTER_MS = 10 * 60 * 1000;
const MAX_DEDUP_ENTRIES = 3000;

const cooldownMap = new Map();  // `${platform}:${userId}` -> lastTs
const dedupMap = new Map();     // normalizedText -> lastTs

function userKey(platform, authorId, author) {
  const id = (authorId || author || 'unknown').toLowerCase();
  return `${platform}:${id}`;
}

function normalizeText(s) {
  return String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function evictCooldown(now) {
  for (const [k, t] of cooldownMap) {
    if (now - t > EVICT_COOLDOWN_AFTER_MS) cooldownMap.delete(k);
  }
  if (cooldownMap.size > MAX_COOLDOWN_ENTRIES) {
    const entries = [...cooldownMap.entries()].sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < Math.floor(entries.length / 2); i++) cooldownMap.delete(entries[i][0]);
  }
}

function evictDedup(now, windowMs) {
  const cutoff = now - Math.max(windowMs, 1000);
  for (const [k, t] of dedupMap) {
    if (t < cutoff) dedupMap.delete(k);
  }
  if (dedupMap.size > MAX_DEDUP_ENTRIES) {
    const entries = [...dedupMap.entries()].sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < Math.floor(entries.length / 2); i++) dedupMap.delete(entries[i][0]);
  }
}

export function checkCooldown(platform, authorId, author, cooldownMs, now = Date.now()) {
  if (!cooldownMs || cooldownMs <= 0) return true;
  if (cooldownMap.size > 200) evictCooldown(now);
  const key = userKey(platform, authorId, author);
  const last = cooldownMap.get(key);
  if (last && now - last < cooldownMs) return false;
  cooldownMap.set(key, now);
  return true;
}

export function checkDedup(text, windowMs, now = Date.now()) {
  if (!windowMs || windowMs <= 0) return true;
  if (dedupMap.size > 200) evictDedup(now, windowMs);
  const norm = normalizeText(text);
  if (!norm) return true;
  const last = dedupMap.get(norm);
  if (last && now - last < windowMs) {
    dedupMap.set(norm, now);
    return false;
  }
  dedupMap.set(norm, now);
  return true;
}

export function checkFlood(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  // Caractere único repetido excessivamente (10+ vezes)
  if (t.length >= 10) {
    const first = t[0];
    let allSame = true;
    for (let i = 1; i < t.length; i++) { if (t[i] !== first) { allSame = false; break; } }
    if (allSame) return false;
  }
  return true;
}

export function resetAntiSpam() {
  cooldownMap.clear();
  dedupMap.clear();
}

export function antiSpamStateSize() {
  return { cooldown: cooldownMap.size, dedup: dedupMap.size };
}