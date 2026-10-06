import VoiceControls from '@dashboard/configuracao/Config_VoiceControls';

export default function VoiceSection({ settings, voices, speaking, onChange, onToggle, onClear, onNavigateToLab }) {
  return (
    <div className="space-y-5">
      {/* Cabeçalho da Seção */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Voz & TTS</h2>
          <p className="text-xs text-slate-400 mt-0.5">Motor de voz local do navegador - zero créditos</p>
        </div>
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
