import React, { useState, useMemo } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { TWITCH_WIDGETS_CATALOG } from './Widget_twitchWidgetsCatalog';
import { isSubscriptionEvent, isRaidEvent } from '@dashboard/configuracao/Config_eventClassification';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  Tv,
} from 'lucide-react';

const WIDGET_DESCRIPTIONS = {
  'manual-death-counter': 'Contador manual; controle o valor no Config do editor.',
  'manual-clock': 'Exibe o horário atual no fuso escolhido no Config do editor.',
  'manual-timer': 'Contagem regressiva controlada pelo Config do editor.',
  'manual-now-playing': 'Mostra a faixa do player existente; o título permanece em movimento.',
  'youtube-native-poll': 'Exibe uma enquete nativa recebida do YouTube pelo fluxo global; não utiliza comandos de chat.',
  'multi-viewers-counter': 'Exibe a contagem de espectadores ao vivo lado a lado para Twitch, Kick e YouTube simultaneamente.',
  'react-hub-widget': 'Hub interativo multi-stream para transmissão sincronizada de chat e vídeos.',
  'twitch-chat-box': 'Renderiza as mensagens recebidas em tempo real do chat de forma sequencial com filtros de badges/roles.',
  'twitch-alerts': 'Exibe notificações gráficas animadas para eventos como subs, bits, resubs, community subgifts e raids.',
  'twitch-event-list': 'Apresenta um histórico dinâmico dos últimos eventos ocorridos na transmissão de forma consolidada.',
  'twitch-status-label': 'Exibe estatísticas de visualização ativa, título e categoria da transmissão atual.',
  'twitch-sub-goal': 'Meta visual para engajar a comunidade a alcançar um objetivo de novos inscritos.',
  'twitch-bits-goal': 'Barra de progresso interativa para incentivar o envio de bits na transmissão.',
  'twitch-raid-goal': 'Monitore o progresso para alcançar a meta de raids recebidas na live.',
  'twitch-latest-sub': 'Exibe o nome e o nível do usuário mais recente a se inscrever no canal.',
  'twitch-latest-cheer': 'Mostra o remetente e a quantia de bits do último cheer recebido.',
  'twitch-latest-raid': 'Identifica e exibe a última raid que visitou a transmissão com a quantidade de viewers.',
  'twitch-top-cheer': 'Exibe o maior envio individual de bits realizado durante toda a stream.',
  'twitch-sub-counter': 'Contador limpo e minimalista do número de inscrições ativas da sessão.',
  'twitch-bits-counter': 'Contador acumulativo em tempo real do total de bits enviados na transmissão.',
  'twitch-chat-speed': 'Calcula e exibe a velocidade atual de envio de mensagens no chat em tempo real.',
  'twitch-hype-meter': 'Medidor gráfico de empolgação e engajamento da stream baseado na atividade de chat e eventos.',
  'twitch-chat-vibe': 'Analisador de sentimento inteligente que mede a vibe do chat por meio de palavras-chave e emojis.',
  'twitch-viewers-chart': 'Gráfico histórico interativo em tempo real das flutuações na contagem de espectadores.',
  'twitch-chatter-leaderboard': 'Ranking dos espectadores mais ativos e engajados que mais enviaram mensagens.',
  'twitch-poll': 'Cria e exibe enquetes que computam votos do chat em tempo real pelo comando !voto <opção>.',
  'twitch-raffle': 'Widget de sorteio com adesão via !entrar no chat e escolha de vencedor com animações.',
  'twitch-sub-train': 'Trem do hype dinâmico que rastreia sequências rápidas de novos inscritos no canal.',
  'twitch-word-cloud': 'Nuvem de palavras dinâmicas que ressalta os tópicos mais comentados e repetidos do chat.',
  'twitch-emote-shower': 'Chuva de emotes flutuantes na tela acionada sempre que emotes são enviados no chat.',
  'twitch-uptime': 'Cronômetro preciso de tempo decorrido desde o início da transmissão.',
  'twitch-commands-list': 'Quadro informativo contendo a lista dos comandos de chat ativos para o público.',
  'twitch-milestones': 'Lista de marcos e conquistas completadas pela comunidade durante a transmissão.',
  'twitch-rules': 'Exibição animada das diretrizes e regras de comportamento configuradas para o canal.',
  'twitch-schedule': 'Agenda de transmissões contendo os dias, horários e tipos de lives da semana.',
  'twitch-schedule-ticker': 'Letreiro rotativo para avisos importantes, notícias e promoções do canal.',
  'twitch-moderator-feed': 'Histórico em tempo real de ações e logs executados pela moderação do canal.',
};

