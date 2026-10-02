// Fonte central do status de desenvolvimento do LiveNexus.
// 100% frontend/local — sem backend, sem fetch, sem entities, sem GitHub API.
// A Home consome este módulo para derivar TODOS os números exibidos.
//
// Estrutura de cada item: { id, name, status, category, detail }
//   status: 'completed' | 'in_progress' | 'planned'
//   category: chave de agrupamento (mapeada a ícones na Home)
//
// Estatísticas são CALCULADAS — nunca hardcoded no JSX.

export const CHECKPOINT = '3e76ac2e18e55ec7b76a2474508e7fcda997290e';
export const CURRENT_PHASE = 'Browser Source — preparação da infraestrutura real';

// --- Plataformas (status real, verificável pelo repositório) ---
export const PLATFORMS = [
  { name: 'Twitch', status: 'Integrada', tone: 'emerald', detail: 'IRC over WSS · roles · meta polling · backoff', icon: 'RadioTower' },
  { name: 'Kick', status: 'Integrada', tone: 'emerald', detail: 'Pusher WebSocket · roles · meta polling · backoff', icon: 'Radio' },
];

// --- Roadmap unificado (única fonte de verdade) ---
export const ROADMAP = [
  // === CONCLUÍDO ===
  { id: 'lab1', name: 'Laboratório 1 (Diagnóstico)', status: 'completed', category: 'lab', detail: 'Lab de diagnóstico admin com simulador e gatilhos' },
  { id: 'action-engine', name: 'Action Engine / Central de Atalhos MVP', status: 'completed', category: 'interactive', detail: 'Registry + permission matrix + binding store (localStorage)' },
  { id: 'tts-skip', name: 'TTS Skip', status: 'completed', category: 'tts', detail: 'Skip idempotente via scheduler + setTimeout fallback' },
  { id: 'bs-6', name: 'Browser Source Etapa 6 — State Bridge + Sanitizer', status: 'completed', category: 'browser-source', detail: 'Bridge local com versionamento/sequência + whitelist default-deny' },
  { id: 'bs-7', name: 'Browser Source Etapa 7 — plataformas reais', status: 'completed', category: 'browser-source', detail: 'Runtime Adapter publica status + viewers reais' },
  { id: 'bs-8', name: 'Browser Source Etapa 8 — chat real', status: 'completed', category: 'browser-source', detail: 'Chat Adapter publica mensagens reais não-bloqueadas' },
  { id: 'bs-9', name: 'Browser Source Etapa 9 — estado real do TTS', status: 'completed', category: 'browser-source', detail: 'TTS Adapter deriva speaking/count do ttsScheduler' },
  { id: 'bs-10', name: 'Browser Source Etapa 10 — snapshot consolidado', status: 'completed', category: 'browser-source', detail: 'Validação de coexistência + isolamento + zero vazamento' },
  { id: 'tts-engine', name: 'Motor TTS (speechSynthesis nativo)', status: 'completed', category: 'tts', detail: 'Zero integration credits · keep-alive Chrome' },
  { id: 'tts-queue', name: 'Fila TTS com prioridade', status: 'completed', category: 'tts', detail: 'Scheduler P1-P4 · aging · fairness · TTL · delay dinâmico' },
  { id: 'filters', name: 'Filtros PRÉ-TTS configuráveis', status: 'completed', category: 'filter', detail: 'Pipeline de 8 regras + simulador + gatilhos' },
  { id: 'backlog', name: 'Backlog / Latência (always-on)', status: 'completed', category: 'tts', detail: 'HEALTHY/GROWING/DELAYED/CRITICAL em tempo real' },
  { id: 'channel-verify', name: 'Verificação de Canal (HMAC)', status: 'completed', category: 'auth', detail: 'Proof + challengeKey via Worker' },
  { id: 'workers', name: 'Workers Cloudflare', status: 'completed', category: 'infra', detail: 'verify/meta/twitch' },
  { id: 'last-lives', name: 'Últimas Lives (localStorage)', status: 'completed', category: 'infra', detail: 'Histórico cap 4 por streamId+platform' },
  { id: 'multiplatform', name: 'Multiplataforma simultânea', status: 'completed', category: 'infra', detail: 'Twitch + Kick em paralelo' },
  { id: 'spa-persistence', name: 'Persistência SPA (StreamingProvider)', status: 'completed', category: 'infra', detail: 'Provider sobrevive à troca de seções' },
  { id: 'auth-base44', name: 'Auth Base44 + Google OAuth', status: 'completed', category: 'auth', detail: 'Login/Register/Forgot/Reset + Google' },
  { id: 'viewers-tk', name: 'Viewer counts (Twitch/Kick)', status: 'completed', category: 'platform', detail: 'Meta polling adaptativo' },
  { id: 'conn-twitch', name: 'Conexão anônima Twitch (IRC/WSS)', status: 'completed', category: 'platform', detail: 'Client-side, sem backend' },
  { id: 'conn-kick', name: 'Conexão Kick (Pusher) client-side', status: 'completed', category: 'platform', detail: 'Pusher nativo + resolve chatroom via Worker' },
  { id: 'roles', name: 'Roles/badges das plataformas', status: 'completed', category: 'platform', detail: 'Normalização broadcaster/mod/vip/sub' },
  { id: 'backoff', name: 'Backoff adaptativo offline', status: 'completed', category: 'infra', detail: 'Reconexão exponencial por plataforma' },

  // === EM DESENVOLVIMENTO ===
  { id: 'bs-infra-real', name: 'Preparação da infraestrutura do Browser Source real', status: 'in_progress', category: 'browser-source', detail: 'Migração do overlay placeholder para transporte nativo' },

  // === PLANEJADO ===
  { id: 'bs-11', name: 'Browser Source Etapa 11 e posteriores', status: 'planned', category: 'browser-source', detail: 'Próximas etapas do overlay' },
  { id: 'bs-transport', name: 'Transporte independente para Browser Source', status: 'planned', category: 'browser-source', detail: 'SSE/HTTP local sem Base44 runtime' },
  { id: 'bs-render', name: 'Renderização real de overlays/widgets', status: 'planned', category: 'browser-source', detail: 'Overlay funcional para OBS/PRISM' },
  { id: 'command-engine', name: 'Command Engine', status: 'planned', category: 'command', detail: 'Comandos de chat acionáveis' },
  { id: 'widgets', name: 'Widgets interativos', status: 'planned', category: 'interactive', detail: 'Votação, bingo, roleta, etc' },
  { id: 'player', name: 'Player/Media', status: 'planned', category: 'media', detail: 'Reprodução de mídia integrada' },
  { id: 'conn-yt', name: 'Conexão YouTube (Nova Arquitetura)', status: 'planned', category: 'platform', detail: 'Nova integração planejada' },
  { id: 'role-followers', name: 'Role "Seguidores"', status: 'planned', category: 'platform', detail: 'Não exposto pelas APIs públicas' },
  { id: 'mcp', name: 'App MCP server', status: 'planned', category: 'infra', detail: 'Expor dados a clientes AI' },
  { id: 'push', name: 'Notificações push mobile', status: 'planned', category: 'infra', detail: 'Não implementado' },
  { id: 'custom-domain', name: 'Domínio customizado para e-mails', status: 'planned', category: 'infra', detail: 'Envio a não-registrados' },
  { id: 'other-modules', name: 'Demais módulos ainda não implementados', status: 'planned', category: 'infra', detail: 'Reservado para roadmap futuro' },
];

