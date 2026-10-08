import React from 'react';
import { MessageSquare, Terminal, Tv, Sparkles } from 'lucide-react';

export const CHAT_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Box Flutuante Glass',
    description: 'Janela translúcida com header elegante, indicador online e mensagens em cartões suaves.',
    aspectRatio: '340x300',
    defaultWidth: 340,
    defaultHeight: 300,
    badge: 'Glassmorphism',
    render: ({ messages = [], isOnline = false, config = {} }) => {
      const displayMsgs = messages.slice(0, 5);

      return (
        <div className="w-full h-full p-3 rounded-none bg-slate-950/80 backdrop-blur-md flex flex-col justify-between overflow-hidden shadow-xl select-none" style={{ fontFamily: config.fontFamily || 'Inter, sans-serif' }}>
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[11px] font-bold text-white tracking-wide uppercase flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 text-purple-400" /> Chat ao Vivo
              </span>
            </div>
            <span className="text-[9px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">CHAT</span>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col justify-end space-y-1.5">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6 my-auto">Live não conectada</div>
            ) : displayMsgs.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6 my-auto">Aguardando mensagens do chat...</div>
            ) : (
              displayMsgs.map((msg, i) => (
                <div key={i} className="bg-white/5 hover:bg-white/10 p-1.5 rounded-lg border border-white/5 transition-all text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold text-purple-300">{msg.author || msg.username || msg.user}</span>
                    {msg.badge && <span className="text-[8px] font-mono bg-purple-500/20 text-purple-300 px-1 rounded">{msg.badge}</span>}
                  </div>
                  <div data-chat-text className="text-xs text-slate-200 leading-snug break-words">{msg.text || msg.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Balões de Mensagem Social',
    description: 'Layout estilo app de mensagens com balões destacados, avatares coloridos e cauda visual.',
    aspectRatio: '320x340',
    defaultWidth: 320,
    defaultHeight: 340,
    badge: 'Social App',
    render: ({ messages = [], isOnline = false, config = {} }) => {
      const displayMsgs = messages.slice(0, 4);

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-black/70 border border-cyan-500/30 flex flex-col justify-between overflow-hidden shadow-xl select-none" style={{ fontFamily: config.fontFamily || 'Inter, sans-serif' }}>
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 mb-2 shrink-0">
            <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase">CHAT DA COMUNIDADE</span>
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-cyan-400 animate-ping' : 'bg-rose-500'}`} />
          </div>
          <div className="flex-1 flex flex-col justify-end space-y-2 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6 my-auto">Live não conectada</div>
            ) : displayMsgs.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6 my-auto">Aguardando mensagens do chat...</div>
            ) : (
              displayMsgs.map((msg, i) => {
                const author = msg.author || msg.username || msg.user || 'U';
                return (
                  <div key={i} className="flex items-start gap-2 text-left">
                    <div className="h-6 w-6 rounded-full bg-cyan-600/30 border border-cyan-400/40 text-[10px] font-bold text-cyan-200 flex items-center justify-center shrink-0 uppercase">
                      {author ? author[0] : 'U'}
                    </div>
                    <div className="bg-slate-900/90 border border-cyan-500/20 p-2 rounded-xl rounded-tl-none shadow-md max-w-[85%]">
                      <span className="text-[10px] font-bold text-cyan-300 block mb-0.5">{author}</span>
                      <span data-chat-text className="text-xs text-slate-100 leading-tight block break-words">{msg.text || msg.message}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Terminal Hacker Retro',
    description: 'Estilo console prompt de comando com fontes monospace, prefixo > e indicador piscante.',
    aspectRatio: '360x280',
    defaultWidth: 360,
    defaultHeight: 280,
    badge: 'Terminal / Cyber',
    render: ({ messages = [], isOnline = false }) => {
      const displayMsgs = messages.slice(0, 5);

      return (
        <div className="w-full h-full p-3 rounded-xl bg-black border border-emerald-500/40 font-mono flex flex-col justify-between overflow-hidden shadow-2xl select-none">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5 mb-2 text-[10px] text-emerald-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span>root@live:~$ /chat</span>
            </div>
            <span className="text-[9px] text-emerald-500/70">[TTY_01]</span>
          </div>
          <div className="flex-1 flex flex-col justify-end space-y-1 overflow-hidden text-left">
            {!isOnline ? (
              <div className="text-xs text-emerald-500/60 font-mono italic text-center py-6 my-auto">err: live_desconectada</div>
            ) : displayMsgs.length === 0 ? (
              <div className="text-xs text-emerald-500/60 font-mono italic text-center py-6 my-auto">aguardando_mensagens...</div>
            ) : (
              displayMsgs.map((msg, i) => (
                <div key={i} className="text-xs leading-tight text-emerald-300 break-words">
                  <span className="text-emerald-500 font-bold">&gt; {msg.author || msg.username || msg.user}:</span> <span data-chat-text className="text-slate-200">{msg.text || msg.message}</span>
                </div>
              ))
            )}
          </div>
          <div className="pt-1.5 border-t border-emerald-500/20 text-[9px] text-emerald-500/80 flex items-center justify-between shrink-0">
            <span>{isOnline ? 'CONEXÃO ESTABELECIDA' : 'OFFLINE'}</span>
            <span className={`h-2 w-1.5 ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'} inline-block`} />
          </div>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Faixa Ticker de Rodapé',
    description: 'Formato horizontal de linha única para rodapés de tela com rolagem contínua de chat.',
    aspectRatio: '480x60',
    defaultWidth: 480,
    defaultHeight: 60,
    badge: 'Footer Ticker',
    render: ({ messages = [], isOnline = false }) => {
      const displayMsgs = messages.slice(0, 4);

      return (
        <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-purple-500/40 flex items-center justify-between shadow-xl select-none overflow-hidden">
          <div className="flex items-center gap-2 pr-3 border-r border-white/10 shrink-0">
            <MessageSquare className="h-4 w-4 text-purple-400 shrink-0" />
            <span className="text-[10px] font-mono font-bold text-white uppercase">CHAT</span>
          </div>
          <div className="flex-1 px-3 overflow-hidden text-left">
            {!isOnline ? (
              <span className="text-xs text-slate-500 font-mono italic">Live não conectada</span>
            ) : displayMsgs.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono italic">Aguardando mensagens do chat...</span>
            ) : (
              <div className="flex items-center gap-4 truncate">
                {displayMsgs.map((msg, i) => (
                  <span key={i} className="text-xs shrink-0 inline-flex items-center gap-1.5">
                    <span className="font-bold text-purple-300">{msg.author || msg.username || msg.user}:</span>
                    <span data-chat-text className="text-white">{msg.text || msg.message}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-purple-500 animate-ping' : 'bg-rose-500'} shrink-0`} />
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'Card Transparente Clean',
    description: 'Sem fundo pesado, texto branco nítido com sombra profunda projetada para sobrepor o jogo.',
    aspectRatio: '280x320',
    defaultWidth: 280,
    defaultHeight: 320,
    badge: 'Stream Clean',
    render: ({ messages = [], isOnline = false }) => {
      const displayMsgs = messages.slice(0, 5);

      return (
        <div className="w-full h-full p-2.5 flex flex-col justify-end overflow-hidden select-none text-left">
          <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 w-fit backdrop-blur-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-purple-400' : 'bg-rose-500'}`} />
            <span className="text-[9px] font-mono text-purple-200 font-bold uppercase">Chat ao vivo</span>
          </div>
          <div className="space-y-1.5">
            {!isOnline ? (
              <div className="text-xs text-slate-400 font-mono italic drop-shadow-md">Live não conectada</div>
            ) : displayMsgs.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono italic drop-shadow-md">Aguardando mensagens do chat...</div>
            ) : (
              displayMsgs.map((msg, i) => (
                <div key={i} className="text-xs leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                  <span className="font-extrabold text-purple-300 mr-1.5">{msg.author || msg.username || msg.user}:</span>
                  <span data-chat-text className="font-semibold text-white">{msg.text || msg.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '06',
    number: 6,
    name: 'Cyberpunk HUD Chanfrado',
    description: 'Cantos cortados em estilo mecha sci-fi com acentos ciano e magenta neon.',
    aspectRatio: '350x300',
    defaultWidth: 350,
    defaultHeight: 300,
    badge: 'Cyber HUD',
    render: ({ messages = [], isOnline = false }) => {
      const displayMsgs = messages.slice(0, 4);

      return (
        <div className="w-full h-full p-3 bg-slate-950/90 border-2 border-cyan-400 flex flex-col justify-between overflow-hidden shadow-2xl select-none text-left" style={{ clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))' }}>
          <div className="flex items-center justify-between border-b border-cyan-400/40 pb-1.5 mb-2 shrink-0">
            <span className="text-[10px] font-mono font-black text-cyan-300 tracking-widest uppercase">// CHAT_STREAM_FEED</span>
            <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 px-1.5 border border-cyan-500/40">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <div className="flex-1 flex flex-col justify-end space-y-1.5 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-rose-400 font-mono italic text-center py-6 my-auto">[STATUS: OFFLINE]</div>
            ) : displayMsgs.length === 0 ? (
              <div className="text-xs text-cyan-400/60 font-mono italic text-center py-6 my-auto">[AGUARDANDO STREAM DATA...]</div>
            ) : (
              displayMsgs.map((msg, i) => (
                <div key={i} className="bg-cyan-950/40 border-l-2 border-cyan-400 pl-2 py-1 text-xs text-slate-100">
                  <span className="font-mono font-bold text-pink-400 mr-1.5">[{msg.author || msg.username || msg.user}]</span>
                  <span data-chat-text>{msg.text || msg.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Esports Broadcast Box',
    description: 'Header sólido e marcante com tipografia forte inspirada em torneios de esports.',
    aspectRatio: '340x260',
    defaultWidth: 340,
    defaultHeight: 260,
    badge: 'Esports',
    render: ({ messages = [], isOnline = false }) => {
      const displayMsgs = messages.slice(0, 4);

      return (
        <div className="w-full h-full rounded-xl bg-slate-900 border border-slate-700 flex flex-col overflow-hidden shadow-2xl select-none text-left">
          <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-3 py-1.5 flex items-center justify-between text-white shrink-0">
            <span className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <Tv className="h-3.5 w-3.5" /> LIVE CHAT BROADCAST
            </span>
            <span className="text-[9px] font-mono font-bold bg-black/40 px-2 py-0.5 rounded">{isOnline ? 'AO VIVO' : 'OFFLINE'}</span>
          </div>
          <div className="p-3 flex-1 flex flex-col justify-end space-y-1.5 bg-slate-950/80 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-4 my-auto">Live não conectada</div>
            ) : displayMsgs.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-4 my-auto">Aguardando mensagens do chat...</div>
            ) : (
              displayMsgs.map((msg, i) => (
                <div key={i} className="text-xs py-1 border-b border-white/5 last:border-0">
                  <span className="font-bold text-indigo-400 mr-1.5">{msg.author || msg.username || msg.user}:</span>
                  <span data-chat-text className="text-slate-200">{msg.text || msg.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Coluna Vertical Minimalista',
    description: 'Design estreito sem cartões pesados, com divisores finos e foco na leitura rápida.',
    aspectRatio: '260x360',
    defaultWidth: 260,
    defaultHeight: 360,
    badge: 'Vertical Minimal',
    render: ({ messages = [], isOnline = false }) => {
      const displayMsgs = messages.slice(0, 5);

      return (
        <div className="w-full h-full p-3 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col justify-between overflow-hidden shadow-lg select-none text-left">
          <div className="flex items-center gap-1.5 pb-2 border-b border-white/10 mb-2 shrink-0">
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-purple-400' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Chat Feed</span>
          </div>
          <div className="flex-1 flex flex-col justify-end space-y-2 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6 my-auto">Live não conectada</div>
            ) : displayMsgs.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6 my-auto">Aguardando mensagens...</div>
            ) : (
              displayMsgs.map((msg, i) => (
                <div key={i} className="text-xs pb-1 border-b border-white/5 last:border-0">
                  <div className="text-[10px] font-bold text-purple-400 font-mono">{msg.author || msg.username || msg.user}</div>
                  <div data-chat-text className="text-slate-300 leading-snug">{msg.text || msg.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '09',
    number: 9,
    name: 'Dark Glass com Glow Neon',
    description: 'Estética com profundidade e glow lilás projetado nas bordas com fundo ultra-escuro.',
    aspectRatio: '340x310',
    defaultWidth: 340,
    defaultHeight: 310,
    badge: 'Neon Glow',
    render: ({ messages = [], isOnline = false }) => {
      const displayMsgs = messages.slice(0, 4);

      return (
        <div className="w-full h-full p-3.5 rounded-2xl bg-black/85 border border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.18)] flex flex-col justify-between overflow-hidden select-none text-left">
          <div className="flex items-center justify-between pb-2 border-b border-purple-500/20 mb-2 shrink-0">
            <span className="text-[11px] font-black text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" /> NEON STREAM CHAT
            </span>
            <span className="text-[9px] font-mono text-purple-400">{isOnline ? '#LIVE' : '#OFFLINE'}</span>
          </div>
          <div className="flex-1 flex flex-col justify-end space-y-2 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6 my-auto">Live não conectada</div>
            ) : displayMsgs.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6 my-auto">Aguardando mensagens do chat...</div>
            ) : (
              displayMsgs.map((msg, i) => (
                <div key={i} className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs">
                  <span className="font-bold text-purple-300 block mb-0.5">{msg.author || msg.username || msg.user}</span>
                  <span data-chat-text className="text-slate-100">{msg.text || msg.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '10',
    number: 10,
    name: 'Pills Flutuantes Desconectadas',
    description: 'Mensagens renderizadas como pílulas individuais flutuantes com sombras suaves.',
    aspectRatio: '330x320',
    defaultWidth: 330,
    defaultHeight: 320,
    badge: 'Floating Pills',
    render: ({ messages = [], isOnline = false }) => {
      const displayMsgs = messages.slice(0, 4);

      return (
        <div className="w-full h-full p-2 flex flex-col justify-end space-y-2 overflow-hidden select-none text-left">
          {!isOnline ? (
            <div className="text-xs text-slate-500 font-mono italic text-center py-6 my-auto">Live não conectada</div>
          ) : displayMsgs.length === 0 ? (
            <div className="text-xs text-slate-500 font-mono italic text-center py-6 my-auto">Aguardando mensagens...</div>
          ) : (
            displayMsgs.map((msg, i) => (
              <div key={i} className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 shadow-lg text-xs backdrop-blur-md flex items-center gap-2 max-w-full min-w-0">
                <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0" />
                <span className="font-bold text-purple-300 shrink-0">{msg.author || msg.username || msg.user}:</span>
                <span data-chat-text className="text-white">{msg.text || msg.message}</span>
              </div>
            ))
          )}
        </div>
      );
    }
  }
];
