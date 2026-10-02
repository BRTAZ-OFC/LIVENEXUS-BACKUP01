// Filtro de Leitura TTS — frontend only. LocalStorage. Zero backend/invoke/entities.
// Decide se uma mensagem/evento deve ser lido pelo TTS, remove emotes por plataforma,
// detecta flood e links em mensagens normais, e mantém um monitor local de usuários sinalizados.
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'livenexus:tts-reading-filter-v2';

export const DEFAULT_CONFIG = {
  roles: { normal: true, moderator: true, subscriber: true, broadcaster: true, vip: true },
  content: { messages: true, links: true, mentions: true, commands: false },
  emotes: { Twitch: true, YouTube: true, Kick: true },
  twitchEvents: { twitch_sub: true, twitch_resub: true, twitch_subgift: true, twitch_bits: true, twitch_raid: true },
  youtubeEvents: { youtube_membership: true, youtube_superchat: true, youtube_supersticker: true },
  bannedWords: [],
  // Anti-flood: quantas repetições iguais consecutivas são toleradas (0 = desativado)
  floodLimit: 3,
  // Intervalo por usuário
  userCooldownEnabled: false,
  userCooldownSec: 5,
  // Usuários sinalizados automaticamente (flood/links) + bloqueio manual
  flaggedUsers: {}, // { "platform:userId": { name, platform, userId, floodCount, linkCount, blocked } }
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const p = JSON.parse(raw);
    return {
      roles: { ...DEFAULT_CONFIG.roles, ...(p.roles || {}) },
      content: { ...DEFAULT_CONFIG.content, ...(p.content || {}) },
      emotes: { ...DEFAULT_CONFIG.emotes, ...(p.emotes || {}) },
      twitchEvents: { ...DEFAULT_CONFIG.twitchEvents, ...(p.twitchEvents || {}) },
      youtubeEvents: { ...DEFAULT_CONFIG.youtubeEvents, ...(p.youtubeEvents || {}) },
      bannedWords: Array.isArray(p.bannedWords) ? p.bannedWords.map(String).filter(Boolean) : [],
      floodLimit: Number.isFinite(p.floodLimit) ? p.floodLimit : DEFAULT_CONFIG.floodLimit,
      userCooldownEnabled: p.userCooldownEnabled === true,
      userCooldownSec: Number.isFinite(p.userCooldownSec) ? p.userCooldownSec : DEFAULT_CONFIG.userCooldownSec,
      flaggedUsers: (p.flaggedUsers && typeof p.flaggedUsers === 'object') ? p.flaggedUsers : {},
    };
  } catch { return { ...DEFAULT_CONFIG }; }
}

let _config = loadConfig();
const listeners = new Set();

export function getReadingFilterConfig() { return _config; }

export function setReadingFilterConfig(next) {
  _config = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  listeners.forEach(l => l());
}

export function subscribeReadingFilter(cb) { listeners.add(cb); return () => listeners.delete(cb); }

export function useReadingFilterConfig() {
  return useSyncExternalStore(subscribeReadingFilter, getReadingFilterConfig);
}

// --- Estado runtime local (NÃO persistido) para anti-flood e intervalo ---
// lastMsg: { "platform:userId": { text, count, lastAt } }
const _lastMsg = new Map();
// lastSpoke: { "platform:userId": timestampMs }
const _lastSpoke = new Map();

function userKey(platform, authorId, author) {
  const id = authorId || author || '';
  return `${platform || ''}:${id}`;
}

