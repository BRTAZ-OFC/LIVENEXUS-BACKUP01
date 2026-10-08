import React, { useState, useEffect, useRef } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { platformIsOnline, platformMeta } from '@dashboard/overlays/Overlay_platformData';
import { Clock, Terminal, CheckCircle2, ShieldAlert, Calendar, LayoutGrid, Scroll } from 'lucide-react';

// Auto-Scroll helper component that loops content continuously when it overflows the available space
function AutoScrollList({ children, className = '' }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const check = () => {
      if (containerRef.current && contentRef.current) {
        requestAnimationFrame(() => {
          if (containerRef.current && contentRef.current) {
            setIsOverflowing(contentRef.current.scrollHeight > containerRef.current.clientHeight + 2);
          }
        });
      }
    };
    check();
    const ro = new ResizeObserver(check);
    if (containerRef.current) ro.observe(containerRef.current);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [children]);

  if (!isOverflowing) {
    return (
      <div ref={containerRef} className={`w-full h-full overflow-hidden ${className}`}>
        <div ref={contentRef} className="w-full flex flex-col justify-center my-auto min-h-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full h-full overflow-hidden relative ${className}`}>
      <div
        className="w-full flex flex-col animate-vmarquee"
        style={{
          animation: 'verticalMarqueeLoop 12s linear infinite'
        }}
      >
        <div ref={contentRef} className="w-full flex flex-col space-y-1.5 pb-2">
          {children}
        </div>
        <div className="w-full flex flex-col space-y-1.5 pb-2">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes verticalMarqueeLoop {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}

// 1. TwitchUptime (Cronômetro / Uptime Real)
export function TwitchUptime({ config = {} }) {
  const { connections, streamMeta } = useStreaming();
  const isOnline = platformIsOnline(connections, config);
  const startedAt = platformMeta(streamMeta, connections, config, 'startedAt').startedAt;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isOnline || !startedAt) {
      setElapsed(0);
      return;
    }

    const calc = () => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
      setElapsed(diffSecs);
    };

    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [isOnline, startedAt]);

  const formatUptime = (totalSecs) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 select-none">
        <Clock className="h-3.5 w-3.5 text-indigo-400" />
        <span>Tempo de Transmissão</span>
      </div>
      <div className="text-xl font-black text-white font-mono tracking-tight leading-none">
        {!isOnline 
          ? 'Live offline' 
          : !startedAt 
          ? 'Aguardando dados' 
          : formatUptime(elapsed)}
      </div>
    </div>
  );
}

// 2. TwitchCommandsList (Lista de Comandos)
export function TwitchCommandsList({ config = {} }) {
  const commands = Array.isArray(config.commands)
    ? config.commands
    : typeof config.commands === 'string'
    ? config.commands.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-start text-left overflow-hidden"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 border-b border-white/5 pb-1 flex items-center gap-1 select-none shrink-0">
        <Terminal className="h-3.5 w-3.5 text-purple-400" />
        <span>Comandos de Chat Ativos</span>
      </div>
      
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        {commands.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] text-slate-500 font-mono italic">
            Nenhum comando configurado
          </div>
        ) : (
          <AutoScrollList>
            <div className="flex flex-wrap gap-1.5 items-center justify-start py-1">
              {commands.map((cmd, idx) => {
                const name = typeof cmd === 'string' ? cmd : cmd.name || cmd.command || '';
                const desc = typeof cmd === 'object' ? cmd.description || cmd.desc || '' : '';
                return (
                  <span key={idx} className="text-[10px] font-mono text-purple-300 bg-purple-950/20 border border-purple-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span>{name.startsWith('!') ? name : `!${name}`}</span>
                    {desc && <span className="text-[8.5px] text-slate-400">({desc})</span>}
                  </span>
                );
              })}
            </div>
          </AutoScrollList>
        )}
      </div>
    </div>
  );
}

// 3. TwitchMilestones (Conquistas da Stream)
export function TwitchMilestones({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';

  const milestones = [
    {
      name: 'Primeira Raid da Live',
      done: (liveActivity?.items || []).some(item => item.platform === 'Twitch' && item.eventType === 'twitch_raid')
    },
    {
      name: 'Primeiro Inscrito da Live',
      done: (liveActivity?.items || []).some(item => item.platform === 'Twitch' && (item.eventType === 'twitch_sub' || item.eventType === 'twitch_resub' || item.eventType === 'twitch_subgift'))
    },
    {
      name: 'Primeiro Cheer de Bits',
      done: (liveActivity?.items || []).some(item => item.platform === 'Twitch' && item.eventType === 'twitch_bits')
    }
  ];

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-start text-left overflow-hidden"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 border-b border-white/5 pb-1 flex items-center justify-between select-none shrink-0">
        <span>Conquistas da Live</span>
        <span className="text-[9px] text-indigo-400">Marcos</span>
      </div>

      <div className="flex-1 min-h-0 w-full overflow-hidden">
        {!isOnline ? (
          <div className="h-full flex items-center justify-center text-[10px] text-slate-500 font-mono italic">
            Live não conectada
          </div>
        ) : (
          <AutoScrollList>
            {milestones.map(milestone => (
              <div key={milestone.name} className="flex items-center gap-1.5 text-xs py-0.5">
                <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${milestone.done ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span className={`truncate ${milestone.done ? 'text-slate-200' : 'text-slate-500'}`}>
                  {milestone.name}
                </span>
              </div>
            ))}
          </AutoScrollList>
        )}
      </div>
    </div>
  );
}

// 4. TwitchRules (Regras do Canal)
export function TwitchRules({ config = {} }) {
  const rules = Array.isArray(config.rules)
    ? config.rules
    : typeof config.rules === 'string'
    ? config.rules.split('\n').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-start text-left overflow-hidden"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 border-b border-white/5 pb-1 flex items-center gap-1.5 select-none shrink-0">
        <Scroll className="h-3.5 w-3.5 text-amber-500" />
        <span>Regras do Canal</span>
      </div>

      <div className="flex-1 min-h-0 w-full overflow-hidden">
        {rules.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 font-mono text-[10px]">
            Nenhuma regra cadastrada
          </div>
        ) : (
          <AutoScrollList>
            {rules.map((rule, idx) => (
              <div key={idx} className="text-[10px] text-slate-300 italic font-medium leading-tight py-0.5 truncate">
                {idx + 1}. {rule}
              </div>
            ))}
          </AutoScrollList>
        )}
      </div>
    </div>
  );
}

