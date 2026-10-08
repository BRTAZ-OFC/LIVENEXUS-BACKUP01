import React, { useEffect, useState } from 'react';
import { getCurrentTrack } from '@dashboard/biblioteca/Library_youtubePlayer';
import { playerEvents } from '@dashboard/biblioteca/Library_playerEvents';

const shells = [
  'rounded-xl bg-slate-950/90 text-white p-4',
  'rounded-full bg-indigo-950/90 border-2 border-indigo-400 text-indigo-100 px-6 py-3',
  'rounded-none bg-black border-l-4 border-lime-400 text-lime-300 p-4 font-mono',
  'rounded-2xl bg-gradient-to-r from-purple-950 via-fuchsia-900 to-slate-950 border border-fuchsia-400/70 text-white p-4',
  'rounded-lg bg-white/95 border border-slate-300 text-slate-900 p-4 shadow-lg'
];

function Frame({ config = {}, children, label, className = '' }) {
  const style = Math.max(0, Math.min(5, Number(config.structuralPreset) || 0));
  const showBorder = config.showBorder === true;
  let shellStr = shells[style ? style - 1 : 0] || shells[0];
  if (!showBorder) {
    shellStr = shellStr
      .replace(/\bborder-[^\s]+/g, '')
      .replace(/\bborder\b/g, '')
      .replace(/\brounded-[^\s]+/g, 'rounded-none');
  }
  return <div className={`w-full h-full min-w-0 overflow-hidden flex ${style === 2 ? 'items-center justify-between gap-3' : style === 4 ? 'items-center justify-center gap-3' : 'flex-col justify-center gap-2'} ${shellStr} ${className}`} style={{ fontFamily: config.fontFamily || 'Inter, sans-serif' }}>
    {label && style !== 5 && <span className="text-[10px] font-bold uppercase tracking-[.17em] opacity-70">{label}</span>}
    {children}
  </div>;
}

export function DeathCounter({ config = {}, elementKey }) {
  const count = Math.max(0, Number(config.deathCount) || 0);
  return <Frame config={config} label={elementKey === 'count' ? null : 'Mortes'}>
    <strong className="text-4xl leading-none tabular-nums">{count}</strong>
  </Frame>;
}

export function ClockWidget({ config = {}, elementKey }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const zone = config.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  let time, date;
  try {
    time = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
    date = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, day: '2-digit', month: 'long' }).format(now);
  } catch {
    time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
    date = '';
  }
  return <Frame config={config} label={elementKey ? null : 'Relógio'}>
    {elementKey !== 'date' && <time className="text-3xl font-bold leading-none tabular-nums">{time}</time>}
    {elementKey !== 'time' && (elementKey === 'date' || Number(config.structuralPreset) !== 5) && <span className="text-xs opacity-70">{date}</span>}
  </Frame>;
}

