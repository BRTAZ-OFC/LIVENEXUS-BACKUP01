import { MessageSquareText } from 'lucide-react';

export default function MessageFeed({ messages }) {
  return <section className="min-h-[360px] rounded-2xl border border-white/10 bg-white/[0.04] p-5">
    <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-white">Mensagens ao vivo</h2><p className="text-xs text-slate-400">A mais recente entra na fila de leitura</p></div><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">{messages.length} recebidas</span></div>
    {!messages.length ? <div className="grid min-h-[260px] place-items-center text-center"><div><MessageSquareText className="mx-auto mb-3 text-slate-600" size={32}/><p className="text-sm text-slate-400">Aguardando o chat</p><p className="mt-1 text-xs text-slate-600">Conecte uma plataforma ou envie um teste</p></div></div> : <div className="max-h-[390px] space-y-2 overflow-y-auto pr-1">{messages.map(m => <div key={m.id} className="rounded-xl border border-white/5 bg-slate-950/50 p-3"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-cyan-300">{m.author}</span><span className="text-[10px] uppercase tracking-wider text-slate-600">{m.platform}</span></div><p className="mt-1 text-sm leading-relaxed text-slate-200">{m.text}</p></div>)}</div>}
  </section>;
}