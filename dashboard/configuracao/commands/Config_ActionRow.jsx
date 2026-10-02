import { useState } from 'react';
import { getAction } from '@dashboard/configuracao/actionEngine/Config_actionRegistry';
import { getBindingForAction, setBinding, toggleBinding } from '@dashboard/configuracao/actionEngine/Config_bindingStore';
import KeyCaptureInput from './Config_KeyCaptureInput';

function SafetyBadge({ safety }) {
  if (safety === 'CAUTION')
    return <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">Cuidado</span>;
  if (safety === 'DANGEROUS')
    return <span className="rounded-full border border-red-400/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-300">Perigo</span>;
  return <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Seguro</span>;
}

function KbdBadge({ descriptor }) {
  if (!descriptor) return <span className="text-xs text-slate-500">—</span>;
  const parts = descriptor.split('+');
  return (
    <span className="flex items-center gap-1">
      {parts.map((p, i) => (
        <kbd key={i} className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-200">{p}</kbd>
      ))}
    </span>
  );
}

export default function ActionRow({ actionId, onChange }) {
  const action = getAction(actionId);
  const [editing, setEditing] = useState(false);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);
  void version; // força re-leitura do binding
  const binding = getBindingForAction(actionId, 'keyboard');

  const handleCommit = (descriptor) => {
    const res = setBinding(actionId, 'keyboard', descriptor);
    if (res.ok) { setEditing(false); reload(); onChange?.(); }
  };
  const handleCancel = () => setEditing(false);
  const handleToggle = () => {
    toggleBinding(actionId, 'keyboard', !(binding && binding.enabled));
    reload(); onChange?.();
  };

  if (!action) return null;
  const enabled = binding ? binding.enabled : false;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3 md:flex-row md:items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{action.label}</span>
          <SafetyBadge safety={action.safety} />
        </div>
        <p className="mt-0.5 text-xs text-slate-400">{action.description}</p>
        <p className="mt-1 font-mono text-[10px] text-slate-600">{action.id}</p>
      </div>
      <div className="flex items-center gap-3">
        {editing ? (
          <KeyCaptureInput actionId={actionId} onCommit={handleCommit} onCancel={handleCancel} />
        ) : (
          <KbdBadge descriptor={binding?.descriptor} />
        )}
        {!editing && (
          <>
            <button onClick={() => setEditing(true)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10">Editar</button>
            <button onClick={handleToggle} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${enabled ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
              {enabled ? 'Ativo' : 'Inativo'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}