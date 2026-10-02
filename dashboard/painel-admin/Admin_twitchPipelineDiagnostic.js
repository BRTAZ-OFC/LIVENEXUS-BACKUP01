// twitchPipelineDiagnostic — store TEMPORÁRIO somente para diagnóstico.
// NÃO processa mensagens, NÃO filtra, NÃO normaliza, NÃO emite TTS.
// Apenas contadores + histórico cronológico + amostras RAW IRC em memória frontend.
// Zero persistência, zero custo, zero backend.
//
// Mede a cadeia: Twitch WebSocket → IRC bruto → USERNOTICE → msg-id →
// parser emite onMessage → bridge → receive() → normalized → liveActivity.
//
// CAPTURA RAW IRC (independente do parser):
// - rawLinesGeneral: últimas 100 linhas IRC brutas gerais.
// - rawLinesRelevant: últimas 200 linhas IRC relevantes (CAP/001/JOIN/ROOMSTATE/
//   USERSTATE/NOTICE/USERNOTICE/CLEARCHAT/CLEARMSG/PRIVMSG+bits/msg-id=).
// - rawUsernoticeFull: últimos 100 USERNOTICE brutos COMPLETOS com dados do parser.
// - rawMsgIdCounts: contadores por msg-id baseados em STRING (não parseIrcLine).
// - rawBitsCount: PRIVMSG com bits= (string-based).
// - CAP/001/JOIN: registro do handshake da conexão IRC.
//
// Histórico cronológico (máx 2000 registros): registra SOMENTE eventos relevantes.
// Mensagens normais de chat NÃO são registradas individualmente (contadores bastam).

const MAX_HISTORY = 2000;
const MAX_RAW_GENERAL = 100;
const MAX_RAW_RELEVANT = 200;
const MAX_RAW_USERNOTICE = 100;

const RAW_MSG_ID_KEYS = ['sub', 'resub', 'subgift', 'anonsubgift', 'submysterygift', 'anonsubmysterygift', 'raid', 'announcement', 'viewermilestone'];

function emptyRawMsgIdCounts() {
  return { sub: 0, resub: 0, subgift: 0, anonsubgift: 0, submysterygift: 0, anonsubmysterygift: 0, raid: 0, announcement: 0, viewermilestone: 0, other: 0 };
}

const initial = {
  // SOCKET
  socketOpenCount: 0,
  rawLinesTotal: 0,
  lastRawLineAt: null,
  // USERNOTICE BRUTO
  rawUsernoticeTotal: 0,
  lastRawUsernoticeAt: null,
  lastRawUsernotice: null,
  // MSG-ID COUNTERS (parser-based)
  msgIdCounts: { sub: 0, resub: 0, subgift: 0, anonsubgift: 0, submysterygift: 0, anonsubmysterygift: 0, raid: 0, announcement: 0, other: 0 },
  lastMsgId: null,
  lastMsgIdAt: null,
  // PARSER EMISSION
  usernoticeEmittedTotal: 0,
  lastEmittedEventType: null,
  lastEmittedCount: null,
  lastEmittedAt: null,
  // BRIDGE
  twitchBridgeTotal: 0,
  twitchBridgeEventTotal: 0,
  lastBridgeEventType: null,
  lastBridgeCount: null,
  lastBridgeAt: null,
  // RECEIVE
  receiveTotal: 0,
  receiveTwitchTotal: 0,
  receiveTwitchEventTotal: 0,
  lastReceiveEventType: null,
  lastReceiveCount: null,
  lastReceiveAt: null,
  // NORMALIZED
  normalizedTwitchTotal: 0,
  normalizedTwitchEventTotal: 0,
  lastNormalizedEventType: null,
  lastNormalizedCount: null,
  lastNormalizedAt: null,
  lastNormalizedId: null,
  // LIVE ACTIVITY
  liveActivityUpdateTotal: 0,
  liveActivityEventUpdateTotal: 0,
  lastLiveActivityEventType: null,
  lastLiveActivityCount: null,
  lastLiveActivityAt: null,
  lastLiveActivityId: null,
  // RAW IRC — CONTADORES (string-based, independentes do parser)
  rawUsernoticeCount: 0,
  rawMsgIdCounts: emptyRawMsgIdCounts(),
  rawBitsCount: 0,
  // CAP / 001 / JOIN
  capSent: false,
  capSentLine: null,
  capAck: false,
  capAckLine: null,
  capNak: false,
  capNakLine: null,
  line001: null,
  joinSent: false,
  joinChannel: null,
};