// --- Cálculo automático de estatísticas ---
export const STATS = (() => {
  const total = ROADMAP.length;
  const completed = ROADMAP.filter(i => i.status === 'completed').length;
  const inProgress = ROADMAP.filter(i => i.status === 'in_progress').length;
  const planned = ROADMAP.filter(i => i.status === 'planned').length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, inProgress, planned, progressPercent };
})();

// --- Últimas alterações (metadata, não afeta progresso) ---
export const RECENT_CHANGES = [
  { date: '2026-09-07', text: 'Browser Source Etapa 10 — snapshot consolidado validado (coexistência + isolamento)' },
  { date: '2026-09-06', text: 'Browser Source Etapa 9 — estado real do TTS conectado ao bridge' },
  { date: '2026-09-05', text: 'Browser Source Etapa 8 — mensagens reais do chat publicadas no bridge' },
  { date: '2026-09-04', text: 'Reorganização estrutural: Home (central do projeto) + Dashboard (painel do usuário)' },
  { date: '2026-09-03', text: 'Sistema de filtros PRÉ-TTS configurável com simulador e gatilhos' },
];

// --- Próximos passos (metadata) ---
export const NEXT_STEPS = [
  'Iniciar Browser Source Etapa 11 (transporte independente)',
  'Migrar overlay placeholder para renderização real',
  'Implementar Command Engine',
  'Redeploy do Worker YouTube para ativar viewer count',
  'Avaliar viabilidade de "Seguidores" via APIs oficiais',
];