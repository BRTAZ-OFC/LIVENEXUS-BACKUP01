import React from 'react';
import { Sparkles, Smile } from 'lucide-react';

function getChatWords(messages = []) {
  const wordCounts = {};
  messages.forEach(msg => {
    const text = msg.text || msg.message || '';
    const tokens = text.split(/\s+/).filter(w => w.length > 2);
    tokens.forEach(w => {
      const clean = w.toUpperCase().replace(/[^A-Z0-9!#]/g, '');
      if (clean) {
        wordCounts[clean] = (wordCounts[clean] || 0) + 1;
      }
    });
  });
  return Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

export const WORD_CLOUD_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Nuvem Espalhada Neon',
    description: 'Palavras espalhadas com tamanhos variados e cores fluorescentes.',
    aspectRatio: '320x220',
    defaultWidth: 320,
    defaultHeight: 220,
    badge: 'Neon Cloud',
    render: ({ messages = [], isOnline = false }) => {
      const words = getChatWords(messages).slice(0, 6);

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/40 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase pb-1 border-b border-white/10 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> NUVEM DE PALAVRAS DO CHAT
          </span>
          <div className="flex-1 flex flex-wrap items-center justify-center gap-2 p-2 text-center">
            {!isOnline ? (
              <span className="text-xs text-slate-500 font-mono italic">Live não conectada</span>
            ) : words.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono italic">Aguardando mensagens do chat...</span>
            ) : (
              words.map((w, i) => (
                <span key={i} className={`font-black tracking-tight ${i === 0 ? 'text-2xl text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : i === 1 ? 'text-lg text-cyan-300' : 'text-sm text-pink-300'}`}>
                  {w.word} ({w.count})
                </span>
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
    name: 'Tag Cloud em Bolhas/Pills',
    description: 'Palavras organizadas em pílulas arredondadas flutuantes.',
    aspectRatio: '300x200',
    defaultWidth: 300,
    defaultHeight: 200,
    badge: 'Bubble Tags',
    render: ({ messages = [], isOnline = false }) => {
      const words = getChatWords(messages).slice(0, 6);

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-white/10 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">TERMOS POPULARES</span>
          <div className="flex flex-wrap gap-1.5 my-auto">
            {!isOnline ? (
              <span className="text-xs text-slate-500 font-mono italic">Live não conectada</span>
            ) : words.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono italic">Aguardando termos do chat...</span>
            ) : (
              words.map((w, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-200">
                  #{w.word} ({w.count})
                </span>
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
    name: 'Círculo Cósmico Orbitante',
    description: 'Composição circular com termos girando ao redor do centro.',
    aspectRatio: '260x260',
    defaultWidth: 260,
    defaultHeight: 260,
    badge: 'Cosmic Circle',
    render: ({ messages = [], isOnline = false }) => {
      const words = getChatWords(messages).slice(0, 3);

      return (
        <div className="w-full h-full rounded-full bg-slate-950/90 border border-purple-500/40 p-4 flex flex-col items-center justify-center select-none shadow-xl aspect-square text-center">
          <Sparkles className="h-6 w-6 text-purple-400 mb-1" />
          <span className="text-xs font-black text-white">NUVEM ORBITAL</span>
          <span className="text-[9px] text-purple-300 font-mono mt-1">
            {!isOnline ? 'OFFLINE' : words.length > 0 ? words.map(w => w.word).join(' • ') : 'AGUARDANDO CHAT'}
          </span>
        </div>
      );
    }
  },
  {
    id: '04',
    number: 4,
    name: 'Grid de Termos Mais Falados',
    description: 'Grid com blocos destacando as palavras mais repetidas.',
    aspectRatio: '310x180',
    defaultWidth: 310,
    defaultHeight: 180,
    badge: 'Terms Grid',
    render: ({ messages = [], isOnline = false }) => {
      const words = getChatWords(messages).slice(0, 4);

      return (
        <div className="w-full h-full p-3 rounded-xl bg-black/80 border border-white/10 flex flex-col justify-between select-none text-left">
          <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">TOP TERMOS</span>
          <div className="grid grid-cols-2 gap-1.5 my-auto text-xs">
            {!isOnline ? (
              <div className="col-span-2 text-xs text-slate-500 font-mono italic text-center">Live não conectada</div>
            ) : words.length === 0 ? (
              <div className="col-span-2 text-xs text-slate-500 font-mono italic text-center">Aguardando chat...</div>
            ) : (
              words.map((w, i) => (
                <div key={i} className="p-2 rounded bg-white/5 font-bold text-white truncate">{i + 1}. {w.word} ({w.count}x)</div>
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
    name: 'Cyber Matriz de Frequência',
    description: 'Interface sci-fi com matriz de escaneamento de vocabulário.',
    aspectRatio: '330x210',
    defaultWidth: 330,
    defaultHeight: 210,
    badge: 'Cyber Matrix',
    render: ({ messages = [], isOnline = false }) => {
      const words = getChatWords(messages).slice(0, 3);

      return (
        <div className="w-full h-full p-3 bg-black border border-cyan-400 font-mono text-xs flex flex-col justify-between select-none text-left">
          <span className="text-[8.5px] text-cyan-300">[VOCAB_FREQUENCY_SCANNER]</span>
          <div className="text-slate-200 my-auto">
            {!isOnline ? (
              <div className="text-rose-400 italic">err: disconnected</div>
            ) : words.length === 0 ? (
              <div className="text-cyan-400/60 italic">scanning_chat_messages...</div>
            ) : (
              words.map((w, i) => (
                <div key={i}>&gt; key: {w.word} [{w.count}x]</div>
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
    name: 'Top 3 Gigantes + Tags',
    description: 'Três palavras em tamanho gigante.',
    aspectRatio: '290x190',
    defaultWidth: 290,
    defaultHeight: 190,
    badge: 'Big Top 3',
    render: ({ messages = [], isOnline = false }) => {
      const words = getChatWords(messages).slice(0, 3);

      return (
        <div className="w-full h-full p-3 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex flex-col justify-between select-none text-left shadow-xl">
          <span className="text-[9px] font-mono text-purple-300 font-bold uppercase">PALAVRAS DO MOMENTO</span>
          <div className="my-auto">
            {!isOnline ? (
              <span className="text-xs text-slate-500 font-mono italic">Live não conectada</span>
            ) : words.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono italic">Aguardando chat...</span>
            ) : (
              <>
                <span className="text-2xl font-black text-white block">{words[0].word} ({words[0].count}x)</span>
                {words.length > 1 && (
                  <span className="text-sm font-bold text-cyan-300 block">{words.slice(1).map(w => `${w.word} (${w.count})`).join(' • ')}</span>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: '07',
    number: 7,
    name: 'Nuvem Minimalista sem Borda',
    description: 'Composição flutuante sobreposta à live com glow.',
    aspectRatio: '280x200',
    defaultWidth: 280,
    defaultHeight: 200,
    badge: 'Minimal Glow',
    render: ({ messages = [], isOnline = false }) => {
      const words = getChatWords(messages).slice(0, 4);

      return (
        <div className="w-full h-full p-2 flex flex-col justify-center select-none text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
          {!isOnline ? (
            <span className="text-xs text-slate-400 font-mono italic">Live não conectada</span>
          ) : words.length === 0 ? (
            <span className="text-xs text-slate-400 font-mono italic">Aguardando mensagens...</span>
          ) : (
            <>
              <span className="text-2xl font-black text-purple-300">{words[0]?.word}</span>
              <span className="text-lg font-bold text-white">{words.slice(1).map(w => w.word).join(' • ')}</span>
            </>
          )}
        </div>
      );
    }
  },
  {
    id: '08',
    number: 8,
    name: 'Ticker de Palavras em Destaque',
    description: 'Faixa deslizante para rodapés de tela.',
    aspectRatio: '440x55',
    defaultWidth: 440,
    defaultHeight: 55,
    badge: 'Footer Strip',
    render: ({ messages = [], isOnline = false }) => {
      const words = getChatWords(messages).slice(0, 5);

      return (
        <div className="w-full h-full px-4 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between select-none text-left">
          <span className="text-[9px] font-mono font-bold text-purple-300 uppercase shrink-0 pr-3 border-r border-white/10">PALAVRAS:</span>
          <div className="flex-1 px-3 truncate">
            {!isOnline ? (
              <span className="text-xs text-slate-500 font-mono italic">Live não conectada</span>
            ) : words.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono italic">Aguardando mensagens do chat...</span>
            ) : (
              <div className="flex items-center gap-3 text-xs font-bold text-white truncate">
                {words.map((w, i) => (
                  <span key={i}>#{w.word} ({w.count})</span>
                ))}
              </div>
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
    description: 'Vidro escuro com palavras brilhantes.',
    aspectRatio: '300x210',
    defaultWidth: 300,
    defaultHeight: 210,
    badge: 'Dark Cloud',
    render: ({ messages = [], isOnline = false }) => {
      const words = getChatWords(messages).slice(0, 5);

      return (
        <div className="w-full h-full p-3.5 rounded-2xl bg-black/85 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.18)] flex flex-col justify-between select-none text-left">
          <span className="text-[9px] font-mono text-purple-300 uppercase font-bold">NUVEM DE CHAT</span>
          <div className="flex flex-wrap gap-2 my-auto">
            {!isOnline ? (
              <span className="text-xs text-slate-500 font-mono italic">Live não conectada</span>
            ) : words.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono italic">Aguardando mensagens...</span>
            ) : (
              words.map((w, i) => (
                <span key={i} className="text-xs font-bold text-white bg-white/5 px-2 py-1 rounded">
                  {w.word} ({w.count})
                </span>
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
    name: 'Esports Word Board',
    description: 'Placa esportiva com termos da rodada.',
    aspectRatio: '300x200',
    defaultWidth: 300,
    defaultHeight: 200,
    badge: 'Esports Board',
    render: ({ messages = [], isOnline = false }) => {
      const words = getChatWords(messages).slice(0, 4);

      return (
        <div className="w-full h-full rounded-xl bg-slate-950 border border-slate-700 flex flex-col overflow-hidden select-none text-left shadow-2xl">
          <div className="bg-gradient-to-r from-red-600 to-indigo-700 px-3 py-1 text-xs font-black text-white uppercase flex justify-between shrink-0">
            <span>TERMOS DA LIVE</span>
            <span>{isOnline ? 'LIVE' : 'OFF'}</span>
          </div>
          <div className="p-3 flex-1 flex flex-col justify-center space-y-1">
            {!isOnline ? (
              <div className="text-xs text-slate-500 font-mono italic text-center">Live não conectada</div>
            ) : words.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic text-center">Aguardando mensagens...</div>
            ) : (
              words.map((w, i) => (
                <div key={i} className="text-xs font-bold text-white flex justify-between">
                  <span>{i + 1}. {w.word}</span>
                  <span className="text-slate-400 font-mono">{w.count}x</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  }
];

export const EMOTE_SHOWER_TEMPLATES = [
  {
    id: '01',
    number: 1,
    name: 'Chuva Espalhada de Emotes',
    description: 'Animação de queda suave de emotes em tempo real.',
    aspectRatio: '300x300',
    defaultWidth: 300,
    defaultHeight: 300,
    badge: 'Rain Fall',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-black/40 border border-dashed border-purple-500/40 flex flex-col items-center justify-center select-none text-center">
        <Smile className="h-10 w-10 text-purple-400 mb-2 animate-bounce" />
        <span className="text-xs font-bold text-white">Área de Chuva de Emotes</span>
        <span className="text-[9px] text-slate-400 font-mono mt-1">{isOnline ? 'Emotes do chat caem aqui em tempo real' : 'Live não conectada'}</span>
      </div>
    )
  },
  {
    id: '02',
    number: 2,
    name: 'Explosão Central de Emotes',
    description: 'Emotes explodem radialmente a partir do centro.',
    aspectRatio: '280x280',
    defaultWidth: 280,
    defaultHeight: 280,
    badge: 'Radial Burst',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full rounded-full bg-black/40 border border-cyan-500/40 p-4 flex flex-col items-center justify-center select-none text-center aspect-square">
        <Sparkles className="h-8 w-8 text-cyan-400 mb-1 animate-pulse" />
        <span className="text-xs font-bold text-white">Explosão de Emotes</span>
        <span className="text-[8px] text-slate-400 font-mono mt-0.5">{isOnline ? 'Disparado por reações' : 'Live offline'}</span>
      </div>
    )
  },
  {
    id: '03',
    number: 3,
    name: 'Fonte Ascendente de Emojis',
    description: 'Emotes sobem do rodapé flutuando como balões.',
    aspectRatio: '260x320',
    defaultWidth: 260,
    defaultHeight: 320,
    badge: 'Floating Up',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-black/40 border border-pink-500/40 flex flex-col items-center justify-end select-none text-center">
        <Smile className="h-8 w-8 text-pink-400 mb-2 animate-bounce" />
        <span className="text-xs font-bold text-white">Fonte Flutuante</span>
        <span className="text-[8px] text-slate-400 font-mono mt-0.5">{isOnline ? 'Emotes sobem pela tela' : 'Live offline'}</span>
      </div>
    )
  },
  {
    id: '04',
    number: 4,
    name: 'Cascata Lateral Direita',
    description: 'Coluna lateral onde os emotes descem em fila.',
    aspectRatio: '140x320',
    defaultWidth: 140,
    defaultHeight: 320,
    badge: 'Side Stream',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-2 rounded-2xl bg-black/40 border border-purple-500/30 flex flex-col items-center justify-between select-none text-center">
        <span className="text-[8px] font-mono text-purple-300 uppercase">EMOTES</span>
        <Smile className="h-8 w-8 text-purple-400" />
        <span className="text-[7.5px] font-mono text-slate-400">{isOnline ? 'AO VIVO' : 'OFFLINE'}</span>
      </div>
    )
  },
  {
    id: '05',
    number: 5,
    name: 'Cyberpunk Emote Feed',
    description: 'Interface sci-fi com stream de reações.',
    aspectRatio: '280x280',
    defaultWidth: 280,
    defaultHeight: 280,
    badge: 'Cyber Emotes',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-3 bg-black/60 border border-cyan-400 font-mono flex flex-col items-center justify-center select-none text-center">
        <span className="text-[8px] text-cyan-300">[EMOTE_CASCADE_ENGINE]</span>
        <Smile className="h-8 w-8 text-cyan-400 my-2" />
        <span className="text-[8px] text-slate-400">{isOnline ? 'STATUS: ENGINE ACTIVE' : 'STATUS: OFFLINE'}</span>
      </div>
    )
  },
  {
    id: '06',
    number: 6,
    name: 'Espiral Hipnótica',
    description: 'Emotes giram em vórtice circular.',
    aspectRatio: '260x260',
    defaultWidth: 260,
    defaultHeight: 260,
    badge: 'Spiral Vortex',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full rounded-full bg-black/40 border border-indigo-500/40 p-4 flex flex-col items-center justify-center select-none text-center aspect-square">
        <Sparkles className="h-8 w-8 text-indigo-400 mb-1" />
        <span className="text-xs font-bold text-white">Vórtice de Emotes</span>
        <span className="text-[8px] text-slate-400 font-mono mt-0.5">{isOnline ? 'Ativado por chat' : 'Offline'}</span>
      </div>
    )
  },
  {
    id: '07',
    number: 7,
    name: 'Chuva Minimalista Transparente',
    description: 'Sem nenhum fundo, apenas a física dos emotes na tela.',
    aspectRatio: '280x280',
    defaultWidth: 280,
    defaultHeight: 280,
    badge: 'Pure Canvas',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-2 flex flex-col items-center justify-center select-none text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
        <Smile className="h-8 w-8 text-white mb-1" />
        <span className="text-xs font-bold text-white">{isOnline ? 'Canvas de Emotes Ativo' : 'Live não conectada'}</span>
      </div>
    )
  },
  {
    id: '08',
    number: 8,
    name: 'Dark Glass com Glow',
    description: 'Vidro fumê com iluminação nas bordas.',
    aspectRatio: '280x280',
    defaultWidth: 280,
    defaultHeight: 280,
    badge: 'Glass Rain',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-black/85 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.18)] flex flex-col items-center justify-center select-none text-center">
        <Smile className="h-8 w-8 text-purple-400 mb-1" />
        <span className="text-xs font-bold text-white">Chuva de Emotes Glass</span>
        <span className="text-[8px] font-mono text-slate-400 mt-1">{isOnline ? 'Interação ativa' : 'Offline'}</span>
      </div>
    )
  },
  {
    id: '09',
    number: 9,
    name: 'Fogo de Artifício de Emojis',
    description: 'Emotes disparam para cima e caem suavemente.',
    aspectRatio: '280x280',
    defaultWidth: 280,
    defaultHeight: 280,
    badge: 'Fireworks',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full p-3 rounded-2xl bg-black/40 border border-amber-500/40 flex flex-col items-center justify-center select-none text-center">
        <Sparkles className="h-8 w-8 text-amber-400 mb-1" />
        <span className="text-xs font-bold text-white">Fogos de Emotes</span>
        <span className="text-[8px] font-mono text-slate-400 mt-1">{isOnline ? 'Ativado por raids e subs' : 'Offline'}</span>
      </div>
    )
  },
  {
    id: '10',
    number: 10,
    name: 'Placa Esports Emote Arena',
    description: 'Visual temático de torneio.',
    aspectRatio: '280x280',
    defaultWidth: 280,
    defaultHeight: 280,
    badge: 'Esports Arena',
    render: ({ isOnline = false }) => (
      <div className="w-full h-full rounded-xl bg-slate-950 border border-slate-700 flex flex-col items-center justify-center p-3 select-none text-center">
        <span className="text-[9px] font-mono font-bold text-red-400 uppercase">EMOTE ARENA</span>
        <Smile className="h-8 w-8 text-white my-2" />
        <span className="text-[8px] font-mono text-slate-400">{isOnline ? 'TRANSMISSÃO CONECTADA' : 'DISCONNECTED'}</span>
      </div>
    )
  }
];