let state = { ...initial, msgIdCounts: { ...initial.msgIdCounts }, rawMsgIdCounts: emptyRawMsgIdCounts() };
let cachedSnapshot = null;
const listeners = new Set();

// --- Histórico cronológico em memória (máx MAX_HISTORY registros) ---
let history = [];
const sessionStartedAt = new Date().toISOString();
let lastResetAt = sessionStartedAt;

// --- Amostras RAW IRC em memória (não entram no snapshot — somente no relatório) ---
let rawLinesGeneral = [];
let rawLinesRelevant = [];
let rawUsernoticeFull = [];

function pushHistory(stage, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    stage,
    action: data.action || null,
    platform: data.platform || null,
    msgId: data.msgId || null,
    eventType: data.eventType || null,
    count: data.count ?? null,
    author: data.author || null,
    id: data.id || null,
    resumo: data.resumo || null,
  };
  history.push(entry);
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
}

function getHistory() {
  return history.slice();
}

// --- Classificação de linha IRC relevante (string-based, independente do parser) ---
function isRelevantRawLine(line) {
  if (!line) return false;
  if (line.includes(' CAP ')) return true;
  if (line.includes(' 001 ')) return true;
  if (line.includes(' JOIN ')) return true;
  if (line.includes(' ROOMSTATE ')) return true;
  if (line.includes(' USERSTATE ')) return true;
  if (line.includes(' NOTICE ')) return true;
  if (line.includes(' USERNOTICE ')) return true;
  if (line.includes(' CLEARCHAT ')) return true;
  if (line.includes(' CLEARMSG ')) return true;
  if (line.includes('PRIVMSG') && line.includes('bits=')) return true;
  if (line.includes('msg-id=')) return true;
  return false;
}

function buildSnapshot() {
  return {
    ...state,
    msgIdCounts: { ...state.msgIdCounts },
    rawMsgIdCounts: { ...state.rawMsgIdCounts },
  };
}

function emit() {
  cachedSnapshot = null;
  for (const fn of listeners) { try { fn(); } catch { /* listener isolado */ } }
}

