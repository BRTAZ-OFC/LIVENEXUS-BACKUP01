import React from 'react';
import { getTemplateForWidget } from './templates/Scenario_index';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { eventDetails, eventLabel, genericEventAllowed, platformEvents, platformIsOnline, platformMessages, platformMeta, platformViewers, selectedPlatforms, visibleChatText } from '@dashboard/overlays/Overlay_platformData';

const LEGACY_PRESET_MAP = {
  'big-number': '01',
  'circular-radial': '02',
  'pure-bar': '03',
  'compact-mark': '04',
  'horizontal-panel': '05',
  'vertical-panel': '06',
  'hud-modules': '07',
  'central-card': '08',
  'lower-third': '09',
  'asymmetric-offset': '10'
};

export default function StructuralWidgetRenderer({
  widgetId,
  typeId,
  presetId = '01',
  config = {},
  isMiniPreview = false,
  ...customProps
}) {
  // Try to safely access StreamingContext if available, otherwise fallback gracefully
  let streamingContext = {};
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    streamingContext = useStreaming() || {};
  } catch {
    streamingContext = {};
  }

  const { connections = {}, streamMeta = {}, liveActivity = {}, messages = [] } = streamingContext;
  const isOnline = platformIsOnline(connections, config);

  // Normalize presetId: map legacy names to 01-10
  const normalizedPresetId = LEGACY_PRESET_MAP[presetId] || String(presetId).padStart(2, '0');

  // Resolve target widget ID
  const effectiveWidgetId = widgetId || config.targetWidgetId || config.widgetId || 'twitch-sub-goal';

  // Retrieve the 10 custom templates specifically for this widget
  const template = getTemplateForWidget(effectiveWidgetId, normalizedPresetId);
  if (!template) return null;

  // Compute live data fields needed across various widgets
  const streamTitle = platformMeta(streamMeta, connections, config, 'title').title;
  const streamGame = platformMeta(streamMeta, connections, config, 'game').game;
  const chatMessages = platformMessages(liveActivity, config);
  const realMessages = chatMessages.length > 0 ? chatMessages.map(item => ({ ...item, author: `[${item.platform}] ${item.author}`, text: visibleChatText(item) })) : (isMiniPreview && Array.isArray(messages) ? messages : []);
  const allEvents = platformEvents(liveActivity, config).filter(genericEventAllowed);
  const lastEvent = allEvents[0];
  const showEvent = item => item && ({ ...item, text: `${item.platform} · ${eventLabel(item)}${eventDetails(item) ? ` · ${eventDetails(item)}` : ''}` });

  // Subs & Goals calculation
  const subEvents = allEvents.filter(
    item => item.platform === 'Twitch' && (item.eventType === 'twitch_sub' || item.eventType === 'twitch_resub' || item.eventType === 'twitch_subgift')
  );
  const bitEvents = allEvents.filter(item => item.platform === 'Twitch' && item.eventType === 'twitch_bits');
  const raidEvents = allEvents.filter(item => item.platform === 'Twitch' && item.eventType === 'twitch_raid');

  const startVal = Number(config.startValue || 0);
  const currentSubs = isOnline ? (startVal + subEvents.length) : 0;
  const currentBits = isOnline ? (startVal + bitEvents.reduce((acc, curr) => acc + (curr.eventMeta?.amount || curr.amount || curr.bits || 0), 0)) : 0;
  const currentRaids = isOnline ? (startVal + raidEvents.length) : 0;

  // Viewers count
  const viewersCount = platformViewers(connections, config);

  // Uptime calculation
  let computedUptime = '00:00:00';
  if (isOnline) {
    const startedAt = platformMeta(streamMeta, connections, config, 'startedAt').startedAt;
    if (startedAt) {
      try {
        const diffMs = Date.now() - new Date(startedAt).getTime();
        if (diffMs > 0) {
          const diffSecs = Math.floor(diffMs / 1000);
          const hrs = String(Math.floor(diffSecs / 3600)).padStart(2, '0');
          const mins = String(Math.floor((diffSecs % 3600) / 60)).padStart(2, '0');
          const secs = String(diffSecs % 60).padStart(2, '0');
          computedUptime = `${hrs}:${mins}:${secs}`;
        }
      } catch {
        computedUptime = '00:00:00';
      }
    }
  }

  // Top Chatters calculation from real messages
  const chattersCount = {};
  realMessages.forEach(msg => {
    const author = msg.author || msg.username || msg.user;
    if (author) {
      chattersCount[author] = (chattersCount[author] || 0) + 1;
    }
  });
  const realTopChatters = Object.entries(chattersCount)
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count);

  // Speed calculation (messages in last 60s)
  const now = Date.now();
  const recentMsgs = realMessages.filter(m => m.timestamp && (now - new Date(m.timestamp).getTime() < 60000));
  const chatSpeed = isOnline ? (recentMsgs.length || realMessages.length) : 0;
  const twitchActivity = (liveActivity?.items || []).filter(item => item.platform === 'Twitch').slice(0, 20);
  const hypeLevel = connections?.Twitch?.status === 'connected'
    ? Math.min(twitchActivity.filter(item => item.eventType).length * 25 + twitchActivity.length * 3, 100) : 0;
  const positiveWords = ['lfg', 'hype', 'gg', 'uau', 'boa', 'top', 'incrível', 'amei', 'obrigado', 'valeu', 'nice', 'love', '❤️', '🔥', '😆', '👏'];
  const negativeWords = ['ruim', 'chato', 'drop', 'lag', 'bosta', 'droga', 'odeio', 'f', 'rip', 'triste', 'chateado', '😢', '😡', '👎'];
  const vibeScore = chatMessages.length ? Math.max(0, Math.min(100,
    chatMessages.slice(0, 30).reduce((score, item) => {
      const message = visibleChatText(item).toLowerCase();
      return score + positiveWords.filter(word => message.includes(word)).length * 5
        - negativeWords.filter(word => message.includes(word)).length * 5;
    }, 50)
  )) : 0;

  // Resolve specific label data
  let specificUser = '';
  let specificDetail = '';
  if (effectiveWidgetId === 'twitch-latest-sub') {
    const s = subEvents[0];
    specificUser = s ? (s.user || s.author || s.username) : '';
    specificDetail = s ? (s.text || 'Inscrição recente') : '';
  } else if (effectiveWidgetId === 'twitch-latest-cheer') {
    const b = bitEvents[0];
    specificUser = b ? (b.user || b.author || b.username) : '';
    specificDetail = b ? `${b.eventMeta?.amount || b.amount || b.bits || 0} Bits` : '';
  } else if (effectiveWidgetId === 'twitch-latest-raid') {
    const r = raidEvents[0];
    specificUser = r ? (r.user || r.author || r.username) : '';
    specificDetail = r ? (r.text || 'Raid recebida') : '';
  } else if (effectiveWidgetId === 'twitch-top-cheer') {
    const topBit = [...bitEvents].sort((a, b) => (b.eventMeta?.amount || b.amount || 0) - (a.eventMeta?.amount || a.amount || 0))[0];
    specificUser = topBit ? (topBit.user || topBit.author || topBit.username) : '';
    specificDetail = topBit ? `${topBit.eventMeta?.amount || topBit.amount || 0} Bits` : '';
  }

  // Render using the specific widget template render function!
  const rendered = template.render({
    config,
    isOnline,
    isMiniPreview,
    messages: customProps.messages || realMessages,
    lastEvent: customProps.lastEvent !== undefined ? customProps.lastEvent : (effectiveWidgetId === 'twitch-alerts' || effectiveWidgetId === 'twitch-event-list' ? showEvent(lastEvent) : lastEvent),
    events: customProps.events || (effectiveWidgetId === 'twitch-event-list' ? allEvents.map(showEvent) : allEvents),
    current: customProps.current !== undefined ? customProps.current : (effectiveWidgetId.includes('bits') ? currentBits : effectiveWidgetId.includes('raid') ? currentRaids : currentSubs),
    target: customProps.target !== undefined ? customProps.target : (config.targetValue ? Number(config.targetValue) : (effectiveWidgetId.includes('bits') ? 2500 : effectiveWidgetId.includes('raid') ? 5 : 50)),
    user: customProps.user || specificUser || (lastEvent ? (lastEvent.author || lastEvent.user) : ''),
    detail: customProps.detail || specificDetail || (lastEvent?.text || ''),
    count: customProps.count !== undefined ? customProps.count : (effectiveWidgetId.includes('bits') ? currentBits : currentSubs),
    speed: customProps.speed !== undefined ? customProps.speed : chatSpeed,
    hype: customProps.hype !== undefined ? customProps.hype : hypeLevel,
    vibeScore: customProps.vibeScore !== undefined ? customProps.vibeScore : vibeScore,
    currentViewers: customProps.currentViewers !== undefined ? customProps.currentViewers : viewersCount,
    chatters: customProps.chatters || realTopChatters,
    question: config.question || 'Pergunta da enquete',
    options: config.options || [
      { text: 'Sim', label: '1' },
      { text: 'Não', label: '2' },
      { text: 'Mais ou menos', label: '3' },
      { text: 'Ruim', label: '4' }
    ],
    votesMap: config.votesMap || customProps.votesMap || {},
    winner: config.raffleWinner || customProps.winner || null,
    participants: config.raffleParticipants || customProps.participants || [],
    title: isOnline ? (streamTitle || 'Aguardando título') : 'Live offline',
    game: isOnline ? (streamGame || 'Geral') : '',
    uptimeString: customProps.uptimeString || (isOnline ? computedUptime : '00:00:00'),
    commands: config.commands || [],
    rules: config.rules || [],
    schedule: config.schedule || [],
    newsText: config.newsText || config.text || '',
    milestones: config.milestones || customProps.milestones || [],
    modLogs: customProps.modLogs || [],
    ...customProps
  });

  const needsBorderOverride = config.showBorder === false;
  let finalRendered = rendered;
  if (needsBorderOverride && React.isValidElement(rendered)) {
    finalRendered = React.cloneElement(rendered, {
      className: `${rendered.props.className || ''} structural-border-reset`.trim()
    });
  }

  const result = (
    <>
      {needsBorderOverride && (
        <style>{`
          .structural-border-reset { 
            border: none !important; 
            border-width: 0px !important; 
            border-radius: 0px !important;
            outline: none !important;
            box-shadow: none !important;
          }
        `}</style>
      )}
      {finalRendered}
    </>
  );

  if (effectiveWidgetId !== 'twitch-chat-box' || selectedPlatforms(config).length <= 1) return result;
  return <div className="ln-multichat-pattern w-full h-full">
    <style>{`.ln-multichat-pattern [data-chat-text] { display: -webkit-box !important; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden !important; overflow-wrap: anywhere; white-space: normal !important; }`}</style>
    {result}
  </div>;
}
