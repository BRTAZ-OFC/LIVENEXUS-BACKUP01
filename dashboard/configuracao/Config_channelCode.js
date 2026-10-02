// Normalização client-side (UX/preview). O Worker é a autoridade canônica.
// channelUrl só para exibição de links — não usado para validar.

export function normalizeChannelInput(platform, input) {
  const v = (input || '').trim();
  if (platform === 'YouTube') {
    const m = v.match(/youtube\.com\/(@[A-Za-z0-9._-]+)/i) || v.match(/(@[A-Za-z0-9._-]+)/);
    let handle = m ? m[1] : v;
    if (!handle.startsWith('@')) handle = '@' + handle;
    return handle.replace(/[^@A-Za-z0-9._-]/g, '');
  }
  const m = v.match(/(?:twitch\.tv|kick\.com)\/([A-Za-z0-9_-]+)/i);
  let slug = m ? m[1] : v;
  slug = slug.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return slug;
}

export function channelUrl(platform, identifier) {
  if (!identifier) return null;
  if (platform === 'Twitch') return `https://twitch.tv/${identifier}`;
  if (platform === 'Kick') return `https://kick.com/${identifier}`;
  if (platform === 'YouTube') return `https://youtube.com/${identifier}`;
  return null;
}

export function placeholderFor(platform) {
  if (platform === 'YouTube') return '@nomedocanal';
  return 'nomedocanal';
}

export function hintFor(platform) {
  if (platform === 'YouTube') return 'Digite o @handle do seu canal do YouTube.';
  return 'Aceita também a URL do canal (twitch.tv/nome / kick.com/nome).';
}