import { useState, useRef, useEffect } from 'react';
import { onTtsStart, onTtsEnd } from '@dashboard/biblioteca/TTS_ttsMusicIntegration';
import {
  Volume2,
  Volume1,
  Rocket,
  AudioLines,
  Clock,
  FileText,
  Timer,
  Play,
  Square,
  RotateCcw,
  Star,
  Bot,
  ArrowDown,
  Zap,
  Skull,
  Mic,
  Leaf,
  Flame,
  Pause,
  Disc3,
  Moon,
  Film,
  Heart,
  Sparkles,
  Ghost,
  Smile,
  Radio
} from 'lucide-react';

// Presets de Efeitos de Voz Reais (Pitch, Rate, Volume) testados e aprovados
const DJ_PRESETS = [
  {
    id: 'padrao',
    name: 'Padrão',
    icon: AudioLines,
    iconColor: 'text-violet-400',
    pitch: 1.0,
    rate: 1.0,
    volume: 1.0,
    idea: 'Original'
  },
  {
    id: 'locutor_fm',
    name: 'Locutor FM',
    icon: Mic,
    iconColor: 'text-blue-400',
    pitch: 0.9,
    rate: 1.05,
    volume: 1.0,
    idea: 'Locução'
  },
  {
    id: 'narrador_grave',
    name: 'Narrador Grave',
    icon: Volume2,
    iconColor: 'text-indigo-400',
    pitch: 0.7,
    rate: 0.9,
    volume: 1.0,
    idea: 'Grave controlado'
  },
  {
    id: 'voz_profunda',
    name: 'Voz Profunda',
    icon: Disc3,
    iconColor: 'text-purple-400',
    pitch: 0.5,
    rate: 0.8,
    volume: 1.0,
    idea: 'Mais pesada'
  },
  {
    id: 'monster',
    name: 'Monster',
    icon: Skull,
    iconColor: 'text-red-400',
    pitch: 0.3,
    rate: 0.75,
    volume: 1.0,
    idea: 'Grave extremo'
  },
  {
    id: 'slow_deep',
    name: 'Slow & Deep',
    icon: ArrowDown,
    iconColor: 'text-pink-400',
    pitch: 0.6,
    rate: 0.85,
    volume: 1.0,
    idea: 'Cadenciado'
  },
  {
    id: 'grave_rapido',
    name: 'Grave Rápido',
    icon: Zap,
    iconColor: 'text-amber-400',
    pitch: 0.6,
    rate: 1.25,
    volume: 1.0,
    idea: 'Grave sem ficar lento'
  },
  {
    id: 'grave_lento',
    name: 'Grave Lento',
    icon: Clock,
    iconColor: 'text-violet-300',
    pitch: 0.55,
    rate: 0.7,
    volume: 0.95,
    idea: 'Dramático'
  },
  {
    id: 'sombrio',
    name: 'Sombrio',
    icon: Moon,
    iconColor: 'text-slate-400',
    pitch: 0.45,
    rate: 0.85,
    volume: 0.85,
    idea: 'Escuro'
  },
  {
    id: 'dramatico',
    name: 'Dramático',
    icon: Film,
    iconColor: 'text-yellow-400',
    pitch: 0.7,
    rate: 0.75,
    volume: 1.0,
    idea: 'Narração lenta'
  },
  {
    id: 'suave',
    name: 'Suave',
    icon: Leaf,
    iconColor: 'text-emerald-400',
    pitch: 0.8,
    rate: 0.9,
    volume: 0.9,
    idea: 'Aveludado'
  },
  {
    id: 'calmo',
    name: 'Calmo',
    icon: Heart,
    iconColor: 'text-teal-400',
    pitch: 0.9,
    rate: 0.8,
    volume: 0.8,
    idea: 'Mais tranquilo'
  },
  {
    id: 'sussurro',
    name: 'Sussurro',
    icon: Volume1,
    iconColor: 'text-cyan-300',
    pitch: 1.05,
    rate: 0.8,
    volume: 0.45,
    idea: 'Aproximação'
  },
  {
    id: 'dj_robot',
    name: 'DJ Robot',
    icon: Bot,
    iconColor: 'text-cyan-400',
    pitch: 1.7,
    rate: 1.25,
    volume: 1.0,
    idea: 'Robótico'
  },
  {
    id: 'chipmunk',
    name: 'Chipmunk',
    icon: Sparkles,
    iconColor: 'text-pink-300',
    pitch: 1.8,
    rate: 1.35,
    volume: 1.0,
    idea: 'Muito agudo'
  },
  {
    id: 'agudo_lento',
    name: 'Agudo Lento',
    icon: Ghost,
    iconColor: 'text-fuchsia-400',
    pitch: 1.55,
    rate: 0.75,
    volume: 0.9,
    idea: 'Personagem'
  },
  {
    id: 'cartoon',
    name: 'Cartoon',
    icon: Smile,
    iconColor: 'text-amber-300',
    pitch: 1.5,
    rate: 1.15,
    volume: 1.0,
    idea: 'Caricato'
  },
  {
    id: 'speed_mc',
    name: 'Speed MC',
    icon: Rocket,
    iconColor: 'text-orange-400',
    pitch: 1.2,
    rate: 1.6,
    volume: 1.0,
    idea: 'Acelerado'
  },
  {
    id: 'hype',
    name: 'Hype',
    icon: Flame,
    iconColor: 'text-rose-400',
    pitch: 1.25,
    rate: 1.4,
    volume: 1.0,
    idea: 'Energético'
  },
  {
    id: 'energetico',
    name: 'Energético',
    icon: Zap,
    iconColor: 'text-yellow-400',
    pitch: 1.3,
    rate: 1.4,
    volume: 1.0,
    idea: 'Vibrante'
  },
  {
    id: 'radio_rapida',
    name: 'Rádio Rápida',
    icon: Radio,
    iconColor: 'text-emerald-300',
    pitch: 0.95,
    rate: 1.2,
    volume: 1.0,
    idea: 'Anúncio'
  }
];

