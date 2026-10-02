// eventClassification — classificação semântica multiplataforma de eventos.
// Pure functions sobre o item normalizado JÁ existente ({ eventType, eventMeta, platform }).
// Não cria store, não cria socket, não normaliza — só CLASSIFICA dados que já existem.
//
// EventTypes reais (fonte: código atual):
//   Twitch:  twitch_sub, twitch_resub, twitch_subgift, twitch_bits, twitch_raid, twitch_announcement
//   YouTube: youtube_membership, youtube_superchat, youtube_supersticker
//   Kick:    kick_sub, kick_gift, kick_raid

// Inscrição/adesão (sem gift): sub, resub, membership, kick_sub
export function isSubscriptionEvent(e) {
  const t = e?.eventType;
  return t === 'twitch_sub' || t === 'twitch_resub' || t === 'youtube_membership' || t === 'kick_sub';
}

// Gift de inscrição: subgift (twitch), kick_gift, youtube_membership_gifting, youtube_gift_membership_received
export function isGiftSubscriptionEvent(e) {
  const t = e?.eventType;
  return t === 'twitch_subgift' || t === 'kick_gift' || t === 'youtube_membership_gifting' || t === 'youtube_gift_membership_received';
}

// Raid: twitch_raid, kick_raid. YouTube não tem raid.
export function isRaidEvent(e) {
  const t = e?.eventType;
  return t === 'twitch_raid' || t === 'kick_raid';
}

// Apoio financeiro (NÃO somar entre si — unidades diferentes):
//   twitch_bits = bits (inteiro, sem moeda)
//   youtube_superchat / youtube_supersticker = dinheiro (amountText, currency)
export function isFinancialSupportEvent(e) {
  const t = e?.eventType;
  return t === 'twitch_bits' || t === 'youtube_superchat' || t === 'youtube_supersticker';
}

// Evento especial (alerta): sub/gift/raid/financeiro/announcement.
export function isSpecialEvent(e) {
  return isSubscriptionEvent(e) || isGiftSubscriptionEvent(e) || isRaidEvent(e) || isFinancialSupportEvent(e) || e?.eventType === 'twitch_announcement';
}

// Plataforma legível.
export function getEventPlatform(e) {
  const p = e?.platform;
  if (p === 'Twitch' || p === 'YouTube' || p === 'Kick') return p;
  return p || '—';
}

// Rótulo curto do tipo real do evento (preserva a nomenclatura da plataforma).
export function getEventDisplayType(e) {
  switch (e?.eventType) {
    case 'twitch_sub': return 'SUB';
    case 'twitch_resub': return 'RESUB';
    case 'twitch_subgift': return e?.eventMeta?.isMysteryGift ? 'GIFT BOMB' : 'GIFT SUB';
    case 'twitch_bits': return 'BITS';
    case 'twitch_raid': return 'RAID';
    case 'twitch_announcement': return 'ANÚNCIO';
    case 'youtube_membership': return 'MEMBRO';
    case 'youtube_membership_gifting': return 'GIFT MEMBRO';
    case 'youtube_gift_membership_received': return 'MEMBRO RECEBIDO';
    case 'youtube_superchat': return 'SUPER CHAT';
    case 'youtube_supersticker': return 'SUPER STICKER';
    case 'youtube_poll': return 'ENQUETE';
    case 'kick_sub': return 'SUB';
    case 'kick_gift': return 'GIFT SUB';
    case 'kick_raid': return 'RAID';
    case 'kick_follow': return 'SEGUIDOR';
    default: return e?.eventType || '';
  }
}