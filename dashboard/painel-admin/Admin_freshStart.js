// Política de Fresh Start TTS: mensagens anteriores ao início da captura da
// sessão atual NÃO entram na fila TTS. Aparecem no feed visual, mas são
// marcadas como INITIAL_BACKLOG e não alimentam o scheduler.
//
// Baseline por plataforma: captureStartedAt[platform] = timestamp (ms).
// - Setado quando onStatus('connected') fire pela PRIMEIRA vez na sessão.
// - Resetado em disconnect/toggle off/renew/unlink/disconnectAll.
// - Rebootstrap da mesma sessão NÃO reseta o baseline (primeira conexão só).
//
// Identificação de backlog (ordem de preferência):
// 1. Timestamp real da mensagem (YouTube: "X seconds ago" → msgTime).
// 2. Sem timestamp (Twitch/Kick): real-time, nunca é backlog.
// 3. Fallback seguro: se não há baseline ou timestamp não parseável, admite.

const captureStartedAt = {};  // platform -> timestamp (ms)

export function startCapture(platform) {
  captureStartedAt[platform] = Date.now();
}

export function stopCapture(platform) {
  delete captureStartedAt[platform];
}

export function stopAllCapture() {
  for (const k of Object.keys(captureStartedAt)) delete captureStartedAt[k];
}

export function getCaptureStartedAt(platform) {
  return captureStartedAt[platform] || null;
}

// Parse YouTube timestamp text: "5 seconds ago", "2 minutes ago", "1 hour ago".
// Retorna segundos atrás (number), ou null se não parseável.
function parseSecondsAgo(timestampText) {
  if (!timestampText || typeof timestampText !== 'string') return null;
  const s = timestampText.toLowerCase().trim();
  let m;
  m = s.match(/^(\d+)\s*sec/);   if (m) return parseInt(m[1], 10);
  m = s.match(/^(\d+)\s*min/);   if (m) return parseInt(m[1], 10) * 60;
  m = s.match(/^(\d+)\s*hour/);  if (m) return parseInt(m[1], 10) * 3600;
  m = s.match(/^(\d+)\s*day/);   if (m) return parseInt(m[1], 10) * 86400;
  m = s.match(/^(\d+)\s*week/);  if (m) return parseInt(m[1], 10) * 604800;
  return null;
}

// Retorna true se a mensagem é backlog inicial (deve ser pulada para TTS).
// A mensagem ainda aparece no feed visual; apenas a admissão no TTS é bloqueada.
export function isInitialBacklog(platform, msg) {
  const startedAt = captureStartedAt[platform];
  if (!startedAt) return false;  // sem baseline — admite

  // YouTube: usa timestamp text para determinar se a mensagem foi enviada
  // antes do início da captura da sessão.
  if (platform === 'YouTube' && msg?.timestamp) {
    const secondsAgo = parseSecondsAgo(msg.timestamp);
    if (secondsAgo !== null) {
      const msgTime = Date.now() - secondsAgo * 1000;
      // Mensagem enviada antes do baseline = backlog histórico inicial.
      return msgTime < startedAt;
    }
    // Timestamp não parseável — admite (não bloqueia por segurança).
    return false;
  }

  // Twitch: IRC anônimo entrega apenas mensagens novas após JOIN.
  // Não há backlog histórico no protocolo IRC — não marca como INITIAL_BACKLOG.
  //
  // Kick: Pusher entrega apenas eventos em tempo real após subscribe.
  // Não há snapshot/backlog inicial no protocolo Pusher — não marca.
  //
  // Confirmação: twitchChat.js (JOIN → PRIVMSG em tempo real) e
  // kickChat.js (pusher:subscribe → App\Events\ChatMessageEvent em tempo real).
  return false;
}