// Mapeamento rigoroso das plataformas pertencentes ao fluxo de cada widget
const WIDGET_PLATFORMS = {
  // Manual / Player Local
  'manual-death-counter': [],
  'manual-clock': [],
  'manual-timer': [],
  'manual-now-playing': [],

  // YouTube exclusivo
  'youtube-native-poll': ['YouTube'],

  // Multiplataforma (Twitch, Kick, YouTube)
  'multi-viewers-counter': ['Twitch', 'Kick', 'YouTube'],
  'react-hub-widget': ['Twitch', 'Kick', 'YouTube'],
  'twitch-chat-box': ['Twitch', 'Kick', 'YouTube'],
  'twitch-alerts': ['Twitch', 'Kick', 'YouTube'],
  'twitch-event-list': ['Twitch', 'Kick', 'YouTube'],
  'twitch-status-label': ['Twitch', 'Kick', 'YouTube'],
  'twitch-uptime': ['Twitch', 'Kick', 'YouTube'],
  'twitch-chat-speed': ['Twitch', 'Kick', 'YouTube'],
  'twitch-hype-meter': ['Twitch', 'Kick', 'YouTube'],
  'twitch-chat-vibe': ['Twitch', 'Kick', 'YouTube'],
  'twitch-viewers-chart': ['Twitch', 'Kick', 'YouTube'],
  'twitch-chatter-leaderboard': ['Twitch', 'Kick', 'YouTube'],
  'twitch-poll': ['Twitch', 'Kick', 'YouTube'],
  'twitch-raffle': ['Twitch', 'Kick', 'YouTube'],
  'twitch-word-cloud': ['Twitch', 'Kick', 'YouTube'],
  'twitch-commands-list': ['Twitch', 'Kick', 'YouTube'],
  'twitch-milestones': ['Twitch', 'Kick', 'YouTube'],
  'twitch-rules': ['Twitch', 'Kick', 'YouTube'],
  'twitch-schedule': ['Twitch', 'Kick', 'YouTube'],
  'twitch-schedule-ticker': ['Twitch', 'Kick', 'YouTube'],
  'twitch-sub-goal': ['Twitch', 'Kick', 'YouTube'],
  'twitch-sub-counter': ['Twitch', 'Kick', 'YouTube'],
  'twitch-latest-sub': ['Twitch', 'Kick', 'YouTube'],

  // Twitch / Kick
  'twitch-emote-shower': ['Twitch', 'Kick'],
  'twitch-raid-goal': ['Twitch', 'Kick'],
  'twitch-latest-raid': ['Twitch', 'Kick'],

  // Twitch exclusivo
  'twitch-bits-goal': ['Twitch'],
  'twitch-bits-counter': ['Twitch'],
  'twitch-top-cheer': ['Twitch'],
  'twitch-latest-cheer': ['Twitch'],
  'twitch-sub-train': ['Twitch'],
  'twitch-moderator-feed': ['Twitch'],
};

