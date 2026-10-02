// Catálogo de Actions do LiveNexus Action Engine.
// Contém apenas metadados estáticos (label, descrição, categoria, safety).
// Handlers NÃO vivem aqui — são injetados pela camada React via actionEngine.setHandlers().
// Isso mantém o núcleo independente de React e de StreamingContext.

export const ACTIONS = {
  'tts.toggle': {
    id: 'tts.toggle',
    label: 'Pausar/Retomar TTS',
    description: 'Alterna entre pausar e retomar a leitura das mensagens.',
    category: 'tts',
    safety: 'SAFE',
  },
  'tts.clearQueue': {
    id: 'tts.clearQueue',
    label: 'Limpar fila',
    description: 'Cancela a fala atual e esvazia a fila de mensagens TTS.',
    category: 'tts',
    safety: 'CAUTION',
  },
  'tts.test': {
    id: 'tts.test',
    label: 'Testar voz',
    description: 'Envia uma mensagem de teste para o motor de voz.',
    category: 'tts',
    safety: 'SAFE',
  },
  'tts.skip': {
    id: 'tts.skip',
    label: 'Pular fala atual',
    description: 'Cancela somente a fala atual e continua com a próxima da fila.',
    category: 'tts',
    safety: 'SAFE',
  },
};

// IDs expostos. Futuras fases adicionam aqui.
export const MVP_ACTION_IDS = ['tts.toggle', 'tts.clearQueue', 'tts.test', 'tts.skip'];

export function getAction(id) {
  return ACTIONS[id] || null;
}

export function listActions() {
  return MVP_ACTION_IDS.map((id) => ACTIONS[id]).filter(Boolean);
}