import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { platformIsOnline, platformMessages, platformViewers, selectedPlatforms, visibleChatText } from '@dashboard/overlays/Overlay_platformData';
import { Activity, Flame, Smile, TrendingUp } from 'lucide-react';

// 1. TwitchChatSpeed (Velocímetro de Chat)
export function TwitchChatSpeed({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = platformIsOnline(connections, config);
  const [mPM, setMPM] = useState(0); // Messages Per Minute

  useEffect(() => {
    if (!isOnline) {
      setMPM(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const messages = platformMessages(liveActivity, config);
      
      // Filter messages received in the last 60 seconds (or rolling window)
      const recent = messages.filter(item => {
        if (!item.timestamp && !item.receivedAt) return true;
        return (now - new Date(item.timestamp || item.receivedAt).getTime()) <= 60000;
      });

      setMPM(recent.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [liveActivity, isOnline, config.platform, config.platforms]);

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="flex justify-between items-center mb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 select-none">
        <span className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span>Velocidade do Chat</span>
        </span>
        <span className="text-emerald-400 font-bold">
          {!isOnline ? 'Live não conectada' : `${mPM} Msg/Min`}
        </span>
      </div>

      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
          style={{ width: `${isOnline ? Math.min((mPM / 60) * 100, 100) : 0}%` }}
        />
      </div>
    </div>
  );
}

// 2. TwitchHypeMeter (Medidor de Hype)
export function TwitchHypeMeter({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';
  const [hypeLevel, setHypeLevel] = useState(0); // percentage 0-100

  useEffect(() => {
    if (!isOnline) {
      setHypeLevel(0);
      return;
    }

    // Calculate real hype strictly based on events and message activity
    const recentItems = (liveActivity?.items || []).slice(0, 20);
    if (recentItems.length === 0) {
      setHypeLevel(0);
      return;
    }

    const eventCount = recentItems.filter(item => item.eventType).length;
    const computedHype = Math.min((eventCount * 25) + (recentItems.length * 3), 100);
    setHypeLevel(Math.round(computedHype));
  }, [liveActivity, isOnline]);

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="flex justify-between items-center mb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 select-none">
        <span className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-400 animate-bounce" />
          <span>Hypeômetro</span>
        </span>
        <span className="text-orange-400 font-bold">
          {!isOnline ? 'Live não conectada' : `${hypeLevel}% Hype`}
        </span>
      </div>

      <div className="w-full h-3.5 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
        <div 
          className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-rose-600 rounded-full transition-all duration-1000 relative"
          style={{ width: `${isOnline ? hypeLevel : 0}%` }}
        >
          {isOnline && hypeLevel > 0 && (
            <div className="absolute top-0 bottom-0 right-0 w-2 bg-white/40 rounded-full animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

// 3. TwitchChatVibe (Termômetro de Vibe)
export function TwitchChatVibe({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = platformIsOnline(connections, config);

  const vibeResult = useMemo(() => {
    if (!isOnline) return { score: null, label: 'Live não conectada' };

    const messages = platformMessages(liveActivity, config)
      .slice(0, 30);

    if (messages.length === 0) return { score: null, label: 'Aguardando mensagens' };

    let score = 50;
    const positiveWords = ['lfg', 'hype', 'gg', 'uau', 'boa', 'top', 'incrível', 'amei', 'obrigado', 'valeu', 'nice', 'love', '❤️', '🔥', '😆', '👏'];
    const negativeWords = ['ruim', 'chato', 'drop', 'lag', 'bosta', 'droga', 'odeio', 'f', 'rip', 'triste', 'chateado', '😢', '😡', '👎'];

    messages.forEach(msg => {
      const textLower = visibleChatText(msg).toLowerCase();
      positiveWords.forEach(w => { if (textLower.includes(w)) score += 5; });
      negativeWords.forEach(w => { if (textLower.includes(w)) score -= 5; });
    });

    const clamped = Math.max(0, Math.min(100, score));
    let label = 'Tranquilo ☕';
    if (clamped >= 80) label = 'VIBE ABSOLUTA 🔥';
    else if (clamped >= 60) label = 'Positiva 😊';
    else if (clamped <= 35) label = 'Tenso ⛈️';

    return { score: clamped, label };
  }, [liveActivity, isOnline, config.platform, config.platforms]);

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="flex justify-between items-center mb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 select-none">
        <span className="flex items-center gap-1.5">
          <Smile className="h-3.5 w-3.5 text-pink-400" />
          <span>Vibe do Chat</span>
        </span>
        <span className="text-pink-400 font-bold">{vibeResult.label}</span>
      </div>

      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
        <div 
          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-pink-500 rounded-full transition-all duration-1000"
          style={{ width: `${vibeResult.score !== null ? vibeResult.score : 0}%` }}
        />
      </div>
    </div>
  );
}

// 4. TwitchViewersChart (Gráfico de Espectadores)
export function TwitchViewersChart({ config = {} }) {
  const { connections } = useStreaming();
  const isOnline = platformIsOnline(connections, config);
  const currentViewers = platformViewers(connections, config, { aggregate: false });
  const audienceSource = selectedPlatforms(config).find(platform =>
    connections?.[platform]?.status === 'connected' && Number.isFinite(connections[platform].viewers)
  ) || null;
  const [history, setHistory] = useState([]);
  const historySource = useRef(null);

  useEffect(() => {
    if (!isOnline || currentViewers === null) {
      setHistory([]);
      historySource.current = null;
      return;
    }

    // Collect real viewers count periodically
    if (historySource.current !== audienceSource) {
      historySource.current = audienceSource;
      setHistory([currentViewers]);
    } else {
      setHistory(prev => [...prev.slice(-14), currentViewers]);
    }

    const interval = setInterval(() => {
      setHistory(prev => [...prev.slice(-14), currentViewers]);
    }, 15000);

    return () => clearInterval(interval);
  }, [currentViewers, isOnline, audienceSource]);

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="flex justify-between items-center mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 select-none">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
          <span>Audiência Recente</span>
        </span>
        <span className="text-indigo-400 font-bold font-mono">
          {!isOnline 
            ? 'Live não conectada' 
            : currentViewers !== null 
            ? `${currentViewers} Espectadores` 
            : 'Aguardando dados'}
        </span>
      </div>

      {/* Mini Bar Sparkline with real sampled points */}
      <div className="flex items-end justify-between gap-1 h-12 pt-2">
        {!isOnline || history.length === 0 ? (
          <div className="w-full text-center text-[10px] text-slate-500 font-mono italic flex items-center justify-center h-full">
            {!isOnline ? 'Live offline' : 'Aguardando histórico...'}
          </div>
        ) : (
          history.map((val, idx) => {
            const maxVal = Math.max(...history, 1);
            const heightPct = Math.max(Math.round((val / maxVal) * 100), 10);
            return (
              <div 
                key={idx}
                className="w-full bg-indigo-500/40 border border-indigo-500/20 rounded-t hover:bg-indigo-500 transition-all duration-300"
                style={{ height: `${heightPct}%` }}
                title={`${val} viewers`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
