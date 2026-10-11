
 // Provider global de streaming + TTS. Montado UMA vez acima das telas internas
// autenticadas (layout route em App.jsx). Sobrevive à troca de activeSection e
// entre telas do painel; só desmonta no logout / redirect de auth / saída da rota.
//
// ZERA integration credits: usa apenas fetch aos Workers Cloudflare + speechSynthesis nativo.
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import { authClient } from '@dashboard/login/authClient';
import { Outlet } from 'react-router-dom';
import { connectKick } from '@dashboard/configuracao/Config_kickChat';
import { connectTwitch } from '@dashboard/configuracao/Config_twitchChat';
import { connectYouTube } from '@dashboard/configuracao/Config_youtubeLive';
import { twitchPipelineDiagnostic } from '@dashboard/painel-admin/Admin_twitchPipelineDiagnostic';
import { channelVerify } from '@dashboard/configuracao/Config_channelVerify';
import { diag, pushError, setVisibility, pushTtsEvent, resetBacklogQueue } from '@dashboard/painel-admin/Admin_streamingDiagnostics';
import { loadFilterConfig, saveFilterConfig, resolveRules, normalizeText } from '@dashboard/configuracao/Config_filterConfig';
import { applyPipeline, resetFilterState } from '@dashboard/configuracao/Config_filterEngine';
import { checkAntiFlood, resetAntiFlood } from '@dashboard/configuracao/Config_antiFlood';
import { checkCooldown, checkDedup, checkFlood, resetAntiSpam } from '@dashboard/configuracao/Config_antiSpam';
import { updateCongestionState, roleTier, cooldownMultiplier, admitByRole, resetCongestion, getCongestionState, getCongestionHistory } from '@dashboard/configuracao/Config_congestionControl';
import { startCapture, stopCapture, stopAllCapture, isInitialBacklog } from '@dashboard/painel-admin/Admin_freshStart';
import * as ttsScheduler from '@dashboard/configuracao/TTS_ttsScheduler';
import { applyReadingFilter, getReadingFilterConfig } from '@dashboard/configuracao/TTS_ttsReadingFilter';
import { onTtsStart, onTtsEnd } from '@dashboard/biblioteca/TTS_ttsMusicIntegration';
import { liveSessionService } from '@dashboard/configuracao/Config_liveSessionService';
import { recordFilter, recordEnqueued, recordDropped, recordFilterInto, recordEnqueuedInto, recordDroppedInto, filterDiag } from '@dashboard/configuracao/Config_filterDiagnostics';
import { generateEventText } from '@dashboard/configuracao/Config_eventText';
import { RtcAutoPublisherBridge } from '@dashboard/conexao/rtc/RtcAutoPublisherBridge';

// BYPASS TEMPORÁRIO (teste em live movimentada): quando true, todas as proteções do
// pipeline de chat (filtros de bloqueio, queue limit, anti-flood, char limit, fresh
// start, anti-spam, dedup, congestion control) são ignoradas — o item normalizado
// flui para liveActivity, messages, chat bridge e TTS sem descarte intermediário.
// Para reativar todas as proteções: mudar para false.
const CHAT_PROTECTIONS_BYPASS = true;

export const PLATFORMS = ['Twitch', 'Kick', 'YouTube'];

// Estados que representam uma sessão ativa ou em recuperação.
// Usado por UI e lógica para impedir conexão concorrente. NÃO bloqueia payload.
export const ACTIVE_CONNECTION_STATES = new Set(['connected', 'connecting', 'reconnecting', 'rate_limited']);
export const isConnectionActive = (status) => ACTIVE_CONNECTION_STATES.has(status);

const initial = Object.fromEntries(PLATFORMS.map(name => [name, { channel: '', status: 'idle', error: '', viewers: null }]));
const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// --- Histórico "Últimas Lives" (Central, máx 4, sem backend) ---
// Central é a fonte ativa (raiz do usuário). Fallback à chave legada só na migração.
const LIVES_KEY = 'livenexus:last-lives';
const MAX_LIVES = 4;
function loadPastLives() {
  try { const raw = localStorage.getItem(LIVES_KEY); const arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr.slice(0, MAX_LIVES) : []; } catch { return []; }
}
function savePastLives(list) {
  try { localStorage.setItem(LIVES_KEY, JSON.stringify(list.slice(0, MAX_LIVES))); } catch {}
}

const TTS_SETTINGS_KEY = 'livenexus:tts-settings-v1';

