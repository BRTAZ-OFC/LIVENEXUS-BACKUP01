// Keyboard Provider — único listener keydown global.
// Resolve bindings de teclado e notifica via callback.
// Não chama actionEngine diretamente (mantém acoplamento baixo — a camada React conecta).
//
// Guards obrigatórios:
// - ignora event.repeat
// - ignora INPUT/TEXTAREA/SELECT/contenteditable
// - ignora teclas modificadoras sozinhas
// - não cria múltiplos listeners (singleton)
// - cleanup correto
// - modo captura: quando ativo, provider ignora eventos (a UI captura a tecla)

import { findBinding } from '../Config_bindingStore';

const MODIFIERS = ['Control', 'Shift', 'Alt', 'Meta'];

let listener = null;
let onAction = null;
let captureMode = false;
let startCount = 0; // ref-count: múltiplos donos podem coexistir (CommandsSection + bridges)

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

// Normaliza um evento de teclado em descriptor canônico: "Ctrl+Shift+F8".
// Usa event.code (layout-independente) quando disponível.
export function normalizeKey(event) {
  const mods = [];
  if (event.ctrlKey) mods.push('Ctrl');
  if (event.shiftKey) mods.push('Shift');
  if (event.altKey) mods.push('Alt');
  if (event.metaKey) mods.push('Meta');
  let key;
  if (event.code) {
    if (/^F\d{1,2}$/.test(event.code)) key = event.code;
    else if (event.code.startsWith('Numpad')) key = event.code;
    else if (event.code.startsWith('Digit')) key = event.code.slice(5);
    else if (event.code.startsWith('Key')) key = event.code.slice(3);
    else key = event.code;
  } else {
    key = event.key;
  }
  return [...mods, key].join('+');
}

function handleKeyDown(event) {
  if (captureMode) return;
  if (event.repeat) return;
  if (isTypingTarget(document.activeElement)) return;
  if (MODIFIERS.includes(event.key)) return;
  const descriptor = normalizeKey(event);
  const binding = findBinding('keyboard', descriptor);
  if (!binding) return;
  if (onAction) onAction(binding.actionId, { source: 'keyboard', descriptor, event });
}

export function startKeyboardProvider(callback) {
  onAction = callback; // callback é sempre o mesmo dispatch; atualiza sem risco
  startCount += 1;
  if (!listener) {
    listener = handleKeyDown;
    window.addEventListener('keydown', listener);
  }
}

export function stopKeyboardProvider() {
  if (startCount > 0) startCount -= 1;
  if (startCount === 0) {
    if (listener) {
      window.removeEventListener('keydown', listener);
      listener = null;
    }
    onAction = null;
  }
}

export function setCaptureMode(v) {
  captureMode = !!v;
}

export function isCaptureMode() {
  return captureMode;
}

export function isRunning() {
  return listener !== null;
}