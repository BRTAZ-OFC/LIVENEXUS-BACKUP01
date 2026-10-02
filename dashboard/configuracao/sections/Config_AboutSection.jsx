
export default function AboutSection() {
  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-lg font-semibold text-white">Sobre</h2>
        <p className="text-sm text-slate-400">Live TTS Reader</p>
      </header>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-black/80 p-6 text-sm leading-relaxed text-slate-300">
        <p>Leitor de mensagens de chat por voz, 100% no navegador. Conecta Twitch, Kick e YouTube e lê as mensagens usando a síntese de voz nativa do navegador — sem custos de API.</p>
        <p><b className="text-white">TTS:</b> motor local (speechSynthesis). <b className="text-white">Conexões:</b> Twitch (IRC anônimo), Kick (Pusher), YouTube (Data API via Worker).</p>
        <p className="text-xs text-slate-500">Sem backend próprio, sem créditos, sem chaves no frontend.</p>
      </div>
    </div>
  );
}