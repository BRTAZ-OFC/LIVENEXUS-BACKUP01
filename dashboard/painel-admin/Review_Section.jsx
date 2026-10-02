// ReviewsSection — seção de avaliações da comunidade na Página Inicial.
// Mostra as 6 avaliações mais recentes + formulário de nova avaliação + "Ver mais".
// Bootstrap único no mount (compartilhado com /avaliacoes). Após envio, atualiza estado local (sem refetch).
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewRepository } from '@dashboard/configuracao/Config_liveNexusDataAdapter';
import { getReviewsOnce, prependReview } from '@dashboard/painel-admin/Admin_reviewsBootstrap';
import StarRating from '@dashboard/componentes/StarRating';
import { Loader2, Send, MessageSquare } from 'lucide-react';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', message: '', rating: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadReviews = async () => {
    try {
      // Bootstrap único (compartilhado com /avaliacoes). Slice local para 6 mais recentes.
      const list = await getReviewsOnce();
      setReviews(Array.isArray(list) ? list.slice(0, 6) : []);
    } catch (e) {
      console.error('Reviews load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim() || !form.rating) {
      setError('Preencha todos os campos e selecione uma nota de 1 a 5.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await reviewRepository.create({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        rating: form.rating,
      });
      // Escrita → resposta → atualiza estado local + cache de sessão. Sem refetch.
      prependReview(created);
      setReviews(prev => [created, ...prev].slice(0, 6));
      setForm({ name: '', email: '', message: '', rating: 0 });
    } catch (e) {
      setError('Não foi possível enviar a avaliação. Tente novamente.');
    }
    setSubmitting(false);
  };

  return (
    <section id="avaliacoes" className="border-t border-white/10 bg-black/30">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">Avaliações da comunidade</h2>
          <p className="mt-2 text-sm text-slate-400">O que os streamers dizem sobre o LiveNexus</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Lista — 6 avaliações mais recentes */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300">Mais recentes</h3>
              <Link to="/avaliacoes" className="text-xs font-medium text-violet-300 transition hover:text-violet-200">
                Ver mais →
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-500" size={22} /></div>
            ) : reviews.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-500">
                <MessageSquare size={24} className="mx-auto mb-2 text-slate-600" />
                Nenhuma avaliação ainda. Seja o primeiro a avaliar!
              </div>
            ) : (
              <div className="space-y-3">
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

          {/* Formulário de nova avaliação */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Deixe sua avaliação</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Seu nome"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="seu@email.com"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                />
                <p className="mt-1 text-[10px] text-slate-600">Não será exibido publicamente.</p>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Avaliação</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Conte sua experiência com o LiveNexus"
                  rows={3}
                  className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Nota</label>
                <div className="mt-1">
                  <StarRating
                    mode="input"
                    value={form.rating}
                    onChange={v => setForm(f => ({ ...f, rating: v }))}
                    size={26}
                  />
                </div>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-600 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar avaliação
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}