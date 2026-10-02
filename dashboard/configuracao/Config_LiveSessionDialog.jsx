// LiveSessionDialog — visualizar e editar uma LiveSession.
// Modo view: mostra todos os dados da live.
// Modo edit: permite alterar somente campos editáveis (title, notes).
// NUNCA permite alterar id ou userId (created_by_id).
import { useState, useEffect } from 'react';
import { X, Save, ExternalLink, Loader2 } from 'lucide-react';
import { liveSessionService } from '@dashboard/configuracao/Config_liveSessionService';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR');
}

function fmtDuration(seconds) {
  if (!seconds || seconds < 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function LiveSessionDialog({ session, open, edit, onClose, onSave }) {
  const [editing, setEditing] = useState(edit || false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session) {
      setTitle(session.title || '');
      setNotes(session.notes || '');
      setEditing(edit || false);
    }
  }, [session, edit]);

  if (!open || !session) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await liveSessionService.updateSession(session.id, null, { title: title.trim(), notes: notes.trim() });
      setEditing(false);
      if (onSave) await onSave({ ...session, title: title.trim(), notes: notes.trim() });
    } catch (e) {
      console.error('Failed to update session:', e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d15]" onClick={e => e.stopPropagation()}>
        <div className="relative aspect-video w-full bg-black/60">
          {session.thumbnailUrl && <img src={session.thumbnailUrl} alt={session.title} className="h-full w-full object-cover" />}
          <button onClick={onClose} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white transition hover:bg-black/90">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {editing ? (
            <>
              <div>
                <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Título</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Notas</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving || !title.trim()} className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-600 disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
                </button>
                <button onClick={() => setEditing(false)} className="rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">Cancelar</button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-bold text-white">{session.title}</h2>
                {session.channelName && <p className="text-sm text-slate-400">{session.channelName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Plataforma:</span> <span className="text-white">{session.platform || '—'}</span></div>
                <div><span className="text-slate-500">Duração:</span> <span className="text-white">{fmtDuration(session.duration)}</span></div>
                <div><span className="text-slate-500">Início:</span> <span className="text-white">{fmtDate(session.startedAt)}</span></div>
                <div><span className="text-slate-500">Fim:</span> <span className="text-white">{fmtDate(session.endedAt)}</span></div>
              </div>
              {session.notes && <p className="border-t border-white/5 pt-3 text-sm text-slate-300">{session.notes}</p>}
              <div className="flex gap-2">
                {session.streamUrl && (
                  <a href={session.streamUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/25">
                    <ExternalLink size={14} /> Abrir transmissão
                  </a>
                )}
                <button onClick={() => setEditing(true)} className="rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">Editar</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}