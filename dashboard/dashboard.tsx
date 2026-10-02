// Painel Live Nexus (Dashboard). Consumidor leve do StreamingProvider global:
// apenas UI + activeSection. Sockets, timers, TTS, mensagens, viewers e meta
// vivem no StreamingContext (montado como layout route em App.jsx) e sobrevivem
// à troca de seção/tela interna.
import { useState, useEffect } from 'react';
import { useAuth } from '@dashboard/login/AuthContext';
import { setAppSection } from '@dashboard/painel-admin/Admin_streamingDiagnostics';
import { useStreaming, PLATFORMS, isConnectionActive } from '@dashboard/configuracao/Config_StreamingContext';
import Sidebar, { MODULES, SECTION_TO_MODULE } from '@dashboard/configuracao/Config_Sidebar';
import OverviewSection from '@dashboard/configuracao/sections/Config_OverviewSection';
import ConfigSection from '@dashboard/configuracao/sections/Config_Section';
import VoiceSection from '@dashboard/configuracao/sections/Config_VoiceSection';
import CommandsSection from '@dashboard/configuracao/sections/Config_CommandsSection';
import FiltersSection from '@dashboard/configuracao/sections/Config_FiltersSection';
import AboutSection from '@dashboard/configuracao/sections/Config_AboutSection';
import ProfileSection from '@dashboard/configuracao/sections/Config_ProfileSection';
import AllLivesSection from '@dashboard/configuracao/sections/Config_AllLivesSection';
import OverlaysWorkspace from '@dashboard/overlays/Overlay_Workspace';
import MusicPlayerContainer from '@dashboard/biblioteca/Library_MusicPlayerContainer';
import WidgetsSection from './widgets/Widget_Section';

import AdminConnectionsSection from './painel-admin/Admin_ConnectionsSection';
import AdminLabSection from './painel-admin/Admin_LabSection';
import CenariosSection from './cenarios/Scenario_Section';
import DiagnosticSection from './painel-admin/Admin_DiagnosticSection';
import AdminDatabaseExplorer from './painel-admin/db/Admin_DatabaseExplorer';
import DataCentralPage from './painel-admin/Admin_DataCentralPage';
import PlayerBuster from '@dashboard/biblioteca/Library_PlayerBuster';
import UserGallerySection from '@dashboard/configuracao/sections/Config_UserGallerySection';
import UserScenariosSection from '@dashboard/configuracao/sections/Config_UserScenariosSection';
import UserOverlaysSection from '@dashboard/configuracao/sections/Config_UserOverlaysSection';
import UserLibrarySection from '@dashboard/configuracao/sections/Config_UserLibrarySection';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import { recordDiagnosticEvent } from '@dashboard/painel-admin/diagnostic/Admin_diagnosticService';
import { useAutoScroll } from '@dashboard/componentes/useAutoScroll';
import { useGlobalScenarioShortcuts } from './cenarios/useGlobalScenarioShortcuts';


