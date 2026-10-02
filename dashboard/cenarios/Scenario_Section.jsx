import { useState, useRef, useEffect } from 'react';
import { Trash2, Copy, Check, ArrowLeft, Sparkles } from 'lucide-react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import ScenarioCanvas from './Scenario_Canvas';
import WidgetElementRenderer from './editor/Scenario_WidgetElementRenderer';
import PrebuiltScenariosModal from './Scenario_PrebuiltScenariosModal';

export default function CenariosSection() {
  const [cenarios, setCenarios] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [isPrebuiltModalOpen, setIsPrebuiltModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const inputRef = useRef(null);

  const { userId, runtimeId, scenarioBranch } = useNewUserDataCentral();
  const activeRuntime = runtimeId || '';

  // Origem real do ambiente (ex: http://localhost:3000 em dev ou https://...run.app em prod)
  const getOrigin = () => (typeof window !== 'undefined' ? window.location.origin : '');

  // URLs completas conforme o formato oficial
  const getLocalUrl = (c) => {
    if (!c?.id) return '';
    const origin = getOrigin();
    return `${origin}/cenario/${c.id}`;
  };

  const getBroadcastUrl = (c) => {
    if (!c?.id) return '';
    const origin = getOrigin();
    const query = activeRuntime ? `?runtimeId=${encodeURIComponent(activeRuntime)}` : '';
    return `${origin}/cenario/receiver/${c.id}${query}`;
  };

  const getCenarioActiveUrl = (c) => (c?.mode === 'BROADCAST' ? getBroadcastUrl(c) : getLocalUrl(c));

  const handleViewCenario = (c) => {
    const url = getCenarioActiveUrl(c);
    if (!url) return;
    window.open(url, '_blank');
  };

  const copyLink = (c) => {
    const url = typeof c === 'string' ? c : getCenarioActiveUrl(c);
    if (!url) return;
    navigator.clipboard.writeText(url);
    if (c?.id) {
      setCopiedId(c.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  useEffect(() => {
    if (!userId) return;
    scenarioBranch('GET')
      .then(setCenarios)
      .catch(err => console.error('Erro ao carregar cenários:', err));
  }, [userId, scenarioBranch]);

  // Sincroniza estado de cenários quando modificado por atalhos globais em qualquer página
  useEffect(() => {
    const handleCenariosUpdated = (e) => {
      if (Array.isArray(e.detail)) {
        setCenarios(e.detail);
      }
    };
    window.addEventListener('livenexus:cenarios-updated', handleCenariosUpdated);
    return () => window.removeEventListener('livenexus:cenarios-updated', handleCenariosUpdated);
  }, []);

  const saveCenariosList = (updatedCenarios) => {
    setCenarios(updatedCenarios);
    scenarioBranch('POST', { payload: { cenarios: updatedCenarios } })
      .catch(err => console.error('Erro ao salvar lista de cenários:', err));
    window.dispatchEvent(new CustomEvent('livenexus:cenarios-updated', { detail: updatedCenarios }));
  };

  const handleCreateCenario = () => {
    const newId = Date.now().toString();
    const newCenario = {
      id: newId,
      name: 'Novo Cenário',
      mode: 'LOCAL',
      localUrl: getLocalUrl({ id: newId }),
      broadcastUrl: getBroadcastUrl({ id: newId }),
      instances: [],
      background: {
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
      },
      visualizerSize: { width: 1920, height: 1080 },
      gridSettings: {
        showGrid: false,
        gridSize: 20,
        snapToGrid: false,
        showSafeAreas: false,
        verticalGuides: [],
        horizontalGuides: []
      }
    };
    saveCenariosList([...cenarios, newCenario]);
  };

  const handleSelectPrebuiltPack = (newScenario) => {
    saveCenariosList([...cenarios, newScenario]);
  };

  const handleDelete = (id) => {
    const updated = cenarios.filter(c => c.id !== id);
    saveCenariosList(updated);
  };

  const startEdit = (cenario) => {
    setEditingId(cenario.id);
    setEditName(cenario.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveEdit = (id) => {
    const updated = cenarios.map(c => c.id === id ? {...c, name: editName} : c);
    saveCenariosList(updated);
    setEditingId(null);
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') saveEdit(id);
    if (e.key === 'Escape') setEditingId(null);
  };

  const setMode = (id, mode) => {
    const updated = cenarios.map(c => c.id === id ? {...c, mode} : c);
    saveCenariosList(updated);
  };

  const getPreviewBgStyle = (bg) => {
    if (!bg) return { backgroundColor: '#0f172a' };
    const style = {};
    if (bg.type === 'transparent') {
      style.backgroundImage = `
        linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%)
      `;
      style.backgroundSize = '10px 10px';
      style.backgroundPosition = '0 0, 0 5px, 5px -5px, -5px 0px';
      style.backgroundColor = '#0b0f19';
    } else if (bg.type === 'solid') {
      style.backgroundColor = bg.color || '#020617';
    } else if (bg.type === 'gradient') {
      style.backgroundImage = bg.gradient || 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)';
    } else if (bg.type === 'image' && bg.image) {
      style.backgroundImage = `url(${bg.image})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    } else {
      style.backgroundColor = '#020617';
    }
    return style;
  };

  const handleCloseEditor = () => {
    setActiveScenarioId(null);
    if (userId) {
      scenarioBranch('GET')
        .then(setCenarios)
        .catch(err => console.error('Erro ao recarregar cenários:', err));
    }
  };

  if (activeScenarioId) {
    const activeCenario = cenarios.find(c => c.id === activeScenarioId);
    return <ScenarioCanvas cenario={activeCenario} userId={userId} onBack={handleCloseEditor} />;
  }

  return (
    <div className="p-6 animate-editor-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Cenários</h2>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setIsPrebuiltModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-violet-300 border border-violet-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95 cursor-pointer relative z-10"
            title="Abrir catálogo de cenários pré-montados"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            Cenários Pré-Montados
          </button>
          <button 
            type="button"
            onClick={handleCreateCenario}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Criar Cenário
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cenarios.map(cenario => (
          <div key={cenario.id} className="border border-white/10 p-4 rounded-xl bg-slate-900">
            <div 
              className="w-full h-32 relative overflow-hidden rounded-lg mb-2 border border-white/10 select-none flex items-center justify-center bg-slate-950"
              style={getPreviewBgStyle(cenario.background)}
            >
              {cenario.instances && cenario.instances.length > 0 ? (
                cenario.instances.map(inst => {
                  const leftPct = `${(inst.x / 1920) * 100}%`;
                  const topPct = `${(inst.y / 1080) * 100}%`;
                  const widthPct = `${((inst.width || 220) / 1920) * 100}%`;
                  const heightPct = `${((inst.height || 50) / 1080) * 100}%`;
                  
                  return (
                    <div
                      key={inst.id}
                      style={{
                        position: 'absolute',
                        left: leftPct,
                        top: topPct,
                        width: widthPct,
                        height: heightPct,
                        transform: inst.config?.rotation ? `rotate(${inst.config.rotation}deg)` : undefined,
                      }}
                      className="bg-purple-500/30 border border-purple-400/50 rounded-sm flex items-center justify-center overflow-hidden"
                    >
                      <span className="text-[6px] font-bold text-white leading-none scale-[0.7] whitespace-nowrap font-sans tracking-tight uppercase select-none px-0.5 opacity-80">
                        {inst.name ? inst.name.split(' ')[0] : 'WIDGET'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <span className="text-slate-600 text-xs font-mono select-none">Cenário Vazio</span>
              )}
            </div>
            {editingId === cenario.id ? (
              <input
                ref={inputRef}
                className="w-full font-bold text-white bg-slate-800 p-1 rounded mb-1 outline-none ring-2 ring-violet-500"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => saveEdit(cenario.id)}
                onKeyDown={(e) => handleKeyDown(e, cenario.id)}
              />
            ) : (
              <h3 className="font-bold text-white mb-1 cursor-pointer" onDoubleClick={() => startEdit(cenario)}>
                {cenario.name}
              </h3>
            )}
            <div className="flex items-center justify-between gap-2 mb-2 text-xs text-slate-400 bg-slate-900/60 p-1.5 rounded border border-white/5">
              <span className="truncate text-violet-300 font-mono select-all" title={getCenarioActiveUrl(cenario)}>
                {getCenarioActiveUrl(cenario)}
              </span>
              <button 
                onClick={() => copyLink(cenario)}
                className="text-slate-400 hover:text-white shrink-0 p-1 bg-slate-800 hover:bg-slate-700 rounded transition"
                title="Copiar Link"
              >
                {copiedId === cenario.id ? (
                  <Check size={13} className="text-emerald-400" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            </div>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setMode(cenario.id, 'LOCAL')} className={`text-xs px-2.5 py-1 rounded font-medium transition ${cenario.mode === 'LOCAL' || !cenario.mode ? 'bg-violet-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>LOCAL</button>
              <button onClick={() => setMode(cenario.id, 'BROADCAST')} className={`text-xs px-2.5 py-1 rounded font-medium transition ${cenario.mode === 'BROADCAST' ? 'bg-violet-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>BROADCAST</button>
            </div>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setActiveScenarioId(cenario.id)} className="flex-1 bg-emerald-600 text-white rounded py-1.5 text-xs font-semibold hover:bg-emerald-700 transition">ABRIR CENÁRIO</button>
              <button onClick={() => handleViewCenario(cenario)} className="flex-1 bg-blue-600 text-white rounded py-1.5 text-xs font-semibold hover:bg-blue-700 transition">VISUALIZAR CENÁRIO</button>
            </div>
            <div className="flex justify-end">
              <button onClick={() => handleDelete(cenario.id)} className="w-full flex items-center justify-center gap-1 bg-rose-900/30 text-rose-200 rounded py-1 hover:bg-rose-900 text-xs transition-all"><Trash2 size={14} /> Excluir Cenário</button>
            </div>
          </div>
        ))}
      </div>

      <PrebuiltScenariosModal
        isOpen={isPrebuiltModalOpen}
        onClose={() => setIsPrebuiltModalOpen(false)}
        onSelectPack={handleSelectPrebuiltPack}
      />
    </div>
  );
}

export function ScenarioRealView({ cenario, onBack }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const logicalW = cenario?.visualizerSize?.width || 1920;
  const logicalH = cenario?.visualizerSize?.height || 1080;

  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      const rect = containerRef.current.getBoundingClientRect();
      const availW = rect.width - 32;
      const availH = rect.height - 32;
      const scaleX = availW / logicalW;
      const scaleY = availH / logicalH;
      setScale(Math.min(scaleX, scaleY) || 1);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', updateScale);
      observer.disconnect();
    };
  }, [logicalW, logicalH]);

  const getBackgroundStyle = () => {
    const bg = cenario?.background || { type: 'transparent' };
    const style = {};

    if (bg.type === 'transparent') {
      style.backgroundImage = `
        linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%)
      `;
      style.backgroundSize = '20px 20px';
      style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
      style.backgroundColor = '#0b0f19';
    } else if (bg.type === 'solid') {
      style.backgroundColor = bg.color || '#020617';
    } else if (bg.type === 'gradient') {
      style.backgroundImage = bg.gradient || 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)';
    } else if (bg.type === 'image' && bg.image) {
      style.backgroundImage = `url(${bg.image})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
      style.backgroundRepeat = 'no-repeat';
    }

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

  const bgStyle = getBackgroundStyle();

  return (
    <div className="flex flex-col h-full bg-[#030712] text-white">
      {/* Top clean bar */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-slate-900">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/40">Visualização Real</span>
          <h2 className="text-base font-bold text-white truncate max-w-[200px] md:max-w-xs">{cenario?.name}</h2>
        </div>
        <button onClick={onBack} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
          Voltar para Lista
        </button>
      </div>

      {/* Workspace Area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        {/* Scaled Canvas */}
        <div
          style={{
            width: logicalW * scale,
            height: logicalH * scale,
            position: 'relative',
          }}
          className="flex items-center justify-center shrink-0 shadow-2xl rounded-lg"
        >
          {/* Real Composition Box */}
          <div
            style={{
              width: logicalW,
              height: logicalH,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
            className="absolute border border-white/10 rounded-lg overflow-hidden shrink-0"
          >
            {/* Background Layer */}
            <div
              style={{
                ...bgStyle,
                opacity: (cenario?.background?.opacity !== undefined ? cenario.background.opacity : 100) / 100,
              }}
              className="absolute inset-0 pointer-events-none z-0 scale-[1.05]"
            />

            {/* Widgets Layer (Clean render - no selection, borders, outline, handles) */}
            {cenario?.instances && cenario.instances
              .filter(inst => inst.visible !== false)
              .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
              .map(inst => (
                <div
                  key={inst.id}
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
                  }}
                  className="pointer-events-none"
                >
                  <div className="w-full h-full overflow-hidden flex items-center justify-start p-0">
                    <WidgetElementRenderer
                      widgetId={inst.widgetId}
                      elementKey={inst.elementKey}
                      isFullWidget={inst.isFullWidget}
                      config={inst.config}
                      isEditing={false}
                      instanceId={inst.id}
                      instanceName={inst.name}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
