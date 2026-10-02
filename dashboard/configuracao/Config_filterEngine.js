// Pipeline de filtros PRÉ-TTS. Determinístico, local, zero créditos.
// Ordem (conforme especificado): NORMALIZAÇÃO → CARGOS → REPETIÇÃO → COOLDOWN →
// GATILHOS → LINK → EMOTE → TAMANHO → PRIORIDADE → (LIMITE FILA — decisão no caller).
// Mensagem rejeitada NÃO entra na fila TTS.

import { normalizeText } from './Config_filterConfig';

// Estado mutável do pipeline (repeat/cooldown). Singleton, local, por plataforma.
const state = {
  repeat: new Map(),   // `${platform}:${normText}` -> { count, firstTs }
  cooldown: new Map(), // `${platform}:${author}` -> lastTs
};

export function resetFilterState() { state.repeat.clear(); state.cooldown.clear(); }

const URL_TEST = /\bhttps?:\/\/\S+|www\.\S+/i;
const URL_REPLACE = /\bhttps?:\/\/\S+|www\.\S+/g;
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\uFE0F]/gu;

function matchTrigger(text, item) {
  const n = normalizeText(text);
  const v = normalizeText(item.value);
  if (!v) return false;
  switch (item.matchType) {
    case 'exact': { const words = n.split(/\s+/); return words.includes(v) || n === v; }
    case 'contains': return n.includes(v);
    case 'starts': return n.startsWith(v);
    case 'ends': return n.endsWith(v);
    case 'regex': { try { return new RegExp(v, 'i').test(n); } catch { return false; } }
    default: return false;
  }
}

function roleAllowed(userRoles, allowed) {
  if (allowed.all) return true;
  if (!userRoles || userRoles.length === 0) return !!allowed.normal;
  return userRoles.some(r => allowed[r]);
}

function priorityOf(userRoles, weights) {
  let p = weights.normal || 1;
  for (const r of userRoles || []) if ((weights[r] || 0) > p) p = weights[r];
  return p;
}

function block(reason, extra = {}) { return { decision: reason, text: null, priority: 0, ...extra }; }

// applyPipeline(message, rules, platform) -> { decision, text, priority, queueLimit?, trigger? }
// decision: 'ALLOWED' | 'BLOCKED_ROLE' | 'BLOCKED_REPEAT' | 'BLOCKED_COOLDOWN' |
//           'BLOCKED_TRIGGER' | 'BLOCKED_LINK' | 'BLOCKED_EMOTE' | 'BLOCKED_LENGTH'
// rules === null => MODO LIVRE (bypass total, preserva comportamento existente).
export function applyPipeline(message, rules, platform) {
  const { text, author, roles = [] } = message;
  if (!rules) return { decision: 'ALLOWED', text: String(text || ''), priority: 0 };
  let body = String(text || '');
  const now = Date.now();

  // 1. Permissões/cargos
  if (rules.roles?.enabled && !roleAllowed(roles, rules.roles.allowed)) return block('BLOCKED_ROLE');

  // 2. Anti-repetição
  if (rules.repeat?.enabled && rules.repeat.max > 0) {
    const key = `${platform}:${normalizeText(body)}`;
    const win = (rules.repeat.windowSec || 60) * 1000;
    const e = state.repeat.get(key);
    if (!e || now - e.firstTs > win) state.repeat.set(key, { count: 1, firstTs: now });
    else { e.count++; if (e.count > rules.repeat.max) return block('BLOCKED_REPEAT'); }
  }

  // 3. Cooldown por usuário
  if (rules.cooldown?.enabled && rules.cooldown.sec > 0) {
    const key = `${platform}:${author}`;
    const last = state.cooldown.get(key);
    if (last && now - last < rules.cooldown.sec * 1000) return block('BLOCKED_COOLDOWN');
    state.cooldown.set(key, now);
  }

  // 4. Gatilhos (palavras/padrões)
  if (rules.triggers?.enabled && rules.triggers.items?.length) {
    const hit = rules.triggers.items.find(it => matchTrigger(body, it));
    if (hit) return block('BLOCKED_TRIGGER', { trigger: { id: hit.id, value: hit.value, matchType: hit.matchType } });
  }

  // 5. Links
  if (rules.links?.enabled && rules.links.policy !== 'allow' && URL_TEST.test(body)) {
    if (rules.links.policy === 'block') return block('BLOCKED_LINK');
    if (rules.links.policy === 'remove') body = body.replace(URL_REPLACE, ' ').replace(/\s+/g, ' ').trim();
  }

  // 6. Emotes/emojis (unicode)
  if (rules.emotes?.enabled && rules.emotes.policy !== 'allow') {
    if (rules.emotes.policy === 'block_only') {
      if (!body.replace(EMOJI_RE, '').trim()) return block('BLOCKED_EMOTE');
    } else if (rules.emotes.policy === 'block_over') {
      if ((body.match(EMOJI_RE) || []).length > (rules.emotes.maxCount || 0)) return block('BLOCKED_EMOTE');
    } else if (rules.emotes.policy === 'remove') {
      body = body.replace(EMOJI_RE, '').replace(/\s+/g, ' ').trim();
    }
  }

  // 7. Tamanho
  if (rules.size?.enabled && rules.size.policy !== 'none') {
    const lim = rules.size.limit || 200;
    if (rules.size.policy === 'ignore_over' && body.length > lim) return block('BLOCKED_LENGTH');
    if (rules.size.policy === 'cut') body = body.slice(0, lim);
  }

  // 8. Prioridade (sem bloqueio; usada no limite da fila)
  let priority = 0;
  if (rules.priority?.enabled) priority = priorityOf(roles, rules.priority.weights);

  // 9. Limite da fila: apenas repassa a regra; a decisão de admissão é do caller
  //    (que conhece o tamanho real da fila e pode cancelar/dropar).
  return { decision: 'ALLOWED', text: body, priority, queueLimit: rules.queueLimit?.enabled ? rules.queueLimit : null };
}

// Teste de gatilho isolado (Laboratório). Sem estado. Retorna { match, trigger, matched }.
export function testTrigger(text, item) {
  const n = normalizeText(text);
  const v = normalizeText(item.value);
  if (!v) return { match: false, trigger: item, matched: null };
  let matched = null;
  switch (item.matchType) {
    case 'exact': { const w = n.split(/\s+/); matched = w.includes(v) ? v : (n === v ? v : null); break; }
    case 'contains': matched = n.includes(v) ? v : null; break;
    case 'starts': matched = n.startsWith(v) ? v : null; break;
    case 'ends': matched = n.endsWith(v) ? v : null; break;
    case 'regex': { try { const m = new RegExp(v, 'i').exec(n); matched = m ? m[0] : null; } catch { matched = null; } break; }
    default: matched = null;
  }
  return { match: !!matched, trigger: item, matched };
}