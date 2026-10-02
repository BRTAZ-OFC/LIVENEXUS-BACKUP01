// Bindings padrão do MVP 1.
// Escolhidos para evitar conflitos com atalhos do navegador e do projeto.
// Conflito conhecido evitado: Ctrl+B (toggle sidebar — dashboard/componentes/ui/sidebar.jsx).
//
// tts.toggle      -> F8            (tecla de mídia comum, sem default no Chrome/Firefox)
// tts.clearQueue  -> Ctrl+Shift+F8 (CAUTION: exige 2 modifiers para evitar acionamento acidental)
// tts.test        -> F9            (sem default no navegador)
// tts.skip        -> F10           (sem uso no projeto; verificado livre no dashboard/)
// deathCounter.increment -> NumpadAdd (tecla + do teclado numérico; sem default no navegador)
// deathCounter.decrement -> NumpadSubtract (teclado numérico) e Minus (teclado principal)
//   reset não recebe atalho padrão — fica como ação reutilizável (botão do painel + configurável).

export const DEFAULT_BINDINGS = [
  { source: 'keyboard', descriptor: 'F8', actionId: 'tts.toggle', enabled: true },
  { source: 'keyboard', descriptor: 'Ctrl+Shift+F8', actionId: 'tts.clearQueue', enabled: true },
  { source: 'keyboard', descriptor: 'F9', actionId: 'tts.test', enabled: true },
  { source: 'keyboard', descriptor: 'F10', actionId: 'tts.skip', enabled: true },
  { source: 'keyboard', descriptor: 'NumpadAdd', actionId: 'deathCounter.increment', enabled: true },
  { source: 'keyboard', descriptor: 'NumpadSubtract', actionId: 'deathCounter.decrement', enabled: true },
  { source: 'keyboard', descriptor: 'Minus', actionId: 'deathCounter.decrement', enabled: true },
];