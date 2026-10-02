// Leitura dos dados já entregues pelo fluxo global. Sem conexões próprias dos widgets.
export const STREAM_PLATFORMS = ['Twitch', 'Kick', 'YouTube'];

export const MULTIPLATFORM_WIDGET_IDS = new Set([
  'multi-viewers-counter', 'react-hub-widget', 'twitch-chat-box', 'twitch-status-label', 'twitch-uptime',
  'twitch-chat-speed', 'twitch-chat-vibe', 'twitch-viewers-chart',
  'twitch-chatter-leaderboard', 'twitch-poll', 'twitch-raffle', 'twitch-word-cloud',
  'twitch-alerts', 'twitch-event-list',
]);

export function usesPlatformData(instance) {
  return MULTIPLATFORM_WIDGET_IDS.has(instance?.widgetId) ||
    (instance?.widgetId === 'library-text' && ['viewers', 'uptime', 'events'].includes(instance.config?.dataBinding));
}

export const YOUTUBE_EVENT_LABELS = Object.freeze({
  youtube_new_member: 'Novo membro',
  youtube_membership: 'Novo membro',
  youtube_member_milestone: 'Marco de membro',
  youtube_superchat: 'Super Chat',
  youtube_supersticker: 'Super Sticker',
  youtube_membership_gifting: 'Presente de membresia',
  youtube_gift_membership_received: 'Membresia recebida',
  youtube_gift_jewels: 'Gift / Jewels',
  youtube_poll: 'Enquete do YouTube',
});

export function selectedPlatforms(config = {}) {
  // Instâncias da etapa anterior com `platform` mantêm a escolha ao abrir a versão nova.
  // Uma instância sem configuração de origem usa as três plataformas habilitadas.
  const requested = Array.isArray(config.platforms) ? config.platforms :
    (config.platform ? [config.platform] : STREAM_PLATFORMS);
  return STREAM_PLATFORMS.filter(platform => requested.includes(platform));
}

export function platformMessages(liveActivity, config = {}) {
  const platforms = selectedPlatforms(config);
  return (liveActivity?.items || []).filter(item => platforms.includes(item.platform) && !item.eventType);
}

export function platformEvents(liveActivity, config = {}) {
  const platforms = selectedPlatforms(config);
  return (liveActivity?.items || []).filter(item => platforms.includes(item.platform) && item.eventType);
}

export function platformIsOnline(connections, config = {}) {
  return selectedPlatforms(config).some(platform => connections?.[platform]?.status === 'connected');
}

export function platformViewers(connections, config = {}, { aggregate = true } = {}) {
  const online = selectedPlatforms(config).filter(platform => connections?.[platform]?.status === 'connected');
  const known = online.map(platform => connections[platform].viewers).filter(Number.isFinite);
  return known.length ? (aggregate ? known.reduce((sum, viewers) => sum + viewers, 0) : known[0]) : null;
}

export function platformMeta(streamMeta, connections, config = {}, field) {
  const platform = selectedPlatforms(config).find(source => {
    if (connections?.[source]?.status !== 'connected') return false;
    const meta = streamMeta?.[source];
    if (!meta) return false;
    if (field === 'startedAt') return !!meta.startedAt && Number.isFinite(new Date(meta.startedAt).getTime());
    if (field) return typeof meta[field] === 'string' ? !!meta[field].trim() : meta[field] != null;
    return true;
  });
  return platform ? streamMeta[platform] : {};
}

// A limpeza é apenas visual: a mensagem original do contexto e o TTS ficam intactos.
export function visibleChatText(item) {
  const text = String(item?.text || '');
  if (item?.platform !== 'Kick') return text;
  const ranges = (Array.isArray(item.emotes) ? item.emotes : []).flatMap(emote =>
    Array.isArray(emote?.positions) ? emote.positions : [emote]
  ).map(pos => ({ start: Number(pos?.start), end: Number(pos?.end) }))
    .filter(pos => Number.isInteger(pos.start) && Number.isInteger(pos.end) && pos.start >= 0 && pos.end >= pos.start && pos.end < text.length)
    .sort((a, b) => a.start - b.start);
  let result = '';
  let cursor = 0;
  for (const { start, end } of ranges) {
    if (start < cursor) continue;
    result += text.slice(cursor, start);
    cursor = end + 1;
  }
  result += text.slice(cursor);
  return result.replace(/\[emote:\d+:[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
}

export function eventLabel(event) {
  if (event?.platform === 'YouTube') return YOUTUBE_EVENT_LABELS[event.eventType] || event.eventType;
  if (event?.platform === 'Kick') return ({ kick_sub: 'Inscrição Kick', kick_gift: 'Presente Kick', kick_raid: 'Raid Kick' })[event.eventType] || event.eventType;
  return event?.eventType || '';
}

export function eventDetails(event) {
  const meta = event?.eventMeta || {};
  if (event?.platform !== 'YouTube') return event?.text || '';
  const fields = [
    ['Valor', meta.amount], ['Moeda', meta.currency], ['Tier', meta.tier],
    ['Sticker ID', meta.stickerId], ['Texto alternativo', meta.altText],
    ['Idioma', meta.language], ['Quantidade', meta.count],
    ['Presente', meta.giftName], ['Destinatário', meta.recipient],
    ['Meses', meta.months],
  ];
  const values = [event?.text, ...fields.filter(([, value]) =>
    value != null && value !== '' && (typeof value === 'string' || typeof value === 'number')
  ).map(([label, value]) => `${label}: ${value}`)].filter(Boolean);
  return values.join(' · ');
}

export function genericEventAllowed(event) {
  return event?.platform === 'Twitch' || event?.platform === 'Kick' ||
    (event?.platform === 'YouTube' && event.eventType !== 'youtube_poll' &&
      Object.hasOwn(YOUTUBE_EVENT_LABELS, event.eventType));
}
