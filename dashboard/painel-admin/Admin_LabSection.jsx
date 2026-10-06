import { useState } from 'react';
import { FlaskConical, ChevronRight, ChevronLeft, Sparkles, Box, Shield, Layers, RadioTower, Radio, Volume2, HelpCircle, Keyboard, Library } from 'lucide-react';
import { useAutoScroll } from '@dashboard/componentes/useAutoScroll';
import YouTubeTest1Section from './lab/Admin_YouTubeTest1Section';
import AdminRtcTestLabSection from './lab/rtc/Admin_RtcTestLabSection';
import AdminWebSpeechVoicesTest from './lab/tts-neural/Admin_WebSpeechVoicesTest';
import AdminGlobalShortcutsTest from './lab/global-shortcuts/Admin_GlobalShortcutsTest';
import LabTestIdsLibrarySection from './lab/test-ids/Lab_TestIdsLibrarySection';
import LabPhotoshopSection from './lab/photoshop/LabPhotoshopSection';
import LabPhotoshop2Section from './lab/photoshop2/LabPhotoshop2Section';
import LabPhotoshop3Section from './lab/photoshop3/LabPhotoshop3Section';

const LAB_TOOLS = [
  {
    id: 'test-ids-library',
    name: 'Teste Biblioteca',
    category: 'Música & Biblioteca',
    icon: Library,
    description: 'Laboratório isolado para teste, identificação e salvamento de IDs de músicas e playlists do YouTube / YouTube Music.',
  },
  {
    id: 'global-shortcuts-test',
    name: 'Teste Atalhos Globais',
    category: 'Atalhos & Teclado',
    icon: Keyboard,
    description: 'Teste isolado para captura de combinações de teclado com a aplicação sem foco ou minimizada.',
  },
  {
    id: 'webspeech-voices-test',
    name: 'Mesa de Voz DJ (Web Speech)',
    category: 'Áudio & TTS',
    icon: Volume2,
    description: 'Mesa experimental estilo DJ com equalizador de Pitch, Rate, Volume e detecção de vozes nativas.',
  },
  {
    id: 'sandbox-overview',
    name: 'Visão Geral do Sandbox',
    category: 'Ambiente',
    icon: Box,
    description: 'Painel de isolamento para desenvolvimento e prototipagem de novos recursos.',
  },
  {
    id: 'teste-rtc',
    name: 'TESTE RTC',
    category: 'Comunicação & P2P',
    icon: Radio,
    description: 'Laboratório de reconstrução RTC: Prova real WebRTC P2P (Publisher / Consumer) com fluxo do Twitch ChatBox.',
  },
  {
    id: 'youtube-test-1',
    name: 'Teste YouTube 1',
    category: 'Conexões & Streaming',
    icon: RadioTower,
    description: 'Conexão limpa com live pública sem Data API v3 · Bootstrap 1-shot + tentativa de chat direto pelo Frontend.',
  },
  {
    id: 'lab-photoshop',
    name: 'Photoshop',
    category: 'Ferramentas',
    icon: Sparkles,
    description: 'Estúdio visual e editor de movimento baseado no projeto REAL MotionEditor para animação, timeline, keyframes e efeitos.',
  },
  {
    id: 'lab-photoshop-2',
    name: 'Photoshop 2',
    category: 'Ferramentas',
    icon: Sparkles,
    description: 'Estúdio visual e editor de gráficos em movimento baseado no projeto REAL Nemo para GPU, shaders, timeline/graph editor, vetores e máscaras.',
  },
  {
    id: 'lab-photoshop-3',
    name: 'Photoshop 3',
    category: 'Ferramentas',
    icon: Sparkles,
    description: 'Bancada de testes e Canvas nativo LiveNexus para suporte a texto, imagens, formas, movimentação, redimensionamento e futura árvore de animações.',
  },
];

