import React, { useMemo } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { Sparkles, Trophy, Heart, Flame, Users, Award } from 'lucide-react';

// 1. TwitchLatestSub (Último Inscrito)
/**
 * @param {Object} props
 * @param {import('@dashboard/types/WidgetConfig').WidgetConfig} props.config
 */
export function TwitchLatestSub({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';

  const latestSub = useMemo(() => {
    if (!isOnline) return null;
    return (liveActivity?.items || [])
      .find(item => item.platform === 'Twitch' && (item.eventType === 'twitch_sub' || item.eventType === 'twitch_resub' || item.eventType === 'twitch_subgift'));
  }, [liveActivity, isOnline]);

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '12px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 select-none">
        <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0" />
        <span>Último Inscrito</span>
      </div>
      <div className="text-sm font-bold text-white truncate">
        {!isOnline 
          ? 'Live não conectada' 
          : latestSub 
          ? latestSub.author 
          : config.placeholder || 'Nenhum inscrito registrado'}
      </div>
      {isOnline && latestSub && latestSub.eventMeta?.months && (
        <div className="text-[10px] font-mono text-rose-300 mt-0.5">
          Inscrito por {latestSub.eventMeta.months} meses!
        </div>
      )}
    </div>
  );
}

// 2. TwitchLatestCheer (Último Cheer)
export function TwitchLatestCheer({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';

  const latestCheer = useMemo(() => {
    if (!isOnline) return null;
    return (liveActivity?.items || [])
      .find(item => item.platform === 'Twitch' && item.eventType === 'twitch_bits');
  }, [liveActivity, isOnline]);

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '12px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 select-none">
        <Flame className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
        <span>Último Cheer</span>
      </div>
      <div className="text-sm font-bold text-white truncate">
        {!isOnline 
          ? 'Live não conectada' 
          : latestCheer 
          ? latestCheer.author 
          : config.placeholder || 'Nenhum cheer enviado'}
      </div>
      {isOnline && latestCheer && latestCheer.eventMeta?.amount && (
        <div className="text-[10px] font-mono text-cyan-300 mt-0.5">
          Cheer de {latestCheer.eventMeta.amount} Bits!
        </div>
      )}
    </div>
  );
}

// 3. TwitchLatestRaid (Última Raid)
export function TwitchLatestRaid({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';

  const latestRaid = useMemo(() => {
    if (!isOnline) return null;
    return (liveActivity?.items || [])
      .find(item => item.platform === 'Twitch' && item.eventType === 'twitch_raid');
  }, [liveActivity, isOnline]);

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '12px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 select-none">
        <Users className="h-3.5 w-3.5 text-orange-400 shrink-0" />
        <span>Última Raid</span>
      </div>
      <div className="text-sm font-bold text-white truncate">
        {!isOnline 
          ? 'Live não conectada' 
          : latestRaid 
          ? latestRaid.author 
          : config.placeholder || 'Sem raids recentes'}
      </div>
      {isOnline && latestRaid && latestRaid.eventMeta?.viewers && (
        <div className="text-[10px] font-mono text-orange-300 mt-0.5">
          Trouxe {latestRaid.eventMeta.viewers} espectadores!
        </div>
      )}
    </div>
  );
}

// 4. TwitchTopCheer (Maior Cheer)
export function TwitchTopCheer({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';

  const topCheer = useMemo(() => {
    if (!isOnline) return null;
    const cheers = (liveActivity?.items || [])
      .filter(item => item.platform === 'Twitch' && item.eventType === 'twitch_bits');
    if (cheers.length === 0) return null;
    return cheers.reduce((max, curr) => (curr.eventMeta?.amount || 0) > (max.eventMeta?.amount || 0) ? curr : max, cheers[0]);
  }, [liveActivity, isOnline]);

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '12px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 select-none">
        <Trophy className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
        <span>Maior Cheer da Live</span>
      </div>
      <div className="text-sm font-bold text-white truncate">
        {!isOnline 
          ? 'Live não conectada' 
          : topCheer 
          ? topCheer.author 
          : config.placeholder || 'Nenhum cheer registrado'}
      </div>
      {isOnline && topCheer && topCheer.eventMeta?.amount && (
        <div className="text-[10px] font-mono text-yellow-300 mt-0.5">
          {topCheer.eventMeta.amount} Bits totais!
        </div>
      )}
    </div>
  );
}

// 5. TwitchSubCounter (Contador de Subs)
export function TwitchSubCounter({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';

  const count = useMemo(() => {
    if (!isOnline) return 0;
    const subs = (liveActivity?.items || [])
      .filter(item => item.platform === 'Twitch' && (item.eventType === 'twitch_sub' || item.eventType === 'twitch_resub' || item.eventType === 'twitch_subgift'));
    const start = config.startValue !== undefined && config.startValue !== '' && !isNaN(Number(config.startValue)) ? Number(config.startValue) : 0;
    return start + subs.length;
  }, [liveActivity, config.startValue, isOnline]);

  return (
    <div 
      className="w-full h-full p-4 flex items-center gap-3.5 text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '12px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
        <Award className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block select-none">
          Inscritos Ativos
        </div>
        <div className="text-lg font-black text-white leading-none mt-1 font-mono">
          {!isOnline ? 'Live não conectada' : count}
        </div>
      </div>
    </div>
  );
}

// 6. TwitchBitsCounter (Contador de Bits)
export function TwitchBitsCounter({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';

  const totalBits = useMemo(() => {
    if (!isOnline) return 0;
    const bits = (liveActivity?.items || [])
      .filter(item => item.platform === 'Twitch' && item.eventType === 'twitch_bits')
      .reduce((sum, item) => sum + (item.eventMeta?.amount || 0), 0);
    const start = config.startValue !== undefined && config.startValue !== '' && !isNaN(Number(config.startValue)) ? Number(config.startValue) : 0;
    return start + bits;
  }, [liveActivity, config.startValue, isOnline]);

  return (
    <div 
      className="w-full h-full p-4 flex items-center gap-3.5 text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '12px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block select-none">
          Total de Bits
        </div>
        <div className="text-lg font-black text-white leading-none mt-1 font-mono">
          {!isOnline ? 'Live não conectada' : totalBits}
        </div>
      </div>
    </div>
  );
}
