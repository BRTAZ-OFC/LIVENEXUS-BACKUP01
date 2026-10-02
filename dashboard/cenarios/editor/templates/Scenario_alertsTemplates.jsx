import React from 'react';
import { Bell, Award, Zap, Trophy, Sparkles, Terminal, Activity } from 'lucide-react';

export const ALERTS_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Banner Superior Cinematográfico',
    description: 'Faixa superior widescreen com gradiente dourado, ícone destacado e grande impacto visual.',
    aspectRatio: '420x90',
    defaultWidth: 420,
    defaultHeight: 90,
    badge: 'Cinematic',
    render: ({ lastEvent, isOnline = false }) => {
      const author = lastEvent ? (lastEvent.author || lastEvent.user || lastEvent.username || 'Novo Evento') : (isOnline ? 'Aguardando alertas...' : 'Live não conectada');
      const detail = lastEvent ? (lastEvent.text || lastEvent.detail || 'Evento no canal') : (isOnline ? 'Nenhum evento registrado' : 'Live offline');

      return (
        <div className="w-full h-full px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-950/90 via-slate-950/90 to-indigo-950/90 border border-purple-500/40 shadow-2xl flex items-center justify-between select-none overflow-hidden text-left">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300 shadow-md shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider block">ALERTA DA STREAM</span>
              <span className="text-base font-black text-white truncate block drop-shadow-md">{author}</span>
              <span className="text-xs text-purple-200/80 block truncate">{detail}</span>
            </div>
          </div>
          <Sparkles className="h-5 w-5 text-amber-300 animate-pulse shrink-0" />
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Card Central Pop-In',
    description: 'Composição concentrada e equilibrada para o centro da tela com badge de troféu.',
    aspectRatio: '280x160',
    defaultWidth: 280,
    defaultHeight: 160,
    badge: 'Center Pop',
    render: ({ lastEvent, isOnline = false }) => {
      const author = lastEvent ? (lastEvent.author || lastEvent.user || lastEvent.username) : (isOnline ? 'Aguardando evento...' : 'Live não conectada');
      const detail = lastEvent ? (lastEvent.text || lastEvent.detail || 'Novo Apoio') : (isOnline ? 'Nenhum alerta recente' : 'Live offline');

      return (
        <div className="w-full h-full p-4 rounded-2xl bg-slate-950/95 border-2 border-cyan-400 flex flex-col items-center justify-center text-center shadow-2xl select-none relative overflow-hidden">
          <div className="h-12 w-12 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 mb-2 shadow-lg animate-bounce">
            <Trophy className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">ALERTA</span>
          <span className="text-base font-black text-white truncate w-full px-2">{author}</span>
          <span className="text-xs text-slate-300 mt-0.5">{detail}</span>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Lower Third de TV / Broadcast',
    description: 'Faixa estendida com aba chanfrada para transmissões profissionais de TV e campeonatos.',
    aspectRatio: '440x65',
    defaultWidth: 440,
    defaultHeight: 65,
    badge: 'Broadcast TV',
    render: ({ lastEvent, isOnline = false }) => {
      const author = lastEvent ? (lastEvent.author || lastEvent.user || lastEvent.username) : (isOnline ? 'Aguardando evento...' : 'Live não conectada');
      const detail = lastEvent ? (lastEvent.text || lastEvent.detail || 'Evento Recente') : (isOnline ? 'Nenhum evento registrado' : 'Offline');

      return (
        <div className="w-full h-full flex items-center bg-slate-950/90 border border-white/10 rounded-xl overflow-hidden shadow-xl select-none text-left">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full px-4 flex items-center justify-center text-white font-mono font-black text-xs shrink-0 uppercase tracking-wider">
            {isOnline ? 'ALERTA' : 'OFFLINE'}
          </div>
          <div className="flex-1 px-4 truncate">
            <span className="text-sm font-bold text-white block truncate">{author}</span>
            <span className="text-[10px] text-purple-300 block truncate">{detail}</span>
          </div>
          <div className="pr-3 text-[10px] font-mono text-slate-400 uppercase">{isOnline ? 'AO VIVO' : 'OFFLINE'}</div>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Medalha Circular Neon',
    description: 'Formato redondo radial com ícone e nome no centro, ideal para alertas minimalistas.',
    aspectRatio: '180x180',
    defaultWidth: 180,
    defaultHeight: 180,
    badge: 'Badge Circular',
    render: ({ lastEvent, isOnline = false }) => {
      const author = lastEvent ? (lastEvent.author || lastEvent.user || lastEvent.username) : (isOnline ? 'Aguardando' : 'Offline');

      return (
        <div className="w-full h-full rounded-full bg-slate-950/90 border-2 border-purple-500/60 flex flex-col items-center justify-center p-3 text-center shadow-xl select-none relative aspect-square">
          <div className="absolute inset-1 rounded-full border border-purple-500/20 animate-spin" style={{ animationDuration: '8s' }} />
          <Award className="h-7 w-7 text-purple-400 mb-1" />
          <span className="text-[9px] font-mono text-purple-300 uppercase font-bold">ALERTA</span>
          <span className="text-xs font-black text-white truncate max-w-[85%]">{author}</span>
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'Cyber Frame HUD',
    description: 'Estilo interface mecha cibernética com cantos em corte diagonal e acentos tecnológicos.',
    aspectRatio: '360x100',
    defaultWidth: 360,
    defaultHeight: 100,
    badge: 'Cyber Frame',
    render: ({ lastEvent, isOnline = false }) => {
      const author = lastEvent ? (lastEvent.author || lastEvent.user || lastEvent.username) : (isOnline ? 'STANDBY' : 'OFFLINE');
      const detail = lastEvent ? (lastEvent.text || lastEvent.detail || 'Telemetria de Evento') : (isOnline ? 'Aguardando evento' : 'Transmissão offline');

      return (
        <div className="w-full h-full p-3 bg-black/90 border border-cyan-400 flex flex-col justify-between overflow-hidden shadow-2xl select-none text-left" style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}>
          <div className="flex justify-between items-center text-[9px] font-mono text-cyan-400 border-b border-cyan-500/30 pb-1">
            <span>[ALERTA_SUBSYSTEM_01]</span>
            <span>{isOnline ? 'STATUS: ONLINE' : 'STATUS: OFFLINE'}</span>
          </div>
          <div className="truncate">
            <span className="text-xs font-mono text-pink-400 block font-bold">// EVENTO REGISTRADO:</span>
            <span className="text-sm font-black text-white block truncate">{author}</span>
            <span className="text-[10px] text-cyan-300 block truncate">{detail}</span>
          </div>
        </div>
      );
    }
  },
  {
    id: '06',
    number: 6,
    name: 'Minimalist Floating Pill',
    description: 'Pílula ultra-discreta e flutuante para streamers que preferem visual clean.',
    aspectRatio: '300x55',
    defaultWidth: 300,
    defaultHeight: 55,
    badge: 'Clean Pill',
    render: ({ lastEvent, isOnline = false }) => {
      const author = lastEvent ? (lastEvent.author || lastEvent.user || lastEvent.username) : (isOnline ? 'Aguardando alertas' : 'Live não conectada');

      return (
        <div className="w-full h-full px-3.5 rounded-full bg-slate-900/90 border border-white/15 shadow-xl flex items-center justify-between select-none text-left">
          <div className="flex items-center gap-2.5 truncate">
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'} shrink-0`} />
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase shrink-0">Alerta:</span>
            <span className="text-xs font-black text-white truncate">{author}</span>
          </div>
          <Sparkles className="h-4 w-4 text-rose-400 shrink-0 ml-2" />
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Card Retrô Arcade 8-Bit',
    description: 'Bordas pixeladas com cores vibrantes e estética de jogos clássicos arcade.',
    aspectRatio: '320x110',
    defaultWidth: 320,
    defaultHeight: 110,
    badge: '8-Bit Retro',
    render: ({ lastEvent, isOnline = false }) => {
      const author = lastEvent ? (lastEvent.author || lastEvent.user || lastEvent.username) : (isOnline ? 'READY' : 'GAME OVER');
      const detail = lastEvent ? (lastEvent.text || lastEvent.detail || '+1 EVENTO') : (isOnline ? 'Aguardando evento' : 'OFFLINE');

      return (
        <div className="w-full h-full p-3 rounded-lg bg-indigo-950 border-4 border-yellow-400 font-mono flex flex-col justify-between select-none text-left shadow-2xl">
          <div className="flex justify-between items-center text-[10px] text-yellow-300 font-black">
            <span>★ ALERTA DA LIVE ★</span>
            <span>{isOnline ? '1UP' : '0UP'}</span>
          </div>
          <div className="my-auto truncate">
            <div className="text-sm font-black text-white truncate">{author}</div>
            <div className="text-[11px] text-emerald-400 font-bold truncate">{detail}</div>
          </div>
          <div className="text-[9px] text-slate-400">{isOnline ? 'CREDIT: LIVE ON' : 'CREDIT: OFFLINE'}</div>
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Split Dual Box',
    description: 'Caixa dividida com bloco de destaque para o ícone à esquerda e dados à direita.',
    aspectRatio: '380x80',
    defaultWidth: 380,
    defaultHeight: 80,
    badge: 'Split Box',
    render: ({ lastEvent, isOnline = false }) => {
      const author = lastEvent ? (lastEvent.author || lastEvent.user || lastEvent.username) : (isOnline ? 'Aguardando dados' : 'Live não conectada');
      const detail = lastEvent ? (lastEvent.text || lastEvent.detail || 'Evento recente') : (isOnline ? 'Nenhum evento registrado' : 'Offline');

      return (
        <div className="w-full h-full flex rounded-2xl bg-slate-950/90 border border-purple-500/30 overflow-hidden shadow-xl select-none text-left">
          <div className="w-20 bg-gradient-to-b from-purple-600 to-indigo-700 flex items-center justify-center text-white shrink-0">
            <Bell className="h-7 w-7" />
          </div>
          <div className="flex-1 p-3 flex flex-col justify-center truncate">
            <span className="text-[10px] font-mono text-purple-300 font-bold uppercase">ALERTA RECENTE</span>
            <span className="text-sm font-bold text-white truncate">{author}</span>
            <span className="text-xs text-slate-300 truncate">{detail}</span>
          </div>
        </div>
      );
    }
  },
  {
    id: '09',
    number: 9,
    name: 'Faixa Chanfrada Esports',
    description: 'Ângulos agressivos esportivos com degradê de velocidade para lives de FPS e MOBA.',
    aspectRatio: '400x75',
    defaultWidth: 400,
    defaultHeight: 75,
    badge: 'Esports Edge',
    render: ({ lastEvent, isOnline = false }) => {
      const author = lastEvent ? (lastEvent.author || lastEvent.user || lastEvent.username) : (isOnline ? 'STANDBY' : 'OFFLINE');

      return (
        <div className="w-full h-full flex items-center bg-gradient-to-r from-red-600 via-rose-700 to-slate-950 p-3 rounded-xl shadow-2xl select-none text-left border-l-4 border-amber-400">
          <div className="h-10 w-10 rounded-lg bg-black/40 flex items-center justify-center text-amber-300 mr-3 shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div className="truncate flex-1">
            <span className="text-[9px] font-mono font-bold text-amber-300 uppercase">ALERTA DA SESSÃO</span>
            <span className="text-base font-black text-white block truncate">{author}</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-white/80 bg-black/40 px-2 py-1 rounded">{isOnline ? 'LIVE' : 'OFF'}</span>
        </div>
      );
    }
  },
  {
    id: '10',
    number: 10,
    name: 'Glow Holográfico',
    description: 'Efeito holograma com scanlines sutis e iluminação neon ciano e violeta.',
    aspectRatio: '340x120',
    defaultWidth: 340,
    defaultHeight: 120,
    badge: 'Holo Glow',
    render: ({ lastEvent, isOnline = false }) => {
      const author = lastEvent ? (lastEvent.author || lastEvent.user || lastEvent.username) : (isOnline ? 'Aguardando...' : 'Offline');
      const detail = lastEvent ? (lastEvent.text || lastEvent.detail || 'Alerta') : (isOnline ? 'Nenhum evento registrado' : 'Live não conectada');

      return (
        <div className="w-full h-full p-4 rounded-2xl bg-slate-950/80 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex flex-col justify-between select-none text-left relative overflow-hidden">
          <div className="flex justify-between items-center text-[10px] font-mono text-cyan-300">
            <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> HOLO_FEED</span>
            <span>{isOnline ? 'ACT_01' : 'ACT_OFF'}</span>
          </div>
          <div className="my-auto truncate">
            <span className="text-base font-black text-white block truncate">{author}</span>
            <span className="text-xs text-cyan-200 block truncate">{detail}</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 flex justify-between">
            <span>SISTEMA DE ALERTA</span>
            <span className={isOnline ? 'text-emerald-400' : 'text-rose-400'}>{isOnline ? '● ATIVO' : '● OFFLINE'}</span>
          </div>
        </div>
      );
    }
  }
];

export const EVENT_LIST_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Timeline Vertical com Nós',
    description: 'Linha do tempo vertical com nós circulares conectados e histórico cronológico.',
    aspectRatio: '260x300',
    defaultWidth: 260,
    defaultHeight: 300,
    badge: 'Timeline',
    render: ({ events = [], isOnline = false }) => {
      const list = events.slice(0, 4);

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex flex-col justify-between select-none text-left overflow-hidden">
          <div className="text-[10px] font-mono font-bold text-purple-300 uppercase pb-2 border-b border-white/10 shrink-0">
            Linha de Eventos
          </div>
          <div className="flex-1 flex flex-col justify-end space-y-2 relative pl-3 border-l-2 border-purple-500/30 ml-2 my-2 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic">Live não conectada</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic">Nenhum evento registrado</div>
            ) : (
              list.map((ev, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[19px] top-1 h-2 w-2 rounded-full bg-purple-400" />
                  <span className="text-xs font-bold text-white block truncate">{ev.author || ev.user || ev.username}</span>
                  <span className="text-[10px] text-purple-300 block truncate">{ev.text || ev.detail || 'Evento'}</span>
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
    name: 'Cards Empilhados Glass',
    description: 'Cards translúcidos sobrepostos com transição suave e separadores discretos.',
    aspectRatio: '280x280',
    defaultWidth: 280,
    defaultHeight: 280,
    badge: 'Stacked Cards',
    render: ({ events = [], isOnline = false }) => {
      const list = events.slice(0, 3);

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between select-none text-left overflow-hidden shadow-xl">
          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase pb-1 border-b border-white/10">ÚLTIMOS EVENTOS</span>
          <div className="flex-1 flex flex-col justify-end space-y-1.5 my-1 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6">Live não conectada</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6">Nenhum evento registrado</div>
            ) : (
              list.map((ev, i) => (
                <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs font-bold text-white block truncate">{ev.author || ev.user || ev.username}</span>
                  <span className="text-[10px] text-cyan-300 block truncate">{ev.text || ev.detail || 'Evento'}</span>
                </div>
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
    name: 'Lista Minimalista sem Bordas',
    description: 'Foco exclusivo nos nomes e eventos com divisórias pontilhadas e tipografia leve.',
    aspectRatio: '240x260',
    defaultWidth: 240,
    defaultHeight: 260,
    badge: 'Minimal List',
    render: ({ events = [], isOnline = false }) => {
      const list = events.slice(0, 4);

      return (
        <div className="w-full h-full p-3 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col justify-between select-none text-left overflow-hidden">
          <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">Histórico</span>
          <div className="flex-1 flex flex-col justify-end space-y-1 my-1 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic">Live não conectada</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic">Nenhum evento registrado</div>
            ) : (
              list.map((ev, i) => (
                <div key={i} className="text-xs py-1 border-b border-white/5 last:border-0 truncate">
                  <span className="font-bold text-purple-300 mr-1.5">{ev.author || ev.user || ev.username}:</span>
                  <span className="text-slate-300">{ev.text || ev.detail || 'Evento'}</span>
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
    name: 'Terminal Console Feed',
    description: 'Estilo linha de log de servidor em monospace verde neon.',
    aspectRatio: '320x220',
    defaultWidth: 320,
    defaultHeight: 220,
    badge: 'Terminal Feed',
    render: ({ events = [], isOnline = false }) => {
      const list = events.slice(0, 4);

      return (
        <div className="w-full h-full p-3 bg-black border border-emerald-500/40 font-mono flex flex-col justify-between select-none text-left overflow-hidden shadow-2xl">
          <div className="text-[9px] text-emerald-400 border-b border-emerald-500/20 pb-1 flex justify-between">
            <span className="flex items-center gap-1"><Terminal className="h-3 w-3" /> /logs/events.log</span>
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <div className="flex-1 flex flex-col justify-end space-y-1 my-1 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-emerald-500/60 font-mono italic text-center py-4">err: live_offline</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-emerald-500/60 font-mono italic text-center py-4">aguardando_eventos...</div>
            ) : (
              list.map((ev, i) => (
                <div key={i} className="text-[11px] text-emerald-300 truncate">
                  <span className="text-emerald-500 font-bold">&gt; [{ev.author || ev.user || ev.username}]</span> {ev.text || ev.detail || 'EVT'}
                </div>
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
    name: 'Ticker de Notícias com Ícones',
    description: 'Faixa com layout de notícias e ícones temáticos para cada tipo de evento.',
    aspectRatio: '340x140',
    defaultWidth: 340,
    defaultHeight: 140,
    badge: 'News Ticker',
    render: ({ events = [], isOnline = false }) => {
      const list = events.slice(0, 3);

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-900 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg overflow-hidden">
          <div className="flex justify-between items-center text-[10px] font-mono text-purple-300 font-bold uppercase">
            <span>FEED DA COMUNIDADE</span>
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping" />
          </div>
          <div className="flex-1 flex flex-col justify-end space-y-1 my-1 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-2">Live não conectada</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-2">Nenhum evento registrado</div>
            ) : (
              list.map((ev, i) => (
                <div key={i} className="flex items-center gap-2 text-xs truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                  <span className="font-bold text-white truncate">{ev.author || ev.user || ev.username}</span>
                  <span className="text-slate-400 truncate text-[10px]">{ev.text || ev.detail || 'Evento'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '06',
    number: 6,
    name: 'Esports Roster de Eventos',
    description: 'Visual estilo placa de jogadores em torneios com número ordinal em degradê.',
    aspectRatio: '300x260',
    defaultWidth: 300,
    defaultHeight: 260,
    badge: 'Esports Roster',
    render: ({ events = [], isOnline = false }) => {
      const list = events.slice(0, 4);

      return (
        <div className="w-full h-full p-3 rounded-xl bg-slate-950 border border-slate-700 flex flex-col justify-between select-none text-left shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-indigo-700 px-3 py-1 -mx-3 -mt-3 text-xs font-black text-white uppercase flex justify-between shrink-0">
            <span>HISTÓRICO MATCH</span>
            <span>{isOnline ? 'AO VIVO' : 'OFFLINE'}</span>
          </div>
          <div className="flex-1 flex flex-col justify-end space-y-1.5 my-1 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6">Live não conectada</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6">Nenhum evento registrado</div>
            ) : (
              list.map((ev, i) => (
                <div key={i} className="p-1.5 rounded bg-white/5 flex items-center justify-between text-xs">
                  <span className="font-bold text-white truncate"><span className="text-red-400 font-mono mr-1">#{i + 1}</span>{ev.author || ev.user || ev.username}</span>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-1">{ev.text || ev.detail || 'Evento'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Pills Flutuantes Horizontais',
    description: 'Pílulas arredondadas flutuantes independentes em fundo transparente.',
    aspectRatio: '320x180',
    defaultWidth: 320,
    defaultHeight: 180,
    badge: 'Pill Cluster',
    render: ({ events = [], isOnline = false }) => {
      const list = events.slice(0, 3);

      return (
        <div className="w-full h-full p-2 flex flex-col justify-end space-y-1.5 select-none text-left overflow-hidden">
          {!isOnline ? (
            <div className="text-xs text-slate-500 font-mono italic text-center py-6">Live não conectada</div>
          ) : list.length === 0 ? (
            <div className="text-xs text-slate-500 font-mono italic text-center py-6">Nenhum evento registrado</div>
          ) : (
            list.map((ev, i) => (
              <div key={i} className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 shadow-lg text-xs flex items-center justify-between truncate">
                <span className="font-bold text-purple-300 truncate">{ev.author || ev.user || ev.username}</span>
                <span className="text-[10px] text-slate-400 shrink-0 ml-2">{ev.text || ev.detail || 'Evento'}</span>
              </div>
            ))
          )}
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Cyberpunk HUD Lista',
    description: 'Estilo painel sci-fi com cantos chanfrados e linhas de escaneamento.',
    aspectRatio: '340x240',
    defaultWidth: 340,
    defaultHeight: 240,
    badge: 'Cyber List',
    render: ({ events = [], isOnline = false }) => {
      const list = events.slice(0, 4);

      return (
        <div className="w-full h-full p-3 bg-slate-950/90 border border-cyan-400 flex flex-col justify-between select-none text-left overflow-hidden shadow-2xl" style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
          <div className="flex justify-between text-[9px] font-mono text-cyan-300 border-b border-cyan-400/30 pb-1">
            <span>[EVENT_BUFFER_CACHE]</span>
            <span>{isOnline ? 'SYNC: OK' : 'SYNC: OFF'}</span>
          </div>
          <div className="flex-1 flex flex-col justify-end space-y-1 my-1 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-rose-400 font-mono italic text-center py-6">[STATUS: OFFLINE]</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-cyan-400/60 font-mono italic text-center py-6">[SEM EVENTOS NA TRANSMISSÃO]</div>
            ) : (
              list.map((ev, i) => (
                <div key={i} className="bg-cyan-950/30 border-l-2 border-cyan-400 pl-2 py-0.5 text-xs truncate">
                  <span className="font-mono text-pink-400 font-bold mr-1">[{ev.author || ev.user || ev.username}]</span>
                  <span className="text-slate-200">{ev.text || ev.detail || 'Evento'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '09',
    number: 9,
    name: 'Grade Compacta de Apoio',
    description: 'Disposição em 2 colunas com mini blocos para economizar altura vertical.',
    aspectRatio: '320x160',
    defaultWidth: 320,
    defaultHeight: 160,
    badge: 'Grid 2x2',
    render: ({ events = [], isOnline = false }) => {
      const list = events.slice(0, 4);

      return (
        <div className="w-full h-full p-2.5 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[9px] font-mono text-purple-300 font-bold uppercase pb-1 border-b border-white/10">EVENTOS RECENTES</span>
          <div className="grid grid-cols-2 gap-1.5 my-auto">
            {!isOnline ? (
              <div className="col-span-2 text-xs text-slate-500 font-mono italic text-center py-4">Live não conectada</div>
            ) : list.length === 0 ? (
              <div className="col-span-2 text-xs text-slate-500 font-mono italic text-center py-4">Nenhum evento registrado</div>
            ) : (
              list.map((ev, i) => (
                <div key={i} className="p-1.5 rounded-xl bg-white/5 border border-white/5 truncate">
                  <span className="text-xs font-bold text-white block truncate">{ev.author || ev.user || ev.username}</span>
                  <span className="text-[9px] text-purple-300 block truncate">{ev.text || ev.detail || 'Evento'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '10',
    number: 10,
    name: 'Faixa Horizontal Contínua',
    description: 'Layout em formato de faixa única horizontal com múltiplos eventos alinhados.',
    aspectRatio: '460x55',
    defaultWidth: 460,
    defaultHeight: 55,
    badge: 'Single Strip',
    render: ({ events = [], isOnline = false }) => {
      const list = events.slice(0, 3);

      return (
        <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-lg overflow-hidden">
          <div className="flex items-center gap-1.5 pr-3 border-r border-white/10 shrink-0 text-purple-400">
            <Activity className="h-4 w-4" />
            <span className="text-[9px] font-mono font-bold uppercase text-white">EVENTOS</span>
          </div>
          <div className="flex-1 px-3 overflow-hidden">
            {!isOnline ? (
              <span className="text-xs text-slate-500 font-mono italic">Live não conectada</span>
            ) : list.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono italic">Nenhum evento registrado</span>
            ) : (
              <div className="flex items-center gap-3 truncate">
                {list.map((ev, i) => (
                  <span key={i} className="text-xs shrink-0 inline-flex items-center gap-1">
                    <span className="font-bold text-white">{ev.author || ev.user || ev.username}:</span>
                    <span className="text-purple-300 text-[11px]">{ev.text || ev.detail || 'Evento'}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
  }
];
