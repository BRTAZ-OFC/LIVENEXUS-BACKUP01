// Configurações do player de música — sem cache, estado em tempo de execução.
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

let currentSettings = { ...DEFAULT_MUSIC_SETTINGS };

export function loadMusicSettings() {
  return {
    ...DEFAULT_MUSIC_SETTINGS,
    ...currentSettings,
    overlay: { ...DEFAULT_MUSIC_SETTINGS.overlay, ...(currentSettings.overlay || {}) },
  };
}

export function saveMusicSettings(settings) {
  currentSettings = {
    ...DEFAULT_MUSIC_SETTINGS,
    ...settings,
    overlay: { ...DEFAULT_MUSIC_SETTINGS.overlay, ...(settings?.overlay || {}) },
  };
}

export function updateMusicSettings(patch) {
  const current = loadMusicSettings();
  const next = { ...current, ...patch };
  saveMusicSettings(next);
  return next;
}
