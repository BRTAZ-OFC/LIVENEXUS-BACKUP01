import TwitchChatBox from './twitch/Widget_TwitchChatBox';
import TwitchAlerts from './twitch/Widget_TwitchAlerts';
import TwitchEventList from './twitch/Widget_TwitchEventList';
import TwitchStatusLabel from './twitch/Widget_TwitchStatusLabel';
import ReactHubWidget from './twitch/Widget_ReactHubWidget';
import YouTubeNativePoll from './Widget_YouTubeNativePoll';
import MultiViewersCounter from './multiplatform/Widget_MultiViewersCounter';
import { DeathCounter, ClockWidget, TimerWidget, NowPlayingWidget } from './Widget_ManualWidgets';
import PixWidget from './Widget_PixWidget';

import { TwitchSubGoal, TwitchBitsGoal, TwitchRaidGoal } from './twitch/Widget_TwitchGoalWidgets';
import { TwitchLatestSub, TwitchLatestCheer, TwitchLatestRaid, TwitchTopCheer, TwitchSubCounter, TwitchBitsCounter } from './twitch/Widget_TwitchLabelsWidgets';
import { TwitchChatSpeed, TwitchHypeMeter, TwitchChatVibe, TwitchViewersChart } from './twitch/Widget_TwitchAnalyticsWidgets';
import { TwitchChatterLeaderboard, TwitchPoll, TwitchRaffle, TwitchSubTrain } from './twitch/Widget_TwitchInteractiveWidgets';
import { TwitchWordCloud, TwitchEmoteShower } from './twitch/Widget_TwitchFunWidgets';
import { TwitchUptime, TwitchCommandsList, TwitchMilestones, TwitchRules, TwitchSchedule, TwitchScheduleTicker, TwitchModeratorFeed } from './twitch/Widget_TwitchStreamInfoWidgets';

