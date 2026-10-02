import { MessageSquareText, CheckCircle2 } from 'lucide-react';
import { colorOf } from '@dashboard/configuracao/Config_platformColors';
import TopSpeakers from '@dashboard/configuracao/Config_TopSpeakers';

export default function MessagesTable({ messages, speaking, onPause, onClear, speakerCounts }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/80 p-4">
        <div className="mb-3 flex items-center justify-between">
        <div><h2 className="font-semibold text-white">Mensagens Recentes</h2><p className="text-xs text-slate-400">Fila de leitura TTS</p></div>
        <div className="flex gap-2">
          <button onClick={onPause} className="rounded-lg bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-500/25">{speaking ? 'Pausar Leitura' : 'Retomar Leitura'}</button>
          <button onClick={onClear} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10">Limpar</button>
        </div>
      </div>
      {!messages.length ? (
        <div className="grid place-items-center py-12 text-center"><MessageSquareText className="mb-2 text-slate-600" size={28} /><p className="text-sm text-slate-400">Aguardando mensagens</p></div>
      ) : (
        <div className="no-scrollbar max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-[13px]">
            <tbody>
              {messages.slice(0, 5).map(m => (
                <tr key={m.id} className="border-b border-white/5">
                  <td className="whitespace-nowrap py-1.5 pr-2 align-top text-[11px] text-slate-500">{m.time || '—'}</td>
                  <td className="whitespace-nowrap py-1.5 pr-2 align-top font-medium text-slate-200"><span className={`mr-1.5 inline-block h-2 w-2 rounded-full align-middle ${colorOf(m.platform).dot}`} />{m.author}</td>
                  <td className="py-1.5 pr-2 text-slate-200">{m.text}</td>
                  <td className="py-1.5 text-right align-top"><span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300"><CheckCircle2 size={11} /> LIDA</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="py-3 text-center text-[11px] text-slate-600">Mostrando as {Math.min(messages.length, 5)} mensagens mais recentes</p>
        </div>
      )}
      <TopSpeakers counts={speakerCounts} />
    </section>
  );
}