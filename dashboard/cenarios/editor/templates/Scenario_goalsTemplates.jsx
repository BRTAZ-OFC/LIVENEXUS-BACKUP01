import React from 'react';
import { Award, Trophy, Sparkles, Flame } from 'lucide-react';

function createGoalTemplates({ title, icon: Icon, defaultColor = 'purple', defaultTarget = 50, unit = '' }) {
  const colorMap = {
    purple: {
      border: 'border-purple-500/40',
      textAcc: 'text-purple-300',
      iconColor: 'text-purple-400',
      gradient: 'from-purple-600 via-indigo-500 to-cyan-400',
      barColor: 'bg-purple-500',
      glow: 'rgba(168,85,247,0.5)',
      cardBg: 'bg-purple-950/60'
    },
    amber: {
      border: 'border-amber-500/40',
      textAcc: 'text-amber-300',
      iconColor: 'text-amber-400',
      gradient: 'from-amber-600 via-orange-500 to-yellow-400',
      barColor: 'bg-amber-500',
      glow: 'rgba(245,158,11,0.5)',
      cardBg: 'bg-amber-950/60'
    },
    red: {
      border: 'border-red-500/40',
      textAcc: 'text-red-300',
      iconColor: 'text-red-400',
      gradient: 'from-red-600 via-rose-500 to-orange-400',
      barColor: 'bg-red-500',
      glow: 'rgba(239,68,68,0.5)',
      cardBg: 'bg-red-950/60'
    }
  };

  const c = colorMap[defaultColor] || colorMap.purple;

  return [
    {
      id: '01',
      number: 1,
      name: 'Barra com Glow Neon',
      description: 'Barra horizontal elegante com gradiente, percentual e contagem em tempo real.',
      aspectRatio: '320x90',
      defaultWidth: 320,
      defaultHeight: 90,
      badge: 'Neon Bar',
      render: ({ current = 0, target = defaultTarget, isOnline = false }) => {
        const cur = isOnline ? current : 0;
        const tgt = target > 0 ? target : defaultTarget;
        const pct = Math.min(100, Math.round((cur / tgt) * 100));

        return (
          <div className={`w-full h-full p-3 rounded-2xl bg-slate-950/90 shadow-xl flex flex-col justify-between select-none text-left`}>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className={`font-bold ${c.textAcc} flex items-center gap-1`}>
                <Icon className={`h-3.5 w-3.5 ${c.iconColor}`} /> {title}
              </span>
              <span className="text-white font-black">{cur} / {tgt} {unit}</span>
            </div>
            <div className="w-full h-3 bg-black/60 rounded-full p-0.5 border border-white/10 overflow-hidden my-1">
              <div className={`h-full bg-gradient-to-r ${c.gradient} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
              <span>{!isOnline ? 'Live não conectada' : `Faltam ${Math.max(0, tgt - cur)} ${unit}`}</span>
              <span className="text-cyan-300 font-bold">{pct}%</span>
            </div>
          </div>
        );
      }
    },
    {
      id: '02',
      number: 2,
      name: 'Radial Circular Central',
      description: 'Anel circular com total no núcleo central e barra curva de progresso.',
      aspectRatio: '160x160',
      defaultWidth: 160,
      defaultHeight: 160,
      badge: 'Radial Ring',
      render: ({ current = 0, target = defaultTarget, isOnline = false }) => {
        const cur = isOnline ? current : 0;
        const tgt = target > 0 ? target : defaultTarget;
        const pct = Math.min(100, Math.round((cur / tgt) * 100));
        const strokeDash = 2 * Math.PI * 40;
        const strokeOffset = strokeDash - (strokeDash * pct) / 100;

        return (
          <div className={`w-full h-full rounded-full bg-slate-950/90 border ${c.border} p-2 flex items-center justify-center relative select-none shadow-xl aspect-square`}>
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={defaultColor === 'amber' ? '#f59e0b' : defaultColor === 'red' ? '#ef4444' : '#a855f7'}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-[8.5px] font-mono ${c.textAcc} uppercase font-bold`}>{title}</span>
              <span className="text-xl font-black text-white font-mono leading-none my-0.5">{cur}</span>
              <span className="text-[8.5px] font-mono text-slate-400">/{tgt} ({pct}%)</span>
            </div>
          </div>
        );
      }
    },
    {
      id: '03',
      number: 3,
      name: 'Termômetro Vertical de Nível',
      description: 'Coluna alta e esguia que sobe verticalmente como nível do objetivo.',
      aspectRatio: '120x240',
      defaultWidth: 120,
      defaultHeight: 240,
      badge: 'Vertical Gauge',
      render: ({ current = 0, target = defaultTarget, isOnline = false }) => {
        const cur = isOnline ? current : 0;
        const tgt = target > 0 ? target : defaultTarget;
        const pct = Math.min(100, Math.round((cur / tgt) * 100));

        return (
          <div className={`w-full h-full p-2.5 rounded-2xl bg-slate-950/90 border ${c.border} flex flex-col items-center justify-between select-none shadow-xl`}>
            <span className={`text-[9px] font-mono ${c.textAcc} font-bold uppercase`}>{title}</span>
            <div className="w-7 flex-1 bg-black/60 rounded-full p-1 border border-white/10 relative flex flex-col justify-end my-2 overflow-hidden">
              <div className={`w-full bg-gradient-to-t ${c.gradient} rounded-full transition-all duration-500`} style={{ height: `${pct}%` }} />
            </div>
            <div className="text-center">
              <span className="text-sm font-black text-white font-mono block leading-none">{cur}</span>
              <span className="text-[9px] font-mono text-slate-400">/{tgt}</span>
            </div>
          </div>
        );
      }
    },
    {
      id: '04',
      number: 4,
      name: 'Big Number com Subtítulo',
      description: 'Número gigante em destaque absoluto com micro-barra de progresso minimalista.',
      aspectRatio: '240x100',
      defaultWidth: 240,
      defaultHeight: 100,
      badge: 'Big Number',
      render: ({ current = 0, target = defaultTarget, isOnline = false }) => {
        const cur = isOnline ? current : 0;
        const tgt = target > 0 ? target : defaultTarget;
        const pct = Math.min(100, Math.round((cur / tgt) * 100));

        return (
          <div className={`w-full h-full p-3 rounded-2xl bg-slate-950/85 border ${c.border} flex flex-col justify-between select-none text-left shadow-xl`}>
            <div className={`flex justify-between items-center text-[9px] font-mono ${c.textAcc} font-bold uppercase`}>
              <span>{title}</span>
              <span>OBJETIVO: {tgt}</span>
            </div>
            <div className="text-3xl font-black text-white font-mono leading-none my-1 flex items-baseline gap-1.5">
              <span>{cur}</span>
              <span className="text-xs text-slate-400 font-normal">({pct}%)</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full ${c.barColor} rounded-full`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      }
    },
    {
      id: '05',
      number: 5,
      name: 'Card Troféu de Comunidade',
      description: 'Ícone de troféu com contador e barra à direita.',
      aspectRatio: '340x80',
      defaultWidth: 340,
      defaultHeight: 80,
      badge: 'Trophy Card',
      render: ({ current = 0, target = defaultTarget, isOnline = false }) => {
        const cur = isOnline ? current : 0;
        const tgt = target > 0 ? target : defaultTarget;
        const pct = Math.min(100, Math.round((cur / tgt) * 100));

        return (
          <div className={`w-full h-full p-3 rounded-xl bg-slate-900 border ${c.border} flex items-center gap-3 select-none text-left shadow-xl`}>
            <div className={`h-12 w-12 rounded-xl ${c.cardBg} border ${c.border} flex items-center justify-center ${c.iconColor} shrink-0`}>
              <Trophy className="h-6 w-6" />
            </div>
            <div className="flex-1 truncate">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-white">{title}</span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold">{cur} / {tgt}</span>
              </div>
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                <div className={`h-full ${c.barColor} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: '06',
      number: 6,
      name: 'Pill Fina Minimalista',
      description: 'Design em cápsula horizontal compacta.',
      aspectRatio: '280x45',
      defaultWidth: 280,
      defaultHeight: 45,
      badge: 'Mini Pill',
      render: ({ current = 0, target = defaultTarget, isOnline = false }) => {
        const cur = isOnline ? current : 0;
        const tgt = target > 0 ? target : defaultTarget;
        const pct = Math.min(100, Math.round((cur / tgt) * 100));

        return (
          <div className={`w-full h-full px-3.5 rounded-full bg-slate-900/90 border ${c.border} flex items-center justify-between shadow-md select-none text-left`}>
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${c.iconColor}`} />
              <span className="text-xs font-bold text-white font-mono">{cur} / {tgt} {unit}</span>
            </div>
            <span className={`text-[10px] font-mono font-bold ${c.textAcc}`}>{pct}%</span>
          </div>
        );
      }
    },
    {
      id: '07',
      number: 7,
      name: 'Cyberpunk HUD Chanfrado',
      description: 'Estilo sci-fi com cantos angulares e visual mecha de alta tecnologia.',
      aspectRatio: '320x95',
      defaultWidth: 320,
      defaultHeight: 95,
      badge: 'Cyber HUD',
      render: ({ current = 0, target = defaultTarget, isOnline = false }) => {
        const cur = isOnline ? current : 0;
        const tgt = target > 0 ? target : defaultTarget;
        const pct = Math.min(100, Math.round((cur / tgt) * 100));

        return (
          <div className="w-full h-full p-3 bg-slate-950/95 border border-cyan-400 flex flex-col justify-between select-none text-left shadow-2xl" style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}>
            <div className="flex justify-between text-[8.5px] font-mono text-cyan-300">
              <span>// {title.toUpperCase()}_SYSTEM</span>
              <span>{isOnline ? 'TARGET_LOCK' : 'DISCONNECTED'}</span>
            </div>
            <div className="flex justify-between items-baseline my-1">
              <span className="text-xl font-mono font-black text-white">{cur} <span className="text-xs text-slate-400">/ {tgt}</span></span>
              <span className="text-xs font-mono font-bold text-pink-400">{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-cyan-950 rounded-none overflow-hidden">
              <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      }
    },
    {
      id: '08',
      number: 8,
      name: 'Painel Segmentado em Blocos',
      description: 'Barra dividida em 10 blocos independentes para cada 10% da meta.',
      aspectRatio: '320x85',
      defaultWidth: 320,
      defaultHeight: 85,
      badge: '10 Blocks',
      render: ({ current = 0, target = defaultTarget, isOnline = false }) => {
        const cur = isOnline ? current : 0;
        const tgt = target > 0 ? target : defaultTarget;
        const pct = Math.min(100, Math.round((cur / tgt) * 100));
        const activeBlocks = Math.round((pct / 100) * 10);

        return (
          <div className={`w-full h-full p-3 rounded-xl bg-slate-950/90 border ${c.border} flex flex-col justify-between select-none text-left shadow-lg`}>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className={`font-bold ${c.textAcc}`}>{title}</span>
              <span className="text-white font-black">{cur}/{tgt}</span>
            </div>
            <div className="grid grid-cols-10 gap-1 my-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`h-2.5 rounded-sm ${i < activeBlocks ? c.barColor : 'bg-white/10'}`} />
              ))}
            </div>
            <span className="text-[8.5px] font-mono text-slate-400">{!isOnline ? 'Live não conectada' : `${pct}% concluído`}</span>
          </div>
        );
      }
    },
    {
      id: '09',
      number: 9,
      name: 'Esports Tag Angular',
      description: 'Visual agressivo de torneio com corte chanfrado e gradiente dinâmico.',
      aspectRatio: '340x80',
      defaultWidth: 340,
      defaultHeight: 80,
      badge: 'Esports Tag',
      render: ({ current = 0, target = defaultTarget, isOnline = false }) => {
        const cur = isOnline ? current : 0;
        const tgt = target > 0 ? target : defaultTarget;
        const pct = Math.min(100, Math.round((cur / tgt) * 100));

        return (
          <div className="w-full h-full flex bg-gradient-to-r from-red-600 via-rose-700 to-slate-950 p-3 rounded-xl shadow-2xl select-none text-left border-l-4 border-amber-400 items-center justify-between">
            <div className="truncate flex-1 pr-3">
              <span className="text-[9px] font-mono font-bold text-amber-300 uppercase block">{title}</span>
              <span className="text-base font-black text-white block">{cur} / {tgt} {unit}</span>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <span className="text-lg font-black font-mono text-white/90">{pct}%</span>
          </div>
        );
      }
    },
    {
      id: '10',
      number: 10,
      name: 'Dark Glass com Glow Neon',
      description: 'Efeito vidro escuro translúcido com luz de borda em néon saturado.',
      aspectRatio: '320x95',
      defaultWidth: 320,
      defaultHeight: 95,
      badge: 'Glass Glow',
      render: ({ current = 0, target = defaultTarget, isOnline = false }) => {
        const cur = isOnline ? current : 0;
        const tgt = target > 0 ? target : defaultTarget;
        const pct = Math.min(100, Math.round((cur / tgt) * 100));

        return (
          <div className={`w-full h-full p-3.5 rounded-2xl bg-black/85 border ${c.border} shadow-[0_0_25px_rgba(168,85,247,0.18)] flex flex-col justify-between select-none text-left`}>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className={`font-black ${c.textAcc} uppercase flex items-center gap-1.5`}>
                <Sparkles className={`h-3.5 w-3.5 ${c.iconColor}`} /> {title}
              </span>
              <span className="text-white font-mono font-bold">{cur} / {tgt}</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden my-1">
              <div className={`h-full bg-gradient-to-r ${c.gradient} rounded-full`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-[8.5px] font-mono text-slate-400">
              <span>{!isOnline ? 'Live não conectada' : 'Progresso da meta'}</span>
              <span className="text-cyan-300 font-bold">{pct}%</span>
            </div>
          </div>
        );
      }
    }
  ];
}

export const SUB_GOAL_TEMPLATES = createGoalTemplates({
  title: 'META DE INSCRITOS',
  icon: Award,
  defaultColor: 'purple',
  defaultTarget: 50,
  unit: 'subs'
});

export const BITS_GOAL_TEMPLATES = createGoalTemplates({
  title: 'META DE BITS',
  icon: Sparkles,
  defaultColor: 'amber',
  defaultTarget: 2500,
  unit: 'bits'
});

export const RAID_GOAL_TEMPLATES = createGoalTemplates({
  title: 'META DE RAIDS',
  icon: Flame,
  defaultColor: 'red',
  defaultTarget: 5,
  unit: 'raids'
});
