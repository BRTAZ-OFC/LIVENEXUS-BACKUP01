import { CHAT_TEMPLATES } from './Overlay_chatTemplates';
import { ALERTS_TEMPLATES, EVENT_LIST_TEMPLATES } from './Overlay_alertsTemplates';
import { SUB_GOAL_TEMPLATES, BITS_GOAL_TEMPLATES, RAID_GOAL_TEMPLATES } from './Overlay_goalsTemplates';
import {
  LATEST_SUB_TEMPLATES,
  LATEST_CHEER_TEMPLATES,
  LATEST_RAID_TEMPLATES,
  TOP_CHEER_TEMPLATES,
  SUB_COUNTER_TEMPLATES,
  BITS_COUNTER_TEMPLATES
} from './Overlay_labelsTemplates';
import {
  CHAT_SPEED_TEMPLATES,
  HYPE_METER_TEMPLATES,
  CHAT_VIBE_TEMPLATES,
  VIEWERS_CHART_TEMPLATES
} from './Overlay_analyticsTemplates';
import {
  CHATTER_LEADERBOARD_TEMPLATES,
  POLL_TEMPLATES,
  RAFFLE_TEMPLATES,
  SUB_TRAIN_TEMPLATES
} from './Overlay_interactiveTemplates';
import {
  STATUS_LABEL_TEMPLATES,
  UPTIME_TEMPLATES,
  COMMANDS_TEMPLATES,
  MILESTONES_TEMPLATES,
  RULES_TEMPLATES,
  SCHEDULE_TEMPLATES,
  SCHEDULE_TICKER_TEMPLATES,
  MODERATOR_FEED_TEMPLATES
} from './Overlay_streamInfoTemplates';
import { WORD_CLOUD_TEMPLATES, EMOTE_SHOWER_TEMPLATES } from './Overlay_funTemplates';
import { MANUAL_WIDGET_TEMPLATES } from '@dashboard/widgets/Widget_ManualWidgets';

export const WIDGET_TEMPLATES_MAP = {
  ...MANUAL_WIDGET_TEMPLATES,
  'twitch-chat-box': CHAT_TEMPLATES,
  'twitch-alerts': ALERTS_TEMPLATES,
  'twitch-event-list': EVENT_LIST_TEMPLATES,
  'twitch-status-label': STATUS_LABEL_TEMPLATES,
  'twitch-sub-goal': SUB_GOAL_TEMPLATES,
  'twitch-bits-goal': BITS_GOAL_TEMPLATES,
  'twitch-raid-goal': RAID_GOAL_TEMPLATES,
  'twitch-latest-sub': LATEST_SUB_TEMPLATES,
  'twitch-latest-cheer': LATEST_CHEER_TEMPLATES,
  'twitch-latest-raid': LATEST_RAID_TEMPLATES,
  'twitch-top-cheer': TOP_CHEER_TEMPLATES,
  'twitch-sub-counter': SUB_COUNTER_TEMPLATES,
  'twitch-bits-counter': BITS_COUNTER_TEMPLATES,
  'twitch-chat-speed': CHAT_SPEED_TEMPLATES,
  'twitch-hype-meter': HYPE_METER_TEMPLATES,
  'twitch-chat-vibe': CHAT_VIBE_TEMPLATES,
  'twitch-viewers-chart': VIEWERS_CHART_TEMPLATES,
  'twitch-chatter-leaderboard': CHATTER_LEADERBOARD_TEMPLATES,
  'twitch-poll': POLL_TEMPLATES,
  'twitch-raffle': RAFFLE_TEMPLATES,
  'twitch-sub-train': SUB_TRAIN_TEMPLATES,
  'twitch-word-cloud': WORD_CLOUD_TEMPLATES,
  'twitch-emote-shower': EMOTE_SHOWER_TEMPLATES,
  'twitch-uptime': UPTIME_TEMPLATES,
  'twitch-commands-list': COMMANDS_TEMPLATES,
  'twitch-milestones': MILESTONES_TEMPLATES,
  'twitch-rules': RULES_TEMPLATES,
  'twitch-schedule': SCHEDULE_TEMPLATES,
  'twitch-schedule-ticker': SCHEDULE_TICKER_TEMPLATES,
  'twitch-moderator-feed': MODERATOR_FEED_TEMPLATES
};

