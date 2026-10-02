// diagnosticService.js — Registro Central Global da Execução Real do LiveNexus
// Centraliza eventos de ciclo de vida, erros não tratados, rejeições de promises e falhas de componentes.
// Compartilha eventos em tempo real entre abas e iframes via BroadcastChannel.

const STORAGE_EVENTS_KEY = 'livenexus_diagnostic_events';
const STORAGE_CAPTURING_KEY = 'livenexus_diagnostic_capturing';
const MAX_EVENTS = 500;
const CHANNEL_NAME = 'livenexus_diagnostic_stream';

let isCapturing = true;
try {
  const savedCapturing = localStorage.getItem(STORAGE_CAPTURING_KEY);
  if (savedCapturing !== null) {
    isCapturing = savedCapturing === 'true';
  }
} catch {
  // ignora falhas de localStorage
}

let events = [];
try {
  const savedEvents = localStorage.getItem(STORAGE_EVENTS_KEY);
  if (savedEvents) {
    const parsed = JSON.parse(savedEvents);
    if (Array.isArray(parsed)) {
      events = parsed.slice(-MAX_EVENTS);
    }
  }
} catch {
  events = [];
}

const listeners = new Set();
let channel = null;

try {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (msg) => {
      const data = msg.data;
      if (!data) return;

      if (data.type === 'DIAGNOSTIC_EVENT' && data.event) {
        if (!events.some((e) => e.id === data.event.id)) {
          events.push(data.event);
          if (events.length > MAX_EVENTS) events.shift();
          notifyListeners();
        }
      } else if (data.type === 'SET_CAPTURING') {
        isCapturing = Boolean(data.isCapturing);
        notifyListeners();
      } else if (data.type === 'CLEAR_EVENTS') {
        events = [];
        try {
          localStorage.removeItem(STORAGE_EVENTS_KEY);
        } catch {}
        notifyListeners();
      }
    };
  }
} catch (e) {
  console.warn('[Diagnostic] BroadcastChannel indisponível:', e);
}

function persistEvents() {
  try {
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {}
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn([...events], isCapturing);
    } catch (err) {
      console.error('[Diagnostic] Erro no listener:', err);
    }
  });
}

export function subscribeDiagnostic(fn) {
  listeners.add(fn);
  fn([...events], isCapturing);
  return () => {
    listeners.delete(fn);
  };
}

export function getDiagnosticState() {
  return {
    events: [...events],
    isCapturing,
  };
}

export function startDiagnosticCapture() {
  isCapturing = true;
  try {
    localStorage.setItem(STORAGE_CAPTURING_KEY, 'true');
  } catch {}
  if (channel) {
    channel.postMessage({ type: 'SET_CAPTURING', isCapturing: true });
  }
  notifyListeners();
}

export function stopDiagnosticCapture() {
  isCapturing = false;
  try {
    localStorage.setItem(STORAGE_CAPTURING_KEY, 'false');
  } catch {}
  if (channel) {
    channel.postMessage({ type: 'SET_CAPTURING', isCapturing: false });
  }
  notifyListeners();
}

export function clearDiagnosticEvents() {
  events = [];
  try {
    localStorage.removeItem(STORAGE_EVENTS_KEY);
  } catch {}
  if (channel) {
    channel.postMessage({ type: 'CLEAR_EVENTS' });
  }
  notifyListeners();
}