// 5. TwitchSchedule (Agenda de Transmissões)
export function TwitchSchedule({ config = {} }) {
  const agenda = Array.isArray(config.schedule) ? config.schedule : [];

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-start text-left overflow-hidden"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 border-b border-white/5 pb-1 flex items-center gap-1.5 select-none shrink-0">
        <Calendar className="h-3.5 w-3.5 text-teal-400" />
        <span>Agenda Semanal</span>
      </div>

      <div className="flex-1 min-h-0 w-full overflow-hidden">
        {agenda.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] text-slate-500 font-mono italic">
            Agenda não configurada
          </div>
        ) : (
          <AutoScrollList>
            {agenda.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px] border-b border-white/5 last:border-0 pb-1 last:pb-0">
                <span className="font-bold text-white shrink-0">{item.day}</span>
                <span className="text-[10px] font-mono text-teal-400 px-1 bg-black/30 rounded">{item.hour}</span>
                <span className="truncate text-slate-400 pl-1">{item.label}</span>
              </div>
            ))}
          </AutoScrollList>
        )}
      </div>
    </div>
  );
}

// 6. TwitchScheduleTicker (Letreiro de Notícias / Avisos)
export function TwitchScheduleTicker({ config = {} }) {
  const newsList = Array.isArray(config.news) 
    ? config.news 
    : typeof config.newsText === 'string' && config.newsText 
    ? [config.newsText]
    : typeof config.text === 'string' && config.text
    ? [config.text]
    : [];

  const newsText = newsList.filter(Boolean).join(' ★ ') || config.newsText || config.text || '';

  return (
    <div 
      className="w-full h-full p-3.5 flex flex-col justify-center text-left overflow-hidden"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1 select-none shrink-0">
        <LayoutGrid className="h-3 w-3 text-indigo-400" />
        <span>Notícias da Stream</span>
      </div>

      <div className="overflow-hidden whitespace-nowrap relative w-full h-5 flex items-center">
        {!newsText ? (
          <div className="text-[10px] text-slate-500 font-mono italic">
            Nenhum aviso configurado
          </div>
        ) : (
          <>
            <div 
              className="inline-block animate-marquee-schedule" 
              style={{ 
                display: 'inline-block', 
                paddingLeft: '100%', 
                animation: 'marquee_sched 18s linear infinite',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#a5b4fc'
              }}
            >
              ★ {newsText} ★
            </div>
            <style>{`
              @keyframes marquee_sched {
                0% { transform: translate(0, 0); }
                100% { transform: translate(-100%, 0); }
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  );
}

// 7. TwitchModeratorFeed (Logs de Moderação)
export function TwitchModeratorFeed({ config = {} }) {
  const { messages, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';

  // Read real moderation events from blocked / filtered messages in the stream
  const modLogs = (messages || [])
    .filter(m => m.blocked)
    .slice(0, 5);

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-start text-left overflow-hidden"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 border-b border-white/5 pb-1 flex items-center gap-1.5 select-none shrink-0">
        <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
        <span>Logs de Moderação (Chat)</span>
      </div>

      <div className="flex-1 min-h-0 w-full overflow-hidden text-[10px]">
        {!isOnline ? (
          <div className="h-full flex items-center justify-center text-slate-500 font-mono italic">
            Live não conectada
          </div>
        ) : modLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 font-mono italic">
            Nenhum evento de moderação registrado
          </div>
        ) : (
          <AutoScrollList>
            {modLogs.map((log, idx) => (
              <div key={log.id || idx} className="flex flex-col border-b border-white/5 last:border-0 pb-1 last:pb-0">
                <span className="font-bold text-rose-300">{log.author}</span>
                <span className="text-slate-400 italic truncate">
                  {log.blockReason ? `Bloqueado por: ${log.blockReason}` : 'Mensagem moderada'}
                </span>
              </div>
            ))}
          </AutoScrollList>
        )}
      </div>
    </div>
  );
}
