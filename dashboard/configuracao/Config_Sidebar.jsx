// Sidebar dupla/contextual — Camada 1 (módulos) + Camada 2 (submenus do módulo ativo).
// Reorganização pura de navegação: nenhum estado global, lógica funcional ou seção alterada.
// activeSection continua como source of truth; activeModule é derivado via SECTION_TO_MODULE.
import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAvatar } from '@dashboard/configuracao/avatar/Config_avatarStorageAdapter';
import { useAutoScroll } from '@dashboard/componentes/useAutoScroll';
import CompactMusicPlayer from '@dashboard/biblioteca/Library_CompactMusicPlayer';
import {
  LayoutDashboard, Settings, AudioLines, Terminal, Info,
  LogOut, FlaskConical, Plug, User, Radio,
  Filter, Library, LayoutGrid, Layers,
  ShieldCheck, PlugZap, Database, AlertCircle, Clapperboard,
  Image as ImageIcon
} from 'lucide-react';

import { TWITCH_WIDGETS_CATALOG } from '@dashboard/widgets/Widget_twitchWidgetsCatalog';

const overlaySubmenus = TWITCH_WIDGETS_CATALOG.map(w => ({
  id: `overlay-${w.id}`,
  label: w.name,
  icon: LayoutGrid
}));

const MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    submenus: [
      { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
      { id: 'widgets', label: 'Widgets', icon: LayoutGrid },
    ],
  },
  {
    id: 'overlays',
    label: 'Overlays',
    icon: Layers,
    submenus: overlaySubmenus.length > 0 ? overlaySubmenus : [
      { id: 'overlay-chat-live', label: 'Chat ao Vivo', icon: Layers }
    ],
  },
  {
    id: 'cenarios',
    label: 'Cenário',
    icon: Clapperboard,
    submenus: [
      { id: 'cenarios-main', label: 'Cenários', icon: LayoutGrid },
    ],
  },
  {
    id: 'tts',
    label: 'TTS',
    icon: AudioLines,
    submenus: [
      { id: 'voice', label: 'Voz e idioma', icon: AudioLines },
      { id: 'filters', label: 'Filtros', icon: Filter },
      { id: 'commands', label: 'Comandos TTS', icon: Terminal },
    ],
  },
  {
    id: 'connections',
    label: 'Conexões',
    icon: Plug,
    submenus: [
      { id: 'config', label: 'Canais e status', icon: Plug },
    ],
  },
  {
    id: 'library',
    label: 'Biblioteca',
    icon: Library,
    submenus: [
      { id: 'library-main', label: 'Biblioteca', icon: Library },
    ],
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    submenus: [
      { id: 'profile', label: 'Perfil', icon: User },
      { id: 'user-cenarios', label: 'Cenários', icon: Clapperboard },
      { id: 'user-overlays', label: 'Overlays', icon: Layers },
      { id: 'user-gallery', label: 'Galeria', icon: ImageIcon },
      { id: 'user-library', label: 'Biblioteca', icon: Library },
      { id: 'all-lives', label: 'Todas as Lives', icon: Radio },
      { id: 'about', label: 'Sobre', icon: Info },
      { id: 'logout', label: 'Sair', icon: LogOut },
    ],
  },
  {
    id: 'admin',
    label: 'Painel Admin',
    icon: ShieldCheck,
    adminOnly: true,
    submenus: [
      { id: 'admin-connections', label: 'Conexões Admin', icon: PlugZap },
      { id: 'admin-database', label: 'Banco de Dados', icon: Database },
      { id: 'admin-data-central', label: 'Central de Dados', icon: Database },
      { id: 'admin-lab', label: 'Laboratório', icon: FlaskConical },
      { id: 'admin-diagnostic', label: 'Diagnóstico', icon: AlertCircle },
    ],
  },
];

const SECTION_TO_MODULE = {};
for (const m of MODULES) for (const s of m.submenus) SECTION_TO_MODULE[s.id] = m.id;
SECTION_TO_MODULE['library'] = 'library';
SECTION_TO_MODULE['admin-lab'] = 'admin';
SECTION_TO_MODULE['overlays'] = 'overlays';
export { MODULES, SECTION_TO_MODULE };

