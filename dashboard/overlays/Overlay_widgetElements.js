export const NON_FRAGMENTABLE_WIDGET_IDS = [
  'chat-live',
  'chat-topspeakers',
  'goals-combined',
  'tts-status',
  'tts-active-indicator',
  'media-current-music', // Caso especial: Player Completo vs Somente Música
  'manual-pix-widget',
];

export const WIDGET_ELEMENTS_MAP = {
  'manual-death-counter': [{ key: 'count', label: 'Número de Mortes' }],
  'manual-clock': [{ key: 'time', label: 'Horário' }, { key: 'date', label: 'Data' }],
  'manual-timer': [{ key: 'timer', label: 'Tempo Restante' }],
  'manual-now-playing': [{ key: 'title', label: 'Nome da Faixa' }, { key: 'artist', label: 'Artista' }, { key: 'cover', label: 'Capa' }],
  'manual-pix-widget': [{ key: 'full_widget', label: 'Widget Pix' }],
  // CHAT FRAGMENTÁVEIS
  'chat-highlight': [
    { key: 'author', label: 'Nome / Usuário' },
    { key: 'text', label: 'Conteúdo da Mensagem' },
  ],
  'chat-last': [
    { key: 'author', label: 'Nome / Usuário' },
    { key: 'text', label: 'Conteúdo da Mensagem' },
  ],

  // AUDIÊNCIA FRAGMENTÁVEIS
  'audience-viewer-counter': [
    { key: 'twitch_counter', label: 'Twitch (Ícone + Contador)' },
    { key: 'kick_counter', label: 'Kick (Ícone + Contador)' },
    { key: 'youtube_counter', label: 'YouTube (Ícone + Contador)' },
  ],
  'audience-viewer-goal': [
    { key: 'current', label: 'Espectadores Atuais' },
    { key: 'target', label: 'Meta de Espectadores' },
    { key: 'progress_bar', label: 'Barra de Progresso' },
    { key: 'percentage', label: 'Porcentagem (%)' },
  ],
  'audience-peak': [
    { key: 'peak_count', label: 'Pico de Espectadores' },
  ],
  'audience-status': [
    { key: 'status_badge', label: 'Status Online / Offline' },
  ],

  // EVENTOS FRAGMENTÁVEIS
  'events-list': [
    { key: 'feed', label: 'Feed de Eventos' },
  ],
  'events-last-follow': [
    { key: 'user', label: 'Nome do Seguidor' },
  ],
  'events-last-sub': [
    { key: 'user', label: 'Nome do Inscrito' },
    { key: 'tier', label: 'Nível / Tier' },
  ],
  'events-last-resub': [
    { key: 'user', label: 'Nome do Usuário' },
    { key: 'months', label: 'Meses de Renovação' },
  ],
  'events-last-gift': [
    { key: 'user', label: 'Doador de Gift' },
    { key: 'count', label: 'Quantidade' },
  ],
  'events-last-bits': [
    { key: 'user', label: 'Doador de Bits' },
    { key: 'amount', label: 'Quantidade de Bits' },
  ],
  'events-last-raid': [
    { key: 'raider', label: 'Nome do Raider' },
    { key: 'viewers', label: 'Espectadores' },
  ],
  'events-last-announcement': [
    { key: 'author', label: 'Autor' },
    { key: 'text', label: 'Texto do Anúncio' },
  ],

  // METAS FRAGMENTÁVEIS
  'goals-main': [
    { key: 'title', label: 'Título da Meta' },
    { key: 'current', label: 'Valor Atual' },
    { key: 'target', label: 'Valor da Meta' },
    { key: 'progress_bar', label: 'Barra de Progresso' },
  ],
  'goals-follows': [
    { key: 'current', label: 'Seguidores Atuais' },
    { key: 'target', label: 'Meta de Seguidores' },
    { key: 'progress_bar', label: 'Barra de Progresso' },
  ],
  'goals-subs': [
    { key: 'current', label: 'Subs Atuais' },
    { key: 'target', label: 'Meta de Subs' },
    { key: 'progress_bar', label: 'Barra de Progresso' },
  ],
  'goals-bits': [
    { key: 'current', label: 'Bits Atuais' },
    { key: 'target', label: 'Meta de Bits' },
    { key: 'progress_bar', label: 'Barra de Progresso' },
  ],

  // INFORMAÇÕES DA LIVE FRAGMENTÁVEIS
  'live-info-title': [
    { key: 'title', label: 'Título da Live' },
  ],
  'live-info-category': [
    { key: 'category', label: 'Categoria / Jogo' },
  ],
  'live-info-uptime': [
    { key: 'uptime', label: 'Tempo de Live (Uptime)' },
  ],
  'live-info-channel': [
    { key: 'channel_name', label: 'Nome do Canal' },
  ],
  'live-info-platform-status': [
    { key: 'status', label: 'Status das Plataformas' },
  ],

  // TTS
  'tts-queue': [
    { key: 'queue_count', label: 'Mensagens na Fila' },
  ],

  // UTILITÁRIOS / VISUAIS
  'utility-clock': [
    { key: 'time', label: 'Hora Atual' },
    { key: 'date', label: 'Data' },
  ],
  'utility-custom-text': [
    { key: 'text', label: 'Texto Personalizado' },
  ],
  'utility-image': [
    { key: 'image', label: 'Imagem' },
  ],
  'utility-stopwatch': [
    { key: 'timer', label: 'Tempo do Cronômetro' },
  ],
  'utility-countdown': [
    { key: 'timer', label: 'Tempo Regressivo' },
  ],
  'utility-progress-bar': [
    { key: 'progress_bar', label: 'Barra de Progresso' },
  ],

  // TWITCH FRAGMENTÁVEIS
  'react-hub-widget': [
    { key: 'chat_area', label: 'Chat da Transmissão' },
    { key: 'queue_list', label: 'Vídeos da Fila' },
  ],
  'react-hub': [
    { key: 'chat_area', label: 'Chat da Transmissão' },
    { key: 'queue_list', label: 'Vídeos da Fila' },
  ],
  'twitch-status-label': [
    { key: 'status_badge', label: 'Status Ao Vivo/Offline' },
    { key: 'viewers_count', label: 'Contador de Espectadores' },
    { key: 'stream_title', label: 'Título da Transmissão (Marquee)' },
    { key: 'stream_game', label: 'Categoria / Jogo' }
  ],
  'youtube-native-poll': [
    { key: 'poll_question', label: 'Pergunta da Enquete' },
    { key: 'poll_options', label: 'Opções da Enquete' },
    { key: 'poll_status', label: 'Estado da Enquete' }
  ],
  'twitch-sub-goal': [
    { key: 'goal_title', label: 'Título da Meta' },
    { key: 'goal_progress_bar', label: 'Barra de Progresso' },
    { key: 'goal_values', label: 'Valores Atuais/Meta' }
  ],
};

