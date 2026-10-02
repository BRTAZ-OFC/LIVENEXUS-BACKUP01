import { Crown } from 'lucide-react';

export default function TopSpeakers({ counts }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = entries.length ? entries[0][1] : 1;
  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500"><Crown size={12} /> Top 5 Falantes</div>
      {!entries.length ? (
        <p className="py-2 text-center text-[12px] text-slate-600">Aguardando mensagens da live…</p>
      ) : (
        <div className="space-y-1">
          {entries.map(([author, count], i) => (
            <div key={author} className="flex items-center gap-2 text-[13px]">
              <span className="w-4 text-right text-slate-500">{i + 1}</span>
              <span className="w-28 truncate text-slate-200" title={author}>{author}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-violet-500" style={{ width: `${(count / max) * 100}%` }} /></div>
              <span className="w-8 text-right text-slate-400">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}