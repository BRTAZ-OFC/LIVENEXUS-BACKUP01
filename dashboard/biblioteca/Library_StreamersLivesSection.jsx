// StreamersLivesSection — seção pública "Lives dos Streamers" na Página Inicial.
// Mostra streamers com até 3 VODs/Lives já salvos (mais recentes primeiro).
// Somente visualização; clicar na miniatura abre o VOD real. Sem polling.
import { useState, useEffect } from 'react';
import { getPublicLivesOnce } from '@dashboard/biblioteca/Library_publicLivesClient';
import { User, Loader2, Play, Radio } from 'lucide-react';

function fmtDuration(seconds) {
  if (!seconds || seconds < 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function StreamersLivesSection() {
  const [streamers, setStreamers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Bootstrap único da Home (dedup in-flight com StreamerStrip).
        const data = await getPublicLivesOnce();
        if (cancelled) return;
        setStreamers(data?.streamers || []);
      } catch (e) {
        console.error('StreamersLives load failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section id="lives" className="border-t border-white/10 bg-black/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
          <div className="mb-8 flex items-center gap-2">
            <Radio size={20} className="text-violet-300" />
            <h2 className="text-2xl font-bold text-white md:text-3xl">Lives de Streamers</h2>
          </div>
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-500" size={24} /></div>
        </div>
      </section>
    );
  }

  return (
    <section id="lives" className="border-t border-white/10 bg-black/30">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
        <div className="mb-8 flex items-center gap-2">
          <Radio size={20} className="text-violet-300" />
          <h2 className="text-2xl font-bold text-white md:text-3xl">Lives de Streamers</h2>
        </div>

        {streamers.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-500">
            Ainda não há lives disponíveis.
          </div>
        ) : (
        <div className="space-y-8">
          {streamers.map(({ streamer, lives }) => (
            <div key={streamer.id}>
              {/* Cabeçalho do streamer */}
              <div className="mb-3 flex items-center gap-3">
                {streamer.avatar ? (
                  <img src={streamer.avatar} alt={streamer.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-violet-500/30" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/15 text-violet-300 ring-2 ring-violet-500/30">
                    <User size={18} />
                  </span>
                )}
                <span className="text-sm font-semibold text-white">{streamer.name}</span>
                <span className="text-xs text-slate-500">{lives.length} live(s)</span>
              </div>

              {/* VODs — até 3 mais recentes */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lives.map(l => (
                  <a
                    key={l.id}
                    href={l.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-violet-500/30 hover:bg-violet-500/5"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                      {l.thumbnailUrl ? (
                        <img src={l.thumbnailUrl} alt={l.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-600">LIVE</div>
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/90 text-white">
                          <Play size={16} className="fill-current" />
                        </span>
                      </span>
                      {l.platform && (
                        <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">{l.platform}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-[13px] font-medium text-white">{l.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        {fmtDate(l.startedAt) && <span>{fmtDate(l.startedAt)}</span>}
                        {fmtDuration(l.duration) && (
                          <>
                            <span>·</span>
                            <span>{fmtDuration(l.duration)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}