// Avaliação de estado real da combinação Widget × Plataforma
function evaluateWidgetPlatformStatus(widgetId, platform, { connections, streamMeta, liveActivity }) {
  const conn = connections?.[platform];
  const isConnected = conn?.status === 'connected';
  const hasError = conn?.status === 'error';

  if (!isConnected) {
    if (hasError) {
      return {
        state: 'error',
        label: 'NÃO ESTÁ PEGANDO',
        detail: 'Erro de conexão no fluxo da plataforma',
        color: 'rose',
      };
    }
    return {
      state: 'disconnected',
      label: 'DESCONECTADO',
      detail: 'Plataforma offline / não conectada',
      color: 'slate',
    };
  }

  const items = liveActivity?.items || [];
  const platItems = items.filter((i) => i.platform === platform);
  const platMessages = platItems.filter((i) => !i.eventType);
  const platEvents = platItems.filter((i) => Boolean(i.eventType));

  switch (widgetId) {
    // 1. Chatbox & React Hub: consomem o fluxo de chat em tempo real
    case 'twitch-chat-box':
    case 'react-hub-widget': {
      if (platMessages.length > 0) {
        return {
          state: 'functional',
          label: 'FUNCIONAL',
          detail: `${platMessages.length} msgs recebidas`,
          color: 'emerald',
        };
      }
      return {
        state: 'waiting_data',
        label: 'SEM DADOS NO MOMENTO',
        detail: 'Conexão ativa, aguardando mensagens',
        color: 'amber',
      };
    }

    // 2. Enquete Nativa do YouTube
    case 'youtube-native-poll': {
      const activePoll = platEvents.find((i) => i.eventType === 'youtube_poll' && !i.eventMeta?.closed);
      if (activePoll) {
        return {
          state: 'functional',
          label: 'FUNCIONAL',
          detail: 'Enquete nativa ativa consumida',
          color: 'emerald',
        };
      }
      return {
        state: 'waiting_data',
        label: 'SEM DADOS NO MOMENTO',
        detail: 'Sem enquete ativa na live',
        color: 'amber',
      };
    }

    // 3. Alertas e Lista de Eventos
    case 'twitch-alerts':
    case 'twitch-event-list': {
      if (platEvents.length > 0) {
        return {
          state: 'functional',
          label: 'FUNCIONAL',
          detail: `${platEvents.length} eventos capturados`,
          color: 'emerald',
        };
      }
      return {
        state: 'waiting_data',
        label: 'SEM DADOS NO MOMENTO',
        detail: 'Aguardando novos eventos',
        color: 'amber',
      };
    }

    // 4. Status da Stream (Viewers, Título, Categoria)
    case 'twitch-status-label': {
      const viewers = conn.viewers;
      const meta = streamMeta?.[platform];
      const hasViewers = Number.isFinite(viewers);
      const hasTitle = Boolean(meta?.title || meta?.channelName);

      if (hasViewers || hasTitle) {
        return {
          state: 'functional',
          label: 'FUNCIONAL',
          detail: hasViewers ? `${viewers} viewers capturados` : 'Metadados sincronizados',
          color: 'emerald',
        };
      }
      return {
        state: 'waiting_data',
        label: 'SEM DADOS NO MOMENTO',
        detail: 'Aguardando metadados de transmissão',
        color: 'amber',
      };
    }

    // 5. Uptime
    case 'twitch-uptime': {
      const startedAt = streamMeta?.[platform]?.startedAt;
      if (startedAt && Number.isFinite(new Date(startedAt).getTime())) {
        return {
          state: 'functional',
          label: 'FUNCIONAL',
          detail: 'Horário de início detectado',
          color: 'emerald',
        };
      }
      return {
        state: 'waiting_data',
        label: 'SEM DADOS NO MOMENTO',
        detail: 'Aguardando horário de início da live',
        color: 'amber',
      };
    }

    // 6. Gráfico de Espectadores e Contador Multiplataforma
    case 'multi-viewers-counter':
    case 'twitch-viewers-chart': {
      const viewers = conn.viewers;
      if (Number.isFinite(viewers)) {
        return {
          state: 'functional',
          label: 'FUNCIONAL',
          detail: `${viewers} viewers ativos`,
          color: 'emerald',
        };
      }
      return {
        state: 'waiting_data',
        label: 'SEM DADOS NO MOMENTO',
        detail: 'Aguardando contagem de viewers',
        color: 'amber',
      };
    }

    // 7. Velocidade do Chat, Vibe, Nuvem de Palavras, Ranking de Chatters, Hype Meter
    case 'twitch-chat-speed':
    case 'twitch-hype-meter':
    case 'twitch-chat-vibe':
    case 'twitch-word-cloud':
    case 'twitch-chatter-leaderboard': {
      if (platMessages.length > 0) {
        return {
          state: 'functional',
          label: 'FUNCIONAL',
          detail: `${platMessages.length} msgs analisadas`,
          color: 'emerald',
        };
      }
      return {
        state: 'waiting_data',
        label: 'SEM DADOS NO MOMENTO',
        detail: 'Aguardando mensagens do chat',
        color: 'amber',
      };
    }

    // 8. Enquete de Chat (!voto) e Sorteio (!entrar)
    case 'twitch-poll':
    case 'twitch-raffle': {
      if (platMessages.length > 0) {
        return {
          state: 'functional',
          label: 'FUNCIONAL',
          detail: 'Canal de chat ativo',
          color: 'emerald',
        };
      }
      return {
        state: 'waiting_data',
        label: 'SEM DADOS NO MOMENTO',
        detail: 'Aguardando mensagens no chat',
        color: 'amber',
      };
    }

    // 9. Inscrições / Membros
    case 'twitch-latest-sub':
    case 'twitch-sub-counter': {
      const subs = platEvents.filter((i) => isSubscriptionEvent(i));
      if (subs.length > 0) {
        return {
          state: 'functional',
          label: 'FUNCIONAL',
          detail: `${subs.length} inscritos/membros`,
          color: 'emerald',
        };
      }
      return {
        state: 'waiting_data',
        label: 'SEM DADOS NO MOMENTO',
        detail: 'Sem novos inscritos nesta sessão',
        color: 'amber',
      };
    }
    case 'twitch-sub-goal': {
      return {
        state: 'functional',
        label: 'FUNCIONAL',
        detail: 'Meta ativa com fluxo de live',
        color: 'emerald',
      };
    }

    // 10. Bits (Twitch)
    case 'twitch-bits-goal':
    case 'twitch-bits-counter': {
      return {
        state: 'functional',
        label: 'FUNCIONAL',
        detail: 'Monitor de bits conectado',
        color: 'emerald',
      };
    }
    case 'twitch-top-cheer':
    case 'twitch-latest-cheer': {
      const cheers = platEvents.filter((i) => i.eventType === 'twitch_bits');
      if (cheers.length > 0) {
        return {
          state: 'functional',
          label: 'FUNCIONAL',
          detail: `${cheers.length} cheers recebidos`,
          color: 'emerald',
        };
      }
      return {
        state: 'waiting_data',
        label: 'SEM DADOS NO MOMENTO',
        detail: 'Sem bits enviados na sessão',
        color: 'amber',
      };
    }

    // 11. Raids
    case 'twitch-raid-goal': {
      return {
        state: 'functional',
        label: 'FUNCIONAL',
        detail: 'Meta de raids ativa',
        color: 'emerald',
      };
    }
    case 'twitch-latest-raid': {
      const raids = platEvents.filter((i) => isRaidEvent(i));
      if (raids.length > 0) {
        return {
          state: 'functional',
          label: 'FUNCIONAL',
          detail: `${raids.length} raids registradas`,
          color: 'emerald',
        };
      }
      return {
        state: 'waiting_data',
        label: 'SEM DADOS NO MOMENTO',
        detail: 'Sem raids registradas na sessão',
        color: 'amber',
      };
    }

    // 12. Chuva de Emotes
    case 'twitch-emote-shower': {
      const emoteMsgs = platMessages.filter((i) => i.emotes || /:\w+:/.test(i.text));
      if (emoteMsgs.length > 0) {
        return {
          state: 'functional',
          label: 'FUNCIONAL',
          detail: `${emoteMsgs.length} emotes detectados`,
          color: 'emerald',
        };
      }
      return {
        state: 'waiting_data',
        label: 'SEM DADOS NO MOMENTO',
        detail: 'Sem emotes enviados recentemente',
        color: 'amber',
      };
    }

    // 13. Sub Train e Mod Feed
    case 'twitch-sub-train':
    case 'twitch-moderator-feed': {
      return {
        state: 'functional',
        label: 'FUNCIONAL',
        detail: 'Conexão ativa com a plataforma',
        color: 'emerald',
      };
    }

    // Widgets informativos configurados
    default: {
      return {
        state: 'functional',
        label: 'FUNCIONAL',
        detail: 'Mecanismo ativo',
        color: 'emerald',
      };
    }
  }
}

