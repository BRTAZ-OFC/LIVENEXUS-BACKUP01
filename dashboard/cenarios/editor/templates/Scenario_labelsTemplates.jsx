import React from 'react';
import { Award, Sparkles, Flame, Trophy, Users } from 'lucide-react';

function createLabelTemplates({ title, icon: Icon, defaultColor = 'purple' }) {
  const colorMap = {
    purple: { border: 'border-purple-500/40', bgBadge: 'bg-purple-950/60', textBadge: 'text-purple-300', textAcc: 'text-purple-400', glow: 'rgba(168,85,247,0.2)' },
    amber: { border: 'border-amber-500/40', bgBadge: 'bg-amber-950/60', textBadge: 'text-amber-300', textAcc: 'text-amber-400', glow: 'rgba(245,158,11,0.2)' },
    red: { border: 'border-red-500/40', bgBadge: 'bg-red-950/60', textBadge: 'text-red-300', textAcc: 'text-red-400', glow: 'rgba(239,68,68,0.2)' },
    cyan: { border: 'border-cyan-500/40', bgBadge: 'bg-cyan-950/60', textBadge: 'text-cyan-300', textAcc: 'text-cyan-400', glow: 'rgba(6,182,212,0.2)' }
  };
  const c = colorMap[defaultColor] || colorMap.purple;

  return [
    {
      id: '01',
      number: 1,
      name: 'Card com Ícone e Nickname',
      description: 'Card retangular equilibrado com ícone destacado e tipografia marcante.',
      aspectRatio: '240x70',
      defaultWidth: 240,
      defaultHeight: 70,
      badge: 'Classic Card',
      render: ({ user, detail, isOnline = false }) => {
        const u = user || (isOnline ? 'Aguardando dados' : 'Live não conectada');
        const d = detail || (isOnline ? 'Nenhum registro' : 'Live offline');

        return (
          <div className={`w-full h-full p-2.5 rounded-none bg-slate-950/90 flex items-center gap-3 select-none text-left shadow-xl`}>
            <div className={`h-10 w-10 rounded-lg ${c.bgBadge} border ${c.border} flex items-center justify-center ${c.textAcc} shrink-0`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="truncate flex-1">
              <span className={`text-[9px] font-mono ${c.textBadge} font-bold uppercase block`}>{title}</span>
              <span className="text-xs font-black text-white truncate block">{u}</span>
              {d && <span className="text-[9px] text-slate-400 truncate block">{d}</span>}
            </div>
          </div>
        );
      }
    },
    {
      id: '02',
      number: 2,
      name: 'Pill Minimalista Compacto',
      description: 'Pílula arredondada fina para canto de tela.',
      aspectRatio: '200x42',
      defaultWidth: 200,
      defaultHeight: 42,
      badge: 'Mini Pill',
      render: ({ user, isOnline = false }) => {
        const u = user || (isOnline ? 'Aguardando' : 'Offline');

        return (
          <div className={`w-full h-full px-3 rounded-full bg-slate-900/90 border ${c.border} flex items-center justify-between select-none shadow-md text-left`}>
            <div className="flex items-center gap-1.5 truncate">
              <Icon className={`h-3.5 w-3.5 ${c.textAcc} shrink-0`} />
              <span className="text-xs font-bold text-white truncate">{u}</span>
            </div>
          </div>
        );
      }
    },
    {
      id: '03',
      number: 3,
      name: 'Banner Chanfrado Esports',
      description: 'Design esportivo com corte chanfrado e gradiente dinâmico.',
      aspectRatio: '280x60',
      defaultWidth: 280,
      defaultHeight: 60,
      badge: 'Esports Tag',
      render: ({ user, detail, isOnline = false }) => {
        const u = user || (isOnline ? 'Standby' : 'Offline');
        const d = detail || '';

        return (
          <div className={`w-full h-full p-2.5 bg-slate-950/90 border-l-4 ${c.border} border-t border-b border-r border-white/5 flex items-center justify-between select-none text-left shadow-lg`}>
            <div className="truncate flex-1">
              <span className={`text-[8.5px] font-mono ${c.textBadge} font-bold uppercase block`}>{title}</span>
              <span className="text-xs font-black text-white truncate block">{u}</span>
            </div>
            {d && <span className="text-[9px] font-mono text-slate-400 shrink-0 ml-2">{d}</span>}
          </div>
        );
      }
    },
    {
      id: '04',
      number: 4,
      name: 'Medalha Circular com Nome',
      description: 'Medalhão central com nome posicionado abaixo.',
      aspectRatio: '140x120',
      defaultWidth: 140,
      defaultHeight: 120,
      badge: 'Circular Tag',
      render: ({ user, isOnline = false }) => {
        const u = user || (isOnline ? 'Aguardando' : 'Offline');

        return (
          <div className={`w-full h-full p-2.5 rounded-2xl bg-slate-950/90 border ${c.border} flex flex-col items-center justify-center select-none text-center shadow-xl`}>
            <div className={`h-10 w-10 rounded-full ${c.bgBadge} border ${c.border} flex items-center justify-center ${c.textAcc} mb-1.5 shadow-md`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className={`text-[8px] font-mono ${c.textBadge} uppercase font-bold`}>{title}</span>
            <span className="text-[11px] font-black text-white truncate max-w-[95%]">{u}</span>
          </div>
        );
      }
    },
    {
      id: '05',
      number: 5,
      name: 'Cyber Tag com Detalhes',
      description: 'Estilo sci-fi chanfrado com acentos de alta tecnologia.',
      aspectRatio: '260x65',
      defaultWidth: 260,
      defaultHeight: 65,
      badge: 'Cyber Tag',
      render: ({ user, detail, isOnline = false }) => {
        const u = user || (isOnline ? 'WAITING' : 'OFFLINE');
        const d = detail || '';

        return (
          <div className="w-full h-full p-2 bg-black/90 border border-white/15 flex flex-col justify-between select-none text-left shadow-xl" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
            <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 border-b border-white/10 pb-0.5">
              <span>// {title.toUpperCase()}</span>
              <span className={c.textAcc}>{isOnline ? '● LIVE' : '● OFF'}</span>
            </div>
            <div className="truncate">
              <span className="text-xs font-mono font-black text-white truncate block">{u}</span>
              {d && <span className={`text-[8.5px] font-mono ${c.textBadge} truncate block`}>{d}</span>}
            </div>
          </div>
        );
      }
    },
    {
      id: '06',
      number: 6,
      name: 'Lower Third Estendido',
      description: 'Faixa estendida para encaixar em rodapés e barras de patrocinadores.',
      aspectRatio: '360x48',
      defaultWidth: 360,
      defaultHeight: 48,
      badge: 'Lower Strip',
      render: ({ user, detail, isOnline = false }) => {
        const u = user || (isOnline ? 'Aguardando' : 'Offline');
        const d = detail || '';

        return (
          <div className="w-full h-full px-3.5 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
            <div className="flex items-center gap-2 truncate">
              <Icon className={`h-4 w-4 ${c.textAcc} shrink-0`} />
              <span className={`text-[9px] font-mono font-bold ${c.textBadge} uppercase shrink-0`}>{title}:</span>
              <span className="text-xs font-bold text-white truncate">{u}</span>
            </div>
            {d && <span className="text-[9px] font-mono text-slate-400 shrink-0 ml-2">{d}</span>}
          </div>
        );
      }
    },
    {
      id: '07',
      number: 7,
      name: 'Big Typography Focus',
      description: 'Tipografia grande e limpa para foco na identificação do apoiador.',
      aspectRatio: '220x80',
      defaultWidth: 220,
      defaultHeight: 80,
      badge: 'Big Text',
      render: ({ user, isOnline = false }) => {
        const u = user || (isOnline ? 'Aguardando dados' : 'Live offline');

        return (
          <div className="w-full h-full p-2.5 rounded-xl bg-black/80 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg">
            <span className={`text-[8px] font-mono ${c.textBadge} font-bold uppercase`}>{title}</span>
            <div className="text-sm font-black text-white truncate leading-tight my-auto">{u}</div>
            <span className="text-[8px] font-mono text-slate-500">{isOnline ? '★ RECONHECIMENTO' : 'LIVE OFFLINE'}</span>
          </div>
        );
      }
    },
    {
      id: '08',
      number: 8,
      name: 'Glassmorphism Suave',
      description: 'Fundo translúcido refinado com borda sutil e gradiente.',
      aspectRatio: '250x65',
      defaultWidth: 250,
      defaultHeight: 65,
      badge: 'Glass Tag',
      render: ({ user, detail, isOnline = false }) => {
        const u = user || (isOnline ? 'Aguardando' : 'Offline');

        return (
          <div className={`w-full h-full p-2.5 rounded-2xl bg-slate-950/80 border ${c.border} backdrop-blur-md flex items-center justify-between select-none text-left shadow-xl`}>
            <div className="truncate flex-1">
              <span className={`text-[8.5px] font-mono ${c.textBadge} font-bold uppercase block`}>{title}</span>
              <span className="text-xs font-bold text-white truncate block">{u}</span>
            </div>
            {detail && <span className="text-[9px] font-mono text-cyan-300 font-bold shrink-0 ml-2">{detail}</span>}
          </div>
        );
      }
    },
    {
      id: '09',
      number: 9,
      name: 'Mini Placa Neon',
      description: 'Placa compacta com glow neon saturado.',
      aspectRatio: '230x60',
      defaultWidth: 230,
      defaultHeight: 60,
      badge: 'Neon Plate',
      render: ({ user, isOnline = false }) => {
        const u = user || (isOnline ? 'Aguardando' : 'Offline');

        return (
          <div className={`w-full h-full px-3 rounded-xl bg-black/90 border ${c.border} flex items-center gap-2 select-none text-left`} style={{ boxShadow: `0 0 15px ${c.glow}` }}>
            <Icon className={`h-4 w-4 ${c.textAcc} shrink-0`} />
            <div className="truncate flex-1">
              <span className={`text-[8px] font-mono ${c.textBadge} uppercase block font-bold`}>{title}</span>
              <span className="text-xs font-black text-white truncate block">{u}</span>
            </div>
          </div>
        );
      }
    },
    {
      id: '10',
      number: 10,
      name: 'Badge em Diagonal 3D',
      description: 'Estilo distintivo militar em ângulo esportivo.',
      aspectRatio: '260x55',
      defaultWidth: 260,
      defaultHeight: 55,
      badge: 'Diagonal 3D',
      render: ({ user, isOnline = false }) => {
        const u = user || (isOnline ? 'Aguardando' : 'Offline');

        return (
          <div className={`w-full h-full p-2 rounded-lg bg-slate-900 border-r-4 ${c.border} border-t border-b border-l border-white/10 flex items-center justify-between select-none text-left shadow-md`}>
            <div className="flex items-center gap-2 truncate">
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'} shrink-0`} />
              <div className="truncate">
                <span className={`text-[7.5px] font-mono ${c.textBadge} uppercase block font-bold`}>{title}</span>
                <span className="text-xs font-bold text-white truncate block">{u}</span>
              </div>
            </div>
          </div>
        );
      }
    }
  ];
}

function createCounterTemplates({ title, icon: Icon, defaultColor = 'purple' }) {
  const colorMap = {
    purple: { border: 'border-purple-500/40', textAcc: 'text-purple-300', iconColor: 'text-purple-400' },
    amber: { border: 'border-amber-500/40', textAcc: 'text-amber-300', iconColor: 'text-amber-400' }
  };
  const c = colorMap[defaultColor] || colorMap.purple;

  return [
    {
      id: '01',
      number: 1,
      name: 'Big Number com Ícone',
      description: 'Contador em número gigante com ícone em destaque.',
      aspectRatio: '200x95',
      defaultWidth: 200,
      defaultHeight: 95,
      badge: 'Big Number',
      render: ({ count = 0, isOnline = false }) => {
        const val = isOnline ? count : 0;

        return (
          <div className={`w-full h-full p-3 rounded-none bg-slate-950/90 flex flex-col justify-between select-none text-left shadow-xl`}>
            <div className="flex justify-between items-center text-[9px] font-mono">
              <span className={`font-bold ${c.textAcc} flex items-center gap-1`}><Icon className={`h-3.5 w-3.5 ${c.iconColor}`} /> {title}</span>
              <span className="text-slate-400">{isOnline ? 'TOTAL' : 'OFF'}</span>
            </div>
            <div className="text-3xl font-black text-white font-mono leading-none my-1">{val}</div>
            <span className="text-[8px] font-mono text-slate-500">{isOnline ? 'Registrados na transmissão' : 'Live não conectada'}</span>
          </div>
        );
      }
    },
    {
      id: '02',
      number: 2,
      name: 'Pill Compacta de Contador',
      description: 'Pílula horizontal minimalista com contagem.',
      aspectRatio: '180x45',
      defaultWidth: 180,
      defaultHeight: 45,
      badge: 'Counter Pill',
      render: ({ count = 0, isOnline = false }) => {
        const val = isOnline ? count : 0;

        return (
          <div className={`w-full h-full px-3.5 rounded-full bg-slate-900/90 border ${c.border} flex items-center justify-between select-none shadow-md`}>
            <div className="flex items-center gap-1.5">
              <Icon className={`h-3.5 w-3.5 ${c.iconColor}`} />
              <span className={`text-[9px] font-mono font-bold ${c.textAcc}`}>{title}</span>
            </div>
            <span className="text-xs font-mono font-black text-white">{val}</span>
          </div>
        );
      }
    },
    {
      id: '03',
      number: 3,
      name: 'Medalha Circular Contador',
      description: 'Medalhão redondo central com valor em destaque.',
      aspectRatio: '140x140',
      defaultWidth: 140,
      defaultHeight: 140,
      badge: 'Circular Counter',
      render: ({ count = 0, isOnline = false }) => {
        const val = isOnline ? count : 0;

        return (
          <div className={`w-full h-full p-2 rounded-full bg-slate-950/90 border ${c.border} flex flex-col items-center justify-center select-none text-center shadow-xl aspect-square`}>
            <Icon className={`h-5 w-5 ${c.iconColor} mb-1`} />
            <span className="text-2xl font-black text-white font-mono leading-none">{val}</span>
            <span className={`text-[8px] font-mono ${c.textAcc} uppercase font-bold mt-1`}>{title}</span>
          </div>
        );
      }
    },
    {
      id: '04',
      number: 4,
      name: 'Card de Estatística Esports',
      description: 'Placa militar esports com dados da live.',
      aspectRatio: '220x75',
      defaultWidth: 220,
      defaultHeight: 75,
      badge: 'Esports Box',
      render: ({ count = 0, isOnline = false }) => {
        const val = isOnline ? count : 0;

        return (
          <div className="w-full h-full p-2.5 rounded-xl bg-black/85 border border-white/10 flex items-center justify-between select-none text-left shadow-lg">
            <div>
              <span className={`text-[8px] font-mono ${c.textAcc} uppercase font-bold block`}>{title}</span>
              <span className="text-2xl font-black text-white font-mono">{val}</span>
            </div>
            <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
              <Icon className="h-5 w-5" />
            </div>
          </div>
        );
      }
    },
    {
      id: '05',
      number: 5,
      name: 'Cyberpunk HUD Contador',
      description: 'Interface sci-fi com display digital luminoso.',
      aspectRatio: '240x80',
      defaultWidth: 240,
      defaultHeight: 80,
      badge: 'Cyber Counter',
      render: ({ count = 0, isOnline = false }) => {
        const val = isOnline ? count : 0;

        return (
          <div className="w-full h-full p-2.5 bg-black/90 border border-cyan-400 flex flex-col justify-between select-none text-left shadow-xl" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
            <div className="flex justify-between text-[8px] font-mono text-cyan-300">
              <span>// {title.toUpperCase()}</span>
              <span>{isOnline ? 'SYNC: OK' : 'OFFLINE'}</span>
            </div>
            <div className="text-2xl font-mono font-black text-white">{val}</div>
            <span className="text-[7.5px] font-mono text-slate-500">TELEMETRIA LIVE</span>
          </div>
        );
      }
    },
    {
      id: '06',
      number: 6,
      name: 'Card Transparente Clean',
      description: 'Sem fundo opaco pesado para sobrepor gameplay.',
      aspectRatio: '200x70',
      defaultWidth: 200,
      defaultHeight: 70,
      badge: 'Clean Counter',
      render: ({ count = 0, isOnline = false }) => {
        const val = isOnline ? count : 0;

        return (
          <div className="w-full h-full p-2 flex flex-col justify-end select-none text-left drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            <span className={`text-[8.5px] font-mono ${c.textAcc} uppercase font-bold`}>{title}</span>
            <div className="text-2xl font-black text-white font-mono leading-none my-0.5">{val}</div>
          </div>
        );
      }
    },
    {
      id: '07',
      number: 7,
      name: 'Split Box com Header',
      description: 'Header colorido com corpo numérico de alto contraste.',
      aspectRatio: '200x85',
      defaultWidth: 200,
      defaultHeight: 85,
      badge: 'Split Header',
      render: ({ count = 0, isOnline = false }) => {
        const val = isOnline ? count : 0;

        return (
          <div className="w-full h-full rounded-xl bg-slate-950 border border-white/10 flex flex-col overflow-hidden select-none text-left shadow-xl">
            <div className={`px-2.5 py-1 ${c.textAcc} bg-white/5 text-[9px] font-mono font-bold uppercase flex items-center justify-between`}>
              <span>{title}</span>
              <Icon className="h-3 w-3" />
            </div>
            <div className="p-2.5 flex-1 flex items-center justify-center">
              <span className="text-2xl font-black text-white font-mono">{val}</span>
            </div>
          </div>
        );
      }
    },
    {
      id: '08',
      number: 8,
      name: 'Dark Glass com Glow',
      description: 'Vidro escuro com brilho neon nas bordas.',
      aspectRatio: '220x80',
      defaultWidth: 220,
      defaultHeight: 80,
      badge: 'Dark Glass',
      render: ({ count = 0, isOnline = false }) => {
        const val = isOnline ? count : 0;

        return (
          <div className={`w-full h-full p-2.5 rounded-2xl bg-black/85 border ${c.border} flex items-center justify-between select-none text-left shadow-xl`}>
            <div>
              <span className={`text-[8px] font-mono ${c.textAcc} uppercase font-bold block`}>{title}</span>
              <span className="text-2xl font-black text-white font-mono">{val}</span>
            </div>
            <Icon className={`h-7 w-7 ${c.iconColor} opacity-80`} />
          </div>
        );
      }
    },
    {
      id: '09',
      number: 9,
      name: 'Lower Third Horizontal',
      description: 'Faixa estendida de rodapé com valor à direita.',
      aspectRatio: '320x45',
      defaultWidth: 320,
      defaultHeight: 45,
      badge: 'Lower Counter',
      render: ({ count = 0, isOnline = false }) => {
        const val = isOnline ? count : 0;

        return (
          <div className="w-full h-full px-3.5 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${c.iconColor}`} />
              <span className={`text-[9px] font-mono font-bold ${c.textAcc} uppercase`}>{title}</span>
            </div>
            <span className="text-sm font-mono font-black text-white">{val}</span>
          </div>
        );
      }
    },
    {
      id: '10',
      number: 10,
      name: 'Placa de Honra da Stream',
      description: 'Estilo placa de conquista para contador.',
      aspectRatio: '210x90',
      defaultWidth: 210,
      defaultHeight: 90,
      badge: 'Honor Plate',
      render: ({ count = 0, isOnline = false }) => {
        const val = isOnline ? count : 0;

        return (
          <div className={`w-full h-full p-2.5 rounded-xl bg-slate-900 border ${c.border} flex flex-col justify-between select-none text-center shadow-xl`}>
            <span className={`text-[8px] font-mono ${c.textAcc} uppercase font-bold`}>{title}</span>
            <div className="text-2xl font-black text-white font-mono my-auto">{val}</div>
            <span className="text-[7.5px] font-mono text-slate-400">{isOnline ? 'AO VIVO' : 'OFFLINE'}</span>
          </div>
        );
      }
    }
  ];
}

export const LATEST_SUB_TEMPLATES = createLabelTemplates({
  title: 'ÚLTIMO INSCRITO',
  icon: Award,
  defaultColor: 'purple'
});

export const LATEST_CHEER_TEMPLATES = createLabelTemplates({
  title: 'ÚLTIMO CHEER',
  icon: Sparkles,
  defaultColor: 'amber'
});

export const LATEST_RAID_TEMPLATES = createLabelTemplates({
  title: 'ÚLTIMA RAID',
  icon: Flame,
  defaultColor: 'red'
});

export const TOP_CHEER_TEMPLATES = createLabelTemplates({
  title: 'MAIOR CHEER',
  icon: Trophy,
  defaultColor: 'amber'
});

export const SUB_COUNTER_TEMPLATES = createCounterTemplates({
  title: 'SUBS ATIVOS',
  icon: Users,
  defaultColor: 'purple'
});

export const BITS_COUNTER_TEMPLATES = createCounterTemplates({
  title: 'BITS TOTAIS',
  icon: Sparkles,
  defaultColor: 'amber'
});
