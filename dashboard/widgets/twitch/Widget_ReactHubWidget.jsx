import React, { useState, useEffect, useMemo, useLayoutEffect, useRef } from 'react';
import TwitchChatBox from './Widget_TwitchChatBox';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import {
  getStoredReactQueue,
  getStoredActiveReactVideo,
  syncVideosFromChatMessages
} from '../../cenarios/Scenario_reactVideoService';
import { 
  MessageSquare, Film, SplitSquareVertical, 
  CheckCircle2, Radio
} from 'lucide-react';

export default function ReactHubWidget({ config = {} }) {
  const { liveActivity } = useStreaming();

  const [queue, setQueue] = useState(() => getStoredReactQueue());
  const [activeVideo, setActiveVideo] = useState(() => getStoredActiveReactVideo());
  
  const containerRef = useRef(null);

  // Sync queue and active video with BroadcastChannel and storage events
  useEffect(() => {
    let channel = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('scenario_react_bus');
        channel.onmessage = (event) => {
          if (event.data?.type === 'QUEUE_UPDATED') {
            setQueue(event.data.payload || []);
          } else if (event.data?.type === 'ACTIVE_VIDEO_CHANGED') {
            setActiveVideo(event.data.payload || null);
          }
        };
      }
    } catch {
      // ignore
    }

    const handleStorage = (e) => {
      if (e.key === 'scenario_react_queue') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          setQueue(Array.isArray(parsed) ? parsed : []);
        } catch {
          // ignore
        }
      } else if (e.key === 'scenario_react_active_video') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          setActiveVideo(parsed);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    const interval = setInterval(() => {
      setQueue(getStoredReactQueue());
      setActiveVideo(getStoredActiveReactVideo());
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
      if (channel) {
        try { channel.close(); } catch { /* ignore */ }
      }
    };
  }, []);

  // Automatically monitor live chat messages for YouTube video links
  useEffect(() => {
    if (liveActivity?.items && liveActivity.items.length > 0) {
      syncVideosFromChatMessages(liveActivity.items);
      setQueue(getStoredReactQueue());
    }
  }, [liveActivity?.items]);

  const queueKey = useMemo(() => {
    return queue.map(q => q.id).join(',');
  }, [queue]);

  // Adjust visibility of elements based on container bounds directly in DOM to avoid state update loops
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Create a ResizeObserver to trigger visibility adjustments on layout resize
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        adjustVisibleItems();
      });
    });
    observer.observe(container);

    function adjustVisibleItems() {
      const containerHeight = container.clientHeight;
      if (containerHeight <= 0) return;

      const children = Array.from(container.children);
      if (children.length === 0) return;

      // First, restore display of all children to measure them properly
      children.forEach(child => {
        child.style.display = 'flex';
      });

      let totalHeight = 0;
      const gap = 6; // space-y-1.5 (1.5 * 4px = 6px)
      let fitCount = 0;
      let hasOverflowed = false;

      // Newest videos are at the start of the queue (rendered at index 0).
      // We prioritize showing the newest videos and hide the older ones that don't fit.
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (hasOverflowed) {
          child.style.display = 'none';
          continue;
        }

        const childHeight = child.offsetHeight;
        const neededSpace = childHeight + (fitCount > 0 ? gap : 0);

        if (totalHeight + neededSpace <= containerHeight) {
          totalHeight += neededSpace;
          fitCount++;
        } else {
          hasOverflowed = true;
          child.style.display = 'none';
        }
      }
    }

    adjustVisibleItems();

    return () => {
      observer.disconnect();
    };
  }, [queue, queueKey]);

  const pendingCount = useMemo(() => {
    return queue.filter(item => item.status === 'pending').length;
  }, [queue]);

  const borderRadius = config.borderRadius || '12px';
  const backgroundColor = config.backgroundColor || 'rgba(15, 23, 42, 0.9)';

  return (
    <div
      style={{
        borderRadius,
        background: backgroundColor,
        border: config.showBorder ? '1px solid rgba(59, 130, 246, 0.3)' : 'none',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
      className="w-full h-full flex flex-col overflow-hidden text-slate-100 shadow-2xl select-none"
    >
      {/* Top Header - Tabs/Buttons Removed */}
      <div className="p-2 border-b border-white/10 bg-slate-900/80 flex items-center justify-between gap-1.5 shrink-0 select-none">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <SplitSquareVertical className="w-3.5 h-3.5 text-blue-500" />
          <span>React Hub</span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">React Hub</span>
        </div>
      </div>

      {/* Main Content Area - Split view is permanently active */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Half: Twitch Chat */}
        <div className="h-[48%] border-b border-white/10 overflow-hidden flex flex-col">
          <div className="px-2.5 py-1 bg-slate-900/60 text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 select-none">
            <MessageSquare className="w-3 h-3 text-purple-400" />
            <span>Chat da Transmissão</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <TwitchChatBox config={{ ...config, backgroundColor: 'transparent', showBorder: false }} />
          </div>
        </div>

        {/* Bottom Half: User-submitted Videos Area */}
        <div className="flex-1 overflow-hidden flex flex-col p-2 space-y-1.5">
          <div className="flex items-center justify-between px-0.5 select-none shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vídeos da Fila</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-600 text-white font-extrabold">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {queue.length} {queue.length === 1 ? 'vídeo' : 'vídeos'}
            </span>
          </div>

          {renderVideoQueueList()}
        </div>
      </div>
    </div>
  );

  // Sub-component: List of user-submitted video links for the stream view
  function renderVideoQueueList() {
    return (
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden space-y-1.5 pr-1 scrollbar-none relative h-full"
      >
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-1.5">
            <Film className="w-8 h-8 text-slate-600 stroke-[1.5]" />
            <p className="text-xs font-medium text-slate-400">
              Nenhum vídeo enviado ainda.
            </p>
            <p className="text-[11px] text-slate-500 max-w-[240px]">
              Envie links do YouTube pelo painel Config ou envie no chat da transmissão.
            </p>
          </div>
        ) : (
          queue.map((item) => {
            const isPlaying = activeVideo && activeVideo.id === item.id;
            const isWatched = item.status === 'watched';

            return (
              <div
                key={item.id}
                className={`p-2 rounded-lg border transition-all text-left flex flex-col gap-1 shrink-0 w-full min-w-0 overflow-hidden ${
                  isPlaying
                    ? 'bg-blue-950/80 border-blue-500/80 shadow-md shadow-blue-950/50 ring-1 ring-blue-500/40'
                    : isWatched
                    ? 'bg-slate-900/40 border-white/5 opacity-60'
                    : 'bg-slate-900/80 border-slate-700/60'
                }`}
              >
                {/* Top line: Author & Platform badge */}
                <div className="flex items-center justify-between gap-1 w-full min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    <span
                      style={{ backgroundColor: item.parsed?.badgeColor || '#ef4444' }}
                      className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white uppercase shrink-0"
                    >
                      {item.parsed?.platform || 'YouTube'}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate whitespace-nowrap">
                      {item.author}
                    </span>
                    {item.source === 'chat' && (
                      <span className="text-[9px] px-1 bg-purple-900/60 text-purple-300 rounded font-mono shrink-0">
                        chat
                      </span>
                    )}
                  </div>

                  {/* Status indicator */}
                  <div className="shrink-0">
                    {isPlaying && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30 animate-pulse">
                        <Radio className="w-2.5 h-2.5" /> NO AR
                      </span>
                    )}
                    {isWatched && !isPlaying && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Assistido
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle line: URL / Title - GUARANTEED SINGLE LINE WITH ELLIPSIS (...) */}
                <div 
                  className="text-[11px] text-slate-300 font-mono truncate block whitespace-nowrap overflow-hidden text-ellipsis w-full min-w-0"
                  title={item.title || item.url}
                >
                  {item.title || item.url}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }
}