function loadInitialTtsSettings() {
  const defaults = {
    engine: 'web_speech',
    voice: '',
    rate: 1,
    volume: 1,
    pitch: 1,
    delay: 0,
    speakInterval: 0,
    maxChars: 200,
    charMode: 'cut',
    antiFlood: true,
    repeatLimit: 2,
    adaptiveQueue: true,
    cooldownMs: 3000,
    dedupWindowMs: 10000,
    busyThreshold: 15000,
    congestedThreshold: 20000,
    criticalThreshold: 60000
  };
  try {
    const raw = localStorage.getItem(TTS_SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}


export const StreamingContext = createContext(null);

export function StreamingProvider({ children }) {
  const central = useNewUserDataCentral();
  const [connections, setConnections] = useState(initial);
  const [messages, setMessages] = useState([]);
  const [voices, setVoices] = useState([]);
  const [test, setTest] = useState('Olá, este é um teste de voz.');
  const [speaking, setSpeaking] = useState(true);
  const [ttsCount, setTtsCount] = useState(0);
  const [speakerCounts, setSpeakerCounts] = useState({});
  const [pastLives, setPastLives] = useState(() => loadPastLives());
  const [linkedChannels, setLinkedChannels] = useState({});
  const [settings, setSettings] = useState(() => loadInitialTtsSettings());
  const [filterConfig, setFilterConfig] = useState(() => loadFilterConfig());
  const [liveActivity, setLiveActivity] = useState({ items: [], lastMessage: null, lastEvent: null });
  const [streamMeta, setStreamMeta] = useState({});
  useEffect(() => { saveFilterConfig(filterConfig); }, [filterConfig]);

  // Telemetria TTS da sessão atual (B.4.2). Contadores cumulativos; fila/delay
  // são lidos do ref utterances.current em tempo real pelo componente.
  const [ttsTelemetry, setTtsTelemetry] = useState({ received: 0, spoken: 0, filtered: 0, admitted: 0, congestionState: 'NORMAL', discardReasons: { ANTI_FLOOD_REPEAT: 0, CHARACTER_LIMIT: 0, FILTERED_BY_ROLE: 0, USER_COOLDOWN: 0, DUPLICATE: 0, FLOOD: 0, CONGESTION: 0, INITIAL_BACKLOG: 0, BLOCKED_TRIGGER: 0 } });
  // FASE 5 (auditoria pós-stress): ref espelho para snapshot atômico na telemetria.
  // Permite que getTtsTelemetrySnapshot() leia contadores + scheduler no mesmo instante.
  const ttsTelemetryRef = useRef(ttsTelemetry);
  ttsTelemetryRef.current = ttsTelemetry;

  // FASE 3: Admin test override — runtime-only, NÃO persistido.
  // Estado separado do identificador oficial (linkedChannels / connections.channel).
  // NÃO reutiliza linkedChannel/profileChannel/savedChannel — é runtime-only.
  const [adminTestIdentity, setAdminTestIdentity] = useState({});
  const [adminTestMode, setAdminTestMode] = useState({});
  const connectionSourceRef = useRef({}); // 'linked_channel' | 'admin_override' | null
  const testFilterConfigRef = useRef(null); // Lab1 Gatilhos: override temporário para testes via pipeline

  const sockets = useRef({});
  const settingsRef = useRef(settings); settingsRef.current = settings;
  const voicesRef = useRef(voices); voicesRef.current = voices;
  const speakingRef = useRef(speaking); speakingRef.current = speaking;
  const utterances = useRef([]);
  const speakSourceByMsgId = useRef(new Map()); // diagnosticMessageId -> source ('production' | 'manual_test' | 'lab')
  const labSpeechStartCallback = useRef(null);
  // Debounce para reiniciar a utterance atual quando rate/volume/pitch mudam
  // durante a fala — evita churn ao arrastar o slider (step fino 0.01).
  const restartDebounceRef = useRef(null);
  const liveMetaRef = useRef({});   // meta da live ativa por plataforma
  const connectedRef = useRef({});  // esteve conectado (live ativa) por plataforma
  const captureStartedRef = useRef({}); // fresh start TTS: baseline por plataforma

  const liveActivityRef = useRef(liveActivity);
  liveActivityRef.current = liveActivity;
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;
  const streamMetaRef = useRef(streamMeta);
  streamMetaRef.current = streamMeta;

  const syncChannelRef = useRef(null);

  // Sincronização local entre abas via BroadcastChannel (para cenários e overlays)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('livenexus_local_streaming_sync');
      syncChannelRef.current = channel;

      // Solicita o estado das conexões e atividade caso esta aba tenha acabado de abrir
      channel.postMessage({ type: 'REQUEST_STREAMING_STATE' });

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'REQUEST_STREAMING_STATE') {
          // Apenas sincroniza se houver socket ativo nesta aba, evitando ecoar conexões fantasmas
          const verifiedConnections = { ...connectionsRef.current };
          for (const p of PLATFORMS) {
            if (verifiedConnections[p] && isConnectionActive(verifiedConnections[p].status) && !sockets.current[p]) {
              verifiedConnections[p] = { ...verifiedConnections[p], status: 'idle', viewers: null };
            }
          }
          channel.postMessage({
            type: 'STREAMING_STATE_SYNC',
            connections: verifiedConnections,
            streamMeta: streamMetaRef.current,
            liveActivity: liveActivityRef.current
          });
        } else if (data.type === 'FORCE_DISCONNECT_ALL') {
          Object.values(sockets.current).forEach(s => { try { s?.disconnect ? s.disconnect() : s?.close?.(); } catch {} });
          sockets.current = {};
          liveMetaRef.current = {};
          connectedRef.current = {};
          setAdminTestMode({});
          connectionSourceRef.current = {};
          const next = {};
          for (const p of PLATFORMS) next[p] = { channel: '', status: 'idle', error: '', viewers: null };
          setConnections(next);
          setStreamMeta({});
        } else if (data.type === 'STREAMING_STATE_SYNC') {
          if (data.connections) setConnections(data.connections);
          if (data.streamMeta) setStreamMeta(data.streamMeta);
          if (data.liveActivity && Array.isArray(data.liveActivity.items)) {
            setLiveActivity(data.liveActivity);
          }
        } else if (data.type === 'NEW_LIVE_ACTIVITY') {
          if (data.item) {
            setLiveActivity(prev => ({
              items: [data.item, ...prev.items.filter(i => i.id !== data.item.id)].slice(0, 200),
              lastMessage: data.item.eventType ? prev.lastMessage : data.item,
              lastEvent: data.item.eventType ? data.item : prev.lastEvent,
            }));
          }
        } else if (data.type === 'CONNECTIONS_UPDATE') {
          if (data.connections) setConnections(data.connections);
        } else if (data.type === 'STREAM_META_UPDATE') {
          if (data.streamMeta) setStreamMeta(data.streamMeta);
        }
      };
    }

    return () => {
      syncChannelRef.current = null;
      if (channel) {
        try { channel.close(); } catch {}
      }
    };
  }, []);

  // Vozes + keep-alive do speechSynthesis (Chrome pausa após ~15s).
  useEffect(() => {
    diag.TTS.queueInstancesCreated++;
    const load = () => setVoices(speechSynthesis.getVoices());
    load(); speechSynthesis.onvoiceschanged = load;
    const ka = setInterval(() => { if (speechSynthesis.speaking) speechSynthesis.resume(); }, 10000);
    return () => { clearInterval(ka); };
  }, []);

  // Visibility/online do documento para diagnóstico TTS (não afeta lógica).
  useEffect(() => {
    const onVis = () => { setVisibility(document.visibilityState); diag.App.online = navigator.onLine; };
    onVis();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onVis);
    window.addEventListener('offline', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('online', onVis); window.removeEventListener('offline', onVis); };
  }, []);

  // Recupera canais vinculados do JSON/CRUD ao carregar a página.
  useEffect(() => {
    (async () => {
      const linked = {};
      const merged = {};

      try {
        const res = await fetch('/api/plataformas', {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Erro HTTP ${res.status}`);
        }

        const data = await res.json();

        const source =
          data.plataformas ??
          data.records ??
          data.items ??
          data.data ??
          data;

        const rows = Array.isArray(source)
          ? source
          : source && typeof source === 'object'
            ? [source]
            : [];

        for (const row of rows) {
          if (!row || typeof row !== 'object') continue;

          // Formato com uma plataforma por registro.
          const platform = PLATFORMS.find(
            p => p.toLowerCase() === String(row.platform || '').toLowerCase()
          );

          if (platform && String(row.status || '').toLowerCase() === 'verified') {
            const channelIdentifier =
              row.channelIdentifier ||
              row.channel_handle ||
              row.channel_name ||
              row.channel_id;

            if (channelIdentifier) {
              merged[platform] = {
                status: 'verified',
                channelIdentifier,
                verificationProof: row.verificationProof || row.verification_code || '',
                verifiedAt: row.verifiedAt || row.verified_at || null,
                challengeKey: row.challengeKey || row.bio_link_code || '',
                channelUrl: row.channelUrl || null,
              };
            }
          }

          // Formato CRUD com colunas Twitch, Kick e YouTube.
          for (const p of PLATFORMS) {
            const key = p.toLowerCase();
            const channelIdentifier = row[key];
            const status = row[`${key}_status`] || row.status;

            if (
              channelIdentifier &&
              String(status || '').toLowerCase() === 'verified' &&
              !merged[p]
            ) {
              merged[p] = {
                status: 'verified',
                channelIdentifier,
                verificationProof:
                  row[`${key}_code`] ||
                  row[`${key}_verification_code`] ||
                  '',
                verifiedAt: row[`${key}_verified_at`] || row.verified_at || null,
                challengeKey: row[`${key}_bio_link_code`] || '',
                channelUrl: null,
              };
            }
          }
        }
      } catch (e) {
        console.error('[LIVENEXUS] Falha ao carregar canais do CRUD:', e);
      }

      // Compatibilidade com vinculações pendentes antigas.
      let pending = [];
      try {
        const raw = localStorage.getItem('livenexus:pending-channels');
        const parsed = raw ? JSON.parse(raw) : [];
        pending = Array.isArray(parsed) ? parsed : [];
      } catch {}

      for (const entry of pending) {
        if (!entry?.platform || merged[entry.platform]) continue;
        if (!PLATFORMS.includes(entry.platform)) continue;
        if (!entry.verificationProof) continue;

        try {
          const result = await channelVerify.validateProof(entry.verificationProof);

          if (result.valid) {
            merged[entry.platform] = {
              status: 'verified',
              channelIdentifier: result.channelIdentifier,
              verificationProof: entry.verificationProof,
              verifiedAt: result.verifiedAt,
              challengeKey: entry.challengeKey,
              channelUrl: entry.channelUrl,
            };
          }
        } catch (e) {
          console.error('[LIVENEXUS] Falha ao validar canal pendente:', e);
        }
      }

      for (const platform of PLATFORMS) {
        if (merged[platform]?.status === 'verified') {
          linked[platform] = merged[platform];
        }
      }

      setLinkedChannels(linked);

      setConnections(prev => {
        const next = { ...prev };

        for (const platform of PLATFORMS) {
          if (linked[platform]) {
            next[platform] = {
              ...next[platform],
              channel: linked[platform].channelIdentifier,
              error: '',
            };
          }
        }

        return next;
      });

      console.log('[LIVENEXUS] Canais recuperados do CRUD:', Object.keys(linked));
    })();
  }, []);


  // FASE 2B: speak() agora delega ao ttsScheduler em vez de chamar speechSynthesis.speak() diretamente.
  // A utterance só é criada e entregue ao browser quando o scheduler a seleciona (máx 1 por vez).
  // FASE 0: Delay agora é dinâmico — gerenciado pelo scheduler (timer único),
  // não mais por setTimeout por mensagem. Mensagens entram na fila imediatamente;
  // o delay é aplicado entre utterances no dispatch, lendo settingsRef.current.
  const speak = (text, meta = {}) => {
    const s = settingsRef.current;
    if (!speakingRef.current || !text.trim()) { diag.TTS.skipped++; return; }
    const limit = Number(s.maxChars) || 0;
    const body = limit > 0 ? text.slice(0, limit) : text;
    if (!body.trim()) { diag.TTS.skipped++; return; }
    const tier = roleTier(meta.roles || []);
    const src = meta.source || 'production';
    if (meta.diagnosticMessageId) speakSourceByMsgId.current.set(meta.diagnosticMessageId, src);
    ttsScheduler.enqueue({
      text: body, author: meta.author || null, authorId: meta.authorId || null,
      platform: meta.platform || null, tier, priority: meta.priority || 0,
      diagnosticMessageId: meta.diagnosticMessageId || null,
      eventType: meta.eventType || null, eventMeta: meta.eventMeta || null,
    });
    diag.TTS.enqueued++;
    if (src === 'production') diag.TTS.prodEnqueued++; else if (src === 'manual_test') diag.TTS.manualEnqueued++;
    pushTtsEvent({ stage: 'ENQUEUED', diagnosticMessageId: meta.diagnosticMessageId, platform: meta.platform, author: meta.author, text: body, source: src });
    ttsScheduler.dispatch();
  };

  // FASE 2B: Configura o scheduler com callbacks que criam a utterance e atualizam telemetria.
  useEffect(() => {
    ttsScheduler.configureScheduler({
      createUtterance: (msg) => {
        const s = settingsRef.current;
        // O fluxo utiliza o Web Speech nativo.
        const u = new SpeechSynthesisUtterance(msg.text);
        u.rate = s.rate; u.volume = s.volume; u.pitch = s.pitch;
        const v = voicesRef.current.find(x => x.name === s.voice) || null;
        u.voice = v; if (v) u.lang = v.lang; else u.lang = 'pt-BR';
        // Rastreia o charIndex da última boundary para reiniciar a fala a partir
        // do ponto atual quando rate/volume/pitch mudam durante a reprodução.
        u.onboundary = (ev) => { if (typeof ev.charIndex === 'number') u._lastCharIndex = ev.charIndex; };
        diag.TTS.selectedVoice = s.voice || null; diag.TTS.rate = s.rate; diag.TTS.pitch = s.pitch; diag.TTS.volume = s.volume; diag.TTS.delay = s.delay; diag.TTS.maxChars = s.maxChars;
        diag.TTS.currentMessage = msg.text; diag.TTS.currentAuthor = msg.author || null; diag.TTS.currentPlatform = msg.platform || null;
        return u;
      },
      onSpeechStart: (msg) => {
        try { onTtsStart(); } catch {}
        diag.TTS.speechStarts++; diag.TTS.lastSpeechStartAt = new Date().toISOString(); diag.TTS.speaking = true;
        const src = speakSourceByMsgId.current.get(msg.diagnosticMessageId) || 'production';
        if (src === 'production') diag.TTS.prodSpeechStarts++; else if (src === 'manual_test') diag.TTS.manualSpeechStarts++;
        if (src !== 'lab') { setTtsTelemetry(t => ({ ...t, spoken: t.spoken + 1 })); setTtsCount(c => c + 1); }
        if (src === 'lab' && labSpeechStartCallback.current) labSpeechStartCallback.current(msg);
        pushTtsEvent({ stage: 'SPEECH_STARTED', diagnosticMessageId: msg.diagnosticMessageId, platform: msg.platform, author: msg.author, text: msg.text, source: src });
      },
      onSpeechEnd: (msg) => {
        try { onTtsEnd(); } catch {}
        diag.TTS.spoken++; diag.TTS.lastSpoken = msg.text; diag.TTS.lastSpeechEndAt = new Date().toISOString();
        const src = speakSourceByMsgId.current.get(msg.diagnosticMessageId) || 'production';
        if (src === 'production') diag.TTS.prodSpoken++; else if (src === 'manual_test') diag.TTS.manualSpoken++;
        speakSourceByMsgId.current.delete(msg.diagnosticMessageId);
        diag.TTS.spokenHistory.push(msg.text); if (diag.TTS.spokenHistory.length > 50) diag.TTS.spokenHistory.shift();
        if (diag.TTS.currentMessage === msg.text) { diag.TTS.currentMessage = null; diag.TTS.currentAuthor = null; diag.TTS.currentPlatform = null; }
        pushTtsEvent({ stage: 'SPEECH_ENDED', diagnosticMessageId: msg.diagnosticMessageId, platform: msg.platform, author: msg.author, text: msg.text, source: src });
      },
      onSpeechError: (msg, ev) => {
        try { onTtsEnd(); } catch {}
        diag.TTS.errors++; diag.TTS.lastTtsError = 'utterance onerror'; diag.TTS.lastErrorEvent = ev?.error || null; diag.TTS.lastErrorCode = ev?.errorCode ?? null; diag.TTS.lastErrorAt = new Date().toISOString();
        const src = speakSourceByMsgId.current.get(msg.diagnosticMessageId) || 'production';
        if (src === 'production') diag.TTS.prodErrors++; else if (src === 'manual_test') diag.TTS.manualErrors++;
        speakSourceByMsgId.current.delete(msg.diagnosticMessageId);
        pushError({ platform: 'TTS', step: 'utterance.onerror', message: ev?.error || 'speech error', source: src });
        pushTtsEvent({ stage: 'SPEECH_ERROR', diagnosticMessageId: msg.diagnosticMessageId, platform: msg.platform, author: msg.author, text: msg.text, source: src });
      },
      // FASE 0: Delay dinâmico — scheduler lê o valor mais recente a cada dispatch.
      getDelay: () => (Number(settingsRef.current.delay) || 0) + (Number(settingsRef.current.speakInterval) || 0),
    });
  }, []);

  // Lab × Produção: opts.telemetry === false => executa pipeline real mas NÃO incrementa
  // filterDiag nem ttsTelemetry. opts.diagnostics (collector Lab) => grava no collector isolado.
  // opts.speak === false (Lab) => NÃO chama speak() — pipeline executa, decisão real, sem scheduler.
  // Default (sem opts) => production, registra normalmente em filterDiag, chama speak().
  const receive = (platform, raw, opts = {}) => {
    const isLab = opts.telemetry === false;
    const labEvent = isLab && opts.labEvent === true;
    const labCollector = isLab ? opts.diagnostics : null;
    const labNoSpeak = isLab && opts.speak === false;
    let data; try { data = JSON.parse(raw); } catch { data = { text: raw }; }
    twitchPipelineDiagnostic.incReceive(platform, { eventType: data.eventType, eventMeta: data.eventMeta });
    const text = data.text || data.message || data.content;
    if (!text && !data.eventType) return;
    const roles = Array.isArray(data.roles) ? data.roles : [];
    const item = { id: crypto.randomUUID(), platform, author: data.author || data.user || data.username || 'Chat', authorId: data.authorId || null, text: String(text || ''), roles, time: now(), source: isLab ? 'lab' : 'production', firstMsg: data.firstMsg === true, eventType: data.eventType || null, eventMeta: data.eventMeta || null, emotes: data.emotes || null };
    twitchPipelineDiagnostic.incNormalized(item);
    // liveActivity: alimenta a fonte compartilhada com o item real (apenas produção).
    // Ocorre ANTES de qualquer branch (widget command, filtros, TTS) para que TODO item
    // real entre na fonte, independentemente do destino final. Lab não contamina.
    if (!isLab) {
      twitchPipelineDiagnostic.incLiveActivity(item);
      setLiveActivity(prev => ({
        items: [item, ...prev.items.filter(i => i.id !== item.id)].slice(0, 200),
        lastMessage: item.eventType ? prev.lastMessage : item,
        lastEvent: item.eventType ? item : prev.lastEvent,
      }));
      try {
        if (syncChannelRef.current) {
          syncChannelRef.current.postMessage({ type: 'NEW_LIVE_ACTIVITY', item });
        } else if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const ch = new BroadcastChannel('livenexus_local_streaming_sync');
          ch.postMessage({ type: 'NEW_LIVE_ACTIVITY', item });
          ch.close();
        }
      } catch (e) {
        // ignore
      }
    }
    // Pipeline PRÉ-TTS. MODO LIVRE (rules=null) => bypass total, comportamento preservado.
    const rules = resolveRules(testFilterConfigRef.current || filterConfig, platform);
    const result = applyPipeline({ text: item.text, author: item.author, roles }, rules, platform);
    let finalDecision = result.decision;
    if (CHAT_PROTECTIONS_BYPASS) finalDecision = '__BYPASS__'; // sentinel: pula todos os blocos de proteção abaixo
    // Limite da fila: decisão de admissão contra a fila real (utterances em espera).
    // Lab (speak:false): NÃO executa side-effects destrutivos (cancel/limpar/resetBacklog).
    // Apenas SIMULA a decisão e registra a quantidade dropped no collector Lab.
    if (finalDecision === 'ALLOWED' && result.queueLimit?.enabled && result.queueLimit.max > 0) {
      const qLen = utterances.current.length;
      if (qLen >= result.queueLimit.max) {
        if (result.queueLimit.policy === 'reject') {
          finalDecision = 'BLOCKED_QUEUE_LIMIT';
        } else if (result.queueLimit.policy === 'drop_oldest') {
          const d = utterances.current.length;
          if (labNoSpeak) { if (labCollector) recordDroppedInto(labCollector, d); }
          else { speechSynthesis.cancel(); utterances.current = []; resetBacklogQueue(); if (!isLab) recordDropped(d); else if (labCollector) recordDroppedInto(labCollector, d); }
        } else if (result.queueLimit.policy === 'preserve_priority') {
          const minP = utterances.current.length ? Math.min(...utterances.current.map(u => u._priority || 0)) : 0;
          if (result.priority >= minP) {
            const d = utterances.current.length;
            if (labNoSpeak) { if (labCollector) recordDroppedInto(labCollector, d); }
            else { speechSynthesis.cancel(); utterances.current = []; resetBacklogQueue(); if (!isLab) recordDropped(d); else if (labCollector) recordDroppedInto(labCollector, d); }
          } else finalDecision = 'BLOCKED_QUEUE_LIMIT';
        }
      }
    }
    // B.4.3: Anti-flood por usuario (DEPOIS dos filtros existentes, ANTES do limite de caracteres).
    // Rastreia repeticao CONSECUTIVA por usuario. Mensagem diferente reinicia a sequencia.
    if (finalDecision === 'ALLOWED' && settings.antiFlood && settings.repeatLimit > 0) {
      const userKey = item.authorId || item.author || 'unknown';
      const normForFlood = normalizeText(result.text || item.text);
      if (!checkAntiFlood(userKey, normForFlood, settings.repeatLimit)) {
        finalDecision = 'ANTI_FLOOD_REPEAT';
      }
    }

    // B.4.3: Limite de caracteres (DEPOIS do anti-flood, ANTES do enqueue).
    // Modo CORTAR: trunca e nao conta como descartada. Modo IGNORAR: bloqueia e conta como descartada.
    let ttsText = result.text;
    if (finalDecision === 'ALLOWED' && settings.maxChars > 0 && ttsText.length > settings.maxChars) {
      if (settings.charMode === 'ignore') {
        finalDecision = 'CHARACTER_LIMIT';
      } else {
        ttsText = ttsText.slice(0, settings.maxChars);
      }
    }

    // FASE 4: Fresh Start TTS — mensagens anteriores ao baseline da sessão
    // não entram na fila TTS, mas aparecem no feed visual.
    // Ocorre ANTES do adaptive check para que backlog não afete o estado de congestionamento.
    if (finalDecision === 'ALLOWED' && isInitialBacklog(platform, { timestamp: data.timestamp, messageId: data.messageId })) {
      finalDecision = 'INITIAL_BACKLOG';
    }

    // FASE 1: Adaptive admission control + anti-spam (PRÉ-FILA).
    // Ocorre ANTES de recordEnqueued()/speak(). Mensagem rejeitada NÃO entra em utterances.current.
    // Proteção operacional — ativa independentemente do modo de filtros (free/custom).
    let congestionState = 'NORMAL';
    if (finalDecision === 'ALLOWED' && settingsRef.current.adaptiveQueue) {
      const s = settingsRef.current;
      const qs = getQueueStats();
      const queueDelayMs = qs.queueLength > 0 && qs.oldestQueuedAt ? Date.now() - qs.oldestQueuedAt : 0;
      // FASE 2: Passa queueLength para updateCongestionState garantir reset imediato
      // quando a fila está vazia.
      congestionState = updateCongestionState(queueDelayMs, s, qs.queueLength);
      const tier = roleTier(roles);
      const skipAntiSpam = tier === 'broadcaster' || tier === 'moderator';
      if (!skipAntiSpam) {
        const effectiveCooldown = Math.round(s.cooldownMs * cooldownMultiplier(congestionState));
        if (effectiveCooldown > 0 && !checkCooldown(platform, item.authorId, item.author, effectiveCooldown)) {
          finalDecision = 'USER_COOLDOWN';
        }
      }
      if (finalDecision === 'ALLOWED' && !checkDedup(ttsText, s.dedupWindowMs)) {
        finalDecision = 'DUPLICATE';
      }
      if (finalDecision === 'ALLOWED' && !checkFlood(ttsText)) {
        finalDecision = 'FLOOD';
      }
      if (finalDecision === 'ALLOWED' && !admitByRole(congestionState, tier)) {
        finalDecision = 'CONGESTION';
      }
    }

    if (finalDecision === '__BYPASS__') finalDecision = 'ALLOWED'; // restaura: item flui normalmente
    const blocked = finalDecision !== 'ALLOWED';
    // B.4.3: Mapeia decisao final -> motivo interno de descarte (para diagnostico futuro).
    let discardReason = null;
    if (blocked) {
      if (finalDecision === 'INITIAL_BACKLOG') discardReason = 'INITIAL_BACKLOG';
      else if (finalDecision === 'ANTI_FLOOD_REPEAT') discardReason = 'ANTI_FLOOD_REPEAT';
      else if (finalDecision === 'CHARACTER_LIMIT') discardReason = 'CHARACTER_LIMIT';
      else if (finalDecision === 'USER_COOLDOWN') discardReason = 'USER_COOLDOWN';
      else if (finalDecision === 'DUPLICATE') discardReason = 'DUPLICATE';
      else if (finalDecision === 'FLOOD') discardReason = 'FLOOD';
      else if (finalDecision === 'CONGESTION') discardReason = 'CONGESTION';
          else if (finalDecision === 'BLOCKED_TRIGGER') discardReason = 'BLOCKED_TRIGGER';
          else discardReason = 'FILTERED_BY_ROLE';
    }
    if (!isLab) recordFilter({ messageId: item.id, platform, author: item.author, decision: finalDecision, reason: blocked ? finalDecision : null, trigger: result.trigger }); else if (labCollector) recordFilterInto(labCollector, { messageId: item.id, platform, author: item.author, decision: finalDecision, reason: blocked ? finalDecision : null, trigger: result.trigger });
    if (!labEvent) {
      setMessages(v => [{ ...item, blocked, blockReason: blocked ? finalDecision : null, ttsAllowed: !blocked }, ...v].slice(0, 500));
    setSpeakerCounts(c => ({ ...c, [item.author]: (c[item.author] || 0) + 1 }));

    }
    if (!isLab) setTtsTelemetry(t => ({ ...t, received: t.received + 1, filtered: blocked ? t.filtered + 1 : t.filtered, admitted: blocked ? t.admitted : t.admitted + 1, congestionState, discardReasons: discardReason ? { ...t.discardReasons, [discardReason]: (t.discardReasons[discardReason] || 0) + 1 } : t.discardReasons }));
    // Lab (telemetry:false) NÃO incrementa backlog/TTS diagnostics de produção.
    if (!isLab) pushTtsEvent({ stage: blocked ? 'BLOCKED' : 'RECEIVED', diagnosticMessageId: item.id, platform, author: item.author, text: item.text });
    if (blocked) return { decision: finalDecision, blocked: true, blockReason: finalDecision, diagnosticMessageId: item.id }; // rejeitada: NÃO ocupa a fila TTS
    if (!isLab) recordEnqueued(platform); else if (labCollector) recordEnqueuedInto(labCollector, platform);
    // Gate de speak: Lab com speak:false NÃO chama speak() — não entra no scheduler, não fala.
    if (!labNoSpeak) {
      const _rf = applyReadingFilter({ author: item.author, authorId: item.authorId, text: ttsText, roles, eventType: item.eventType, emotes: data.emotes || null }, getReadingFilterConfig(), platform);
      if (!labEvent) setMessages(v => { const i = v.findIndex(m => m.id === item.id); if (i < 0) return v; const next = [...v]; next[i] = { ...next[i], ttsAllowed: _rf.allowed }; return next; });
      if (_rf.allowed) speak(_rf.text, { author: item.author, authorId: item.authorId, platform, roles, diagnosticMessageId: item.id, priority: result.priority, source: labEvent ? 'lab' : 'production', eventType: item.eventType, eventMeta: item.eventMeta });
    }
    return { decision: finalDecision, blocked: false, blockReason: null, diagnosticMessageId: item.id };
  };

  // Registra uma transmissão encerrada no histórico (dedupe por streamId+platform, cap 4).
  // Remove uma live pendente do histórico local (após Salvar ou Descartar).
  // Não afeta LiveSessions persistidas na entity — apenas o pending local.
  const removePastLive = useCallback((streamId, platform) => {
    setPastLives(prev => {
      const next = prev.filter(l => !(l.streamId === streamId && l.platform === platform));
      savePastLives(next);
      return next;
    });
  }, []);

  const recordPastLive = (platform, meta) => {
    if (!meta || !meta.streamId) return;
    const endedAt = new Date().toISOString();
    // JANELA DE CARÊNCIA SILENCIOSA: NÃO adiciona a pastLives imediatamente.
    // Sona discoverVod durante até 2 minutos. Só mostra [Salvar][Descartar] na
    // área do usuário quando um VOD REAL é confirmado. Se 120s expira sem VOD,
    // descarta silenciosamente — sem card, spinner, LiveSession ou item no carrossel.
    (async () => {
      try {
        const vodData = await liveSessionService.discoverVodWithGraceWindow(platform, {
          channelName: meta.channelName,
          streamId: meta.streamId,
          streamUrl: meta.streamUrl,
          thumbnailUrl: meta.thumbnailUrl,
          startedAt: meta.startedAt,
          endedAt,
          title: meta.title,
        });
        if (!vodData) return; // VOD não apareceu em 2 min — descartar, nada a mostrar.
        // VOD confirmado — envia para a área do usuário com dados reais + [Salvar][Descartar].
        setPastLives(prev => {
          if (prev.some(l => l.streamId === meta.streamId && l.platform === platform)) return prev;

          const entry = {
            platform,
            title: vodData.title || meta.title || 'Transmissão',
            streamUrl: vodData.streamUrl || meta.streamUrl || null,
            thumbnailUrl: vodData.thumbnailUrl || meta.thumbnailUrl || null,
            channelName: meta.channelName || null,
            startedAt: meta.startedAt || null,
            endedAt,
            streamId: meta.streamId,
            vodId: vodData.vodId || null,
          };
          const next = [entry, ...prev].slice(0, MAX_LIVES);
          savePastLives(next);
          return next;
        });
      } catch (e) {
        console.error('VOD grace window failed:', e);
      }
    })();
  };

  const broadcastLocalSync = (type, payload) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('livenexus_local_streaming_sync');
        ch.postMessage({ type, ...payload });
        ch.close();
      }
    } catch (e) {}
  };

  const handleMeta = (platform, payload) => {
    if (!payload) return;
    if (payload.meta) {
      liveMetaRef.current[platform] = payload.meta;
      connectedRef.current[platform] = true;
      setStreamMeta(prev => {
        const next = { ...prev, [platform]: payload.meta };
        broadcastLocalSync('STREAM_META_UPDATE', { streamMeta: next });
        return next;
      });
    }
    if (payload.offline) {
      if (connectedRef.current[platform] && liveMetaRef.current[platform]) {
        recordPastLive(platform, liveMetaRef.current[platform]);
      }
      liveMetaRef.current[platform] = null;
      connectedRef.current[platform] = false;
      setStreamMeta(prev => {
        const next = { ...prev, [platform]: null };
        broadcastLocalSync('STREAM_META_UPDATE', { streamMeta: next });
        return next;
      });
    }
    if (typeof payload.viewers === 'number' && Number.isFinite(payload.viewers)) {
      setConnections(v => {
        const next = { ...v, [platform]: { ...v[platform], viewers: payload.viewers } };
        broadcastLocalSync('CONNECTIONS_UPDATE', { connections: next });
        return next;
      });
    }
  };

  const makeOnStatus = (platform) => (status, err) => {
    if (status === 'connected') {
      connectedRef.current[platform] = true;
      // FASE 4: Fresh Start TTS — estabelece baseline na PRIMEIRA conexão da sessão.
      // Rebootstrap da mesma sessão (403/recovery) NÃO reseta o baseline.
      if (!captureStartedRef.current[platform]) {
        startCapture(platform);
        captureStartedRef.current[platform] = true;
      }
    }
    // FASE 7: limpa override admin quando conexão vai para idle
    if (status !== 'connected' && connectionSourceRef.current[platform] === 'admin_override') {
      setAdminTestMode(v => ({ ...v, [platform]: false }));
      connectionSourceRef.current[platform] = null;
    }
    if (status !== 'connected' && status !== 'connecting' && status !== 'reconnecting') {
      setStreamMeta(prev => ({ ...prev, [platform]: null }));
    }
    setConnections(v => {
      const next = { ...v, [platform]: { ...v[platform], status: status, error: err || '', viewers: status === 'connected' ? v[platform].viewers : null } };
      broadcastLocalSync('CONNECTIONS_UPDATE', { connections: next });
      return next;
    });
  };

  const makeOnMeta = (platform) => (payload) => handleMeta(platform, payload);

  const toggle = (platform) => {
    const c = connections[platform];
    if (!c) return;
    if (c.status === 'connected' || c.status === 'reconnecting' || c.status === 'rate_limited' || c.status === 'connecting') {
      // FASE 9: Se a conexão ativa é um admin override, NÃO permitir toggle oficial.
      if (connectionSourceRef.current[platform] === 'admin_override') {
        return setConnections(v => ({ ...v, [platform]: { ...v[platform], error: 'Teste admin ativo. Use o botão de teste para desconectar.' } }));
      }
      // Desconexão manual: NÃO registra live encerrada.
      liveMetaRef.current[platform] = null;
      connectedRef.current[platform] = false;
      // FASE 4: Reset do baseline Fresh Start ao desconectar.
      stopCapture(platform);
      captureStartedRef.current[platform] = false;
      const s = sockets.current[platform];
      if (s?.disconnect) {
        try { s.disconnect(); } catch {}
      } else if (s?.close) {
        try { s.close(); } catch {}
      }
      sockets.current[platform] = null;
      connectionSourceRef.current[platform] = null;
      return setConnections(v => ({ ...v, [platform]: { ...c, status: 'idle', error: '', viewers: null } }));
    }
    // FASE 9: Se admin override está ativo, NÃO permitir conexão oficial.
    if (connectionSourceRef.current[platform] === 'admin_override') {
      return setConnections(v => ({ ...v, [platform]: { ...v[platform], error: 'Teste admin ativo. Desconecte o teste primeiro.' } }));
    }
    if (!c.channel?.trim()) return setConnections(v => ({ ...v, [platform]: { ...c, error: 'Informe o nome do canal.' } }));

    // Limpa qualquer socket ou instância anterior pendente para evitar reter dados ou bloquear nova conexão
    const existingSocket = sockets.current[platform];
    if (existingSocket?.disconnect) {
      try { existingSocket.disconnect(); } catch {}
    } else if (existingSocket?.close) {
      try { existingSocket.close(); } catch {}
    }
    sockets.current[platform] = null;

    setConnections(v => ({ ...v, [platform]: { ...v[platform], status: 'connecting', error: '' } }));
    // FASE 4: connectionSource rastreia a origem (diagnóstico).
    connectionSourceRef.current[platform] = 'linked_channel';
    // FASE 4: onMessage agora passa messageId e timestamp para o Fresh Start TTS.
    const onMessage = ({ id, author, authorId, text, roles, timestamp, firstMsg, eventType, eventMeta, emotes }) => {
      if (platform === 'Twitch') twitchPipelineDiagnostic.incBridge({ eventType, eventMeta });
      return receive(platform, JSON.stringify({ author, text, roles, authorId, messageId: id, timestamp, firstMsg: firstMsg || false, eventType: eventType || null, eventMeta: eventMeta || null, emotes: emotes || null }));
    };
    let conn;
    if (platform === 'Twitch') conn = connectTwitch(c.channel, onMessage, makeOnStatus(platform), makeOnMeta(platform));
    else if (platform === 'Kick') conn = connectKick(c.channel, onMessage, makeOnStatus(platform), makeOnMeta(platform));
    else if (platform === 'YouTube') conn = connectYouTube(c.channel, onMessage, makeOnStatus(platform), makeOnMeta(platform));
    sockets.current[platform] = conn;
  };

  // FASE 3-6: Admin test override — conecta canal temporário SEM tocar no identificador oficial.
  // Runtime-only: não persiste, não chama updateMe, não altera linkedChannels/connections.channel.
  // Reusa as mesmas funções connectX — apenas troca a identidade de entrada.
  const toggleAdminTest = (platform) => {
    const c = connections[platform];
    if (!c) return;

    // Se já está ativo (conectado, conectando ou reconectando) ou modo teste ativo:
    // Permite que o administrador desconecte e limpe de imediato, mesmo se for conexão fantasma
    if (isConnectionActive(c.status) || adminTestMode[platform]) {
      liveMetaRef.current[platform] = null;
      connectedRef.current[platform] = false;
      stopCapture(platform);
      captureStartedRef.current[platform] = false;
      const s = sockets.current[platform];
      if (s?.disconnect) {
        try { s.disconnect(); } catch {}
      } else if (s?.close) {
        try { s.close(); } catch {}
      }
      sockets.current[platform] = null;
      setAdminTestMode(v => ({ ...v, [platform]: false }));
      connectionSourceRef.current[platform] = null;
      const next = { ...connections, [platform]: { ...c, status: 'idle', error: '', viewers: null } };
      setConnections(next);
      broadcastLocalSync('CONNECTIONS_UPDATE', { connections: next });
      setStreamMeta(prev => {
        const nextMeta = { ...prev, [platform]: null };
        broadcastLocalSync('STREAM_META_UPDATE', { streamMeta: nextMeta });
        return nextMeta;
      });
      return;
    }

    const testChannel = (adminTestIdentity[platform] || '').trim();
    if (!testChannel) return setConnections(v => ({ ...v, [platform]: { ...v[platform], error: 'Informe o canal de teste.' } }));

    const existingSocket = sockets.current[platform];
    if (existingSocket?.disconnect) {
      try { existingSocket.disconnect(); } catch {}
    } else if (existingSocket?.close) {
      try { existingSocket.close(); } catch {}
    }
    sockets.current[platform] = null;

    setConnections(v => {
      const next = { ...v, [platform]: { ...v[platform], status: 'connecting', error: '' } };
      broadcastLocalSync('CONNECTIONS_UPDATE', { connections: next });
      return next;
    });
    // FASE 4: connectionSource = 'admin_override' para diagnóstico.
    connectionSourceRef.current[platform] = 'admin_override';
    setAdminTestMode(v => ({ ...v, [platform]: true }));
    const onMessage = ({ id, author, authorId, text, roles, timestamp, firstMsg, eventType, eventMeta, emotes }) => {
      if (platform === 'Twitch') twitchPipelineDiagnostic.incBridge({ eventType, eventMeta });
      return receive(platform, JSON.stringify({ author, text, roles, authorId, messageId: id, timestamp, firstMsg: firstMsg || false, eventType: eventType || null, eventMeta: eventMeta || null, emotes: emotes || null }));
    };
    let conn;
    if (platform === 'Twitch') conn = connectTwitch(testChannel, onMessage, makeOnStatus(platform), makeOnMeta(platform));
    else if (platform === 'Kick') conn = connectKick(testChannel, onMessage, makeOnStatus(platform), makeOnMeta(platform));
    else if (platform === 'YouTube') conn = connectYouTube(testChannel, onMessage, makeOnStatus(platform), makeOnMeta(platform));
    sockets.current[platform] = conn;
  };

  const setAdminTestIdentityValue = useCallback((platform, value) => {
    setAdminTestIdentity(v => ({ ...v, [platform]: value }));
  }, []);

  const sendTest = () => {
    const item = { id: crypto.randomUUID(), platform: 'Teste', author: 'Você', text: test, time: now(), source: 'manual_test' };
    setMessages(v => [item, ...v]);
    speak(test, { author: 'Você', platform: 'Teste', diagnosticMessageId: crypto.randomUUID(), source: 'manual_test' });
  };

  // Lab1 Simulator: aceita roles/authorId/diagnostics opcionais.
  // Backward-compatible: chamadas existentes com 3 args continuam funcionando.
  // CONTRATO OBRIGATÓRIO: pipeline real, decisão real, SEMPRE SEM scheduler/fala.
  // opts.speak é IGNORADO — este helper NUNCA fala. Testar scheduler/TTS real requer infra própria.
  // opts.diagnostics => grava no collector isolado.
  const simulateMessage = (platform, author, text, opts = {}) => receive(platform, JSON.stringify({ author, text, roles: opts.roles || [], authorId: opts.authorId || null }), { telemetry: false, diagnostics: opts.diagnostics, speak: false });

  // Lab1 Gatilhos: testa um gatilho via pipeline real com config temporário (não persiste).
  // CONTRATO OBRIGATÓRIO: pipeline real, decisão real, SEMPRE SEM scheduler/fala.
  // opts.speak é IGNORADO — este helper NUNCA fala. try/finally garante cleanup de testFilterConfigRef.
  const testTriggerViaPipeline = (platform, author, text, roles = [], triggerConfig, opts = {}) => {
    testFilterConfigRef.current = triggerConfig;
    try {
      return receive(platform, JSON.stringify({ author, text, roles, authorId: null }), { telemetry: false, diagnostics: opts?.diagnostics, speak: false });
    } finally {
      testFilterConfigRef.current = null;
    }
  };

  // Event Simulator: dispara evento de monetização pelo pipeline real COM fala.
  // Source: 'lab' — não contamina mensagens, speakerCounts, telemetria de produção.
  // onSpeechStart: callback isolado para o Lab confirmar fala iniciada.
  const simulateEvent = (platform, author, text, eventType, eventMeta, roles = []) => {
    let finalText = text;
    if (!finalText && eventType) {
      finalText = generateEventText(eventType, author, eventMeta || {});
    }
    return receive(platform, JSON.stringify({ author, text: finalText, roles, eventType, eventMeta }), { telemetry: false, labEvent: true });
  };

  const setLabSpeechStartCallback = useCallback((cb) => { labSpeechStartCallback.current = cb; }, []);

  // FASE 2B: pause/resume agora integra com o scheduler.
  // Pausar: speechSynthesis.pause() (pausa fala atual) + scheduler.pause() (impede novo dispatch).
  // Retomar: speechSynthesis.resume() (continua fala atual) + scheduler.resume() (permite dispatch se ocioso).
  const pauseReading = () => {
    if (speaking) { speechSynthesis.pause(); ttsScheduler.pause(); }
    else { speechSynthesis.resume(); ttsScheduler.resume(); }
    setSpeaking(v => !v);
  };

  // FASE 2A: Wrapper público para tts.skip. Delega ao scheduler.
  // Cancela SOMENTE a fala atual; preserva a fila restante.
  // Se pausado: cancela a atual mas não inicia a próxima (dispatch respeita isPaused).
  const skipCurrent = useCallback(() => ttsScheduler.skipCurrent(), []);
  // FASE 2B: getQueueStats agora lê da managedQueue do scheduler (não mais de utterances.current).
  // queueLength = mensagens aguardando na managedQueue (exclui a fala atual ativa).
  // oldestQueuedAt = timestamp da mensagem mais antiga aguardando.
  const getQueueStats = useCallback(() => {
    const ss = ttsScheduler.getSchedulerStats();
    return { queueLength: ss.totalQueue, oldestQueuedAt: ss.oldestQueuedAt };
  }, []);

  const resetTtsTelemetry = useCallback(() => setTtsTelemetry({ received: 0, spoken: 0, filtered: 0, admitted: 0, congestionState: 'NORMAL', discardReasons: { ANTI_FLOOD_REPEAT: 0, CHARACTER_LIMIT: 0, FILTERED_BY_ROLE: 0, USER_COOLDOWN: 0, DUPLICATE: 0, FLOOD: 0, CONGESTION: 0, INITIAL_BACKLOG: 0, BLOCKED_TRIGGER: 0 } }), []);

  // FASE 5 (auditoria pós-stress): Snapshot ATÔMICO da telemetria TTS.
  // Captura ttsTelemetry (contadores), scheduler stats (fila/P1-P4/ativa/expired),
  // congestion state e queue delay no MESMO instante — uma única chamada
  // getSchedulerStats() para totalQueue e byQueue, eliminando dupla leitura.
  // A UI renderiza uma fotografia consistente; sem polling adicional.
  const getTtsTelemetrySnapshot = useCallback(() => {
    const tt = ttsTelemetryRef.current;
    const sched = ttsScheduler.getSchedulerStats(); // SINGLE call — totalQueue e byQueue do mesmo instante
    const queueDelay = sched.totalQueue > 0 && sched.oldestQueuedAt ? Date.now() - sched.oldestQueuedAt : 0;
    // FASE 2 (calibração): Métricas derivadas dos contadores existentes.
    const derived = {
      admissionRate: tt.received > 0 ? tt.admitted / tt.received : 1,
      discardRate: tt.received > 0 ? tt.filtered / tt.received : 0,
      congestionDiscardRate: tt.received > 0 ? (tt.discardReasons.CONGESTION || 0) / tt.received : 0,
      expiryPressure: tt.admitted > 0 ? sched.totalExpired / tt.admitted : 0,
      speechCompletionPressure: tt.admitted > 0 ? tt.spoken / tt.admitted : 0,
    };
    return {
      received: tt.received,
      admitted: tt.admitted,
      spoken: tt.spoken,
      filtered: tt.filtered,
      discardReasons: tt.discardReasons,
      congestionState: getCongestionState(),
      congestionHistory: getCongestionHistory(),
      queueLength: sched.totalQueue,
      queueDelay,
      derived,
      scheduler: sched,
    };
  }, []);

  // FASE 2B: clearMessages agora limpa browser + managedQueue via ttsScheduler.clear().
  // A geração interna do scheduler é incrementada, invalidando callbacks de utterances anteriores.
  const clearMessages = () => { ttsScheduler.clear(); utterances.current = []; resetBacklogQueue(); resetAntiFlood(); resetAntiSpam(); resetCongestion(); diag.TTS.speechCancels++; diag.TTS.canceled++; diag.TTS.speaking = false; diag.TTS.queueLength = 0; diag.TTS.pending = 0; setTtsTelemetry({ received: 0, spoken: 0, filtered: 0, admitted: 0, congestionState: 'NORMAL', discardReasons: { ANTI_FLOOD_REPEAT: 0, CHARACTER_LIMIT: 0, FILTERED_BY_ROLE: 0, USER_COOLDOWN: 0, DUPLICATE: 0, FLOOD: 0, CONGESTION: 0, INITIAL_BACKLOG: 0, BLOCKED_TRIGGER: 0 } }); setMessages([]); };

  const handleVerified = async (data) => {
    const entry = { channelName: data.channelIdentifier, channelIdentifier: data.channelIdentifier, channelUrl: data.channelUrl, verifiedAt: data.verifiedAt, verificationProof: data.verificationProof, challengeKey: data.challengeKey };
    try {
      await fetch('/api/auth/update-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ channels: { [data.platform]: entry } }),
      });
      // Salvar na tabela / JSON de plataformas para o Painel Admin
      const platRes = await fetch('/api/plataformas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          platform: data.platform,
          channel_id: data.channelIdentifier,
          channel_name: data.channelIdentifier,
          channel_handle: data.channelIdentifier,
          verification_code: data.verificationProof || data.challengeKey || '',
          bio_link_code: data.challengeKey || '',
          status: 'verified',
          verified_at: data.verifiedAt || new Date().toISOString()
        }),
      });
      const platJson = await platRes.json().catch(() => ({}));
      if (!platRes.ok || !platJson.ok) {
        throw new Error(platJson.error || 'Falha na persistência da conexão de plataforma.');
      }
      console.log('[LIVENEXUS-RENEW] VERIFIED_CHANNEL_SAVED', { platform: data.platform, channelIdentifier: data.channelIdentifier, ts: new Date().toISOString() });
    } catch (e) {
      console.error('[LIVENEXUS] VERIFIED_CHANNEL_ERROR', e);
    }
    setLinkedChannels(v => ({ ...v, [data.platform]: { status: 'verified', ...entry } }));
    setConnections(v => ({ ...v, [data.platform]: { ...v[data.platform], channel: data.channelIdentifier, error: '' } }));
  };

  const handleRenew = async (platform) => {
    console.log('[LIVENEXUS-RENEW] RENEW_HANDLER_ENTER', { platform, ts: new Date().toISOString() });
    try {
      await fetch('/api/auth/update-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ channels: { [platform]: null } }),
      });
    } catch (e) {}
    setLinkedChannels(v => { const n = { ...v }; delete n[platform]; return n; });
    setConnections(v => ({ ...v, [platform]: { ...v[platform], channel: '', status: 'idle', error: '', viewers: null } }));
    liveMetaRef.current[platform] = null;
    connectedRef.current[platform] = false;
    stopCapture(platform);
    captureStartedRef.current[platform] = false;
    setAdminTestMode(v => ({ ...v, [platform]: false }));
    setAdminTestIdentity(v => { const n = { ...v }; delete n[platform]; return n; });
    connectionSourceRef.current[platform] = null;
    const s = sockets.current[platform];
    if (s?.disconnect) { s.disconnect(); console.log('[LIVENEXUS-RENEW] RENEW_SOCKET_DISCONNECTED', { platform, via: 'disconnect', ts: new Date().toISOString() }); }
    else if (s?.close) { s.close(); console.log('[LIVENEXUS-RENEW] RENEW_SOCKET_DISCONNECTED', { platform, via: 'close', ts: new Date().toISOString() }); }
    else { console.log('[LIVENEXUS-RENEW] RENEW_REF_NULL', { platform, ts: new Date().toISOString() }); }
    sockets.current[platform] = null;
    console.log('[LIVENEXUS-RENEW] RENEW_STATE_AFTER_CLEAR', { platform, connectedRef: connectedRef.current[platform], socketRef: sockets.current[platform], connChannel: '', connStatus: 'idle', ts: new Date().toISOString() });
  };

  const setConnectionField = (p, k, val) => setConnections(v => ({ ...v, [p]: { ...v[p], [k]: val } }));
  // Atualiza um parâmetro do motor TTS. Para rate/volume/pitch, se a fala estiver
  // ativa, reinicia a utterance atual (com debounce curto) para aplicar o novo
  // valor em tempo real — o browser não aceita mudar esses campos numa utterance
  // já em reprodução, então recriamos a partir do último boundary (onboundary).
  const updateSetting = (k, v) => {
    const next = { ...settingsRef.current, [k]: v };
    settingsRef.current = next;
    setSettings(next);
    try { localStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(next)); } catch {}
    if ((k === 'rate' || k === 'volume' || k === 'pitch' || k === 'engine' || k === 'voice') &&
        ((typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking && !speechSynthesis.paused) || ttsScheduler.hasActiveUtterance())) {
      if (restartDebounceRef.current) clearTimeout(restartDebounceRef.current);
      restartDebounceRef.current = setTimeout(() => {
        restartDebounceRef.current = null;
        ttsScheduler.restartCurrent();
      }, 150);
    }
  };

  // Encerra TODAS as plataformas: sockets, timers (via disconnect de cada módulo),
  // speechSynthesis e estado. Idempotente.
  const disconnectAll = useCallback(() => {
    Object.values(sockets.current).forEach(s => { try { s?.disconnect ? s.disconnect() : s?.close?.(); } catch {} });
    sockets.current = {};
    liveMetaRef.current = {};
    connectedRef.current = {};
    // FASE 4: Reset de todos os baselines Fresh Start.
    stopAllCapture();
    captureStartedRef.current = {};
    // FASE 7: Limpa todos os overrides admin test.
    setAdminTestIdentity({});
    setAdminTestMode({});
    connectionSourceRef.current = {};
    ttsScheduler.reset();
    utterances.current = [];
    speakSourceByMsgId.current.clear();
    resetBacklogQueue();
    resetFilterState();
    resetAntiFlood();
    resetAntiSpam();
    resetCongestion();
    diag.TTS.speechCancels++; diag.TTS.speaking = false; diag.TTS.queueLength = 0;
    setConnections(prev => {
      const next = {};
      for (const p of PLATFORMS) next[p] = { channel: '', status: 'idle', error: '', viewers: null };
      broadcastLocalSync('CONNECTIONS_UPDATE', { connections: next });
      broadcastLocalSync('FORCE_DISCONNECT_ALL', {});
      return next;
    });
    setStreamMeta({});
    broadcastLocalSync('STREAM_META_UPDATE', { streamMeta: {} });
  }, []);

  // Logout: desconecta tudo ANTES do redirect (hard reload).
  const logout = useCallback(async () => {
    const before = JSON.parse(JSON.stringify(diag));
    disconnectAll();
    try {
      const report = {
        kickClosed: diag.Kick.socketsClosed - before.Kick.socketsClosed,
        twitchClosed: diag.Twitch.socketsClosed - before.Twitch.socketsClosed,
        ttsCancel: diag.TTS.speechCancels - before.TTS.speechCancels,
        at: new Date().toISOString(),
      };
      sessionStorage.setItem('livenexus:logout-report', JSON.stringify(report));
    } catch {}
    await authClient.logout('/login');
  }, [disconnectAll]);

  // Unmount do provider (redirect de auth / saída da rota): cleanup defensivo.
  useEffect(() => () => { disconnectAll(); }, [disconnectAll]);

  const value = {
    connections, messages, voices, test, setTest, speaking, ttsCount,     speakerCounts, pastLives, removePastLive, linkedChannels, settings,
    filterConfig, setFilterConfig, filterDiag,
    toggle, sendTest, simulateMessage, pauseReading, clearMessages, skipCurrent, handleVerified, handleRenew, setConnectionField, updateSetting,
    disconnectAll, logout,
    liveActivity,
    streamMeta,
    ttsTelemetry, getQueueStats, resetTtsTelemetry, getTtsTelemetrySnapshot,
    adminTestIdentity, adminTestMode, toggleAdminTest, setAdminTestIdentityValue,
    testTriggerViaPipeline,
    simulateEvent, setLabSpeechStartCallback,
  };

  return (
    <StreamingContext.Provider value={value}>
      <RtcAutoPublisherBridge />
      {children || <Outlet />}
    </StreamingContext.Provider>
  );
}

const defaultStreamingFallback = {
  connections: {},
  messages: [],
  voices: [],
  test: false,
  setTest: () => {},
  speaking: false,
  ttsCount: 0,
  speakerCounts: {},
  pastLives: [],
  removePastLive: () => {},
  linkedChannels: [],
  settings: {},
  filterConfig: {},
  setFilterConfig: () => {},
  filterDiag: {},
  toggle: () => {},
  sendTest: () => {},
  simulateMessage: () => {},
  pauseReading: () => {},
  clearMessages: () => {},
  skipCurrent: () => {},
  handleVerified: () => {},
  handleRenew: () => {},
  setConnectionField: () => {},
  updateSetting: () => {},
  disconnectAll: () => {},
  logout: () => {},
  liveActivity: { items: [], lastMessage: null, lastEvent: null },
  streamMeta: {},
  ttsTelemetry: {},
  getQueueStats: () => ({}),
  resetTtsTelemetry: () => {},
  getTtsTelemetrySnapshot: () => ({}),
  adminTestIdentity: false,
  adminTestMode: false,
  toggleAdminTest: () => {},
  setAdminTestIdentityValue: () => {},
  testTriggerViaPipeline: () => {},
  simulateEvent: () => {},
  setLabSpeechStartCallback: () => {}
};

export const useStreaming = () => {
  const ctx = useContext(StreamingContext);
  if (!ctx) {
    return defaultStreamingFallback;
  }
  return ctx;
};

// HMR: context module não pode ser hot-swapped — novo objeto StreamingContext
// desyncaria componentes que ainda referenciam o useStreaming anterior,
// causando "useStreaming must be used within a StreamingProvider".
// decline() força full page reload quando este módulo muda.
if (import.meta.hot) {
  import.meta.hot.accept();
}

