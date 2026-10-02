import React from 'react';
import { useMusicPlayer } from '@dashboard/biblioteca/Library_useMusicPlayer';
import { play, pause, playNext, playPrev, setVolume } from '@dashboard/biblioteca/Library_youtubePlayer';
import { updateMusicSettings } from '@dashboard/biblioteca/Library_musicSettings';
import { playerEvents } from '@dashboard/biblioteca/Library_playerEvents';
import { Play, Pause, SkipBack, SkipForward, Music, Shuffle, Repeat, Repeat1, Volume2, VolumeX } from 'lucide-react';

export default function CompactMusicPlayer() {
  const { track, isPlaying, settings } = useMusicPlayer();
  const [prevVolume, setPrevVolume] = React.useState(settings?.volume > 0 ? settings.volume : 80);

  if (!track) return null;

  const toggleShuffle = () => {
    const newSettings = updateMusicSettings({ shuffle: !settings.shuffle });
    playerEvents.emit('player_volume_changed', newSettings); // reaproveitando evento genérico de config
  };

  const toggleRepeat = () => {
    const modes = ['off', 'all', 'one'];
    const idx = modes.indexOf(settings.repeat);
    const nextMode = modes[(idx + 1) % modes.length];
    const newSettings = updateMusicSettings({ repeat: nextMode });
    playerEvents.emit('player_volume_changed', newSettings); // reaproveitando evento genérico de config
  };

  const toggleMute = () => {
    if (settings.volume > 0) {
      setPrevVolume(settings.volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 80);
    }
  };

  return (
    <div className="shrink-0 border-t border-white/10 p-2 flex flex-col gap-2">
      {/* Informações da Faixa: Visível apenas no desktop */}
      <div className="hidden md:flex items-center gap-2 overflow-hidden bg-white/5 rounded-lg p-2 border border-white/5">
        <div className="h-8 w-8 rounded bg-violet-500/20 flex items-center justify-center shrink-0 overflow-hidden">
          {track.thumbnail ? (
            <img src={track.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <Music size={14} className="text-violet-300" />
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[11px] font-medium text-white truncate leading-tight">{track.title}</span>
          <span className="text-[9px] text-slate-400 truncate">{track.artist || track.author || 'Desconhecido'}</span>
        </div>
      </div>

      {/* Controles: Playback */}
      <div className="flex items-center justify-between px-1">
        
        {/* Lado Esquerdo: Shuffle / Repeat (Mobile Hiden) */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={toggleShuffle} className={`transition ${settings.shuffle ? 'text-violet-400' : 'text-slate-500 hover:text-white'}`}>
            <Shuffle size={12} />
          </button>
          <button onClick={toggleRepeat} className={`transition ${settings.repeat !== 'off' ? 'text-violet-400' : 'text-slate-500 hover:text-white'}`}>
            {settings.repeat === 'one' ? <Repeat1 size={12} /> : <Repeat size={12} />}
          </button>
        </div>

        {/* Central: Play/Pause/Prev/Next */}
        <div className="flex items-center justify-center gap-1 md:gap-3 flex-1">
          <button onClick={playPrev} className="hidden md:block text-slate-400 hover:text-white transition">
            <SkipBack size={14} />
          </button>

          {/* Botão de Play/Pause principal com cover no mobile */}
          <div className="relative h-8 w-8 md:h-auto md:w-auto flex items-center justify-center rounded cursor-pointer" onClick={() => isPlaying ? pause() : play()}>
             <div className="md:hidden absolute inset-0 rounded overflow-hidden opacity-50 bg-violet-500/20">
               {track.thumbnail && <img src={track.thumbnail} className="h-full w-full object-cover" alt="" />}
             </div>
             <button className="relative z-10 text-white hover:text-violet-300 transition md:bg-transparent rounded-full p-1 md:p-0 pointer-events-none">
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5 md:ml-0" />}
            </button>
          </div>

          <button onClick={playNext} className="hidden md:block text-slate-400 hover:text-white transition">
            <SkipForward size={14} />
          </button>
        </div>

        {/* Lado Direito: Volume (Mobile Hiden) */}
        <div className="hidden md:flex items-center gap-1 group relative">
           <button onClick={toggleMute} className="text-slate-500 hover:text-white transition">
            {settings.volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-12 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