export function getTemplatesForWidget(widgetId) {
  return WIDGET_TEMPLATES_MAP[widgetId] || [];
}

export function getTemplateForWidget(widgetId, templateId) {
  const templates = getTemplatesForWidget(widgetId);
  return templates.find(t => t.id === String(templateId) || String(t.number) === String(templateId)) || null;
}

export const WIDGET_CATEGORIES_CATALOG = [
  {
    id: 'chat',
    name: 'Chat',
    widgets: [
      { id: 'twitch-chat-box', name: 'Chatbox' }
    ]
  },
  {
    id: 'alerts-events',
    name: 'Alertas e Eventos',
    widgets: [
      { id: 'twitch-alerts', name: 'Alertas' },
      { id: 'twitch-event-list', name: 'Lista de Eventos' },
      { id: 'youtube-native-poll', name: 'Enquete nativa do YouTube' }
    ]
  },
  {
    id: 'goals',
    name: 'Metas e Progresso',
    widgets: [
      { id: 'twitch-sub-goal', name: 'Meta de Subs da Twitch' },
      { id: 'twitch-bits-goal', name: 'Meta de Bits da Twitch' },
      { id: 'twitch-raid-goal', name: 'Meta de Raids da Twitch' }
    ]
  },
  {
    id: 'labels-counters',
    name: 'Labels e Contadores',
    widgets: [
      { id: 'twitch-latest-sub', name: 'Último Sub da Twitch' },
      { id: 'twitch-latest-cheer', name: 'Último Cheer da Twitch (Bits)' },
      { id: 'twitch-latest-raid', name: 'Última Raid da Twitch' },
      { id: 'twitch-top-cheer', name: 'Maior Cheer da Twitch' },
      { id: 'twitch-sub-counter', name: 'Contador de Subs da Twitch' },
      { id: 'twitch-bits-counter', name: 'Contador de Bits da Twitch' }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics e Métricas',
    widgets: [
      { id: 'twitch-chat-speed', name: 'Velocidade do Chat' },
      { id: 'twitch-hype-meter', name: 'Hypeômetro' },
      { id: 'twitch-chat-vibe', name: 'Termômetro de Vibe' },
      { id: 'twitch-viewers-chart', name: 'Audiência Recente (Gráfico)' }
    ]
  },
  {
    id: 'interactive',
    name: 'Interativas',
    widgets: [
      { id: 'twitch-chatter-leaderboard', name: 'Top Chatters (Ranking)' },
      { id: 'twitch-poll', name: 'Enquete Interativa' },
      { id: 'twitch-raffle', name: 'Sorteio de Chat' },
      { id: 'twitch-sub-train', name: 'Trem do Sub da Twitch (Hype Train)' }
    ]
  },
  {
    id: 'stream-info',
    name: 'Informações da Live e Streamer',
    widgets: [
      { id: 'multi-viewers-counter', name: 'Espectadores Multiplataforma' },
      { id: 'twitch-status-label', name: 'Status da Transmissão' },
      { id: 'twitch-uptime', name: 'Cronômetro / Uptime' },
      { id: 'twitch-commands-list', name: 'Lista de Comandos' },
      { id: 'twitch-milestones', name: 'Conquistas da Twitch' },
      { id: 'twitch-rules', name: 'Regras do Canal' },
      { id: 'twitch-schedule', name: 'Agenda de Streams' },
      { id: 'twitch-schedule-ticker', name: 'Letreiro de Agenda' },
      { id: 'twitch-moderator-feed', name: 'Logs de Moderação' }
    ]
  },
  {
    id: 'fun',
    name: 'Diversão',
    widgets: [
      { id: 'twitch-word-cloud', name: 'Nuvem de Palavras' },
      { id: 'twitch-emote-shower', name: 'Chuva de Emotes da Twitch' }
    ]
  }
];
