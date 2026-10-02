export default function ConflictBanner({ conflict }) {
  if (!conflict) return null;
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <p>
        Conflito: a combinação{' '}
        <span className="font-mono font-semibold">{conflict.descriptor}</span> já está atribuída a{' '}
        <span className="font-semibold">{conflict.conflict?.actionId || 'outra ação'}</span>.
      </p>
    </div>
  );
}