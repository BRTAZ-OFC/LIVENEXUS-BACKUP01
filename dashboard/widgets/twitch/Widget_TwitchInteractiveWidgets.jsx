import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { platformIsOnline, platformMessages, selectedPlatforms } from '@dashboard/overlays/Overlay_platformData';
import { Users, Vote, Gift, Flame } from 'lucide-react';

// 1. TwitchChatterLeaderboard (Ranking de Chatters)
export function TwitchChatterLeaderboard({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = platformIsOnline(connections, config);

  const ranking = useMemo(() => {
    if (!isOnline) return [];
    const messages = platformMessages(liveActivity, config);
    
    const freq = new Map();
    messages.forEach(msg => {
      const key = `${msg.platform}:${msg.author}`;
      const entry = freq.get(key) || { platform: msg.platform, author: msg.author, count: 0 };
      entry.count++;
      freq.set(key, entry);
    });

    const leaderboard = [...freq.values()];

    leaderboard.sort((a, b) => b.count - a.count);
    return leaderboard.slice(0, 3); // top 3 chatters
  }, [liveActivity, isOnline, config.platform, config.platforms]);

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-start text-left"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 border-b border-white/10 pb-1 flex items-center justify-between select-none">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-purple-400" />
          <span>Top Chatters</span>
        </span>
        <span className="text-[8px] text-purple-400">Atividade</span>
      </div>

      <div className="space-y-1 overflow-hidden flex-1 flex flex-col justify-center">
        {!isOnline ? (
          <div className="text-[11px] text-slate-500 font-mono italic text-center py-4">
            Live não conectada
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-[11px] text-slate-500 font-mono italic text-center py-4">
            Aguardando mensagens...
          </div>
        ) : (
          ranking.map((chatter, idx) => (
            <div key={`${chatter.platform}:${chatter.author}`} className="flex items-center justify-between text-xs py-0.5 border-b border-white/5 last:border-0">
              <span className="truncate pr-2">
                <span className="font-bold text-purple-400 font-mono mr-1">{idx + 1}.</span>
                <span className="text-slate-200">{chatter.author} <span className="text-slate-500">[{chatter.platform}]</span></span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 shrink-0 select-none">
                {chatter.count} msgs
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 2. TwitchPoll (Enquete Interativa)
export function TwitchPoll({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = platformIsOnline(connections, config);

  const question = config.question || 'A live hoje está legal?';
  const configuredOptions = useMemo(() => {
    if (Array.isArray(config.options) && config.options.length > 0) {
      return config.options.map((opt, idx) => ({
        text: typeof opt === 'string' ? opt : opt.text || `Opção ${idx + 1}`,
        label: typeof opt === 'object' && opt.label ? opt.label : String(idx + 1)
      }));
    }
    return [
      { text: 'Sim', label: '1' },
      { text: 'Não', label: '2' },
      { text: 'Mais ou menos', label: '3' },
      { text: 'Ruim', label: '4' }
    ];
  }, [config.options]);

  const [votesMap, setVotesMap] = useState({});

  // Reset votes when streamer triggers reset from sidebar
  useEffect(() => {
    if (config.resetVotes) {
      setVotesMap({});
    }
  }, [config.resetVotes]);

  // Real-time vote detection from chat (!voto 1, !voto 2, etc.)
  useEffect(() => {
    if (!isOnline) return;
    const lastMsg = liveActivity?.lastMessage;
    if (!lastMsg || !selectedPlatforms(config).includes(lastMsg.platform)) return;
    
    const textLower = (lastMsg.text || '').toLowerCase().trim();
    if (textLower.startsWith('!voto')) {
      const voteOption = textLower.replace('!voto', '').trim();
      if (configuredOptions.some(opt => opt.label === voteOption)) {
        setVotesMap(prev => ({
          ...prev,
          [voteOption]: (prev[voteOption] || 0) + 1
        }));
      }
    }
  }, [liveActivity?.lastMessage, isOnline, configuredOptions, config.platform, config.platforms]);

  const totalVotes = Object.values(votesMap).reduce((a, b) => a + b, 0);

  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-start text-left min-h-full"
      style={{
        background: config.backgroundColor || 'rgba(0, 0, 0, 0.45)',
        borderRadius: config.borderRadius || '0px',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5 select-none border-b border-white/5 pb-1 shrink-0">
        <Vote className="h-4 w-4 text-emerald-400 shrink-0" />
        <span className="truncate font-bold text-slate-200">Enquete: {question}</span>
      </div>

      {!isOnline ? (
        <div className="text-xs text-slate-500 font-mono italic text-center py-4 my-auto">
          Live não conectada
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1 flex flex-col justify-center scrollbar-none py-1">
          {configuredOptions.map(opt => {
            const count = votesMap[opt.label] || 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return (
              <div key={opt.label} className="space-y-0.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-white">
                  <span className="truncate pr-1">{opt.label}. {opt.text}</span>
                  <span className="font-mono text-emerald-400 shrink-0">{count} ({pct}%)</span>
                </div>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {totalVotes === 0 && (
            <div className="text-[9px] text-slate-400 font-mono text-center pt-1 shrink-0">
              Votação no chat: {configuredOptions.map(o => `!voto ${o.label}`).join(' | ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 3. TwitchRaffle (Sorteio do Chat)
export function TwitchRaffle({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = platformIsOnline(connections, config);
  const [participants, setParticipants] = useState([]);
  const [winner, setWinner] = useState(null);
  const lastDrawRef = useRef(config.drawTrigger);
  const lastResetRef = useRef(config.resetTrigger);

  // Streamer trigger from sidebar controls
  useEffect(() => {
    if (config.drawTrigger && config.drawTrigger !== lastDrawRef.current) {
      lastDrawRef.current = config.drawTrigger;
      if (participants.length > 0) {
        const randomIndex = Math.floor(Math.random() * participants.length);
        setWinner(participants[randomIndex]);
      }
    }
  }, [config.drawTrigger, participants]);

  useEffect(() => {
    if (config.resetTrigger && config.resetTrigger !== lastResetRef.current) {
      lastResetRef.current = config.resetTrigger;
      setParticipants([]);
      setWinner(null);
    }
  }, [config.resetTrigger]);

  // Real participants enter via chat (!entrar)
  useEffect(() => {
    if (!isOnline) {
      setParticipants([]);
      setWinner(null);
      return;
    }
    const lastMsg = liveActivity?.lastMessage;
    if (!lastMsg || !selectedPlatforms(config).includes(lastMsg.platform)) return;
    
    const textLower = (lastMsg.text || '').toLowerCase().trim();
    const identity = `${lastMsg.platform}: ${lastMsg.author}`;
    if (textLower === '!entrar' && !participants.includes(identity)) {
      setParticipants(prev => [...prev, identity]);
    }
  }, [liveActivity?.lastMessage, isOnline, config.platform, config.platforms]);

  const runDraw = () => {
    if (participants.length === 0) return;
    const randomIndex = Math.floor(Math.random() * participants.length);
    setWinner(participants[randomIndex]);
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
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between select-none">
        <span className="flex items-center gap-1.5">
          <Gift className="h-3.5 w-3.5 text-cyan-400" />
          <span>Sorteio do Chat</span>
        </span>
        <span className="text-[9px] font-mono text-slate-500">Digite !entrar</span>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center py-2">
        {!isOnline ? (
          <div className="text-[11px] text-slate-500 font-mono italic text-center">
            Live não conectada
          </div>
        ) : winner ? (
          <div className="text-center animate-bounce">
            <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider font-mono">Ganhador!</div>
            <div className="text-sm font-black text-white truncate">{winner}</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-[11px] text-slate-300 font-medium">
              {participants.length === 0 ? 'Nenhum participante inscrito' : `${participants.length} participantes inscritos`}
            </div>
          </div>
        )}

        {isOnline && participants.length > 0 && (
          <button 
            type="button"
            onClick={runDraw}
            className="mt-2.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-[10px] font-bold text-white transition-all active:scale-95 border border-white/10 cursor-pointer"
          >
            {winner ? 'Sortear Novamente' : 'Realizar Sorteio'}
          </button>
        )}
      </div>
    </div>
  );
}

// 4. TwitchSubTrain (Trem do Sub)
export function TwitchSubTrain({ config = {} }) {
  const { liveActivity, connections } = useStreaming();
  const isOnline = connections?.Twitch?.status === 'connected';

  const [level, setLevel] = useState(1);
  const [consecutiveSubs, setConsecutiveSubs] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!isOnline) {
      setConsecutiveSubs(0);
      setSecondsLeft(0);
      return;
    }

    if (secondsLeft <= 0) {
      if (consecutiveSubs > 0) {
        setConsecutiveSubs(0);
        setLevel(1);
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, isOnline, consecutiveSubs]);

  useEffect(() => {
    if (!isOnline) return;
    const lastEv = liveActivity?.lastEvent;
    if (!lastEv || lastEv.platform !== 'Twitch') return;
    
    if (lastEv.eventType === 'twitch_sub' || lastEv.eventType === 'twitch_resub' || lastEv.eventType === 'twitch_subgift') {
      setConsecutiveSubs(prev => {
        const next = prev + 1;
        if (next % 5 === 0) {
          setLevel(l => Math.min(l + 1, 5));
        }
        return next;
      });
      setSecondsLeft(180);
    }
  }, [liveActivity?.lastEvent, isOnline]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isTrainActive = isOnline && consecutiveSubs > 0 && secondsLeft > 0;
  const pct = isTrainActive ? Math.round((secondsLeft / 180) * 100) : 0;

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
          <Flame className={`h-3.5 w-3.5 ${isTrainActive ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
          <span>Trem do Sub {isTrainActive ? `(Nível ${level})` : ''}</span>
        </span>
        <span className="text-rose-400 font-bold font-mono">
          {!isOnline ? 'Live não conectada' : isTrainActive ? formatTime(secondsLeft) : 'Inativo'}
        </span>
      </div>

      {!isOnline ? (
        <div className="text-[10px] text-slate-500 font-mono italic text-center py-1">
          Live não conectada
        </div>
      ) : !isTrainActive ? (
        <div className="text-[10px] text-slate-500 font-mono italic text-center py-1">
          Nenhum trem do sub ativo
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-rose-600 to-pink-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] font-mono font-bold text-white shrink-0">
            {consecutiveSubs}/{(level * 5)}
          </span>
        </div>
      )}
    </div>
  );
}
