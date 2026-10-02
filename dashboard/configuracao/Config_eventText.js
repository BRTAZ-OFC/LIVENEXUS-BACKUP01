// Fallback text generation for monetization events.
// Shared between the Event Simulator and platform connectors.
export function generateEventText(eventType, author, eventMeta = {}) {
  const user = author || 'Anônimo';
  switch (eventType) {
    case 'twitch_sub': return `${user} se inscreveu`;
    case 'twitch_resub': return `${user} renovou a inscrição`;
    case 'twitch_subgift': return `${user} presenteou uma inscrição`;
    case 'twitch_raid': return `${user} chegou com uma raid`;
    case 'twitch_bits': return eventMeta.amount ? `${user} enviou ${eventMeta.amount} bits` : `${user} enviou bits`;
    case 'kick_sub': return `${user} se inscreveu`;
    case 'kick_gift': return `${user} presenteou uma inscrição`;
    case 'kick_raid': return `${user} chegou com uma raid`;
    case 'youtube_membership': return `${user} virou membro`;
    case 'youtube_membership_gifting': return `${user} presenteou membresias`;
    case 'youtube_gift_membership_received': return `${user} recebeu uma membresia`;
    case 'youtube_superchat': return `${user} enviou um Super Chat`;
    case 'youtube_supersticker': return `${user} enviou um Super Sticker`;
    case 'youtube_poll': return `Enquete do YouTube: ${eventMeta.question || 'Nova enquete'}`;
    default: return '';
  }
}