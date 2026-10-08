import React, { useRef } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { Twitch, Youtube, Users } from 'lucide-react';

const KickIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Kick">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7.5V7H9v3.5l2.5-3.5H13l-3 4 3.5 6h-1.8L9 12v5zm7.5 0h-2V7h2v10z" />
  </svg>
);

const PLATFORM_CONFIGS = [
  {
    id: 'Twitch',
    name: 'Twitch',
    icon: (props) => <Twitch {...props} />,
    badgeBg: 'bg-purple-950/40',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-[#a970ff]',
  },
  {
    id: 'Kick',
    name: 'Kick',
    icon: (props) => <KickIcon {...props} />,
    badgeBg: 'bg-emerald-950/40',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-[#53fc18]',
  },
  {
    id: 'YouTube',
    name: 'YouTube',
    icon: (props) => <Youtube {...props} />,
    badgeBg: 'bg-red-950/40',
    borderColor: 'border-red-500/30',
    iconColor: 'text-[#ff0000]',
  },
];

export default function MultiViewersCounter({ config = {}, elementKey = 'full_widget' }) {
  const { connections } = useStreaming();
  const prevViewersRef = useRef({ Twitch: null, Kick: null, YouTube: null });

  const showTotal = config.showTotal !== false;
  const showTwitch = config.showTwitch !== false;
  const showKick = config.showKick !== false;
  const showYouTube = config.showYouTube !== false;

  const activePlatforms = PLATFORM_CONFIGS.filter((plat) => {
    if (plat.id === 'Twitch') return showTwitch;
    if (plat.id === 'Kick') return showKick;
    if (plat.id === 'YouTube') return showYouTube;
    return false;
  });

  let totalActiveViewers = 0;
  const platformTrends = {};

  activePlatforms.forEach((plat) => {
    const conn = connections?.[plat.id] || {};
    const isConnected = conn.status === 'connected';
    const viewers = conn.viewers;
    const hasViewers = isConnected && Number.isFinite(viewers);

    if (hasViewers) {
      totalActiveViewers += viewers;
    }

    const prev = prevViewersRef.current[plat.id];
    let trend = null;

    if (hasViewers) {
      if (prev !== null && prev !== undefined && Number.isFinite(prev)) {
        if (viewers > prev) trend = 'up';
        else if (viewers < prev) trend = 'down';
        else trend = 'stable';
      }
      prevViewersRef.current[plat.id] = viewers;
    } else {
      prevViewersRef.current[plat.id] = null;
    }

    platformTrends[plat.id] = trend;
  });

  const totalColumns = (showTotal ? 1 : 0) + activePlatforms.length;
  const gridColsClass =
    totalColumns === 4
      ? 'grid-cols-4'
      : totalColumns === 3
      ? 'grid-cols-3'
      : totalColumns === 2
      ? 'grid-cols-2'
      : 'grid-cols-1';

  const containerStyle = {
    backgroundColor: config.backgroundColor || 'rgba(0, 0, 0, 0.65)',
    borderRadius: config.borderRadius || '12px',
    fontFamily: config.fontFamily || 'Inter, sans-serif',
  };

  return (
    <div
      style={containerStyle}
      className="w-full h-full p-2 sm:p-2.5 flex items-center justify-between gap-1.5 overflow-hidden select-none backdrop-blur-md"
    >
      <div className={`grid ${gridColsClass} gap-1.5 w-full h-full items-center`}>
        {showTotal && (
          <div className="flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg border bg-violet-950/40 border-violet-500/30">
            <div className="flex items-center gap-1.5 min-w-0">
              <Users className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <span className="font-bold text-[11px] text-violet-200 uppercase tracking-wider truncate">
                Total
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-white tabular-nums tracking-wide">
              {totalActiveViewers.toLocaleString('pt-BR')}
            </span>
          </div>
        )}

        {activePlatforms.map((plat) => {
          const conn = connections?.[plat.id] || {};
          const isConnected = conn.status === 'connected';
          const viewers = conn.viewers;
          const hasViewers = isConnected && Number.isFinite(viewers);
          const trend = platformTrends[plat.id];

          const formattedViewers = isConnected ? (hasViewers ? viewers.toLocaleString('pt-BR') : '0') : 'OFFLINE';
          const IconComponent = plat.icon;

          return (
            <div
              key={plat.id}
              className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg border transition-all ${
                isConnected ? `${plat.badgeBg} ${plat.borderColor}` : 'bg-black/30 border-white/5 opacity-70'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`shrink-0 ${plat.iconColor}`}>
                  <IconComponent className="h-3.5 w-3.5" />
                </span>
                <span className="font-semibold text-xs text-white truncate hidden xs:inline sm:inline">
                  {plat.name}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isConnected && trend === 'up' && (
                  <span className="text-emerald-400 font-bold text-xs" title="Aumentou">
                    ↑
                  </span>
                )}
                {isConnected && trend === 'down' && (
                  <span className="text-rose-400 font-bold text-xs" title="Diminuiu">
                    ↓
                  </span>
                )}
                {isConnected && trend === 'stable' && (
                  <span className="text-slate-400 text-[10px]" title="Estável">
                    =
                  </span>
                )}

                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    isConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]' : 'bg-slate-600'
                  }`}
                />
                <span
                  className={`font-mono text-xs font-bold tabular-nums tracking-wide ${
                    isConnected ? 'text-white' : 'text-slate-500 text-[10px]'
                  }`}
                >
                  {formattedViewers}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
