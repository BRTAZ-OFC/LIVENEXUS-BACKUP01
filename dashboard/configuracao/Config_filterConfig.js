// Modelos de configuração de filtros PRÉ-TTS. Determinístico, local, zero créditos.
// NENHUMA restrição é imposta automaticamente. O padrão é MODO LIVRE.

// Filter config module

export const MATCH_TYPES = [
  { id: 'exact', label: 'Palavra exata' },
  { id: 'contains', label: 'Contém' },
  { id: 'starts', label: 'Começa com' },
  { id: 'ends', label: 'Termina com' },
  { id: 'regex', label: 'Padrão (regex)' },
];

export const LINK_POLICIES = [
  { id: 'allow', label: 'Permitir' },
  { id: 'block', label: 'Bloquear mensagem inteira' },
  { id: 'remove', label: 'Remover link e falar o restante' },
];

export const EMOTE_POLICIES = [
  { id: 'allow', label: 'Permitir normalmente' },
  { id: 'remove', label: 'Remover antes da fala' },
  { id: 'block_only', label: 'Bloquear só de emotes/emojis' },
  { id: 'block_over', label: 'Bloquear acima de N' },
];

export const SIZE_POLICIES = [
  { id: 'none', label: 'Sem limite adicional' },
  { id: 'ignore_over', label: 'Ignorar acima de X' },
  { id: 'cut', label: 'Cortar em X' },
];

export const QUEUE_POLICIES = [
  { id: 'reject', label: 'Rejeitar novas' },
  { id: 'drop_oldest', label: 'Remover mais antiga' },
  { id: 'preserve_priority', label: 'Preservar prioritárias' },
];

// Cargos realmente disponíveis por plataforma (dados que efetivamente chegam no chat).
// "Seguidores" (follower) NÃO está disponível em nenhuma plataforma via chat.
export const ROLE_AVAILABILITY = {
  Twitch: ['broadcaster', 'moderator', 'vip', 'subscriber', 'normal'],
  Kick: ['broadcaster', 'moderator', 'vip', 'subscriber', 'normal'],
  YouTube: ['broadcaster', 'moderator', 'subscriber', 'normal'],
};

export const ROLE_LABELS = {
  all: 'Todos',
  broadcaster: 'Proprietário/Broadcaster',
  moderator: 'Moderadores',
  vip: 'VIP',
  subscriber: 'Inscritos/Subscribers/Membros',
  follower: 'Seguidores',
  normal: 'Usuários normais',
};

export const ROLE_ORDER = ['all', 'broadcaster', 'moderator', 'vip', 'subscriber', 'follower', 'normal'];
export const PRIORITY_ROLES = ['broadcaster', 'moderator', 'vip', 'subscriber', 'normal'];

export function defaultRules() {
  return {
    triggers: { enabled: false, items: [] },
    repeat: { enabled: false, max: 3, windowSec: 60 },
    cooldown: { enabled: false, sec: 0 },
    roles: { enabled: false, allowed: { all: true, broadcaster: true, moderator: true, vip: true, subscriber: true, normal: true } },
    links: { enabled: false, policy: 'allow' },
    emotes: { enabled: false, policy: 'allow', maxCount: 5 },
    size: { enabled: false, policy: 'none', limit: 200 },
    priority: { enabled: false, weights: { broadcaster: 5, moderator: 4, vip: 3, subscriber: 2, normal: 1 } },
    queueLimit: { enabled: false, max: 10, policy: 'reject' },
  };
}

export function defaultFilterConfig() {
  return {
    mode: 'free',
    scope: 'shared',
    shared: defaultRules(),
    perPlatform: { Twitch: defaultRules(), Kick: defaultRules(), YouTube: defaultRules() },
  };
}

function presetRules(kind) {
  const r = defaultRules();
  if (kind === 'leve') {
    r.cooldown = { enabled: true, sec: 5 };
    r.links = { enabled: true, policy: 'remove' };
  } else if (kind === 'moderado') {
    r.repeat = { enabled: true, max: 3, windowSec: 60 };
    r.cooldown = { enabled: true, sec: 10 };
    r.links = { enabled: true, policy: 'block' };
    r.emotes = { enabled: true, policy: 'remove', maxCount: 5 };
    r.size = { enabled: true, policy: 'cut', limit: 200 };
  } else if (kind === 'restrito') {
    r.repeat = { enabled: true, max: 2, windowSec: 120 };
    r.cooldown = { enabled: true, sec: 30 };
    r.links = { enabled: true, policy: 'block' };
    r.emotes = { enabled: true, policy: 'block_only', maxCount: 3 };
    r.size = { enabled: true, policy: 'ignore_over', limit: 150 };
    r.queueLimit = { enabled: true, max: 5, policy: 'reject' };
  }
  return r;
}

export const PRESETS = {
  livre: { label: 'Livre', build: () => ({ ...defaultFilterConfig(), mode: 'free' }) },
  leve: { label: 'Leve', build: () => ({ ...defaultFilterConfig(), mode: 'custom', shared: presetRules('leve') }) },
  moderado: { label: 'Moderado', build: () => ({ ...defaultFilterConfig(), mode: 'custom', shared: presetRules('moderado') }) },
  restrito: { label: 'Restrito', build: () => ({ ...defaultFilterConfig(), mode: 'custom', shared: presetRules('restrito') }) },
};

// Resolve as regras ativas para uma plataforma. Retorna null em MODO LIVRE (bypass total).
export function resolveRules(config, platform) {
  if (!config || config.mode === 'free') return null;
  if (config.scope === 'per_platform') return config.perPlatform?.[platform] || config.shared;
  return config.shared;
}

export function normalizeText(s) {
  return String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

import { safeStorage } from '@dashboard/login/safeStorage';
import { authClient } from '@dashboard/login/authClient';

function getCurrentUserId(userId) {
  if (userId) return userId;
  try {
    return authClient.getUserDataCache()?.id || null;
  } catch {
    return null;
  }
}

// Persistência via safeStorage com isolamento por userId.
const LEGACY_FILTER_KEY = 'livenexus:tts-filters';
function mergeFilter(parsed) {
  return { ...defaultFilterConfig(), ...parsed, shared: { ...defaultRules(), ...(parsed.shared || {}) }, perPlatform: { Twitch: { ...defaultRules(), ...(parsed.perPlatform?.Twitch || {}) }, Kick: { ...defaultRules(), ...(parsed.perPlatform?.Kick || {}) }, YouTube: { ...defaultRules(), ...(parsed.perPlatform?.YouTube || {}) } } };
}

export function loadFilterConfig(userId) {
  const uid = getCurrentUserId(userId);
  if (uid) {
    try {
      const raw = safeStorage.getItem(`livenexus:user_filter_config:${uid}`);
      if (raw) return mergeFilter(JSON.parse(raw));
    } catch {}
  }
  try {
    const raw = safeStorage.getItem(LEGACY_FILTER_KEY);
    if (raw) return mergeFilter(JSON.parse(raw));
  } catch {}
  return defaultFilterConfig();
}

export function saveFilterConfig(c, userId) {
  const uid = getCurrentUserId(userId);
  if (uid) {
    try {
      safeStorage.setItem(`livenexus:user_filter_config:${uid}`, JSON.stringify(c));
    } catch {}
  }
  try { safeStorage.setItem(LEGACY_FILTER_KEY, JSON.stringify(c)); } catch {}
}