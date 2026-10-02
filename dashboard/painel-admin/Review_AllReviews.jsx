// AllReviews — visualização "Todas as Avaliações" dentro do LiveNexus.
// Lista o histórico completo, mantém a navegação do LiveNexus e permite voltar à Home.
// Consulta uma vez no mount (sem polling).
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReviewsOnce } from '@dashboard/painel-admin/Admin_reviewsBootstrap';
import StarRating from '@dashboard/componentes/StarRating';
import LiveNexusLogo from '@dashboard/componentes/LiveNexusLogo';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';

export default function AllReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        // Reaproveita o bootstrap da Home (cache de sessão). Sem nova chamada se já carregado.
        const list = await getReviewsOnce();
        setReviews(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('AllReviews load failed:', e);
        setError('Não foi possível carregar as avaliações no momento. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen text-slate-200">
      {/* Navegação do LiveNexus */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <LiveNexusLogo />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-medium text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft size={14} /> Voltar à página inicial
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Todas as avaliações</h1>
        <p className="mt-2 text-sm text-slate-400">Histórico completo da comunidade LiveNexus</p>

        <div className="mt-8">
          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-12 text-center text-sm text-red-400">
              <MessageSquare size={28} className="mx-auto mb-3 text-red-600" />
              {error}
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-500" size={24} /></div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center text-sm text-slate-500">
              <MessageSquare size={28} className="mx-auto mb-3 text-slate-600" />
              Nenhuma avaliação cadastrada ainda.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {reviews.map(r => (
                <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{r.name}</span>
                    <StarRating value={r.rating} size={14} />
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{r.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}