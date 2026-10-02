// useCurrentMusicTrack — Hook reativo e passivo para overlays e visualizadores.
// Consome o estado musical global existente (playerEvents + BroadcastChannel + localStorage).
// NÃO faz buscas, NÃO faz polling, NÃO cria áudio/player secundário.
// Fundo transparente e zero impacto em performance.

import { useEffect, useState } from 'react';
import { playerEvents } from './Library_playerEvents';
import { getCurrentTrack } from './Library_youtubePlayer';

const STORAGE_KEY = 'streamspeak_music_state';

function readInitialTrack() {
  try {
    const live = getCurrentTrack();
    if (live && live.title) return live;
  } catch { /* ignore */ }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.track && parsed.track.title) return parsed.track;
    }
  } catch { /* ignore */ }

  return null;
}

export function useCurrentMusicTrack(options = {}) {
  const { isPreview = false, previewFallback = null } = options;
  const [track, setTrack] = useState(readInitialTrack);

  useEffect(() => {
    // 1. Escuta eventos do player na mesma aba
    const unsubs = [
      playerEvents.on('track_changed', (t) => setTrack(t || null)),
      playerEvents.on('track_started', (t) => setTrack(t || null)),
      playerEvents.on('track_resumed', (t) => setTrack(t || null)),
      playerEvents.on('track_paused', (t) => setTrack(t || null)),
      playerEvents.on('track_finished', () => setTrack(null)),
    ];

    // 2. Escuta BroadcastChannel para sincronizar entre abas/Browser Source
    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('streamspeak_music');
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'music_state') {
            setTrack(ev.data.track || null);
          }
        };
        // Solicita estado atual ao montar
        bc.postMessage({ type: 'music_request_state' });
      }
    } catch { /* ignore */ }

    // 3. Fallback de storage event (cross-tab)
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setTrack(parsed?.track || null);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubs.forEach((u) => { try { u(); } catch { /* ignore */ } });
      if (bc) { try { bc.close(); } catch { /* ignore */ } }
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (!track || !track.title) {
    if (isPreview && previewFallback) {
      return previewFallback;
    }
    return null;
  }

  return track;
}
