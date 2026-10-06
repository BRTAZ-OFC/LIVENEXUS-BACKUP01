import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw } from 'lucide-react';
import { getStoredActiveReactVideo } from '../Scenario_reactVideoService';

export default function BrowserSourceRenderer({ config = {}, isEditing = false }) {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReactVideo, setActiveReactVideo] = useState(() => getStoredActiveReactVideo());

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'scenario_react_active_video') {
        try {
          setActiveReactVideo(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    let channel = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('scenario_react_bus');
        channel.onmessage = (event) => {
          if (event.data?.type === 'ACTIVE_VIDEO_CHANGED') {
            setActiveReactVideo(event.data.payload || null);
          }
        };
      }
    } catch {}
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, []);

  const rawUrl = (config.url ? String(config.url).trim() : '') || (activeReactVideo?.parsed?.embedUrl || '');
  let finalUrl = '';
  if (rawUrl) {
    if (!/^https?:\/\//i.test(rawUrl)) {
      finalUrl = 'https://' + rawUrl;
    } else {
      finalUrl = rawUrl;
    }
  }

  const customCss = config.customCss || '';
  const borderRadius = config.borderRadius ? (typeof config.borderRadius === 'number' ? `${config.borderRadius}px` : config.borderRadius) : '8px';
  const showBorder = config.showBorder === true;
  const borderColor = config.borderColor || 'rgba(59, 130, 246, 0.4)';
  const borderWidth = config.borderWidth ? `${config.borderWidth}px` : '2px';
  const pointerEvents = config.allowInteraction ? 'auto' : 'none';

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-slate-950 flex flex-col select-none"
      style={{
        borderRadius,
        border: showBorder ? `${borderWidth} solid ${borderColor}` : 'none',
      }}
    >
      {/* If URL is empty, show welcoming prompt */}
      {!finalUrl ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400 bg-slate-900/60">
          <Globe className="w-8 h-8 mb-2 text-cyan-400 opacity-80" />
          <div className="text-xs font-bold font-mono text-white tracking-wide">
            BROWSER SOURCE
          </div>
          <div className="text-[10px] text-slate-400 mt-1 max-w-[240px]">
            Insira a URL na aba <strong>Config</strong> para exibir a página web ou widget externo.
          </div>
        </div>
      ) : (
        <div className="w-full h-full relative">
          <iframe
            key={iframeKey}
            src={finalUrl}
            title={config.title || 'Browser Source'}
            className="w-full h-full border-0 bg-transparent"
            style={{
              pointerEvents: isEditing ? (config.allowInteraction ? 'auto' : 'none') : 'auto',
            }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; camera"
            onLoad={() => setIsLoading(false)}
          />

          {/* Quick reload button if editing */}
          {isEditing && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLoading(true);
                  setIframeKey(k => k + 1);
                }}
                className="p-1 rounded bg-black/70 hover:bg-black/90 text-cyan-300 border border-white/10 transition-all cursor-pointer"
                title="Recarregar página"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          )}

          {isEditing && (
            <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-300 pointer-events-none flex items-center gap-1">
              <Globe size={10} />
              <span className="truncate max-w-[140px]">{finalUrl.replace(/^https?:\/\//i, '')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
