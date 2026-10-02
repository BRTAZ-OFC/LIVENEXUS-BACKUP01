// TTSMusicIntegration — comunicação entre o TTS e o player de música.
// Baixa o volume da música para 20% quando o TTS está falando e restaura após o término.
// Não altera o funcionamento do TTS — apenas notifica o player via eventos.
// Também rastreia qual sistema está produzindo áudio no momento.

import { playerEvents } from './Library_playerEvents';

let ttsActive = false;
let duckingEnabled = true;
let duckingLevel = 0.2; // volume da música durante TTS (20% do volume normal configurado)
let watchdogTimer = null;
let duckBroadcastChannel = null;

try {
  if (typeof BroadcastChannel !== 'undefined') {
    duckBroadcastChannel = new BroadcastChannel('streamspeak_tts_duck');
  }
} catch { /* ignore */ }

function startWatchdog() {
  stopWatchdog();
  let idleCount = 0;
  watchdogTimer = setInterval(() => {
    if (!ttsActive) {
      stopWatchdog();
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        idleCount++;
        // Se após 2 checagens consecutivas (~500ms) a síntese de voz estiver inativa, encerra o ducking
        if (idleCount >= 2) {
          onTtsEnd();
          stopWatchdog();
        }
      } else {
        idleCount = 0;
      }
    }
  }, 250);
}

function stopWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

// Chamado pelo ttsEngine/scheduler quando o TTS começa a falar.
// Reduz o volume da música para 20% do volume configurado naquele momento e emite evento para o player.
export function onTtsStart() {
  if (ttsActive) return;
  ttsActive = true;
  if (duckingEnabled) {
    playerEvents.emit('tts_duck_start', { duckedLevel: duckingLevel });
    try {
      duckBroadcastChannel?.postMessage({ type: 'tts_duck_start', duckedLevel: duckingLevel });
    } catch { /* ignore */ }
  }
  playerEvents.emit('audio_source_changed', { source: 'tts' });
  startWatchdog();
}

// Chamado pelo ttsEngine/scheduler quando o TTS termina de falar.
// Restaura exatamente o volume que estava ativo antes da redução.
export function onTtsEnd() {
  if (!ttsActive) return;
  ttsActive = false;
  stopWatchdog();
  if (duckingEnabled) {
    playerEvents.emit('tts_duck_end', {});
    try {
      duckBroadcastChannel?.postMessage({ type: 'tts_duck_end' });
    } catch { /* ignore */ }
  }
  playerEvents.emit('audio_source_changed', { source: 'music' });
}

export function isTtsActive() { return ttsActive; }
export function isDuckingEnabled() { return duckingEnabled; }
export function getDuckingLevel() { return duckingLevel; }

export function setDuckingEnabled(enabled) {
  duckingEnabled = !!enabled;
  // Se desativou enquanto TTS está ativo, restaura o volume
  if (!duckingEnabled && ttsActive) {
    onTtsEnd();
  }
}

export function setDuckingLevel(level) {
  duckingLevel = Math.min(1, Math.max(0, Number(level) || 0));
  // Se TTS está ativo, atualiza o nível aplicado
  if (ttsActive && duckingEnabled) {
    playerEvents.emit('tts_duck_start', { duckedLevel: duckingLevel });
    try {
      duckBroadcastChannel?.postMessage({ type: 'tts_duck_start', duckedLevel: duckingLevel });
    } catch { /* ignore */ }
  }
}
