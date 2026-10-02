// ContactSection — seção de Contato da Página Inicial.
// Formulário (nome, e-mail, categoria, mensagem) persiste um registro Contact via contactRepository.
// Sem autosave e sem polling. A administração fica no Dashboard autenticado.
import { useState } from 'react';
import { contactRepository } from '@dashboard/configuracao/Config_liveNexusDataAdapter';
import { Loader2, Send, Check } from 'lucide-react';

const CATEGORIES = ['Sugestão', 'Dúvida', 'Bug', 'Parceria', 'Outro'];

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', category: 'Sugestão', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setSubmitting(true);
    try {
      await contactRepository.create({
        name: form.name.trim(),
        email: form.email.trim(),
        category: form.category,
        message: form.message.trim(),
      });
      setForm({ name: '', email: '', category: 'Sugestão', message: '' });
      setSent(true);
    } catch {
      setError('Não foi possível enviar a mensagem. Tente novamente.');
    }
    setSubmitting(false);
  };

  return (
    <section id="contato" className="border-t border-white/10 bg-black/30">
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-20">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">Contato</h2>
          <p className="mt-2 text-sm text-slate-400">Tem algo a dizer? Envie sua mensagem para a equipe.</p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
            <Check size={28} className="mx-auto mb-3 text-green-400" />
            <p className="text-sm font-medium text-white">Mensagem enviada com sucesso!</p>
            <p className="mt-1 text-xs text-slate-400">Agradecemos o seu contato.</p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 rounded-lg bg-white/5 px-4 py-2 text-xs text-slate-300 transition hover:bg-white/10"
            >
              Enviar outra mensagem
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
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
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Categoria</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
              >
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0a0d15]">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Mensagem</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Escreva sua mensagem..."
                rows={4}
                className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-600 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Enviar mensagem
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
