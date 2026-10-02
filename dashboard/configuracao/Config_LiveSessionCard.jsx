// LiveSessionCard — card reutilizável para uma LiveSession.
// Trata três estados de vodStatus:
// - available: thumbnail normal, botão Abrir ativo
// - pending: indicador "Processando", sem Abrir
// - unavailable: indicador "Indisponível", sem Abrir, pode apagar
import { useState } from 'react';
import { Calendar, Pencil, Trash2, Eye, Loader2, AlertCircle } from 'lucide-react';
import { colorOf } from '@dashboard/configuracao/Config_platformColors';

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(seconds) {
  if (!seconds || seconds < 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function LiveSessionCard({ session, onOpen, onEdit, onDelete }) {
  const [err, setErr] = useState(false);
  const c = colorOf(session.platform);
  const date = fmtDate(session.startedAt || session.created_date);
  const duration = fmtDuration(session.duration);
  const isAvailable = session.vodStatus === 'available';
  const isPending = session.vodStatus === 'pending';
  const isUnavailable = session.vodStatus === 'unavailable';

  return (
    <article className={`overflow-hidden rounded-xl border border-white/[0.07] bg-black/40 ${!isAvailable ? 'opacity-60' : ''}`}>
      <div className="relative aspect-video w-full overflow-hidden bg-black/60">
        {isAvailable && session.thumbnailUrl && !err ? (
          <img src={session.thumbnailUrl} alt={session.title} loading="lazy" className="h-full w-full object-cover" onError={() => setErr(true)} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1">
            {isPending ? (
              <>
                <Loader2 size={20} className="animate-spin text-slate-600" />
                <span className="text-[10px] text-slate-500">Processando</span>
              </>
            ) : isUnavailable ? (
              <>
                <AlertCircle size={20} className="text-slate-600" />
                <span className="text-[10px] text-slate-500">Indisponível</span>
              </>
            ) : (
              <span className="text-[11px] font-medium tracking-wider text-slate-600">LIVE NEXUS</span>
            )}
          </div>
        )}
        {session.platform && (
          <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold ${c.text}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.dot}`} />{session.platform}
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="truncate text-sm font-medium text-white" title={session.title}>{session.title}</h3>
        {session.channelName && <p className="truncate text-[11px] text-slate-400">{session.channelName}</p>}
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {date && <span className="flex items-center gap-1"><Calendar size={11} /> {date}</span>}
          {duration && <span>· {duration}</span>}
        </div>
        <div className="flex gap-1.5 pt-1">
          {isAvailable ? (
            <button onClick={() => onOpen(session)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-violet-500/15 px-2 py-1.5 text-xs font-medium text-violet-200 transition hover:bg-violet-500/25">
              <Eye size={12} /> Abrir
            </button>
          ) : (
            <span className="flex flex-1 items-center justify-center rounded-lg bg-white/5 px-2 py-1.5 text-xs text-slate-500">
              {isPending ? 'Processando' : 'Indisponível'}
            </span>
          )}
          {onEdit && isAvailable && (
            <button onClick={() => onEdit(session)} className="flex items-center justify-center rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">
              <Pencil size={12} />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(session.id)} className="flex items-center justify-center rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 transition hover:bg-red-500/20">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}