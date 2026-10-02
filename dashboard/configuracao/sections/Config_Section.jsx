import PlatformConnection from '@dashboard/configuracao/Config_PlatformConnection';
import { PLATFORMS } from '@dashboard/configuracao/Config_StreamingContext';

export default function ConfigSection({ connections, onConnectionChange, onToggle, linkedChannels, onVerified, onRenew }) {
  const names = PLATFORMS || ['Twitch', 'Kick', 'YouTube'];
  const makeLinked = (p) => {
    const l = linkedChannels?.[p];
    if (!l) return { status: 'not_configured', onVerified, onRenew };
    return { ...l, onVerified, onRenew };
  };
  return (
    <div className="w-full space-y-5">
      <header>
        <h2 className="text-lg font-semibold text-white">Configurações</h2>
        <p className="text-sm text-slate-400">Vincule e conecte suas plataformas de streaming</p>
      </header>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {names.map(p => (
          <PlatformConnection
            key={p}
            platform={p}
            config={connections[p]}
            onChange={(k, val) => onConnectionChange(p, k, val)}
            onToggle={() => onToggle(p)}
            linked={makeLinked(p)}
          />
        ))}
      </div>
    </div>
  );
}