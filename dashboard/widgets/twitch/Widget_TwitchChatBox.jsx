import React, { useMemo, useLayoutEffect, useRef } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { platformIsOnline, platformMessages, selectedPlatforms, visibleChatText } from '@dashboard/overlays/Overlay_platformData';

export default function TwitchChatBox({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = platformIsOnline(connections, config);
  const isMultichat = selectedPlatforms(config).length > 1;
  const listContainerRef = useRef(null);

  const chatMessages = useMemo(() => {
    return platformMessages(liveActivity, config)
      .slice(0, 40) // buffer de mensagens
      .reverse();  // cronológico: mais antiga no índice 0 (topo), mais recente no final (base)
  }, [liveActivity, config.platform, config.platforms]);

  const messagesKey = useMemo(() => {
    return chatMessages.map(m => m.id).join(',');
  }, [chatMessages]);

  // Mede e oculta mensagens que transbordam no topo para evitar qualquer rolagem
  useLayoutEffect(() => {
    if (!listContainerRef.current) return;
    const container = listContainerRef.current;

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        adjustVisibleMessages();
      });
    });
    observer.observe(container);

    function adjustVisibleMessages() {
      const containerHeight = container.clientHeight;
      if (containerHeight <= 0) return;

      const children = Array.from(container.children).filter(el => el.getAttribute('data-chat-msg') === 'true');
      if (children.length === 0) return;

      // Restaura temporariamente para medir as alturas reais
      children.forEach(child => {
        child.style.display = 'flex';
      });

      let totalHeight = 0;
      const gap = 8; // space-y-2 (8px)

      // Itera de baixo para cima (da mensagem mais recente para a mais antiga)
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        const childHeight = child.offsetHeight;
        const neededSpace = childHeight + (totalHeight > 0 ? gap : 0);

        if (totalHeight + neededSpace <= containerHeight) {
          totalHeight += neededSpace;
          child.style.display = 'flex';
        } else {
          // As mensagens anteriores do topo que não cabem somem
          child.style.display = 'none';
        }
      }
    }

    adjustVisibleMessages();

    return () => {
      observer.disconnect();
    };
  }, [chatMessages, messagesKey]);

  const style = {
    fontSize: config.fontSize || '14px',
    color: config.textColor || '#ffffff',
    fontFamily: config.fontFamily || 'Inter, sans-serif',
  };

  const getRoleStyle = (roles) => {
    if (roles.includes('broadcaster')) return 'text-rose-400 font-extrabold';
    if (roles.includes('moderator')) return 'text-emerald-400 font-bold';
    if (roles.includes('vip')) return 'text-indigo-400 font-bold';
    if (roles.includes('subscriber')) return 'text-pink-400';
    return 'text-slate-300';
  };

  const getRoleLabel = (roles) => {
    if (roles.includes('broadcaster')) return '[Broadcaster]';
    if (roles.includes('moderator')) return '[Mod]';
    if (roles.includes('vip')) return '[VIP]';
    if (roles.includes('subscriber')) return '[Sub]';
    return '';
  };

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-end overflow-hidden transition-all text-left select-none"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '12px',
      }}
    >
      <div 
        ref={listContainerRef}
        className="space-y-2 overflow-hidden max-h-full flex flex-col justify-end w-full"
      >
        {chatMessages.length === 0 ? (
          <div className="text-xs text-slate-500 font-mono italic text-center py-4">
            {!isOnline ? 'Live não conectada' : 'Aguardando mensagens do chat...'}
          </div>
        ) : (
          chatMessages.map(msg => (
            <div 
              key={msg.id} 
              data-chat-msg="true"
              className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2 leading-relaxed break-words py-0.5 animate-fade-in-up shrink-0"
              style={style}
            >
              <span className="flex items-center gap-1.5 shrink-0 select-none">
                {msg.roles && msg.roles.length > 0 && (
                  <span className="text-[9px] font-mono uppercase font-semibold text-slate-400">
                    {getRoleLabel(msg.roles)}
                  </span>
                )}
                <span className={`text-xs ${getRoleStyle(msg.roles || [])}`}>
                  {msg.author}
                </span>
              </span>
              <span className={`text-xs break-all text-slate-200 min-w-0 ${isMultichat ? 'line-clamp-3' : ''}`}>
                <span className="mr-1 text-slate-400">[{msg.platform}]</span>
                {visibleChatText(msg)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