export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeSection, setActiveSection] = useState('overview');
  const s = useStreaming();
  const central = useNewUserDataCentral();

  // Mantém atalhos de cenário e subcenário ativos em todas as páginas do painel
  useGlobalScenarioShortcuts();

  useEffect(() => {
    setAppSection(activeSection);
    recordDiagnosticEvent({
      level: 'info',
      module: 'Dashboard',
      action: 'Navegação',
      message: `Navegou para a seção "${activeSection}"`,
      details: { section: activeSection },
    });
  }, [activeSection]);

  // Proteção de rota interna para seções administrativas
  useEffect(() => {
    if (activeSection.startsWith('admin-') && !isAdmin) {
      setActiveSection('overview');
    }
  }, [activeSection, isAdmin]);

  const chatConnected = (PLATFORMS || []).some(p => isConnectionActive(s?.connections?.[p]?.status));
  const activeModule = SECTION_TO_MODULE[activeSection] || 'dashboard';
  const currentModule = MODULES.find(m => m.id === activeModule);
  const isMusicSection = activeSection === 'library-main' || activeSection === 'library';
  const isLabSection = activeSection === 'admin-lab';
  const isOverlaysSection = activeModule === 'overlays' || activeSection === 'overlays' || activeSection.startsWith('overlay-');
  const isSpecialSection = isLabSection || isOverlaysSection;
  const isAdminSection = activeSection.startsWith('admin-');
  const { ref: adminAutoScrollRef } = useAutoScroll({
    enabled: isAdminSection,
    speedMultiplier: 1.5,
  });

  return (
    <div className="flex h-screen text-slate-200 overflow-hidden">
      <MusicPlayerContainer />
      <Sidebar active={activeSection} onSelect={setActiveSection} speaking={s.speaking} chatConnected={chatConnected} isAdmin={isAdmin} onLogout={s.logout} userName={user?.data?.display_name || user?.full_name || user?.email || ''} userAvatar={user?.data?.avatar_url} />
      <main
        ref={isAdminSection ? adminAutoScrollRef : undefined}
        className={`flex-1 min-w-0 h-full relative ${isMusicSection ? 'overflow-y-auto' : isSpecialSection ? 'overflow-hidden flex flex-col p-0' : 'overflow-y-auto p-4 md:p-6'} ${isAdminSection ? 'no-scrollbar' : ''}`}
        style={isAdminSection ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}
      >
        <div className={isSpecialSection ? 'flex-1 min-w-0 h-full flex flex-col overflow-hidden relative' : 'contents'}>
          {currentModule?.submenus?.length > 1 && !isOverlaysSection && (
            <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1 md:hidden shrink-0">
              {currentModule.submenus.map(sub => (
                <button key={sub.id} onClick={() => setActiveSection(sub.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${activeSection === sub.id ? 'bg-violet-500/20 text-white' : 'bg-white/5 text-slate-400'}`}>
                  {sub.label}
                </button>
              ))}
            </div>
          )}
          {activeSection === 'overview' && <OverviewSection connections={s.connections} messages={s.messages} ttsCount={s.ttsCount} speakerCounts={s.speakerCounts} test={s.test} setTest={s.setTest} sendTest={s.sendTest} speaking={s.speaking} onPauseReading={s.pauseReading} onClear={s.clearMessages} />}
          {activeSection === 'widgets' && <WidgetsSection />}
          {isOverlaysSection && <OverlaysWorkspace selectedOverlayId={activeSection} />}
          {activeSection === 'config' && <ConfigSection connections={s.connections} onConnectionChange={s.setConnectionField} onToggle={s.toggle} linkedChannels={s.linkedChannels} onVerified={s.handleVerified} onRenew={s.handleRenew} />}
          {activeSection === 'voice' && <VoiceSection settings={s.settings} voices={s.voices} speaking={s.speaking} onChange={s.updateSetting} onToggle={s.pauseReading} onClear={s.clearMessages} onNavigateToLab={() => setActiveSection('admin-lab')} />}
          {activeSection === 'commands' && <CommandsSection />}
          {activeSection === 'filters' && <FiltersSection />}
          {activeSection === 'profile' && <ProfileSection />}
          {activeSection === 'user-cenarios' && <UserScenariosSection />}
          {activeSection === 'user-overlays' && <UserOverlaysSection />}
          {activeSection === 'user-gallery' && <UserGallerySection />}
          {activeSection === 'user-library' && <UserLibrarySection />}
          {activeSection === 'all-lives' && <AllLivesSection />}
          {activeSection === 'about' && <AboutSection />}
          {activeSection === 'admin-connections' && isAdmin && (
            <AdminConnectionsSection
              connections={s.connections}
              linkedChannels={s.linkedChannels}
              adminTestIdentity={s.adminTestIdentity}
              adminTestMode={s.adminTestMode}
              onToggleAdminTest={s.toggleAdminTest}
              onSetAdminTestIdentity={s.setAdminTestIdentityValue}
              onClearConnections={s.disconnectAll}
            />
          )}
          {activeSection === 'admin-data-central' && isAdmin && <DataCentralPage />}
          {activeSection === 'admin-database' && isAdmin && <AdminDatabaseExplorer />}
          {activeSection === 'admin-lab' && isAdmin && <AdminLabSection />}
          {activeSection === 'cenarios-main' && <CenariosSection />}
          {activeSection === 'admin-diagnostic' && isAdmin && <DiagnosticSection />}
          {(activeSection === 'library-main' || activeSection === 'library') && (
            <div className="w-full min-h-full">
              <PlayerBuster />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
