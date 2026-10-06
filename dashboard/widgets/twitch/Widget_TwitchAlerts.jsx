import React, { useState, useEffect, useRef } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { selectedPlatforms, genericEventAllowed, eventLabel, eventDetails } from '@dashboard/overlays/Overlay_platformData';
import { Sparkles, Trophy, Heart, Flame } from 'lucide-react';

export default function TwitchAlerts({ config = {} }) {
  const { liveActivity } = useStreaming();
  const [activeAlert, setActiveAlert] = useState(null);
  const queueRef = useRef([]);
  const activeAlertRef = useRef(null);
  const lastProcessedEventIdRef = useRef(null);

  // Keep track of new events
  useEffect(() => {
    if (!liveActivity?.lastEvent) return;
    const ev = liveActivity.lastEvent;
    if (!selectedPlatforms(config).includes(ev.platform)) return;
    if (ev.id === lastProcessedEventIdRef.current) return;
    
    // Check if eventType is a known Twitch event
    const knownTwitchEvents = ['twitch_sub', 'twitch_resub', 'twitch_subgift', 'twitch_bits', 'twitch_raid', 'twitch_announcement'];
    if (ev.platform === 'Twitch' ? !knownTwitchEvents.includes(ev.eventType) : !genericEventAllowed(ev)) return;

    lastProcessedEventIdRef.current = ev.id;
    
    // Add to queue and process
    queueRef.current.push(ev);
    processQueue();
  }, [liveActivity?.lastEvent, config.platform, config.platforms]);

  const processQueue = () => {
    if (activeAlertRef.current) return; // currently showing an alert
    if (queueRef.current.length === 0) return;

    const nextAlert = queueRef.current.shift();
    activeAlertRef.current = nextAlert;
    setActiveAlert(nextAlert);

    // Alert duration
    const duration = config.duration || 5000;
    setTimeout(() => {
      setActiveAlert(null);
      activeAlertRef.current = null;
      // Small pause before next alert
      setTimeout(() => {
        processQueue();
      }, 500);
    }, duration);
  };

  if (!activeAlert) return null;

  const getAlertDetails = () => {
    const { eventType, eventMeta, author, text } = activeAlert;
    if (activeAlert.platform !== 'Twitch') return {
      title: `${activeAlert.platform} · ${eventLabel(activeAlert)}`,
      desc: author || activeAlert.platform,
      subText: eventDetails(activeAlert),
      icon: <Sparkles className="h-7 w-7 text-indigo-400" />,
      colorClass: 'border-indigo-500/30 bg-indigo-950/20 text-indigo-200',
    };
    
    switch (eventType) {
      case 'twitch_sub':
        return {
          title: 'Novo Inscrito!',
          desc: `${author} se inscreveu no canal!`,
          subText: text || 'Obrigado pelo apoio!',
          icon: <Heart className="h-7 w-7 text-rose-400 animate-pulse" />,
          colorClass: 'border-rose-500/30 bg-rose-950/20 text-rose-200',
          accentColor: 'rose',
        };
      case 'twitch_resub':
        return {
          title: `Inscrição Renovada!`,
          desc: `${author} renovou por ${eventMeta?.months || 1} meses!`,
          subText: text || 'Incrível ver você continuar conosco!',
          icon: <Trophy className="h-7 w-7 text-yellow-400" />,
          colorClass: 'border-yellow-500/30 bg-yellow-950/20 text-yellow-200',
          accentColor: 'yellow',
        };
      case 'twitch_subgift':
        return {
          title: 'Inscrição Presenteada!',
          desc: eventMeta?.isMysteryGift 
            ? `${author} presenteou ${eventMeta.count} inscrições na comunidade!` 
            : `${author} deu uma inscrição para ${eventMeta?.recipient || 'um espectador'}!`,
          subText: 'Espalhando a generosidade!',
          icon: <Sparkles className="h-7 w-7 text-purple-400" />,
          colorClass: 'border-purple-500/30 bg-purple-950/20 text-purple-200',
          accentColor: 'purple',
        };
      case 'twitch_bits':
        return {
          title: 'Cheer recebido!',
          desc: `${author} enviou ${eventMeta?.amount || 0} bits!`,
          subText: text || 'Valeu pelos bits!',
          icon: <Flame className="h-7 w-7 text-cyan-400 animate-bounce" />,
          colorClass: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-200',
          accentColor: 'cyan',
        };
      case 'twitch_raid':
        return {
          title: 'Raid Entrando!',
          desc: `${author} está trazendo uma raid com ${eventMeta?.viewers || 0} espectadores!`,
          subText: 'Bem-vindos todos os novos espectadores!',
          icon: <Flame className="h-7 w-7 text-orange-400" />,
          colorClass: 'border-orange-500/30 bg-orange-950/20 text-orange-200',
          accentColor: 'orange',
        };
      case 'twitch_announcement':
        return {
          title: 'Anúncio Oficial!',
          desc: `${author}: ${text}`,
          subText: 'Atenção ao chat!',
          icon: <Sparkles className="h-7 w-7 text-emerald-400" />,
          colorClass: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200',
          accentColor: 'emerald',
        };
      default:
        return {
          title: 'Evento!',
          desc: `${author} acionou um evento`,
          subText: text,
          icon: <Sparkles className="h-7 w-7 text-indigo-400" />,
          colorClass: 'border-indigo-500/30 bg-indigo-950/20 text-indigo-200',
          accentColor: 'indigo',
        };
    }
  };

  const details = getAlertDetails();

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div 
        className={`max-w-md w-full rounded-2xl p-5 backdrop-blur-xl shadow-2xl flex items-center gap-4 animate-scale-in text-left ${details.colorClass}`}
        style={{
          fontFamily: config.fontFamily || 'Inter, sans-serif',
          border: config.showBorder === true ? undefined : 'none'
        }}
      >
        <div className="p-3 rounded-xl bg-black/40 shrink-0">
          {details.icon}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[10px] font-mono tracking-wider uppercase font-semibold text-white/50 block mb-0.5">
            {details.title}
          </div>
          <h4 className="text-xs font-bold text-white leading-snug">
            {details.desc}
          </h4>
          {details.subText && (
            <p className="text-xs text-white/80 font-medium italic mt-1 break-words">
              "{details.subText}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
