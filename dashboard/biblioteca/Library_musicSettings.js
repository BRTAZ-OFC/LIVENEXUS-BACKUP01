// Configurações do player de música — persistidas via localCache unificado com isolamento por userId.
import { localCache } from '@dashboard/configuracao/Config_localCache';
import { authClient } from '@dashboard/login/authClient';

function getCurrentUserId() {
  try {
    return authClient.getUserDataCache()?.id || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

export const DEFAULT_MUSIC_SETTINGS = {
  volume: 80,
  repeat: 'off', // 'off' | 'one' | 'all'
  shuffle: false,
  overlay: {
    showArt: true,
    showArtist: true,
    showAlbum: true,
    showProgress: true,
    marqueeSpeed: 30, // segundos para uma rolagem completa
    opacity: 0.82,
    position: 'bottom-right', // bottom-left | bottom-right | top-left | top-right
    size: 'md', // sm | md | lg
  },
};

export function loadMusicSettings() {
  try {
    const userId = getCurrentUserId();
    const cached = localCache.get(userId, 'music_settings');
    if (!cached || typeof cached !== 'object') return { ...DEFAULT_MUSIC_SETTINGS };
    return {
      ...DEFAULT_MUSIC_SETTINGS,
      ...cached,
      overlay: { ...DEFAULT_MUSIC_SETTINGS.overlay, ...(cached.overlay || {}) },
    };
  } catch {
    return { ...DEFAULT_MUSIC_SETTINGS };
  }
}

export function saveMusicSettings(settings) {
  try {
    const userId = getCurrentUserId();
    localCache.set(userId, 'music_settings', settings);
  } catch { /* ignore */ }
}

export function updateMusicSettings(patch) {
  const current = loadMusicSettings();
  const next = { ...current, ...patch };
  saveMusicSettings(next);
  return next;
}