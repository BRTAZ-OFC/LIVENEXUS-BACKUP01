import React from 'react';
import { Activity, Flame, Smile, TrendingUp, Gauge, Radio } from 'lucide-react';

export const CHAT_SPEED_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Velocímetro Analógico Circular',
    description: 'Arco dinâmico circular com indicador de mensagens por minuto.',
    aspectRatio: '170x170',
    defaultWidth: 170,
    defaultHeight: 170,
    badge: 'Circular Gauge',
    render: ({ speed = 0, isOnline = false }) => {
      const spd = isOnline ? speed : 0;
      const pct = Math.min(100, Math.round((spd / 120) * 100));

      return (
        <div className="w-full h-full p-3 rounded-full bg-slate-950/90 border border-purple-500/40 flex flex-col items-center justify-center select-none aspect-square text-center shadow-xl">
          <Activity className="h-5 w-5 text-purple-400 mb-0.5 animate-pulse" />
          <span className="text-2xl font-black text-white font-mono leading-none">{spd}</span>
          <span className="text-[8.5px] font-mono text-purple-300 uppercase mt-0.5">MSG / MIN</span>
          <div className="w-16 h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Tacômetro Horizontal de Corrida',
    description: 'Barra estilo conta-giros de automobilismo esportivo.',
    aspectRatio: '300x65',
    defaultWidth: 300,
    defaultHeight: 65,
    badge: 'Tacômetro',
    render: ({ speed = 0, isOnline = false }) => {
      const spd = isOnline ? speed : 0;
      const pct = Math.min(100, Math.round((spd / 120) * 100));

      return (
        <div className="w-full h-full p-2.5 rounded-xl bg-slate-950/90 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg">
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
            <span className="font-bold text-white uppercase flex items-center gap-1"><Gauge className="h-3 w-3 text-cyan-400" /> FLUXO DO CHAT</span>
            <span className="text-cyan-300 font-bold">{spd} RPM</span>
          </div>
          <div className="w-full h-2.5 bg-black/60 rounded p-0.5 border border-white/5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 rounded" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Big Number RPM de Mensagens',
    description: 'Foco absoluto no número de velocidade com indicador de aceleração.',
    aspectRatio: '220x95',
    defaultWidth: 220,
    defaultHeight: 95,
    badge: 'Big RPM',
    render: ({ speed = 0, isOnline = false }) => {
      const spd = isOnline ? speed : 0;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/85 border border-purple-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[9px] font-mono text-purple-300 font-bold uppercase">VELOCIDADE DO CHAT</span>
          <div className="text-3xl font-black text-white font-mono leading-none my-1 flex items-baseline gap-1">
            <span>{spd}</span> <span className="text-xs text-purple-400">msg/min</span>
          </div>
          <span className="text-[8.5px] font-mono text-slate-400">{!isOnline ? 'Live offline' : spd > 60 ? '🔥 Chat rápido' : 'Fluxo em tempo real'}</span>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Termômetro de Tráfego',
    description: 'Medidor em 3 zonas: Baixo, Médio e Fogo.',
    aspectRatio: '240x70',
    defaultWidth: 240,
    defaultHeight: 70,
    badge: 'Traffic Zone',
    render: ({ speed = 0, isOnline = false }) => {
      const spd = isOnline ? speed : 0;
      const zone = !isOnline ? 'OFFLINE' : spd > 60 ? 'ALTO' : spd > 25 ? 'MÉDIO' : 'TRANQUILO';

      return (
        <div className="w-full h-full p-2.5 rounded-xl bg-black/80 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div>
            <span className="text-[9px] font-mono text-slate-400 uppercase block">TRÁFEGO</span>
            <span className="text-lg font-black text-white font-mono">{spd} msg/min</span>
          </div>
          <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${spd > 60 ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
            {zone}
          </span>
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'Cyber Gauge com LEDs',
    description: 'Painel com barras de led coloridas em estilo sci-fi.',
    aspectRatio: '280x75',
    defaultWidth: 280,
    defaultHeight: 75,
    badge: 'LED Gauge',
    render: ({ speed = 0, isOnline = false }) => {
      const spd = isOnline ? speed : 0;
      const pct = Math.min(100, Math.round((spd / 120) * 100));
      const activeLeds = Math.round((pct / 100) * 8);

      return (
        <div className="w-full h-full p-2.5 bg-black/90 border border-cyan-400 flex flex-col justify-between select-none text-left shadow-xl" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
          <div className="flex justify-between text-[8.5px] font-mono text-cyan-300">
            <span>[CHAT_VELOCITY_LEDS]</span>
            <span>{spd} MSG/M</span>
          </div>
          <div className="grid grid-cols-8 gap-1 my-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`h-2.5 rounded-sm ${i < activeLeds ? (i > 5 ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]' : 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]') : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
      );
    }
  },
  {
    id: '06',
    number: 6,
    name: 'Pill Compacta de Fluxo',
    description: 'Pílula ultra-discreta com ícone e contagem de velocidade.',
    aspectRatio: '170x42',
    defaultWidth: 170,
    defaultHeight: 42,
    badge: 'Speed Pill',
    render: ({ speed = 0, isOnline = false }) => {
      const spd = isOnline ? speed : 0;

      return (
        <div className="w-full h-full px-3 rounded-full bg-slate-900/90 border border-cyan-500/40 flex items-center justify-between select-none shadow-md text-left">
          <Activity className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span className="text-xs font-mono font-black text-white">{spd} msg/m</span>
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Card de Telemetria Gamer',
    description: 'Visual militar gamer com dados de telemetria de chat.',
    aspectRatio: '230x85',
    defaultWidth: 230,
    defaultHeight: 85,
    badge: 'Telemetry Card',
    render: ({ speed = 0, isOnline = false }) => {
      const spd = isOnline ? speed : 0;

      return (
        <div className="w-full h-full p-2.5 rounded-xl bg-slate-950/90 border border-slate-700 flex flex-col justify-between select-none text-left shadow-lg">
          <div className="flex justify-between text-[8px] font-mono text-slate-400 border-b border-white/10 pb-1">
            <span>VELOCIDADE TRANSMISSÃO</span>
            <span className="text-emerald-400">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <div className="text-xl font-mono font-black text-white">{spd} <span className="text-xs text-slate-400">PULSOS/MIN</span></div>
          <span className="text-[8px] font-mono text-slate-500">{isOnline ? 'Tempo real' : 'Sem conexão'}</span>
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Dark Glass com Glow Neon',
    description: 'Efeito vidro escuro com iluminação roxa.',
    aspectRatio: '210x95',
    defaultWidth: 210,
    defaultHeight: 95,
    badge: 'Dark Glass',
    render: ({ speed = 0, isOnline = false }) => {
      const spd = isOnline ? speed : 0;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.18)] flex flex-col justify-between select-none text-left">
          <span className="text-[8.5px] font-mono text-purple-300 font-bold uppercase">VELOCIDADE</span>
          <div className="text-3xl font-black text-white font-mono leading-none my-1">{spd}</div>
          <span className="text-[8px] font-mono text-slate-400">MENSAGENS/MIN</span>
        </div>
      );
    }
  },
  {
    id: '09',
    number: 9,
    name: 'Lower Third Horizontal',
    description: 'Faixa estendida com indicador de ritmo.',
    aspectRatio: '320x45',
    defaultWidth: 320,
    defaultHeight: 45,
    badge: 'Lower Speed',
    render: ({ speed = 0, isOnline = false }) => {
      const spd = isOnline ? speed : 0;

      return (
        <div className="w-full h-full px-3.5 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-cyan-400" />
            <span className="text-[9px] font-mono font-bold text-slate-300 uppercase">VELOCIDADE DO CHAT:</span>
          </div>
          <span className="text-sm font-mono font-black text-white">{spd} msg/min</span>
        </div>
      );
    }
  },
  {
    id: '10',
    number: 10,
    name: 'Badge Angular de Combate',
    description: 'Estilo distintivo militar com corte chanfrado.',
    aspectRatio: '240x60',
    defaultWidth: 240,
    defaultHeight: 60,
    badge: 'Combat Badge',
    render: ({ speed = 0, isOnline = false }) => {
      const spd = isOnline ? speed : 0;

      return (
        <div className="w-full h-full p-2.5 rounded-lg bg-slate-900 border-l-4 border-cyan-400 border-t border-b border-r border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-cyan-400 animate-pulse' : 'bg-rose-500'} shrink-0`} />
            <div>
              <span className="text-[7.5px] font-mono text-slate-400 uppercase block font-bold">RITMO CHAT</span>
              <span className="text-xs font-black text-white font-mono">{spd} MSG/MIN</span>
            </div>
          </div>
        </div>
      );
    }
  }
];

export const HYPE_METER_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Termômetro com Chamas Neon',
    description: 'Barra vertical com ícone de fogo e indicador de temperatura da live.',
    aspectRatio: '140x220',
    defaultWidth: 140,
    defaultHeight: 220,
    badge: 'Fire Gauge',
    render: ({ hype = 50, isOnline = false }) => {
      const hp = isOnline ? hype : 0;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-orange-500/40 flex flex-col items-center justify-between select-none shadow-xl">
          <div className="flex items-center gap-1 text-orange-400">
            <Flame className="h-5 w-5 animate-bounce" />
            <span className="text-[9px] font-mono font-bold uppercase">HYPE</span>
          </div>
          <div className="w-8 flex-1 bg-black/60 rounded-full p-1 border border-white/10 relative flex flex-col justify-end my-2 overflow-hidden">
            <div className="w-full bg-gradient-to-t from-yellow-500 via-orange-500 to-rose-600 rounded-full transition-all duration-500" style={{ height: `${hp}%` }} />
          </div>
          <span className="text-lg font-black text-white font-mono">{hp}%</span>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Barra Horizontal de Intensidade',
    description: 'Barra horizontal larga com gradiente quente de fogo.',
    aspectRatio: '320x80',
    defaultWidth: 320,
    defaultHeight: 80,
    badge: 'Fire Bar',
    render: ({ hype = 50, isOnline = false }) => {
      const hp = isOnline ? hype : 0;

      return (
        <div className="w-full h-full p-3 rounded-xl bg-slate-950/90 border border-amber-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="font-bold text-amber-300 flex items-center gap-1"><Flame className="h-4 w-4 text-amber-400" /> NÍVEL DE HYPE</span>
            <span className="text-white font-black">{hp}%</span>
          </div>
          <div className="w-full h-3 bg-black/60 rounded-full p-0.5 border border-white/10 overflow-hidden my-1">
            <div className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 rounded-full" style={{ width: `${hp}%` }} />
          </div>
          <span className="text-[8.5px] font-mono text-slate-400">{!isOnline ? 'Live não conectada' : hp > 70 ? '🔥 Hype em nível máximo!' : 'Hype estável'}</span>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Radial Circular de Fogo',
    description: 'Anel redondo com porcentagem central.',
    aspectRatio: '160x160',
    defaultWidth: 160,
    defaultHeight: 160,
    badge: 'Fire Radial',
    render: ({ hype = 50, isOnline = false }) => {
      const hp = isOnline ? hype : 0;

      return (
        <div className="w-full h-full rounded-full bg-slate-950/90 border border-orange-500/40 p-2 flex flex-col items-center justify-center relative select-none shadow-xl aspect-square">
          <Flame className="h-6 w-6 text-orange-400 mb-1" />
          <span className="text-2xl font-black text-white font-mono leading-none">{hp}%</span>
          <span className="text-[8px] font-mono text-orange-300 uppercase mt-1">HYPE</span>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Big Number com Chamas',
    description: 'Destaque gigante no valor do Hype.',
    aspectRatio: '200x95',
    defaultWidth: 200,
    defaultHeight: 95,
    badge: 'Big Hype',
    render: ({ hype = 50, isOnline = false }) => {
      const hp = isOnline ? hype : 0;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/85 border border-orange-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[9px] font-mono text-orange-300 font-bold uppercase">HYPE DA STREAM</span>
          <div className="text-3xl font-black text-white font-mono leading-none my-1 flex items-baseline gap-1">
            <span>{hp}</span> <span className="text-xs text-orange-400">%</span>
          </div>
          <span className="text-[8px] font-mono text-slate-400">{isOnline ? 'Medição contínua' : 'Live offline'}</span>
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'Pill Compacta de Fogo',
    description: 'Pílula horizontal minimalista com chama.',
    aspectRatio: '180x45',
    defaultWidth: 180,
    defaultHeight: 45,
    badge: 'Fire Pill',
    render: ({ hype = 50, isOnline = false }) => {
      const hp = isOnline ? hype : 0;

      return (
        <div className="w-full h-full px-3.5 rounded-full bg-slate-900/90 border border-orange-500/40 flex items-center justify-between select-none shadow-md">
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-400 shrink-0" />
            <span className="text-[9px] font-mono font-bold text-orange-300">HYPE</span>
          </div>
          <span className="text-xs font-mono font-black text-white">{hp}%</span>
        </div>
      );
    }
  },
  {
    id: '06',
    number: 6,
    name: 'Cyberpunk HUD Hype',
    description: 'Painel futurista com alerta de sobrecarga.',
    aspectRatio: '260x85',
    defaultWidth: 260,
    defaultHeight: 85,
    badge: 'Cyber Hype',
    render: ({ hype = 50, isOnline = false }) => {
      const hp = isOnline ? hype : 0;

      return (
        <div className="w-full h-full p-2.5 bg-black/90 border border-orange-400 flex flex-col justify-between select-none text-left shadow-xl" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
          <div className="flex justify-between text-[8px] font-mono text-orange-300">
            <span>// HYPE_OVERLOAD_GAUGE</span>
            <span>{hp}%</span>
          </div>
          <div className="w-full h-2 bg-orange-950 rounded-none overflow-hidden my-1">
            <div className="h-full bg-orange-400" style={{ width: `${hp}%` }} />
          </div>
          <span className="text-[7.5px] font-mono text-slate-500">{isOnline ? 'TELEMETRIA EM TEMPO REAL' : 'DISCONNECTED'}</span>
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Medidor em 5 Níveis de Fogo',
    description: 'Barras divididas em 5 segmentos de potência.',
    aspectRatio: '240x80',
    defaultWidth: 240,
    defaultHeight: 80,
    badge: '5 Level Fire',
    render: ({ hype = 50, isOnline = false }) => {
      const hp = isOnline ? hype : 0;
      const activeLevels = Math.round((hp / 100) * 5);

      return (
        <div className="w-full h-full p-2.5 rounded-xl bg-slate-950/90 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg">
          <div className="flex justify-between items-center text-[9px] font-mono">
            <span className="text-orange-300 font-bold">NÍVEL DE CALOR</span>
            <span className="text-white font-mono">{hp}%</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 my-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`h-3 rounded ${i < activeLevels ? 'bg-gradient-to-t from-orange-500 to-yellow-400' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Dark Glass Glow Laranja',
    description: 'Vidro fumê com iluminação âmbar saturada.',
    aspectRatio: '220x90',
    defaultWidth: 220,
    defaultHeight: 90,
    badge: 'Glass Amber',
    render: ({ hype = 50, isOnline = false }) => {
      const hp = isOnline ? hype : 0;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.2)] flex items-center justify-between select-none text-left">
          <div>
            <span className="text-[8px] font-mono text-orange-300 uppercase font-bold block">HYPE</span>
            <span className="text-3xl font-black text-white font-mono">{hp}%</span>
          </div>
          <Flame className="h-8 w-8 text-orange-400 animate-pulse" />
        </div>
      );
    }
  },
  {
    id: '09',
    number: 9,
    name: 'Lower Third com Chama',
    description: 'Faixa estendida de rodapé para eventos de hype.',
    aspectRatio: '320x45',
    defaultWidth: 320,
    defaultHeight: 45,
    badge: 'Lower Hype',
    render: ({ hype = 50, isOnline = false }) => {
      const hp = isOnline ? hype : 0;

      return (
        <div className="w-full h-full px-3.5 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-[9px] font-mono font-bold text-orange-300 uppercase">HYPE:</span>
          </div>
          <span className="text-sm font-mono font-black text-white">{hp}%</span>
        </div>
      );
    }
  },
  {
    id: '10',
    number: 10,
    name: 'Placa Esports Rage & Hype',
    description: 'Placa agressiva para transmissões competitivas.',
    aspectRatio: '240x70',
    defaultWidth: 240,
    defaultHeight: 70,
    badge: 'Esports Hype',
    render: ({ hype = 50, isOnline = false }) => {
      const hp = isOnline ? hype : 0;

      return (
        <div className="w-full h-full p-2.5 rounded-lg bg-slate-900 border-l-4 border-orange-500 border-t border-b border-r border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div>
            <span className="text-[7.5px] font-mono text-orange-300 uppercase font-bold block">HYPE SCORE</span>
            <span className="text-lg font-black text-white font-mono">{hp}% INTENSIDADE</span>
          </div>
        </div>
      );
    }
  }
];

export const CHAT_VIBE_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Smiley Central com Medidor',
    description: 'Emoji dinâmico que reflete o sentimento do chat com barra de vibe.',
    aspectRatio: '160x160',
    defaultWidth: 160,
    defaultHeight: 160,
    badge: 'Smiley Gauge',
    render: ({ vibeScore = 50, isOnline = false }) => {
      const score = isOnline ? vibeScore : 0;

      return (
        <div className="w-full h-full rounded-2xl bg-slate-950/90 border border-emerald-500/40 p-3 flex flex-col items-center justify-between select-none text-center shadow-xl">
          <span className="text-[9px] font-mono text-emerald-300 font-bold uppercase">VIBE DO CHAT</span>
          <Smile className="h-10 w-10 text-emerald-400 animate-pulse my-auto" />
          <span className="text-xs font-mono font-black text-white">{isOnline ? `${score}% POSITIVO` : 'LIVE OFFLINE'}</span>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Barra de Vibe Positiva',
    description: 'Barra horizontal com medidor de positividade.',
    aspectRatio: '300x75',
    defaultWidth: 300,
    defaultHeight: 75,
    badge: 'Positive Bar',
    render: ({ vibeScore = 50, isOnline = false }) => {
      const score = isOnline ? vibeScore : 0;

      return (
        <div className="w-full h-full p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/40 flex flex-col justify-between select-none text-left shadow-lg">
          <div className="flex justify-between items-center text-[9px] font-mono">
            <span className="font-bold text-emerald-300 flex items-center gap-1"><Smile className="h-3.5 w-3.5 text-emerald-400" /> SENTIMENTO DO CHAT</span>
            <span className="text-white font-black">{score}%</span>
          </div>
          <div className="w-full h-2.5 bg-black/60 rounded-full p-0.5 border border-white/5 overflow-hidden my-1">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full" style={{ width: `${score}%` }} />
          </div>
          <span className="text-[8px] font-mono text-slate-400">{isOnline ? 'Análise contínua' : 'Live offline'}</span>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Big Number Sentimento',
    description: 'Foco no número percentual com selo de aprovação.',
    aspectRatio: '200x95',
    defaultWidth: 200,
    defaultHeight: 95,
    badge: 'Big Vibe',
    render: ({ vibeScore = 50, isOnline = false }) => {
      const score = isOnline ? vibeScore : 0;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/85 border border-emerald-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[9px] font-mono text-emerald-300 font-bold uppercase">TERMÔMETRO DE VIBE</span>
          <div className="text-3xl font-black text-white font-mono leading-none my-1 flex items-baseline gap-1">
            <span>{score}</span> <span className="text-xs text-emerald-400">%</span>
          </div>
          <span className="text-[8px] font-mono text-slate-400">{isOnline ? 'Clima da transmissão' : 'Sem conexão'}</span>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Pill de Positividade',
    description: 'Pílula horizontal com emoji e valor.',
    aspectRatio: '180x45',
    defaultWidth: 180,
    defaultHeight: 45,
    badge: 'Vibe Pill',
    render: ({ vibeScore = 50, isOnline = false }) => {
      const score = isOnline ? vibeScore : 0;

      return (
        <div className="w-full h-full px-3.5 rounded-full bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between select-none shadow-md">
          <div className="flex items-center gap-1.5">
            <Smile className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-[9px] font-mono font-bold text-emerald-300">VIBE</span>
          </div>
          <span className="text-xs font-mono font-black text-white">{score}%</span>
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'Cyberpunk HUD Vibe',
    description: 'Interface sci-fi com diagnóstico emocional.',
    aspectRatio: '260x85',
    defaultWidth: 260,
    defaultHeight: 85,
    badge: 'Cyber Vibe',
    render: ({ vibeScore = 50, isOnline = false }) => {
      const score = isOnline ? vibeScore : 0;

      return (
        <div className="w-full h-full p-2.5 bg-black/90 border border-emerald-400 flex flex-col justify-between select-none text-left shadow-xl" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
          <div className="flex justify-between text-[8px] font-mono text-emerald-300">
            <span>// CHAT_EMOTIONAL_SPECTRUM</span>
            <span>{score}%</span>
          </div>
          <div className="w-full h-2 bg-emerald-950 rounded-none overflow-hidden my-1">
            <div className="h-full bg-emerald-400" style={{ width: `${score}%` }} />
          </div>
          <span className="text-[7.5px] font-mono text-slate-500">{isOnline ? 'DIAGNÓSTICO POSITIVO' : 'DISCONNECTED'}</span>
        </div>
      );
    }
  },
  {
    id: '06',
    number: 6,
    name: 'Card de Humor em 3 Estados',
    description: 'Classificação visual em Positivo, Neutro ou Tenso.',
    aspectRatio: '240x80',
    defaultWidth: 240,
    defaultHeight: 80,
    badge: '3-State Vibe',
    render: ({ vibeScore = 50, isOnline = false }) => {
      const score = isOnline ? vibeScore : 0;
      const state = !isOnline ? 'OFFLINE' : score > 60 ? 'MUITO BOA' : score > 35 ? 'ESTÁVEL' : 'TENSO';

      return (
        <div className="w-full h-full p-2.5 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-lg">
          <div>
            <span className="text-[8px] font-mono text-slate-400 uppercase block">CLIMA DA LIVE</span>
            <span className="text-sm font-black text-white font-mono">{state}</span>
          </div>
          <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/30">{score}%</span>
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Radial Circular Minimal',
    description: 'Anel circular de precisão para índice de vibe.',
    aspectRatio: '140x140',
    defaultWidth: 140,
    defaultHeight: 140,
    badge: 'Minimal Radial',
    render: ({ vibeScore = 50, isOnline = false }) => {
      const score = isOnline ? vibeScore : 0;

      return (
        <div className="w-full h-full p-2 rounded-full bg-slate-950/90 border border-emerald-500/40 flex flex-col items-center justify-center select-none text-center shadow-xl aspect-square">
          <Smile className="h-5 w-5 text-emerald-400 mb-1" />
          <span className="text-xl font-black text-white font-mono leading-none">{score}%</span>
          <span className="text-[7.5px] font-mono text-emerald-300 uppercase mt-0.5">VIBE</span>
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Dark Glass Glow Verde',
    description: 'Vidro escuro com brilho neon esmeralda.',
    aspectRatio: '220x85',
    defaultWidth: 220,
    defaultHeight: 85,
    badge: 'Glass Emerald',
    render: ({ vibeScore = 50, isOnline = false }) => {
      const score = isOnline ? vibeScore : 0;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-between select-none text-left">
          <div>
            <span className="text-[8px] font-mono text-emerald-300 uppercase font-bold block">VIBE SCORE</span>
            <span className="text-2xl font-black text-white font-mono">{score}%</span>
          </div>
          <Smile className="h-7 w-7 text-emerald-400" />
        </div>
      );
    }
  },
  {
    id: '09',
    number: 9,
    name: 'Lower Third Horizontal',
    description: 'Faixa estendida de rodapé com sentimento.',
    aspectRatio: '320x45',
    defaultWidth: 320,
    defaultHeight: 45,
    badge: 'Lower Vibe',
    render: ({ vibeScore = 50, isOnline = false }) => {
      const score = isOnline ? vibeScore : 0;

      return (
        <div className="w-full h-full px-3.5 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div className="flex items-center gap-2">
            <Smile className="h-4 w-4 text-emerald-400" />
            <span className="text-[9px] font-mono font-bold text-emerald-300 uppercase">SENTIMENTO DO CHAT:</span>
          </div>
          <span className="text-sm font-mono font-black text-white">{score}% POSITIVO</span>
        </div>
      );
    }
  },
  {
    id: '10',
    number: 10,
    name: 'Placa Esports Vibe',
    description: 'Visual distintivo para streams de campeonatos.',
    aspectRatio: '240x65',
    defaultWidth: 240,
    defaultHeight: 65,
    badge: 'Esports Vibe',
    render: ({ vibeScore = 50, isOnline = false }) => {
      const score = isOnline ? vibeScore : 0;

      return (
        <div className="w-full h-full p-2.5 rounded-lg bg-slate-900 border-l-4 border-emerald-400 border-t border-b border-r border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div>
            <span className="text-[7.5px] font-mono text-slate-400 uppercase font-bold block">CLIMA DO PÚBLICO</span>
            <span className="text-xs font-black text-white font-mono">{score}% POSITIVIDADE</span>
          </div>
        </div>
      );
    }
  }
];

export const VIEWERS_CHART_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Gráfico de Linha Neon com Gradiente',
    description: 'Visual futurista com dados em tempo real de espectadores ao vivo.',
    aspectRatio: '340x160',
    defaultWidth: 340,
    defaultHeight: 160,
    badge: 'Neon Chart',
    render: ({ currentViewers = 0, isOnline = false }) => {
      const cur = isOnline ? currentViewers : 0;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/40 shadow-xl flex flex-col justify-between select-none text-left">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="font-bold text-purple-300 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> AUDIÊNCIA EM TEMPO REAL</span>
            <span className="text-white font-black">{!isOnline ? 'Offline' : `${cur} viewers`}</span>
          </div>
          <div className="flex-1 my-2 flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl font-mono font-black text-white">{cur}</span>
              <span className="text-[9px] font-mono text-purple-300 block">{isOnline ? 'Espectadores Conectados' : 'Live Desconectada'}</span>
            </div>
          </div>
          <div className="text-[8px] font-mono text-slate-500 text-right">{isOnline ? 'AO VIVO' : 'OFFLINE'}</div>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Gráfico de Barras Histórico',
    description: 'Visual com total de espectadores e indicador de transmissão.',
    aspectRatio: '320x150',
    defaultWidth: 320,
    defaultHeight: 150,
    badge: 'Bar History',
    render: ({ currentViewers = 0, isOnline = false }) => {
      const cur = isOnline ? currentViewers : 0;

      return (
        <div className="w-full h-full p-3 rounded-xl bg-black/80 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-300">
            <span>AUDIÊNCIA AO VIVO</span>
            <span className="text-cyan-300 font-bold">{cur} VIEWERS</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-2xl font-black font-mono text-white">{cur}</span>
          </div>
          <span className="text-[8px] font-mono text-slate-500">{isOnline ? 'Transmissão ativa' : 'Offline'}</span>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Card HUD com Pico e Média',
    description: 'Painel com métricas de audiência atual e estabilidade.',
    aspectRatio: '300x140',
    defaultWidth: 300,
    defaultHeight: 140,
    badge: 'Peak HUD',
    render: ({ currentViewers = 0, isOnline = false }) => {
      const cur = isOnline ? currentViewers : 0;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[9px] font-mono text-purple-300 font-bold uppercase">MÉTRICAS DE AUDIÊNCIA</span>
          <div className="grid grid-cols-2 gap-2 my-1">
            <div className="p-2 rounded-xl bg-white/5">
              <span className="text-[8px] font-mono text-slate-400 block">ATUAL</span>
              <span className="text-lg font-black text-white font-mono">{cur}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <span className="text-[8px] font-mono text-slate-400 block">ESTADO</span>
              <span className="text-sm font-black text-cyan-300 font-mono">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Sparkline Minimalista',
    description: 'Linha elegante simplificada com valor em destaque.',
    aspectRatio: '280x90',
    defaultWidth: 280,
    defaultHeight: 90,
    badge: 'Sparkline',
    render: ({ currentViewers = 0, isOnline = false }) => {
      const cur = isOnline ? currentViewers : 0;

      return (
        <div className="w-full h-full p-3 rounded-xl bg-black/80 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div>
            <span className="text-[9px] font-mono text-slate-400 uppercase block">AUDIÊNCIA</span>
            <span className="text-2xl font-black text-white font-mono">{cur}</span>
          </div>
          <TrendingUp className="h-8 w-8 text-cyan-400" />
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'Painel de Trader Financeiro',
    description: 'Estilo gráfico com dados técnicos em tempo real.',
    aspectRatio: '350x170',
    defaultWidth: 350,
    defaultHeight: 170,
    badge: 'Trader View',
    render: ({ currentViewers = 0, isOnline = false }) => {
      const cur = isOnline ? currentViewers : 0;

      return (
        <div className="w-full h-full p-3 bg-slate-950/95 border border-emerald-500/40 flex flex-col justify-between font-mono select-none text-left shadow-2xl">
          <div className="flex justify-between text-[9px] text-emerald-400 border-b border-emerald-500/20 pb-1">
            <span>[TICKER: VIEWERS_LIVE]</span>
            <span>{isOnline ? 'STATUS: ACTIVE' : 'STATUS: OFFLINE'}</span>
          </div>
          <div className="text-2xl font-black text-white my-1">{cur} <span className="text-xs text-emerald-400">ESPECTADORES</span></div>
          <span className="text-[8.5px] text-slate-400">{isOnline ? 'Dados de audiência em tempo real' : 'Sem conexão ativa'}</span>
        </div>
      );
    }
  },
  {
    id: '06',
    number: 6,
    name: 'Dock Compacto com Status',
    description: 'Faixa com indicador AO VIVO.',
    aspectRatio: '320x100',
    defaultWidth: 320,
    defaultHeight: 100,
    badge: 'Live Dock',
    render: ({ currentViewers = 0, isOnline = false }) => {
      const cur = isOnline ? currentViewers : 0;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex items-center justify-between select-none text-left shadow-xl">
          <div>
            <span className="text-[9px] font-mono text-purple-300 font-bold uppercase block">{isOnline ? 'AO VIVO' : 'OFFLINE'}</span>
            <span className="text-xl font-black text-white font-mono">{cur} VIEWERS</span>
          </div>
          <span className={`h-3 w-3 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Osciloscópio Neon',
    description: 'Interface sci-fi com linha estilo sinal de pulso.',
    aspectRatio: '330x150',
    defaultWidth: 330,
    defaultHeight: 150,
    badge: 'Oscilloscope',
    render: ({ currentViewers = 0, isOnline = false }) => {
      const cur = isOnline ? currentViewers : 0;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-black border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.2)] flex flex-col justify-between select-none text-left">
          <div className="flex justify-between text-[9px] font-mono text-cyan-300">
            <span>// AUDIENCE_PULSE</span>
            <span>{cur} VWR</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Radio className="h-12 w-12 text-cyan-400 animate-pulse" />
          </div>
          <span className="text-[8px] font-mono text-slate-500">{isOnline ? 'SINAL EM TEMPO REAL' : 'SINAL OFFLINE'}</span>
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Gráfico Escalonado em Degraus',
    description: 'Degraus visuais conforme novos espectadores entram.',
    aspectRatio: '300x130',
    defaultWidth: 300,
    defaultHeight: 130,
    badge: 'Step Chart',
    render: ({ currentViewers = 0, isOnline = false }) => {
      const cur = isOnline ? currentViewers : 0;

      return (
        <div className="w-full h-full p-3 rounded-xl bg-slate-950/90 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg">
          <span className="text-[9px] font-mono text-slate-400 uppercase">ESPECTADORES</span>
          <div className="text-xl font-black text-white font-mono">{cur} Viewers</div>
          <span className="text-[8.5px] font-mono text-slate-500">{isOnline ? 'Transmissão ativa' : 'Offline'}</span>
        </div>
      );
    }
  },
  {
    id: '09',
    number: 9,
    name: 'Card Vertical de Estatísticas',
    description: 'Coluna estreita com contagem.',
    aspectRatio: '200x240',
    defaultWidth: 200,
    defaultHeight: 240,
    badge: 'Vertical Stats',
    render: ({ currentViewers = 0, isOnline = false }) => {
      const cur = isOnline ? currentViewers : 0;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex flex-col justify-between select-none text-center shadow-xl">
          <span className="text-[9px] font-mono text-purple-300 uppercase font-bold">ESPECTADORES</span>
          <span className="text-3xl font-black text-white font-mono my-auto">{cur}</span>
          <span className="text-[8px] font-mono text-slate-400">{isOnline ? 'AO VIVO' : 'OFFLINE'}</span>
        </div>
      );
    }
  },
  {
    id: '10',
    number: 10,
    name: 'Faixa Estreita com Mini Gráfico',
    description: 'Faixa para bordas de tela.',
    aspectRatio: '400x60',
    defaultWidth: 400,
    defaultHeight: 60,
    badge: 'Mini Strip Chart',
    render: ({ currentViewers = 0, isOnline = false }) => {
      const cur = isOnline ? currentViewers : 0;

      return (
        <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
            <span className="text-xs font-mono font-bold text-white">{cur} VIEWERS AO VIVO</span>
          </div>
          <TrendingUp className="h-5 w-5 text-cyan-400" />
        </div>
      );
    }
  }
];
