import { useState, useEffect, useRef } from 'react';
import { onTtsStart, onTtsEnd } from '@dashboard/biblioteca/TTS_ttsMusicIntegration';
import {
  Play,
  Square,
  Copy,
  Check,
  Volume2,
  Globe,
  Sparkles,
  Shield,
  RefreshCw,
  Terminal,
  Search,
  Activity,
  Sliders,
  RotateCcw,
  Disc3,
  AlertTriangle,
  Music
} from 'lucide-react';

const DJ_PRESETS = [
  { id: 'flat', label: 'Padrão (Flat)', pitch: 1.0, rate: 1.0, vol: 1.0, desc: 'Natural 1:1' },
  { id: 'robot', label: 'DJ Robot / Chipmunk', pitch: 1.7, rate: 1.25, vol: 1.0, desc: 'Agudo e rápido' },
  { id: 'deep', label: 'DJ Slow & Deep', pitch: 0.6, rate: 0.85, vol: 1.0, desc: 'Grave e cadenciado' },
  { id: 'speed', label: 'Speed MC', pitch: 1.2, rate: 1.6, vol: 1.0, desc: 'Acelerado' },
  { id: 'monster', label: 'Monster Pitch', pitch: 0.3, rate: 0.75, vol: 1.0, desc: 'Ultra grave' },
  { id: 'locutor', label: 'Locutor FM', pitch: 0.9, rate: 1.05, vol: 1.0, desc: 'Encorpado' },
];

const DJ_SAMPLES = [
  'Atenção pista! LiveNexus no comando!',
  'Solta o som DJ! Drop the beat!',
  'Testando som: um, dois... som, teste de voz!',
  'Olá! Este é o teste de voz nativa da Web Speech API na mesa de DJ.',
];

