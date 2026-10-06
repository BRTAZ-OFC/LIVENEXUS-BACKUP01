import React, { useState, useEffect, useMemo } from 'react';
import TwitchChatBox from '@dashboard/widgets/twitch/Widget_TwitchChatBox';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import {
  getStoredReactQueue,
  getStoredActiveReactVideo,
  addVideoToReactQueue,
  playReactVideo,
  removeReactVideo,
  clearWatchedReactVideos,
  syncVideosFromChatMessages
} from './Scenario_reactVideoService';
import { 
  MessageSquare, Film, Play, Trash2, Plus, 
  ExternalLink, SplitSquareVertical, 
  CheckCircle2, User, Radio
} from 'lucide-react';

export default function ReactChatAndVideoArea({ config = {}, isEditing = false }) {
  const { liveActivity } = useStreaming();

  const [activeTab, setActiveTab] = useState('split'); // 'chat' | 'videos' | 'split'
  const [queue, setQueue] = useState(() => getStoredReactQueue());
  const [activeVideo, setActiveVideo] = useState(() => getStoredActiveReactVideo());

  // Input form state
  const [urlInput, setUrlInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [formError, setFormError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
    } catch (err) {
      console.error('BroadcastChannel error:', err);
    }

    const handleStorage = (e) => {
      if (e.key === 'scenario_react_queue') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          setQueue(parsed);
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

  // Automatically monitor live chat messages for user-submitted video links
  useEffect(() => {
    if (liveActivity?.items && liveActivity.items.length > 0) {
      syncVideosFromChatMessages(liveActivity.items);
      setQueue(getStoredReactQueue());
    }
  }, [liveActivity?.items]);

  const handleAddVideo = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!urlInput.trim()) return;

    const res = addVideoToReactQueue({
      url: urlInput.trim(),
      author: authorInput.trim() || 'Espectador',
      source: 'manual'
    });

    if (!res.success) {
      setFormError(res.error || 'Erro ao adicionar link');
      return;
    }

    setFormError('');
    setUrlInput('');
    setAuthorInput('');
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 2000);
    setQueue(getStoredReactQueue());
  };

  const handlePlay = (item, e) => {
    e?.stopPropagation();
    playReactVideo(item);
  };

  const handleRemove = (id, e) => {
    e?.stopPropagation();
    removeReactVideo(id);
    setQueue(getStoredReactQueue());
  };

  const handleClearWatched = (e) => {
    e?.stopPropagation();
    clearWatchedReactVideos();
    setQueue(getStoredReactQueue());
  };

  const pendingCount = useMemo(() => {
    return queue.filter(item => item.status === 'pending').length;
  }, [queue]);

  const borderRadius = config.borderRadius || '6px';
  const backgroundColor = config.backgroundColor || 'rgba(15, 23, 42, 0.9)';

  return (
    <div
      style={{
        borderRadius,
        background: backgroundColor,
        border: config.showBorder === true ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
      }}
      className="w-full h-full flex flex-col overflow-hidden text-slate-100 shadow-xl"
    >
      {/* Top Header / View Selector */}
      <div className="p-2 border-b border-white/10 bg-slate-900/60 flex items-center justify-between gap-1.5 shrink-0 select-none">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
              activeTab === 'split'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Ver Chat e Fila de Vídeos ao mesmo tempo"
          >
            <SplitSquareVertical className="w-3 h-3" />
            <span>Dividir</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 relative transition-colors ${
              activeTab === 'videos'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Film className="w-3 h-3 text-cyan-400" />
            <span>Vídeos</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-extrabold ml-0.5">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3 h-3 text-purple-400" />
            <span>Chat Live</span>
          </button>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">React Hub</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* 1. CHAT ONLY TAB */}
        {activeTab === 'chat' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <TwitchChatBox config={{ ...config, backgroundColor: 'transparent', showBorder: false }} />
          </div>
        )}

        {/* 2. VIDEOS ONLY TAB */}
        {activeTab === 'videos' && (
          <div className="flex-1 overflow-hidden flex flex-col p-2.5 space-y-2">
            {renderSubmissionForm()}
            {renderVideoQueueList()}
          </div>
        )}

        {/* 3. SPLIT TAB (Chat on top, Videos queue on bottom) */}
        {activeTab === 'split' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Half: Twitch Chat */}
            <div className="h-[46%] border-b border-white/10 overflow-hidden flex flex-col">
              <div className="px-2.5 py-1 bg-slate-900/40 text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 select-none">
                <MessageSquare className="w-3 h-3 text-purple-400" />
                <span>Chat da Transmissão</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <TwitchChatBox config={{ ...config, backgroundColor: 'transparent', showBorder: false }} />
              </div>
            </div>

            {/* Bottom Half: User-submitted Videos Area */}
            <div className="flex-1 overflow-hidden flex flex-col p-2 space-y-2">
              <div className="flex items-center justify-between px-0.5 select-none shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vídeos Enviados pelos Usuários</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-600 text-white font-extrabold">
                      {pendingCount}
                    </span>
                  )}
                </div>

                {queue.some(i => i.status === 'watched') && (
                  <button
                    type="button"
                    onClick={handleClearWatched}
                    className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Limpar lidos
                  </button>
                )}
              </div>

              {renderSubmissionForm()}
              {renderVideoQueueList()}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Sub-component: Form to submit user links
  function renderSubmissionForm() {
    return (
      <form
        onSubmit={handleAddVideo}
        className="bg-slate-900/80 p-2 rounded border border-white/5 space-y-1.5 shrink-0"
      >
        <div className="flex gap-1.5">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (formError) setFormError('');
            }}
            placeholder="Cole o link do vídeo (YouTube, Twitch, TikTok, MP4)..."
            className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Fila</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1">
            <User className="w-3 h-3 text-slate-400" />
            <input
              type="text"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              placeholder="Nome do usuário (opcional)"
              className="flex-1 px-1.5 py-0.5 bg-transparent border-0 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none"
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono italic">
            Links no chat entram automaticamente
          </span>
        </div>

        {formError && (
          <p className="text-[11px] text-rose-400 font-medium">{formError}</p>
        )}
        {submitSuccess && (
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Vídeo adicionado à fila com sucesso!
          </p>
        )}
      </form>
    );
  }

  // Sub-component: List of user-submitted video links
  function renderVideoQueueList() {
    return (
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-1.5">
            <Film className="w-8 h-8 text-slate-600 stroke-[1.5]" />
            <p className="text-xs font-medium text-slate-400">
              Nenhum vídeo enviado ainda.
            </p>
            <p className="text-[11px] text-slate-500 max-w-[240px]">
              Envie um link acima ou seus espectadores podem enviar links no chat da transmissão.
            </p>
          </div>
        ) : (
          queue.map((item) => {
            const isPlaying = activeVideo && activeVideo.id === item.id;
            const isWatched = item.status === 'watched';

            return (
              <div
                key={item.id}
                className={`p-2 rounded border transition-all text-left flex flex-col gap-1.5 ${
                  isPlaying
                    ? 'bg-blue-950/70 border-blue-500/80 shadow-md shadow-blue-950/50 ring-1 ring-blue-500/40'
                    : isWatched
                    ? 'bg-slate-900/40 border-white/5 opacity-60 hover:opacity-100'
                    : 'bg-slate-900/90 border-slate-700/60 hover:border-slate-500'
                }`}
              >
                {/* Top line: Author & Platform badge */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      style={{ backgroundColor: item.parsed?.badgeColor || '#3b82f6' }}
                      className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white uppercase shrink-0"
                    >
                      {item.parsed?.platform || 'Vídeo'}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {item.author}
                    </span>
                    {item.source === 'chat' && (
                      <span className="text-[9px] px-1 bg-purple-900/60 text-purple-300 rounded font-mono shrink-0">
                        chat
                      </span>
                    )}
                  </div>

                  {/* Status indicator */}
                  <div>
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

                {/* Middle line: URL */}
                <div className="text-[11px] text-slate-300 font-mono truncate select-all">
                  {item.url}
                </div>

                {/* Bottom line: Actions */}
                <div className="flex items-center justify-between pt-0.5 border-t border-white/5">
                  <button
                    type="button"
                    onClick={(e) => handlePlay(item, e)}
                    className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow'
                        : 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isPlaying ? 'Reproduzindo' : 'Reproduzir'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title="Abrir link original"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => handleRemove(item.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Excluir da fila"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }
}
