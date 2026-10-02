import { useRef, useEffect } from 'react';
import { MessageSquareText, Send, Volume2, VolumeX } from 'lucide-react';
import { colorOf } from '@dashboard/configuracao/Config_platformColors';
import { useAutoScroll } from '@dashboard/componentes/useAutoScroll';

function getRoleLabel(roles = []) {
  if (roles.includes('broadcaster')) return 'Dono';
  if (roles.includes('moderator')) return 'Moderador';
  if (roles.includes('vip')) return 'VIP';
  if (roles.includes('subscriber')) return 'Sub/Membro';
  return 'Usuário';
}

export default function ChatFeed({ messages, test, setTest, onSend }) {
  const shouldAutoScrollRef = useRef(true);

  const { ref: scrollRef } = useAutoScroll({
    zone: 50,
    minSpeed: 1.0,
    maxSpeed: 4.5,
    ignoreInputs: true,
    checkButtons: true,
  });

  // Scroll manual 2x mais rápido — multiplica o delta da roda do mouse/trackpad
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      el.scrollTop += e.deltaY * 2;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [messages.length > 0]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom <= 50;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !shouldAutoScrollRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const orderedMessages = [...messages].reverse();

  return (
    <section className="flex flex-col rounded-2xl border border-white/10 bg-black/80 p-4">
      <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-white">Chat ao Vivo</h2><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">{messages.length} msgs</span></div>
      {!messages.length ? (
        <div className="grid flex-1 place-items-center text-center"><MessageSquareText className="mb-2 text-slate-600" size={28} /><p className="text-sm text-slate-400">Aguardando o chat</p><p className="mt-1 text-xs text-slate-600">Conecte uma plataforma ou envie um teste</p></div>
      ) : (
        <div ref={scrollRef} onScroll={handleScroll} className="no-scrollbar min-h-0 max-h-[520px] flex-1 space-y-1.5 overflow-y-auto">
          {orderedMessages.map(m => {
            const ttsAllowed = m.ttsAllowed !== undefined ? m.ttsAllowed : !m.blocked;
            return (
              <div key={m.id} className="rounded-xl bg-white/5 p-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                    <span className={`inline-block h-2 w-2 rounded-full ${colorOf(m.platform).dot}`} />
                    {m.author}
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-medium text-slate-300">{getRoleLabel(m.roles || [])}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    {ttsAllowed ? <Volume2 size={13} className="text-emerald-400" /> : <VolumeX size={13} className="text-red-400" />}
                    <span className="text-[10px] uppercase tracking-wider text-slate-600">{m.platform}</span>
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-slate-200">{m.text}</p>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-3 flex gap-2 rounded-xl border border-white/10 bg-black/50 p-2">
        <input value={test} onChange={e => setTest(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend()} placeholder="Enviar mensagem de teste…" className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-slate-600" />
        <button onClick={onSend} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500 text-white hover:bg-violet-400"><Send size={16} /></button>
      </div>
    </section>
  );
}