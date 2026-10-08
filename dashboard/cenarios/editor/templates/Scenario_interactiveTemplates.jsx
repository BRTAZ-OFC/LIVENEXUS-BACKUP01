import React from 'react';
import { Vote, Gift, Flame, Trophy, Crown } from 'lucide-react';

export const CHATTER_LEADERBOARD_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Podium dos 3 Primeiros',
    description: 'Design em estilo pódio com medalhas para o Top 3 chatters.',
    aspectRatio: '320x220',
    defaultWidth: 320,
    defaultHeight: 220,
    badge: 'Podium 1-2-3',
    render: ({ chatters = [], isOnline = false }) => {
      const list = chatters.slice(0, 3);

      return (
        <div className="w-full h-full p-3 rounded-none bg-slate-950/90 flex flex-col justify-between select-none text-left shadow-xl overflow-hidden">
          <div className="text-[10px] font-mono font-bold text-purple-300 uppercase pb-1.5 border-b border-white/10 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-amber-400" /> TOP CHATTERS</span>
            <span className="text-[9px] text-slate-400">{isOnline ? 'AO VIVO' : 'OFFLINE'}</span>
          </div>
          <div className="flex-1 flex flex-col justify-end space-y-1.5 py-1">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-4">Live não conectada</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-4">Aguardando mensagens do chat...</div>
            ) : (
              list.map((c, i) => (
                <div key={i} className="p-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`h-5 w-5 rounded-full font-mono font-black text-[10px] flex items-center justify-center shrink-0 ${i === 0 ? 'bg-amber-400 text-black' : i === 1 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white'}`}>
                      {i + 1}
                    </span>
                    <span className="font-bold text-white truncate">{c.author || c.username || c.user}</span>
                  </div>
                  <span className="font-mono text-purple-300 font-bold shrink-0">{c.count} msgs</span>
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
    name: 'Tabela de Classificação Esports',
    description: 'Tabela de ranking para os participantes mais ativos.',
    aspectRatio: '280x260',
    defaultWidth: 280,
    defaultHeight: 260,
    badge: 'Esports Rank',
    render: ({ chatters = [], isOnline = false }) => {
      const list = chatters.slice(0, 4);

      return (
        <div className="w-full h-full p-3 rounded-xl bg-black/85 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg overflow-hidden">
          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase pb-1 border-b border-white/10">CLASSIFICAÇÃO DO CHAT</span>
          <div className="flex-1 flex flex-col justify-end space-y-1 my-1 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-4">Live offline</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-4">Aguardando mensagens...</div>
            ) : (
              list.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-white/5 last:border-0">
                  <span className="truncate pr-2 text-slate-200"><span className="font-mono font-bold text-cyan-400 mr-1.5">#{i + 1}</span>{c.author || c.username || c.user}</span>
                  <span className="font-mono text-slate-400 shrink-0">{c.count} msgs</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Cards Horizontais com Barras',
    description: 'Cards individuais com barras proporcionais de mensagens.',
    aspectRatio: '300x240',
    defaultWidth: 300,
    defaultHeight: 240,
    badge: 'Horizontal Bars',
    render: ({ chatters = [], isOnline = false }) => {
      const list = chatters.slice(0, 3);
      const maxCount = list[0]?.count || 1;

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase">ENGAJAMENTO DE CHAT</span>
          <div className="space-y-2 my-auto">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center">Live não conectada</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center">Aguardando mensagens do chat...</div>
            ) : (
              list.map((c, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white truncate">{i + 1}. {c.author || c.username || c.user}</span>
                    <span className="font-mono text-purple-300 text-[10px]">{c.count} msgs</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Lista Minimalista com Badges',
    description: 'Design minimalista sem caixas pesadas.',
    aspectRatio: '250x240',
    defaultWidth: 250,
    defaultHeight: 240,
    badge: 'Minimal Badges',
    render: ({ chatters = [], isOnline = false }) => {
      const list = chatters.slice(0, 3);

      return (
        <div className="w-full h-full p-3 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col justify-between select-none text-left">
          <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">CHATTERS ATIVOS</span>
          <div className="space-y-2 my-auto">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic">Live não conectada</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic">Aguardando mensagens...</div>
            ) : (
              list.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white truncate">{c.author || c.username || c.user}</span>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded">{c.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'Cyberpunk HUD Ranking',
    description: 'Interface sci-fi com display de pontuação.',
    aspectRatio: '300x220',
    defaultWidth: 300,
    defaultHeight: 220,
    badge: 'Cyber Rank',
    render: ({ chatters = [], isOnline = false }) => {
      const list = chatters.slice(0, 3);

      return (
        <div className="w-full h-full p-3 bg-slate-950/90 border border-cyan-400 flex flex-col justify-between select-none text-left shadow-xl" style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
          <div className="flex justify-between text-[8px] font-mono text-cyan-300 border-b border-cyan-400/30 pb-1">
            <span>[TOP_CHATTERS_DB]</span>
            <span>{isOnline ? 'LIVE' : 'OFF'}</span>
          </div>
          <div className="space-y-1 my-auto">
            {!isOnline ? (
              <div className="text-xs text-rose-400 font-mono italic text-center py-4">[STATUS: OFFLINE]</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-cyan-400/60 font-mono italic text-center py-4">[AGUARDANDO MENSAGENS]</div>
            ) : (
              list.map((c, i) => (
                <div key={i} className="bg-cyan-950/30 border-l-2 border-cyan-400 pl-2 py-0.5 text-xs flex justify-between">
                  <span className="font-mono text-white truncate"><span className="text-pink-400 font-bold mr-1">#{i + 1}</span>{c.author || c.username || c.user}</span>
                  <span className="font-mono text-cyan-300 text-[10px]">{c.count}</span>
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
    name: 'Medalhão do Campeão Atual',
    description: 'Destaque absoluto no chatter #1 com coroa.',
    aspectRatio: '240x140',
    defaultWidth: 240,
    defaultHeight: 140,
    badge: 'MVP Chatter',
    render: ({ chatters = [], isOnline = false }) => {
      const top = chatters[0];

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-amber-500/40 flex flex-col items-center justify-center select-none text-center shadow-xl">
          <Crown className="h-6 w-6 text-amber-400 mb-1 animate-bounce" />
          <span className="text-[8px] font-mono text-amber-300 uppercase font-bold">TOP CHATTER #1</span>
          <span className="text-sm font-black text-white truncate max-w-[90%] my-0.5">{top ? (top.author || top.username || top.user) : (isOnline ? 'Aguardando chat...' : 'Live offline')}</span>
          <span className="text-[10px] font-mono text-slate-400">{top ? `${top.count} mensagens enviadas` : (isOnline ? '0 mensagens' : 'Offline')}</span>
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Pills Flutuantes de Ranking',
    description: 'Pílulas arredondadas com posições.',
    aspectRatio: '280x200',
    defaultWidth: 280,
    defaultHeight: 200,
    badge: 'Rank Pills',
    render: ({ chatters = [], isOnline = false }) => {
      const list = chatters.slice(0, 3);

      return (
        <div className="w-full h-full p-2 flex flex-col justify-end space-y-1.5 select-none text-left">
          {!isOnline ? (
            <div className="text-xs text-slate-500 font-mono italic text-center py-6">Live não conectada</div>
          ) : list.length === 0 ? (
            <div className="text-xs text-slate-500 font-mono italic text-center py-6">Aguardando mensagens...</div>
          ) : (
            list.map((c, i) => (
              <div key={i} className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 shadow-md text-xs flex items-center justify-between">
                <span className="font-bold text-white truncate"><span className="text-purple-400 mr-1.5 font-mono">#{i + 1}</span>{c.author || c.username || c.user}</span>
                <span className="text-[10px] font-mono text-slate-400">{c.count}</span>
              </div>
            ))
          )}
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Dark Glass Glow Roxo',
    description: 'Vidro fumê escuro com iluminação nas bordas.',
    aspectRatio: '280x210',
    defaultWidth: 280,
    defaultHeight: 210,
    badge: 'Glass Rank',
    render: ({ chatters = [], isOnline = false }) => {
      const list = chatters.slice(0, 3);

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.18)] flex flex-col justify-between select-none text-left">
          <span className="text-[9px] font-mono text-purple-300 uppercase font-bold">LÍDERES DE CHAT</span>
          <div className="space-y-1.5 my-auto">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-4">Live offline</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-4">Aguardando mensagens...</div>
            ) : (
              list.map((c, i) => (
                <div key={i} className="p-1.5 rounded-lg bg-white/5 flex justify-between text-xs">
                  <span className="font-bold text-white truncate">{i + 1}. {c.author || c.username || c.user}</span>
                  <span className="text-purple-300 font-mono text-[10px]">{c.count} msgs</span>
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
    name: 'Lower Third de Ranking',
    description: 'Faixa de rodapé destacando os maiores chatters.',
    aspectRatio: '380x50',
    defaultWidth: 380,
    defaultHeight: 50,
    badge: 'Lower Rank',
    render: ({ chatters = [], isOnline = false }) => {
      const list = chatters.slice(0, 2);

      return (
        <div className="w-full h-full px-3.5 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div className="flex items-center gap-1.5 pr-2 border-r border-white/10 text-purple-400">
            <Trophy className="h-4 w-4" />
            <span className="text-[8px] font-mono font-bold uppercase text-white">TOP:</span>
          </div>
          <div className="flex-1 px-2 truncate">
            {!isOnline ? (
              <span className="text-xs text-slate-500 font-mono italic">Live não conectada</span>
            ) : list.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono italic">Aguardando mensagens...</span>
            ) : (
              <div className="flex gap-3 text-xs truncate">
                {list.map((c, i) => (
                  <span key={i} className="truncate">
                    <span className="text-purple-400 font-mono font-bold mr-1">#{i + 1}</span>
                    <span className="font-bold text-white">{c.author || c.username || c.user}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '10',
    number: 10,
    name: 'Placa Esports Leaderboard',
    description: 'Estilo campeonato com cabeçalho vermelho.',
    aspectRatio: '280x240',
    defaultWidth: 280,
    defaultHeight: 240,
    badge: 'Esports Board',
    render: ({ chatters = [], isOnline = false }) => {
      const list = chatters.slice(0, 4);

      return (
        <div className="w-full h-full rounded-xl bg-slate-950 border border-slate-700 flex flex-col overflow-hidden select-none text-left shadow-2xl">
          <div className="bg-gradient-to-r from-red-600 to-indigo-700 px-3 py-1 text-xs font-black text-white uppercase flex justify-between shrink-0">
            <span>LEADERBOARD</span>
            <span>{isOnline ? 'LIVE' : 'OFF'}</span>
          </div>
          <div className="p-3 flex-1 flex flex-col justify-end space-y-1 overflow-hidden">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6">Live não conectada</div>
            ) : list.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center py-6">Aguardando mensagens...</div>
            ) : (
              list.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-white/5 last:border-0">
                  <span className="font-bold text-white truncate"><span className="text-red-400 mr-1 font-mono">#{i + 1}</span>{c.author || c.username || c.user}</span>
                  <span className="text-[10px] font-mono text-slate-400">{c.count} msgs</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  }
];

export const POLL_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Card de Votação com Barras Horizontais',
    description: 'Pergunta destacada com barras de porcentagem para cada opção.',
    aspectRatio: '320x220',
    defaultWidth: 320,
    defaultHeight: 220,
    badge: 'Classic Poll',
    render: ({ question = 'Pergunta da enquete', options = [], votesMap = {} }) => {
      const totalVotes = Object.values(votesMap).reduce((a, b) => a + Number(b || 0), 0);

      return (
        <div className="w-full h-full p-3 rounded-none bg-slate-950/90 flex flex-col justify-between select-none text-left shadow-xl">
          <div className="flex items-center gap-1.5 pb-1 border-b border-white/10">
            <Vote className="h-4 w-4 text-purple-400" />
            <span className="text-[9px] font-mono font-bold text-purple-300 uppercase">ENQUETE AO VIVO</span>
          </div>
          <div className="text-xs font-bold text-white my-1">{question}</div>
          <div className="space-y-1.5 my-auto">
            {options.map((opt, i) => {
              const count = Number(votesMap[opt.label] || votesMap[i + 1] || 0);
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={i} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-200 truncate">{opt.label || i + 1} - {opt.text}</span>
                    <span className="font-mono text-cyan-300 text-[10px]">{pct}% ({count})</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <span className="text-[8.5px] font-mono text-slate-400 text-right">{totalVotes} votos registrados (digite !voto [número] no chat)</span>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Cards em Grade 2x2',
    description: 'Opções dispostas em blocos de toque.',
    aspectRatio: '300x200',
    defaultWidth: 300,
    defaultHeight: 200,
    badge: 'Grid Poll',
    render: ({ question = 'Pergunta da enquete', options = [], votesMap = {} }) => {
      const totalVotes = Object.values(votesMap).reduce((a, b) => a + Number(b || 0), 0);

      return (
        <div className="w-full h-full p-3 rounded-xl bg-black/85 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg">
          <span className="text-xs font-bold text-white truncate">{question}</span>
          <div className="grid grid-cols-2 gap-1.5 my-auto">
            {options.map((opt, i) => {
              const count = Number(votesMap[opt.label] || votesMap[i + 1] || 0);
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col justify-between">
                  <span className="text-xs font-bold text-white truncate">{opt.label || i + 1}. {opt.text}</span>
                  <span className="text-xs font-mono font-black text-cyan-400 mt-1">{pct}%</span>
                </div>
              );
            })}
          </div>
          <span className="text-[8px] font-mono text-slate-500">{totalVotes} votos</span>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Pills Flutuantes com Porcentagem',
    description: 'Pílulas arredondadas com barra de progresso embutida.',
    aspectRatio: '320x210',
    defaultWidth: 320,
    defaultHeight: 210,
    badge: 'Pill Poll',
    render: ({ question = 'Pergunta da enquete', options = [], votesMap = {} }) => {
      const totalVotes = Object.values(votesMap).reduce((a, b) => a + Number(b || 0), 0);

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex flex-col justify-between select-none text-left shadow-xl">
          <div className="text-xs font-bold text-purple-300 truncate">{question}</div>
          <div className="space-y-1.5 my-auto">
            {options.map((opt, i) => {
              const count = Number(votesMap[opt.label] || votesMap[i + 1] || 0);
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={i} className="px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 flex justify-between items-center text-xs">
                  <span className="text-white truncate">{opt.label || i + 1}. {opt.text}</span>
                  <span className="font-mono text-purple-300 font-bold">{pct}%</span>
                </div>
              );
            })}
          </div>
          <span className="text-[8px] font-mono text-slate-500 text-right">{totalVotes} votos totais</span>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Cyberpunk HUD Poll',
    description: 'Interface mecha com dados de votação em tempo real.',
    aspectRatio: '330x220',
    defaultWidth: 330,
    defaultHeight: 220,
    badge: 'Cyber Poll',
    render: ({ question = 'Pergunta da enquete', options = [], votesMap = {} }) => {
      const totalVotes = Object.values(votesMap).reduce((a, b) => a + Number(b || 0), 0);

      return (
        <div className="w-full h-full p-3 bg-slate-950/95 border border-cyan-400 flex flex-col justify-between select-none text-left shadow-2xl" style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
          <div className="flex justify-between text-[8px] font-mono text-cyan-300 border-b border-cyan-400/30 pb-0.5">
            <span>// CHAT_VOTING_SUBSYSTEM</span>
            <span>VOTES: {totalVotes}</span>
          </div>
          <div className="text-xs font-mono font-bold text-pink-400 truncate my-1">&gt; {question}</div>
          <div className="space-y-1 my-auto">
            {options.map((opt, i) => {
              const count = Number(votesMap[opt.label] || votesMap[i + 1] || 0);
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={i} className="bg-cyan-950/40 p-1 rounded border-l-2 border-cyan-400 flex justify-between text-xs">
                  <span className="text-slate-200 truncate">[{opt.label || i + 1}] {opt.text}</span>
                  <span className="font-mono text-cyan-300 font-bold">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'Minimalista Clean',
    description: 'Texto puro com percentuais e layout discreto.',
    aspectRatio: '260x200',
    defaultWidth: 260,
    defaultHeight: 200,
    badge: 'Clean Poll',
    render: ({ question = 'Pergunta da enquete', options = [], votesMap = {} }) => {
      const totalVotes = Object.values(votesMap).reduce((a, b) => a + Number(b || 0), 0);

      return (
        <div className="w-full h-full p-3 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col justify-between select-none text-left">
          <span className="text-xs font-bold text-white">{question}</span>
          <div className="space-y-1.5 my-auto">
            {options.map((opt, i) => {
              const count = Number(votesMap[opt.label] || votesMap[i + 1] || 0);
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={i} className="flex justify-between text-xs py-0.5 border-b border-white/5">
                  <span className="text-slate-300 truncate">{opt.label || i + 1}. {opt.text}</span>
                  <span className="font-mono text-purple-300 font-bold">{pct}%</span>
                </div>
              );
            })}
          </div>
          <span className="text-[8px] font-mono text-slate-500">{totalVotes} votos</span>
        </div>
      );
    }
  },
  {
    id: '06',
    number: 6,
    name: 'Dark Glass com Glow Neon',
    description: 'Vidro escuro translúcido com luzes roxas.',
    aspectRatio: '300x220',
    defaultWidth: 300,
    defaultHeight: 220,
    badge: 'Glass Poll',
    render: ({ question = 'Pergunta da enquete', options = [], votesMap = {} }) => {
      const totalVotes = Object.values(votesMap).reduce((a, b) => a + Number(b || 0), 0);

      return (
        <div className="w-full h-full p-3.5 rounded-2xl bg-black/85 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.18)] flex flex-col justify-between select-none text-left">
          <span className="text-xs font-bold text-purple-200 truncate">{question}</span>
          <div className="space-y-1.5 my-auto">
            {options.map((opt, i) => {
              const count = Number(votesMap[opt.label] || votesMap[i + 1] || 0);
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={i} className="p-1.5 rounded-xl bg-purple-950/40 border border-purple-500/20 flex justify-between text-xs">
                  <span className="text-white truncate">{opt.label || i + 1}. {opt.text}</span>
                  <span className="font-mono text-cyan-300 font-bold">{pct}%</span>
                </div>
              );
            })}
          </div>
          <span className="text-[8px] font-mono text-slate-400 text-right">{totalVotes} votos</span>
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Esports Match Votação',
    description: 'Placa angular vermelha para previsões de partidas.',
    aspectRatio: '300x220',
    defaultWidth: 300,
    defaultHeight: 220,
    badge: 'Match Vote',
    render: ({ question = 'Pergunta da enquete', options = [], votesMap = {} }) => {
      const totalVotes = Object.values(votesMap).reduce((a, b) => a + Number(b || 0), 0);

      return (
        <div className="w-full h-full rounded-xl bg-slate-950 border border-slate-700 flex flex-col overflow-hidden select-none text-left shadow-2xl">
          <div className="bg-gradient-to-r from-red-600 to-indigo-700 px-3 py-1 text-xs font-black text-white uppercase flex justify-between shrink-0">
            <span>VOTAÇÃO AO VIVO</span>
            <span>{totalVotes} VOTOS</span>
          </div>
          <div className="p-3 flex-1 flex flex-col justify-between">
            <span className="text-xs font-bold text-white truncate">{question}</span>
            <div className="space-y-1 my-auto">
              {options.map((opt, i) => {
                const count = Number(votesMap[opt.label] || votesMap[i + 1] || 0);
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                return (
                  <div key={i} className="flex justify-between items-center text-xs p-1 rounded bg-white/5">
                    <span className="text-slate-200 truncate"><span className="text-red-400 font-bold mr-1 font-mono">[{opt.label || i + 1}]</span>{opt.text}</span>
                    <span className="font-mono text-white font-bold">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Faixa Horizontal de Enquete',
    description: 'Faixa única estendida para encaixar em rodapé.',
    aspectRatio: '420x55',
    defaultWidth: 420,
    defaultHeight: 55,
    badge: 'Lower Poll',
    render: ({ question = 'Pergunta da enquete', options = [], votesMap = {} }) => {
      const totalVotes = Object.values(votesMap).reduce((a, b) => a + Number(b || 0), 0);

      return (
        <div className="w-full h-full px-3.5 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div className="flex items-center gap-1.5 pr-2 border-r border-white/10 text-purple-400 shrink-0">
            <Vote className="h-4 w-4" />
            <span className="text-[9px] font-mono font-bold text-white uppercase truncate max-w-[120px]">{question}</span>
          </div>
          <div className="flex-1 px-2 flex gap-3 text-xs truncate">
            {options.map((opt, i) => {
              const count = Number(votesMap[opt.label] || votesMap[i + 1] || 0);
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <span key={i} className="truncate">
                  <span className="font-bold text-white">{opt.label || i + 1}:</span> <span className="text-cyan-300 font-mono font-bold">{pct}%</span>
                </span>
              );
            })}
          </div>
        </div>
      );
    }
  },
  {
    id: '09',
    number: 9,
    name: 'Medalhão de Destaque da Enquete',
    description: 'Destaque visual na opção mais votada.',
    aspectRatio: '280x190',
    defaultWidth: 280,
    defaultHeight: 190,
    badge: 'Leader Highlight',
    render: ({ question = 'Pergunta da enquete', options = [], votesMap = {} }) => {
      const totalVotes = Object.values(votesMap).reduce((a, b) => a + Number(b || 0), 0);

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-xs font-bold text-white truncate">{question}</span>
          <div className="space-y-1 my-auto">
            {options.map((opt, i) => {
              const count = Number(votesMap[opt.label] || votesMap[i + 1] || 0);
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-slate-300 truncate">{opt.label || i + 1}. {opt.text}</span>
                  <span className="font-mono text-purple-300 font-bold">{pct}%</span>
                </div>
              );
            })}
          </div>
          <span className="text-[8px] font-mono text-slate-400">{totalVotes} votos no chat</span>
        </div>
      );
    }
  },
  {
    id: '10',
    number: 10,
    name: 'Placa Compacta de Votação',
    description: 'Design sólido em placa de alumínio escuro.',
    aspectRatio: '260x170',
    defaultWidth: 260,
    defaultHeight: 170,
    badge: 'Solid Plate',
    render: ({ question = 'Pergunta da enquete', options = [], votesMap = {} }) => {
      const totalVotes = Object.values(votesMap).reduce((a, b) => a + Number(b || 0), 0);

      return (
        <div className="w-full h-full p-3 rounded-xl bg-slate-900 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg">
          <span className="text-xs font-bold text-white truncate">{question}</span>
          <div className="space-y-1 my-auto">
            {options.map((opt, i) => {
              const count = Number(votesMap[opt.label] || votesMap[i + 1] || 0);
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span className="text-slate-300 truncate">[{opt.label || i + 1}] {opt.text}</span>
                  <span className="font-mono text-white font-bold">{pct}%</span>
                </div>
              );
            })}
          </div>
          <span className="text-[8px] font-mono text-slate-500">{totalVotes} votos</span>
        </div>
      );
    }
  }
];

export const RAFFLE_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Card de Sorteio com Contador de Participantes',
    description: 'Card central com contagem de inscritos e botão de sorteio.',
    aspectRatio: '300x180',
    defaultWidth: 300,
    defaultHeight: 180,
    badge: 'Classic Raffle',
    render: ({ participants = [], winner = null, isOnline = false }) => {
      return (
        <div className="w-full h-full p-3.5 rounded-none bg-slate-950/90 flex flex-col justify-between select-none text-center shadow-xl">
          <div className="flex items-center justify-center gap-1.5 text-purple-300 font-mono text-[9px] font-bold uppercase">
            <Gift className="h-4 w-4 text-purple-400" /> SORTEIO DO CHAT
          </div>
          <div className="my-auto">
            {winner ? (
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/50">
                <span className="text-[8px] font-mono text-amber-300 font-bold uppercase block">VENCEDOR</span>
                <span className="text-base font-black text-white block truncate">{winner}</span>
              </div>
            ) : (
              <div>
                <span className="text-3xl font-mono font-black text-white block">{participants.length}</span>
                <span className="text-[9px] font-mono text-slate-400 block">{isOnline ? 'Participantes no sorteio' : 'Live não conectada'}</span>
              </div>
            )}
          </div>
          <span className="text-[8px] font-mono text-purple-300">{winner ? 'Sorteio finalizado' : 'Digite !entrar no chat para participar'}</span>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Pill Compacta de Sorteio',
    description: 'Pílula horizontal minimalista com contagem de participantes.',
    aspectRatio: '220x45',
    defaultWidth: 220,
    defaultHeight: 45,
    badge: 'Raffle Pill',
    render: ({ participants = [], winner = null }) => {
      return (
        <div className="w-full h-full px-3.5 rounded-full bg-slate-900/90 border border-purple-500/40 flex items-center justify-between select-none shadow-md">
          <div className="flex items-center gap-1.5">
            <Gift className="h-4 w-4 text-purple-400 shrink-0" />
            <span className="text-[9px] font-mono font-bold text-purple-300">SORTEIO:</span>
          </div>
          <span className="text-xs font-mono font-black text-white truncate max-w-[100px]">{winner || `${participants.length} inscritos`}</span>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Radial Circular de Sorteio',
    description: 'Medalhão redondo central.',
    aspectRatio: '150x150',
    defaultWidth: 150,
    defaultHeight: 150,
    badge: 'Raffle Ring',
    render: ({ participants = [], winner = null }) => {
      return (
        <div className="w-full h-full rounded-full bg-slate-950/90 border border-purple-500/40 p-2 flex flex-col items-center justify-center select-none text-center shadow-xl aspect-square">
          <Gift className="h-5 w-5 text-purple-400 mb-1" />
          <span className="text-xl font-black text-white font-mono leading-none">{winner || participants.length}</span>
          <span className="text-[7.5px] font-mono text-purple-300 uppercase mt-1">{winner ? 'GANHADOR' : 'INSCRITOS'}</span>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Cyberpunk HUD Raffle',
    description: 'Interface sci-fi para sorteios.',
    aspectRatio: '300x160',
    defaultWidth: 300,
    defaultHeight: 160,
    badge: 'Cyber Raffle',
    render: ({ participants = [], winner = null, isOnline = false }) => {
      return (
        <div className="w-full h-full p-3 bg-slate-950/95 border border-cyan-400 flex flex-col justify-between select-none text-left shadow-2xl" style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
          <div className="flex justify-between text-[8px] font-mono text-cyan-300 border-b border-cyan-400/30 pb-0.5">
            <span>// RAFFLE_RANDOMIZER</span>
            <span>{isOnline ? 'ACTIVE' : 'OFF'}</span>
          </div>
          <div className="my-auto text-center">
            {winner ? (
              <span className="text-sm font-mono font-black text-pink-400">&gt; VENCEDOR: {winner}</span>
            ) : (
              <span className="text-xl font-mono font-black text-white">{participants.length} TICKETS</span>
            )}
          </div>
          <span className="text-[7.5px] font-mono text-slate-500">{isOnline ? 'COMANDO: !entrar' : 'STATUS: OFFLINE'}</span>
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'Dark Glass Glow',
    description: 'Vidro fumê escuro com iluminação roxa.',
    aspectRatio: '260x150',
    defaultWidth: 260,
    defaultHeight: 150,
    badge: 'Dark Glass',
    render: ({ participants = [], winner = null }) => {
      return (
        <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.18)] flex flex-col items-center justify-center select-none text-center">
          <Gift className="h-6 w-6 text-purple-400 mb-1" />
          <span className="text-[8px] font-mono text-purple-300 uppercase font-bold">SORTEIO</span>
          <span className="text-xl font-black text-white font-mono my-0.5">{winner || `${participants.length} participantes`}</span>
        </div>
      );
    }
  },
  {
    id: '06',
    number: 6,
    name: 'Lower Third Horizontal',
    description: 'Faixa estendida de rodapé com informações do sorteio.',
    aspectRatio: '360x48',
    defaultWidth: 360,
    defaultHeight: 48,
    badge: 'Lower Raffle',
    render: ({ participants = [], winner = null }) => {
      return (
        <div className="w-full h-full px-3.5 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-purple-400" />
            <span className="text-[9px] font-mono font-bold text-purple-300 uppercase">SORTEIO:</span>
          </div>
          <span className="text-xs font-mono font-black text-white">{winner ? `Ganhador: ${winner}` : `${participants.length} participantes (!entrar)`}</span>
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Card de Caixa Misteriosa',
    description: 'Design lúdico temático de drop e prêmios.',
    aspectRatio: '240x160',
    defaultWidth: 240,
    defaultHeight: 160,
    badge: 'Mystery Box',
    render: ({ participants = [], winner = null }) => {
      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-900 border border-amber-500/40 flex flex-col items-center justify-center select-none text-center shadow-xl">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-1.5">
            <Gift className="h-5 w-5" />
          </div>
          <span className="text-xs font-black text-white">{winner ? `VENCEDOR: ${winner}` : `${participants.length} NO SORTEIO`}</span>
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Split Box com Header',
    description: 'Header com corpo numérico de alto contraste.',
    aspectRatio: '240x150',
    defaultWidth: 240,
    defaultHeight: 150,
    badge: 'Split Box',
    render: ({ participants = [], winner = null }) => {
      return (
        <div className="w-full h-full rounded-xl bg-slate-950 border border-white/10 flex flex-col overflow-hidden select-none text-left shadow-xl">
          <div className="px-3 py-1.5 bg-purple-950/60 text-[9px] font-mono font-bold text-purple-300 uppercase flex justify-between items-center">
            <span>SORTEIO</span>
            <Gift className="h-3.5 w-3.5" />
          </div>
          <div className="p-3 flex-1 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black text-white font-mono">{winner || participants.length}</span>
            <span className="text-[8px] font-mono text-slate-400 mt-1">{winner ? 'VENCEDOR' : 'PARTICIPANTES'}</span>
          </div>
        </div>
      );
    }
  },
  {
    id: '09',
    number: 9,
    name: 'Placa Esports Sorteio',
    description: 'Estilo campeonato.',
    aspectRatio: '260x140',
    defaultWidth: 260,
    defaultHeight: 140,
    badge: 'Esports Raffle',
    render: ({ participants = [], winner = null }) => {
      return (
        <div className="w-full h-full p-2.5 rounded-lg bg-slate-900 border-l-4 border-amber-400 border-t border-b border-r border-white/10 flex flex-col justify-between select-none text-left shadow-md">
          <span className="text-[8px] font-mono text-amber-300 uppercase font-bold">SORTEIO DA COMUNIDADE</span>
          <div className="text-lg font-black text-white font-mono my-auto">{winner ? `GANHADOR: ${winner}` : `${participants.length} INSCRITOS`}</div>
          <span className="text-[7.5px] font-mono text-slate-400">DIGITE !entrar NO CHAT</span>
        </div>
      );
    }
  },
  {
    id: '10',
    number: 10,
    name: 'Badge em Diagonal 3D',
    description: 'Distintivo militar de sorteio.',
    aspectRatio: '240x130',
    defaultWidth: 240,
    defaultHeight: 130,
    badge: '3D Badge',
    render: ({ participants = [], winner = null }) => {
      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex items-center gap-3 select-none text-left shadow-lg">
          <div className="h-12 w-12 rounded-full bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
            <Gift className="h-6 w-6" />
          </div>
          <div className="truncate flex-1">
            <span className="text-[8px] font-mono text-purple-300 uppercase font-bold block">SORTEIO</span>
            <span className="text-sm font-black text-white truncate block">{winner || `${participants.length} participantes`}</span>
          </div>
        </div>
      );
    }
  }
];

export const SUB_TRAIN_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Trem de Subs Dinâmico Neon',
    description: 'Visual temático de trem de inscritos com nível e tempo restante.',
    aspectRatio: '320x100',
    defaultWidth: 320,
    defaultHeight: 100,
    badge: 'Hype Train',
    render: ({ isOnline = false }) => {
      return (
        <div className="w-full h-full p-3 rounded-none bg-slate-950/90 shadow-xl flex flex-col justify-between select-none text-left">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="font-bold text-purple-300 flex items-center gap-1.5"><Flame className="h-4 w-4 text-purple-400" /> TREM DO SUB</span>
            <span className="text-white font-bold">{isOnline ? 'NÍVEL 1' : 'OFFLINE'}</span>
          </div>
          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden my-1">
            <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full" style={{ width: isOnline ? '20%' : '0%' }} />
          </div>
          <span className="text-[8.5px] font-mono text-slate-400">{isOnline ? 'Apoie o canal para subir de nível' : 'Live não conectada'}</span>
        </div>
      );
    }
  },
  {
    id: '02',
    number: 2,
    name: 'Pill Compacta de Trem',
    description: 'Pílula horizontal com nível do trem.',
    aspectRatio: '200x45',
    defaultWidth: 200,
    defaultHeight: 45,
    badge: 'Train Pill',
    render: ({ isOnline = false }) => {
      return (
        <div className="w-full h-full px-3.5 rounded-full bg-slate-900/90 border border-purple-500/40 flex items-center justify-between select-none shadow-md">
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-purple-400" />
            <span className="text-[9px] font-mono font-bold text-purple-300">HYPE TRAIN</span>
          </div>
          <span className="text-xs font-mono font-black text-white">{isOnline ? 'LVL 1' : 'OFF'}</span>
        </div>
      );
    }
  },
  {
    id: '03',
    number: 3,
    name: 'Radial Circular de Trem',
    description: 'Anel redondo com nível do trem.',
    aspectRatio: '140x140',
    defaultWidth: 140,
    defaultHeight: 140,
    badge: 'Train Radial',
    render: ({ isOnline = false }) => {
      return (
        <div className="w-full h-full rounded-full bg-slate-950/90 border border-purple-500/40 p-2 flex flex-col items-center justify-center select-none text-center shadow-xl aspect-square">
          <Flame className="h-5 w-5 text-purple-400 mb-1" />
          <span className="text-xl font-black text-white font-mono leading-none">{isOnline ? 'LVL 1' : 'OFF'}</span>
          <span className="text-[7.5px] font-mono text-purple-300 uppercase mt-0.5">TREM DO SUB</span>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Cyberpunk HUD Train',
    description: 'Interface sci-fi com barra de boost.',
    aspectRatio: '300x100',
    defaultWidth: 300,
    defaultHeight: 100,
    badge: 'Cyber Train',
    render: ({ isOnline = false }) => {
      return (
        <div className="w-full h-full p-2.5 bg-black/90 border border-cyan-400 flex flex-col justify-between select-none text-left shadow-xl" style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
          <div className="flex justify-between text-[8px] font-mono text-cyan-300">
            <span>// HYPE_TRAIN_SUBSYSTEM</span>
            <span>{isOnline ? 'STATUS: ACTIVE' : 'STATUS: OFFLINE'}</span>
          </div>
          <div className="w-full h-1.5 bg-cyan-950 rounded-none overflow-hidden my-1">
            <div className="h-full bg-cyan-400" style={{ width: isOnline ? '25%' : '0%' }} />
          </div>
          <span className="text-[7.5px] font-mono text-slate-500">{isOnline ? 'TRANSMISSÃO AO VIVO' : 'DISCONNECTED'}</span>
        </div>
      );
    }
  },
  {
    id: '05',
    number: 5,
    name: 'Big Number com Nível',
    description: 'Destaque no nível atual.',
    aspectRatio: '200x95',
    defaultWidth: 200,
    defaultHeight: 95,
    badge: 'Big Train',
    render: ({ isOnline = false }) => {
      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/85 border border-purple-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[9px] font-mono text-purple-300 font-bold uppercase">TREM DO SUB</span>
          <div className="text-2xl font-black text-white font-mono my-0.5">{isOnline ? 'NÍVEL 1' : 'OFFLINE'}</div>
          <span className="text-[8px] font-mono text-slate-400">{isOnline ? 'Em andamento' : 'Live offline'}</span>
        </div>
      );
    }
  },
  {
    id: '06',
    number: 6,
    name: 'Dark Glass com Glow',
    description: 'Vidro fumê com glow nas bordas.',
    aspectRatio: '240x95',
    defaultWidth: 240,
    defaultHeight: 95,
    badge: 'Dark Glass',
    render: ({ isOnline = false }) => {
      return (
        <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.18)] flex items-center justify-between select-none text-left">
          <div>
            <span className="text-[8px] font-mono text-purple-300 uppercase font-bold block">TREM DO SUB</span>
            <span className="text-xl font-black text-white font-mono">{isOnline ? 'NÍVEL 1' : 'OFFLINE'}</span>
          </div>
          <Flame className="h-7 w-7 text-purple-400 animate-pulse" />
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Lower Third Horizontal',
    description: 'Faixa estendida para rodapé.',
    aspectRatio: '320x45',
    defaultWidth: 320,
    defaultHeight: 45,
    badge: 'Lower Train',
    render: ({ isOnline = false }) => {
      return (
        <div className="w-full h-full px-3.5 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-purple-400" />
            <span className="text-[9px] font-mono font-bold text-purple-300 uppercase">TREM DO SUB:</span>
          </div>
          <span className="text-sm font-mono font-black text-white">{isOnline ? 'NÍVEL 1 ATIVO' : 'OFFLINE'}</span>
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Placa Esports Train',
    description: 'Visual campeonato.',
    aspectRatio: '240x70',
    defaultWidth: 240,
    defaultHeight: 70,
    badge: 'Esports Train',
    render: ({ isOnline = false }) => {
      return (
        <div className="w-full h-full p-2.5 rounded-lg bg-slate-900 border-l-4 border-purple-500 border-t border-b border-r border-white/10 flex items-center justify-between select-none text-left shadow-md">
          <div>
            <span className="text-[7.5px] font-mono text-purple-300 uppercase font-bold block">TREM DE APOIO</span>
            <span className="text-sm font-black text-white font-mono">{isOnline ? 'NÍVEL 1' : 'OFFLINE'}</span>
          </div>
        </div>
      );
    }
  },
  {
    id: '09',
    number: 9,
    name: 'Medidor em Blocos de Trem',
    description: '5 blocos luminosos de progresso.',
    aspectRatio: '220x80',
    defaultWidth: 220,
    defaultHeight: 80,
    badge: '5 Blocks',
    render: ({ isOnline = false }) => {
      return (
        <div className="w-full h-full p-2.5 rounded-xl bg-slate-950/90 border border-white/10 flex flex-col justify-between select-none text-left shadow-lg">
          <span className="text-[8px] font-mono text-purple-300 uppercase font-bold">NÍVEL DO TREM</span>
          <div className="grid grid-cols-5 gap-1 my-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`h-2.5 rounded-sm ${i === 0 && isOnline ? 'bg-purple-500' : 'bg-white/10'}`} />
            ))}
          </div>
          <span className="text-[7.5px] font-mono text-slate-500">{isOnline ? 'Apoiadores ativos' : 'Live offline'}</span>
        </div>
      );
    }
  },
  {
    id: '10',
    number: 10,
    name: 'Badge em Diagonal 3D',
    description: 'Distintivo de conquista.',
    aspectRatio: '220x65',
    defaultWidth: 220,
    defaultHeight: 65,
    badge: 'Diagonal Train',
    render: ({ isOnline = false }) => {
      return (
        <div className="w-full h-full p-2.5 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex items-center gap-2 select-none text-left shadow-lg">
          <Flame className="h-6 w-6 text-purple-400 shrink-0" />
          <div className="truncate">
            <span className="text-[8px] font-mono text-purple-300 uppercase font-bold block">TREM DO SUB</span>
            <span className="text-xs font-black text-white truncate block">{isOnline ? 'NÍVEL 1' : 'OFFLINE'}</span>
          </div>
        </div>
      );
    }
  }
];
