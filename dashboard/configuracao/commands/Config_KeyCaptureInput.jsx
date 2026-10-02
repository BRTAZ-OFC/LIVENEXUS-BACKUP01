import { useEffect, useRef, useState } from 'react';
import { normalizeKey, setCaptureMode } from '@dashboard/configuracao/actionEngine/providers/Config_keyboardProvider';
import { descriptorExists } from '@dashboard/configuracao/actionEngine/Config_bindingStore';

const MODIFIERS = ['Control', 'Shift', 'Alt', 'Meta'];

export default function KeyCaptureInput({ actionId, source = 'keyboard', onCommit, onCancel }) {
  const [conflict, setConflict] = useState(null);
  const cbRef = useRef({ onCommit, onCancel });
  cbRef.current = { onCommit, onCancel };

  useEffect(() => {
    setCaptureMode(true);
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') { cbRef.current.onCancel(); return; }
      if (MODIFIERS.includes(e.key)) return; // aguarda tecla não-modificadora
      const descriptor = normalizeKey(e);
      const conf = descriptorExists(source, descriptor, actionId);
      if (conf) { setConflict({ descriptor, conflict: conf }); return; }
      cbRef.current.onCommit(descriptor);
    };
    window.addEventListener('keydown', handler, true);
    return () => {
      window.removeEventListener('keydown', handler, true);
      setCaptureMode(false);
    };
  }, [actionId, source]);

  return (
    <div className="flex items-center gap-2">
      <span className="animate-pulse rounded-lg border border-violet-400/40 bg-violet-500/10 px-3 py-1.5 text-xs font-mono text-violet-200">
        Pressione uma combinação… (Esc para cancelar)
      </span>
      {conflict && (
        <span className="text-[11px] text-amber-300">
          {conflict.descriptor} já usado por {conflict.conflict.actionId}
        </span>
      )}
    </div>
  );
}