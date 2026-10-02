import React, { useMemo } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { Award, Flame, Zap } from 'lucide-react';

// 1. TwitchSubGoal (Meta de Subs)
export function TwitchSubGoal({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';

  const subCount = useMemo(() => {
    if (!isOnline) return 0;
    const subs = (liveActivity?.items || [])
      .filter(item => item.platform === 'Twitch' && (item.eventType === 'twitch_sub' || item.eventType === 'twitch_resub' || item.eventType === 'twitch_subgift'));
    const start = config.startValue !== undefined && config.startValue !== '' && !isNaN(Number(config.startValue)) ? Number(config.startValue) : 0;
    return start + subs.length;
  }, [liveActivity, config.startValue, isOnline]);

  const targetValue = config.targetValue && Number(config.targetValue) > 0 ? Number(config.targetValue) : 50;
  const percentage = targetValue > 0 ? Math.min(Math.round((subCount / targetValue) * 100), 100) : 0;

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '12px',
        border: config.showBorder ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-white">
        <span className="flex items-center gap-1">
          <Award className="h-4.5 w-4.5 text-purple-400" />
          <span>Meta de Inscritos</span>
        </span>
        <span className="text-purple-400 font-mono">
          {!isOnline ? 'Live não conectada' : `${subCount} / ${targetValue}`}
        </span>
      </div>
      
      {/* Progress Bar Container */}
      <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
        <div 
          className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500 relative"
          style={{ width: `${percentage}%` }}
        >
          {isOnline && percentage > 0 && (
            <span className="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-mono font-bold text-white">
              {percentage}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// 2. TwitchBitsGoal (Meta de Bits)
export function TwitchBitsGoal({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';

  const currentBits = useMemo(() => {
    if (!isOnline) return 0;
    const bitEvents = (liveActivity?.items || [])
      .filter(item => item.platform === 'Twitch' && item.eventType === 'twitch_bits');
    const gathered = bitEvents.reduce((acc, curr) => acc + (curr.eventMeta?.amount || 0), 0);
    const start = config.startValue !== undefined && config.startValue !== '' && !isNaN(Number(config.startValue)) ? Number(config.startValue) : 0;
    return start + gathered;
  }, [liveActivity, config.startValue, isOnline]);

  const targetValue = config.targetValue && Number(config.targetValue) > 0 ? Number(config.targetValue) : 2500;
  const percentage = targetValue > 0 ? Math.min(Math.round((currentBits / targetValue) * 100), 100) : 0;

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '12px',
        border: config.showBorder ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-white">
        <span className="flex items-center gap-1">
          <Flame className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
          <span>Meta de Bits</span>
        </span>
        <span className="text-cyan-400 font-mono">
          {!isOnline ? 'Live não conectada' : `${currentBits} / ${targetValue}`}
        </span>
      </div>

      <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
        <div 
          className="h-full bg-gradient-to-r from-cyan-600 to-teal-500 rounded-full transition-all duration-500 relative"
          style={{ width: `${percentage}%` }}
        >
          {isOnline && percentage > 0 && (
            <span className="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-mono font-bold text-white">
              {percentage}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. TwitchRaidGoal (Meta de Raids)
export function TwitchRaidGoal({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';

  const currentRaids = useMemo(() => {
    if (!isOnline) return 0;
    const raidEvents = (liveActivity?.items || [])
      .filter(item => item.platform === 'Twitch' && item.eventType === 'twitch_raid');
    const start = config.startValue !== undefined && config.startValue !== '' && !isNaN(Number(config.startValue)) ? Number(config.startValue) : 0;
    return start + raidEvents.length;
  }, [liveActivity, config.startValue, isOnline]);

  const targetValue = config.targetValue && Number(config.targetValue) > 0 ? Number(config.targetValue) : 5;
  const percentage = targetValue > 0 ? Math.min(Math.round((currentRaids / targetValue) * 100), 100) : 0;

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '12px',
        border: config.showBorder ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-white">
        <span className="flex items-center gap-1">
          <Zap className="h-4.5 w-4.5 text-orange-400" />
          <span>Meta de Raids</span>
        </span>
        <span className="text-orange-400 font-mono">
          {!isOnline ? 'Live não conectada' : `${currentRaids} / ${targetValue}`}
        </span>
      </div>

      <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
        <div 
          className="h-full bg-gradient-to-r from-orange-600 to-red-500 rounded-full transition-all duration-500 relative"
          style={{ width: `${percentage}%` }}
        >
          {isOnline && percentage > 0 && (
            <span className="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-mono font-bold text-white">
              {percentage}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
