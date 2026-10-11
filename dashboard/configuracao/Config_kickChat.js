// Conexão ao chat do Kick: Pusher DIRETO no navegador + resolução de chatroomId via
// API v2 do Kick (CORS permissivo, frontend puro). Viewer count via poll da mesma API.
// Sem Worker; client-side direto.
// connectKick(channel, onMessage, onStatus, onMeta) -> { disconnect }
// onMeta: { viewers } | { meta } | { offline }
//   meta: { streamId, title, thumbnailUrl, channelName, startedAt, streamUrl }
//   offline: sinal de que a live ativa foi encerrada (debounce de 2 leituras nulas)
import { diag, pushError, pushKickRawEvent } from '@dashboard/painel-admin/Admin_streamingDiagnostics';

const PUSHER_KEY = '32cbd69e4b950bf97679';
const PUSHER_URL = `wss://ws-us2.pusher.com/app/${PUSHER_KEY}?protocol=7&client=js&version=8.4.0-rc2&flash=false`;

// Normaliza entrada do usuário (nome, @nome, URL) para slug puro.
function normalizeKickSlug(input) {
  const v = (input || '').trim().toLowerCase();
  const m = v.match(/kick\.com\/([a-z0-9_.-]+)/i);
  let slug = m ? m[1] : v;
  slug = slug.replace(/^@/, '').replace(/[^a-z0-9_.-]/g, '');
  return slug;
}

// Fallback direto do browser: a API do Kick retorna CORS permissivo.
// Usado SOMENTE quando o Worker falha (404, rede, ou formato inesperado).
async function resolveChatroomIdDirect(slug) {
  const r = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!r.ok) {
    if (r.status === 404) throw new Error('Canal não encontrado no Kick.');
    throw new Error(`Kick API respondeu ${r.status}.`);
  }
  const data = await r.json().catch(() => null);
  if (!data) throw new Error('Resposta inválida da API do Kick.');
  if (!data.chatroom?.id) throw new Error('Canal encontrado, mas sem chatroom ID.');
  return data.chatroom.id;
}

async function resolveChatroomId(slug) {
  // Resolução direta do browser (CORS permissivo do Kick). Sem Worker.
  const chatroomId = await resolveChatroomIdDirect(slug);
  console.log('[KICK] chatroomId resolvido via v2:', chatroomId);
  return chatroomId;
}

function parseKickRoles(sender) {
  const roles = [];
  const badges = sender?.identity?.badges || [];
  for (const b of badges) {
    const t = String(b?.type || '').toLowerCase();
    if (t === 'broadcaster' || t === 'owner') roles.push('broadcaster');
    else if (t === 'moderator' || t === 'staff') roles.push('moderator');
    else if (t === 'vip') roles.push('vip');
    else if (t === 'subscriber' || t === 'founder') roles.push('subscriber');
  }
  return [...new Set(roles)];
}

// TEMPORARY: cria captura bruta de evento Kick antes da classificação.
// Preserva rawData (string) + parsedData (objeto), truncando em 30KB.
// Não guarda WebSocket, funções, ou referências circulares.
function createKickRawCapture(msg) {
  let parsedData = null;
  let rawDataStr = null;
  if (typeof msg.data === 'string') {
    rawDataStr = msg.data;
    try { parsedData = JSON.parse(msg.data); } catch { parsedData = null; }
  } else if (msg.data && typeof msg.data === 'object') {
    parsedData = msg.data;
    try { rawDataStr = JSON.stringify(msg.data); } catch { rawDataStr = null; }
  }
  const MAX_RAW = 30000;
  let truncated = false;
  if (rawDataStr && rawDataStr.length > MAX_RAW) {
    rawDataStr = rawDataStr.slice(0, MAX_RAW);
    truncated = true;
  }
  return {
    time: new Date().toISOString(),
    eventName: String(msg.event || ''),
    rawData: rawDataStr,
    parsedData: parsedData,
    truncated: truncated,
    matchedBranch: null,
    normalizedEventType: null,
    normalizedAuthor: null,
    normalizedEventMeta: null,
  };
}

