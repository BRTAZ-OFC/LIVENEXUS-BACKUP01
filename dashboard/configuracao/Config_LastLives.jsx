// LastLives — seção "Últimas Lives" do Dashboard.
// Carrossel horizontal com as 10 LiveSessions mais recentes com vodStatus = available.
import { useState, useEffect, useRef } from 'react';
import { Radio, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import LiveSessionCard from '@dashboard/configuracao/Config_LiveSessionCard';
import LiveSessionDialog from '@dashboard/configuracao/Config_LiveSessionDialog';

export default function LastLives() {
  const { sessions, isLoading } = useNewUserDataCentral();
  const [savedLives, setSavedLives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSession, setOpenSession] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    const list = Array.isArray(sessions) ? sessions : [];
    setSavedLives(list.filter(s => s.vodStatus === 'available').slice(0, 10));
    setLoading(isLoading);
  }, [sessions, isLoading]);

  const scrollCarousel = (dir) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-black/80 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Lives de Streamers</h2>
          <p className="text-xs text-slate-400">Transmissões com gravação disponível</p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">{savedLives.length}/10</span>
      </div>

      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="animate-spin text-slate-600" size={24} />
        </div>
      ) : savedLives.length === 0 ? (
        <div className="grid place-items-center py-10 text-center">
          <Radio className="mb-2 text-slate-600" size={26} />
          <p className="text-sm font-medium text-slate-400">Nenhuma live com gravação no momento</p>
          <p className="mt-1 text-xs text-slate-500">Transmissões encerradas com VOD serão exibidas aqui</p>
        </div>
      ) : (
        <div className="relative group">
          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto scrollbar-none py-1 px-1 snap-x snap-mandatory"
          >
            {savedLives.map((session) => (
              <div key={session.id} className="min-w-[280px] max-w-[320px] shrink-0 snap-start">
                <LiveSessionCard
                  session={session}
                  compact
                  onOpen={() => setOpenSession(session)}
                />
              </div>
            ))}
          </div>

          {savedLives.length > 2 && (
            <>
              <button
                onClick={() => scrollCarousel(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 p-1.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700/80 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800 hover:text-white"
                title="Anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollCarousel(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 p-1.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700/80 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800 hover:text-white"
                title="Próximo"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {openSession && (
        <LiveSessionDialog
          session={openSession}
          readOnly
          onClose={() => setOpenSession(null)}
        />
      )}
    </section>
  );
}
