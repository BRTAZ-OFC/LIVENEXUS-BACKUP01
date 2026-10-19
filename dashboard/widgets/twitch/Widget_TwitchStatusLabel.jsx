import React from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { Users, Gamepad2 } from 'lucide-react';
import { TextMarquee } from '@dashboard/overlays/Overlay_textMarquee';
import { platformIsOnline, platformMeta, platformViewers } from '@dashboard/overlays/Overlay_platformData';

/**
 * @param {Object} props
 * @param {import('@dashboard/types/WidgetConfig').WidgetConfig} props.config
 */
export default function TwitchStatusLabel({ config = {} }) {
  const { connections, streamMeta } = useStreaming();

  const isOnline = platformIsOnline(connections, config);
  const viewersCount = platformViewers(connections, config, { aggregate: true });
  const hasViewers = viewersCount !== null;

  // Stream Metadata
  const streamTitle = platformMeta(streamMeta, connections, config, 'title').title || (isOnline ? 'Aguardando título...' : 'Live offline');
  const streamGame = platformMeta(streamMeta, connections, config, 'game').game || (isOnline ? 'Geral' : '');

  const style = {
    fontSize: config.fontSize || '13px',
    color: config.textColor || '#ffffff',
    fontFamily: config.fontFamily || 'Inter, sans-serif',
  };

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left transition-all"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
      }}
    >
      <div className="space-y-2" style={style}>
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full shrink-0 ${isOnline ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
            {isOnline ? 'Ao Vivo' : 'Live offline'}
          </span>
        </div>

        {/* Stream Title */}
        <TextMarquee 
          text={streamTitle} 
          className="text-xs font-semibold text-white max-w-full"
        />

        {/* Viewers & Game */}
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-slate-400" />
            <span>
              {!isOnline
                ? 'Live não conectada'
                : hasViewers
                ? `${viewersCount} espectador${viewersCount !== 1 ? 'es' : ''}`
                : 'Aguardando dados'}
            </span>
          </div>
          {streamGame ? (
            <div className="flex items-center gap-1 truncate max-w-[120px]">
              <Gamepad2 className="h-3 w-3 text-slate-400" />
              <span className="truncate">{streamGame}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
