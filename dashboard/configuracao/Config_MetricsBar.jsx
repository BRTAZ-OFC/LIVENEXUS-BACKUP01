import { Users, MessageSquare, AudioLines, Radio } from 'lucide-react';
import { colorOf } from '@dashboard/configuracao/Config_platformColors';

export default function MetricsBar({ connected, messagesCount, ttsCount }) {
  const channelSize = connected.length >= 3 ? 'text-xs' : connected.length === 2 ? 'text-sm' : 'text-lg';
  const viewersList = connected.filter(c => typeof c.viewers === 'number');
  const anyViewers = viewersList.length > 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-xl border border-white/10 bg-black/80 p-4">
        <div className="flex items-center gap-2 text-slate-400"><Radio size={15} /><span className="text-[11px] uppercase tracking-wider">Canal Conectado</span></div>
        {connected.length ? (
          <div className={`mt-2 font-bold text-white ${channelSize}`}>
            {connected.map(c => (
              <div key={c.platform} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${colorOf(c.platform).dot}`} />
                <span className="truncate">{c.channel || c.platform}</span>
              </div>
            ))}
          </div>
        ) : <p className="mt-2 text-lg font-bold text-white">Nenhum canal</p>}
        <p className="text-[11px] text-slate-500">{connected.length ? `${connected.length} conectado(s)` : '—'}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/80 p-4">
        <div className="flex items-center gap-2 text-slate-400"><Users size={15} /><span className="text-[11px] uppercase tracking-wider">Espectadores</span></div>
        {anyViewers ? (
          <div className="mt-2 space-y-0.5">
            {viewersList.map(c => (
              <div key={c.platform} className={`flex items-center gap-1.5 text-sm font-bold ${c.platform === 'YouTube' ? 'text-red-400' : 'text-white'}`}>
                <span className={`h-2 w-2 rounded-full ${colorOf(c.platform).dot}`} />
                {c.viewers.toLocaleString('pt-BR')}
              </div>
            ))}
          </div>
        ) : <p className="mt-2 text-lg font-bold text-white">—</p>}
        <p className="text-[11px] text-slate-500">{anyViewers ? 'Atualizando…' : '—'}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/80 p-4">
        <div className="flex items-center gap-2 text-slate-400"><MessageSquare size={15} /><span className="text-[11px] uppercase tracking-wider">Mensagens</span></div>
        <p className="mt-2 text-lg font-bold text-white">{messagesCount}</p>
        <p className="text-[11px] text-slate-500">Recebidas</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/80 p-4">
        <div className="flex items-center gap-2 text-slate-400"><AudioLines size={15} /><span className="text-[11px] uppercase tracking-wider">TTS</span></div>
        <p className="mt-2 text-lg font-bold text-white">{ttsCount}</p>
        <p className="text-[11px] text-slate-500">Lidas em voz alta</p>
      </div>
    </div>
  );
}