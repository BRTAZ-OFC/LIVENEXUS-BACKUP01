import React from 'react';
import { Tv, Clock, Terminal, CheckCircle2, Scroll, Calendar, LayoutGrid, ShieldAlert, Radio } from 'lucide-react';

export const STATUS_LABEL_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Banner Completo Broadcast',
    description: 'Painel completo com status ao vivo, espectadores, jogo e título.',
    aspectRatio: '380x90',
    defaultWidth: 380,
    defaultHeight: 90,
    badge: 'Broadcast',
    render: ({ isOnline = false, viewers = '0', title = 'Live', game = 'Geral' }) => {
      const v = isOnline ? String(viewers) : '0';
      const t = isOnline ? (title || 'Transmissão ao vivo') : 'Live offline';
      const g = isOnline ? (game || '') : '';

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex flex-col justify-between select-none text-left shadow-xl">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="font-bold text-white uppercase">{isOnline ? 'AO VIVO' : 'OFFLINE'}</span>
            </div>
            <span className="text-cyan-300 font-bold">{v} VIEWERS</span>
          </div>
          <div className="truncate my-0.5">
            <span className="text-xs font-black text-white block truncate">{t}</span>
            {g && <span className="text-[9.5px] text-purple-300 block truncate">{g}</span>}
          </div>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Badge Duplo Compacto',
    description: 'Etiqueta compacta dividida entre status AO VIVO e contagem de espectadores.',
    aspectRatio: '200x50',
    defaultWidth: 200,
    defaultHeight: 50,
    badge: 'Double Badge',
    render: ({ isOnline = false, viewers = '0' }) => {
      const v = isOnline ? String(viewers) : 'Offline';

      return (
        <div className="w-full h-full rounded-full bg-slate-900/90 border border-white/10 p-1 flex items-center justify-between select-none shadow-md text-left">
          <div className={`flex items-center gap-1.5 px-2 py-1 ${isOnline ? 'bg-red-600' : 'bg-slate-700'} rounded-full text-white font-mono font-black text-[9px] uppercase`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
            <span>{isOnline ? 'LIVE' : 'OFF'}</span>
          </div>
          <span className="text-xs font-mono font-black text-white pr-2.5">{v}</span>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'HUD Gamer com Qualidade',
    description: 'Interface sci-fi com frequência e indicação de estabilidade.',
    aspectRatio: '340x80',
    defaultWidth: 340,
    defaultHeight: 80,
    badge: 'Cyber HUD',
    render: ({ isOnline = false, viewers = '0' }) => {
      const v = isOnline ? String(viewers) : '0';

      return (
        <div className="w-full h-full p-2.5 bg-black/90 border border-cyan-400 flex flex-col justify-between select-none text-left shadow-xl" style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
          <div className="flex justify-between text-[8.5px] font-mono text-cyan-300">
            <span>[STREAM_STATUS_V4]</span>
            <span>{isOnline ? '1080p60 • ESTÁVEL' : 'OFFLINE'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-black text-white">{isOnline ? 'SINAL AO VIVO' : 'SEM SINAL'}</span>
            <span className="text-sm font-mono font-black text-cyan-400">{v} VIEWERS</span>
          </div>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Card de Transmissão com Categoria',
    description: 'Card com destaque para a categoria ou jogo da live.',
    aspectRatio: '300x120',
    defaultWidth: 300,
    defaultHeight: 120,
    badge: 'Category Card',
    render: ({ isOnline = false, game = 'Geral' }) => {
      const g = isOnline ? (game || 'Geral') : 'Transmissão Offline';

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex items-center gap-3 select-none text-left shadow-xl">
          <div className="h-12 w-12 rounded-xl bg-purple-600/30 border border-purple-400 flex items-center justify-center text-purple-300 shrink-0">
            <Tv className="h-6 w-6" />
          </div>
          <div className="truncate flex-1">
            <span className="text-[9px] font-mono text-purple-300 uppercase block">{isOnline ? 'JOGANDO AGORA' : 'STATUS'}</span>
            <span className="text-sm font-bold text-white truncate block">{g}</span>
          </div>
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'Lower Third de Apresentação',
    description: 'Faixa estendida para canto de tela com dados da live.',
    aspectRatio: '440x60',
    defaultWidth: 440,
    defaultHeight: 60,
    badge: 'Lower Third',
    render: ({ isOnline = false, title = 'Live' }) => {
      const t = isOnline ? (title || 'Transmissão ao vivo') : 'Live offline';

      return (
        <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <span className="text-xs font-bold text-white truncate pr-3">{t}</span>
          <span className={`text-[10px] font-mono font-bold ${isOnline ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-400 bg-slate-800'} px-2 py-0.5 rounded shrink-0`}>
            {isOnline ? 'AO VIVO' : 'OFFLINE'}
          </span>
        </div>
      );
    }
  },
  {
    id: '06',
    number: 6,
    name: 'Faixa Minimalista com Sombras',
    description: 'Texto sobreposto com sombra profunda projetada para jogo.',
    aspectRatio: '360x42',
    defaultWidth: 360,
    defaultHeight: 42,
    badge: 'Clean Overlay',
    render: ({ isOnline = false, viewers = '0' }) => {
      const v = isOnline ? String(viewers) : 'Offline';

      return (
        <div className="w-full h-full p-2 flex items-center gap-2 select-none text-left drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
          <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-500'}`} />
          <span className="text-xs font-black text-white uppercase">{isOnline ? `AO VIVO: ${v} ESPECTADORES` : 'TRANSMISSÃO OFFLINE'}</span>
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Pill Neon Pulsante',
    description: 'Pílula com iluminação neon pulsante roxa e ciano.',
    aspectRatio: '220x45',
    defaultWidth: 220,
    defaultHeight: 45,
    badge: 'Neon Pill',
    render: ({ isOnline = false, viewers = '0' }) => {
      const v = isOnline ? String(viewers) : '0';

      return (
        <div className="w-full h-full px-3 rounded-full bg-black/85 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] flex items-center justify-between select-none text-left">
          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase">{isOnline ? 'AO VIVO' : 'OFFLINE'}</span>
          <span className="text-xs font-mono font-black text-white">{v} VIEWERS</span>
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Painel Vertical de Telemetria',
    description: 'Coluna estreita para margens laterais com status empilhado.',
    aspectRatio: '140x220',
    defaultWidth: 140,
    defaultHeight: 220,
    badge: 'Vertical HUD',
    render: ({ isOnline = false, viewers = '0' }) => {
      const v = isOnline ? String(viewers) : '0';

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-white/10 flex flex-col items-center justify-between select-none text-center shadow-xl">
          <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">STATUS LIVE</span>
          <Radio className={`h-8 w-8 ${isOnline ? 'text-cyan-400 animate-pulse' : 'text-slate-600'} my-2`} />
          <div>
            <span className="text-2xl font-black text-white font-mono leading-none">{v}</span>
            <span className="text-[8.5px] font-mono text-slate-400 block uppercase mt-0.5">{isOnline ? 'VIEWERS' : 'OFFLINE'}</span>
          </div>
        </div>
      );
    }
  },
  {
    id: '09',
    number: 9,
    name: 'Broadcast Tag de Categoria',
    description: 'Tag de transmissão oficial com nome do jogo em destaque.',
    aspectRatio: '280x65',
    defaultWidth: 280,
    defaultHeight: 65,
    badge: 'Game Tag',
    render: ({ game = 'Geral', isOnline = false }) => (
      <div className="w-full h-full p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
        <span className="text-xs font-bold text-white truncate">{isOnline ? game : 'Transmissão Offline'}</span>
        <span className="text-[9px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800 shrink-0">AO VIVO</span>
      </div>
    )
  },
  {
    id: '10',
    number: 10,
    name: 'Terminal de Status de Transmissão',
    description: 'Prompt monospace com relatório do status de streaming.',
    aspectRatio: '320x85',
    defaultWidth: 320,
    defaultHeight: 85,
    badge: 'Terminal Status',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-2.5 bg-black border border-emerald-500/40 font-mono text-[10px] flex flex-col justify-between select-none text-left">
        <div className={isOnline ? 'text-emerald-400' : 'text-rose-400'}>&gt; status_broadcast: {isOnline ? 'ESTABLISHED' : 'DISCONNECTED'}</div>
        <div className="text-slate-300">&gt; protocol: rtmp_stream_ssl</div>
      </div>
    )
  }
];

export const UPTIME_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Relógio Digital Neon Grande',
    description: 'Visor digital de uptime em tamanho grande com efeito neon.',
    aspectRatio: '240x85',
    defaultWidth: 240,
    defaultHeight: 85,
    badge: 'Digital Neon',
    render: ({ uptimeString = '00:00:00', isOnline = false }) => {
      const up = isOnline ? uptimeString : 'Live offline';

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-indigo-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[9px] font-mono text-indigo-300 font-bold uppercase flex items-center gap-1">
            <Clock className="h-3 w-3" /> TEMPO DE LIVE
          </span>
          <div className="text-2xl font-black text-white font-mono tracking-tight drop-shadow-md">{up}</div>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Cronômetro Circular com Ponteiro',
    description: 'Design integrado em formato circular.',
    aspectRatio: '160x160',
    defaultWidth: 160,
    defaultHeight: 160,
    badge: 'Circular Timer',
    render: ({ uptimeString = '00:00:00', isOnline = false }) => {
      const up = isOnline ? uptimeString : 'Offline';

      return (
        <div className="w-full h-full rounded-full bg-slate-950/90 border border-indigo-500/40 p-2 flex flex-col items-center justify-center select-none shadow-xl text-center aspect-square">
          <Clock className="h-5 w-5 text-indigo-400 mb-0.5" />
          <span className="text-xs font-mono font-black text-white">{up}</span>
          <span className="text-[8px] font-mono text-indigo-300 uppercase mt-0.5">UPTIME</span>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Pill Compacta de Tempo',
    description: 'Pílula ultra-discreta para cantos de tela com ícone relógio.',
    aspectRatio: '170x42',
    defaultWidth: 170,
    defaultHeight: 42,
    badge: 'Time Pill',
    render: ({ uptimeString = '00:00:00', isOnline = false }) => {
      const up = isOnline ? uptimeString : 'Offline';

      return (
        <div className="w-full h-full px-3 rounded-full bg-slate-900/90 border border-indigo-500/40 flex items-center justify-between select-none shadow-md text-left">
          <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="text-xs font-mono font-black text-white">{up}</span>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Card Retrô Flip-Clock',
    description: 'Design inspirado em relógios de palheta retrô.',
    aspectRatio: '260x90',
    defaultWidth: 260,
    defaultHeight: 90,
    badge: 'Flip Clock',
    render: ({ uptimeString = '00:00:00', isOnline = false }) => {
      const up = isOnline ? uptimeString : 'Live offline';

      return (
        <div className="w-full h-full p-2.5 rounded-xl bg-black/90 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg">
          <span className="text-[8.5px] font-mono text-slate-400 uppercase font-bold">HORAS DE TRANSMISSÃO</span>
          <div className="p-2 bg-slate-900 rounded-lg text-center font-mono font-black text-xl text-indigo-300 border border-white/5">
            {up}
          </div>
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'Cyber HUD com Timer',
    description: 'Interface sci-fi com contador de tempo técnico.',
    aspectRatio: '280x70',
    defaultWidth: 280,
    defaultHeight: 70,
    badge: 'Cyber Timer',
    render: ({ uptimeString = '00:00:00', isOnline = false }) => {
      const up = isOnline ? uptimeString : '00:00:00';

      return (
        <div className="w-full h-full p-2.5 bg-black/90 border border-indigo-400 flex items-center justify-between select-none text-left shadow-xl" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
          <div>
            <span className="text-[8px] font-mono text-indigo-300 block">// SESSION_TIMER</span>
            <span className="text-base font-black text-white font-mono">{up}</span>
          </div>
          <span className={`text-[8.5px] font-mono ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>● REC</span>
        </div>
      );
    }
  },
  {
    id: '06',
    number: 6,
    name: 'Faixa de Topo Minimalista',
    description: 'Faixa ultra-estreita para encaixar no topo de câmeras.',
    aspectRatio: '220x36',
    defaultWidth: 220,
    defaultHeight: 36,
    badge: 'Cam Top',
    render: ({ uptimeString = '00:00:00', isOnline = false }) => {
      const up = isOnline ? uptimeString : 'Offline';

      return (
        <div className="w-full h-full px-2.5 rounded-lg bg-black/70 border border-white/10 flex items-center justify-between select-none text-left">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">UPTIME:</span>
          <span className="text-xs font-mono font-black text-white">{up}</span>
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Cronômetro com Barra Progressiva',
    description: 'Exibe o tempo decorrido com barra.',
    aspectRatio: '270x80',
    defaultWidth: 270,
    defaultHeight: 80,
    badge: 'Bar Timer',
    render: ({ uptimeString = '00:00:00', isOnline = false }) => {
      const up = isOnline ? uptimeString : 'Offline';

      return (
        <div className="w-full h-full p-2.5 rounded-xl bg-slate-950/90 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg">
          <span className="text-[9px] font-mono text-slate-400 uppercase">DURAÇÃO DA LIVE</span>
          <span className="text-xl font-black text-white font-mono">{up}</span>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: isOnline ? '60%' : '0%' }} />
          </div>
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Card Translúcido de Segundos',
    description: 'Design de vidro escuro com destaque nos segundos.',
    aspectRatio: '230x90',
    defaultWidth: 230,
    defaultHeight: 90,
    badge: 'Glass Seconds',
    render: ({ uptimeString = '00:00:00', isOnline = false }) => {
      const up = isOnline ? uptimeString : '00:00:00';

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-indigo-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[9px] font-mono text-indigo-300 font-bold uppercase">TEMPO AO VIVO</span>
          <div className="text-2xl font-black text-white font-mono">{up}</div>
        </div>
      );
    }
  },
  {
    id: '09',
    number: 9,
    name: 'Display 7 Segmentos LED',
    description: 'Estilo visor digital vermelho de 7 segmentos de relógio digital.',
    aspectRatio: '250x75',
    defaultWidth: 250,
    defaultHeight: 75,
    badge: '7 Segments',
    render: ({ uptimeString = '00:00:00', isOnline = false }) => {
      const up = isOnline ? uptimeString : '00:00:00';

      return (
        <div className="w-full h-full p-2.5 rounded-xl bg-black border-2 border-red-500/60 font-mono flex flex-col justify-between select-none text-left shadow-2xl">
          <span className="text-[8px] text-red-400">LED_CLOCK</span>
          <span className="text-2xl font-black text-red-500 tracking-widest">{up}</span>
        </div>
      );
    }
  },
  {
    id: '10',
    number: 10,
    name: 'Medidor de Duração com Marcos',
    description: 'Faixa que exibe a duração da live em blocos.',
    aspectRatio: '300x70',
    defaultWidth: 300,
    defaultHeight: 70,
    badge: 'Hours Block',
    render: ({ uptimeString = '00:00:00', isOnline = false }) => {
      const up = isOnline ? uptimeString : 'Live offline';

      return (
        <div className="w-full h-full p-2.5 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <Clock className="h-6 w-6 text-indigo-400 shrink-0" />
          <div className="flex-1 px-3 truncate">
            <span className="text-[9px] font-mono text-slate-400 block uppercase">TEMPO TOTAL</span>
            <span className="text-lg font-black text-white font-mono">{up}</span>
          </div>
        </div>
      );
    }
  }
];

export const COMMANDS_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Terminal de Console em Grid',
    description: 'Grid elegante monospace com os comandos cadastrados.',
    aspectRatio: '320x180',
    defaultWidth: 320,
    defaultHeight: 180,
    badge: 'Console Grid',
    render: ({ commands = [] }) => {
      return (
        <div className="w-full h-full p-3 rounded-xl bg-slate-950/90 border border-purple-500/30 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase pb-1 border-b border-white/10 flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5" /> COMANDOS DO CHAT
          </span>
          <div className="grid grid-cols-2 gap-1.5 my-auto">
            {commands.length === 0 ? (
              <div className="col-span-2 text-xs text-slate-500 font-mono italic">Nenhum comando cadastrado</div>
            ) : (
              commands.map((c, i) => (
                <div key={i} className="p-1.5 rounded bg-purple-950/30 border border-purple-500/20 text-xs font-mono font-bold text-white truncate">
                  {typeof c === 'string' ? c : c.name}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Pills Coloridas com Rolagem',
    description: 'Pílulas arredondadas com comandos cadastrados lado a lado.',
    aspectRatio: '300x120',
    defaultWidth: 300,
    defaultHeight: 120,
    badge: 'Pill Tags',
    render: ({ commands = [] }) => {
      return (
        <div className="w-full h-full p-2.5 rounded-2xl bg-black/80 border border-white/10 flex flex-col justify-between select-none text-left">
          <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">COMANDOS ATIVOS</span>
          <div className="flex flex-wrap gap-1.5 my-auto">
            {commands.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono italic">Nenhum comando cadastrado</span>
            ) : (
              commands.map((c, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-purple-600/30 border border-purple-400/40 text-xs font-mono font-bold text-purple-200">
                  {typeof c === 'string' ? c : c.name}
                </span>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Cards com Comando e Descrição',
    description: 'Cartões estruturados com comando e explicação ao lado.',
    aspectRatio: '340x200',
    defaultWidth: 340,
    defaultHeight: 200,
    badge: 'Cards Desc',
    render: ({ commands = [] }) => {
      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-white/10 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[10px] font-mono font-bold text-white uppercase">COMANDOS E FUNÇÕES</span>
          <div className="space-y-1.5 my-auto">
            {commands.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic">Nenhum comando cadastrado</div>
            ) : (
              commands.map((c, i) => (
                <div key={i} className="p-2 rounded-xl bg-white/5 flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-purple-300">{typeof c === 'string' ? c : c.name}</span>
                  <span className="text-slate-400 text-[10px]">{typeof c === 'object' ? c.desc : 'Ativo'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Ticker Horizontal de Comandos',
    description: 'Faixa estreita horizontal com comandos em linha contínua.',
    aspectRatio: '460x50',
    defaultWidth: 460,
    defaultHeight: 50,
    badge: 'Footer Ticker',
    render: ({ commands = [] }) => {
      return (
        <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-purple-500/30 flex items-center justify-between select-none text-left shadow-md">
          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase mr-3 border-r border-white/10 pr-3 shrink-0">COMANDOS</span>
          <div className="flex-1 flex gap-3 truncate text-xs font-mono font-bold text-white">
            {commands.length === 0 ? (
              <span className="text-slate-500 font-mono italic">Nenhum comando cadastrado</span>
            ) : (
              commands.map((c, i) => (
                <span key={i}>{typeof c === 'string' ? c : c.name}</span>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'HUD Gamer com Atalhos',
    description: 'Interface sci-fi com atalhos de comando em destaque.',
    aspectRatio: '320x160',
    defaultWidth: 320,
    defaultHeight: 160,
    badge: 'Gamer HUD',
    render: ({ commands = [] }) => (
      <div className="w-full h-full p-2.5 bg-black/90 border border-purple-400 flex flex-col justify-between select-none text-left shadow-xl" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
        <span className="text-[8.5px] font-mono text-purple-300">// COMMAND_SYS</span>
        <div className="space-y-1 my-auto text-xs font-mono text-white">
          {commands.length === 0 ? (
            <div className="text-slate-500 italic">Nenhum comando cadastrado</div>
          ) : (
            commands.map((c, i) => (
              <div key={i}>{typeof c === 'string' ? c : `${c.name} >> ${c.desc || 'Ativo'}`}</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '06',
    number: 6,
    name: 'Lista Vertical Elegante',
    description: 'Linhas verticais com separadores sutis para laterais.',
    aspectRatio: '220x240',
    defaultWidth: 220,
    defaultHeight: 240,
    badge: 'Vertical List',
    render: ({ commands = [] }) => (
      <div className="w-full h-full p-3 rounded-xl bg-slate-950/80 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">COMANDOS</span>
        <div className="space-y-2 my-auto text-xs text-white font-mono">
          {commands.length === 0 ? (
            <div className="text-slate-500 italic">Nenhum comando</div>
          ) : (
            commands.map((c, i) => (
              <div key={i} className="border-b border-white/5 pb-1 last:border-0">{typeof c === 'string' ? c : c.name}</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '07',
    number: 7,
    name: 'Dock Inferior com Botões',
    description: 'Faixa de rodapé com comandos em botões visuais.',
    aspectRatio: '420x65',
    defaultWidth: 420,
    defaultHeight: 65,
    badge: 'Dock Buttons',
    render: ({ commands = [] }) => (
      <div className="w-full h-full px-3 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left">
        <div className="flex gap-2 text-xs font-mono font-bold text-white truncate">
          {commands.length === 0 ? (
            <span className="text-slate-500 font-mono italic">Nenhum comando cadastrado</span>
          ) : (
            commands.map((c, i) => (
              <span key={i} className="px-2 py-1 rounded bg-white/10">{typeof c === 'string' ? c : c.name}</span>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '08',
    number: 8,
    name: 'Cards Neon com Glow',
    description: 'Cards iluminados com contorno roxo fluorescente.',
    aspectRatio: '280x180',
    defaultWidth: 280,
    defaultHeight: 180,
    badge: 'Neon Glow',
    render: ({ commands = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] flex flex-col justify-between select-none text-left">
        <span className="text-[9px] font-mono text-purple-300 font-bold uppercase">COMANDOS DISPONÍVEIS</span>
        <div className="space-y-1.5 my-auto text-xs font-mono text-white">
          {commands.length === 0 ? (
            <div className="text-slate-500 italic">Nenhum comando cadastrado</div>
          ) : (
            commands.map((c, i) => (
              <div key={i} className="p-1.5 rounded-lg bg-purple-950/40">{typeof c === 'string' ? c : `${c.name} — ${c.desc || 'Ativo'}`}</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '09',
    number: 9,
    name: 'Banner Lateral Redes',
    description: 'Coluna estreita com foco em comandos cadastrados.',
    aspectRatio: '180x260',
    defaultWidth: 180,
    defaultHeight: 260,
    badge: 'Social Side',
    render: ({ commands = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex flex-col justify-between select-none text-left">
        <span className="text-[9px] font-mono text-purple-300 uppercase font-bold">COMANDOS</span>
        <div className="space-y-2 my-auto text-xs text-white font-mono">
          {commands.length === 0 ? (
            <div className="text-slate-500 italic">Nenhum comando</div>
          ) : (
            commands.map((c, i) => (
              <div key={i}>{typeof c === 'string' ? c : c.name}</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '10',
    number: 10,
    name: 'Placa Informativa Minimalista',
    description: 'Aviso limpo com os principais comandos para espectadores.',
    aspectRatio: '260x140',
    defaultWidth: 260,
    defaultHeight: 140,
    badge: 'Info Plaque',
    render: ({ commands = [] }) => (
      <div className="w-full h-full p-3 rounded-xl bg-slate-900 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-xs font-bold text-white">Comandos da Live</span>
        <span className="text-xs font-mono text-slate-300 my-auto">
          {commands.length === 0 ? 'Nenhum comando configurado no momento' : commands.map(c => typeof c === 'string' ? c : c.name).join(' ')}
        </span>
      </div>
    )
  }
];

export const MILESTONES_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Lista de Conquistas Console',
    description: 'Estilo troféu de console com medalhas desbloqueadas.',
    aspectRatio: '300x200',
    defaultWidth: 300,
    defaultHeight: 200,
    badge: 'Console Trophy',
    render: ({ milestones = [] }) => {
      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-indigo-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase pb-1 border-b border-white/10">CONQUISTAS DA STREAM</span>
          <div className="space-y-1.5 my-auto">
            {milestones.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic">Nenhuma conquista cadastrada</div>
            ) : (
              milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`h-4 w-4 ${m.done ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className={m.done ? 'text-white font-bold' : 'text-slate-500'}>{typeof m === 'string' ? m : m.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Árvore de Marcos Ativos',
    description: 'Checkpoints verticais com lista de conquistas.',
    aspectRatio: '320x180',
    defaultWidth: 320,
    defaultHeight: 180,
    badge: 'Tree Marks',
    render: ({ milestones = [] }) => (
      <div className="w-full h-full p-3 rounded-xl bg-black/85 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-[9px] font-mono text-cyan-400 uppercase font-bold">MARCOS ATINGIDOS</span>
        <div className="space-y-1.5 my-auto text-xs text-white">
          {milestones.length === 0 ? (
            <div className="text-slate-500 italic">Nenhum marco cadastrado</div>
          ) : (
            milestones.map((m, i) => (
              <div key={i}>✓ {typeof m === 'string' ? m : m.name}</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '03',
    number: 3,
    name: 'Cards com Troféus',
    description: 'Cards individuais com ícone dourado para cada marco batido.',
    aspectRatio: '280x220',
    defaultWidth: 280,
    defaultHeight: 220,
    badge: 'Trophy Cards',
    render: ({ milestones = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-amber-500/30 flex flex-col justify-between select-none text-left shadow-xl">
        <span className="text-[9px] font-mono text-amber-300 uppercase font-bold">TROFÉUS DA SESSÃO</span>
        <div className="space-y-1.5 my-auto text-xs text-white">
          {milestones.length === 0 ? (
            <div className="text-slate-500 italic">Nenhum troféu cadastrado</div>
          ) : (
            milestones.map((m, i) => (
              <div key={i} className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/20">🏆 {typeof m === 'string' ? m : m.name}</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '04',
    number: 4,
    name: 'Ticker Horizontal de Conquistas',
    description: 'Faixa contínua com conquistas recentes para rodapé.',
    aspectRatio: '440x55',
    defaultWidth: 440,
    defaultHeight: 55,
    badge: 'Footer Strip',
    render: ({ milestones = [] }) => (
      <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left">
        <span className="text-xs font-bold text-white truncate">
          CONQUISTAS: {milestones.length === 0 ? 'Nenhuma conquista cadastrada' : milestones.map(m => typeof m === 'string' ? m : m.name).join(' ● ')}
        </span>
      </div>
    )
  },
  {
    id: '05',
    number: 5,
    name: 'Cyber HUD de Desbloqueios',
    description: 'Visual sci-fi com indicador de missões da live.',
    aspectRatio: '320x170',
    defaultWidth: 320,
    defaultHeight: 170,
    badge: 'Cyber Missions',
    render: ({ milestones = [] }) => (
      <div className="w-full h-full p-2.5 bg-black/90 border border-cyan-400 font-mono text-xs flex flex-col justify-between select-none text-left">
        <span className="text-[8.5px] text-cyan-300">[MISSION_OBJECTIVES]</span>
        <div className="text-slate-200 my-auto">
          {milestones.length === 0 ? (
            <div className="text-slate-500 italic">Nenhum objetivo cadastrado</div>
          ) : (
            milestones.map((m, i) => (
              <div key={i}>&gt; [{`ACH_0${i + 1}`}]: {typeof m === 'string' ? m : m.name}</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '06',
    number: 6,
    name: 'Pills de Medalhas Compactas',
    description: 'Pills com ícone de medalha para sobreposição.',
    aspectRatio: '260x120',
    defaultWidth: 260,
    defaultHeight: 120,
    badge: 'Medal Pills',
    render: ({ milestones = [] }) => (
      <div className="w-full h-full p-2.5 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-[9px] font-mono text-slate-400 uppercase">MARCOS</span>
        <div className="flex flex-wrap gap-1.5 my-auto">
          {milestones.length === 0 ? (
            <span className="text-xs text-slate-500 italic">Nenhum marco</span>
          ) : (
            milestones.map((m, i) => (
              <span key={i} className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">{typeof m === 'string' ? m : m.name}</span>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '07',
    number: 7,
    name: 'Pop-up Recente de Conquista',
    description: 'Card pop-up com a conquista da live.',
    aspectRatio: '280x100',
    defaultWidth: 280,
    defaultHeight: 100,
    badge: 'Recent Pop',
    render: ({ milestones = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-emerald-500/40 flex items-center gap-3 select-none text-left">
        <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
        <div className="truncate">
          <span className="text-[9px] font-mono text-emerald-400 uppercase block">CONQUISTA</span>
          <span className="text-xs font-bold text-white truncate block">{milestones[0] ? (typeof milestones[0] === 'string' ? milestones[0] : milestones[0].name) : 'Nenhuma conquista cadastrada'}</span>
        </div>
      </div>
    )
  },
  {
    id: '08',
    number: 8,
    name: 'Coluna Vertical de Missões',
    description: 'Coluna estreita para encaixar ao lado da webcam.',
    aspectRatio: '180x260',
    defaultWidth: 180,
    defaultHeight: 260,
    badge: 'Vertical Column',
    render: ({ milestones = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">MISSÕES</span>
        <div className="space-y-2 my-auto text-xs text-white">
          {milestones.length === 0 ? (
            <div className="text-slate-500 italic">Sem missões</div>
          ) : (
            milestones.map((m, i) => (
              <div key={i}>✓ {typeof m === 'string' ? m : m.name}</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '09',
    number: 9,
    name: 'Quadro de Metas Alcançadas',
    description: 'Painel com histórico de metas da comunidade batidas.',
    aspectRatio: '310x190',
    defaultWidth: 310,
    defaultHeight: 190,
    badge: 'Goals Board',
    render: ({ milestones = [] }) => (
      <div className="w-full h-full p-3 rounded-xl bg-black/80 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-xs font-bold text-white">Metas Concluídas</span>
        <div className="text-xs text-slate-300 my-auto">
          {milestones.length === 0 ? 'Nenhuma meta registrada' : milestones.map(m => typeof m === 'string' ? m : m.name).join(', ')}
        </div>
      </div>
    )
  },
  {
    id: '10',
    number: 10,
    name: 'Faixa Minimalista com Check',
    description: 'Linha clean com ícones verdes de confirmação.',
    aspectRatio: '360x50',
    defaultWidth: 360,
    defaultHeight: 50,
    badge: 'Check Strip',
    render: ({ milestones = [] }) => (
      <div className="w-full h-full px-3 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left">
        <span className="text-xs font-mono text-emerald-400 font-bold truncate">
          {milestones.length === 0 ? 'Nenhuma conquista cadastrada' : milestones.map(m => `✓ ${typeof m === 'string' ? m : m.name}`).join(' ● ')}
        </span>
      </div>
    )
  }
];

export const RULES_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Pergaminho com Ícones de Escudo',
    description: 'Card clássico com ícones de proteção e moderação.',
    aspectRatio: '300x220',
    defaultWidth: 300,
    defaultHeight: 220,
    badge: 'Shield Card',
    render: ({ rules = [] }) => {
      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-amber-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase pb-1 border-b border-white/10 flex items-center gap-1.5">
            <Scroll className="h-3.5 w-3.5 text-amber-500" /> REGRAS DO CANAL
          </span>
          <div className="space-y-1.5 my-auto">
            {rules.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic">Nenhuma regra cadastrada</div>
            ) : (
              rules.map((r, i) => (
                <div key={i} className="text-xs text-slate-200">
                  <span className="font-bold text-amber-400 mr-1.5">{i + 1}.</span> {r}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Lista Numerada de Boas Maneiras',
    description: 'Design numerado com fontes marcantes para cada diretriz.',
    aspectRatio: '280x240',
    defaultWidth: 280,
    defaultHeight: 240,
    badge: 'Numbered List',
    render: ({ rules = [] }) => (
      <div className="w-full h-full p-3 rounded-xl bg-black/80 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">CONDUTA</span>
        <div className="space-y-2 my-auto text-xs text-white">
          {rules.length === 0 ? (
            <div className="text-slate-500 italic">Nenhuma regra cadastrada</div>
          ) : (
            rules.map((r, i) => (
              <div key={i}>{i + 1}. {r}</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '03',
    number: 3,
    name: 'Ticker de Avisos de Conduta',
    description: 'Faixa deslizante para rodapés de tela com lembretes.',
    aspectRatio: '460x50',
    defaultWidth: 460,
    defaultHeight: 50,
    badge: 'Conduct Ticker',
    render: ({ rules = [] }) => (
      <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left">
        <span className="text-xs text-slate-300 truncate">
          {rules.length === 0 ? 'Nenhuma regra cadastrada no momento' : `★ REGRAS: ${rules.join(' ● ')} ★`}
        </span>
      </div>
    )
  },
  {
    id: '04',
    number: 4,
    name: 'Cards de Regras com Tags',
    description: 'Cards individuais estruturados.',
    aspectRatio: '320x190',
    defaultWidth: 320,
    defaultHeight: 190,
    badge: 'Tagged Rules',
    render: ({ rules = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-amber-500/30 flex flex-col justify-between select-none text-left shadow-xl">
        <span className="text-xs font-bold text-white">Diretrizes da Live</span>
        <div className="space-y-1.5 my-auto text-xs text-slate-200">
          {rules.length === 0 ? (
            <div className="text-slate-500 italic">Nenhuma regra cadastrada</div>
          ) : (
            rules.map((r, i) => (
              <div key={i} className="p-1.5 rounded-lg bg-white/5"><span className="text-amber-400 font-bold">[REGRA {i + 1}]</span> {r}</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '05',
    number: 5,
    name: 'Terminal de Diretrizes da Comunidade',
    description: 'Console monospace com regras estilo política de segurança.',
    aspectRatio: '300x200',
    defaultWidth: 300,
    defaultHeight: 200,
    badge: 'Security Policy',
    render: ({ rules = [] }) => (
      <div className="w-full h-full p-3 bg-black border border-amber-400 font-mono text-xs flex flex-col justify-between select-none text-left">
        <span className="text-[8.5px] text-amber-300">[COMMUNITY_POLICY]</span>
        <div className="text-slate-200 my-auto">
          {rules.length === 0 ? (
            <div className="text-slate-500 italic">zero rules configured</div>
          ) : (
            rules.map((r, i) => (
              <div key={i}>&gt; rule_0{i + 1}: {r} [ENFORCED]</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '06',
    number: 6,
    name: 'Coluna Lateral de Conduta',
    description: 'Coluna estreita para bordas de webcam com regras resumidas.',
    aspectRatio: '190x280',
    defaultWidth: 190,
    defaultHeight: 280,
    badge: 'Side Column',
    render: ({ rules = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">REGRAS</span>
        <div className="space-y-2 my-auto text-xs text-white">
          {rules.length === 0 ? (
            <div className="text-slate-500 italic">Sem regras</div>
          ) : (
            rules.map((r, i) => (
              <div key={i}>• {r}</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '07',
    number: 7,
    name: 'Painel com Ícones de Alerta',
    description: 'Cards com ícones temáticos de alerta suave.',
    aspectRatio: '310x210',
    defaultWidth: 310,
    defaultHeight: 210,
    badge: 'Soft Warning',
    render: ({ rules = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-white/10 flex flex-col justify-between select-none text-left shadow-xl">
        <span className="text-xs font-bold text-white">Boas Práticas</span>
        <div className="text-xs text-slate-300 my-auto">
          {rules.length === 0 ? 'Mantenha o chat acolhedor e positivo para todos os espectadores.' : rules.join(' • ')}
        </div>
      </div>
    )
  },
  {
    id: '08',
    number: 8,
    name: 'Faixa Inferior Transversal',
    description: 'Faixa discreta de aviso no rodapé da transmissão.',
    aspectRatio: '420x60',
    defaultWidth: 420,
    defaultHeight: 60,
    badge: 'Bottom Strip',
    render: ({ rules = [] }) => (
      <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left">
        <span className="text-xs text-slate-200 truncate">{rules.length === 0 ? 'Regras da transmissão ativa' : `Regras: ${rules.join(' | ')}`}</span>
      </div>
    )
  },
  {
    id: '09',
    number: 9,
    name: 'Card Flutuante Glass com Rolagem',
    description: 'Fundo escuro suave com rolagem automática para muitas regras.',
    aspectRatio: '280x220',
    defaultWidth: 280,
    defaultHeight: 220,
    badge: 'Glass Rules',
    render: ({ rules = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-amber-500/30 flex flex-col justify-between select-none text-left shadow-xl">
        <span className="text-[9px] font-mono text-amber-300 uppercase font-bold">REGRAS DA LIVE</span>
        <div className="text-xs text-slate-200 my-auto">
          {rules.length === 0 ? 'Chat moderado automaticamente para segurança de todos.' : rules.map((r, i) => `${i + 1}. ${r}`).join(' ')}
        </div>
      </div>
    )
  },
  {
    id: '10',
    number: 10,
    name: 'Aviso Rápido Minimalista',
    description: 'Quadro compacto com lembrete de bom senso.',
    aspectRatio: '250x140',
    defaultWidth: 250,
    defaultHeight: 140,
    badge: 'Minimal Notice',
    render: ({ rules = [] }) => (
      <div className="w-full h-full p-3 rounded-xl bg-slate-900 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-xs font-bold text-white">Aviso do Canal</span>
        <span className="text-xs text-slate-400 my-auto">
          {rules.length === 0 ? 'Seja bem-vindo e aproveite a transmissão!' : rules[0]}
        </span>
      </div>
    )
  }
];

export const SCHEDULE_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Calendário Semanal em Colunas',
    description: 'Colunas de dias da semana lado a lado com horários de live.',
    aspectRatio: '440x160',
    defaultWidth: 440,
    defaultHeight: 160,
    badge: 'Weekly Grid',
    render: ({ schedule = [] }) => {
      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-teal-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <div className="text-[10px] font-mono font-bold text-teal-300 uppercase pb-1 border-b border-white/10 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> AGENDA DA SEMANA
          </div>
          <div className="flex gap-2 my-auto overflow-hidden">
            {schedule.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic">Nenhum item de agenda cadastrado</div>
            ) : (
              schedule.map((item, i) => (
                <div key={i} className="flex-1 p-2 rounded-xl bg-white/5 border border-white/5 text-center">
                  <span className="text-xs font-black text-teal-300 block">{item.day || item.name}</span>
                  <span className="text-[10px] font-mono text-white block my-0.5">{item.hour || item.time}</span>
                  <span className="text-[9px] text-slate-400 block truncate">{item.label || item.desc}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Cards de Dias Empilhados',
    description: 'Cards retangulares com dia e horário programado.',
    aspectRatio: '300x240',
    defaultWidth: 300,
    defaultHeight: 240,
    badge: 'Stacked Days',
    render: ({ schedule = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-white/10 flex flex-col justify-between select-none text-left shadow-xl">
        <span className="text-xs font-bold text-white">Cronograma de Streams</span>
        <div className="space-y-1.5 my-auto text-xs">
          {schedule.length === 0 ? (
            <div className="text-slate-500 italic">Nenhum horário cadastrado</div>
          ) : (
            schedule.map((item, i) => (
              <div key={i} className="p-2 rounded-xl bg-white/5 flex justify-between">
                <span>{item.day || item.name}</span>
                <span className="text-teal-300 font-mono">{item.hour || item.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '03',
    number: 3,
    name: 'Timeline Horizontal de Dias',
    description: 'Linha do tempo contínua horizontal.',
    aspectRatio: '420x110',
    defaultWidth: 420,
    defaultHeight: 110,
    badge: 'Horizontal Timeline',
    render: ({ schedule = [] }) => (
      <div className="w-full h-full p-3 rounded-xl bg-slate-950/90 border border-teal-500/30 flex flex-col justify-between select-none text-left shadow-lg">
        <span className="text-[9px] font-mono text-teal-300 uppercase font-bold">TIMELINE SEMANAL</span>
        <div className="flex justify-between items-center text-xs text-white my-auto truncate">
          {schedule.length === 0 ? (
            <span className="text-slate-500 italic">Nenhum evento na agenda</span>
          ) : (
            schedule.map((item, i) => (
              <span key={i}>{item.day || item.name} ({item.hour || item.time}){i < schedule.length - 1 ? ' ─── ' : ''}</span>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '04',
    number: 4,
    name: 'Ticker de Próximas Lives',
    description: 'Faixa deslizante para rodapés com horários programados.',
    aspectRatio: '460x50',
    defaultWidth: 460,
    defaultHeight: 50,
    badge: 'Upcoming Ticker',
    render: ({ schedule = [] }) => (
      <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left">
        <span className="text-xs text-slate-200 truncate">
          {schedule.length === 0 ? 'Agenda da stream em breve nas redes sociais' : `Próximas Lives: ${schedule.map(s => `${s.day || s.name} às ${s.hour || s.time}`).join(' ● ')}`}
        </span>
      </div>
    )
  },
  {
    id: '05',
    number: 5,
    name: 'HUD Gamer de Calendário',
    description: 'Interface sci-fi com cronograma de missões da semana.',
    aspectRatio: '340x200',
    defaultWidth: 340,
    defaultHeight: 200,
    badge: 'Mission Calendar',
    render: ({ schedule = [] }) => (
      <div className="w-full h-full p-3 bg-black border border-teal-400 font-mono text-xs flex flex-col justify-between select-none text-left">
        <span className="text-[8.5px] text-teal-300">[SCHEDULE_DISPATCH]</span>
        <div className="text-slate-200 my-auto">
          {schedule.length === 0 ? (
            <div className="text-slate-500 italic">no scheduled broadcasts</div>
          ) : (
            schedule.map((s, i) => (
              <div key={i}>&gt; {s.day || s.name}: {s.hour || s.time} [{s.label || 'STREAM'}]</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '06',
    number: 6,
    name: 'Card com Dia de Hoje em Destaque',
    description: 'Foco no horário e atividade programada para a live de hoje.',
    aspectRatio: '300x180',
    defaultWidth: 300,
    defaultHeight: 180,
    badge: 'Today Focus',
    render: ({ schedule = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-teal-500/40 flex flex-col justify-between select-none text-left shadow-xl">
        <span className="text-[9px] font-mono text-teal-300 uppercase font-bold">AGENDA DA LIVE</span>
        <div className="my-auto">
          {schedule[0] ? (
            <>
              <span className="text-xl font-black text-white block">{schedule[0].hour || schedule[0].time || 'Hoje'}</span>
              <span className="text-xs text-slate-300">{schedule[0].label || schedule[0].desc || schedule[0].day}</span>
            </>
          ) : (
            <span className="text-xs text-slate-500 italic">Nenhum evento configurado hoje</span>
          )}
        </div>
      </div>
    )
  },
  {
    id: '07',
    number: 7,
    name: 'Coluna Vertical de Agenda',
    description: 'Coluna estreita para margens laterais com dias da semana.',
    aspectRatio: '200x280',
    defaultWidth: 200,
    defaultHeight: 280,
    badge: 'Vertical Schedule',
    render: ({ schedule = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">AGENDA</span>
        <div className="space-y-2 my-auto text-xs text-white">
          {schedule.length === 0 ? (
            <div className="text-slate-500 italic">Sem eventos</div>
          ) : (
            schedule.map((s, i) => (
              <div key={i}>{s.day || s.name}: {s.hour || s.time}</div>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '08',
    number: 8,
    name: 'Dock Inferior com Mini Dias',
    description: 'Faixa inferior de tela com botões de cada dia.',
    aspectRatio: '400x75',
    defaultWidth: 400,
    defaultHeight: 75,
    badge: 'Mini Days Dock',
    render: ({ schedule = [] }) => (
      <div className="w-full h-full px-3 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left">
        <div className="flex gap-2 text-xs font-mono text-white truncate">
          {schedule.length === 0 ? (
            <span className="text-slate-500 italic">Nenhum dia cadastrado</span>
          ) : (
            schedule.map((s, i) => (
              <span key={i} className="p-1 rounded bg-white/10">{s.day || s.name} {s.hour || s.time}</span>
            ))
          )}
        </div>
      </div>
    )
  },
  {
    id: '09',
    number: 9,
    name: 'Cards Translúcidos com Badges',
    description: 'Superfície de vidro escuro.',
    aspectRatio: '320x220',
    defaultWidth: 320,
    defaultHeight: 220,
    badge: 'Glass Badges',
    render: ({ schedule = [] }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-teal-500/30 flex flex-col justify-between select-none text-left shadow-xl">
        <span className="text-xs font-bold text-white">Horários de Transmissão</span>
        <div className="text-xs text-slate-300 my-auto">
          {schedule.length === 0 ? 'Consulte a programação completa nas redes sociais.' : schedule.map(s => `${s.day || s.name}: ${s.hour || s.time}`).join(' | ')}
        </div>
      </div>
    )
  },
  {
    id: '10',
    number: 10,
    name: 'Quadro Minimalista de Horários',
    description: 'Quadro com tipografia limpa e sem bordas pesadas.',
    aspectRatio: '260x190',
    defaultWidth: 260,
    defaultHeight: 190,
    badge: 'Clean Frame',
    render: ({ schedule = [] }) => (
      <div className="w-full h-full p-3 rounded-xl bg-slate-900 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-xs font-bold text-white">Programação</span>
        <span className="text-xs text-slate-400 my-auto">
          {schedule.length === 0 ? 'Lives toda semana a partir do horário programado.' : schedule.map(s => `${s.day || s.name} ${s.hour || s.time}`).join(' • ')}
        </span>
      </div>
    )
  }
];

export const SCHEDULE_TICKER_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Letreiro Marquee Neon',
    description: 'Letreiro contínuo clássico com estrelas delimitadoras e glow suave.',
    aspectRatio: '480x45',
    defaultWidth: 480,
    defaultHeight: 45,
    badge: 'Neon Marquee',
    render: ({ newsText = '' }) => {
      const txt = newsText || '★ Nenhum aviso configurado no momento ★';

      return (
        <div className="w-full h-full px-3 rounded-xl bg-slate-950/95 border border-indigo-500/40 shadow-xl flex items-center select-none overflow-hidden text-left">
          <span className="text-[9px] font-mono font-bold text-indigo-300 uppercase pr-3 border-r border-white/10 shrink-0 flex items-center gap-1">
            <LayoutGrid className="h-3 w-3" /> AVISOS
          </span>
          <div className="flex-1 overflow-hidden whitespace-nowrap pl-3">
            <span className="text-xs font-bold text-indigo-200">{txt}</span>
          </div>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Faixa Breaking News TV',
    description: 'Estilo plantão de notícias com cabeçalho vermelho.',
    aspectRatio: '460x55',
    defaultWidth: 460,
    defaultHeight: 55,
    badge: 'Breaking News',
    render: ({ newsText = '' }) => {
      const txt = newsText || 'TRANSMISSÃO AO VIVO';

      return (
        <div className="w-full h-full flex items-center bg-slate-950 border border-red-500/40 rounded-xl overflow-hidden shadow-2xl select-none text-left">
          <div className="bg-red-600 h-full px-3 flex items-center text-white font-mono font-black text-xs shrink-0 uppercase">
            NOTÍCIAS
          </div>
          <div className="flex-1 px-3 truncate text-xs font-bold text-white">
            {txt}
          </div>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Card Box com Texto Suave',
    description: 'Box retangular para sobreposição em cantoneiras.',
    aspectRatio: '320x90',
    defaultWidth: 320,
    defaultHeight: 90,
    badge: 'Card Box',
    render: ({ newsText = '' }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg">
        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">AVISO DA LIVE</span>
        <span className="text-xs font-medium text-white truncate">{newsText || 'Sem avisos configurados'}</span>
      </div>
    )
  },
  {
    id: '04',
    number: 4,
    name: 'Fita Dupla de Avisos e Horários',
    description: 'Duas linhas horizontais com informações complementares.',
    aspectRatio: '440x70',
    defaultWidth: 440,
    defaultHeight: 70,
    badge: 'Dual Strip',
    render: ({ newsText = '' }) => (
      <div className="w-full h-full p-2.5 rounded-xl bg-slate-950/90 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-[10px] font-mono text-indigo-300 font-bold">★ AVISOS IMPORTANTES ★</span>
        <span className="text-xs text-white truncate">{newsText || 'Avisos e informações da live'}</span>
      </div>
    )
  },
  {
    id: '05',
    number: 5,
    name: 'Terminal Sci-Fi Deslizante',
    description: 'Linha única em estilo terminal de dados cyberpunk.',
    aspectRatio: '400x50',
    defaultWidth: 400,
    defaultHeight: 50,
    badge: 'Sci-Fi Line',
    render: ({ newsText = '' }) => (
      <div className="w-full h-full px-3 bg-black border border-cyan-400 font-mono text-xs flex items-center justify-between select-none text-left">
        <span className="text-cyan-400 shrink-0 mr-2">&gt;&gt; NOTICE:</span>
        <span className="text-white truncate">{newsText || 'no_broadcast_notice_configured'}</span>
      </div>
    )
  },
  {
    id: '06',
    number: 6,
    name: 'Pill de Notícias da Live',
    description: 'Pílula translúcida fina com texto em fluxo.',
    aspectRatio: '340x42',
    defaultWidth: 340,
    defaultHeight: 42,
    badge: 'News Pill',
    render: ({ newsText = '' }) => (
      <div className="w-full h-full px-3 rounded-full bg-slate-900/90 border border-white/10 flex items-center select-none text-left">
        <span className="text-xs font-bold text-white truncate">{newsText || 'Avisos da stream em tempo real'}</span>
      </div>
    )
  },
  {
    id: '07',
    number: 7,
    name: 'Faixa com Badge de Alerta',
    description: 'Badge de exclamação à esquerda e letreiro à direita.',
    aspectRatio: '450x48',
    defaultWidth: 450,
    defaultHeight: 48,
    badge: 'Alert Badge',
    render: ({ newsText = '' }) => (
      <div className="w-full h-full px-3 rounded-xl bg-slate-950/90 border border-amber-500/30 flex items-center justify-between select-none text-left">
        <span className="text-xs font-bold text-amber-300 truncate">{newsText ? `Aviso: ${newsText}` : 'Nenhum aviso configurado'}</span>
      </div>
    )
  },
  {
    id: '08',
    number: 8,
    name: 'Ticker Retrô LED Vermelho',
    description: 'Estilo painel eletrônico de mensagens de LED.',
    aspectRatio: '420x45',
    defaultWidth: 420,
    defaultHeight: 45,
    badge: 'LED Ticker',
    render: ({ newsText = '' }) => (
      <div className="w-full h-full px-3 bg-black border-2 border-red-600 font-mono flex items-center select-none text-left">
        <span className="text-xs font-black text-red-500 tracking-wider truncate">{newsText ? `● ${newsText.toUpperCase()} ●` : '● TRANSMISSÃO AO VIVO ●'}</span>
      </div>
    )
  },
  {
    id: '09',
    number: 9,
    name: 'Barra de Rodapé com Sombra',
    description: 'Faixa discreta sem bordas chamativas com sombra projetada.',
    aspectRatio: '480x38',
    defaultWidth: 480,
    defaultHeight: 38,
    badge: 'Shadow Bar',
    render: ({ newsText = '' }) => (
      <div className="w-full h-full px-4 bg-black/70 flex items-center select-none text-left backdrop-blur-sm">
        <span className="text-xs font-medium text-white truncate">{newsText || 'Informações e avisos da live para todos os espectadores.'}</span>
      </div>
    )
  },
  {
    id: '10',
    number: 10,
    name: 'Letreiro com Fade nas Bordas',
    description: 'Efeito gradiente suave nas extremidades esquerda e direita.',
    aspectRatio: '440x50',
    defaultWidth: 440,
    defaultHeight: 50,
    badge: 'Fade Edges',
    render: ({ newsText = '' }) => (
      <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-indigo-500/30 flex items-center select-none text-left">
        <span className="text-xs font-bold text-indigo-300 truncate">{newsText ? `★ ${newsText} ★` : '★ Transmissão ao vivo ★'}</span>
      </div>
    )
  }
];

export const MODERATOR_FEED_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Feed de Auditoria com Badges',
    description: 'Linhas com badges vermelhas de moderação e motivos.',
    aspectRatio: '320x220',
    defaultWidth: 320,
    defaultHeight: 220,
    badge: 'Audit Feed',
    render: ({ modLogs = [], isOnline = false }) => {
      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-rose-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[10px] font-mono font-bold text-rose-300 uppercase pb-1 border-b border-white/10 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" /> LOGS DE MODERAÇÃO
          </span>
          <div className="space-y-1.5 my-auto">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic">Live não conectada</div>
            ) : modLogs.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic">Nenhum evento de moderação</div>
            ) : (
              modLogs.map((log, i) => (
                <div key={i} className="p-1.5 rounded-lg bg-rose-950/30 border border-rose-500/20 text-xs">
                  <span className="font-bold text-rose-300 block">{log.author}</span>
                  <span className="text-[10px] text-slate-300 block">{log.blockReason || 'Mensagem bloqueada'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Terminal de Segurança Shield',
    description: 'Console de segurança do canal em monospace.',
    aspectRatio: '300x200',
    defaultWidth: 300,
    defaultHeight: 200,
    badge: 'Security Console',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-3 bg-black border border-rose-500 font-mono text-xs flex flex-col justify-between select-none text-left">
        <span className="text-[8.5px] text-rose-400">[AUTOMOD_GATEWAY]</span>
        <div className="text-slate-200 my-auto">
          {isOnline ? (
            <>&gt; filter: active [STRICT]<br />&gt; zero violations detected</>
          ) : (
            <>&gt; gateway: offline</>
          )}
        </div>
      </div>
    )
  },
  {
    id: '03',
    number: 3,
    name: 'Cards de Ocorrência',
    description: 'Cards individuais para ações disciplinares.',
    aspectRatio: '310x240',
    defaultWidth: 310,
    defaultHeight: 240,
    badge: 'Incident Cards',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-3 rounded-xl bg-slate-950/85 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg">
        <span className="text-xs font-bold text-white">Relatório de Moderação</span>
        <span className="text-xs text-slate-400 my-auto">{isOnline ? 'Chat monitorado pela moderação.' : 'Live offline'}</span>
      </div>
    )
  },
  {
    id: '04',
    number: 4,
    name: 'Ticker de Proteção do Canal',
    description: 'Faixa horizontal indicando status do filtro de segurança.',
    aspectRatio: '440x50',
    defaultWidth: 440,
    defaultHeight: 50,
    badge: 'Protection Ticker',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left">
        <span className="text-xs text-rose-300 font-mono">{isOnline ? 'PROTEÇÃO: AutoMod ativo' : 'PROTEÇÃO: Offline'}</span>
      </div>
    )
  },
  {
    id: '05',
    number: 5,
    name: 'Cyber HUD de Integridade',
    description: 'Visual sci-fi com medidor de integridade do chat.',
    aspectRatio: '320x180',
    defaultWidth: 320,
    defaultHeight: 180,
    badge: 'Integrity HUD',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-2.5 bg-black border border-rose-400 font-mono text-xs flex flex-col justify-between select-none text-left">
        <span className="text-[8.5px] text-rose-300">{isOnline ? '// CHAT_INTEGRITY: 100%' : '// CHAT_INTEGRITY: OFFLINE'}</span>
        <div className="text-slate-300 my-auto">{isOnline ? 'Filtros de moderação operando normalmente.' : 'Transmissão offline.'}</div>
      </div>
    )
  },
  {
    id: '06',
    number: 6,
    name: 'Pill de Status AutoMod',
    description: 'Pílula de monitoramento com badge de segurança.',
    aspectRatio: '220x45',
    defaultWidth: 220,
    defaultHeight: 45,
    badge: 'Mod Pill',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full px-3 rounded-full bg-slate-900/90 border border-rose-500/40 flex items-center justify-between select-none text-left">
        <ShieldAlert className="h-4 w-4 text-rose-400" />
        <span className="text-xs font-mono font-bold text-white">{isOnline ? 'AutoMod Ativo' : 'Offline'}</span>
      </div>
    )
  },
  {
    id: '07',
    number: 7,
    name: 'Lista de Incidentes com Timestamps',
    description: 'Lista de eventos com auditoria.',
    aspectRatio: '290x230',
    defaultWidth: 290,
    defaultHeight: 230,
    badge: 'Timestamp List',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-white/10 flex flex-col justify-between select-none text-left shadow-xl">
        <span className="text-[9px] font-mono text-slate-400 uppercase">AUDITORIA</span>
        <span className="text-xs text-slate-300 my-auto">{isOnline ? 'Nenhuma violação registrada.' : 'Live offline'}</span>
      </div>
    )
  },
  {
    id: '08',
    number: 8,
    name: 'Faixa de Rodapé de Segurança',
    description: 'Faixa discreta de confirmação de moderação.',
    aspectRatio: '420x55',
    defaultWidth: 420,
    defaultHeight: 55,
    badge: 'Footer Security',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left">
        <span className="text-xs text-white">{isOnline ? 'Chat protegido e moderado.' : 'Live desconectada.'}</span>
      </div>
    )
  },
  {
    id: '09',
    number: 9,
    name: 'Painel com Contador de Bloqueios',
    description: 'Quadro com contador de mensagens filtradas.',
    aspectRatio: '260x160',
    defaultWidth: 260,
    defaultHeight: 160,
    badge: 'Block Count',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-3 rounded-xl bg-black/80 border border-rose-500/30 flex flex-col justify-between select-none text-left">
        <span className="text-xs font-bold text-white">Filtro de Mensagens</span>
        <span className="text-2xl font-black text-rose-400 font-mono my-1">{isOnline ? '0 Bloqueios' : 'Offline'}</span>
      </div>
    )
  },
  {
    id: '10',
    number: 10,
    name: 'Visualizador Minimalista de Moderação',
    description: 'Layout limpo com foco no status geral de proteção.',
    aspectRatio: '270x200',
    defaultWidth: 270,
    defaultHeight: 200,
    badge: 'Clean Mod',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-3 rounded-xl bg-slate-900 border border-white/10 flex flex-col justify-between select-none text-left">
        <span className="text-xs font-bold text-white">Status da Moderação</span>
        <span className="text-xs text-slate-400 my-auto">{isOnline ? 'Tudo em ordem no canal.' : 'Live offline'}</span>
      </div>
    )
  }
];