export default function AdminLabSection() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeToolId, setActiveToolId] = useState('sandbox-overview');

  // Auto-scroll padronizado do LiveNexus nas zonas de borda do drawer (desktop)
  const {
    ref: drawerNavRef,
    handleMouseMove: handleDrawerMouseMove,
    stopAutoScroll: stopDrawerAutoScroll,
  } = useAutoScroll({
    zone: 70,
    minSpeed: 1.5,
    maxSpeed: 6.0,
    checkButtons: false,
  });

  const activeTool = LAB_TOOLS.find((t) => t.id === activeToolId) || LAB_TOOLS[0];

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-6rem)] overflow-x-hidden flex flex-col">
      {/* Barra superior de controle do Lab */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
            <FlaskConical size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Laboratório</h2>
            <p className="text-xs text-slate-400">Contêiner administrativo para experimentação e testes isolados</p>
          </div>
        </div>

        {/* Botão retrátil para abrir/fechar o Drawer de Ferramentas */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition z-30 shadow-lg ${
            drawerOpen
              ? 'bg-violet-500 text-white shadow-violet-500/20'
              : 'border border-violet-500/30 bg-[#0e121d] text-violet-200 hover:bg-violet-500/20'
          }`}
          title={drawerOpen ? 'Recolher seletor de ferramentas' : 'Abrir seletor de ferramentas'}
        >
          <Layers size={14} />
          <span>Ferramentas</span>
          {drawerOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Área Principal da Ferramenta Ativa (NÃO é comprimida pelo drawer) */}
      <div className="flex-1 w-full min-w-0">
        {activeToolId === 'global-shortcuts-test' && <AdminGlobalShortcutsTest />}
        {activeToolId === 'webspeech-voices-test' && <AdminWebSpeechVoicesTest />}
        {activeToolId === 'sandbox-overview' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0a0d15] p-6 md:p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
                  <Sparkles size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white">Ambiente de Testes & Prototipagem</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    O Laboratório opera como um contêiner administrativo isolado. Experimentos desenvolvidos aqui não interferem no fluxo de produção de usuários comuns.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 pt-2">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
                    <Shield size={15} />
                    <span>Isolamento Total</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Ferramentas no Laboratório têm ciclo de vida temporário. Recursos validados são promovidos para suas respectivas seções definitivas.
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <HelpCircle size={15} />
                    <span>Suporte a Experimentos</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Utilize o menu lateral para alternar entre os utilitários de prototipagem técnica ativos no workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeToolId === 'test-ids-library' && <LabTestIdsLibrarySection />}
        {activeToolId === 'teste-rtc' && <AdminRtcTestLabSection />}
        {activeToolId === 'youtube-test-1' && <YouTubeTest1Section />}
        {activeToolId === 'lab-photoshop' && <LabPhotoshopSection />}
        {activeToolId === 'lab-photoshop-2' && <LabPhotoshop2Section />}
        {activeToolId === 'lab-photoshop-3' && <LabPhotoshop3Section />}
      </div>

      {/* Drawer deslizante de ferramentas (à direita) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex justify-end transition-opacity">
          <div
            ref={drawerNavRef}
            onMouseMove={handleDrawerMouseMove}
            onMouseLeave={stopDrawerAutoScroll}
            className="w-full max-w-sm bg-[#080b11] border-l border-white/10 p-6 flex flex-col h-full shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-violet-400" />
                <h3 className="text-sm font-bold text-white">Ferramentas do Laboratório</h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-2.5">
              {LAB_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeToolId === tool.id;

                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveToolId(tool.id);
                      setDrawerOpen(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isActive
                        ? 'border-violet-500/50 bg-violet-500/15 text-white shadow-lg shadow-violet-500/10'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-slate-300'
                    }`}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg mt-0.5 ${isActive ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-300'}`}>
                      <Icon size={16} />
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{tool.name}</span>
                        <span className="text-[10px] text-violet-400 font-mono">{tool.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{tool.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
