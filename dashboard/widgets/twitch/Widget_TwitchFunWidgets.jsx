import React, { useMemo, useState, useEffect } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { platformIsOnline, platformMessages, visibleChatText } from '@dashboard/overlays/Overlay_platformData';
import { Sparkles, MessageSquare } from 'lucide-react';

// 1. TwitchWordCloud (Nuvem de Palavras)
export function TwitchWordCloud({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = platformIsOnline(connections, config);

  const words = useMemo(() => {
    if (!isOnline) return [];
    const messages = platformMessages(liveActivity, config)
      .slice(0, 50);

    const freq = {};
    const blacklist = ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'na', 'no', 'uma', 'os', 'as', 'se', 'ao', 'por', 'mais', 'como', 'me', 'por', 'esta', 'este', 'isso', 'aquilo', 'ele', 'ela'];

    messages.forEach(msg => {
      const parts = visibleChatText(msg).toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').split(/\s+/);
      parts.forEach(p => {
        if (p.length > 2 && !blacklist.includes(p)) {
          freq[p] = (freq[p] || 0) + 1;
        }
      });
    });

    const list = Object.keys(freq).map(word => ({
      word,
      count: freq[word]
    }));

    list.sort((a, b) => b.count - a.count);
    return list.slice(0, 6); // Top 6 words to show
  }, [liveActivity, isOnline, config.platform, config.platforms]);

  const sizes = ['text-sm font-bold text-white', 'text-xs text-indigo-200', 'text-[11px] text-purple-300', 'text-[10px] text-pink-400', 'text-[9px] text-slate-300', 'text-[8px] text-slate-400'];

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-start text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 border-b border-white/5 pb-1 flex items-center gap-1.5 select-none">
        <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
        <span>Nuvem de Palavras do Chat</span>
      </div>

      <div className="flex-1 flex flex-wrap gap-2 items-center justify-center py-2 overflow-hidden">
        {!isOnline ? (
          <div className="text-[10px] text-slate-500 font-mono italic text-center">
            Live não conectada
          </div>
        ) : words.length === 0 ? (
          <div className="text-[10px] text-slate-500 font-mono italic text-center">
            Aguardando mensagens...
          </div>
        ) : (
          words.map((item, idx) => (
            <span 
              key={item.word} 
              className={`${sizes[idx] || 'text-[10px] text-slate-300'} px-2 py-1 rounded bg-black/30 border border-white/5 transition-all duration-300`}
            >
              {item.word}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

// 2. TwitchEmoteShower (Chuva de Emotes)
export function TwitchEmoteShower({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';
  const [floatingEmotes, setFloatingEmotes] = useState([]);

  useEffect(() => {
    if (!isOnline) {
      setFloatingEmotes([]);
      return;
    }
    const lastMsg = liveActivity?.lastMessage;
    if (!lastMsg || lastMsg.platform !== 'Twitch') return;

    // Detect common emoticons or emotes in chat
    const emotesRegex = /(Kappa|PogChamp|LUL|ResidentSlick|BibleThump|Kreygasm|HeyGuys|WutFace|SeemsGood|❤️|🔥|🎉|🚀|😂|😮)/g;
    const matches = (lastMsg.text || '').match(emotesRegex);

    if (matches && matches.length > 0) {
      const newEmotes = matches.map((symbol, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random()}`,
        symbol,
        left: Math.random() * 80 + 10, // left % 10-90
        scale: Math.random() * 0.4 + 0.8, // size factor
        duration: Math.random() * 2 + 3 // secs to float up
      }));

      setFloatingEmotes(prev => [...prev, ...newEmotes].slice(-15)); // max 15 emotes floating
    }
  }, [liveActivity?.lastMessage, isOnline]);

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-end text-left relative overflow-hidden"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="absolute top-3 left-3 z-10 select-none">
        <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-yellow-400" />
          <span>{!isOnline ? 'Live não conectada' : 'Chuva de Emotes Ativa'}</span>
        </span>
      </div>

      {/* Floating Canvas */}
      <div className="w-full h-full relative">
        {isOnline && floatingEmotes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-mono italic">
            Aguardando emotes no chat...
          </div>
        )}
        {floatingEmotes.map(emote => (
          <div
            key={emote.id}
            className="absolute bottom-0 text-xl pointer-events-none select-none animate-float-up"
            style={{
              left: `${emote.left}%`,
              transform: `scale(${emote.scale})`,
              animation: `floatUp ${emote.duration}s ease-out forwards`,
            }}
          >
            {emote.symbol}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-160px) rotate(20deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
