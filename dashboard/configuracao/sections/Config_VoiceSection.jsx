import { AudioLines } from 'lucide-react';
import VoiceControls from '@dashboard/configuracao/Config_VoiceControls';

export default function VoiceSection({ settings, voices, speaking, onChange, onToggle, onClear, onNavigateToLab }) {
  return (
    <div className="space-y-5">
      {/* Cabeçalho da Seção com Botão para a Mesa Experimental do Laboratório */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Voz & TTS</h2>
          <p className="text-xs text-slate-400 mt-0.5">Motor de voz local do navegador - zero créditos</p>
        </div>

        {onNavigateToLab && (
          <button
            type="button"
            onClick={onNavigateToLab}
            className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-950/40 via-[#100d24] to-indigo-950/40 hover:border-violet-500/70 transition shadow-lg shadow-violet-500/10 text-left group cursor-pointer"
          >
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 group-hover:scale-105 transition">
              <AudioLines size={16} />
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-violet-200">
                MESA EXPERIMENTAL DE VOZ
              </span>
              <span className="block text-[10px] text-slate-400">
                Estilo DJ • Web Speech API (Laboratório)
              </span>
            </div>
          </button>
        )}
      </header>

      {/* Controles de Voz reorganizados conforme layout do estúdio DJ */}
      <VoiceControls
        settings={settings}
        voices={voices}
        speaking={speaking}
        onChange={onChange}
        onToggle={onToggle}
        onClear={onClear}
      />
    </div>
  );
}
