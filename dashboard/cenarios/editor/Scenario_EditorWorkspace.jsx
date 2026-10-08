import React, { useState, useEffect, useRef } from 'react';
import ScenarioEditorVisualizer from './Scenario_Visualizer';
import ScenarioEditorSidebar from './Scenario_EditorSidebar';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import {
  parseSubShortcut,
  formatKeyFromEvent,
  matchesSubscenarioShortcut,
  broadcastScenarioChange
} from '../Scenario_shortcutHelper';
import { getWidgetDefaultDimensions } from './Scenario_widgetElements';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';

const defaultBackground = {
  type: 'transparent',
  color: '#020617',
  gradient: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
  image: '',
  opacity: 100,
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  showBorder: false,
  borderWidth: '0px',
  borderRadius: '0px',
};

export default function ScenarioEditorWorkspace({ cenario, userId }) {
  const { scenarioBranch } = useNewUserDataCentral();
  const cenarioId = cenario?.id || 'scenario-main';

  // Subscenarios state initialization - fallback to single subscenario for backwards compatibility
  const [subcenarios, setSubcenarios] = useState(() => {
    if (cenario?.subcenarios && cenario.subcenarios.length > 0) {
      // Ensure all loaded subscenarios have a default shortcut if none is set
      return JSON.parse(JSON.stringify(cenario.subcenarios)).map((s, idx) => {
        if (!s.shortcut) {
          s.shortcut = `Shift + ${idx + 1}`;
        }
        return s;
      });
    }
    return [
      {
        id: 'default',
        name: 'Subcenário 1',
        instances: JSON.parse(JSON.stringify(cenario?.instances || [])),
        background: JSON.parse(JSON.stringify(cenario?.background || { ...defaultBackground })),
        shortcut: 'Shift + 1'
      }
    ];
  });

  const [activeSubcenarioId, setActiveSubcenarioId] = useState(() => {
    return cenario?.activeSubcenarioId || 'default';
  });

  const activeSubIndex = subcenarios.findIndex(s => s.id === activeSubcenarioId);
  const currentSubIndex = activeSubIndex >= 0 ? activeSubIndex : 0;
  const activeSub = subcenarios[currentSubIndex] || subcenarios[0];

  const [scenarioState, setScenarioState] = useState(() => ({
    [cenarioId]: {
      id: cenarioId,
      name: cenario?.name || 'Cenário Principal',
      visualizerSize: cenario?.visualizerSize || { width: 1920, height: 1080 }
    }
  }));

  const activeScenarioKey = cenarioId;
  const activeScenario = scenarioState[activeScenarioKey];
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);
  const [savedNotice, setSavedNotice] = useState(false);

  // Grid / Guides Settings
  const [gridSettings, setGridSettings] = useState(() => cenario?.gridSettings || {
    showGrid: false,
    gridSize: 20,
    snapToGrid: false,
    showSafeAreas: false,
    verticalGuides: [],
    horizontalGuides: [],
  });

  const handleUpdateGridSettings = (newSettings) => {
    setGridSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Undo / Redo History State (tracks active subscenario instances and background)
  const [history, setHistory] = useState({ past: [], future: [] });

  const saveHistoryState = (stateToSave) => {
    const entry = {
      instances: JSON.parse(JSON.stringify(stateToSave.instances || [])),
      background: stateToSave.background ? JSON.parse(JSON.stringify(stateToSave.background)) : { ...defaultBackground }
    };
    
    setHistory(prev => ({
      past: [...prev.past, entry].slice(-50),
      future: []
    }));
  };

  const handleUndo = () => {
    if (history.past.length === 0) return;
    
    const nextPast = [...history.past];
    const previous = nextPast.pop();
    
    setHistory(prev => ({
      past: nextPast,
      future: [ { instances: activeSub.instances, background: activeSub.background }, ...prev.future].slice(0, 50)
    }));

    setSubcenarios(prev => prev.map(s => s.id === activeSubcenarioId ? {
      ...s,
      instances: previous.instances,
      background: previous.background || { ...defaultBackground }
    } : s));
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;
    
    const nextFuture = [...history.future];
    const nextState = nextFuture.shift();
    
    setHistory(prev => ({
      past: [...prev.past, { instances: activeSub.instances, background: activeSub.background }].slice(-50),
      future: nextFuture
    }));
    
    setSubcenarios(prev => prev.map(s => s.id === activeSubcenarioId ? {
      ...s,
      instances: nextState.instances,
      background: nextState.background || { ...defaultBackground }
    } : s));
  };

  // Silent automatic save of subscenarios & active subscenario to sync OBS in real-time
  const silentSave = async (nextActiveId, currentSubcenarios) => {
    try {
      const activeState = scenarioState[activeScenarioKey];
      const updatedCenarioData = {
        ...cenario,
        name: activeState.name || cenario?.name || 'Novo Cenário',
        instances: (currentSubcenarios.find(s => s.id === nextActiveId) || currentSubcenarios[0])?.instances || [],
        background: (currentSubcenarios.find(s => s.id === nextActiveId) || currentSubcenarios[0])?.background || defaultBackground,
        visualizerSize: activeState.visualizerSize || { width: 1920, height: 1080 },
        gridSettings: gridSettings,
        subcenarios: currentSubcenarios,
        activeSubcenarioId: nextActiveId
      };

      await scenarioBranch('PATCH', { id: cenarioId, payload: { changes: updatedCenarioData } });
    } catch (err) {
      console.error('Erro no salvamento silencioso:', err);
    }
  };

  // Autosave automático debounced com verificação de mutação real (evita requisições redundantes e travamentos)
  const lastSavedJsonRef = useRef('');
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      if (subcenarios && subcenarios.length > 0) {
        lastSavedJsonRef.current = JSON.stringify({
          subcenarios,
          activeSubcenarioId,
          gridSettings,
          state: scenarioState[activeScenarioKey]
        });
      }
      return;
    }
    if (!cenarioId || !subcenarios || subcenarios.length === 0) return;

    const currentJson = JSON.stringify({
      subcenarios,
      activeSubcenarioId,
      gridSettings,
      state: scenarioState[activeScenarioKey]
    });

    if (lastSavedJsonRef.current === currentJson) return;

    const timer = setTimeout(() => {
      lastSavedJsonRef.current = currentJson;
      silentSave(activeSubcenarioId, subcenarios);
    }, 1200);

    return () => clearTimeout(timer);
  }, [subcenarios, activeSubcenarioId, gridSettings, scenarioState, activeScenarioKey, cenarioId]);

  // Listener para sincronizar ações do contador de mortes (Numpad +, Numpad -, Numpad Del)
  useEffect(() => {
    const handleDeathCounterAction = (e) => {
      const { action } = e.detail || {};
      if (!action) return;

      setSubcenarios((prev) => {
        let hasChanges = false;
        const updated = prev.map((s) => {
          const hasDeath = (s.instances || []).some((i) => i.widgetId === 'manual-death-counter');
          if (!hasDeath) return s;
          hasChanges = true;

          return {
            ...s,
            instances: (s.instances || []).map((inst) => {
              if (inst.widgetId !== 'manual-death-counter') return inst;
              const current = Math.max(0, Number(inst.config?.deathCount) || 0);
              let next = current;
              if (action === 'INCREMENT') next = current + 1;
              else if (action === 'DECREMENT') next = Math.max(0, current - 1);
              else if (action === 'RESET') next = 0;

              return {
                ...inst,
                config: {
                  ...inst.config,
                  deathCount: next
                }
              };
            })
          };
        });

        if (hasChanges) {
          silentSave(activeSubcenarioId, updated);
          return updated;
        }
        return prev;
      });
    };

    window.addEventListener('livenexus:death-counter-action', handleDeathCounterAction);
    return () => window.removeEventListener('livenexus:death-counter-action', handleDeathCounterAction);
  }, [activeSubcenarioId]);

  // Subscenarios CRUD Handlers
  const handlePrevSub = () => {
    const currentIndex = subcenarios.findIndex(s => s.id === activeSubcenarioId);
    if (currentIndex <= 0) return;
    const nextId = subcenarios[currentIndex - 1].id;
    setActiveSubcenarioId(nextId);
    setSelectedInstanceId(null);
    setHistory({ past: [], future: [] });
    silentSave(nextId, subcenarios);
    broadcastScenarioChange(cenarioId, nextId);
  };

  const handleNextSub = () => {
    const currentIndex = subcenarios.findIndex(s => s.id === activeSubcenarioId);
    if (currentIndex < 0 || currentIndex >= subcenarios.length - 1) return;
    const nextId = subcenarios[currentIndex + 1].id;
    setActiveSubcenarioId(nextId);
    setSelectedInstanceId(null);
    setHistory({ past: [], future: [] });
    silentSave(nextId, subcenarios);
    broadcastScenarioChange(cenarioId, nextId);
  };

  const handleCreateSub = () => {
    const newId = `sub-${Date.now()}`;
    const newSubNumber = subcenarios.length + 1;
    const newSub = {
      id: newId,
      name: `Subcenário ${newSubNumber}`,
      instances: [],
      background: { ...defaultBackground },
      trigger: 'Shift',
      key: `${newSubNumber}`,
      shortcut: `Shift + ${newSubNumber}`
    };
    const updated = [...subcenarios, newSub];
    setSubcenarios(updated);
    setActiveSubcenarioId(newId);
    setSelectedInstanceId(null);
    setHistory({ past: [], future: [] });
    silentSave(newId, updated);
    broadcastScenarioChange(cenarioId, newId);
  };

  const [confirmDeleteSubId, setConfirmDeleteSubId] = useState(null);

  const handleRenameSub = (id, newName) => {
    const updated = subcenarios.map(s => s.id === id ? { ...s, name: newName } : s);
    setSubcenarios(updated);
    silentSave(activeSubcenarioId, updated);
  };

  const handleDeleteSub = (id) => {
    if (subcenarios.length <= 1) {
      return;
    }

    const currentIndex = subcenarios.findIndex(s => s.id === id);
    const updated = subcenarios.filter(s => s.id !== id);
    setSubcenarios(updated);

    let nextActiveId = activeSubcenarioId;
    // If deleting active, switch to another
    if (activeSubcenarioId === id) {
      const nextIndex = currentIndex === 0 ? 0 : currentIndex - 1;
      nextActiveId = updated[nextIndex].id;
      setActiveSubcenarioId(nextActiveId);
    }
    setSelectedInstanceId(null);
    setHistory({ past: [], future: [] });
    setConfirmDeleteSubId(null);
    silentSave(nextActiveId, updated);
    broadcastScenarioChange(cenarioId, nextActiveId);
  };

  // Interactive Key Capture Slot State ('trigger' | 'key' | null)
  const [listeningSlot, setListeningSlot] = useState(null);

  // 1. Listener de Teclas em Tempo Real para Troca de Subcenários no Canvas
  useEffect(() => {
    if (listeningSlot) return;

    const heldKeys = new Set();

    const handleKeyDown = (e) => {
      // Ignora se o usuário estiver digitando em campos de texto/input
      if (document.activeElement && (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      )) {
        return;
      }

      const formatted = formatKeyFromEvent(e);
      if (formatted) heldKeys.add(formatted.toUpperCase());
      if (e.key === 'Shift') heldKeys.add('SHIFT');
      if (e.key === 'Control' || e.key === 'Ctrl') heldKeys.add('CTRL');
      if (e.key === 'Alt') heldKeys.add('ALT');
      if (e.key === 'Meta' || e.key === 'OS') heldKeys.add('WIN');

      if (!subcenarios || subcenarios.length === 0) return;

      const matchedSub = subcenarios.find(s => matchesSubscenarioShortcut(e, s, heldKeys));
      if (matchedSub && matchedSub.id !== activeSubcenarioId) {
        e.preventDefault();
        e.stopPropagation();

        setActiveSubcenarioId(matchedSub.id);
        setSelectedInstanceId(null);
        setHistory({ past: [], future: [] });
        silentSave(matchedSub.id, subcenarios);
        broadcastScenarioChange(cenarioId, matchedSub.id);
      }
    };

    const handleKeyUp = (e) => {
      const formatted = formatKeyFromEvent(e);
      if (formatted) heldKeys.delete(formatted.toUpperCase());
      if (e.key === 'Shift') heldKeys.delete('SHIFT');
      if (e.key === 'Control' || e.key === 'Ctrl') heldKeys.delete('CTRL');
      if (e.key === 'Alt') heldKeys.delete('ALT');
      if (e.key === 'Meta' || e.key === 'OS') heldKeys.delete('WIN');
    };

    const handleBlur = () => {
      heldKeys.clear();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleBlur);
    };
  }, [listeningSlot, subcenarios, activeSubcenarioId, cenarioId]);

  // 2. Slot Capture Listener (User clicks Gatilho or Tecla button and presses any key)
  useEffect(() => {
    if (!listeningSlot) return;

    const handleSlotKey = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setListeningSlot(null);
        return;
      }

      const pressedName = formatKeyFromEvent(e);
      const parsed = parseSubShortcut(activeSub);

      if (listeningSlot === 'trigger') {
        const newTrigger = pressedName;
        const currentKey = parsed.key || activeSub?.key || '';
        const newShortcut = currentKey ? `${newTrigger} + ${currentKey}` : newTrigger;

        const updated = subcenarios.map(s => s.id === activeSub.id ? {
          ...s,
          trigger: newTrigger,
          key: currentKey,
          shortcut: newShortcut
        } : s);

        setSubcenarios(updated);
        silentSave(activeSubcenarioId, updated);
        broadcastScenarioChange(cenarioId, activeSubcenarioId);
        setListeningSlot(null);
      } else if (listeningSlot === 'key') {
        const newKey = pressedName;
        const currentTrigger = parsed.trigger || activeSub?.trigger || 'Shift';
        const newShortcut = `${currentTrigger} + ${newKey}`;

        const updated = subcenarios.map(s => s.id === activeSub.id ? {
          ...s,
          trigger: currentTrigger,
          key: newKey,
          shortcut: newShortcut
        } : s);

        setSubcenarios(updated);
        silentSave(activeSubcenarioId, updated);
        broadcastScenarioChange(cenarioId, activeSubcenarioId);
        setListeningSlot(null);
      }
    };

    window.addEventListener('keydown', handleSlotKey, true);
    return () => window.removeEventListener('keydown', handleSlotKey, true);
  }, [listeningSlot, activeSub, subcenarios, activeSubcenarioId, cenarioId]);

  // 2. Cross-Tab & Cross-Window synchronization listener
  useEffect(() => {
    if (!cenarioId || typeof window === 'undefined') return;

    let channel = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel(`scenario_channel_${String(cenarioId)}`);
        channel.onmessage = (event) => {
          if (event.data?.type === 'SWITCH_SUBSCENARIO' && event.data.subscenarioId) {
            setActiveSubcenarioId(event.data.subscenarioId);
          }
        };
      }
    } catch (err) {
      console.error(err);
    }

    const handleStorage = (e) => {
      if (e.key === `scenario_active_sub_${String(cenarioId)}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.subscenarioId) {
            setActiveSubcenarioId(parsed.subscenarioId);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [cenarioId]);

  // Instance Interaction Handlers
  const handleAddInstance = ({ widgetId, elementKey, isFullWidget, name, defaultConfig, width, height }) => {
    saveHistoryState(activeSub);

    const defaultDims = getWidgetDefaultDimensions(widgetId, Boolean(isFullWidget));
    const finalWidth = width || defaultDims.width || 360;
    const finalHeight = height || defaultDims.height || 240;

    const mergedConfig = {
      showBorder: true,
      effBorderThickness: 1,
      borderWidth: '1px',
      borderRadius: '1px',
      effBorderRadius: 1,
      borderColor: '#ffffff',
      borderStyle: 'solid',
      ...(defaultConfig || {}),
      showBorder: true
    };
    if (mergedConfig.effBorderThickness === undefined || mergedConfig.effBorderThickness === 0) {
      mergedConfig.effBorderThickness = 1;
      mergedConfig.borderWidth = '1px';
    }
    if (!mergedConfig.borderRadius || parseFloat(mergedConfig.borderRadius) < 0.5) {
      mergedConfig.borderRadius = '1px';
      mergedConfig.effBorderRadius = 1;
    }

    const newInst = {
      id: `inst-${Date.now()}`,
      widgetId: widgetId,
      elementKey: isFullWidget ? 'full_widget' : elementKey,
      isFullWidget: Boolean(isFullWidget),
      name: name || 'Elemento',
      x: 60 + (activeSub.instances.length * 20),
      y: 60 + (activeSub.instances.length * 20),
      width: finalWidth,
      height: finalHeight,
      zIndex: activeSub.instances.length + 1,
      visible: true,
      locked: false,
      config: mergedConfig,
    };

    setSubcenarios(prev => prev.map(s => s.id === activeSubcenarioId ? {
      ...s,
      instances: [...s.instances, newInst]
    } : s));
    setSelectedInstanceId(newInst.id);
  };

  const handleUpdateInstance = (id, patch) => {
    setSubcenarios(prev => prev.map(s => s.id === activeSubcenarioId ? {
      ...s,
      instances: s.instances.map(inst => inst.id === id ? { ...inst, ...patch } : inst)
    } : s));
  };

  const handleDeleteInstance = (id) => {
    saveHistoryState(activeSub);

    setSubcenarios(prev => prev.map(s => s.id === activeSubcenarioId ? {
      ...s,
      instances: s.instances.filter(inst => inst.id !== id)
    } : s));
    if (selectedInstanceId === id) setSelectedInstanceId(null);
  };

  const handleUpdateVisualizerSize = (newSize) => {
    setScenarioState(prev => ({
      ...prev,
      [activeScenarioKey]: {
        ...prev[activeScenarioKey],
        visualizerSize: newSize
      }
    }));
  };

  const handleUpdateBackground = (patch) => {
    saveHistoryState(activeSub);
    const updated = subcenarios.map(s => s.id === activeSubcenarioId ? {
      ...s,
      background: { ...s.background, ...patch }
    } : s);
    setSubcenarios(updated);
    silentSave(activeSubcenarioId, updated);
    broadcastScenarioChange(cenarioId, activeSubcenarioId);
  };

  const handleSaveTemplate = async () => {
    try {
      const activeState = scenarioState[activeScenarioKey];
      const updatedCenarioData = {
        ...cenario,
        name: activeState.name || cenario?.name || 'Novo Cenário',
        instances: activeSub.instances || [], // fallback for backwards compatibility
        background: activeSub.background || defaultBackground, // fallback for backwards compatibility
        visualizerSize: activeState.visualizerSize || { width: 1920, height: 1080 },
        gridSettings: gridSettings,
        subcenarios: subcenarios,
        activeSubcenarioId: activeSubcenarioId
      };

      const saved = await scenarioBranch('PATCH', { id: cenarioId, payload: { changes: updatedCenarioData } });

      if (saved) {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
      } else {
        alert('Erro ao salvar o cenário.');
      }
    } catch (err) {
      console.error('Erro ao salvar cenário:', err);
      alert('Erro de conexão ao salvar cenário.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080a10] text-white relative overflow-hidden">
      {savedNotice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/90 text-white text-xs font-mono shadow-2xl animate-fade-in backdrop-blur-md">
          <Check className="h-4 w-4" /> Cenário salvo com sucesso!
        </div>
      )}

      {/* Subscenarios Control Bar */}
      <div className="bg-slate-950/80 border-b border-white/5 px-6 py-2.5 flex items-center justify-between gap-4 select-none backdrop-blur shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-violet-400 uppercase tracking-widest font-semibold">Subcenários:</span>
          
          {/* Subcenário Atual Navigation Box com botões internos */}
          <div className="flex items-center justify-between min-w-[200px] max-w-[260px] h-8 bg-slate-900 border border-white/10 rounded-lg px-1 shadow-inner select-none">
            {/* Slot Esquerdo para o Botão ◀ */}
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              {currentSubIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrevSub}
                  className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition-all active:scale-95"
                  title="Subcenário anterior"
                >
                  <ChevronLeft size={15} />
                </button>
              )}
            </div>

            {/* Nome do Subcenário Centralizado (respeitando o espaço dos botões sem sobrepor) */}
            <span
              className="flex-1 text-xs font-bold text-white font-mono text-center truncate px-1.5 select-none"
              title={activeSub.name}
            >
              {activeSub.name}
            </span>

            {/* Slot Direito para o Botão ▶ */}
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              {currentSubIndex < subcenarios.length - 1 && (
                <button
                  type="button"
                  onClick={handleNextSub}
                  className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition-all active:scale-95"
                  title="Próximo subcenário"
                >
                  <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={handleCreateSub}
            className="flex items-center gap-1.5 bg-violet-600/20 hover:bg-violet-600/40 text-violet-200 border border-violet-500/30 px-3 py-1 rounded-lg text-xs font-medium transition-all"
          >
            <Plus size={14} /> Novo Subcenário
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Subscenario Shortcut: Interactive Editable Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-white/10 rounded-lg px-2.5 py-1 shadow-sm">
            <span className="text-xs text-slate-400 font-mono font-medium select-none pr-0.5">Atalho:</span>

            {/* Gatilho (Trigger / Modifier) Button */}
            <button
              type="button"
              onClick={() => setListeningSlot(listeningSlot === 'trigger' ? null : 'trigger')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all border outline-none ${
                listeningSlot === 'trigger'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400 ring-2 ring-amber-400/40 animate-pulse'
                  : 'bg-slate-800 text-violet-300 border-violet-500/30 hover:bg-slate-700 hover:text-violet-200'
              }`}
              title="Clique e pressione uma tecla para definir o gatilho (ex: Shift, Ctrl, Alt...)"
            >
              {listeningSlot === 'trigger' ? 'Aperte o gatilho...' : (parseSubShortcut(activeSub).trigger || 'Shift')}
            </button>

            <span className="text-slate-500 text-xs font-mono font-bold select-none">+</span>

            {/* Tecla (Activation Key) Button */}
            <button
              type="button"
              onClick={() => setListeningSlot(listeningSlot === 'key' ? null : 'key')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all border outline-none ${
                listeningSlot === 'key'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400 ring-2 ring-amber-400/40 animate-pulse'
                  : 'bg-slate-800 text-emerald-300 border-emerald-500/30 hover:bg-slate-700 hover:text-emerald-200'
              }`}
              title="Clique e pressione uma tecla para definir a ativação (ex: 1, F1, A, Espaço...)"
            >
              {listeningSlot === 'key' ? 'Aperte a tecla...' : (parseSubShortcut(activeSub).key || 'Definir')}
            </button>

            {/* Clear shortcut button */}
            {(parseSubShortcut(activeSub).key || parseSubShortcut(activeSub).trigger) && (
              <button
                type="button"
                onClick={() => {
                  const updated = subcenarios.map(s => s.id === activeSub.id ? { ...s, shortcut: '', trigger: '', key: '' } : s);
                  setSubcenarios(updated);
                  silentSave(activeSubcenarioId, updated);
                  broadcastScenarioChange(cenarioId, activeSubcenarioId);
                }}
                className="text-slate-500 hover:text-rose-400 px-1 text-xs transition-colors ml-0.5"
                title="Remover atalho"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">Renomear atual:</span>
            <input
              type="text"
              value={activeSub.name}
              onChange={(e) => handleRenameSub(activeSub.id, e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-sans w-40 transition-all"
            />
          </div>

          {/* Botão de Excluir Subcenário - sempre visível e com confirmação inline não-bloqueante */}
          {confirmDeleteSubId === activeSub.id ? (
            <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-500/50 rounded-lg px-2 py-1 shadow-sm animate-fade-in">
              <span className="text-[11px] text-rose-300 font-medium select-none">Excluir?</span>
              <button
                type="button"
                onClick={() => handleDeleteSub(activeSub.id)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer"
                title="Confirmar exclusão definitiva do subcenário"
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteSubId(null)}
                className="text-slate-400 hover:text-white text-[11px] px-1.5 py-0.5 rounded hover:bg-white/10 transition-all cursor-pointer"
                title="Cancelar"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={subcenarios.length <= 1}
              onClick={() => {
                if (subcenarios.length > 1) {
                  setConfirmDeleteSubId(activeSub.id);
                  setTimeout(() => {
                    setConfirmDeleteSubId(prev => (prev === activeSub.id ? null : prev));
                  }, 5000);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all ${
                subcenarios.length > 1
                  ? 'text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 cursor-pointer active:scale-95'
                  : 'text-slate-600 bg-slate-900/40 border-white/5 cursor-not-allowed opacity-40'
              }`}
              title={
                subcenarios.length > 1
                  ? 'Excluir este subcenário'
                  : 'O cenário precisa manter pelo menos 1 subcenário'
              }
            >
              <Trash2 size={13} className="shrink-0" />
              <span>Excluir</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        <ScenarioEditorVisualizer
          instances={activeSub.instances}
          selectedInstanceId={selectedInstanceId}
          onSelectInstance={setSelectedInstanceId}
          onUpdateInstance={handleUpdateInstance}
          onDeleteInstance={handleDeleteInstance}
          visualizerSize={activeScenario.visualizerSize}
          onUpdateVisualizerSize={handleUpdateVisualizerSize}
          gridSettings={gridSettings}
          onUpdateGridSettings={handleUpdateGridSettings}
          background={activeSub.background || defaultBackground}
        />

        <ScenarioEditorSidebar
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedWidgetId={selectedWidgetId}
          setSelectedWidgetId={setSelectedWidgetId}
          instances={activeSub.instances}
          selectedInstanceId={selectedInstanceId}
          onSelectInstance={setSelectedInstanceId}
          onAddInstance={handleAddInstance}
          onUpdateInstance={handleUpdateInstance}
          onDeleteInstance={handleDeleteInstance}
          onSaveTemplate={handleSaveTemplate}
          overlayName={activeScenario.name}
          visualizerSize={activeScenario.visualizerSize}
          gridSettings={gridSettings}
          onUpdateGridSettings={handleUpdateGridSettings}
          background={activeSub.background || defaultBackground}
          onUpdateBackground={handleUpdateBackground}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>
    </div>
  );
}
