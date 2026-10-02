// Chat ao vivo da Twitch via IRC anônimo sobre WSS + contagem de espectadores
// via Worker twitch-meta (Twitch Helix oficial). 100% client-side, sem backend.
// connectTwitch(channel, onMessage, onStatus, onMeta) -> { disconnect }
// onMeta: { viewers } | { meta } | { offline }
//   meta: { streamId, title, thumbnailUrl, channelName, startedAt, streamUrl }
//   offline: sinal de que a live ativa foi encerrada (debounce de 2 leituras nulas)
import { diag, pushError } from '@dashboard/painel-admin/Admin_streamingDiagnostics';
import { twitchPipelineDiagnostic } from '@dashboard/painel-admin/Admin_twitchPipelineDiagnostic';
import { fetchTwitchStreamInfo } from './Config_twitchStreamInfo';

function parseTwitchRoles(line) {
  const roles = [];
  if (!line.startsWith('@')) return roles;
  const tagsPart = line.slice(1, line.indexOf(' :'));
  const badges = (tagsPart.match(/badges=([^;]*)/)?.[1] || '').split(',');
  for (const b of badges) {
    const name = b.split('/')[0];
    if (name === 'broadcaster') roles.push('broadcaster');
    else if (name === 'moderator') roles.push('moderator');
    else if (name === 'vip') roles.push('vip');
    else if (name === 'subscriber') roles.push('subscriber');
  }
  return [...new Set(roles)];
}

function parseTwitchTags(line) {
  if (!line.startsWith('@')) return {};
  const tagsPart = line.slice(1, line.indexOf(' :'));
  const tags = {};
  tagsPart.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx > 0) tags[pair.slice(0, idx)] = pair.slice(idx + 1);
  });
  return tags;
}

// Parser estrutural de linha IRC: separa tags, prefix, command, params e trailing.
// Não depende de regex específicas por tipo de mensagem — identifica o command
// estruturalmente e extrai trailing corretamente, como o laboratório comprovado.
function parseIrcLine(line) {
  const parsed = { tags: {}, prefix: null, command: null, params: [], trailing: '' };
  let rest = line;

  // Tags: @tag1=val1;tag2=val2 ...
  if (rest.startsWith('@')) {
    const sp = rest.indexOf(' ');
    if (sp === -1) return parsed;
    const tagsPart = rest.slice(1, sp);
    tagsPart.split(';').forEach(pair => {
      const idx = pair.indexOf('=');
      if (idx > 0) parsed.tags[pair.slice(0, idx)] = pair.slice(idx + 1);
      else parsed.tags[pair] = '';
    });
    rest = rest.slice(sp + 1);
  }

  // Prefix: :nick!user@host (opcional)
  if (rest.startsWith(':')) {
    const sp = rest.indexOf(' ');
    if (sp === -1) { parsed.prefix = rest.slice(1); return parsed; }
    parsed.prefix = rest.slice(1, sp);
    rest = rest.slice(sp + 1);
  }

  // Trailing: tudo após ' :' (opcional, pode conter espaços)
  const tr = rest.indexOf(' :');
  if (tr !== -1) {
    parsed.trailing = rest.slice(tr + 2);
    rest = rest.slice(0, tr);
  }

  // Command + params
  const parts = rest.split(' ').filter(Boolean);
  parsed.command = parts[0] || null;
  parsed.params = parts.slice(1);

  return parsed;
}

// Extrai roles a partir das tags já parseadas (badges).
function parseRolesFromTags(tags) {
  const roles = [];
  const badges = (tags['badges'] || '').split(',');
  for (const b of badges) {
    const name = b.split('/')[0];
    if (name === 'broadcaster') roles.push('broadcaster');
    else if (name === 'moderator') roles.push('moderator');
    else if (name === 'vip') roles.push('vip');
    else if (name === 'subscriber') roles.push('subscriber');
  }
  return [...new Set(roles)];
}

