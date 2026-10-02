import { ArrowLeft } from 'lucide-react';
import ScenarioEditorWorkspace from './editor/Scenario_EditorWorkspace';

export default function ScenarioCanvas({ cenario, userId, onBack }) {
  // ... existing code
  return (
    <div className="flex flex-col h-full bg-[#080b12] animate-editor-fade-in">
      <div className="flex items-center gap-4 p-4 border-b border-white/10 shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-white">
          <ArrowLeft />
        </button>
        <h2 className="text-xl font-bold text-white">{cenario?.name}</h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <ScenarioEditorWorkspace cenario={cenario} userId={userId} />
      </div>
    </div>
  );
}