export const TWITCH_WIDGETS_CATALOG = [
  {
    id: 'manual-death-counter', name: 'Contador de Mortes', implemented: true, category: 'manual',
    component: DeathCounter, defaultWidth: 320, defaultHeight: 120,
    defaultConfig: { deathCount: 0, fontFamily: 'Inter, sans-serif' }
  },
  {
    id: 'manual-clock', name: 'Relógio', implemented: true, category: 'manual',
    component: ClockWidget, defaultWidth: 320, defaultHeight: 120,
    defaultConfig: { timeZone: '', fontFamily: 'Inter, sans-serif' }
  },
  {
    id: 'manual-timer', name: 'Temporizador', implemented: true, category: 'manual',
    component: TimerWidget, defaultWidth: 320, defaultHeight: 120,
    defaultConfig: { durationSeconds: 300, fontFamily: 'Inter, sans-serif' }
  },
  {
    id: 'manual-now-playing', name: 'Tocando Agora', implemented: true, category: 'manual',
    component: NowPlayingWidget, defaultWidth: 320, defaultHeight: 120,
    defaultConfig: { fontFamily: 'Inter, sans-serif' }
  },
  {
    id: 'manual-pix-widget', name: 'Widget Pix', implemented: true, category: 'manual',
    component: PixWidget, defaultWidth: 280, defaultHeight: 330,
    defaultConfig: {
      title: 'Apoie com Pix',
      pixKey: '',
      pixName: 'LIVENEXUS STREAMER',
      pixCity: 'SAO PAULO',
      fontFamily: 'Inter, sans-serif'
    }
  },
  // --- ORIGINAIS ---
  {
    id: 'react-hub-widget',
    name: 'React Hub',
    implemented: true,
    category: 'twitch',
    component: ReactHubWidget,
    defaultWidth: 420,
    defaultHeight: 640,
    defaultConfig: {
      defaultMode: 'split',
      backgroundColor: 'rgba(2, 6, 23, 0.9)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'multi-viewers-counter',
    name: 'Espectadores Multiplataforma',
    implemented: true,
    category: 'multiplatform',
    component: MultiViewersCounter,
    defaultWidth: 480,
    defaultHeight: 70,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-chat-box',
    name: 'Chatbox',
    implemented: true,
    category: 'twitch',
    component: TwitchChatBox,
    defaultWidth: 380,
    defaultHeight: 560,
    defaultConfig: {
      fontSize: '13px',
      textColor: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-alerts',
    name: 'Alertas',
    implemented: true,
    category: 'twitch',
    component: TwitchAlerts,
    defaultWidth: 500,
    defaultHeight: 140,
    defaultConfig: {
      duration: 5000,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-event-list',
    name: 'Lista de Eventos',
    implemented: true,
    category: 'twitch',
    component: TwitchEventList,
    defaultWidth: 440,
    defaultHeight: 460,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-status-label',
    name: 'Status da Transmissão',
    implemented: true,
    category: 'twitch',
    component: TwitchStatusLabel,
    defaultWidth: 320,
    defaultHeight: 90,
    defaultConfig: {
      fontSize: '12px',
      textColor: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },

  {
    id: 'youtube-native-poll',
    name: 'Enquete nativa do YouTube',
    implemented: true,
    category: 'youtube',
    component: YouTubeNativePoll,
    defaultWidth: 380,
    defaultHeight: 260,
    defaultConfig: { fontFamily: 'Inter, sans-serif' }
  },

  // --- NOVAS WIDGETS DE METAS (GOALS) ---
  {
    id: 'twitch-sub-goal',
    name: 'Meta de Subs da Twitch',
    implemented: true,
    category: 'twitch',
    component: TwitchSubGoal,
    defaultWidth: 380,
    defaultHeight: 120,
    defaultConfig: {
      startValue: 0,
      targetValue: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-bits-goal',
    name: 'Meta de Bits da Twitch',
    implemented: true,
    category: 'twitch',
    component: TwitchBitsGoal,
    defaultWidth: 380,
    defaultHeight: 120,
    defaultConfig: {
      startValue: 0,
      targetValue: 2500,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-raid-goal',
    name: 'Meta de Raids da Twitch',
    implemented: true,
    category: 'twitch',
    component: TwitchRaidGoal,
    defaultWidth: 380,
    defaultHeight: 120,
    defaultConfig: {
      startValue: 0,
      targetValue: 5,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },

  // --- NOVAS WIDGETS DE LABELS (INFO INDIVIDUAL) ---
  {
    id: 'twitch-latest-sub',
    name: 'Último Sub da Twitch',
    implemented: true,
    category: 'twitch',
    component: TwitchLatestSub,
    defaultWidth: 280,
    defaultHeight: 70,
    defaultConfig: {
      placeholder: 'Nenhum inscrito registrado',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-latest-cheer',
    name: 'Último Cheer da Twitch (Bits)',
    implemented: true,
    category: 'twitch',
    component: TwitchLatestCheer,
    defaultWidth: 280,
    defaultHeight: 70,
    defaultConfig: {
      placeholder: 'Nenhum cheer enviado',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-latest-raid',
    name: 'Última Raid da Twitch',
    implemented: true,
    category: 'twitch',
    component: TwitchLatestRaid,
    defaultWidth: 280,
    defaultHeight: 70,
    defaultConfig: {
      placeholder: 'Sem raids recentes',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-top-cheer',
    name: 'Maior Cheer da Twitch',
    implemented: true,
    category: 'twitch',
    component: TwitchTopCheer,
    defaultWidth: 280,
    defaultHeight: 70,
    defaultConfig: {
      placeholder: 'Nenhum cheer registrado',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-sub-counter',
    name: 'Contador de Subs da Twitch',
    implemented: true,
    category: 'twitch',
    component: TwitchSubCounter,
    defaultWidth: 240,
    defaultHeight: 80,
    defaultConfig: {
      startValue: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-bits-counter',
    name: 'Contador de Bits da Twitch',
    implemented: true,
    category: 'twitch',
    component: TwitchBitsCounter,
    defaultWidth: 240,
    defaultHeight: 80,
    defaultConfig: {
      startValue: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },

  // --- NOVAS WIDGETS DE ANALYTICS (MÉTRICAS) ---
  {
    id: 'twitch-chat-speed',
    name: 'Velocidade do Chat',
    implemented: true,
    category: 'twitch',
    component: TwitchChatSpeed,
    defaultWidth: 320,
    defaultHeight: 120,
    defaultConfig: {
      minValue: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-hype-meter',
    name: 'Hypeômetro',
    implemented: true,
    category: 'twitch',
    component: TwitchHypeMeter,
    defaultWidth: 320,
    defaultHeight: 140,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-chat-vibe',
    name: 'Termômetro de Vibe',
    implemented: true,
    category: 'twitch',
    component: TwitchChatVibe,
    defaultWidth: 320,
    defaultHeight: 120,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-viewers-chart',
    name: 'Audiência Recente (Gráfico)',
    implemented: true,
    category: 'twitch',
    component: TwitchViewersChart,
    defaultWidth: 380,
    defaultHeight: 200,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },

  // --- NOVAS WIDGETS INTERATIVAS (CHAT ENGAGEMENT) ---
  {
    id: 'twitch-chatter-leaderboard',
    name: 'Top Chatters (Ranking)',
    implemented: true,
    category: 'twitch',
    component: TwitchChatterLeaderboard,
    defaultWidth: 340,
    defaultHeight: 400,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-poll',
    name: 'Enquete Interativa',
    implemented: true,
    category: 'twitch',
    component: TwitchPoll,
    defaultWidth: 380,
    defaultHeight: 260,
    defaultConfig: {
      question: 'A live hoje está legal?',
      options: [
        { text: 'Sim', label: '1' },
        { text: 'Não', label: '2' },
        { text: 'Mais ou menos', label: '3' },
        { text: 'Ruim', label: '4' }
      ],
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-raffle',
    name: 'Sorteio de Chat',
    implemented: true,
    category: 'twitch',
    component: TwitchRaffle,
    defaultWidth: 360,
    defaultHeight: 240,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-sub-train',
    name: 'Trem do Sub da Twitch (Hype Train)',
    implemented: true,
    category: 'twitch',
    component: TwitchSubTrain,
    defaultWidth: 380,
    defaultHeight: 130,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },

  // --- NOVAS WIDGETS DE DIVERSÃO (CHAT FUN) ---
  {
    id: 'twitch-word-cloud',
    name: 'Nuvem de Palavras',
    implemented: true,
    category: 'twitch',
    component: TwitchWordCloud,
    defaultWidth: 380,
    defaultHeight: 260,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-emote-shower',
    name: 'Chuva de Emotes da Twitch',
    implemented: true,
    category: 'twitch',
    component: TwitchEmoteShower,
    defaultWidth: 400,
    defaultHeight: 300,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },

  // --- NOVAS WIDGETS DE STREAM INFO (INFORMAÇÕES) ---
  {
    id: 'twitch-uptime',
    name: 'Cronômetro / Uptime',
    implemented: true,
    category: 'twitch',
    component: TwitchUptime,
    defaultWidth: 260,
    defaultHeight: 70,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-commands-list',
    name: 'Lista de Comandos',
    implemented: true,
    category: 'twitch',
    component: TwitchCommandsList,
    defaultWidth: 340,
    defaultHeight: 380,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-milestones',
    name: 'Conquistas da Twitch',
    implemented: true,
    category: 'twitch',
    component: TwitchMilestones,
    defaultWidth: 340,
    defaultHeight: 260,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-rules',
    name: 'Regras do Canal',
    implemented: true,
    category: 'twitch',
    component: TwitchRules,
    defaultWidth: 340,
    defaultHeight: 380,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-schedule',
    name: 'Agenda de Streams',
    implemented: true,
    category: 'twitch',
    component: TwitchSchedule,
    defaultWidth: 360,
    defaultHeight: 320,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-schedule-ticker',
    name: 'Letreiro de Agenda',
    implemented: true,
    category: 'twitch',
    component: TwitchScheduleTicker,
    defaultWidth: 500,
    defaultHeight: 60,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'twitch-moderator-feed',
    name: 'Logs de Moderação',
    implemented: true,
    category: 'twitch',
    component: TwitchModeratorFeed,
    defaultWidth: 380,
    defaultHeight: 420,
    defaultConfig: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '12px',
      showBorder: false,
      fontFamily: 'Inter, sans-serif'
    }
  }
];
