// StreamerStrip — faixa horizontal contínua (marquee) de streamers da comunidade.
// Consulta usuários reais UMA vez no mount (sem polling), seleciona até 20,
// mostra somente avatar + display name. Movimento puramente frontend.
import { useState, useEffect } from 'react';
import { getPublicLivesOnce } from '@dashboard/biblioteca/Library_publicLivesClient';
import { User } from 'lucide-react';

export default function StreamerStrip() {
  const [streamers, setStreamers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Consome o bootstrap único da Home (getPublicLives). Elimina o User.list
        // direto (duplicava a leitura de usuários e falhava para não-admins por RLS).
        const data = await getPublicLivesOnce();
        if (cancelled) return;
        setStreamers(Array.isArray(data?.allStreamers) ? data.allStreamers : []);
      } catch (e) {
        // Sem streamers — faixa fica vazia silenciosamente.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading || streamers.length === 0) return null;

  // Duplica a lista para loop contínuo sem corte visual (marquee translateX -50%)
  const loop = [...streamers, ...streamers];

  return (
    <section className="border-y border-white/10 bg-black/30 py-8">
      <div className="mx-auto mb-5 max-w-6xl px-4 md:px-8">
        <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Streamers que já fazem parte
        </h2>
      </div>
      <div className="relative overflow-hidden">
        {/* Fade nas bordas para suavizar entrada/saída */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black/30 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black/30 to-transparent" />
        <div className="lnx-marquee-track" style={{ animation: 'lnx-marquee 40s linear infinite' }}>
          {loop.map((s, i) => (
            <div key={`${s.id}-${i}`} className="lnx-marquee-item gap-3">
              {s.avatar ? (
                <img src={s.avatar} alt={s.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/15 text-violet-300 ring-2 ring-white/10">
                  <User size={18} />
                </span>
              )}
              <span className="text-[13px] font-medium text-slate-300">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}