// Helper para estilização compacta dos badges de estado
function StatusBadgePill({ status }) {
  if (status.state === 'functional') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        FUNCIONAL
      </span>
    );
  }

  if (status.state === 'waiting_data') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        SEM DADOS NO MOMENTO
      </span>
    );
  }

  if (status.state === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_#ef4444]" />
        NÃO ESTÁ PEGANDO
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 bg-slate-800/40 border border-white/5">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
      DESCONECTADO
    </span>
  );
}

const PLATFORM_COLORS = {
  Twitch: { text: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-500/30' },
  Kick: { text: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30' },
  YouTube: { text: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-500/30' },
};

export default function WidgetsSection() {
  const { connections, streamMeta, liveActivity } = useStreaming();

  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL'); // ALL | Multi | Twitch | Kick | YouTube | Manual
  const [showPreviews, setShowPreviews] = useState(false);

  const monitoredPlatforms = ['Twitch', 'Kick', 'YouTube'];
  const hasAnyConnection = monitoredPlatforms.some((p) => connections?.[p]?.status === 'connected');

  // Ordenação garantindo que Chatbox e React Hub apareçam logo nas primeiras posições
  const orderedCatalog = useMemo(() => {
    const priority = ['multi-viewers-counter', 'twitch-chat-box', 'react-hub-widget', 'twitch-alerts', 'twitch-event-list', 'youtube-native-poll'];
    return [...TWITCH_WIDGETS_CATALOG].sort((a, b) => {
      const pA = priority.indexOf(a.id);
      const pB = priority.indexOf(b.id);
      if (pA !== -1 && pB !== -1) return pA - pB;
      if (pA !== -1) return -1;
      if (pB !== -1) return 1;
      return 0;
    });
  }, []);

  // Filtragem da lista
  const filteredCatalog = useMemo(() => {
    return orderedCatalog.filter((widget) => {
      const plats = WIDGET_PLATFORMS[widget.id] || [];
      const matchesSearch =
        widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        widget.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (platformFilter === 'ALL') return true;
      if (platformFilter === 'Multi') return plats.length === 3;
      if (platformFilter === 'Manual') return widget.category === 'manual' || plats.length === 0;
      return plats.includes(platformFilter);
    });
  }, [orderedCatalog, searchQuery, platformFilter]);

  // Contadores globais rápidos
  const stats = useMemo(() => {
    let functionalCount = 0;
    let waitingCount = 0;
    let disconnectedCount = 0;

    orderedCatalog.forEach((w) => {
      const plats = WIDGET_PLATFORMS[w.id] || [];
      if (w.category === 'manual' || plats.length === 0) {
        functionalCount++;
        return;
      }
      plats.forEach((p) => {
        const s = evaluateWidgetPlatformStatus(w.id, p, { connections, streamMeta, liveActivity });
        if (s.state === 'functional') functionalCount++;
        else if (s.state === 'waiting_data') waitingCount++;
        else disconnectedCount++;
      });
    });

    return { functionalCount, waitingCount, disconnectedCount };
  }, [orderedCatalog, connections, streamMeta, liveActivity]);

  return (
    <div className="space-y-4 animate-editor-fade-in">
      {/* Header Compacto com Monitor por Plataforma */}
      <header className="rounded-2xl border border-white/10 bg-[#0c101c] p-4 space-y-3.5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Tv className="h-4.5 w-4.5 text-violet-400" />
              <span>Monitor de Widgets & Conexões</span>
            </h2>
            <p className="text-xs text-slate-400">
              Estado real de consumo de dados por combinação de Widget × Plataforma
            </p>
          </div>

          {/* Badges de Conexão das 3 Plataformas */}
          <div className="flex flex-wrap items-center gap-2">
            {monitoredPlatforms.map((platform) => {
              const isConnected = connections?.[platform]?.status === 'connected';
              const isConnecting = connections?.[platform]?.status === 'connecting';
              const meta = PLATFORM_COLORS[platform];

              return (
                <div
                  key={platform}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all ${
                    isConnected
                      ? `${meta.bg} ${meta.border} ${meta.text}`
                      : isConnecting
                      ? 'bg-amber-950/20 border-amber-500/25 text-amber-300'
                      : 'bg-rose-950/15 border-rose-500/20 text-rose-300'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      isConnected
                        ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]'
                        : isConnecting
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span>
                    {platform}: {isConnected ? 'CONECTADO' : isConnecting ? 'CONECTANDO' : 'DESCONECTADO'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barra de Filtros e Busca Rápida */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-white/5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Filtro:</span>
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'Multi', label: 'Multiplataforma' },
              { id: 'Twitch', label: 'Twitch' },
              { id: 'Kick', label: 'Kick' },
              { id: 'YouTube', label: 'YouTube' },
              { id: 'Manual', label: 'Manuais' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setPlatformFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  platformFilter === f.id
                    ? 'bg-violet-600 text-white font-semibold shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Campo de Busca */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar widget..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 w-36 sm:w-44"
              />
            </div>

            {/* Alternador de Previews */}
            <button
              onClick={() => setShowPreviews((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                showPreviews
                  ? 'bg-violet-950/40 border-violet-500/40 text-violet-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Exibir/Ocultar preview visual interativo das widgets"
            >
              {showPreviews ? <Eye className="h-3.5 w-3.5 text-violet-400" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{showPreviews ? 'Ocultar Previews' : 'Ver Previews'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Alerta quando nenhuma plataforma estiver conectada */}
      {!hasAnyConnection && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/15 text-rose-200 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              Nenhuma plataforma de streaming conectada no momento. Para receber eventos e dados ao vivo, ative suas contas em Conexões.
            </span>
          </div>
          <button
            onClick={() => {
              const btn = document.querySelector('[data-section="config"]');
              if (btn) btn.click();
              else window.location.hash = '#config';
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition-all shrink-0 active:scale-95 shadow"
          >
            <span>Conexões</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Grid Compacto de Widgets */}
      <div className="grid gap-3.5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {filteredCatalog.map((widget) => {
          const WidgetComponent = widget.component;
          const platforms = WIDGET_PLATFORMS[widget.id] || [];
          const isManual = widget.category === 'manual' || platforms.length === 0;

          return (
            <div
              key={widget.id}
              className="flex flex-col rounded-xl border border-white/10 bg-[#0a0d15] hover:border-white/20 transition-all overflow-hidden shadow-lg"
            >
              {/* Header do Card */}
              <div className="p-3 bg-black/30 border-b border-white/5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                      {isManual
                        ? 'Manual / Player'
                        : platforms.length === 3
                        ? 'Multiplataforma'
                        : platforms.join(' · ')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 truncate" title={widget.id}>
                      {widget.id}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm truncate">{widget.name}</h3>
                </div>
              </div>

              {/* Matriz de Plataformas Reais */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                <p className="text-[11px] text-slate-400 leading-tight">
                  {WIDGET_DESCRIPTIONS[widget.id] || 'Widget de transmissão integrado ao fluxo de dados.'}
                </p>

                {/* Status por Plataforma */}
                <div className="space-y-1.5 bg-black/40 rounded-lg p-2 border border-white/5">
                  {isManual ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] text-slate-300">Controle Local</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" />
                        DISPONÍVEL
                      </span>
                    </div>
                  ) : (
                    platforms.map((plat) => {
                      const platStatus = evaluateWidgetPlatformStatus(widget.id, plat, {
                        connections,
                        streamMeta,
                        liveActivity,
                      });
                      const pMeta = PLATFORM_COLORS[plat];

                      return (
                        <div key={plat} className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`font-mono font-semibold text-[11px] ${pMeta.text}`}>
                              {plat}:
                            </span>
                            <span
                              className="text-[10px] text-slate-400 font-mono truncate hidden sm:inline"
                              title={platStatus.detail}
                            >
                              {platStatus.detail}
                            </span>
                          </div>

                          <div className="shrink-0">
                            <StatusBadgePill status={platStatus} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Preview Opcional */}
                {showPreviews && (
                  <div className="relative h-36 rounded-lg overflow-hidden border border-white/5 bg-slate-950/80 p-2 flex flex-col justify-end mt-1">
                    <div className="absolute top-1.5 left-2 z-10 select-none">
                      <span className="text-[8px] font-mono uppercase tracking-wider text-slate-500 bg-black/60 px-1 py-0.5 rounded">
                        Live Preview
                      </span>
                    </div>
                    <div className="w-full h-full pt-4">
                      <WidgetComponent config={widget.defaultConfig} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