function subscribe(fn) {
  if (typeof fn !== 'function') return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot() {
  if (!cachedSnapshot) cachedSnapshot = buildSnapshot();
  return cachedSnapshot;
}

const twitchPipelineDiagnostic = {
  subscribe,
  getSnapshot,
  get: getSnapshot,
  getHistory,
  getSessionStartedAt: () => sessionStartedAt,
  getLastResetAt: () => lastResetAt,
  getRawLinesGeneral: () => rawLinesGeneral.slice(),
  getRawLinesRelevant: () => rawLinesRelevant.slice(),
  getRawUsernoticeFull: () => rawUsernoticeFull.slice(),

  incSocketOpen() {
    state = { ...state, socketOpenCount: state.socketOpenCount + 1 };
    pushHistory('SOCKET', { action: 'open' });
    emit();
  },

  incRawLine() {
    state = { ...state, rawLinesTotal: state.rawLinesTotal + 1, lastRawLineAt: new Date().toISOString() };
    emit();
  },

  // CAPTURA RAW IRC — chamada ANTES de parseIrcLine, independentemente do parser.
  // String-based: classifica e conta diretamente da linha bruta.
  incRawLineFull(rawLine) {
    if (!rawLine) return;
    const ts = new Date().toISOString();

    // Amostra geral (últimas 100)
    rawLinesGeneral.push({ timestamp: ts, line: rawLine });
    if (rawLinesGeneral.length > MAX_RAW_GENERAL) rawLinesGeneral.splice(0, rawLinesGeneral.length - MAX_RAW_GENERAL);

    // Amostra relevante (últimas 200)
    if (isRelevantRawLine(rawLine)) {
      rawLinesRelevant.push({ timestamp: ts, line: rawLine });
      if (rawLinesRelevant.length > MAX_RAW_RELEVANT) rawLinesRelevant.splice(0, rawLinesRelevant.length - MAX_RAW_RELEVANT);
    }

    // Contador RAW de USERNOTICE (string-based)
    if (rawLine.includes(' USERNOTICE ')) {
      state = { ...state, rawUsernoticeCount: state.rawUsernoticeCount + 1 };
    }

    // Contadores RAW de msg-id (string-based, extraído por regex da string bruta)
    const msgIdMatch = rawLine.match(/msg-id=([^\s;]+)/);
    if (msgIdMatch) {
      const rawMsgId = msgIdMatch[1];
      const key = RAW_MSG_ID_KEYS.includes(rawMsgId) ? rawMsgId : 'other';
      state = {
        ...state,
        rawMsgIdCounts: { ...state.rawMsgIdCounts, [key]: state.rawMsgIdCounts[key] + 1 },
      };
    }

    // Contador RAW de bits (PRIVMSG com bits=)
    if (rawLine.includes('PRIVMSG') && rawLine.includes('bits=')) {
      state = { ...state, rawBitsCount: state.rawBitsCount + 1 };
    }

    // CAP ACK (resposta do servidor: :tmi.twitch.tv CAP * ACK :capabilities)
    if (rawLine.includes('CAP * ACK')) {
      state = { ...state, capAck: true, capAckLine: rawLine };
    }
    // CAP NAK
    if (rawLine.includes('CAP * NAK')) {
      state = { ...state, capNak: true, capNakLine: rawLine };
    }

    // 001 (Welcome)
    if (rawLine.includes(' 001 ')) {
      state = { ...state, line001: rawLine };
    }
  },

  // Registro passivo do CAP enviado (chamado em socket.send do CAP REQ)
  recordCapSent(line) {
    state = { ...state, capSent: true, capSentLine: line || null };
    pushHistory('CAP', { action: 'sent', resumo: line ? line.slice(0, 200) : null });
    emit();
  },

  // Registro passivo do JOIN enviado (chamado em socket.send do JOIN)
  recordJoinSent(channel) {
    state = { ...state, joinSent: true, joinChannel: channel || null };
    pushHistory('JOIN', { action: 'sent', resumo: channel ? `#${channel}` : null });
    emit();
  },

  incRawUsernotice(rawLine) {
    state = {
      ...state,
      rawUsernoticeTotal: state.rawUsernoticeTotal + 1,
      lastRawUsernoticeAt: new Date().toISOString(),
      lastRawUsernotice: rawLine ? rawLine.slice(0, 500) : state.lastRawUsernotice,
    };
    pushHistory('USERNOTICE', { action: 'raw', resumo: rawLine ? rawLine.slice(0, 200) : null });
    emit();
  },

  // CAPTURA RAW USERNOTICE COMPLETO — chamada após o parser processar o USERNOTICE.
  // rawLine é COMPLETA (sem truncamento). Dados do parser são anexados para comparação.
  incRawUsernoticeFull(rawLine, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      rawLine: rawLine || '',
      command: data.command || null,
      msgId: data.msgId || null,
      eventType: data.eventType || null,
      eventMeta: data.eventMeta || null,
      emitted: data.emitted === true,
    };
    rawUsernoticeFull.push(entry);
    if (rawUsernoticeFull.length > MAX_RAW_USERNOTICE) rawUsernoticeFull.splice(0, rawUsernoticeFull.length - MAX_RAW_USERNOTICE);
  },

  incMsgId(msgId) {
    const key = Object.prototype.hasOwnProperty.call(state.msgIdCounts, msgId) ? msgId : 'other';
    state = {
      ...state,
      msgIdCounts: { ...state.msgIdCounts, [key]: state.msgIdCounts[key] + 1 },
      lastMsgId: msgId,
      lastMsgIdAt: new Date().toISOString(),
    };
    pushHistory('MSG_ID', { action: 'msg_id', msgId });
    emit();
  },

  incEmitted(eventType, count) {
    state = {
      ...state,
      usernoticeEmittedTotal: state.usernoticeEmittedTotal + 1,
      lastEmittedEventType: eventType,
      lastEmittedCount: count ?? null,
      lastEmittedAt: new Date().toISOString(),
    };
    pushHistory('PARSER_EMITTED', { action: 'emitted', eventType, count: count ?? null });
    emit();
  },

  incBridge(msg) {
    const hasEvent = !!msg?.eventType;
    state = {
      ...state,
      twitchBridgeTotal: state.twitchBridgeTotal + 1,
      twitchBridgeEventTotal: state.twitchBridgeEventTotal + (hasEvent ? 1 : 0),
      lastBridgeEventType: hasEvent ? msg.eventType : state.lastBridgeEventType,
      lastBridgeCount: hasEvent ? (msg.eventMeta?.count ?? null) : state.lastBridgeCount,
      lastBridgeAt: new Date().toISOString(),
    };
    if (hasEvent) pushHistory('BRIDGE', { action: 'bridge', platform: 'Twitch', eventType: msg.eventType, count: msg.eventMeta?.count ?? null });
    emit();
  },

  incReceive(platform, msg) {
    const isTwitch = platform === 'Twitch';
    const hasEvent = !!msg?.eventType;
    state = {
      ...state,
      receiveTotal: state.receiveTotal + 1,
      receiveTwitchTotal: state.receiveTwitchTotal + (isTwitch ? 1 : 0),
      receiveTwitchEventTotal: state.receiveTwitchEventTotal + (isTwitch && hasEvent ? 1 : 0),
      lastReceiveEventType: isTwitch && hasEvent ? msg.eventType : state.lastReceiveEventType,
      lastReceiveCount: isTwitch && hasEvent ? (msg.eventMeta?.count ?? null) : state.lastReceiveCount,
      lastReceiveAt: isTwitch ? new Date().toISOString() : state.lastReceiveAt,
    };
    if (hasEvent) pushHistory('RECEIVE', { action: 'receive', platform, eventType: msg.eventType, count: msg.eventMeta?.count ?? null, author: msg?.author || null });
    emit();
  },

  incNormalized(item) {
    const isTwitch = item?.platform === 'Twitch';
    const hasEvent = !!item?.eventType;
    state = {
      ...state,
      normalizedTwitchTotal: state.normalizedTwitchTotal + (isTwitch ? 1 : 0),
      normalizedTwitchEventTotal: state.normalizedTwitchEventTotal + (isTwitch && hasEvent ? 1 : 0),
      lastNormalizedEventType: isTwitch && hasEvent ? item.eventType : state.lastNormalizedEventType,
      lastNormalizedCount: isTwitch && hasEvent ? (item.eventMeta?.count ?? null) : state.lastNormalizedCount,
      lastNormalizedAt: isTwitch ? new Date().toISOString() : state.lastNormalizedAt,
      lastNormalizedId: isTwitch ? item.id : state.lastNormalizedId,
    };
    if (hasEvent) pushHistory('NORMALIZED', { action: 'normalized', platform: item?.platform || null, eventType: item.eventType, count: item.eventMeta?.count ?? null, author: item?.author || null, id: item?.id || null });
    emit();
  },

  incLiveActivity(item) {
    const hasEvent = !!item?.eventType;
    state = {
      ...state,
      liveActivityUpdateTotal: state.liveActivityUpdateTotal + 1,
      liveActivityEventUpdateTotal: state.liveActivityEventUpdateTotal + (hasEvent ? 1 : 0),
      lastLiveActivityEventType: hasEvent ? item.eventType : state.lastLiveActivityEventType,
      lastLiveActivityCount: hasEvent ? (item.eventMeta?.count ?? null) : state.lastLiveActivityCount,
      lastLiveActivityAt: new Date().toISOString(),
      lastLiveActivityId: item.id,
    };
    if (hasEvent) pushHistory('LIVE_ACTIVITY', { action: 'live_activity', platform: item?.platform || null, eventType: item.eventType, count: item.eventMeta?.count ?? null, author: item?.author || null, id: item?.id || null });
    emit();
  },

  reset() {
    state = { ...initial, msgIdCounts: { ...initial.msgIdCounts }, rawMsgIdCounts: emptyRawMsgIdCounts() };
    history = [];
    rawLinesGeneral = [];
    rawLinesRelevant = [];
    rawUsernoticeFull = [];
    lastResetAt = new Date().toISOString();
    emit();
  },
};