export function connectTwitch(channel, onMessage, onStatus, onMeta) {
  let ws = null, reconnectTimer = null, stopped = false, attempts = 0;
  const chan = (channel || '').trim().toLowerCase();
  const nick = 'justinfan' + Math.floor(Math.random() * 90000 + 10000);

  // Backoff progressivo de reconexão (ms): 2s, 4s, 8s, 15s, demais 30s.
  const BACKOFF = [2000, 4000, 8000, 15000, 30000];
  const backoff = () => (attempts < BACKOFF.length ? BACKOFF[attempts] : 30000);

  const clearReconnect = () => { if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; diag.Twitch.reconnectTimersCleared++; diag.Twitch.reconnectTimerActive = 0; } };

  // Viewer count + metadata da live via GQL anônima (frontend, sem Worker).
  // Um único timer de 60s por conexão. Limpo em disconnect/onclose.
  let metaTimer = null;
  let wasOnline = false;
  const clearMeta = () => { if (metaTimer) { clearInterval(metaTimer); metaTimer = null; } };
  const pollMeta = async () => {
    if (stopped) return;
    const info = await fetchTwitchStreamInfo(chan);
    if (stopped || !info) return;
    if (info.online) {
      wasOnline = true;
      if (typeof info.viewers === 'number') onMeta?.({ viewers: info.viewers });
      onMeta?.({ meta: { streamId: info.streamId || chan, title: info.title || 'Transmissão', thumbnailUrl: info.thumbnailUrl || null, channelName: chan, startedAt: info.startedAt || null, streamUrl: `https://www.twitch.tv/${chan}`, game: info.game || null } });
    } else if (wasOnline) { wasOnline = false; onMeta?.({ offline: true }); }
  };

  // Agenda uma única reconexão concorrente. Nunca reagenda se já há um timer pendente.
  const scheduleReconnect = () => {
    if (stopped || reconnectTimer) return;
    const delay = backoff();
    attempts++;
    diag.Twitch.reconnectAttempts = attempts; diag.Twitch.currentBackoff = delay; diag.Twitch.reconnectScheduled = true;
    onStatus('connecting');
    diag.Twitch.reconnectTimersCreated++; diag.Twitch.reconnectTimerActive = 1;
    reconnectTimer = setTimeout(() => { reconnectTimer = null; diag.Twitch.reconnectTimerActive = 0; connect(); }, delay);
  };

  // Abre o WebSocket IRC. Idempotente: fecha qualquer socket anterior antes de criar um novo.
  const connect = () => {
    if (stopped) return;
    if (ws) { try { ws.onclose = null; ws.close(); } catch {} ws = null; }
    let socket;
    try {
      socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443'); diag.Twitch.socketsCreated++; diag.Twitch.socketActive = 1;
    } catch {
      scheduleReconnect();
      return;
    }
    ws = socket;

    socket.onopen = () => {
      attempts = 0;          // conectou: reset do contador de tentativas
      clearReconnect();      // cancela qualquer reconnect pendente
      socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      twitchPipelineDiagnostic.recordCapSent('CAP REQ :twitch.tv/tags twitch.tv/commands');
      socket.send(`NICK ${nick}`);
      socket.send(`JOIN #${chan}`);
      twitchPipelineDiagnostic.recordJoinSent(chan);
      diag.Twitch.connectedAt = new Date().toISOString(); diag.Twitch.disconnectReason = null; diag.Twitch.reconnectScheduled = false; diag.Twitch.reconnectSuccessCount++;
      onStatus('connected');
      twitchPipelineDiagnostic.incSocketOpen();
      clearMeta();
      pollMeta();
      metaTimer = setInterval(pollMeta, 60000);
    };
    socket.onmessage = e => {
      e.data.split('\r\n').forEach(line => {
        if (!line) return;
        twitchPipelineDiagnostic.incRawLineFull(line);
        twitchPipelineDiagnostic.incRawLine();
        const parsed = parseIrcLine(line);
        const { tags, prefix, command, trailing } = parsed;

        // PING/PONG — keep-alive do WebSocket IRC
        if (command === 'PING') return socket.send('PONG :' + trailing);

        // PRIVMSG (chat normal + bits/cheer)
        if (command === 'PRIVMSG') {
          diag.Twitch.messagesReceived++; diag.Twitch.lastMessageAt = new Date().toISOString();
          const roles = parseRolesFromTags(tags);
          const authorId = tags['user-id'] || null;
          const timestamp = tags['tmi-sent-ts'] ? parseInt(tags['tmi-sent-ts'], 10) : null;
          const author = prefix ? prefix.split('!')[0] : 'Chat';
          const text = trailing;
          // first-msg: tag IRC da Twitch (first-msg=1) — primeira mensagem do usuário no canal.
          const firstMsg = tags['first-msg'] === '1';
          if (tags.bits) {
            const amount = parseInt(tags.bits, 10);
            onMessage({ author, authorId, text, roles, timestamp, firstMsg, eventType: 'twitch_bits', eventMeta: { amount: Number.isFinite(amount) ? amount : null }, emotes: tags.emotes || null });
          } else {
            onMessage({ author, authorId, text, roles, timestamp, firstMsg, eventType: null, eventMeta: null, emotes: tags.emotes || null });
          }
          return;
        }

        // USERNOTICE (sub, resub, subgift, anonsubgift, submysterygift, anonsubmysterygift, raid, announcement)
        if (command === 'USERNOTICE') {
          twitchPipelineDiagnostic.incRawUsernotice(line);
          const msgId = tags['msg-id'] || '';
          twitchPipelineDiagnostic.incMsgId(msgId);
          let author = tags['display-name'] || tags['login'] || 'Anônimo';
          const authorId = tags['user-id'] || null;
          const roles = parseRolesFromTags(tags);
          const timestamp = tags['tmi-sent-ts'] ? parseInt(tags['tmi-sent-ts'], 10) : null;
          const userText = trailing || '';
          let eventType = null, eventMeta = {}, text = userText;

          if (msgId === 'sub') {
            eventType = 'twitch_sub';
            const months = parseInt(tags['msg-param-cumulative-months'] || tags['msg-param-months'] || '0', 10);
            eventMeta = { months: Number.isFinite(months) ? months : null };
            if (!text) text = `${author} se inscreveu`;
          } else if (msgId === 'resub') {
            eventType = 'twitch_resub';
            const months = parseInt(tags['msg-param-cumulative-months'] || '0', 10);
            const tier = tags['msg-param-sub-plan'] || null;
            eventMeta = { months: Number.isFinite(months) ? months : null, tier };
            if (!text) text = `${author} renovou a inscrição`;
          } else if (msgId === 'subgift' || msgId === 'anonsubgift') {
            eventType = 'twitch_subgift';
            const isAnonymous = msgId === 'anonsubgift';
            if (isAnonymous) author = 'Anônimo';
            const recipient = tags['msg-param-recipient-display-name'] || tags['msg-param-recipient-user-name'] || null;
            const months = parseInt(tags['msg-param-gift-months'] || '1', 10);
            const tier = tags['msg-param-sub-plan'] || null;
            const communityGiftId = tags['msg-param-community-gift-id'] || tags['msg-param-origin-id'] || null;
            eventMeta = { count: 1, recipient, months: Number.isFinite(months) ? months : null, tier, isAnonymous, isMysteryGift: false, communityGiftId };
            if (!text) text = isAnonymous ? 'Anônimo presenteou uma inscrição' : `${author} presenteou uma inscrição`;
          } else if (msgId === 'submysterygift' || msgId === 'anonsubmysterygift') {
            eventType = 'twitch_subgift';
            const isAnonymous = msgId === 'anonsubmysterygift';
            if (isAnonymous) author = 'Anônimo';
            const parsedCount = parseInt(tags['msg-param-mass-gift-count'] || '1', 10);
            const count = (!Number.isFinite(parsedCount) || parsedCount < 1) ? 1 : parsedCount;
            const tier = tags['msg-param-sub-plan'] || null;
            const communityGiftId = tags['msg-param-community-gift-id'] || tags['msg-param-origin-id'] || null;
            eventMeta = { count, recipient: null, months: null, tier, isAnonymous, isMysteryGift: true, communityGiftId };
            if (!text) text = isAnonymous ? `Anônimo presenteou ${count} inscrições` : `${author} presenteou ${count} inscrições`;
          } else if (msgId === 'raid') {
            eventType = 'twitch_raid';
            const viewers = parseInt(tags['msg-param-viewerCount'] || '0', 10);
            eventMeta = { viewers: Number.isFinite(viewers) ? viewers : null };
            if (!text) text = `${author} chegou com uma raid`;
          } else if (msgId === 'announcement') {
            // Anúncio do canal (USERNOTICE msg-id "announcement"). Propaga classificação
            // dedicada para overlays (Anúncio / Mensagem Destacada). Texto e autor já vêm do trailing.
            eventType = 'twitch_announcement';
            eventMeta = { msgId: 'announcement' };
          } else {
            twitchPipelineDiagnostic.incRawUsernoticeFull(line, { command, msgId, eventType: null, eventMeta: null, emitted: false });
            return; // other USERNOTICE types — not handled
          }

          diag.Twitch.messagesReceived++; diag.Twitch.lastMessageAt = new Date().toISOString();
          twitchPipelineDiagnostic.incEmitted(eventType, eventMeta?.count);
          twitchPipelineDiagnostic.incRawUsernoticeFull(line, { command, msgId, eventType, eventMeta, emitted: true });
          onMessage({ author, authorId, text, roles, timestamp, eventType, eventMeta });
        }
      });
    };
    socket.onerror = () => { if (!stopped) { diag.Twitch.lastError = 'IRC onerror'; diag.Twitch.lastErrorAt = new Date().toISOString(); pushError({ platform: 'Twitch', step: 'irc.onerror', message: 'Não foi possível conectar ao chat da Twitch.' }); onStatus('error', 'Não foi possível conectar ao chat da Twitch.'); } };
    // Fechamento inesperado: limpa viewersTimer e agenda reconexão (apenas se este ainda for o socket ativo).
    socket.onclose = () => {
      if (stopped) return;
      diag.Twitch.socketActive = 0; diag.Twitch.disconnectedAt = new Date().toISOString(); diag.Twitch.disconnectReason = 'socket_closed'; diag.Twitch.reconnectScheduled = true;
      clearMeta();
      if (ws === socket) { ws = null; scheduleReconnect(); }
    };
  };

  connect();

  return {
    disconnect: () => {
      stopped = true;          // parada manual: bloqueia qualquer reconexão futura
      clearReconnect();
      clearMeta();
      diag.Twitch.disconnectedAt = new Date().toISOString(); diag.Twitch.disconnectReason = 'manual'; diag.Twitch.reconnectScheduled = false;
      if (ws) { try { ws.onclose = null; ws.close(); } catch {} diag.Twitch.socketsClosed++; diag.Twitch.socketActive = 0; ws = null; }
    },
  };
}