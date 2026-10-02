import React from 'react';
import { selectedPlatforms, STREAM_PLATFORMS } from './Overlay_platformData';

export default function PlatformControls({ instance, onUpdateInstance }) {
  const enabled = selectedPlatforms(instance.config);

  return (
    <fieldset className="space-y-2 rounded-lg border border-white/10 p-3">
      <legend className="px-1 text-xs font-semibold text-slate-300">Plataformas habilitadas</legend>
      <div className="grid grid-cols-3 gap-2">
        {STREAM_PLATFORMS.map(platform => (
          <label key={platform} className="flex items-center gap-1.5 text-xs text-slate-200">
            <input
              type="checkbox"
              checked={enabled.includes(platform)}
              onChange={event => {
                const config = { ...instance.config };
                delete config.platform;
                const platforms = STREAM_PLATFORMS.filter(source =>
                  source === platform ? event.target.checked : enabled.includes(source)
                );
                onUpdateInstance(instance.id, { config: { ...config, platforms } });
              }}
            />
            {platform}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
