import React, { useState, useEffect, useRef } from 'react';
import {
  getStoredActiveReactVideo,
  stopReactVideo,
  addVideoToReactQueue,
  playReactVideo,
  parseVideoUrl
} from './Scenario_reactVideoService';
import { Play, Square, RotateCcw, ExternalLink, Video, Sparkles } from 'lucide-react';

export default function ReactVideoPlayer({ config = {}, isEditing = false }) {
  const [activeVideo, setActiveVideo] = useState(() => getStoredActiveReactVideo());
  const [directInputUrl, setDirectInputUrl] = useState('');
  const [inputError, setInputError] = useState('');
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef(null);

  // Sync active video with BroadcastChannel and storage events
  useEffect(() => {
    let channel = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('scenario_react_bus');
        channel.onmessage = (event) => {
          if (event.data?.type === 'ACTIVE_VIDEO_CHANGED') {
            setActiveVideo(event.data.payload || null);
          }
        };
      }
    } catch (err) {
      console.error('BroadcastChannel error:', err);
    }

    const handleStorage = (e) => {
      if (e.key === 'scenario_react_active_video') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          setActiveVideo(parsed);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) {
        try {
          channel.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleDirectPlay = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!directInputUrl.trim()) return;

    const parsed = parseVideoUrl(directInputUrl.trim());
    if (!parsed) {
      setInputError('Formato de link não reconhecido. Use YouTube, Twitch Clip, TikTok ou MP4.');
      return;
    }

    setInputError('');
    const res = addVideoToReactQueue({
      url: directInputUrl.trim(),
      author: 'Streamer',
      title: `${parsed.platform}: ${directInputUrl.trim()}`,
      source: 'manual'
    });

    if (res.success) {
      playReactVideo(res.item);
      setDirectInputUrl('');
    } else if (res.item) {
      playReactVideo(res.item);
      setDirectInputUrl('');
    }
  };

  const handleStopVideo = (e) => {
    e?.stopPropagation();
    stopReactVideo();
    setActiveVideo(null);
  };

  const handleReloadVideo = (e) => {
    e?.stopPropagation();
    if (activeVideo) {
      const current = { ...activeVideo, reloadKey: Date.now() };
      setActiveVideo(null);
      setTimeout(() => setActiveVideo(current), 50);
    }
  };

  const borderRadius = config.borderRadius || '6px';
  const borderColor = config.effBorderColor || '#3b82f6';
  const borderThickness = config.effBorderThickness || 2;

  // Visual container styling matching user's corrected design
  const containerStyle = {
    borderRadius,
    border: `${borderThickness}px solid ${borderColor}`,
    backgroundColor: '#020617',
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center select-none text-slate-100 shadow-2xl"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* 1. ACTIVE VIDEO PLAYBACK */}
      {activeVideo && activeVideo.parsed ? (
        <div className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden">
          {/* Iframe player for YouTube, Twitch, TikTok, Streamable, etc. */}
          {activeVideo.parsed.type === 'iframe' && (
            <iframe
              key={activeVideo.reloadKey || activeVideo.id}
              src={activeVideo.parsed.embedUrl}
              title={activeVideo.title || 'Vídeo React'}
              className="w-full h-full border-0 bg-black pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
            />
          )}

          {/* HTML5 Native Video player for Direct MP4, WebM, etc. */}
          {activeVideo.parsed.type === 'video' && (
            <video
              key={activeVideo.reloadKey || activeVideo.id}
              src={activeVideo.url}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black pointer-events-auto"
            />
          )}

          {/* Top Control Bar Overlay */}
          <div
            className={`absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-200 flex items-center justify-between z-20 pointer-events-auto ${
              showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            }`}
          >
            {/* Info badge */}
            <div className="flex items-center gap-2 max-w-[65%]">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Ao Vivo no React
              </span>
              <span
                style={{ backgroundColor: activeVideo.parsed.badgeColor || '#3b82f6' }}
                className="px-2 py-0.5 rounded text-[11px] font-bold text-white uppercase"
              >
                {activeVideo.parsed.platform}
              </span>
              <span className="text-xs text-slate-200 truncate font-medium">
                {activeVideo.author ? `Enviado por ${activeVideo.author}` : activeVideo.title}
              </span>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReloadVideo}
                title="Recarregar Vídeo"
                className="p-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded border border-white/10 text-xs flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recarregar</span>
              </button>

              <a
                href={activeVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir link original em nova aba"
                className="p-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded border border-white/10 text-xs flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Original</span>
              </a>

              <button
                type="button"
                onClick={handleStopVideo}
                title="Parar Reprodução e Voltar à Espera"
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded text-xs flex items-center gap-1.5 shadow transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Encerrar Vídeo</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 2. STANDBY SCREEN (WHEN NO VIDEO IS CURRENTLY PLAYING) */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative bg-gradient-to-br from-[#020617] via-[#090d1f] to-[#020617]">
          {/* Subtle grid background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

          {/* Central Standby Card */}
          <div className="relative z-10 max-w-xl w-full flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/5">
                <Video className="w-8 h-8" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-[#020617] animate-pulse" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                <span>Área de Reprodução do React</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                  Pronto
                </span>
              </h2>
              <p className="text-xs text-slate-400 max-w-md">
                Aguardando seleção de vídeo dos espectadores. Clique em qualquer link recebido na área ao lado ou insira um link direto abaixo.
              </p>
            </div>

            {/* Direct Quick Link Submission */}
            <form
              onSubmit={handleDirectPlay}
              className="w-full max-w-lg mt-2 flex flex-col sm:flex-row gap-2 pointer-events-auto"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={directInputUrl}
                  onChange={(e) => {
                    setDirectInputUrl(e.target.value);
                    if (inputError) setInputError('');
                  }}
                  placeholder="Cole link do YouTube, Twitch Clip, TikTok, MP4..."
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Carregar Vídeo</span>
              </button>
            </form>

            {inputError && (
              <p className="text-xs text-rose-400 font-medium">{inputError}</p>
            )}

            {/* Quick tips & supported formats */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-slate-400">
                <Sparkles className="w-3 h-3 text-blue-400" /> Formatos suportados:
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">YouTube</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">Twitch Clips</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">TikTok</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">MP4 / WebM</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