export default function Sidebar({ active, onSelect, speaking, chatConnected, isAdmin, onLogout, userName, userAvatar }) {
  // Avatar local do usuário (camada isolada — preview local, sem backend)
  const localAvatar = useAvatar();
  const displayAvatar = localAvatar || userAvatar;
  const initials = useMemo(() => {
    if (!userName) return '?';
    const base = userName.includes('@') ? userName.split('@')[0] : userName;
    return base.trim().slice(0, 2).toUpperCase();
  }, [userName]);
  // Estado do submenu flutuante temporário aberto por hover
  const [hoveredModuleId, setHoveredModuleId] = useState(null);
  const openTimerRef = useRef(null);
  const closeTimerRef = useRef(null);

  // Auto-scroll padronizado por proximidade de borda (reutilizável)
  const {
    ref: submenuNavRef,
    handleMouseMove: handleSubmenuMouseMove,
    stopAutoScroll: stopSubmenuAutoScroll,
  } = useAutoScroll({
    zone: 75,
    minSpeed: 1.5,
    maxSpeed: 7.0,
    checkButtons: false,
  });
  const stopAutoScroll = stopSubmenuAutoScroll;

  const { ref: mainNavRef } = useAutoScroll({
    zone: 60,
    minSpeed: 1.2,
    maxSpeed: 5.0,
    checkButtons: false,
  });

  const activeModule = SECTION_TO_MODULE[active] || 'dashboard';
  const visibleModules = MODULES.filter(m => !m.adminOnly || isAdmin);
  const hoveredModule = MODULES.find(m => m.id === hoveredModuleId);

  const clearTimers = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  useEffect(() => {
    return () => {
      clearTimers();
      stopSubmenuAutoScroll();
    };
  }, [stopSubmenuAutoScroll]);

  // Passar o mouse sobre um módulo da Sidebar
  const handleModuleMouseEnter = (mod) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    if (mod.disabled || !mod.submenus || mod.submenus.length === 0) {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        setHoveredModuleId(null);
        stopAutoScroll();
      }, 150);
      return;
    }

    if (hoveredModuleId === mod.id) return;

    if (openTimerRef.current) clearTimeout(openTimerRef.current);

    // Pequeno atraso inteligente:
    // Se já havia um submenu aberto navegando entre itens, troca rápido (60ms);
    // Se estava fechado, espera 120ms para não abrir em movimentos rápidos/acidentais do mouse.
    const delay = hoveredModuleId ? 60 : 120;
    openTimerRef.current = setTimeout(() => {
      setHoveredModuleId(mod.id);
    }, delay);
  };

  // Retirar o mouse do item da Sidebar
  const handleModuleMouseLeave = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setHoveredModuleId(null);
      stopAutoScroll();
    }, 200);
  };

  // Manter submenu aberto enquanto o mouse estiver sobre ele
  const handleSubmenuMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  // Fechar submenu ao retirar o mouse do submenu
  const handleSubmenuMouseLeave = () => {
    stopAutoScroll();
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setHoveredModuleId(null);
    }, 200);
  };

  // Se o mouse sair de toda a área da sidebar
  const handleAsideMouseLeave = () => {
    stopAutoScroll();
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setHoveredModuleId(null);
    }, 200);
  };

  // Ao clicar em qualquer item específico do submenu: navega e fecha o submenu imediatamente
  const handleSubmenuClick = (subId) => {
    clearTimers();
    stopAutoScroll();
    setHoveredModuleId(null);
    if (subId === 'logout') {
      if (onLogout) onLogout();
      return;
    }
    onSelect(subId);
  };

  // Clique direto no item principal da Sidebar
  const handleModuleClick = (mod) => {
    if (mod.disabled) return;
    clearTimers();
    stopAutoScroll();
    setHoveredModuleId(null);

    if (!mod.submenus || mod.submenus.length === 0) {
      onSelect(mod.id);
      return;
    }

    if (mod.id === 'dashboard') {
      onSelect(mod.submenus[0].id);
      return;
    }

    const targetSub = (activeModule === mod.id && active) ? active : mod.submenus[0].id;
    onSelect(targetSub);
  };

  return (
    <aside
      onMouseLeave={handleAsideMouseLeave}
      className="relative flex h-full max-h-screen shrink-0 z-30"
    >
      {/* Camada 1 — módulos principais */}
      <div className="flex h-full max-h-screen w-14 md:w-44 shrink-0 flex-col border-r border-violet-500/15 bg-[#080b12] overflow-hidden">
        {/* Topo da Sidebar: Avatar e Nome do Usuário */}
        <div className="flex flex-col items-center justify-center px-1.5 py-3 md:px-3 shrink-0 border-b border-white/5">
          <Link to="/" className="flex items-center justify-center" title={userName || 'Central do Projeto'}>
            {displayAvatar ? (
              <img src={displayAvatar} alt={userName || 'Avatar'} className="h-8 w-8 rounded-full object-cover md:h-10 md:w-10 ring-1 ring-violet-500/30" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300 md:h-10 md:w-10 md:text-sm ring-1 ring-violet-500/30">{initials}</span>
            )}
          </Link>
          <span className="hidden md:block text-[11px] font-medium text-slate-300 mt-1.5 truncate max-w-full text-center px-1" title={userName || 'Usuário'}>
            {userName || 'Usuário'}
          </span>
        </div>

        <nav ref={mainNavRef} className="flex-1 min-h-0 space-y-1 px-1.5 py-2 md:px-2.5 overflow-y-auto no-scrollbar">
          {visibleModules.map(mod => {
            const Icon = mod.icon;
            const on = activeModule === mod.id;
            const isHovered = hoveredModuleId === mod.id;
            const disabled = mod.disabled;
            return (
              <button
                key={mod.id}
                onClick={() => handleModuleClick(mod)}
                onMouseEnter={() => handleModuleMouseEnter(mod)}
                onMouseLeave={handleModuleMouseLeave}
                title={mod.label + (disabled ? ' (em breve)' : '')}
                disabled={disabled}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm transition md:px-3 ${
                  disabled
                    ? 'cursor-not-allowed text-slate-600'
                    : isHovered
                    ? 'bg-violet-500/25 text-white font-medium ring-1 ring-violet-400/30'
                    : on
                    ? 'bg-violet-500/15 text-white font-medium'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon size={18} className={(on || isHovered) && !disabled ? 'text-violet-300' : ''} />
                <span className="hidden md:block truncate">{mod.label}</span>
                {disabled && <span className="hidden md:block ml-auto text-[9px] text-slate-600 shrink-0">em breve</span>}
              </button>
            );
          })}
        </nav>

        <CompactMusicPlayer />

        {/* Status do Sistema */}
        <div className="shrink-0 space-y-1.5 border-t border-white/10 px-2 py-3 text-[11px] md:px-3">
          <div className="flex items-center gap-2 text-slate-300"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e]" /> <span className="hidden md:inline">Sistema Online</span></div>
          <div className="flex items-center gap-2 text-slate-400"><span className={`h-2 w-2 rounded-full ${speaking ? 'bg-emerald-400' : 'bg-amber-400'}`} /> <span className="hidden md:inline">TTS: {speaking ? 'Ativo' : 'Pausado'}</span></div>
          <div className="flex items-center gap-2 text-slate-400"><span className={`h-2 w-2 rounded-full ${chatConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} /> <span className="hidden md:inline">Chat: {chatConnected ? 'Conectado' : 'Desconectado'}</span></div>
        </div>
      </div>

      {/* Camada 2 — Submenu flutuante temporário por hover (desktop) */}
      {hoveredModule && hoveredModule.submenus.length > 0 && (
        <div
          id="sidebar-floating-submenu"
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleSubmenuMouseLeave}
          onMouseMove={handleSubmenuMouseMove}
          className="hidden md:flex absolute left-full top-0 z-50 h-full max-h-screen w-60 lg:w-64 flex-col border-r border-violet-500/20 bg-[#0a0d15] shadow-2xl shadow-black/90 overflow-hidden"
        >
          <div className="shrink-0 px-4 py-4 border-b border-white/5 flex items-center justify-between bg-[#080b12]/60">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-300/90">{hoveredModule.label}</span>
            <span className="text-[10px] font-mono text-slate-500">{hoveredModule.submenus.length}</span>
          </div>

          <nav
            ref={submenuNavRef}
            className="no-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-2 overscroll-contain"
          >
            {hoveredModule.submenus.map(sub => {
              const Icon = sub.icon;
              const on = active === sub.id;
              return (
                <button
                  key={sub.id}
                  id={`sidebar-sub-${sub.id}`}
                  onClick={() => handleSubmenuClick(sub.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${
                    on
                      ? 'bg-violet-500/20 text-white font-medium border-l-2 border-violet-400'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                  title={sub.label}
                >
                  <Icon size={14} className={on ? 'text-violet-300' : 'text-slate-400/80'} />
                  <span className="truncate text-left">{sub.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </aside>
  );
}