export default function AdminWebSpeechVoicesTest() {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [filterPtOnly, setFilterPtOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Controles Reais do SpeechSynthesisUtterance
  const [text, setText] = useState('Atenção pista! LiveNexus no comando! Solta o som DJ!');
  const [pitch, setPitch] = useState(1.0); // 0 a 2
  const [rate, setRate] = useState(1.0);   // 0.1 a 10 (ideal 0.2 a 3)
  const [volume, setVolume] = useState(1.0); // 0 a 1

  const [activePreset, setActivePreset] = useState('flat');
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Iniciando mesa experimental...');
  const [technicalReport, setTechnicalReport] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);
  const [logs, setLogs] = useState([]);

  const utteranceRef = useRef(null);

  const appendLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, type, message }]);
  };

  useEffect(() => {
    loadBrowserVoices();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        loadBrowserVoices();
      };
    }

    return () => {
      stopSpeech();
    };
  }, []);

  const loadBrowserVoices = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatusMessage('Web Speech API (speechSynthesis) não é suportada neste navegador.');
      appendLog('error', 'speechSynthesis indisponível no navegador.');
      return;
    }

    const availableVoices = window.speechSynthesis.getVoices();
    setVoices(availableVoices);

    const ptVoice = availableVoices.find(v => v.lang.toLowerCase().includes('pt'));

    if (availableVoices.length > 0) {
      setStatusMessage(`${availableVoices.length} vozes detectadas no navegador.`);
      if (ptVoice && !selectedVoiceURI) {
        setSelectedVoiceURI(ptVoice.voiceURI);
      } else if (!selectedVoiceURI) {
        setSelectedVoiceURI(availableVoices[0].voiceURI);
      }
    } else {
      setStatusMessage('Aguardando detecção de vozes pelo evento onvoiceschanged...');
    }

    buildReport(availableVoices);
    appendLog('info', `${availableVoices.length} vozes nativas obtidas via speechSynthesis.getVoices().`);
  };

  const handleApplyPreset = (preset) => {
    setPitch(preset.pitch);
    setRate(preset.rate);
    setVolume(preset.vol);
    setActivePreset(preset.id);
    appendLog('info', `Preset DJ ativado: ${preset.label} (Pitch: ${preset.pitch}, Rate: ${preset.rate}x, Vol: ${Math.round(preset.vol * 100)}%)`);
  };

  const handleResetDefaults = () => {
    setPitch(1.0);
    setRate(1.0);
    setVolume(1.0);
    setActivePreset('flat');
    appendLog('info', 'Controles da mesa restaurados para o padrão nativo (Pitch: 1.0, Rate: 1.0, Vol: 1.0).');
  };

  const handlePlayText = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('SpeechSynthesis não suportado neste navegador.');
      return;
    }

    stopSpeech();

    const selectedVoiceObj = voices.find(v => v.voiceURI === selectedVoiceURI) || voices[0];
    if (!selectedVoiceObj) {
      setStatusMessage('Por favor, selecione uma voz válida.');
      return;
    }

    const currentText = text.trim() || 'Teste de voz DJ.';
    const utterance = new SpeechSynthesisUtterance(currentText);
    utterance.voice = selectedVoiceObj;
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsPlaying(true);
      try { onTtsStart(); } catch {}
      setStatusMessage(`▶️ DJ Deck Tocando: "${selectedVoiceObj.name}" | Pitch: ${pitch.toFixed(2)} | Rate: ${rate.toFixed(2)}x | Vol: ${Math.round(volume * 100)}%`);
      appendLog('success', `Síntese iniciada: voz="${selectedVoiceObj.name}", pitch=${pitch}, rate=${rate}, vol=${volume}`);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      try { onTtsEnd(); } catch {}
      setStatusMessage('⏹️ Reprodução finalizada com sucesso.');
      appendLog('info', 'Síntese finalizada com sucesso.');
      buildReport(voices, selectedVoiceObj, 'SUCESSO_REPRODUZIDO');
    };

    utterance.onerror = (event) => {
      setIsPlaying(false);
      try { onTtsEnd(); } catch {}
      setStatusMessage(`❌ Erro no SpeechSynthesis: ${event.error}`);
      appendLog('error', `Erro SpeechSynthesisUtterance: ${event.error}`);
      buildReport(voices, selectedVoiceObj, `ERRO_${event.error}`);
    };

    utteranceRef.current = utterance;
    try { onTtsStart(); } catch {}
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    try { onTtsEnd(); } catch {}
    setStatusMessage('⏹️ Reprodução interrompida.');
    appendLog('warn', 'Comando de parada (CUE/STOP) acionado.');
  };

  const buildReport = (voiceList = voices, currentVoiceObj = null, lastResult = 'IDLE') => {
    const ptVoices = voiceList.filter(v => v.lang.toLowerCase().includes('pt'));
    const activeVoice = currentVoiceObj || voiceList.find(v => v.voiceURI === selectedVoiceURI);

    const reportLines = [
      '===================================================================',
      'RELATÓRIO TÉCNICO: MESA DE VOZ DJ & WEB SPEECH API (INVESTIGAÇÃO)',
      '===================================================================',
      `Data/Hora Local          : ${new Date().toLocaleString()}`,
      `User Agent               : ${navigator.userAgent}`,
      `Suporte Web Speech API   : ${typeof window !== 'undefined' && 'speechSynthesis' in window ? 'DISPONÍVEL' : 'INDISPONÍVEL'}`,
      `Total de Vozes Detectadas: ${voiceList.length}`,
      `Vozes em Português/pt-BR : ${ptVoices.length}`,
      `Último Resultado         : ${lastResult}`,
      '',
      '-------------------------------------------------------------------',
      'AJUSTES ATUAIS DA MESA DE VOZ (SpeechSynthesisUtterance):',
      `• Voz Selecionada        : ${activeVoice ? `${activeVoice.name} (${activeVoice.lang})` : 'Nenhuma'}`,
      `• Voice URI              : ${activeVoice ? activeVoice.voiceURI : 'N/A'}`,
      `• Serviço Local          : ${activeVoice ? (activeVoice.localService ? 'Sim (Local no OS)' : 'Não (Rede/Nuvem)') : 'N/A'}`,
      `• Pitch (Afinação/Tom)   : ${pitch.toFixed(2)} (Faixa permitida: 0 a 2)`,
      `• Rate (Velocidade/BPM)  : ${rate.toFixed(2)}x (Faixa configurada: 0.2 a 3.0)`,
      `• Volume (Ganho Master)  : ${(volume * 100).toFixed(0)}% (${volume.toFixed(2)})`,
      `• Texto Sintetizado      : "${text.trim()}"`,
      '',
      '-------------------------------------------------------------------',
      'INVESTIGAÇÃO TÉCNICA: EQUALIZAÇÃO E TRANSFORMAÇÕES DSP NA WEB SPEECH API',
      '1. Roteamento de Áudio no Navegador:',
      '   A especificação W3C da Web Speech API (SpeechSynthesis) NÃO expõe um',
      '   fluxo de áudio bruto (PCM), MediaStream ou AudioNode do Web Audio API.',
      '2. Destino do Áudio da Síntese:',
      '   O áudio é renderizado diretamente pelo serviço nativo do sistema',
      '   operacional (SAPI no Windows, Speech-Dispatcher no Linux, Apple TTS no',
      '   macOS, Google Speech Service no Android/Chrome) e enviado direto para a',
      '   placa de som do dispositivo.',
      '3. Limitações de Equalização (Graves, Médios, Agudos, Reverb, Compressor):',
      '   NÃO é tecnicamente possível conectar filtros BiquadFilterNode ou',
      '   DynamicsCompressorNode à saída do speechSynthesis sem capturar todo o áudio',
      '   do sistema/aba (o que exigiria permissão invasiva de compartilhamento de tela).',
      '   Portanto, NÃO simulamos filtros que o navegador não suporta.',
      '   Os ÚNICOS controles reais suportados nativamente são PITCH, RATE e VOLUME.',
      '',
      '-------------------------------------------------------------------',
      'VOZES EM PORTUGUÊS DISPONÍVEIS:',
      ...ptVoices.map((v, i) => `${i + 1}. "${v.name}" [${v.lang}] | Local: ${v.localService} | Default: ${v.default}`),
      '===================================================================',
      'FIM DO RELATÓRIO TÉCNICO DA MESA DE VOZ DJ',
      '==================================================================='
    ];

    setTechnicalReport(reportLines.join('\n'));
  };

  const handleCopyReport = () => {
    buildReport();
    if (!technicalReport) return;
    navigator.clipboard.writeText(technicalReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const filteredVoices = voices.filter(v => {
    const matchesPt = filterPtOnly ? v.lang.toLowerCase().includes('pt') : true;
    const matchesSearch = searchQuery
      ? v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.lang.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesPt && matchesSearch;
  });

  const ptVoicesCount = voices.filter(v => v.lang.toLowerCase().includes('pt')).length;

  return (
    <div className="space-y-6">
      {/* Banner Principal com Visual DJ Master */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#070b14] via-[#0d1322] to-[#080c18] p-6 space-y-4 shadow-2xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl border ${
              isPlaying
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-lg shadow-cyan-500/20 animate-pulse'
                : 'bg-white/5 text-slate-300 border-white/10'
            }`}>
              <Disc3 size={24} className={isPlaying ? 'animate-spin' : ''} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Mesa Experimental de Voz DJ</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                    WEB SPEECH DECK
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Controles de estúdio em tempo real via SpeechSynthesisUtterance com visualizador de deck e equalizador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition"
              title="Restaurar Pitch: 1.0, Rate: 1.0, Volume: 1.0"
            >
              <RotateCcw size={13} />
              <span>Zerar Padrão</span>
            </button>

            <button
              type="button"
              onClick={loadBrowserVoices}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 px-3.5 py-2 text-xs font-semibold transition"
            >
              <RefreshCw size={13} />
              <span>Detectar Vozes ({voices.length})</span>
            </button>
          </div>
        </div>

        {/* Display LED de Status e VU-Meter da Mesa */}
        <div className="rounded-xl border border-cyan-500/20 bg-black/80 p-3.5 text-xs flex flex-wrap items-center justify-between gap-3 relative z-10 font-mono">
          <div className="flex items-center gap-2.5 min-w-0">
            <Activity size={16} className={`shrink-0 ${isPlaying ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-slate-400 font-bold uppercase text-[10px]">Status do Deck:</span>
            <span className={`truncate text-xs ${isPlaying ? 'text-cyan-300 font-bold' : 'text-slate-300'}`}>
              {statusMessage}
            </span>
          </div>

          {/* VU Meter Visual LED Estilo Mesa */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase mr-1">VU METER:</span>
            {[...Array(8)].map((_, i) => (
              <span
                key={i}
                className={`h-4 w-1.5 rounded-xs transition-all duration-150 ${
                  isPlaying
                    ? i < 5
                      ? 'bg-emerald-400 opacity-90'
                      : i < 7
                      ? 'bg-amber-400 opacity-90'
                      : 'bg-red-400 opacity-90 animate-ping'
                    : 'bg-white/10 opacity-30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* MESA PRINCIPAL DO DJ - CONTROLES REAIS DE PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Entrada de Texto e Presets DJ (7 colunas) */}
        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Music size={14} />
              Entrada de Texto & Frases de Efeito
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">{text.length} caracteres</span>
          </div>

          {/* Textarea da fala */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Digite o texto que a voz vai sintetizar..."
            className="w-full rounded-xl border border-white/10 bg-[#070a12] p-3.5 text-xs text-white outline-none focus:border-cyan-500/50 leading-relaxed font-sans"
          />

          {/* Botões Rápidos de Frases de Efeito */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Samples Rápidos (Clique para inserir):</span>
            <div className="flex flex-wrap gap-2">
              {DJ_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(sample)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 border border-white/10 hover:border-cyan-500/30 text-[11px] transition text-left truncate max-w-full"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          {/* Seleção de Voz */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <Globe size={13} className="text-cyan-400" />
                Voz Selecionada ({voices.length} no sistema):
              </label>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {ptVoicesCount} vozes em Português
              </span>
            </div>

            <select
              value={selectedVoiceURI}
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070a12] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500/50 font-sans"
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.lang.toLowerCase().includes('pt') ? '🇧🇷 ' : ''}{v.name} ({v.lang}) {v.localService ? '• Local' : '• Nuvem'} {v.default ? '⭐ Padrão' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Presets de Efeitos de Voz DJ */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
              <Sparkles size={12} />
              Presets de Efeito DJ:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DJ_PRESETS.map((p) => {
                const isSelected = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60 shadow-md shadow-cyan-500/10'
                        : 'bg-[#070a12] text-slate-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-[11px] font-bold">{p.label}</span>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botões de Ação Principal (PLAY / STOP / RESET) */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              type="button"
              onClick={handlePlayText}
              disabled={isPlaying}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-xs shadow-lg transition-all ${
                isPlaying
                  ? 'bg-cyan-600/50 text-white cursor-not-allowed opacity-60'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/30'
              }`}
            >
              <Play size={16} fill="currentColor" />
              <span>REPRODUZIR VOZ (PLAY)</span>
            </button>

            <button
              type="button"
              onClick={stopSpeech}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-bold text-xs transition"
            >
              <Square size={14} fill="currentColor" />
              <span>PARAR (CUE)</span>
            </button>
          </div>
        </div>

        {/* Painel Direito: Equalizador dos 3 Parâmetros Reais (5 colunas) */}
        <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/70 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Sliders size={14} />
                Equalizador de Performance (Controles Reais)
              </h4>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[10px] text-slate-400 hover:text-cyan-300 transition flex items-center gap-1"
                title="Resetar Pitch, Rate e Volume"
              >
                <RotateCcw size={10} />
                <span>Reset</span>
              </button>
            </div>

            {/* Fader 1: PITCH (Afinação / Tom da Voz) */}
            <div className="space-y-2 py-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  PITCH (Afinação / Tom)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
                  {pitch.toFixed(2)}x {pitch < 1.0 ? '• Grave' : pitch > 1.0 ? '• Agudo' : '• Normal'}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={pitch}
                onChange={(e) => {
                  setPitch(parseFloat(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0.1 (Ultra Grave)</span>
                <span className="text-slate-400">1.0 (Normal)</span>
                <span>2.0 (Ultra Agudo)</span>
              </div>
            </div>

            {/* Fader 2: RATE (Velocidade / BPM) */}
            <div className="space-y-2 py-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-400" />
                  RATE (Velocidade da Fala)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold">
                  {rate.toFixed(2)}x {rate < 1.0 ? '• Lento' : rate > 1.0 ? '• Rápido' : '• Normal'}
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={rate}
                onChange={(e) => {
                  setRate(parseFloat(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0.2x (Lento)</span>
                <span className="text-slate-400">1.0x (100% BPM)</span>
                <span>3.0x (Turbo)</span>
              </div>
            </div>

            {/* Fader 3: VOLUME (Ganho Master) */}
            <div className="space-y-2 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Volume2 size={13} className="text-amber-400" />
                  VOLUME (Ganho Master)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                  {(volume * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0% (Mudo)</span>
                <span className="text-slate-400">50%</span>
                <span>100% (Máximo)</span>
              </div>
            </div>
          </div>

          {/* Caixa de Resumo Rápido */}
          <div className="rounded-xl border border-white/5 bg-[#070a12] p-3 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Utterance:</span>
            <span className="text-cyan-300">P:{pitch.toFixed(2)} | R:{rate.toFixed(2)}x | V:{(volume * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* PAINEL DE INVESTIGAÇÃO TÉCNICA E LIMITAÇÕES REAIS DA WEB SPEECH API */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle size={16} />
            <span>Investigação Técnica: O que pode (e o que NÃO pode) ser equalizado no Web Speech API</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-semibold">
            Sem Simulações Falsas
          </span>
        </div>

        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            Na especificação W3C da <strong className="text-white">Web Speech API</strong> (<code className="text-amber-200">window.speechSynthesis</code>),
            os <strong>únicos controles reais de transformação disponíveis</strong> no objeto <code className="text-amber-200">SpeechSynthesisUtterance</code> são:
            <strong className="text-cyan-300"> pitch</strong> (tom/frequência fundamental),
            <strong className="text-purple-300"> rate</strong> (velocidade/tempo) e
            <strong className="text-amber-300"> volume</strong> (ganho).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-white/5 bg-black/50 p-3 space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <Check size={14} /> Controles Reais Funcionando:
              </span>
              <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-0.5">
                <li><strong className="text-white">Pitch (0.1 a 2.0)</strong>: Altera a tonalidade nativa da voz no sintetizador.</li>
                <li><strong className="text-white">Rate (0.2 a 3.0)</strong>: Altera o tempo/velocidade da articulação das palavras.</li>
                <li><strong className="text-white">Volume (0 a 1)</strong>: Ajusta o ganho de reprodução do sintetizador.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/50 p-3 space-y-1">
              <span className="text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                <Shield size={14} /> Limitações Reais do Navegador (Não Simulado):
              </span>
              <p className="text-[11px] text-slate-400 leading-normal">
                Efeitos de DSP como <strong>Graves (Bass)</strong>, <strong>Médios</strong>, <strong>Agudos (Treble)</strong>, <strong>Compressor</strong> ou <strong>Reverb</strong> exigiriam rotear o áudio por nós do <code className="text-slate-300">AudioContext</code>.
                Entretanto, o <code className="text-slate-300">speechSynthesis</code> envia o áudio diretamente ao daemon de áudio do sistema operacional sem expor fluxo PCM ou MediaStream. Portanto, não inserimos controles falsos de equalização aqui.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LISTA COMPLETA DE VOZES NATIVAS RETORNADAS */}
      <div className="rounded-2xl border border-white/10 bg-black/70 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Globe size={14} className="text-cyan-400" />
            Vozes Retornadas pelo Navegador ({filteredVoices.length} de {voices.length})
          </h4>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterPtOnly}
                onChange={(e) => setFilterPtOnly(e.target.checked)}
                className="rounded border-white/20 bg-black text-cyan-500 focus:ring-0"
              />
              <span>Somente Português (pt-BR / pt-PT)</span>
            </label>

            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar voz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-white/10 bg-[#070a12] text-xs text-white outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Vozes */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">Nome da Voz</th>
                <th className="p-3">Idioma (lang)</th>
                <th className="p-3">Tipo de Serviço</th>
                <th className="p-3">Padrão</th>
                <th className="p-3">Voice URI</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-mono text-[11px]">
              {filteredVoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500 font-sans italic">
                    Nenhuma voz encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredVoices.map((v) => {
                  const isPt = v.lang.toLowerCase().includes('pt');
                  const isSelected = v.voiceURI === selectedVoiceURI;

                  return (
                    <tr
                      key={v.voiceURI}
                      className={`hover:bg-white/5 transition-colors ${
                        isSelected ? 'bg-cyan-500/10' : ''
                      } ${isPt ? 'text-emerald-300 font-bold' : ''}`}
                    >
                      <td className="p-3 font-sans font-medium flex items-center gap-2">
                        {isPt && <span className="text-xs shrink-0" title="Voz em Português">🇧🇷</span>}
                        <span className="truncate max-w-[200px]">{v.name}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${isPt ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-slate-300'}`}>
                          {v.lang}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={v.localService ? 'text-cyan-400' : 'text-slate-500'}>
                          {v.localService ? 'Local (OS)' : 'Nuvem'}
                        </span>
                      </td>
                      <td className="p-3">
                        {v.default ? <span className="text-amber-400 font-bold">Sim ⭐</span> : <span className="text-slate-600">Não</span>}
                      </td>
                      <td className="p-3 text-slate-400 truncate max-w-[220px]" title={v.voiceURI}>
                        {v.voiceURI}
                      </td>
                      <td className="p-3 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVoiceURI(v.voiceURI);
                            handlePlayText();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition"
                        >
                          Carregar & Tocar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONSOLE DE LOGS DO DECK */}
      <div className="rounded-2xl border border-white/10 bg-black/80 p-5 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Terminal size={14} className="text-cyan-400" />
          Console de Rastreamento de Eventos ({logs.length} eventos)
        </h4>

        <div className="h-32 overflow-y-auto rounded-xl border border-white/10 bg-black p-3 space-y-1.5 font-mono text-[11px]">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">Nenhum evento registrado ainda.</div>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${
                  log.type === 'error'
                    ? 'text-red-400 font-bold'
                    : log.type === 'success'
                    ? 'text-emerald-400 font-semibold'
                    : log.type === 'warn'
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }`}
              >
                <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                <span className="break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RELATÓRIO TÉCNICO COMPLETO COM BOTÃO COPIAR */}
      {technicalReport && (
        <div className="rounded-2xl border border-cyan-500/30 bg-black/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Shield size={14} />
              Relatório Técnico da Mesa DJ (Vozes & Limitações Web Speech)
            </h4>

            <button
              type="button"
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30 text-xs font-semibold transition"
            >
              {copiedReport ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedReport ? 'Relatório Copiado!' : 'Copiar Relatório'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl border border-white/10 bg-black font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80">
            {technicalReport}
          </pre>
        </div>
      )}
    </div>
  );
}
