import { Award, Bell, Users, MessageSquare, Tv, Clock } from 'lucide-react';

export const STRUCTURAL_PREMOLDS_ARCHETYPES = [
  {
    id: 'big-number',
    number: 1,
    name: 'Número Grande / Destaque',
    description: 'Valor principal muito grande com foco visual absoluto. Título e progresso são elementos secundários discretos.',
    aspectRatio: '240x110',
    defaultWidth: 240,
    defaultHeight: 110,
    badge: 'Destaque'
  },
  {
    id: 'circular-radial',
    number: 2,
    name: 'Circular / Radial',
    description: 'Composição redonda com valor ou percentual no núcleo central e progresso circular ao redor.',
    aspectRatio: '160x160',
    defaultWidth: 160,
    defaultHeight: 160,
    badge: 'Radial'
  },
  {
    id: 'pure-bar',
    number: 3,
    name: 'Somente Barra',
    description: 'Composição horizontal direta. Barra como elemento visual principal com valores nas extremidades, sem card envolvente.',
    aspectRatio: '380x36',
    defaultWidth: 380,
    defaultHeight: 38,
    badge: 'Minimalista'
  },
  {
    id: 'compact-mark',
    number: 4,
    name: 'Somente Marcador / Mark',
    description: 'Composição extremamente compacta com badge/ícone em destaque e valor curto associado para ocupar mínimo espaço.',
    aspectRatio: '150x42',
    defaultWidth: 150,
    defaultHeight: 42,
    badge: 'Compacto'
  },
  {
    id: 'horizontal-panel',
    number: 5,
    name: 'Painel Horizontal',
    description: 'Título, valor e informações distribuídos lateralmente em 3 blocos. Ideal para topo ou rodapé da stream.',
    aspectRatio: '460x54',
    defaultWidth: 460,
    defaultHeight: 54,
    badge: 'Header / Footer'
  },
  {
    id: 'vertical-panel',
    number: 6,
    name: 'Painel Vertical',
    description: 'Elementos empilhados em coluna estreita e alta com ícone no topo, valor no centro e métricas na base.',
    aspectRatio: '140x220',
    defaultWidth: 140,
    defaultHeight: 220,
    badge: 'Coluna Lateral'
  },
  {
    id: 'hud-modules',
    number: 7,
    name: 'HUD / Módulos',
    description: 'Informações particionadas em blocos modulares independentes com estética de interface gamer e linhas conectoras.',
    aspectRatio: '360x72',
    defaultWidth: 360,
    defaultHeight: 72,
    badge: 'Cyber HUD'
  },
  {
    id: 'central-card',
    number: 8,
    name: 'Card Central',
    description: 'Composição concentrada e equilibrada com ícone no topo, valor centralizado e informações auxiliares organizadas.',
    aspectRatio: '220x180',
    defaultWidth: 220,
    defaultHeight: 180,
    badge: 'Card Focado'
  },
  {
    id: 'lower-third',
    number: 9,
    name: 'Faixa / Lower Third',
    description: 'Formato de faixa de transmissão profissional com aba chanfrada de entrada para o ícone e corpo estendido.',
    aspectRatio: '420x56',
    defaultWidth: 420,
    defaultHeight: 56,
    badge: 'Broadcast'
  },
  {
    id: 'asymmetric-offset',
    number: 10,
    name: 'Assimétrico / Offset',
    description: 'Composição deliberadamente não centralizada com blocos sobrepostos em alturas e tamanhos diferentes.',
    aspectRatio: '280x120',
    defaultWidth: 280,
    defaultHeight: 120,
    badge: 'Offset Gamer'
  }
];

