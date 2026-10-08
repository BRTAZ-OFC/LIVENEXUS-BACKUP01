import React, { useState, useEffect, useRef } from 'react';
import OverlayVisualizer from './Scenario_Visualizer';
import OverlayEditorSidebar from './Scenario_EditorSidebar';
import { Check } from 'lucide-react';
import { safeStorage } from '@dashboard/login/safeStorage';
import { authClient } from '@dashboard/login/authClient';

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
};

export default function OverlaysWorkspace({ selectedOverlayId }) {
  // Overlays map state
  const [overlaysState, setOverlaysState] = useState(() => ({
    'overlay-main': {
      id: 'overlay-main',
      name: 'Overlay Principal',
      visualizerSize: { width: 800, height: 480 },
      instances: [],
      background: { ...defaultBackground }
    }
  }));

  // Current active overlay key is always 'overlay-main' to preserve the same workspace editor canvas
  const activeOverlayKey = 'overlay-main';

  const activeOverlay = overlaysState[activeOverlayKey] || {
    name: 'Overlay Principal',
    visualizerSize: { width: 800, height: 480 },
    instances: [],
    background: { ...defaultBackground }
  };

  const selectedWidgetId = selectedOverlayId && selectedOverlayId !== 'overlay-main' && selectedOverlayId.startsWith('overlay-')
    ? selectedOverlayId.replace('overlay-', '')
    : null;

  const [selectedInstanceId, setSelectedInstanceId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  // Grid / Guides Settings
  const [gridSettings, setGridSettings] = useState(() => {
    try {
      const uid = authClient.getUserDataCache()?.id || 'anonymous';
      const raw = safeStorage.getItem(`livenexus:scenario_grid_settings:${uid}`);
      const saved = raw ? JSON.parse(raw) : null;
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
        const uid = authClient.getUserDataCache()?.id || 'anonymous';
        safeStorage.setItem(`livenexus:scenario_grid_settings:${uid}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
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
    
    setOverlaysState(prev => ({
      ...prev,
      [activeOverlayKey]: {
        ...prev[activeOverlayKey],
        instances: previous.instances,
        visualizerSize: previous.visualizerSize,
        background: previous.background || { ...defaultBackground }
      }
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
    
    setOverlaysState(prev => ({
      ...prev,
      [activeOverlayKey]: {
        ...prev[activeOverlayKey],
        instances: nextState.instances,
        visualizerSize: nextState.visualizerSize,
        background: nextState.background || { ...defaultBackground }
      }
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
            const nextX = Math.max(0, Math.min(selectedInst.x + dx, activeOverlay.visualizerSize.width - 20));
            const nextY = Math.max(0, Math.min(selectedInst.y + dy, activeOverlay.visualizerSize.height - 20));
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

    const isChat = widgetId?.startsWith('chat');
    const isGoal = widgetId?.startsWith('goals');

    const defaultW = width || (isFullWidget ? (isChat ? 340 : isGoal ? 320 : 280) : (elementKey === 'feed' ? 320 : 220));
    const defaultH = height || (isFullWidget ? (isChat ? 300 : isGoal ? 120 : 180) : (elementKey === 'feed' ? 240 : 50));

    const newInst = {
      id: `inst-${Date.now()}`,
      widgetId: widgetId,
      elementKey: isFullWidget ? 'full_widget' : elementKey,
      isFullWidget: Boolean(isFullWidget),
      name: name || 'Elemento',
      x: 60 + (activeOverlay.instances.length * 20),
      y: 60 + (activeOverlay.instances.length * 20),
      width: defaultW,
      height: defaultH,
      zIndex: activeOverlay.instances.length + 1,
      visible: true,
      locked: false,
      config: { ...(defaultConfig || {}) },
    };

    setOverlaysState(prev => ({
      ...prev,
      [activeOverlayKey]: {
        ...prev[activeOverlayKey],
        instances: [...(prev[activeOverlayKey]?.instances || []), newInst]
      }
    }));
    setSelectedInstanceId(newInst.id);
  };

  // Update instance patch
  const handleUpdateInstance = (id, patch) => {
    recordHistory(activeOverlay);

    setOverlaysState(prev => ({
      ...prev,
      [activeOverlayKey]: {
        ...prev[activeOverlayKey],
        instances: prev[activeOverlayKey].instances.map(inst => inst.id === id ? { ...inst, ...patch } : inst)
      }
    }));
  };

  // Delete instance
  const handleDeleteInstance = (id) => {
    saveHistoryState(activeOverlay);

    setOverlaysState(prev => ({
      ...prev,
      [activeOverlayKey]: {
        ...prev[activeOverlayKey],
        instances: prev[activeOverlayKey].instances.filter(inst => inst.id !== id)
      }
    }));
    if (selectedInstanceId === id) setSelectedInstanceId(null);
  };

  // Resize visualizer box with responsive element recalculation
  const handleUpdateVisualizerSize = (newSize) => {
    saveHistoryState(activeOverlay);

    const oldSize = activeOverlay.visualizerSize || { width: 800, height: 480 };
    const scaleX = newSize.width / oldSize.width;
    const scaleY = newSize.height / oldSize.height;

    setOverlaysState(prev => {
      const currentOverlay = prev[activeOverlayKey] || { instances: [] };
      const updatedInstances = (currentOverlay.instances || []).map(inst => {
        const respMode = inst.config?.responsiveMode || 'relative';
        const anchor = inst.config?.responsiveAnchor || 'top-left';

        let newX = inst.x;
        let newY = inst.y;
        let newW = inst.width || 220;
        let newH = inst.height || 50;

        if (respMode === 'relative') {
          // Scale positions and sizes proportionally
          newX = Math.round(inst.x * scaleX);
          newY = Math.round(inst.y * scaleY);
          newW = Math.round((inst.width || 220) * scaleX);
          newH = Math.round((inst.height || 50) * scaleY);
        } else if (respMode === 'anchor') {
          // Preserve absolute margins from the respective corner
          const marginRight = oldSize.width - (inst.x + (inst.width || 220));
          const marginBottom = oldSize.height - (inst.y + (inst.height || 50));

          if (anchor === 'top-left') {
            // Distance from top-left stays constant, nothing to do
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
            const relativeCenterX = centerX_old / oldSize.width;
            const relativeCenterY = centerY_old / oldSize.height;
            newX = Math.round(relativeCenterX * newSize.width - (inst.width || 220) / 2);
            newY = Math.round(relativeCenterY * newSize.height - (inst.height || 50) / 2);
          }
        } else if (respMode === 'aspect-ratio') {
          // Scale width, then resolve height using original aspect ratio
          const ratio = (inst.width || 220) / (inst.height || 50);
          newW = Math.round((inst.width || 220) * scaleX);
          newH = Math.round(newW / ratio);
          newX = Math.round(inst.x * scaleX);
          newY = Math.round(inst.y * scaleY);
        }

        // Keep bounds within canvas context to prevent off-screen loss
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

      return {
        ...prev,
        [activeOverlayKey]: {
          ...currentOverlay,
          visualizerSize: newSize,
          instances: updatedInstances
        }
      };
    });
  };

  // Update Background Settings
  const handleUpdateBackground = (patch) => {
    saveHistoryState(activeOverlay);

    setOverlaysState(prev => ({
      ...prev,
      [activeOverlayKey]: {
        ...prev[activeOverlayKey],
        background: {
          ...(prev[activeOverlayKey]?.background || defaultBackground),
          ...patch
        }
      }
    }));
  };

  // Save template structure (no runtime data)
  const handleSaveTemplate = () => {
    const templatePayload = {
      overlayKey: activeOverlayKey,
      overlayName: activeOverlay.name,
      visualizerDimensions: activeOverlay.visualizerSize,
      background: activeOverlay.background || defaultBackground,
      instances: activeOverlay.instances.map(inst => ({
        id: inst.id,
        widgetId: inst.widgetId,
        name: inst.name,
        x: inst.x,
        y: inst.y,
        width: inst.width,
        height: inst.height,
        zIndex: inst.zIndex,
        visible: inst.visible,
        locked: inst.locked,
        config: inst.config,
      })),
    };
    console.log('Saved Structural Overlay Template:', templatePayload);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-[#080a10] text-white relative overflow-hidden">
      {/* Toast Save Notification */}
      {savedNotice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/90 text-white text-xs font-mono shadow-2xl animate-fade-in backdrop-blur-md">
          <Check className="h-4 w-4" /> Template estrutural da Overlay salvo com sucesso!
        </div>
      )}

      {/* Main Workspace (Visualizer Box + Floating Editor Sidebar) */}
      <div className="flex-1 relative flex overflow-hidden">
        <OverlayVisualizer
          instances={activeOverlay.instances}
          selectedInstanceId={selectedInstanceId}
          onSelectInstance={setSelectedInstanceId}
          onUpdateInstance={handleUpdateInstance}
          onDeleteInstance={handleDeleteInstance}
          visualizerSize={activeOverlay.visualizerSize}
          onUpdateVisualizerSize={handleUpdateVisualizerSize}
          gridSettings={gridSettings}
          onUpdateGridSettings={handleUpdateGridSettings}
          background={activeOverlay.background || defaultBackground}
        />

        <OverlayEditorSidebar
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedWidgetId={selectedWidgetId}
          instances={activeOverlay.instances}
          selectedInstanceId={selectedInstanceId}
          onSelectInstance={setSelectedInstanceId}
          onAddInstance={handleAddInstance}
          onUpdateInstance={handleUpdateInstance}
          onDeleteInstance={handleDeleteInstance}
          onSaveTemplate={handleSaveTemplate}
          overlayName={activeOverlay.name}
          visualizerSize={activeOverlay.visualizerSize}
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
