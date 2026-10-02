import { useState, useCallback } from 'react';
import { listActions } from '@dashboard/configuracao/actionEngine/Config_actionRegistry';
import { getBindings, resetToDefaults } from '@dashboard/configuracao/actionEngine/Config_bindingStore';
import ActionRow from './Config_ActionRow';
import ConflictBanner from './Config_ConflictBanner';

export default function ActionList() {
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);
  void tick;

  const actions = listActions();
  const bindings = getBindings();
  const seen = new Map();
  const conflicts = [];
  for (const b of bindings) {
    const key = `${b.source}::${b.descriptor}`;
    if (seen.has(key)) conflicts.push({ descriptor: b.descriptor, conflict: seen.get(key) });
    else seen.set(key, b);
  }

  const handleReset = () => { resetToDefaults(); bump(); };

  return (
    <div className="space-y-3">
      {conflicts.length > 0 && <ConflictBanner conflict={conflicts[0]} />}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">TTS</h3>
        <button onClick={handleReset} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10">Restaurar padrões</button>
      </div>
      <div className="space-y-2">
        {actions.map((a) => (
          <ActionRow key={a.id} actionId={a.id} onChange={bump} />
        ))}
      </div>
    </div>
  );
}