export function recordDiagnosticEvent({
  level = 'info',
  module = 'Sistema',
  layer,
  component,
  action,
  message,
  details,
  error,
  componentStack,
}) {
  if (!isCapturing && level !== 'error') {
    return null;
  }

  const now = new Date();
  const timeFormatted = now.toLocaleTimeString('pt-BR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + '.' + String(now.getMilliseconds()).padStart(3, '0');

  const id = `diag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const route = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';

  let errorObj = null;
  if (error) {
    errorObj = {
      name: error.name || 'Error',
      message: error.message || String(error),
      stack: error.stack || null,
    };
  }

  const finalMessage = message || (error ? error.message : `${action || 'Evento'} em ${module}`);

  const eventItem = {
    id,
    timestamp: now.toISOString(),
    timeFormatted,
    level, // 'info' | 'warn' | 'error'
    module,
    layer: layer || module,
    component: component || null,
    action: action || null,
    message: finalMessage,
    route,
    details: details ? sanitizeDetails(details) : null,
    error: errorObj,
    componentStack: componentStack || null,
  };

  events.push(eventItem);
  if (events.length > MAX_EVENTS) {
    events.shift();
  }

  persistEvents();

  if (channel) {
    try {
      channel.postMessage({ type: 'DIAGNOSTIC_EVENT', event: eventItem });
    } catch {}
  }

  notifyListeners();
  return eventItem;
}

export function recordDiagnosticError(err, context = {}) {
  const error = err instanceof Error ? err : new Error(String(err || 'Erro desconhecido'));
  let inferredModule = context.module;
  if (!inferredModule) {
    const stack = error.stack || '';
    if (stack.includes('tts') || stack.includes('TTS') || stack.includes('voice')) inferredModule = 'TTS';
    else if (stack.includes('PlayerBuster') || stack.includes('library')) inferredModule = 'Biblioteca';
    else if (stack.includes('Dashboard')) inferredModule = 'Dashboard';
    else inferredModule = 'Sistema';
  }

  return recordDiagnosticEvent({
    level: 'error',
    module: inferredModule,
    layer: context.layer || inferredModule,
    component: context.component,
    action: context.action || 'Falha de execução',
    message: context.message || `Erro em ${inferredModule}: ${error.message}`,
    details: context.details,
    error,
    componentStack: context.componentStack,
  });
}

function sanitizeDetails(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return { info: String(obj) };
  }
}

// Gera o relatório técnico estruturado com o caminho (trail) até o erro
export function generateTechnicalReport(targetEvent, allEvents = events) {
  if (!targetEvent) return 'Nenhum evento selecionado para o relatório.';

  const targetIndex = allEvents.findIndex((e) => e.id === targetEvent.id);
  const precedingEvents = targetIndex > 0 ? allEvents.slice(Math.max(0, targetIndex - 12), targetIndex) : [];

  const lines = [];
  lines.push('======================================================================');
  lines.push('RELATÓRIO TÉCNICO DE DIAGNÓSTICO — LIVENEXUS');
  lines.push('======================================================================');
  lines.push(`ID da Ocorrência: ${targetEvent.id}`);
  lines.push(`Data/Hora (ISO): ${targetEvent.timestamp}`);
  lines.push(`Hora Local: ${targetEvent.timeFormatted}`);
  lines.push(`Nível: ${targetEvent.level.toUpperCase()}`);
  lines.push(`Módulo / Camada: ${targetEvent.module}${targetEvent.layer && targetEvent.layer !== targetEvent.module ? ` (${targetEvent.layer})` : ''}`);
  if (targetEvent.component) lines.push(`Componente: ${targetEvent.component}`);
  if (targetEvent.action) lines.push(`Ação em execução: ${targetEvent.action}`);
  lines.push(`Rota / URL: ${targetEvent.route || 'Não informada'}`);

  lines.push('');
  lines.push('--- MENSAGEM ---');
  lines.push(targetEvent.message || 'Sem mensagem registrada');

  if (targetEvent.error) {
    lines.push('');
    lines.push('--- EXCEÇÃO TÉCNICA (ERROR) ---');
    lines.push(`Tipo: ${targetEvent.error.name || 'Error'}`);
    lines.push(`Mensagem: ${targetEvent.error.message}`);
    if (targetEvent.error.stack) {
      lines.push('');
      lines.push('Stack trace:');
      lines.push(targetEvent.error.stack);
    }
  }

  if (targetEvent.componentStack) {
    lines.push('');
    lines.push('--- COMPONENT STACK (REACT) ---');
    lines.push(targetEvent.componentStack);
  }

  if (targetEvent.details) {
    lines.push('');
    lines.push('--- DETALHES DE CONTEXTO ---');
    lines.push(JSON.stringify(targetEvent.details, null, 2));
  }

  lines.push('');
  lines.push('--- HISTÓRICO DE EXECUÇÃO ANTERIOR (CAMINHO ATÉ A OCORRÊNCIA) ---');
  if (precedingEvents.length === 0) {
    lines.push('(Nenhum registro anterior capturado nesta sessão)');
  } else {
    precedingEvents.forEach((pe) => {
      const compStr = pe.component ? ` [${pe.component}]` : '';
      lines.push(`[${pe.timeFormatted}] [${pe.level.toUpperCase()}] [${pe.module}]${compStr} ${pe.message}`);
    });
  }
  lines.push('======================================================================');

  return lines.join('\n');
}

// Inicialização única de listeners globais de erro no navegador
if (typeof window !== 'undefined' && !window.__livenexus_diagnostic_init) {
  window.__livenexus_diagnostic_init = true;

  window.addEventListener('error', (event) => {
    const err = event.error || new Error(event.message || 'Erro não tratado');
    const stack = err.stack || '';
    let module = 'Sistema';
    if (stack.includes('tts') || stack.includes('TTS')) module = 'TTS';

    recordDiagnosticError(err, {
      module,
      action: 'Erro JavaScript não tratado (window.onerror)',
      message: event.message || err.message,
      details: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const err = reason instanceof Error ? reason : new Error(String(reason || 'Rejeição de Promise não tratada'));
    const stack = err.stack || '';
    let module = 'Sistema';
    if (stack.includes('TTS') || stack.includes('tts')) module = 'TTS';

    recordDiagnosticError(err, {
      module,
      action: 'Promise rejeitada sem tratamento (unhandledrejection)',
      message: err.message,
    });
  });
}
