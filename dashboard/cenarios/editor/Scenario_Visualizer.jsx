import React, { useState, useRef, useEffect } from 'react';
import WidgetElementRenderer from './Scenario_WidgetElementRenderer';
import { Trash2 } from 'lucide-react';
import { useTempoVisivel } from '@dashboard/componentes/useTempoVisivel';

function ScenarioInstanceItem({
  inst,
  isSelected,
  isDraggingInstance,
  editingInstanceId,
  setEditingInstanceId,
  onSelectInstance,
  onUpdateInstance,
  onDeleteInstance,
  handleMouseDownInstanceDrag,
  handleMouseDownInstanceResize,
}) {
  const { opacity, isHiddenPeriod, statusBadge } = useTempoVisivel({
    config: inst.config,
    instanceId: inst.id,
    isSelected,
    isEditor: true,
  });

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelectInstance(inst.id);
      }}
      onMouseDown={(e) => handleMouseDownInstanceDrag(e, inst)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        // Check if element supports text editing
        if (inst.widgetId && (inst.widgetId.startsWith('library-text') || inst.widgetId.startsWith('library-social'))) {
          setEditingInstanceId(inst.id);
        }
      }}
      style={{
        position: 'absolute',
        left: inst.x,
        top: inst.y,
        width: inst.width || 280,
        height: inst.height || 'auto',
        zIndex: inst.zIndex || 1,
        transform: `
          ${inst.config?.rotation ? `rotate(${inst.config.rotation}deg)` : ''} 
          ${inst.config?.flipH ? 'scaleX(-1)' : ''} 
          ${inst.config?.flipV ? 'scaleY(-1)' : ''}
        `.trim() || undefined,
        opacity,
        transition: 'opacity 0.35s ease-in-out',
        pointerEvents: (!isSelected && (inst.config?.effBgActiveType === 'bg-transparent' || inst.config?.backgroundColor === 'transparent')) ? 'none' : 'auto',
      }}
      className={`group transition-all duration-150 ${
        isSelected
          ? 'is-selected outline outline-2 outline-purple-500 shadow-lg shadow-purple-950/40'
          : 'outline outline-1 outline-transparent hover:outline-purple-500/40'
      } ${
        inst.locked
          ? 'cursor-default'
          : isDraggingInstance && isSelected
          ? 'cursor-grabbing'
          : 'cursor-grab'
      }`}
    >
      {/* Badge informativo de Tempo Visível no Editor quando selecionado */}
      {isSelected && statusBadge && (
        <div className="absolute -top-6 left-0 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md border border-purple-500/40 text-[10px] font-mono text-purple-200 z-50 flex items-center gap-1 shadow-md pointer-events-none whitespace-nowrap">
          <span>⏱️ {statusBadge}</span>
          <span className="text-cyan-400 font-bold">(Exibe apenas no OBS)</span>
        </div>
      )}

      {/* Component Content Box */}
      <div className="w-full h-full overflow-hidden flex items-center justify-start p-0 pointer-events-auto">
        <WidgetElementRenderer
          widgetId={inst.widgetId}
          elementKey={inst.elementKey}
          isFullWidget={inst.isFullWidget}
          config={inst.config}
          isEditing={editingInstanceId === inst.id}
          onUpdateConfig={(newConfig) => onUpdateInstance(inst.id, { config: newConfig })}
          onFinishEditing={() => setEditingInstanceId(null)}
          instanceId={inst.id}
          instanceName={inst.name}
        />
      </div>

      {/* Handles for Instance Resizing */}
      {isSelected && !inst.locked && (
        <>
          <div onMouseDown={(e) => handleMouseDownInstanceResize(e, inst, 'bottom-right')} className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-purple-500 border-2 border-white rounded-full cursor-se-resize z-50 shadow-md" />
          <div onMouseDown={(e) => handleMouseDownInstanceResize(e, inst, 'bottom-left')} className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-purple-500 border-2 border-white rounded-full cursor-sw-resize z-50 shadow-md" />
          <div onMouseDown={(e) => handleMouseDownInstanceResize(e, inst, 'top-right')} className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-purple-500 border-2 border-white rounded-full cursor-ne-resize z-50 shadow-md" />
          <div onMouseDown={(e) => handleMouseDownInstanceResize(e, inst, 'top-left')} className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-purple-500 border-2 border-white rounded-full cursor-nw-resize z-50 shadow-md" />
        </>
      )}

      {/* Delete Button */}
      {isSelected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteInstance(inst.id);
          }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent initiating drag
          className="absolute -top-3.5 -right-3.5 w-6 h-6 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer z-[60] transition-transform hover:scale-110 active:scale-95 border border-white/20 select-none pointer-events-auto"
          title="Excluir Elemento"
        >
          <Trash2 className="w-3.5 h-3.5 text-white" />
        </button>
      )}
    </div>
  );
}