function normalizeForFlood(text) {
  return String(text || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// --- Emote detection ---

function parseTwitchEmoteRanges(tag) {
  if (!tag || typeof tag !== 'string') return [];
  const ranges = [];
  for (const group of tag.split('/')) {
    const [, positions] = group.split(':');
    if (!positions) continue;
    for (const pos of positions.split(',')) {
      const [s, e] = pos.split('-');
      const start = parseInt(s, 10), end = parseInt(e, 10);
      if (Number.isFinite(start) && Number.isFinite(end)) ranges.push({ start, end });
    }
  }
  return ranges.sort((a, b) => a.start - b.start);
}

function parseKickEmoteRanges(emotes) {
  if (!Array.isArray(emotes)) return [];
  const ranges = [];
  for (const e of emotes) {
    if (!e) continue;
    if (Array.isArray(e.positions)) {
      for (const p of e.positions) {
        if (Number.isFinite(p?.start) && Number.isFinite(p?.end)) ranges.push({ start: p.start, end: p.end });
      }
    } else if (Number.isFinite(e.start) && Number.isFinite(e.end)) {
      ranges.push({ start: e.start, end: e.end });
    }
  }
  return ranges.sort((a, b) => a.start - b.start);
}

const YT_EMOJI_RE = /:[a-zA-Z0-9_]+:/g;
const KICK_TAG_RE = /\[emote:\d+:[^\]]+\]/g;
const LINK_RE = /https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.(?:com|net|org|tv|gg|io|dev|me|xyz|br|co)(?:\/[^\s]*)?/i;
const MENTION_RE = /@[a-zA-Z0-9_.-]+/g;
const COMMAND_RE = /^!\s*[a-zA-Z]/;

function removeRanges(text, ranges) {
  if (!ranges.length) return text;
  let result = '', last = 0;
  for (const r of ranges) {
    if (r.start < last) continue;
    result += text.slice(last, r.start);
    last = r.end + 1;
  }
  result += text.slice(last);
  return result.replace(/\s+/g, ' ').trim();
}

function containsBannedWord(text, words) {
  if (!words.length) return false;
  const lower = text.toLowerCase();
  for (const w of words) { if (w && lower.includes(w.toLowerCase())) return true; }
  return false;
}

function getRoleCategory(roles) {
  if (!Array.isArray(roles) || !roles.length) return 'normal';
  if (roles.includes('broadcaster')) return 'broadcaster';
  if (roles.includes('moderator')) return 'moderator';
  if (roles.includes('vip')) return 'vip';
  if (roles.includes('subscriber')) return 'subscriber';
  return 'normal';
}

// Atualiza o monitor de usuários sinalizados (flood/links). Persiste no config.
function _flagUser(config, key, name, platform, userId, field) {
  const existing = config.flaggedUsers[key];
  if (!existing) {
    config.flaggedUsers[key] = { name, platform, userId, floodCount: 0, linkCount: 0, blocked: false };
  }
  config.flaggedUsers[key][field]++;
  config.flaggedUsers[key].name = name || existing?.name || 'Anônimo';
}

// --- API pública para a UI: bloquear/desbloquear manualmente ---
export function toggleUserBlock(key) {
  const config = getReadingFilterConfig();
  if (!config.flaggedUsers[key]) return;
  setReadingFilterConfig({
    ...config,
    flaggedUsers: { ...config.flaggedUsers, [key]: { ...config.flaggedUsers[key], blocked: !config.flaggedUsers[key].blocked } },
  });
}

export function clearFlaggedUser(key) {
  const config = getReadingFilterConfig();
  if (!config.flaggedUsers[key]) return;
  const next = { ...config.flaggedUsers };
  delete next[key];
  setReadingFilterConfig({ ...config, flaggedUsers: next });
}

// --- Main filter: returns { allowed: boolean, text: string } ---
// item: { author, authorId, text, roles, eventType, emotes }
// platform: 'Twitch' | 'YouTube' | 'Kick'
export function applyReadingFilter(item, config, platform) {
  if (!config) return { allowed: true, text: item.text };
  const { author, authorId, text, roles, eventType, emotes } = item;
  const plat = platform || '';
  const uKey = userKey(plat, authorId, author);

  // 1. Usuário bloqueado manualmente (prioridade máxima)
  const flagged = config.flaggedUsers[uKey];
  if (flagged?.blocked) return { allowed: false };

  // 2. Papel permitido?
  const roleCat = getRoleCategory(roles);
  if (!config.roles[roleCat]) return { allowed: false };

  // 3. Evento permitido? (Twitch/YouTube) — eventos NÃO passam pelo detector de flood
  if (eventType) {
    if (eventType.startsWith('twitch_') && config.twitchEvents.hasOwnProperty(eventType)) {
      if (!config.twitchEvents[eventType]) return { allowed: false };
    } else if (eventType.startsWith('youtube_') && config.youtubeEvents.hasOwnProperty(eventType)) {
      if (!config.youtubeEvents[eventType]) return { allowed: false };
    }
    // Eventos pulam flood/links/intervalo — seguem somente seu filtro próprio
    return { allowed: true, text: String(text || '') };
  }

  // 4. Mensagem normal — tipo de conteúdo
  let t = String(text || '');
  if (!config.content.messages) return { allowed: false };
  if (COMMAND_RE.test(t.trim()) && !config.content.commands) return { allowed: false };
  if (LINK_RE.test(t) && !config.content.links) return { allowed: false };
  if (MENTION_RE.test(t) && !config.content.mentions) {
    t = t.replace(MENTION_RE, '').replace(/\s+/g, ' ').trim();
    if (!t) return { allowed: false };
  }

  // 5. Emotes (por plataforma)
  if (plat === 'Twitch' && !config.emotes.Twitch) {
    t = removeRanges(t, parseTwitchEmoteRanges(typeof emotes === 'string' ? emotes : null));
  } else if (plat === 'Kick' && !config.emotes.Kick) {
    t = removeRanges(t, parseKickEmoteRanges(Array.isArray(emotes) ? emotes : null));
    t = t.replace(KICK_TAG_RE, '').replace(/\s+/g, ' ').trim();
  } else if (plat === 'YouTube' && !config.emotes.YouTube) {
    t = t.replace(YT_EMOJI_RE, '').replace(/\s+/g, ' ').trim();
  }
  if (!t.trim()) return { allowed: false };

  // 6. Palavra proibida
  if (containsBannedWord(t, config.bannedWords)) return { allowed: false };

  // 7. Anti-flood (somente mensagens normais elegíveis)
  const limit = Number(config.floodLimit) || 0;
  if (limit > 0) {
    const norm = normalizeForFlood(t);
    const prev = _lastMsg.get(uKey);
    const now = Date.now();
    if (prev && prev.text === norm) {
      prev.count++;
      prev.lastAt = now;
      if (prev.count > limit) {
        // Repetição excedeu limite — suprime do TTS, sinaliza flood
        _flagUser(config, uKey, author, plat, authorId || null, 'floodCount');
        _config = { ...config, flaggedUsers: { ...config.flaggedUsers } };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_config)); } catch {}
        listeners.forEach(l => l());
        return { allowed: false };
      }
    } else {
      _lastMsg.set(uKey, { text: norm, count: 1, lastAt: now });
    }
  }

  // 8. Intervalo por usuário (cooldown)
  if (config.userCooldownEnabled && config.userCooldownSec > 0) {
    const now = Date.now();
    const last = _lastSpoke.get(uKey) || 0;
    if (now - last < config.userCooldownSec * 1000) {
      return { allowed: false }; // dentro do cooldown — suprime sem bloquear permanentemente
    }
    _lastSpoke.set(uKey, now);
  }

  // 9. Detecção de link para o monitor (mesmo se links estão permitidos)
  if (LINK_RE.test(t)) {
    _flagUser(config, uKey, author, plat, authorId || null, 'linkCount');
    _config = { ...config, flaggedUsers: { ...config.flaggedUsers } };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_config)); } catch {}
    listeners.forEach(l => l());
  }

  return { allowed: true, text: t };
}