export function isWidgetFragmentable(widgetId) {
  if (!widgetId) return false;
  if (NON_FRAGMENTABLE_WIDGET_IDS.includes(widgetId)) return false;
  return Boolean(WIDGET_ELEMENTS_MAP[widgetId]);
}

export function getWidgetInternalElements(widgetId) {
  if (!widgetId) return [];
  return WIDGET_ELEMENTS_MAP[widgetId] || [];
}

export function getWidgetDefaultDimensions(widgetId, isFullWidget) {
  if (!isFullWidget) {
    return { width: 260, height: 50 };
  }

  switch (widgetId) {
    case 'react-hub-widget':
    case 'react-hub':
      return { width: 420, height: 640 };
    case 'twitch-chat-box':
      return { width: 380, height: 560 };
    case 'twitch-alerts':
      return { width: 500, height: 140 };
    case 'twitch-event-list':
      return { width: 440, height: 460 };
    case 'youtube-native-poll':
      return { width: 380, height: 260 };
    case 'twitch-status-label':
      return { width: 320, height: 90 };
    case 'twitch-sub-goal':
    case 'twitch-bits-goal':
    case 'twitch-raid-goal':
      return { width: 380, height: 120 };
    case 'twitch-latest-sub':
    case 'twitch-latest-cheer':
    case 'twitch-latest-raid':
    case 'twitch-top-cheer':
      return { width: 280, height: 70 };
    case 'twitch-sub-counter':
    case 'twitch-bits-counter':
      return { width: 240, height: 80 };
    default: {
      if (widgetId?.startsWith('chat') || widgetId?.includes('chat')) return { width: 380, height: 560 };
      if (widgetId?.includes('alert')) return { width: 500, height: 140 };
      if (widgetId?.includes('event') || widgetId?.includes('list') || widgetId?.includes('feed')) return { width: 440, height: 460 };
      if (widgetId?.includes('goal')) return { width: 380, height: 120 };
      if (widgetId?.includes('status') || widgetId?.includes('label') || widgetId?.includes('counter')) return { width: 300, height: 80 };
      return { width: 360, height: 240 };
    }
  }
}