export default function OverlayVisualizer({
  instances = [],
  selectedInstanceId,
  onSelectInstance,
  onUpdateInstance,
  onDeleteInstance = () => {},
  visualizerSize = { width: 1920, height: 1080 },
  gridSettings = {},
  onUpdateGridSettings = () => {},
  background = {},
}) {
  const [editingInstanceId, setEditingInstanceId] = useState(null);
  const [isDraggingInstance, setIsDraggingInstance] = useState(false);
  const [isResizingInstance, setIsResizingInstance] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);

  const [draggingGuideId, setDraggingGuideId] = useState(null);
  const [draggingGuideType, setDraggingGuideType] = useState(null); // 'vertical' | 'horizontal'
  const [initialGuideVal, setInitialGuideVal] = useState(0);

  const [mouseStart, setMouseStart] = useState({ x: 0, y: 0 });
  const [initialBox, setInitialBox] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 338 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const logicalW = visualizerSize?.width || 1920;
  const logicalH = visualizerSize?.height || 1080;

  // Target visual size 1280x720 px (16:9), or constrained by container
  const maxAllowedW = Math.min(1280, Math.max(280, (containerSize.width || 1280) - 32));
  const maxAllowedH = Math.min(720, Math.max(157.5, (containerSize.height || 720) - 32));

  const scaleX = maxAllowedW / logicalW;
  const scaleY = maxAllowedH / logicalH;
  const scale = Math.min(scaleX, scaleY) || (1280 / 1920);

  const snapActiveXRef = useRef(false);
  const snapActiveYRef = useRef(false);
  const snapStartDxRef = useRef(0);
  const snapStartDyRef = useRef(0);
  const snapOffsetRef = useRef(0);
  const snapOffsetYRef = useRef(0);
  const snappedGuideIdXRef = useRef(null);
  const snappedGuideIdYRef = useRef(null);

  // Click empty area to deselect
  const handleBackgroundClick = (e) => {
    if (e.target.id === 'workspace-backdrop' || e.target.id === 'visualizer-box-bg') {
      onSelectInstance(null);
      setEditingInstanceId(null);
    }
  };

  // Mouse down directly on Instance element body to drag & select
  const handleMouseDownInstanceDrag = (e, inst) => {
    if (inst.locked) return;
    if (e.button !== 0) return; // Only left mouse button

    // Do not initiate drag if user is clicking inside an input, textarea, button or is actively editing text
    const targetTag = e.target.tagName;
    if (
      targetTag === 'INPUT' ||
      targetTag === 'TEXTAREA' ||
      targetTag === 'BUTTON' ||
      targetTag === 'A' ||
      targetTag === 'IFRAME' ||
      targetTag === 'VIDEO' ||
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('a') ||
      e.target.closest('iframe') ||
      e.target.closest('video') ||
      e.target.closest('[data-no-drag]') ||
      e.target.isContentEditable ||
      editingInstanceId === inst.id
    ) {
      return;
    }

    e.stopPropagation();
    onSelectInstance(inst.id);
    setIsDraggingInstance(true);
    setMouseStart({ x: e.clientX, y: e.clientY });
    setInitialBox({ x: inst.x, y: inst.y, w: inst.width || 280, h: inst.height || 180 });
  };

  // Mouse down on Instance resize handle
  const handleMouseDownInstanceResize = (e, inst, handle) => {
    if (inst.locked) return;
    e.stopPropagation();
    onSelectInstance(inst.id);
    setIsResizingInstance(true);
    setResizeHandle(handle);
    setMouseStart({ x: e.clientX, y: e.clientY });
    setInitialBox({ x: inst.x, y: inst.y, w: inst.width || 280, h: inst.height || 180 });
  };

  // Mouse down on Visualizer Box resize handle
  const handleMouseDownVisResize = (e, handle) => {
    e.stopPropagation();
    setIsResizingVisualizer(true);
    setVisResizeHandle(handle);
    setMouseStart({ x: e.clientX, y: e.clientY });
    setInitialVisSize({ w: visualizerSize.width, h: visualizerSize.height });
  };

  // Global mousemove / mouseup for dragging & resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      const rawDx = e.clientX - mouseStart.x;
      const rawDy = e.clientY - mouseStart.y;
      const dx = rawDx / (scale || 1);
      const dy = rawDy / (scale || 1);

      if (isDraggingInstance && selectedInstanceId) {
        let idealX = initialBox.x + dx;
        let idealY = initialBox.y + dy;

        let newX = idealX;
        let newY = idealY;

        const currentInst = instances.find(inst => inst.id === selectedInstanceId);
        const instW = currentInst?.width || 220;
        const instH = currentInst?.height || 50;

        if (gridSettings?.snapToGrid) {
          // 1. VERTICAL GUIDES SNAP (X AXIS) WITH HYSTERESIS
          if (gridSettings.verticalGuides && gridSettings.verticalGuides.length > 0) {
            if (snapActiveXRef.current) {
              const vg = gridSettings.verticalGuides.find(g => g.id === snappedGuideIdXRef.current);
              if (vg) {
                const mouseDeltaX = dx - snapStartDxRef.current;
                // Stick to the guide unless mouse is deliberately pulled more than 16px away
                if (Math.abs(mouseDeltaX) < 16) {
                  newX = vg.x - snapOffsetRef.current;
                } else {
                  // Pull away / break snap
                  snapActiveXRef.current = false;
                  snappedGuideIdXRef.current = null;
                  newX = idealX;
                }
              } else {
                snapActiveXRef.current = false;
                snappedGuideIdXRef.current = null;
              }
            }

            // Check for initial snap if not currently snapped or just broke snap
            if (!snapActiveXRef.current) {
              for (const vg of gridSettings.verticalGuides) {
                // Snap left edge (8px threshold)
                if (Math.abs(idealX - vg.x) < 8) {
                  snapActiveXRef.current = true;
                  snappedGuideIdXRef.current = vg.id;
                  snapStartDxRef.current = dx;
                  snapOffsetRef.current = 0;
                  newX = vg.x;
                  break;
                }
                // Snap right edge (8px threshold)
                if (Math.abs((idealX + instW) - vg.x) < 8) {
                  snapActiveXRef.current = true;
                  snappedGuideIdXRef.current = vg.id;
                  snapStartDxRef.current = dx;
                  snapOffsetRef.current = instW;
                  newX = vg.x - instW;
                  break;
                }
                // Snap center (8px threshold)
                if (Math.abs((idealX + instW / 2) - vg.x) < 8) {
                  snapActiveXRef.current = true;
                  snappedGuideIdXRef.current = vg.id;
                  snapStartDxRef.current = dx;
                  snapOffsetRef.current = Math.round(instW / 2);
                  newX = Math.round(vg.x - instW / 2);
                  break;
                }
              }
            }
          }

          // 2. HORIZONTAL GUIDES SNAP (Y AXIS) WITH HYSTERESIS
          if (gridSettings.horizontalGuides && gridSettings.horizontalGuides.length > 0) {
            if (snapActiveYRef.current) {
              const hg = gridSettings.horizontalGuides.find(g => g.id === snappedGuideIdYRef.current);
              if (hg) {
                const mouseDeltaY = dy - snapStartDyRef.current;
                // Stick to the guide unless mouse is deliberately pulled more than 16px away
                if (Math.abs(mouseDeltaY) < 16) {
                  newY = hg.y - snapOffsetYRef.current;
                } else {
                  // Pull away / break snap
                  snapActiveYRef.current = false;
                  snappedGuideIdYRef.current = null;
                  newY = idealY;
                }
              } else {
                snapActiveYRef.current = false;
                snappedGuideIdYRef.current = null;
              }
            }

            // Check for initial snap if not currently snapped or just broke snap
            if (!snapActiveYRef.current) {
              for (const hg of gridSettings.horizontalGuides) {
                // Snap top edge (8px threshold)
                if (Math.abs(idealY - hg.y) < 8) {
                  snapActiveYRef.current = true;
                  snappedGuideIdYRef.current = hg.id;
                  snapStartDyRef.current = dy;
                  snapOffsetYRef.current = 0;
                  newY = hg.y;
                  break;
                }
                // Snap bottom edge (8px threshold)
                if (Math.abs((idealY + instH) - hg.y) < 8) {
                  snapActiveYRef.current = true;
                  snappedGuideIdYRef.current = hg.id;
                  snapStartDyRef.current = dy;
                  snapOffsetYRef.current = instH;
                  newY = hg.y - instH;
                  break;
                }
                // Snap center (8px threshold)
                if (Math.abs((idealY + instH / 2) - hg.y) < 8) {
                  snapActiveYRef.current = true;
                  snappedGuideIdYRef.current = hg.id;
                  snapStartDyRef.current = dy;
                  snapOffsetYRef.current = Math.round(instH / 2);
                  newY = Math.round(hg.y - instH / 2);
                  break;
                }
              }
            }
          }

          // Apply grid size snap as fallback if no guidelines are currently snapping
          if (!snapActiveXRef.current && gridSettings.gridSize) {
            const gs = gridSettings.gridSize;
            newX = Math.round(idealX / gs) * gs;
          }
          if (!snapActiveYRef.current && gridSettings.gridSize) {
            const gs = gridSettings.gridSize;
            newY = Math.round(idealY / gs) * gs;
          }
        }

        onUpdateInstance(selectedInstanceId, {
          x: newX,
          y: newY,
        });
      } else if (isResizingInstance && selectedInstanceId && resizeHandle) {
        let w = initialBox.w;
        let h = initialBox.h;
        let x = initialBox.x;
        let y = initialBox.y;

        if (resizeHandle.includes('right')) w = Math.max(80, initialBox.w + dx);
        if (resizeHandle.includes('bottom')) h = Math.max(60, initialBox.h + dy);
        if (resizeHandle.includes('left')) {
          const newW = initialBox.w - dx;
          if (newW > 80) {
            w = newW;
            x = initialBox.x + dx;
          }
        }
        if (resizeHandle.includes('top')) {
          const newH = initialBox.h - dy;
          if (newH > 60) {
            h = newH;
            y = initialBox.y + dy;
          }
        }

        if (gridSettings?.snapToGrid) {
          // Snap boundaries to custom guides (width/height resize thresholds)
          if (gridSettings.verticalGuides && gridSettings.verticalGuides.length > 0) {
            for (const vg of gridSettings.verticalGuides) {
              if (resizeHandle.includes('right') && Math.abs((x + w) - vg.x) < 8) {
                w = Math.max(80, vg.x - x);
              }
              if (resizeHandle.includes('left') && Math.abs(x - vg.x) < 8) {
                const diff = x - vg.x;
                x = vg.x;
                w = Math.max(80, w + diff);
              }
            }
          }
          if (gridSettings.horizontalGuides && gridSettings.horizontalGuides.length > 0) {
            for (const hg of gridSettings.horizontalGuides) {
              if (resizeHandle.includes('bottom') && Math.abs((y + h) - hg.y) < 8) {
                h = Math.max(60, hg.y - y);
              }
              if (resizeHandle.includes('top') && Math.abs(y - hg.y) < 8) {
                const diff = y - hg.y;
                y = hg.y;
                h = Math.max(60, h + diff);
              }
            }
          }

          // Grid size fallback snapping
          if (gridSettings.gridSize) {
            const gs = gridSettings.gridSize;
            if (resizeHandle.includes('right') && w === Math.max(80, initialBox.w + dx)) {
              w = Math.round(w / gs) * gs;
            }
            if (resizeHandle.includes('bottom') && h === Math.max(60, initialBox.h + dy)) {
              h = Math.round(h / gs) * gs;
            }
            if (resizeHandle.includes('left') && x === initialBox.x + dx) {
              const prevRight = x + w;
              x = Math.round(x / gs) * gs;
              w = Math.max(80, prevRight - x);
            }
            if (resizeHandle.includes('top') && y === initialBox.y + dy) {
              const prevBottom = y + h;
              y = Math.round(y / gs) * gs;
              h = Math.max(60, prevBottom - y);
            }
          }
        }

        onUpdateInstance(selectedInstanceId, { x, y, width: w, height: h });
      } else if (draggingGuideId && draggingGuideType && onUpdateGridSettings) {
        if (draggingGuideType === 'vertical') {
          let nextX = Math.round(initialGuideVal + dx);
          nextX = Math.max(0, Math.min(nextX, visualizerSize.width));

          if (gridSettings?.snapToGrid && gridSettings?.gridSize) {
            const gs = gridSettings.gridSize;
            nextX = Math.round(nextX / gs) * gs;
          }

          const updated = (gridSettings.verticalGuides || []).map(g =>
            g.id === draggingGuideId ? { ...g, x: nextX } : g
          );
          onUpdateGridSettings({ verticalGuides: updated });
        } else if (draggingGuideType === 'horizontal') {
          let nextY = Math.round(initialGuideVal + dy);
          nextY = Math.max(0, Math.min(nextY, visualizerSize.height));

          if (gridSettings?.snapToGrid && gridSettings?.gridSize) {
            const gs = gridSettings.gridSize;
            nextY = Math.round(nextY / gs) * gs;
          }

          const updated = (gridSettings.horizontalGuides || []).map(g =>
            g.id === draggingGuideId ? { ...g, y: nextY } : g
          );
          onUpdateGridSettings({ horizontalGuides: updated });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingInstance(false);
      setIsResizingInstance(false);
      setResizeHandle(null);
      setDraggingGuideId(null);
      setDraggingGuideType(null);

      // Clear magnetic snap refs
      snapActiveXRef.current = false;
      snapActiveYRef.current = false;
      snappedGuideIdXRef.current = null;
      snappedGuideIdYRef.current = null;
    };

    if (isDraggingInstance || isResizingInstance || draggingGuideId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDraggingInstance, isResizingInstance, resizeHandle, selectedInstanceId,
    mouseStart, initialBox,
    onUpdateInstance, gridSettings,
    draggingGuideId, draggingGuideType, initialGuideVal, onUpdateGridSettings, visualizerSize, scale
  ]);

  // Construction of visualizer canvas background style
  const getBackgroundStyle = () => {
    const bg = background || { type: 'transparent' };
    const style = {};

    if (bg.type === 'transparent') {
      // Transparency checkerboard pattern
      style.backgroundImage = `
        linear-gradient(45deg, rgba(255, 255, 255, 0.03) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(255, 255, 255, 0.03) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.03) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.03) 75%)
      `;
      style.backgroundSize = '20px 20px';
      style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
      style.backgroundColor = '#030712'; // dark slate base
    } else if (bg.type === 'solid') {
      style.backgroundColor = bg.color || '#020617';
    } else if (bg.type === 'gradient') {
      style.backgroundImage = bg.gradient || 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)';
    } else if (bg.type === 'image') {
      if (bg.image) {
        style.backgroundImage = `url(${bg.image})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundRepeat = 'no-repeat';
      } else {
        style.backgroundColor = '#020617';
      }
    }

    // Add visual adjustments using CSS filters
    const filters = [];
    if (bg.blur > 0) filters.push(`blur(${bg.blur}px)`);
    if (bg.brightness !== undefined && bg.brightness !== 100) filters.push(`brightness(${bg.brightness}%)`);
    if (bg.contrast !== undefined && bg.contrast !== 100) filters.push(`contrast(${bg.contrast}%)`);
    if (bg.saturate !== undefined && bg.saturate !== 100) filters.push(`saturate(${bg.saturate}%)`);

    if (filters.length > 0) {
      style.filter = filters.join(' ');
    }

    return style;
  };

  const backgroundStyle = getBackgroundStyle();

  return (
    <div
      id="workspace-backdrop"
      ref={containerRef}
      onClick={handleBackgroundClick}
      className="flex-1 h-full bg-[#080a10] relative overflow-hidden p-4 flex items-center justify-center select-none"
    >
      {/* Scaled Canvas Container (Target ~600x338px visual size, logical 1920x1080) */}
      <div
        style={{
          width: logicalW * scale,
          height: logicalH * scale,
          position: 'relative',
        }}
        className="flex items-center justify-center shrink-0 shadow-2xl rounded-lg"
      >
        {/* Delimited Visualizer Box */}
        <div
          id="visualizer-box-bg"
          style={{
            width: logicalW,
            height: logicalH,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            borderRadius: background.showBorder ? (background.borderRadius || '0px') : '0px',
          }}
          className={`absolute border-white/20 shadow-2xl overflow-hidden shrink-0 ${background.showBorder ? 'border' : 'border-0'}`}
        >
        {/* Composition Background with visual adjustments and isolated scale-105 for blur bleed */}
        <div
          style={{
            ...backgroundStyle,
            opacity: (background?.opacity !== undefined ? background.opacity : 100) / 100,
          }}
          className="absolute inset-0 pointer-events-none z-0 scale-[1.05] transition-all duration-300"
        />

        {/* Render Grid Overlay */}
        {gridSettings?.showGrid && (
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(139, 92, 246, 0.12) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(139, 92, 246, 0.12) 1px, transparent 1px)
              `,
              backgroundSize: `${gridSettings.gridSize || 20}px ${gridSettings.gridSize || 20}px`,
            }}
          />
        )}

        {/* Render Safe Areas */}
        {gridSettings?.showSafeAreas && (
          <div className="absolute inset-[10%] border border-dashed border-cyan-500/30 rounded pointer-events-none z-10 flex items-center justify-center">
            <span className="text-[8px] font-mono text-cyan-400/30 select-none uppercase tracking-widest absolute top-2">Área Segura (90%)</span>
          </div>
        )}

        {/* Render Custom Vertical Guides (with 9px interactive drag hitbox) */}
        {gridSettings?.verticalGuides?.map(guide => (
          <div
            key={guide.id}
            style={{
              position: 'absolute',
              left: `${guide.x - 4}px`,
              top: 0,
              bottom: 0,
              width: '9px',
              zIndex: 35,
              cursor: 'col-resize',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setDraggingGuideId(guide.id);
              setDraggingGuideType('vertical');
              setMouseStart({ x: e.clientX, y: e.clientY });
              setInitialGuideVal(guide.x);
            }}
            className="group flex items-center justify-center select-none"
            title={`Guia Vertical: ${guide.x}px (Clique e arraste para mover)`}
          >
            {/* Visual Guideline */}
            <div className="w-[1px] h-full border-l border-dashed border-cyan-400/80 group-hover:border-purple-400 group-hover:border-solid transition-colors" />
          </div>
        ))}

        {/* Render Custom Horizontal Guides (with 9px interactive drag hitbox) */}
        {gridSettings?.horizontalGuides?.map(guide => (
          <div
            key={guide.id}
            style={{
              position: 'absolute',
              top: `${guide.y - 4}px`,
              left: 0,
              right: 0,
              height: '9px',
              zIndex: 35,
              cursor: 'row-resize',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setDraggingGuideId(guide.id);
              setDraggingGuideType('horizontal');
              setMouseStart({ x: e.clientX, y: e.clientY });
              setInitialGuideVal(guide.y);
            }}
            className="group flex flex-col items-center justify-center select-none"
            title={`Guia Horizontal: ${guide.y}px (Clique e arraste para mover)`}
          >
            {/* Visual Guideline */}
            <div className="h-[1px] w-full border-t border-dashed border-cyan-400/80 group-hover:border-purple-400 group-hover:border-solid transition-colors" />
          </div>
        ))}

        {/* Render Instances inside Visualizer */}
        {instances
          .filter(inst => inst.visible !== false)
          .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
          .map(inst => (
            <ScenarioInstanceItem
              key={inst.id}
              inst={inst}
              isSelected={inst.id === selectedInstanceId}
              isDraggingInstance={isDraggingInstance}
              editingInstanceId={editingInstanceId}
              setEditingInstanceId={setEditingInstanceId}
              onSelectInstance={onSelectInstance}
              onUpdateInstance={onUpdateInstance}
              onDeleteInstance={onDeleteInstance}
              handleMouseDownInstanceDrag={handleMouseDownInstanceDrag}
              handleMouseDownInstanceResize={handleMouseDownInstanceResize}
            />
          ))}
      </div>
    </div>
    </div>
  );
}