// --- Serialização do relatório completo em texto puro ---
function fmtTime(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('pt-BR'); } catch { return String(iso); }
}

function buildReport(liveActivity, messages) {
  const s = getSnapshot();
  const hist = getHistory();
  const la = liveActivity || {};
  const items = la.items || [];
  const lastMessage = la.lastMessage || null;
  const lastEvent = la.lastEvent || null;
  const recent5 = items.slice(0, 5);
  const msgs = Array.isArray(messages) ? messages : [];
  const rawGen = twitchPipelineDiagnostic.getRawLinesGeneral();
  const rawRel = twitchPipelineDiagnostic.getRawLinesRelevant();
  const rawUnf = twitchPipelineDiagnostic.getRawUsernoticeFull();

  const L = [];
  L.push('LIVENEXUS — RELATÓRIO DIAGNÓSTICO COMPLETO');
  L.push('');
  L.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
  L.push(`Início da sessão: ${fmtTime(twitchPipelineDiagnostic.getSessionStartedAt())}`);
  L.push(`Último reset: ${fmtTime(twitchPipelineDiagnostic.getLastResetAt())}`);
  L.push('');
  L.push('============================================================');
  L.push('1. TWITCH PIPELINE DIAGNOSTIC');
  L.push('============================================================');
  L.push('');
  L.push('CONEXÃO');
  L.push(`- Socket Opens: ${s.socketOpenCount}`);
  L.push(`- Raw Lines: ${s.rawLinesTotal}`);
  L.push(`- Last Raw Line Time: ${fmtTime(s.lastRawLineAt)}`);
  L.push('');
  L.push('USERNOTICE');
  L.push(`- Raw USERNOTICE: ${s.rawUsernoticeTotal}`);
  L.push(`- Last USERNOTICE Time: ${fmtTime(s.lastRawUsernoticeAt)}`);
  L.push(`- Last msg-id: ${s.lastMsgId || '—'}`);
  L.push(`- Last msg-id Time: ${fmtTime(s.lastMsgIdAt)}`);
  L.push(`- Last Raw Line (até 500 chars): ${s.lastRawUsernotice || '—'}`);
  L.push('');
  L.push('MSG-ID COUNTERS (parser-based)');
  L.push(`- sub: ${s.msgIdCounts.sub}`);
  L.push(`- resub: ${s.msgIdCounts.resub}`);
  L.push(`- subgift: ${s.msgIdCounts.subgift}`);
  L.push(`- anonsubgift: ${s.msgIdCounts.anonsubgift}`);
  L.push(`- submysterygift: ${s.msgIdCounts.submysterygift}`);
  L.push(`- anonsubmysterygift: ${s.msgIdCounts.anonsubmysterygift}`);
  L.push(`- raid: ${s.msgIdCounts.raid}`);
  L.push(`- announcement: ${s.msgIdCounts.announcement}`);
  L.push(`- other: ${s.msgIdCounts.other}`);
  L.push('');
  L.push('PARSER');
  L.push(`- USERNOTICE Emitted: ${s.usernoticeEmittedTotal}`);
  L.push(`- Last Event Type: ${s.lastEmittedEventType || '—'}`);
  L.push(`- Last Count: ${s.lastEmittedCount ?? '—'}`);
  L.push(`- Last Emitted Time: ${fmtTime(s.lastEmittedAt)}`);
  L.push('');
  L.push('BRIDGE');
  L.push(`- Total: ${s.twitchBridgeTotal}`);
  L.push(`- Events: ${s.twitchBridgeEventTotal}`);
  L.push(`- Last Event Type: ${s.lastBridgeEventType || '—'}`);
  L.push(`- Last Count: ${s.lastBridgeCount ?? '—'}`);
  L.push(`- Last Time: ${fmtTime(s.lastBridgeAt)}`);
  L.push('');
  L.push('RECEIVE');
  L.push(`- Total: ${s.receiveTotal}`);
  L.push(`- Twitch Total: ${s.receiveTwitchTotal}`);
  L.push(`- Twitch Events: ${s.receiveTwitchEventTotal}`);
  L.push(`- Last Event Type: ${s.lastReceiveEventType || '—'}`);
  L.push(`- Last Count: ${s.lastReceiveCount ?? '—'}`);
  L.push(`- Last Time: ${fmtTime(s.lastReceiveAt)}`);
  L.push('');
  L.push('NORMALIZED');
  L.push(`- Twitch Total: ${s.normalizedTwitchTotal}`);
  L.push(`- Twitch Events: ${s.normalizedTwitchEventTotal}`);
  L.push(`- Last Event Type: ${s.lastNormalizedEventType || '—'}`);
  L.push(`- Last Count: ${s.lastNormalizedCount ?? '—'}`);
  L.push(`- Last ID: ${s.lastNormalizedId || '—'}`);
  L.push(`- Last Time: ${fmtTime(s.lastNormalizedAt)}`);
  L.push('');
  L.push('LIVE ACTIVITY');
  L.push(`- Update Total: ${s.liveActivityUpdateTotal}`);
  L.push(`- Event Update Total: ${s.liveActivityEventUpdateTotal}`);
  L.push(`- Last Event Type: ${s.lastLiveActivityEventType || '—'}`);
  L.push(`- Last Count: ${s.lastLiveActivityCount ?? '—'}`);
  L.push(`- Last ID: ${s.lastLiveActivityId || '—'}`);
  L.push(`- Last Time: ${fmtTime(s.lastLiveActivityAt)}`);
  L.push('');
  L.push('============================================================');
  L.push('2. LIVEACTIVITY DIAGNÓSTICO TEMPORÁRIO');
  L.push('============================================================');
  L.push('');
  L.push(`items (total): ${items.length} / 200`);
  L.push('');
  L.push('LAST MESSAGE');
  if (lastMessage) {
    L.push(`- id: ${lastMessage.id || '—'}`);
    L.push(`- platform: ${lastMessage.platform || '—'}`);
    L.push(`- author: ${lastMessage.author || '—'}`);
    L.push(`- text: ${(lastMessage.text || '').slice(0, 300)}`);
    L.push(`- eventType: ${lastMessage.eventType || '—'}`);
    L.push(`- timestamp: ${lastMessage.time || '—'}`);
  } else {
    L.push('- (nenhuma mensagem)');
  }
  L.push('');
  L.push('LAST EVENT');
  if (lastEvent) {
    L.push(`- id: ${lastEvent.id || '—'}`);
    L.push(`- platform: ${lastEvent.platform || '—'}`);
    L.push(`- author: ${lastEvent.author || '—'}`);
    L.push(`- eventType: ${lastEvent.eventType || '—'}`);
    L.push(`- count: ${lastEvent.eventMeta?.count ?? '—'}`);
    L.push(`- timestamp: ${lastEvent.time || '—'}`);
    L.push(`- eventMeta: ${JSON.stringify(lastEvent.eventMeta || {})}`);
  } else {
    L.push('- (nenhum evento)');
  }
  L.push('');
  L.push('ÚLTIMOS 5 ITENS');
  if (recent5.length === 0) {
    L.push('- (nenhum item)');
  } else {
    recent5.forEach((it, i) => {
      L.push(`${i + 1}. [${it.platform || '—'}] ${it.author || '—'}${it.eventType ? ' · ' + it.eventType : ''} — ${(it.text || '').slice(0, 200)}`);
      L.push(`   id: ${it.id || '—'} | time: ${it.time || '—'}${it.eventMeta ? ' | eventMeta: ' + JSON.stringify(it.eventMeta) : ''}`);
    });
  }
  L.push('');
  L.push('============================================================');
  L.push('3. HISTÓRICO DA SESSÃO');
  L.push('============================================================');
  L.push('');
  if (hist.length === 0) {
    L.push('(nenhum registro)');
  } else {
    hist.forEach((h) => {
      const parts = [`[${h.timestamp}]`, `[${h.stage}]`, h.action || '—'];
      if (h.platform) parts.push(`platform=${h.platform}`);
      if (h.msgId) parts.push(`msg-id=${h.msgId}`);
      if (h.eventType) parts.push(`eventType=${h.eventType}`);
      if (h.count != null) parts.push(`count=${h.count}`);
      if (h.author) parts.push(`author=${h.author}`);
      if (h.id) parts.push(`id=${h.id}`);
      if (h.resumo) parts.push(`resumo=${h.resumo}`);
      L.push(parts.join(' '));
    });
  }
  L.push('');
  L.push(`Total de registros no histórico: ${hist.length} / ${MAX_HISTORY}`);
  L.push('');
  L.push('============================================================');
  L.push('4. LOGS TEMPORÁRIOS (LogsSection — mensagens recebidas)');
  L.push('============================================================');
  L.push('');
  L.push(`Total de mensagens: ${msgs.length}`);
  L.push('');
  if (msgs.length === 0) {
    L.push('(nenhuma mensagem)');
  } else {
    msgs.forEach((m, i) => {
      const blocked = m.blocked ? ` [BLOCKED: ${m.blockReason || ''}]` : '';
      L.push(`${i + 1}. [${m.time || '--:--:--'}] [${m.platform || '—'}] ${m.author || '—'}: ${m.text || ''}${blocked}`);
    });
  }
  L.push('');
  L.push('============================================================');
  L.push('5. RAW IRC — RESUMO');
  L.push('============================================================');
  L.push('');
  L.push(`- Total Raw Lines: ${s.rawLinesTotal}`);
  L.push(`- Raw USERNOTICE (string-based): ${s.rawUsernoticeCount}`);
  L.push(`- Raw Bits (PRIVMSG com bits=): ${s.rawBitsCount}`);
  L.push('');
  L.push('RAW MSG-ID COUNTERS (string-based, independentes do parser)');
  L.push(`- sub: ${s.rawMsgIdCounts.sub}`);
  L.push(`- resub: ${s.rawMsgIdCounts.resub}`);
  L.push(`- subgift: ${s.rawMsgIdCounts.subgift}`);
  L.push(`- anonsubgift: ${s.rawMsgIdCounts.anonsubgift}`);
  L.push(`- submysterygift: ${s.rawMsgIdCounts.submysterygift}`);
  L.push(`- anonsubmysterygift: ${s.rawMsgIdCounts.anonsubmysterygift}`);
  L.push(`- raid: ${s.rawMsgIdCounts.raid}`);
  L.push(`- announcement: ${s.rawMsgIdCounts.announcement}`);
  L.push(`- viewermilestone: ${s.rawMsgIdCounts.viewermilestone}`);
  L.push(`- other: ${s.rawMsgIdCounts.other}`);
  L.push('');
  L.push('CAP / 001 / JOIN');
  L.push(`- CAP Sent: ${s.capSent ? 'sim' : 'não'}`);
  L.push(`- CAP Sent Line: ${s.capSentLine || '—'}`);
  L.push(`- CAP ACK: ${s.capAck ? 'sim' : 'não'}`);
  L.push(`- CAP ACK Line: ${s.capAckLine || '—'}`);
  L.push(`- CAP NAK: ${s.capNak ? 'sim' : 'não'}`);
  L.push(`- CAP NAK Line: ${s.capNakLine || '—'}`);
  L.push(`- 001 Line: ${s.line001 || '—'}`);
  L.push(`- JOIN Sent: ${s.joinSent ? 'sim' : 'não'}`);
  L.push(`- JOIN Channel: ${s.joinChannel ? '#' + s.joinChannel : '—'}`);
  L.push('');
  L.push('============================================================');
  L.push('6. RAW IRC — ÚLTIMAS LINHAS GERAIS');
  L.push('============================================================');
  L.push('');
  L.push(`Total armazenado: ${rawGen.length} / ${MAX_RAW_GENERAL}`);
  L.push('');
  if (rawGen.length === 0) {
    L.push('(nenhuma linha)');
  } else {
    rawGen.forEach((r, i) => {
      L.push(`${i + 1}. [${r.timestamp}] ${r.line}`);
    });
  }
  L.push('');
  L.push('============================================================');
  L.push('7. RAW IRC — LINHAS RELEVANTES');
  L.push('============================================================');
  L.push('');
  L.push(`Total armazenado: ${rawRel.length} / ${MAX_RAW_RELEVANT}`);
  L.push('');
  if (rawRel.length === 0) {
    L.push('(nenhuma linha)');
  } else {
    rawRel.forEach((r, i) => {
      L.push(`${i + 1}. [${r.timestamp}] ${r.line}`);
    });
  }
  L.push('');
  L.push('============================================================');
  L.push('8. RAW USERNOTICE COMPLETO');
  L.push('============================================================');
  L.push('');
  L.push(`Total armazenado: ${rawUnf.length} / ${MAX_RAW_USERNOTICE}`);
  L.push('');
  if (rawUnf.length === 0) {
    L.push('(nenhum USERNOTICE)');
  } else {
    rawUnf.forEach((r, i) => {
      L.push(`--- USERNOTICE ${i + 1} ---`);
      L.push(`timestamp: ${r.timestamp}`);
      L.push(`command: ${r.command || '—'}`);
      L.push(`msg-id: ${r.msgId || '—'}`);
      L.push(`eventType: ${r.eventType || '—'}`);
      L.push(`eventMeta: ${r.eventMeta ? JSON.stringify(r.eventMeta) : '—'}`);
      L.push(`emitted (chegou ao onMessage): ${r.emitted ? 'sim' : 'não'}`);
      L.push(`rawLine COMPLETA:`);
      L.push(r.rawLine || '(vazia)');
      L.push('');
    });
  }
  L.push('============================================================');
  L.push('9. COMPARAÇÃO RAW x PARSER');
  L.push('============================================================');
  L.push('');
  L.push('Comparação de contadores RAW (string-based) vs PARSER (parseIrcLine):');
  L.push('');
  const compareKeys = ['sub', 'resub', 'subgift', 'anonsubgift', 'submysterygift', 'anonsubmysterygift', 'raid', 'announcement'];
  compareKeys.forEach((k) => {
    const raw = s.rawMsgIdCounts[k] ?? 0;
    const parser = s.msgIdCounts[k] ?? 0;
    const diff = raw - parser;
    const flag = diff !== 0 ? ' *** DIFERENÇA ***' : '';
    L.push(`- msg-id=${k}: raw=${raw} | parser=${parser} | diff=${diff}${flag}`);
  });
  L.push(`- viewermilestone: raw=${s.rawMsgIdCounts.viewermilestone} | parser=(não tratado pelo parser, cai em other=${s.msgIdCounts.other})`);
  L.push('');
  L.push(`- USERNOTICE: raw (string-based)=${s.rawUsernoticeCount} | parser (incRawUsernotice)=${s.rawUsernoticeTotal} | emitted (incEmitted)=${s.usernoticeEmittedTotal}`);
  L.push('');
  L.push('============================================================');
  L.push('10. ESTADO ATUAL');
  L.push('============================================================');
  L.push('');
  L.push('--- Pipeline Diagnostic State ---');
  L.push(JSON.stringify(s, null, 2));
  L.push('');
  L.push('--- liveActivity Summary ---');
  L.push(JSON.stringify({
    itemsCount: items.length,
    lastMessage: lastMessage ? { id: lastMessage.id, platform: lastMessage.platform, author: lastMessage.author, eventType: lastMessage.eventType, text: (lastMessage.text || '').slice(0, 200), time: lastMessage.time } : null,
    lastEvent: lastEvent ? { id: lastEvent.id, platform: lastEvent.platform, author: lastEvent.author, eventType: lastEvent.eventType, eventMeta: lastEvent.eventMeta, time: lastEvent.time } : null,
    recent5: recent5.map(it => ({ id: it.id, platform: it.platform, author: it.author, eventType: it.eventType, eventMeta: it.eventMeta, text: (it.text || '').slice(0, 150), time: it.time })),
  }, null, 2));
  L.push('');
  L.push('--- Histórico Completo ---');
  L.push(JSON.stringify(hist, null, 2));
  L.push('');
  L.push('--- Raw Lines General (JSON) ---');
  L.push(JSON.stringify(rawGen, null, 2));
  L.push('');
  L.push('--- Raw Lines Relevant (JSON) ---');
  L.push(JSON.stringify(rawRel, null, 2));
  L.push('');
  L.push('--- Raw USERNOTICE Full (JSON) ---');
  L.push(JSON.stringify(rawUnf, null, 2));
  L.push('');
  L.push('============================================================');
  L.push('FIM DO RELATÓRIO');
  L.push('============================================================');

  return L.join('\n');
}

export { twitchPipelineDiagnostic, buildReport };
export default twitchPipelineDiagnostic;