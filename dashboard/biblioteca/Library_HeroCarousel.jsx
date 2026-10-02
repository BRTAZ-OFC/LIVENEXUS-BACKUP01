// HeroCarousel — Carrossel visual de recursos da Página Inicial do LiveNexus.
// Slide 1: imagem de apresentação geral. Slides 2+: recursos existentes.
// Auto-advance 6s, controles manuais (prev/next/indicadores), swipe no mobile,
// loop suave de volta ao primeiro slide. Apenas APRESENTA — não executa nada.
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Mic2, MessagesSquare, SlidersHorizontal, Radio } from 'lucide-react';

const OVERVIEW_IMAGE = 'https://media.base44.com/images/public/6a99b71b385351878a56dd38/79ae704bb_live.png';
const AUTO_MS = 6000;

const FEATURE_SLIDES = [
  { icon: Mic2, title: 'TTS', desc: 'Leitura por voz do chat em tempo real, direto do navegador.' },
  { icon: MessagesSquare, title: 'Multi-Chat', desc: 'Twitch, Kick e YouTube conectados em um único painel.' },
  { icon: SlidersHorizontal, title: 'Filtros', desc: 'Moderação inteligente: flood, palavras proibidas e cooldown.' },
  { icon: Radio, title: 'Conexão em Tempo Real', desc: 'Transmissão sincronizada e ultra-rápida via RTC e canais locais.' },
];

export default function HeroCarousel() {
  const total = FEATURE_SLIDES.length + 1;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  const next = useCallback(() => setIndex(i => (i + 1) % total), [total]);
  const prev = useCallback(() => setIndex(i => (i - 1 + total) % total), [total]);
  const goTo = useCallback((i) => setIndex(i), []);

  // Auto-advance a cada 6s (pausa no hover)
  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, AUTO_MS);
    return () => clearInterval(t);
  }, [next, paused]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) { delta < 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Container dos slides — crossfade suave, loop sem recarregar */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl sm:aspect-[16/10]">
        {/* Slide 1 — imagem de apresentação (proporção preservada) */}
        <div className={`absolute inset-0 transition-opacity duration-700 ease-out ${index === 0 ? 'opacity-100' : 'opacity-0'}`}>
          <img src={OVERVIEW_IMAGE} alt="LiveNexus — apresentação geral" className="h-full w-full object-contain" />
        </div>
        {/* Slides 2+ — recursos (limpos: ícone + título + descrição) */}
        {FEATURE_SLIDES.map((slide, i) => {
          const active = index === i + 1;
          return (
            <div
              key={i}
              className={`absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center transition-opacity duration-700 ease-out sm:p-10 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.12),transparent_65%)]" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 shadow-lg shadow-violet-500/20 sm:h-20 sm:w-20">
                <slide.icon size={32} />
              </div>
              <div className="relative">
                <h3 className="text-xl font-bold text-white sm:text-2xl">{slide.title}</h3>
                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-slate-400 sm:text-sm">{slide.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controles manuais */}
      <button
        onClick={prev}
        aria-label="Slide anterior"
        className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-sm transition hover:bg-violet-500/30 sm:h-10 sm:w-10"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        aria-label="Próximo slide"
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-sm transition hover:bg-violet-500/30 sm:h-10 sm:w-10"
      >
        <ChevronRight size={18} />
      </button>

      {/* Indicadores */}
      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ir para slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${index === i ? 'w-6 bg-violet-400' : 'w-2 bg-white/25 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}