function formatDuration(seconds) {
  const n = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(n / 3600)).padStart(2, '0')}:${String(Math.floor(n % 3600 / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
}

export function TimerWidget({ config = {}, elementKey }) {
  const [now, setNow] = useState(() => Date.now());
  const initial = Math.max(0, Number(config.durationSeconds ?? 300));
  const remaining = config.timerRunning && Number.isFinite(Number(config.timerEndAt))
    ? Math.max(0, (Number(config.timerEndAt) - now) / 1000)
    : Math.max(0, Number(config.remainingSeconds ?? initial));
  useEffect(() => {
    if (!config.timerRunning) return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [config.timerRunning]);
  return <Frame config={config} label={elementKey === 'timer' ? null : 'Temporizador'}>
    <strong className="text-3xl leading-none tabular-nums">{formatDuration(remaining)}</strong>
  </Frame>;
}

function useExistingTrack() {
  const [track, setTrack] = useState(() => getCurrentTrack());
  useEffect(() => {
    const refresh = () => setTrack(getCurrentTrack());
    const off = ['track_changed', 'track_started', 'track_resumed', 'track_paused', 'track_finished', 'queue_empty'].map(event => playerEvents.on(event, refresh));
    let channel;
    const fromState = data => { if (data?.type === 'music_state') setTrack(data.track || null); };
    try {
      channel = new BroadcastChannel('streamspeak_music');
      channel.onmessage = event => fromState(event.data);
      channel.postMessage({ type: 'music_request_state' });
    } catch { /* Player may be in the same tab. */ }
    const onStorage = event => {
      if (event.key === 'streamspeak_music_state' && event.newValue) {
        try { fromState(JSON.parse(event.newValue)); } catch { /* Invalid old state. */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { off.forEach(unsubscribe => unsubscribe()); channel?.close(); window.removeEventListener('storage', onStorage); };
  }, []);
  return track;
}

export function NowPlayingWidget({ config = {}, elementKey }) {
  const track = useExistingTrack();
  const title = track?.title || 'Nada tocando';
  const artist = track?.artist || track?.artistName || 'Sem artista';
  const image = track?.thumbnail || track?.cover || track?.image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop';
  
  let layout = config.layout || 'default';
  if (config.structuralPreset === '01') layout = 'default';
  else if (config.structuralPreset === '02') layout = 'square';
  else if (config.structuralPreset === '03') layout = 'horizontal';
  else if (config.structuralPreset === '04') layout = 'vinil';
  else if (config.structuralPreset === '05') layout = 'marquee';
  
  const marqueeAnimation = <style>{`@keyframes ln-track-marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-33.33%); } }`}</style>;
  const marqueeStyle = { animation: 'ln-track-marquee 15s linear infinite' };

  // Lógica de Fragmentação (para templates customizados)
  if (elementKey === 'cover') return <img src={image} alt="Capa" className="h-full w-full object-cover rounded" />;
  if (elementKey === 'title') return <div className="w-full overflow-hidden">{marqueeAnimation}<span className="inline-block font-bold text-lg text-white whitespace-nowrap" style={marqueeStyle}>{title}</span></div>;
  if (elementKey === 'artist') return <span className="text-sm font-medium text-slate-400 truncate">{artist}</span>;

  // 1. PADRÃO (FAIXA SUPERIOR)
  if (layout === 'default') {
    const textRepeated = `${title} • `.repeat(15);
    return (
      <div 
        className="w-full h-full flex items-center p-3 select-none relative overflow-hidden"
        style={{
          fontFamily: config.fontFamily || 'Inter, sans-serif',
          background: '#090d16',
          borderRadius: '0px',
          boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)'
        }}
      >
        <span className="text-red-500 text-lg font-bold mr-3 shrink-0 flex items-center">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </span>
        <div className="flex-1 overflow-hidden whitespace-nowrap relative">
          {marqueeAnimation}
          <span className="inline-block font-bold text-white text-sm tracking-wide" style={marqueeStyle}>
            {textRepeated}
          </span>
        </div>
      </div>
    );
  }

  // 2. QUADRADO
  if (layout === 'square') {
    const textRepeated = `${title} • `.repeat(10);
    return (
      <div 
        className="w-full h-full flex flex-col justify-between p-4 select-none relative overflow-hidden"
        style={{
          fontFamily: config.fontFamily || 'Inter, sans-serif',
          background: '#0a0f1d',
          borderRadius: '0px',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.6)'
        }}
      >
        {/* Cover */}
        <div className="w-full aspect-square rounded-lg overflow-hidden border border-white/10 shadow-lg">
          <img src={image} alt="Capa" className="w-full h-full object-cover" />
        </div>

        {/* Artist with User Icon */}
        <div className="flex items-center gap-1.5 mt-3 text-slate-200">
          <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span className="font-bold text-sm tracking-wide truncate">{artist}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full mt-2">
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>

        {/* Music note and Marquee */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5 overflow-hidden">
          <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            {marqueeAnimation}
            <span className="inline-block font-semibold text-slate-100 text-xs tracking-wide" style={marqueeStyle}>
              {textRepeated}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. LATERAL
  if (layout === 'horizontal') {
    const textRepeated = `${title} • `.repeat(10);
    return (
      <div 
        className="w-full h-full flex items-center p-3 gap-4 select-none relative overflow-hidden"
        style={{
          fontFamily: config.fontFamily || 'Inter, sans-serif',
          background: '#0a0f1d',
          borderRadius: '0px',
          boxShadow: '0 0 15px rgba(168, 85, 247, 0.6)'
        }}
      >
        {/* Cover */}
        <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 shrink-0">
          <img src={image} alt="Capa" className="w-full h-full object-cover" />
        </div>

        {/* Text and progress */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
          {/* Music Name */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            <svg className="w-4 h-4 text-purple-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <div className="flex-1 overflow-hidden whitespace-nowrap">
              {marqueeAnimation}
              <span className="inline-block font-bold text-white text-sm" style={marqueeStyle}>
                {textRepeated}
              </span>
            </div>
          </div>

          {/* Artist Name */}
          <div className="flex items-center gap-1 mt-1 text-slate-300">
            <svg className="w-3.5 h-3.5 text-purple-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className="font-semibold text-xs truncate">{artist}</span>
          </div>

          {/* Purple Progress Bar */}
          <div className="w-full mt-2">
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. VINIL
  if (layout === 'vinil') {
    const textRepeated = `${title} • ${artist} • `.repeat(4);
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center p-3 select-none relative overflow-hidden"
        style={{
          fontFamily: config.fontFamily || 'Inter, sans-serif',
        }}
      >
        <style>{`
          @keyframes ln-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
        
        {/* Vinyl Base with Green Glow */}
        <div 
          className="relative w-44 h-44 rounded-full flex items-center justify-center bg-zinc-950 shadow-2xl border-4 border-zinc-800"
          style={{
            boxShadow: '0 0 25px rgba(34, 197, 94, 0.7)',
          }}
        >
          {/* Vinyl Grooves Effect */}
          <div className="absolute inset-2 rounded-full border border-zinc-800 opacity-40"></div>
          <div className="absolute inset-4 rounded-full border border-zinc-800 opacity-40"></div>
          <div className="absolute inset-6 rounded-full border border-zinc-800 opacity-40"></div>
          <div className="absolute inset-8 rounded-full border border-zinc-800 opacity-40"></div>
          <div className="absolute inset-10 rounded-full border border-zinc-900 opacity-60"></div>
          <div className="absolute inset-12 rounded-full border border-zinc-900 opacity-60"></div>

          {/* Rotating Text (Green Circular Marquee) */}
          <div className="absolute inset-1.5 animate-[ln-spin_20s_linear_infinite]">
            <svg viewBox="0 0 170 170" className="w-full h-full">
              <path 
                id="vinyl-text-path" 
                d="M 85, 85 m -72, 0 a 72,72 0 1,1 144,0 a 72,72 0 1,1 -144,0" 
                fill="none" 
              />
              <text fill="#22c55e" className="text-[10px] font-bold tracking-widest uppercase font-mono">
                <textPath href="#vinyl-text-path">
                  {textRepeated}
                </textPath>
              </text>
            </svg>
          </div>

          {/* Album Cover in Center (Rotating) */}
          <div className="absolute w-20 h-20 rounded-full bg-zinc-900 border-2 border-zinc-950 flex items-center justify-center overflow-hidden animate-[ln-spin_8s_linear_infinite]">
            <img src={image} alt="Cover" className="w-full h-full object-cover animate-[ln-spin_12s_linear_infinite]" />
          </div>

          {/* Center spindle hole */}
          <div className="absolute w-4 h-4 rounded-full bg-white border border-black shadow shadow-black"></div>
        </div>

        {/* Tonearm (Needle Arm) pointing from Top-Right */}
        <div className="absolute top-1 right-2 w-14 h-24 pointer-events-none drop-shadow-md origin-top" style={{ transform: 'rotate(5deg)' }}>
          <svg viewBox="0 0 60 100" className="w-full h-full">
            {/* Base mount */}
            <circle cx="45" cy="15" r="10" fill="#3f3f46" />
            <circle cx="45" cy="15" r="6" fill="#18181b" />
            {/* Tone arm line */}
            <path d="M 45,15 Q 25,45 20,75 L 18,85 L 12,87" stroke="#9ca3af" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Cartridge headshell */}
            <rect x="8" y="82" width="8" height="12" rx="1" transform="rotate(-15 12 88)" fill="#18181b" />
            <circle cx="12" cy="88" r="2" fill="#ef4444" />
          </svg>
        </div>
      </div>
    );
  }

  // 5. FAIXA (SÓ MARQUEE)
  if (layout === 'marquee') {
    const textRepeated = `${title} • `.repeat(15);
    return (
      <div 
        className="w-full h-full flex items-center p-3 select-none relative overflow-hidden"
        style={{
          fontFamily: config.fontFamily || 'Inter, sans-serif',
          background: '#090d16',
          borderRadius: '0px',
          boxShadow: '0 0 15px rgba(249, 115, 22, 0.6)'
        }}
      >
        <span className="text-orange-500 text-lg font-bold mr-3 shrink-0 flex items-center">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </span>
        <div className="flex-1 overflow-hidden whitespace-nowrap relative">
          {marqueeAnimation}
          <span className="inline-block font-bold text-white text-sm tracking-wide" style={marqueeStyle}>
            {textRepeated}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

const components = {
  'manual-death-counter': DeathCounter,
  'manual-clock': ClockWidget,
  'manual-timer': TimerWidget,
  'manual-now-playing': NowPlayingWidget
};

const labels = {
  'manual-death-counter': ['Placar de Mortes', 'Pílula Compacta', 'Terminal de Mortes', 'Neon Gamer', 'Minimal Claro'],
  'manual-clock': ['Relógio Digital', 'Fuso Compacto', 'Terminal Horário', 'Relógio Neon', 'Hora Minimal'],
  'manual-timer': ['Contagem Principal', 'Timer Compacto', 'Terminal Regressivo', 'Timer Neon', 'Tempo Minimal']
};

export const MANUAL_WIDGET_TEMPLATES = Object.fromEntries(Object.entries(components).map(([id, Component]) => {
  if (id === 'manual-now-playing') {
    return [id, [
      {
        id: '01', number: 1, name: '1. PADRÃO (FAIXA SUPERIOR)',
        description: 'Somente a faixa da música tocando em marquee contínuo', badge: 'Padrão', aspectRatio: '320x60',
        defaultWidth: 320, defaultHeight: 60,
        render: ({ config = {} }) => <Component config={{ ...config, layout: 'default' }} />
      },
      {
        id: '02', number: 2, name: '2. QUADRADO',
        description: 'Capa grande com artista, barra de progresso e música em marquee', badge: 'Quadrado', aspectRatio: '280x360',
        defaultWidth: 280, defaultHeight: 360,
        render: ({ config = {} }) => <Component config={{ ...config, layout: 'square' }} />
      },
      {
        id: '03', number: 3, name: '3. LATERAL',
        description: 'Capa à esquerda, música em cima e artista embaixo com barra de progresso', badge: 'Lateral', aspectRatio: '320x90',
        defaultWidth: 320, defaultHeight: 90,
        render: ({ config = {} }) => <Component config={{ ...config, layout: 'horizontal' }} />
      },
      {
        id: '04', number: 4, name: '4. VINIL',
        description: 'Disco de vinil giratório com a capa no centro e música em marquee circular', badge: 'Vinil', aspectRatio: '200x200',
        defaultWidth: 200, defaultHeight: 200,
        render: ({ config = {} }) => <Component config={{ ...config, layout: 'vinil' }} />
      },
      {
        id: '05', number: 5, name: '5. FAIXA (SÓ MARQUEE)',
        description: 'Somente a faixa da música tocando em marquee com brilho laranja', badge: 'Só Marquee', aspectRatio: '320x60',
        defaultWidth: 320, defaultHeight: 60,
        render: ({ config = {} }) => <Component config={{ ...config, layout: 'marquee' }} />
      }
    ]];
  }

  return [id,
    labels[id].map((name, index) => ({
      id: String(index + 1).padStart(2, '0'), number: index + 1, name,
      description: name, badge: name, aspectRatio: '320x120',
      defaultWidth: 320, defaultHeight: 120,
      render: ({ config = {} }) => <Component config={{ ...config, structuralPreset: String(index + 1).padStart(2, '0') }} />
    }))
  ];
}));