export function connectKick(channel, onMessage, onStatus, onMeta) {
  let ws = null, pingTimer = null, destroyed = false, chatroomId = null;
  const slug = normalizeKickSlug(channel);
  diag.Kick.reconnectSupported = false;

  // TEMPORARY: raw event capture wrapper (no behavior change).
  // Intercepta onMessage para registrar o resultado da classificação atual.
  let _rawCapturePending = null;
  const _userOnMessage = onMessage;
  onMessage = (payload) => {
    if (_rawCapturePending) {
      _rawCapturePending.normalizedEventType = payload.eventType ?? null;
      _rawCapturePending.normalizedAuthor = payload.author ?? null;
      _rawCapturePending.normalizedEventMeta = payload.eventMeta ?? null;
      if (payload.eventType === null) _rawCapturePending.matchedBranch = 'chat';
      else if (payload.eventType === 'kick_sub') _rawCapturePending.matchedBranch = 'subscription';
      else if (payload.eventType === 'kick_gift') _rawCapturePending.matchedBranch = 'gift';
      else if (payload.eventType === 'kick_raid') _rawCapturePending.matchedBranch = 'raid';
      pushKickRawEvent(_rawCapturePending);
      _rawCapturePending = null;
    }
    return _userOnMessage(payload);
  };

  const cleanup = () => { if (pingTimer) { clearInterval(pingTimer); pingTimer = null; diag.Kick.pingTimerActive = 0; } if (metaTimer) { clearInterval(metaTimer); metaTimer = null; } if (ws) { ws.onclose = null; ws.onerror = null; try { ws.close(); } catch {} diag.Kick.socketsClosed++; diag.Kick.socketActive = 0; ws = null; } };
  const disconnect = () => { destroyed = true; cleanup(); diag.Kick.disconnectedAt = new Date().toISOString(); diag.Kick.disconnectReason = 'manual'; diag.Kick.recoveryStatus = 'manual_disconnect'; };

  // Viewer count via API v2 do Kick (frontend, sem Worker). Reutiliza o mesmo
  // endpoint de resolveChatroomIdDirect. Um único timer de 60s por conexão.
  let metaTimer = null;
  let wasOnline = false;
  const pollViewers = async () => {
    if (destroyed) return;
    try {
      const r = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, { headers: { 'Accept': 'application/json' } });
      if (destroyed || !r.ok) return;
      const data = await r.json().catch(() => null);
      if (destroyed || !data) return;
      const ls = data.livestream || data.live_stream || null;
      const viewerCount = (typeof ls?.viewer_count === 'number') ? ls.viewer_count : (typeof ls?.viewers === 'number') ? ls.viewers : (typeof data.viewer_count === 'number') ? data.viewer_count : null;
      const isLive = ls ? (ls.is_live !== false) : false;
      if (isLive) {
        wasOnline = true;
        if (typeof viewerCount === 'number') onMeta?.({ viewers: viewerCount });
        const title = ls.session_title || ls.title || null;
        const startedAt = ls.created_at || ls.started_at || ls.startedAt || null;
        if (title || startedAt) onMeta?.({ meta: {
          streamId: ls.id != null ? String(ls.id) : slug,
          title, startedAt, channelName: slug,
          thumbnailUrl: ls.thumbnail?.url || null,
          streamUrl: `https://kick.com/${slug}`,
        } });
      } else if (wasOnline) { wasOnline = false; onMeta?.({ offline: true }); }
    } catch { /* CORS/rede — silencioso */ }
  };

  (async () => {
    try {
      chatroomId = await resolveChatroomId(slug);
    } catch (e) { diag.Kick.lastError = e.message; diag.Kick.lastErrorAt = new Date().toISOString(); pushError({ platform: 'Kick', step: 'resolveChatroomId', message: e.message }); return onStatus('error', e.message); }
    if (destroyed) return;

    ws = new WebSocket(PUSHER_URL); diag.Kick.socketsCreated++; diag.Kick.socketActive = 1;
    ws.onopen = () => { pingTimer = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ event: 'pusher:ping', data: {} })), 30000); diag.Kick.pingTimerActive = 1; };
    ws.onmessage = e => {
      let msg; try { msg = JSON.parse(e.data); } catch { return; }
      // TEMPORARY: raw capture setup — BEFORE classification (no behavior change)
      const _isPusherInternal = msg.event === 'pusher:connection_established' || msg.event === 'pusher_internal:subscription_succeeded' || msg.event === 'pusher:ping';
      const _isKnownChat = /ChatMessage/i.test(msg.event || '');
      if (!_isPusherInternal && !_isKnownChat) _rawCapturePending = createKickRawCapture(msg);
      if (msg.event === 'pusher:connection_established') ws.send(JSON.stringify({ event: 'pusher:subscribe', data: { auth: '', channel: `chatrooms.${chatroomId}.v2` } }));
      else if (msg.event === 'pusher_internal:subscription_succeeded') { diag.Kick.connectedAt = new Date().toISOString(); diag.Kick.disconnectReason = null; diag.Kick.recoveryStatus = 'subscribed'; onStatus('connected'); pollViewers(); metaTimer = setInterval(pollViewers, 60000); }
      else if (msg.event === 'pusher:ping') ws.send(JSON.stringify({ event: 'pusher:pong', data: {} }));
      else if (msg.event === 'App\\Events\\ChatMessageEvent' || msg.event === 'App\\Events\\ChatMessageSentEvent') {
        let d; try { d = JSON.parse(msg.data); } catch { return; }
        diag.Kick.messagesReceived++; diag.Kick.lastMessageAt = new Date().toISOString();
        onMessage({ author: d.sender?.username || d.sender?.slug || 'Anônimo', text: d.content || '', roles: parseKickRoles(d.sender), eventType: null, eventMeta: null, emotes: d.emotes || null });
      }
      else if (msg.event === 'App\\Events\\SubscriptionEvent' || /Subscription/i.test(msg.event)) {
        let d; try { d = JSON.parse(msg.data); } catch { return; }
        diag.Kick.messagesReceived++; diag.Kick.lastMessageAt = new Date().toISOString();
        const author = d.sender?.username || d.user?.username || d.subscriber?.username || 'Anônimo';
        const eventMeta = {};
        if (d.months) eventMeta.months = d.months;
        if (d.tier) eventMeta.tier = d.tier;
        onMessage({ author, text: `${author} se inscreveu`, roles: [], eventType: 'kick_sub', eventMeta });
      }
      else if (msg.event === 'App\\Events\\GiftEvent' || /Gift/i.test(msg.event)) {
        let d; try { d = JSON.parse(msg.data); } catch { return; }
        diag.Kick.messagesReceived++; diag.Kick.lastMessageAt = new Date().toISOString();
        const author = d.gifter?.username || d.sender?.username || 'Anônimo';
        const eventMeta = {};
        if (d.recipient?.username) eventMeta.recipient = d.recipient.username;
        if (d.amount) eventMeta.amount = d.amount;
        if (d.count) eventMeta.amount = d.count;
        onMessage({ author, text: `${author} presenteou uma inscrição`, roles: [], eventType: 'kick_gift', eventMeta });
      }
      else if (msg.event === 'App\\Events\\RaidEvent' || /Raid/i.test(msg.event)) {
        let d; try { d = JSON.parse(msg.data); } catch { return; }
        diag.Kick.messagesReceived++; diag.Kick.lastMessageAt = new Date().toISOString();
        const author = d.sender?.username || d.raider?.username || 'Anônimo';
        const eventMeta = {};
        if (d.viewers) eventMeta.viewers = d.viewers;
        onMessage({ author, text: `${author} chegou com uma raid`, roles: [], eventType: 'kick_raid', eventMeta });
      }
      else {
        // TEMPORARY: unknown event — record raw capture (no behavior change)
        if (_rawCapturePending) {
          _rawCapturePending.matchedBranch = 'unknown';
          _rawCapturePending.normalizedEventType = null;
          pushKickRawEvent(_rawCapturePending);
          _rawCapturePending = null;
        }
      }
    };
    ws.onerror = () => { diag.Kick.lastError = 'Pusher onerror'; diag.Kick.lastErrorAt = new Date().toISOString(); pushError({ platform: 'Kick', step: 'pusher.onerror', message: 'Erro na conexão com o Pusher do Kick.' }); onStatus('error', 'Erro na conexão com o Pusher do Kick.'); };
    // Fechamento natural do Pusher: marca encerrada, limpa timers e impede novos polls (idempotente).
    ws.onclose = () => { if (!destroyed) { destroyed = true; cleanup(); diag.Kick.disconnectedAt = new Date().toISOString(); diag.Kick.disconnectReason = 'socket_closed'; diag.Kick.recoveryStatus = 'closed'; } };
  })();

  return { disconnect };
}
