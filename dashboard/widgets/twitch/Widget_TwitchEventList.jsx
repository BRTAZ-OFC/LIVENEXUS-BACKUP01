import React, { useMemo } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { platformEvents, platformIsOnline, eventLabel, eventDetails, genericEventAllowed, selectedPlatforms } from '@dashboard/overlays/Overlay_platformData';
import { Sparkles, Trophy, Heart, Flame } from 'lucide-react';

export default function TwitchEventList({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = platformIsOnline(connections, config);

  const events = useMemo(() => {
    return platformEvents(liveActivity, config)
      .filter(genericEventAllowed)
      .slice(0, 3) // show maximum of 3 events
      .reverse();  // chronological order (oldest at top, newest at bottom)
  }, [liveActivity, config.platform, config.platforms]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'twitch_sub': return <Heart className="h-3.5 w-3.5 text-rose-400" />;
      case 'twitch_resub': return <Trophy className="h-3.5 w-3.5 text-yellow-400" />;
      case 'twitch_subgift': return <Sparkles className="h-3.5 w-3.5 text-purple-400" />;
      case 'twitch_bits': return <Flame className="h-3.5 w-3.5 text-cyan-400" />;
      case 'twitch_raid': return <Flame className="h-3.5 w-3.5 text-orange-400" />;
      default: return <Sparkles className="h-3.5 w-3.5 text-indigo-400" />;
    }
  };

  const getEventLabel = (item) => {
    if (item.platform !== 'Twitch') return `${item.platform} · ${eventLabel(item)}${item.author ? ` · ${item.author}` : ''}${eventDetails(item) ? ` · ${eventDetails(item)}` : ''}`;
    const { eventType, eventMeta, author } = item;
    switch (eventType) {
      case 'twitch_sub': return `${author} se inscreveu`;
      case 'twitch_resub': return `${author} resub (${eventMeta?.months || 1}m)`;
      case 'twitch_subgift': 
        return eventMeta?.isMysteryGift 
          ? `${author} deu ${eventMeta.count} Subs` 
          : `${author} deu Sub para ${eventMeta?.recipient || 'alguém'}`;
      case 'twitch_bits': return `${author} enviou ${eventMeta?.amount || 0} Bits`;
      case 'twitch_raid': return `${author} Raid com ${eventMeta?.viewers || 0}`;
      default: return `${author} interagiu`;
    }
  };

  return (
    <div 
      className="w-full h-full p-3.5 flex flex-col justify-start overflow-hidden text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/10 pb-1.5 mb-2 flex items-center justify-between select-none">
        <span>Eventos Recentes</span>
        <span className="text-[9px] text-purple-400">{selectedPlatforms(config).join(' + ') || 'Sem origens'}</span>
      </div>

      <div className="space-y-1.5 overflow-y-auto max-h-full flex-1">
        {events.length === 0 ? (
          <div className="text-xs text-slate-500 font-mono italic text-center py-6">
            {!isOnline ? 'Live não conectada' : 'Nenhum evento registrado'}
          </div>
        ) : (
          events.map(ev => (
            <div 
              key={ev.id} 
              className="flex items-center gap-2 py-1 text-xs text-slate-200 border-b border-white/5 last:border-0 animate-fade-in-up"
            >
              <div className="shrink-0 p-1 bg-black/40 rounded-lg">
                {getEventIcon(ev.eventType)}
              </div>
              <span className={`font-medium min-w-0 flex-1 ${ev.platform === 'YouTube' ? 'break-words' : 'truncate'}`}>
                {getEventLabel(ev)}
              </span>
              <span className="text-[9px] font-mono text-slate-500 shrink-0 select-none">
                {ev.time || 'agora'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
