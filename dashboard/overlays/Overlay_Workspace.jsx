import React, { useState, useEffect, useRef, useCallback } from 'react';
import OverlayVisualizer from './Overlay_Visualizer';
import OverlayEditorSidebar from './Overlay_EditorSidebar';
import { getWidgetDefaultDimensions } from './Overlay_widgetElements';
import { TWITCH_WIDGETS_CATALOG } from '@dashboard/widgets/Widget_twitchWidgetsCatalog';
import { Check, Plus, Trash2, Save, Copy, ExternalLink, Layers } from 'lucide-react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import { localCache } from '@dashboard/configuracao/Config_localCache';

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

const emptyOverlay = () => ({
  id: '',
  name: 'Nova Overlay',
  visualizerSize: { width: 800, height: 480 },
  instances: [],
  background: { ...defaultBackground },
  mode: 'local'
});

export default function OverlaysWorkspace({ selectedOverlayId }) {
  const { userId, overlayBranch, runtimeId } = useNewUserDataCentral();
  const [overlaysList, setOverlaysList] = useState([]);
  const [activeOverlayId, setActiveOverlayId] = useState(null);
  const [activeOverlay, setActiveOverlay] = useState(emptyOverlay());
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copied, setCopied] = useState(false);

  // Grid / Guides Settings
  const [gridSettings, setGridSettings] = useState(() => {
    try {
      const saved = userId ? localCache.get(userId, 'overlay_grid_settings') : null;
      if (saved && typeof saved === 'object') {
        return {
          showGrid: false,
          gridSize: 20,
          snapToGrid: false,
          showSafeAreas: false,
          verticalGuides: [],
          horizontalGuides: [],
          ...saved
        };
      }
      return {
        showGrid: false,
        gridSize: 20,
        snapToGrid: false,
        showSafeAreas: false,
        verticalGuides: [],
        horizontalGuides: [],
      };
    } catch {
      return {
        showGrid: false,
        gridSize: 20,
        snapToGrid: false,
        showSafeAreas: false,
        verticalGuides: [],
        horizontalGuides: [],
      };
    }
  });

  const handleUpdateGridSettings = (newSettings) => {
    setGridSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        if (userId) localCache.set(userId, 'overlay_grid_settings', updated);
      } catch (e) {}
      return updated;
    });
  };

  // Helper to generate the default initial instances for the selected submenu
  const getInitialInstancesForSubmenu = useCallback((submenu) => {
    const widgetId = submenu.startsWith('overlay-') ? submenu.replace('overlay-', '') : submenu;
    const widgetObj = TWITCH_WIDGETS_CATALOG.find(w => w.id === widgetId);
    if (!widgetObj) return [];

    return [{
      id: `inst-${Date.now()}`,
      widgetId: widgetId,
      elementKey: 'full_widget',
      isFullWidget: true,
      name: widgetObj.name,
      x: 40,
      y: 40,
      width: 400,
      height: 300,
      zIndex: 1,
      visible: true,
      locked: false,
      config: { ...(widgetObj.defaultConfig || {}) }
    }];
  }, []);

  // Obter nome padrão automático com base no submenu/widget ativo
  const getOverlayDefaultName = useCallback((submenu) => {
    if (!submenu) return 'Nova Overlay';
    if (submenu === 'overlay-main') return 'Principal';
    const widgetId = submenu.startsWith('overlay-') ? submenu.replace('overlay-', '') : submenu;
    const widgetObj = TWITCH_WIDGETS_CATALOG.find(w => w.id === widgetId);
    if (widgetObj && widgetObj.name) return widgetObj.name;
    return submenu.replace('overlay-', '').toUpperCase();
  }, []);

  // Carregar lista de overlays persistidas pelo Johnson CRUD e filtradas por submenu
  const loadOverlays = useCallback(async (selectId = null) => {
    if (!userId || !selectedOverlayId) return;
    try {
      const items = await overlayBranch('GET');
      // Filtrar as overlays pertencentes exclusivamente a este submenu/widget de origem
      const filtered = (items || []).filter(item => item.submenu === selectedOverlayId);
      
      if (filtered && filtered.length > 0) {
        setOverlaysList(filtered);
        const targetId = selectId || localStorage.getItem(`active_overlay_id_${userId}_${selectedOverlayId}`) || filtered[0].id;
        const exists = filtered.some(item => item.id === targetId);
        const finalId = exists ? targetId : filtered[0].id;
        
        setActiveOverlayId(finalId);
        localStorage.setItem(`active_overlay_id_${userId}_${selectedOverlayId}`, finalId);
        
        const selected = filtered.find(item => item.id === finalId) || filtered[0];
        setActiveOverlay({
          ...emptyOverlay(),
          ...selected,
          submenu: selectedOverlayId
        });
      } else {
        setOverlaysList([]);
        setActiveOverlayId(null);
        setActiveOverlay({
          ...emptyOverlay(),
          id: '',
          name: getOverlayDefaultName(selectedOverlayId),
          submenu: selectedOverlayId
        });
      }
    } catch (err) {
      console.error('Erro ao listar overlays:', err);
    }
  }, [userId, selectedOverlayId, overlayBranch, getOverlayDefaultName]);

  useEffect(() => {
    loadOverlays();
  }, [loadOverlays, selectedOverlayId]); // Recarrega sempre que mudar o submenu/widget ativo

  // Listener para sincronizar ações do contador de mortes (Numpad +, Numpad -, Numpad Del)
  useEffect(() => {
    const handleDeathCounterAction = (e) => {
      const { action } = e.detail || {};
      if (!action) return;

      setActiveOverlay((prev) => {
        const hasDeath = (prev.instances || []).some((i) => i.widgetId === 'manual-death-counter');
        if (!hasDeath) return prev;

        const updatedInstances = (prev.instances || []).map((inst) => {
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
        });

        const updated = {
          ...prev,
          instances: updatedInstances
        };

        if (activeOverlayId) {
          overlayBranch('PATCH', {
            id: activeOverlayId,
            payload: { changes: { instances: updatedInstances } }
          }).catch((err) => console.error('Erro ao sincronizar morte em overlay:', err));
        }

        return updated;
      });
    };

    window.addEventListener('livenexus:death-counter-action', handleDeathCounterAction);
    return () => window.removeEventListener('livenexus:death-counter-action', handleDeathCounterAction);
  }, [activeOverlayId, overlayBranch]);

  // Alternar entre overlays salvas (restrita ao submenu ativo)
  const handleSelectOverlay = (id) => {
    if (!id || !userId) return;
    setActiveOverlayId(id);
    localStorage.setItem(`active_overlay_id_${userId}_${selectedOverlayId}`, id);
    const selected = overlaysList.find(item => item.id === id);
    if (selected) {
      setActiveOverlay({
        ...emptyOverlay(),
        ...selected,
        submenu: selectedOverlayId
      });
      setHistory({ past: [], future: [] });
      setSelectedInstanceId(null);
    }
  };

  // Criar nova overlay no submenu ativo
  const handleCreateOverlay = async () => {
    if (!userId || !selectedOverlayId) return;
    
    // Resolve automatic name based on the submenu
    const defaultName = getOverlayDefaultName(selectedOverlayId);
    
    // Check if duplicate, if so append index (e.g. Chat Box 2, Chat Box 3)
    const count = overlaysList.filter(item => item.name.startsWith(defaultName)).length;
    const cleanName = count > 0 ? `${defaultName} ${count + 1}` : defaultName;
    const cleanNameSlug = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const newId = `overlay_${selectedOverlayId}_${cleanNameSlug}_${Date.now()}`;

    const initial = {
      ...emptyOverlay(),
      id: newId,
      name: cleanName,
      submenu: selectedOverlayId,
      instances: getInitialInstancesForSubmenu(selectedOverlayId)
    };

    try {
      const saved = await overlayBranch('POST', { payload: { overlay: initial } });
      setOverlaysList(prev => [...prev, saved]);
      setActiveOverlayId(saved.id);
      setActiveOverlay(saved);
      localStorage.setItem(`active_overlay_id_${userId}_${selectedOverlayId}`, saved.id);
      setHistory({ past: [], future: [] });
      setSelectedInstanceId(null);
    } catch (error) {
      console.error('Erro ao criar nova overlay:', error);
    }
  };

  // Excluir overlay no submenu ativo
  const handleDeleteOverlay = async () => {
    if (!userId || !activeOverlayId || !selectedOverlayId) return;
    if (!window.confirm(`Deseja realmente excluir a overlay "${activeOverlay.name}"?`)) {
      return;
    }
    try {
      await overlayBranch('DELETE', { id: activeOverlayId });
      const remaining = overlaysList.filter(item => item.id !== activeOverlayId);
      setOverlaysList(remaining);
      
      if (remaining.length > 0) {
        const nextSelected = remaining[0];
        setActiveOverlayId(nextSelected.id);
        setActiveOverlay({
          ...emptyOverlay(),
          ...nextSelected,
          submenu: selectedOverlayId
        });
        localStorage.setItem(`active_overlay_id_${userId}_${selectedOverlayId}`, nextSelected.id);
      } else {
        setActiveOverlayId(null);
        setActiveOverlay({
          ...emptyOverlay(),
          id: '',
          name: getOverlayDefaultName(selectedOverlayId),
          submenu: selectedOverlayId
        });
        localStorage.removeItem(`active_overlay_id_${userId}_${selectedOverlayId}`);
      }
      setHistory({ past: [], future: [] });
      setSelectedInstanceId(null);
    } catch (error) {
      console.error('Erro ao excluir overlay:', error);
    }
  };

  // Salvar overlay ativa (PATCH) com tratamento inteligente para renomeação de IDs baseados em nome
  const handleSaveOverlay = async (options = {}) => {
    const isSilent = Boolean(options?.silent);
    if (!userId || !selectedOverlayId) return;
    
    const defaultName = getOverlayDefaultName(selectedOverlayId);
    // Se o nome atual for vazio ou o padrão "Nova Overlay", usa o nome automático do submenu
    const currentName = activeOverlay.name || '';
    const cleanName = currentName.trim() === 'Nova Overlay' || currentName.trim() === '' ? defaultName : currentName.trim();
    
    const cleanNameSlug = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const newId = activeOverlayId || `overlay_${selectedOverlayId}_${cleanNameSlug}`;

    const document = { 
      ...activeOverlay, 
      name: cleanName,
      id: newId, 
      submenu: selectedOverlayId, 
      gridSettings 
    };

    try {
      if (!activeOverlayId) {
        // Criar novo registro se estava em tela limpa/vazia
        const allItems = await overlayBranch('GET');
        const exists = (allItems || []).some(item => item.id === newId);
        if (exists) {
          await overlayBranch('PATCH', {
            id: newId,
            payload: { changes: document }
          });
          if (!isSilent) await loadOverlays(newId);
        } else {
          await overlayBranch('POST', { payload: { overlay: document } });
          if (!isSilent) await loadOverlays(newId);
        }
      } else if (newId !== activeOverlayId) {
        // Criar novo registro e excluir o antigo (renomeação limpa baseada no nome)
        await overlayBranch('POST', { payload: { overlay: document } });
        await overlayBranch('DELETE', { id: activeOverlayId });
        
        if (!isSilent) await loadOverlays(newId);
      } else {
        // Atualização simples
        await overlayBranch('PATCH', {
          id: activeOverlayId,
          payload: { changes: document }
        });
        if (!isSilent) await loadOverlays(activeOverlayId);
      }

      // Notifica abas do receptor /cenario/receiver/:id para auto-recarregamento
      try {
        const targetBroadcastId = newId || activeOverlayId;
        if (targetBroadcastId && 'BroadcastChannel' in window) {
          const ch = new BroadcastChannel(`scenario_channel_${targetBroadcastId}`);
          ch.postMessage({ type: 'OVERLAY_UPDATE', overlayId: targetBroadcastId });
          ch.close();
        }
        if (targetBroadcastId) {
          localStorage.setItem(`overlay_updated_${targetBroadcastId}`, String(Date.now()));
        }
      } catch (e) {
        // ignore
      }

      if (!isSilent) {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
      }
    } catch (error) {
      if (!isSilent) {
        console.error('Erro ao salvar overlay:', error);
      }
    }
  };

  // Autosave automático debounced com verificação de mutação real
  const lastSavedOverlayJsonRef = useRef('');
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      if (activeOverlay && activeOverlayId) {
        lastSavedOverlayJsonRef.current = JSON.stringify({ activeOverlay, gridSettings });
      }
      return;
    }
    if (!userId || !selectedOverlayId || !activeOverlay || !activeOverlayId) return;

    const currentJson = JSON.stringify({ activeOverlay, gridSettings });
    if (lastSavedOverlayJsonRef.current === currentJson) return;

    const timer = setTimeout(() => {
      lastSavedOverlayJsonRef.current = currentJson;
      handleSaveOverlay({ silent: true });
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeOverlay, gridSettings, userId, selectedOverlayId, activeOverlayId]);

  // Atualizar modo (local ou broadcast)
  const handleUpdateMode = (mode) => {
    setActiveOverlay(prev => ({ ...prev, mode }));
  };

  // Gerar link correto conforme o modo e as regras de propriedade do LiveNexus
  const getOverlayLink = () => {
    if (!activeOverlayId || !userId) return '';
    const base = `${window.location.origin}/cenario/receiver/${activeOverlayId}`;
    if (activeOverlay.mode === 'broadcast' && runtimeId) {
      return `${base}?userId=${userId}&runtimeId=${runtimeId}`;
    }
    return `${base}?userId=${userId}`;
  };

  const handleCopyLink = () => {
    const link = getOverlayLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Undo / Redo History State
  const [history, setHistory] = useState(() => ({
    past: [],
    future: []
  }));

  const saveHistoryState = (stateToSave) => {
    const entry = {
      instances: JSON.parse(JSON.stringify(stateToSave.instances || [])),
      visualizerSize: { ...stateToSave.visualizerSize },
      background: stateToSave.background ? JSON.parse(JSON.stringify(stateToSave.background)) : { ...defaultBackground }
    };
    
    setHistory(prev => {
      if (prev.past.length > 0) {
        const last = prev.past[prev.past.length - 1];
        if (JSON.stringify(last) === JSON.stringify(entry)) {
          return prev;
        }
      }
      return {
        past: [...prev.past, entry].slice(-50),
        future: []
      };
    });
  };

  const lastSavedTimeRef = useRef(0);
  const recordHistory = (targetState) => {
    const now = Date.now();
    if (now - lastSavedTimeRef.current > 800) {
      saveHistoryState(targetState);
    }
    lastSavedTimeRef.current = now;
  };

  const handleUndo = () => {
    if (history.past.length === 0) return;
    
    const nextPast = [...history.past];
    const previous = nextPast.pop();
    
    const currentEntry = {
      instances: JSON.parse(JSON.stringify(activeOverlay.instances || [])),
      visualizerSize: { ...activeOverlay.visualizerSize },
      background: activeOverlay.background ? JSON.parse(JSON.stringify(activeOverlay.background)) : { ...defaultBackground }
    };
    
    setHistory(prev => ({
      past: nextPast,
      future: [currentEntry, ...prev.future].slice(0, 50)
    }));
    
    setActiveOverlay(prev => ({
      ...prev,
      instances: previous.instances,
      visualizerSize: previous.visualizerSize,
      background: previous.background || { ...defaultBackground }
    }));
    
    if (selectedInstanceId && !previous.instances.some(inst => inst.id === selectedInstanceId)) {
      setSelectedInstanceId(null);
    }
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;
    
    const nextFuture = [...history.future];
    const nextState = nextFuture.shift();
    
    const currentEntry = {
      instances: JSON.parse(JSON.stringify(activeOverlay.instances || [])),
      visualizerSize: { ...activeOverlay.visualizerSize },
      background: activeOverlay.background ? JSON.parse(JSON.stringify(activeOverlay.background)) : { ...defaultBackground }
    };
    
    setHistory(prev => ({
      past: [...prev.past, currentEntry].slice(-50),
      future: nextFuture
    }));
    
    setActiveOverlay(prev => ({
      ...prev,
      instances: nextState.instances,
      visualizerSize: nextState.visualizerSize,
      background: nextState.background || { ...defaultBackground }
    }));
  };

  // Keyboard Shortcuts for Undo/Redo, Delete, and Arrow navigation of elements
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
      if (isInput) return;

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleRedo();
      }

      // Delete Element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedInstanceId) {
          e.preventDefault();
          handleDeleteInstance(selectedInstanceId);
        }
      }

      // Arrow Keys movement
      if (selectedInstanceId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const selectedInst = activeOverlay?.instances?.find(inst => inst.id === selectedInstanceId);
        if (selectedInst && !selectedInst.locked) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0;
          let dy = 0;

          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;
          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;

          if (dx !== 0 || dy !== 0) {
            const canvasW = activeOverlay.visualizerSize?.width || 800;
            const canvasH = activeOverlay.visualizerSize?.height || 480;
            const nextX = Math.max(0, Math.min(selectedInst.x + dx, canvasW - 20));
            const nextY = Math.max(0, Math.min(selectedInst.y + dy, canvasH - 20));
            handleUpdateInstance(selectedInstanceId, { x: nextX, y: nextY });
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history.past, history.future, activeOverlay, selectedInstanceId]);

  // Add instance to active overlay
  const handleAddInstance = ({ widgetId, elementKey, isFullWidget, name, defaultConfig, width, height }) => {
    saveHistoryState(activeOverlay);

    const dims = getWidgetDefaultDimensions(widgetId, isFullWidget);
    const targetW = width || dims.width;
    const targetH = height || dims.height;

    const canvasW = activeOverlay?.visualizerSize?.width || 800;
    const canvasH = activeOverlay?.visualizerSize?.height || 480;

    let defaultW = targetW;
    let defaultH = targetH;

    const maxW = Math.max(100, canvasW - 40);
    const maxH = Math.max(100, canvasH - 40);

    if (defaultW > maxW || defaultH > maxH) {
      const scale = Math.min(maxW / defaultW, maxH / defaultH);
      defaultW = Math.round(defaultW * scale);
      defaultH = Math.round(defaultH * scale);
    }

    const newInst = {
      id: `inst-${Date.now()}`,
      widgetId: widgetId,
      elementKey: isFullWidget ? 'full_widget' : elementKey,
      isFullWidget: Boolean(isFullWidget),
      name: name || 'Elemento',
      x: Math.max(10, Math.min(60 + ((activeOverlay.instances || []).length * 20), canvasW - defaultW - 10)),
      y: Math.max(10, Math.min(60 + ((activeOverlay.instances || []).length * 20), canvasH - defaultH - 10)),
      width: defaultW,
      height: defaultH,
      zIndex: (activeOverlay.instances || []).length + 1,
      visible: true,
      locked: false,
      config: { ...(defaultConfig || {}) },
    };

    setActiveOverlay(prev => ({
      ...prev,
      instances: [...(prev.instances || []), newInst]
    }));
    setSelectedInstanceId(newInst.id);
  };

  // Update instance patch
  const handleUpdateInstance = (id, patch) => {
    recordHistory(activeOverlay);

    setActiveOverlay(prev => ({
      ...prev,
      instances: (prev.instances || []).map(inst => inst.id === id ? { ...inst, ...patch } : inst)
    }));
  };

  // Delete instance
  const handleDeleteInstance = (id) => {
    saveHistoryState(activeOverlay);

    setActiveOverlay(prev => ({
      ...prev,
      instances: (prev.instances || []).filter(inst => inst.id !== id)
    }));
    if (selectedInstanceId === id) setSelectedInstanceId(null);
  };

  // Resize visualizer box with responsive element recalculation
  const handleUpdateVisualizerSize = (newSize) => {
    if (!newSize || !newSize.width || !newSize.height) return;
    saveHistoryState(activeOverlay);

    const oldSize = activeOverlay.visualizerSize || { width: 800, height: 480 };
    const scaleX = oldSize.width > 0 ? newSize.width / oldSize.width : 1;
    const scaleY = oldSize.height > 0 ? newSize.height / oldSize.height : 1;

    const updatedInstances = (activeOverlay.instances || []).map(inst => {
      const respMode = inst.config?.responsiveMode || 'relative';
      const anchor = inst.config?.responsiveAnchor || 'top-left';

      let newX = inst.x;
      let newY = inst.y;
      let newW = inst.width || 220;
      let newH = inst.height || 50;

      if (respMode === 'relative') {
        newX = Math.round(inst.x * scaleX);
        newY = Math.round(inst.y * scaleY);
        newW = Math.round((inst.width || 220) * scaleX);
        newH = Math.round((inst.height || 50) * scaleY);
      } else if (respMode === 'anchor') {
        const marginRight = oldSize.width - (inst.x + (inst.width || 220));
        const marginBottom = oldSize.height - (inst.y + (inst.height || 50));

        if (anchor === 'top-left') {
          // Stay constant
        } else if (anchor === 'top-right') {
          newX = newSize.width - (inst.width || 220) - marginRight;
        } else if (anchor === 'bottom-left') {
          newY = newSize.height - (inst.height || 50) - marginBottom;
        } else if (anchor === 'bottom-right') {
          newX = newSize.width - (inst.width || 220) - marginRight;
          newY = newSize.height - (inst.height || 50) - marginBottom;
        } else if (anchor === 'center') {
          const centerX_old = inst.x + (inst.width || 220) / 2;
          const centerY_old = inst.y + (inst.height || 50) / 2;
          const relativeCenterX = oldSize.width > 0 ? centerX_old / oldSize.width : 0.5;
          const relativeCenterY = oldSize.height > 0 ? centerY_old / oldSize.height : 0.5;
          newX = Math.round(relativeCenterX * newSize.width - (inst.width || 220) / 2);
          newY = Math.round(relativeCenterY * newSize.height - (inst.height || 50) / 2);
        }
      } else if (respMode === 'aspect-ratio') {
        const ratio = (inst.height || 50) > 0 ? (inst.width || 220) / (inst.height || 50) : 1;
        newW = Math.round((inst.width || 220) * scaleX);
        newH = Math.round(newW / ratio);
        newX = Math.round(inst.x * scaleX);
        newY = Math.round(inst.y * scaleY);
      }

      newW = Math.max(40, newW);
      newH = Math.max(20, newH);
      newX = Math.max(0, Math.min(newX, newSize.width - 20));
      newY = Math.max(0, Math.min(newY, newSize.height - 20));

      return {
        ...inst,
        x: newX,
        y: newY,
        width: newW,
        height: newH
      };
    });

    setActiveOverlay(prev => ({
      ...prev,
      visualizerSize: newSize,
      instances: updatedInstances
    }));
  };

  // Update Background Settings
  const handleUpdateBackground = (patch) => {
    saveHistoryState(activeOverlay);

    setActiveOverlay(prev => ({
      ...prev,
      background: {
        ...(prev.background || defaultBackground),
        ...patch
      }
    }));
  };

  const selectedWidgetId = selectedOverlayId && selectedOverlayId.startsWith('overlay-') && selectedOverlayId !== 'overlay-main'
    ? selectedOverlayId.replace('overlay-', '')
    : (TWITCH_WIDGETS_CATALOG[0]?.id || null);

  return (
    <div className="flex flex-col h-full bg-[#080a10] text-white relative overflow-hidden animate-editor-fade-in">
      {/* Toast Save Notification */}
      {savedNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/90 text-white text-xs font-mono shadow-2xl animate-fade-in backdrop-blur-md">
          <Check className="h-4 w-4" /> Configuração da Overlay salva com sucesso!
        </div>
      )}

      {/* CRUD Horizontal Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f111a] border-b border-slate-800/80 px-4 py-2.5 z-40 shrink-0 select-none">
        {/* Left: Selector and Rename */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-400 shrink-0" />
            <select
              value={activeOverlayId || ''}
              onChange={(e) => handleSelectOverlay(e.target.value)}
              className="bg-slate-900/90 border border-slate-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium cursor-pointer"
            >
              {overlaysList.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name || 'Sem nome'}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={activeOverlay.name || ''}
            readOnly
            title="Nome gerado automaticamente com base no submenu"
            placeholder="Nome da Overlay"
            className="bg-slate-950 border border-slate-800/80 text-xs text-slate-400 rounded-lg px-3 py-1.5 w-44 focus:outline-none font-medium cursor-not-allowed"
          />
        </div>

        {/* Middle: Mode Toggle and Link actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* LOCAL vs BROADCAST Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800/80 rounded-lg p-0.5">
            <button
              onClick={() => handleUpdateMode('local')}
              className={`px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
                (activeOverlay.mode || 'local') === 'local'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Local
            </button>
            <button
              onClick={() => handleUpdateMode('broadcast')}
              className={`px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
                activeOverlay.mode === 'broadcast'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Broadcast
            </button>
          </div>

          {/* Link Copier */}
          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800/80 rounded-lg px-2.5 py-1 shrink-0">
            <span className="text-[10px] text-slate-500 font-mono select-none mr-1.5">LINK:</span>
            <input
              type="text"
              readOnly
              value={getOverlayLink()}
              className="bg-transparent text-[10px] text-slate-300 font-mono focus:outline-none w-32 md:w-56 overflow-ellipsis select-all"
            />
            <button
              onClick={handleCopyLink}
              title="Copiar Link"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all duration-200 ml-1.5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={() => window.open(getOverlayLink(), '_blank')}
              title="Abrir em Nova Aba"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all duration-200"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSaveOverlay}
            className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-all shadow-sm shrink-0"
          >
            <Save className="h-3.5 w-3.5" />
            Salvar
          </button>
          <button
            onClick={handleCreateOverlay}
            title="Criar Nova Overlay"
            className="flex items-center justify-center p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition shrink-0"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={handleDeleteOverlay}
            title="Excluir Overlay"
            className="flex items-center justify-center p-1.5 bg-red-950/20 hover:bg-red-950/50 border border-red-900/30 hover:border-red-900/60 rounded-lg text-red-400 hover:text-red-300 transition shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace (Visualizer Box + Floating Editor Sidebar) */}
      <div className="flex-1 relative flex overflow-hidden">
        <OverlayVisualizer
          instances={activeOverlay.instances || []}
          selectedInstanceId={selectedInstanceId}
          onSelectInstance={setSelectedInstanceId}
          onUpdateInstance={handleUpdateInstance}
          onDeleteInstance={handleDeleteInstance}
          visualizerSize={activeOverlay.visualizerSize || { width: 800, height: 480 }}
          onUpdateVisualizerSize={handleUpdateVisualizerSize}
          gridSettings={gridSettings}
          onUpdateGridSettings={handleUpdateGridSettings}
          background={activeOverlay.background || defaultBackground}
        />

        <OverlayEditorSidebar
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedWidgetId={selectedWidgetId}
          instances={activeOverlay.instances || []}
          selectedInstanceId={selectedInstanceId}
          onSelectInstance={setSelectedInstanceId}
          onAddInstance={handleAddInstance}
          onUpdateInstance={handleUpdateInstance}
          onDeleteInstance={handleDeleteInstance}
          onSaveTemplate={handleSaveOverlay}
          overlayName={activeOverlay.name || ''}
          visualizerSize={activeOverlay.visualizerSize || { width: 800, height: 480 }}
          onUpdateVisualizerSize={handleUpdateVisualizerSize}
          gridSettings={gridSettings}
          onUpdateGridSettings={handleUpdateGridSettings}
          background={activeOverlay.background || defaultBackground}
          onUpdateBackground={handleUpdateBackground}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          historyPastCount={history.past.length}
          historyFutureCount={history.future.length}
        />
      </div>
    </div>
  );
}