const QUICK_SAMPLES = [
  'Atenção pista!',
  'Solta o som DJ!',
  'Bem-vindo!',
  'Live Nexus!'
];

// Componente de Slider / Fader Vertical Estilo Mesa DJ
function VerticalFader({
  label,
  icon: Icon,
  displayValue,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  minLabel,
  maxLabel,
  formatBottom
}) {
  const trackRef = useRef(null);
  const isDraggingRef = useRef(false);

  const clampedVal = Math.min(max, Math.max(min, Number(value) || 0));
  const percent = Math.min(100, Math.max(0, ((clampedVal - min) / (max - min)) * 100));

  const updateFromPointer = (clientY) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
    const rawVal = min + ratio * (max - min);
    const stepped = Math.round(rawVal / step) * step;
    const finalVal = Math.min(max, Math.max(min, Number(stepped.toFixed(step < 0.1 ? 2 : 1))));
    onChange(finalVal);
  };

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    updateFromPointer(e.clientY);

    const onPointerMove = (moveEvent) => {
      if (isDraggingRef.current) {
        updateFromPointer(moveEvent.clientY);
      }
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div className="flex flex-col items-center justify-between h-full min-w-[72px] px-1 py-1 select-none">
      {/* Cabeçalho do Fader com Ícone e Nome */}
      <div className="flex flex-col items-center text-center gap-1 min-h-[38px]">
        {Icon && <Icon size={16} className="text-slate-400" />}
        <span className="text-[11px] font-medium text-slate-300 leading-tight text-center max-w-[80px]">
          {label}
        </span>
      </div>

      {/* Valor Numérico Formatado em Destaque (Topo) */}
      <div className="text-xs sm:text-sm font-bold font-mono text-violet-400 my-1">
        {displayValue}
      </div>

      {/* Área da Trilha Vertical do Fader */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        className="relative flex items-center justify-center h-44 w-12 cursor-pointer group"
      >
        {/* Trilho Fundo (Cinza Escuro) */}
        <div className="relative h-36 w-2 rounded-full bg-slate-800/90 overflow-hidden shadow-inner pointer-events-none">
          {/* Preenchimento Violeta (da base até o valor atual) */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-full bg-violet-600 transition-all duration-75"
            style={{ height: `${percent}%` }}
          />
        </div>

        {/* Thumb Circular Iluminado */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-violet-500 shadow-md shadow-violet-500/50 pointer-events-none transition-all duration-75 group-hover:scale-110"
          style={{ bottom: `calc(${percent}% * 0.78 + 14px)` }}
        />

        {/* Rótulo de Escala Superior (Max) */}
        <span className="absolute top-2 right-0 text-[10px] font-mono text-slate-500 pointer-events-none">
          {maxLabel ?? max}
        </span>

        {/* Rótulo de Escala Inferior (Min) */}
        <span className="absolute bottom-2 right-0 text-[10px] font-mono text-slate-500 pointer-events-none">
          {minLabel ?? min}
        </span>

        {/* Input nativo invisível para acessibilidade e navegação por teclado */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clampedVal}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
          style={{
            writingMode: 'vertical-lr',
            direction: 'rtl',
            WebkitAppearance: 'slider-vertical'
          }}
          aria-label={label}
        />
      </div>

      {/* Caixa/Pill Inferior com Valor Numérico */}
      <div className="rounded-lg border border-white/10 bg-black/70 px-2 py-1 text-center font-mono text-xs text-white min-w-[56px] shadow-inner mt-1">
        {formatBottom ? formatBottom(clampedVal) : (step < 1 ? clampedVal.toFixed(step < 0.1 ? 2 : 1) : Math.round(clampedVal))}
      </div>
    </div>
  );
}

export default function VoiceControls({ settings, voices, speaking, onChange, onToggle, onClear }) {
  const [testText, setTestText] = useState('Digite um texto para testar a voz...');
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [activePreset, setActivePreset] = useState('padrao');

  const utteranceRef = useRef(null);

  // Parâmetros normalizados das configurações
  const rate = typeof settings?.rate === 'number' ? settings.rate : 1.0;
  const volume = typeof settings?.volume === 'number' ? settings.volume : 1.0;
  const pitch = typeof settings?.pitch === 'number' ? settings.pitch : 1.0;
  const delay = typeof settings?.delay === 'number' ? settings.delay : 0.0;
  const maxChars = typeof settings?.maxChars === 'number' ? settings.maxChars : 200;
  const speakInterval = typeof settings?.speakInterval === 'number' ? settings.speakInterval : 0.0;

  // Sincroniza preset ativo com base nos valores atuais
  useEffect(() => {
    const match = DJ_PRESETS.find(
      (p) =>
        Math.abs(p.pitch - pitch) < 0.03 &&
        Math.abs(p.rate - rate) < 0.03 &&
        Math.abs(p.volume - volume) < 0.03
    );
    setActivePreset(match ? match.id : 'custom');
  }, [pitch, rate, volume]);

  // Aplica Preset DJ
  const handleApplyPreset = (preset) => {
    onChange('pitch', preset.pitch);
    onChange('rate', preset.rate);
    onChange('volume', preset.volume);
    setActivePreset(preset.id);
  };

  // Reproduzir Fala de Teste usando SpeechSynthesisUtterance com os parâmetros reais
  const handlePlayTest = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('SpeechSynthesis não suportado neste navegador.');
      return;
    }

    handleStopTest();

    const textToSpeak = testText.trim() || 'Atenção pista! LiveNexus no comando!';
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (settings?.voice) {
      const selectedVoice = (voices || []).find((v) => v.name === settings.voice);
      if (selectedVoice) utterance.voice = selectedVoice;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsPlayingTest(true);
      try { onTtsStart(); } catch {}
    };

    utterance.onend = () => {
      setIsPlayingTest(false);
      try { onTtsEnd(); } catch {}
    };

    utterance.onerror = () => {
      setIsPlayingTest(false);
      try { onTtsEnd(); } catch {}
    };

    utteranceRef.current = utterance;
    try { onTtsStart(); } catch {}
    window.speechSynthesis.speak(utterance);
  };

  // Parar fala de teste e qualquer áudio ativo
  const handleStopTest = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTest(false);
    try { onTtsEnd(); } catch {}
    if (speaking && onToggle) {
      onToggle();
    }
  };

  // Zerar Padrão (RESET)
  const handleResetDefaults = () => {
    onChange('rate', 1.0);
    onChange('volume', 1.0);
    onChange('pitch', 1.0);
    onChange('delay', 0.0);
    onChange('maxChars', 200);
    onChange('speakInterval', 0.0);
    setActivePreset('padrao');
  };

  return (
    <div className="space-y-5">
      {/* CARD PRINCIPAL: Configurações do Motor de Voz (TTS) */}
      <section className="rounded-2xl border border-white/10 bg-[#0a0d16] p-5 shadow-xl relative overflow-hidden">
        {/* Título do Card */}
        <div className="flex items-center gap-3 mb-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/30">
            <Volume2 size={20} />
          </span>
          <div>
            <h3 className="font-bold text-white text-base leading-tight">Configurações do Motor de Voz (TTS)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Motor local do navegador · Zero créditos</p>
          </div>
        </div>

        {/* Divisão Principal: Esquerda (Controles & Teste) | Direita (6 Faders Verticais) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LADO ESQUERDO: Seleção de Voz, Teste e Ações (5 colunas) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Seleção de Voz */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Voz (Navegador)
                </label>
                <div className="relative">
                  <select
                    value={settings?.voice || ''}
                    onChange={(e) => onChange('voice', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#060810] px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500 appearance-none font-sans cursor-pointer pr-8"
                  >
                    <option value="">Padrão do navegador</option>
                    {(voices || []).map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.lang.toLowerCase().includes('pt') ? '🇧🇷 ' : ''}{v.name} · {v.lang}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Texto de Teste */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400">Texto de teste</label>
                  <span className="text-[11px] font-mono text-slate-500">
                    {testText.length} / {maxChars || 200}
                  </span>
                </div>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={3}
                  placeholder="Digite um texto para testar a voz..."
                  className="w-full rounded-xl border border-white/10 bg-[#060810] p-3 text-xs text-white outline-none focus:border-violet-500 leading-relaxed font-sans resize-none"
                />
              </div>

              {/* Amostras Rápidas */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-slate-400 block">Amostras rápidas:</span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SAMPLES.map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setTestText(sample)}
                      className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 hover:text-white transition"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Linha de Botões de Ação Principal (Reproduzir, Parar, Zerar Padrão) */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2.5">
                {/* Botão Reproduzir (PLAY) com Gradiente Violeta */}
                <button
                  type="button"
                  onClick={handlePlayTest}
                  disabled={isPlayingTest}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 transition shadow-lg ${
                    isPlayingTest
                      ? 'bg-violet-600/50 text-white/70 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-600/30'
                  }`}
                >
                  <Play size={16} fill="currentColor" />
                  <div className="text-left leading-tight">
                    <span className="block text-xs font-bold">Reproduzir</span>
                    <span className="block text-[9px] text-white/70 font-mono">(PLAY)</span>
                  </div>
                </button>

                {/* Botão Parar (CUE) */}
                <button
                  type="button"
                  onClick={handleStopTest}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0f1422] hover:bg-white/10 text-white py-2.5 px-3 transition"
                >
                  <Square size={14} fill="currentColor" className="text-slate-300" />
                  <div className="text-left leading-tight">
                    <span className="block text-xs font-bold">Parar</span>
                    <span className="block text-[9px] text-slate-400 font-mono">(CUE)</span>
                  </div>
                </button>

                {/* Botão Zerar Padrão (RESET) */}
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0f1422] hover:bg-white/10 text-white py-2.5 px-3 transition"
                >
                  <RotateCcw size={14} className="text-slate-300" />
                  <div className="text-left leading-tight">
                    <span className="block text-xs font-bold truncate">Zerar Padrão</span>
                    <span className="block text-[9px] text-slate-400 font-mono">(RESET)</span>
                  </div>
                </button>
              </div>

              {/* Controles Compactos da Fila de Leitura do Sistema */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Fila Geral:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onToggle}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      speaking
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    {speaking ? <Pause size={12} /> : <Play size={12} />}
                    <span>{speaking ? 'Pausar Fila' : 'Retomar Fila'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClear}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-[11px] font-semibold transition"
                  >
                    <RotateCcw size={11} />
                    <span>Limpar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: RACK COM OS 6 FADERS VERTICAIS (7 colunas) */}
          <div className="lg:col-span-7 rounded-2xl border border-white/5 bg-[#060810]/70 p-3 sm:p-4 flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
            {/* 1. Velocidade */}
            <VerticalFader
              label="Velocidade"
              icon={Rocket}
              displayValue={`${rate.toFixed(2)}x`}
              value={rate}
              min={0.2}
              max={3.0}
              step={0.05}
              minLabel="0.2"
              maxLabel="3.0"
              formatBottom={(v) => v.toFixed(2)}
              onChange={(val) => onChange('rate', val)}
            />

            {/* 2. Volume */}
            <VerticalFader
              label="Volume"
              icon={Volume2}
              displayValue={`${Math.round(volume * 100)}%`}
              value={volume}
              min={0}
              max={1}
              step={0.01}
              minLabel="0"
              maxLabel="100"
              formatBottom={(v) => Math.round(v * 100)}
              onChange={(val) => onChange('volume', val)}
            />

            {/* 3. Tom (Pitch) */}
            <VerticalFader
              label="Tom (Pitch)"
              icon={AudioLines}
              displayValue={pitch.toFixed(2)}
              value={pitch}
              min={0.1}
              max={2.0}
              step={0.05}
              minLabel="0.1"
              maxLabel="2.0"
              formatBottom={(v) => v.toFixed(2)}
              onChange={(val) => onChange('pitch', val)}
            />

            {/* 4. Delay (s) */}
            <VerticalFader
              label="Delay (s)"
              icon={Clock}
              displayValue={`${delay.toFixed(1)}s`}
              value={delay}
              min={0}
              max={5.0}
              step={0.1}
              minLabel="0"
              maxLabel="5.0"
              formatBottom={(v) => v.toFixed(1)}
              onChange={(val) => onChange('delay', val)}
            />

            {/* 5. Limite de caracteres */}
            <VerticalFader
              label="Limite de caracteres"
              icon={FileText}
              displayValue={maxChars || 200}
              value={maxChars}
              min={0}
              max={500}
              step={5}
              minLabel="0"
              maxLabel="500"
              formatBottom={(v) => Math.round(v)}
              onChange={(val) => onChange('maxChars', val)}
            />

            {/* 6. Intervalo entre falas (s) */}
            <VerticalFader
              label="Intervalo entre falas (s)"
              icon={Timer}
              displayValue={`${speakInterval.toFixed(1)}s`}
              value={speakInterval}
              min={0}
              max={5.0}
              step={0.1}
              minLabel="0"
              maxLabel="5.0"
              formatBottom={(v) => v.toFixed(1)}
              onChange={(val) => onChange('speakInterval', val)}
            />
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: Presets de Efeitos (Estilo DJ) Compactos em Grade */}
      <section className="rounded-2xl border border-white/10 bg-[#0a0d16] p-5 shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Star size={18} fill="currentColor" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Presets de Efeitos (Estilo DJ)</h3>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {DJ_PRESETS.length} presets
                </span>
              </div>
              <p className="text-xs text-slate-400">Aplicam combinações reais de Tom, Velocidade e Volume com sincronização imediata</p>
            </div>
          </div>
        </div>

        {/* Grade Compacta de Botões (Ícone + Nome + Valores Rápidos) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {DJ_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            const Icon = preset.icon;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                title={`${preset.name} (${preset.idea}) • Tom: ${preset.pitch} | Vel: ${preset.rate}x | Vol: ${Math.round(preset.volume * 100)}%`}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-violet-500 bg-violet-600/20 text-white ring-1 ring-violet-500 shadow-md shadow-violet-500/25'
                    : 'border-white/5 bg-[#060810] hover:border-white/20 hover:bg-white/[0.04] text-slate-300'
                }`}
              >
                <div className={`shrink-0 transition-colors ${isSelected ? 'text-violet-300' : preset.iconColor}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold block truncate leading-tight">
                    {preset.name}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block truncate opacity-70 group-hover:opacity-100 transition-opacity">
                    {preset.pitch} · {preset.rate}x · {Math.round(preset.volume * 100)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