export const WIDGET_STRUCTURAL_TYPES = [
  {
    id: 'goals',
    name: 'Metas / Goals',
    categoryLabel: 'Metas Numéricas & Progresso',
    icon: Award,
    description: 'Metas de Inscritos, Seguidores, Bits e Doações com contadores e barras de progresso.',
    targetWidgetId: 'twitch-sub-goal',
    sampleData: {
      title: 'Meta de Inscritos',
      current: 38,
      target: 50,
      percentage: 76,
      unit: 'Subs',
      sublabel: 'Faltam 12 para a meta'
    }
  },
  {
    id: 'alerts',
    name: 'Alertas & Eventos',
    categoryLabel: 'Feed de Eventos & Reconhecimento',
    icon: Bell,
    description: 'Último Inscrito, Seguidor, Cheer, Raid e Alertas de transmissão em tempo real.',
    targetWidgetId: 'twitch-latest-sub',
    sampleData: {
      title: 'Último Inscrito',
      badge: 'NOVO SUB',
      user: 'Rodrigo_Silveira',
      detail: 'Tier 1 • Há 5 min',
      months: '3 Meses'
    }
  },
  {
    id: 'audience',
    name: 'Contador & Audiência',
    categoryLabel: 'Telemetria de Espectadores',
    icon: Users,
    description: 'Contador de Viewers ao vivo, Status Online/Offline e Pico de audiência.',
    targetWidgetId: 'twitch-status-label',
    sampleData: {
      title: 'Espectadores',
      count: '1.420',
      status: 'AO VIVO',
      peak: '2.890',
      uptime: '03:42:15'
    }
  },
  {
    id: 'chat',
    name: 'Chat & Destaques',
    categoryLabel: 'Mensagens & Comunidade',
    icon: MessageSquare,
    description: 'Caixa de chat, balões de fala, mensagens fixadas e destaques do público.',
    targetWidgetId: 'twitch-chat-box',
    sampleData: {
      title: 'Mensagem em Destaque',
      author: 'Gamer_Pro',
      message: 'Boa live galera! GG demais essa jogada 🔥',
      time: 'Agora'
    }
  },
  {
    id: 'stream-info',
    name: 'Informações da Live',
    categoryLabel: 'Metadados da Transmissão',
    icon: Tv,
    description: 'Título da Stream, Categoria/Jogo atual, Canal e Tempo de transmissão (Uptime).',
    targetWidgetId: 'live-info-title',
    sampleData: {
      streamer: 'Streamer_Nexus',
      title: 'Rumo ao Desafiante | Subathon Day 3',
      category: 'Valorant',
      uptime: '03:42:15'
    }
  },
  {
    id: 'utility-clock',
    name: 'Utilitários & Tempo',
    categoryLabel: 'Relógio, Cronômetro & Timers',
    icon: Clock,
    description: 'Relógio digital, analógico, cronômetro progressivo e contagem regressiva.',
    targetWidgetId: 'utility-clock',
    sampleData: {
      time: '20:45:00',
      date: 'Sábado, 24 Set',
      label: 'Horário Local',
      timer: '00:15:30'
    }
  }
];

export function resolveWidgetCategory(widgetId) {
  if (!widgetId) return 'goals';
  const id = widgetId.toLowerCase();
  
  if (id.includes('goal') || id.includes('meta')) return 'goals';
  if (id.includes('sub') && (id.includes('goal') || id.includes('counter'))) return 'goals';
  if (id.includes('bits') && id.includes('goal')) return 'goals';
  
  if (id.includes('alert') || id.includes('latest') || id.includes('last') || id.includes('event') || id.includes('cheer') || id.includes('raid') || id.includes('follow')) return 'alerts';
  
  if (id.includes('status') || id.includes('audience') || id.includes('viewer') || id.includes('peak') || id.includes('online')) return 'audience';
  
  if (id.includes('chat') || id.includes('message') || id.includes('highlight') || id.includes('chatter') || id.includes('vibe') || id.includes('speed')) return 'chat';
  
  if (id.includes('uptime') || id.includes('stream-info') || id.includes('live-info') || id.includes('title') || id.includes('game') || id.includes('category') || id.includes('channel') || id.includes('schedule') || id.includes('rules') || id.includes('commands')) return 'stream-info';
  
  if (id.includes('clock') || id.includes('time') || id.includes('timer') || id.includes('stopwatch') || id.includes('countdown') || id.includes('utility')) return 'utility-clock';

  return 'goals';
}
