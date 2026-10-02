// Home do LiveNexus — Landing page de apresentação da plataforma.
// Página limpa: navegação superior, Hero, espaço para imagem principal
// e primeira seção de apresentação do produto.
// Protegida por ProtectedRoute (mesma política do Dashboard).
import { Link } from 'react-router-dom';
import { ArrowRight, Radio, Mic2, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import HeroCarousel from '@dashboard/biblioteca/Library_HeroCarousel';
import StreamerStrip from '@dashboard/biblioteca/Library_StreamerStrip';
import ReviewsSection from '@dashboard/painel-admin/Review_Section';
import StreamersLivesSection from '@dashboard/biblioteca/Library_StreamersLivesSection';
import ContactSection from '@dashboard/configuracao/Config_ContactSection';
import LiveNexusLogo from '@dashboard/componentes/LiveNexusLogo';

const NAV_LINKS = [
  { label: 'Plataforma', href: '#plataforma' },
  { label: 'Recursos', href: '#recursos' },
  { label: 'Painel', to: '/dashboard' },
];

const FEATURES = [
  { icon: Mic2, title: 'Leitura de voz', desc: 'Sintetizador nativo do navegador lê mensagens do chat em tempo real, sem custos adicionais.' },
  { icon: Radio, title: 'Multi-plataforma', desc: 'Twitch, Kick e YouTube conectados simultaneamente em um único painel unificado.' },
  { icon: Sparkles, title: 'Transmissão em Tempo Real', desc: 'Comunicação ultrarrápida e sincronizada para sua transmissão diretamente no navegador.' },
  { icon: ShieldCheck, title: 'Filtros inteligentes', desc: 'Controle de flood, palavras proibidas, cooldown e anti-spam para uma leitura limpa.' },
];

export default function Home() {
  return (
    <div className="min-h-screen text-slate-200">
      {/* Navegação superior */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <LiveNexusLogo />
          </Link>
          <div className="hidden items-center gap-7 sm:flex">
            {NAV_LINKS.map((l, i) =>
              l.to ? (
                <Link key={i} to={l.to} className="text-[13px] font-medium text-slate-300 transition hover:text-white">{l.label}</Link>
              ) : (
                <a key={i} href={l.href} className="text-[13px] font-medium text-slate-300 transition hover:text-white">{l.label}</a>
              )
            )}
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-4 py-2 text-[13px] font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-600"
          >
            Acessar painel <ArrowRight size={14} />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            {/* Texto */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-medium text-violet-200">
                <Zap size={12} /> TTS chat reader para streamers
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">A nova plataforma feita para streamers.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-slate-400 lg:mx-0">
                O LiveNexus conecta Twitch, Kick e YouTube em um único painel e transforma
                as mensagens do seu chat em voz, em tempo real — direto do navegador, sem custos extras.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  to="/dashboard"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-500/25 transition hover:bg-violet-600 sm:w-auto"
                >
                  Entrar no LiveNexus <ArrowRight size={16} />
                </Link>
                <a
                  href="#plataforma"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 sm:w-auto"
                >
                  Conhecer a plataforma
                </a>
              </div>
            </div>

            {/* Carrossel principal de recursos */}
            <div className="relative">
              <HeroCarousel />
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-violet-500/10 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Faixa de streamers da comunidade */}
      <StreamerStrip />

      {/* Lives de Streamers */}
      <StreamersLivesSection />

      {/* Primeira seção de apresentação do produto */}
      <section id="plataforma" className="border-t border-white/10 bg-black/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-white md:text-3xl">Tudo que você precisa para interagir com seu chat</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-400">
              Uma plataforma construída para streamers que querem dar voz ao seu chat e
              personalizar a experiência da transmissão sem complicação técnica.
            </p>
          </div>

          <div id="recursos" className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-violet-500/30 hover:bg-violet-500/5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 transition group-hover:bg-violet-500/25">
                  <f.icon size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA final da seção */}
          <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 p-8 text-center">
            <h3 className="text-lg font-bold text-white md:text-xl">Pronto para dar voz ao seu chat?</h3>
            <p className="max-w-md text-[13px] text-slate-400">
              Acesse o painel e conecte suas plataformas em segundos.
            </p>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-500/25 transition hover:bg-violet-600"
            >
              Acessar o painel <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Avaliações da comunidade */}
      <ReviewsSection />

      {/* Contato */}
      <ContactSection />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-[11px] text-slate-500 md:flex-row md:px-8">
          <LiveNexusLogo className="h-5 w-5" textClassName="text-xs font-medium text-slate-400" />
          <p>Plataforma LiveNexus para streamers · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}