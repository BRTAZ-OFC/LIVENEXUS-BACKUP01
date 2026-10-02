import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders, Layers, FolderPlus, Sparkles, LayoutGrid, ChevronLeft, ChevronRight,
  Lock, Unlock, Eye, EyeOff, Trash2, Save, Plus, Search, X,
  User, Users, Type, Square, Circle, Minus, Smile, Heart, Star, Camera, Mic, Volume2, Video, Music, MessageSquare, Bell, Calendar, Clock, MapPin, Link, Share2, Gamepad2, Trophy, ArrowRight, Settings,
  Maximize2, AlignLeft, AlignCenter, AlignRight, Grid, Ruler, Palette, Compass, History, Database, Smartphone, Film,
  Vote, Gift, Scroll, Terminal
} from 'lucide-react';
import { getWidgetInternalElements, isWidgetFragmentable } from './Overlay_widgetElements';
import { TWITCH_WIDGETS_CATALOG } from '@dashboard/widgets/Widget_twitchWidgetsCatalog';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { resolveDataBinding } from './Overlay_WidgetElementRenderer';
import GalleryPicker from '@dashboard/componentes/GalleryPicker';
import PrebuiltOverlayGalleryModal from './Overlay_PrebuiltOverlayGalleryModal';
import TemplateEditorGalleryModal from '@dashboard/Imagem/template/Template_EditorGalleryModal';
import PrebuiltStructuralOverlaysModal from './Overlay_PrebuiltStructuralOverlaysModal';
import { resolveWidgetCategory } from './Overlay_prebuiltStructuralCatalog';
import { getTemplatesForWidget, getTemplateForWidget } from './templates/Overlay_index';
import HorizontalScrollContainer from './Overlay_HorizontalScrollContainer';
import VerticalScrollContainer from './Overlay_VerticalScrollContainer';
import { usesPlatformData } from './Overlay_platformData';
import PlatformControls from './Overlay_PlatformControls';
import ManualWidgetConfig from '@dashboard/widgets/Widget_ManualConfig';
import TempoVisivelConfig from '@dashboard/componentes/TempoVisivelConfig';
import { localCache } from '@dashboard/configuracao/Config_localCache';
import { authClient } from '@dashboard/login/authClient';

const FONT_CATEGORIES = {
  'Gamer / Esports': ['Chakra Petch', 'Russo One', 'Rajdhani'],
  'Futurista / Sci-Fi': ['Orbitron', 'Audiowide', 'Michroma', 'Tomorrow', 'Iceland'],
  'Tech / Cyber': ['Share Tech Mono', 'Major Mono Display', 'Syncopate', 'Wallpoet', 'JetBrains Mono', 'Rubik Mono One', 'monospace'],
  'Pixel / Arcade': ['Press Start 2P', 'VT323', 'Pixelify Sans', 'Silkscreen'],
  'Retrô': ['Monoton', 'Bungee', 'Bungee Shade', 'Bangers', 'Special Elite', 'Rye'],
  'Stencil / Industrial': ['Bebas Neue', 'Anton', 'Oswald', 'Teko', 'Black Ops One'],
  'Graffiti / Urbana': ['Permanent Marker'],
  'Horror / Fantasia': ['Creepster', 'Nosifer', 'MedievalSharp', 'UnifrakturMaguntia', 'Pirata One'],
  'Esportiva / Racing': ['Faster One', 'Racing Sans One'],
  'Elegante / Clássica': ['Playfair Display', 'Cinzel', 'Poiret One'],
  'Serifada': ['Merriweather', 'EB Garamond', 'Cormorant'],
  'Sans Moderna': ['Inter', 'Space Grotesk', 'Outfit', 'Bricolage Grotesque'],
  'Script / Manuscrita': ['Caveat', 'Kalam', 'Pacifico', 'Dancing Script', 'Sacramento', 'Great Vibes', 'Tangerine'],
  'Display / Decorativa': ['Unbounded', 'Bagel Fat One']
};



const ANIMATION_CATEGORIES = {
  entrada: {
    label: 'Entrada / Aparição',
    animations: [
      { id: 'fadeIn', name: 'Fade In' },
      { id: 'surgir', name: 'Aparecer' },
      { id: 'popIn', name: 'Pop In' },
      { id: 'zoomIn', name: 'Zoom In' },
      { id: 'scaleIn', name: 'Scale In' },
      { id: 'slideInCima', name: 'Slide In Cima' },
      { id: 'slideInBaixo', name: 'Slide In Baixo' },
      { id: 'slideInEsquerda', name: 'Slide In Esquerda' },
      { id: 'slideInDireita', name: 'Slide In Direita' },
      { id: 'reveal', name: 'Reveal' },
      { id: 'expandir', name: 'Expandir' },
      { id: 'flipIn', name: 'Flip In' },
      { id: 'rotateIn', name: 'Rotate In' },
      { id: 'bounceIn', name: 'Bounce In' },
      { id: 'blurIn', name: 'Blur In' },
      { id: 'lightSpeedIn', name: 'Light Speed In' }
    ]
  },
  saida: {
    label: 'Saída',
    animations: [
      { id: 'fadeOut', name: 'Fade Out' },
      { id: 'zoomOut', name: 'Zoom Out' },
      { id: 'scaleOut', name: 'Scale Out' },
      { id: 'slideOutCima', name: 'Slide Out Cima' },
      { id: 'slideOutBaixo', name: 'Slide Out Baixo' },
      { id: 'slideOutEsquerda', name: 'Slide Out Esquerda' },
      { id: 'slideOutDireita', name: 'Slide Out Direita' },
      { id: 'encolher', name: 'Encolher' },
      { id: 'flipOut', name: 'Flip Out' },
      { id: 'rotateOut', name: 'Rotate Out' },
      { id: 'bounceOut', name: 'Bounce Out' },
      { id: 'blurOut', name: 'Blur Out' },
      { id: 'lightSpeedOut', name: 'Light Speed Out' }
    ]
  },
  enfase: {
    label: 'Ênfase',
    animations: [
      { id: 'pulsar', name: 'Pulsar' },
      { id: 'heartbeat', name: 'Heartbeat' },
      { id: 'pop', name: 'Pop' },
      { id: 'flash', name: 'Flash' },
      { id: 'bounce', name: 'Bounce (Quicar)' },
      { id: 'shake', name: 'Shake (Tremer)' },
      { id: 'shakeHorizontal', name: 'Shake Horizontal' },
      { id: 'shakeVertical', name: 'Shake Vertical' },
      { id: 'swing', name: 'Swing (Balançar)' },
      { id: 'wobble', name: 'Wobble' },
      { id: 'jello', name: 'Jello (Gelatina)' },
      { id: 'rubberBand', name: 'Rubber Band' },
      { id: 'tada', name: 'Tada' },
      { id: 'cintilar', name: 'Cintilar' }
    ]
  },
  continua: {
    label: 'Movimento Contínuo',
    animations: [
      { id: 'flutuacaoVertical', name: 'Flutuação Vertical' },
      { id: 'flutuacaoHorizontal', name: 'Flutuação Horizontal' },
      { id: 'movimentoLateral', name: 'Movimento Lateral' },
      { id: 'movimentoVertical', name: 'Movimento Vertical' },
      { id: 'bounceContinuo', name: 'Bounce Contínuo' },
      { id: 'pulseContinuo', name: 'Pulse Contínuo' },
      { id: 'respiracao', name: 'Respiração' },
      { id: 'swingContinuo', name: 'Swing Contínuo' },
      { id: 'giroContinuo', name: 'Giro Contínuo' },
      { id: 'zoomSuave', name: 'Zoom Suave' },
      { id: 'pan', name: 'Pan' },
      { id: 'drift', name: 'Drift' }
    ]
  },
  rotacao: {
    label: 'Rotação / Transformação',
    animations: [
      { id: 'rotate', name: 'Rotação' },
      { id: 'spin', name: 'Spin' },
      { id: 'flipHorizontal', name: 'Flip Horizontal' },
      { id: 'flipVertical', name: 'Flip Vertical' },
      { id: 'tilt', name: 'Tilt' },
      { id: 'cambalhota', name: 'Cambalhota' },
      { id: 'scale', name: 'Escalonamento' },
      { id: 'stretch', name: 'Estiramento' },
      { id: 'squash', name: 'Squash' },
      { id: 'elastic', name: 'Elástico' }
    ]
  },
  texto: {
    label: 'Efeitos de Texto',
    animations: [
      { id: 'typewriter', name: 'Typewriter' },
      { id: 'textReveal', name: 'Reveal de Texto' },
      { id: 'textFade', name: 'Fade de Texto' },
      { id: 'textSlide', name: 'Slide de Texto' },
      { id: 'textPop', name: 'Pop de Texto' },
      { id: 'textBounce', name: 'Bounce de Texto' },
      { id: 'textWave', name: 'Wave de Texto' },
      { id: 'textCintilar', name: 'Cintilar de Texto' },
      { id: 'textPanorama', name: 'Panorama de Texto' },
      { id: 'textSurgir', name: 'Surgir de Texto' },
      { id: 'textQuicar', name: 'Quicar de Texto' },
      { id: 'textLetterReveal', name: 'Letter Reveal' }
    ]
  }
};

const EFFECT_GROUPS = {
  bg: {
    label: 'Fundo & Transparência',
    field: 'effBgActiveType',
    options: [
      { id: 'none', name: 'Padrão' },
      { id: 'bg-solid', name: 'Sólido' },
      { id: 'bg-transparent', name: 'Transparente' },
      { id: 'bg-semi-transparent', name: 'Semi-Transp' },
      { id: 'bg-opacity', name: 'Opacidade' }
    ]
  },
  gradient: {
    label: 'Gradientes',
    field: 'effGradientActiveType',
    options: [
      { id: 'none', name: 'Nenhum' },
      { id: 'gradient-linear', name: 'Linear' },
      { id: 'gradient-radial', name: 'Radial' },
      { id: 'gradient-conic', name: 'Cônico' },
      { id: 'gradient-3-colors', name: '3 Cores' },
      { id: 'gradient-multi', name: 'Arco-Íris' },
      { id: 'gradient-smooth', name: 'Suave' },
      { id: 'gradient-intense', name: 'Intenso' },
      { id: 'gradient-vertical', name: 'Vertical' },
      { id: 'gradient-horizontal', name: 'Horizontal' },
      { id: 'gradient-diagonal', name: 'Diagonal' }
    ]
  },
  glass: {
    label: 'Vidro / Blur',
    field: 'effGlassActiveType',
    options: [
      { id: 'none', name: 'Nenhum' },
      { id: 'glass-blur', name: 'Desfoque' },
      { id: 'glass-backdrop', name: 'Backdrop Blur' },
      { id: 'glass-frosted', name: 'Frosted' },
      { id: 'glass-normal', name: 'Vidro' },
      { id: 'glass-dark', name: 'Vidro Escuro' },
      { id: 'glass-light', name: 'Vidro Claro' },
      { id: 'glass-colored', name: 'Vidro Colorido' },
      { id: 'glass-translucent', name: 'Translúcido' }
    ]
  },
  glow: {
    label: 'Luz / Glow',
    field: 'effGlowActiveType',
    options: [
      { id: 'none', name: 'Nenhum' },
      { id: 'glow-normal', name: 'Brilho Normal' },
      { id: 'glow-soft', name: 'Brilho Suave' },
      { id: 'glow-strong', name: 'Brilho Forte' },
      { id: 'glow-colored', name: 'Brilho Colorido' },
      { id: 'glow-neon', name: 'Neon Borda' },
      { id: 'glow-halo', name: 'Halo Externo' },
      { id: 'glow-outer', name: 'Glow Externo' },
      { id: 'glow-inner', name: 'Glow Interno' }
    ]
  },
  shadow: {
    label: 'Sombras',
    field: 'effShadowActiveType',
    options: [
      { id: 'none', name: 'Nenhuma' },
      { id: 'shadow-soft', name: 'Sombra Suave' },
      { id: 'shadow-strong', name: 'Sombra Forte' },
      { id: 'shadow-drop', name: 'Sombra Projetada' },
      { id: 'shadow-inner', name: 'Sombra Interna' },
      { id: 'shadow-long', name: 'Long Shadow' },
      { id: 'shadow-diffuse', name: 'Difusa' }
    ]
  },
  filter: {
    label: 'Acabamento Visual',
    field: 'effFilterActiveType',
    options: [
      { id: 'none', name: 'Nenhum' },
      { id: 'filter-grayscale', name: 'Grayscale' },
      { id: 'filter-sepia', name: 'Sépia' },
      { id: 'filter-saturate', name: 'Saturação' },
      { id: 'filter-desaturate', name: 'Desaturar' },
      { id: 'filter-contrast', name: 'Contraste' },
      { id: 'filter-brightness', name: 'Brilho' },
      { id: 'filter-hue', name: 'Hue Shift' },
      { id: 'filter-invert', name: 'Inverter' },
      { id: 'filter-blur', name: 'Blur Visual' }
    ]
  },
  reflect: {
    label: 'Espelhamento / Reflexo',
    field: 'effReflectActiveType',
    options: [
      { id: 'none', name: 'Nenhum' },
      { id: 'reflect-h', name: 'Espelhar H' },
      { id: 'reflect-v', name: 'Espelhar V' },
      { id: 'reflect-normal', name: 'Reflexo Real' },
      { id: 'reflect-transparent', name: 'Reflexo Transp' }
    ]
  },
  border: {
    label: 'Borda / Superfície',
    field: 'effBorderActiveType',
    options: [
      { id: 'none', name: 'Nenhuma' },
      { id: 'border-solid', name: 'Sólida' },
      { id: 'border-transparent', name: 'Transparente' },
      { id: 'border-glow', name: 'Glow' },
      { id: 'border-neon', name: 'Neon' },
      { id: 'border-gradient', name: 'Gradiente' },
      { id: 'border-radius', name: 'Arredondar' }
    ]
  },
  animBg: {
    label: 'Fundos Animados',
    field: 'effAnimBgActiveType',
    options: [
      { id: 'none', name: 'Nenhum' },
      { id: 'anim-bg-gradient', name: 'Gradiente Loop' },
      { id: 'anim-bg-glow-pulse', name: 'Glow Pulse' },
      { id: 'anim-bg-neon-pulse', name: 'Neon Pulse' },
      { id: 'anim-bg-shimmer', name: 'Shimmer Loop' },
      { id: 'anim-bg-flicker', name: 'Cintilação' },
      { id: 'anim-bg-hue-shift', name: 'Hue Shift' },
      { id: 'anim-bg-blur-pulse', name: 'Blur Pulse' },
      { id: 'anim-bg-pulse', name: 'Pulse Geral' },
      { id: 'anim-bg-grad-move', name: 'Gradiente Direção' }
    ]
  }
};

function loadGoogleFont(fontFamily) {
  if (!fontFamily || fontFamily === 'monospace' || fontFamily === 'sans-serif') return;
  const linkId = `gfont-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(linkId)) return;
  
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

export default function OverlayEditorSidebar({
  isOpen,
  onToggleOpen,
  selectedWidgetId,
  instances = [],
  selectedInstanceId,
  onSelectInstance,
  onAddInstance,
  onUpdateInstance,
  onDeleteInstance,
  onSaveTemplate,
  overlayName,
  visualizerSize = { width: 800, height: 480 },
  onUpdateVisualizerSize = () => {},
  gridSettings = {},
  onUpdateGridSettings = () => {},
  background = {},
  onUpdateBackground = () => {},
  canUndo = false,
  canRedo = false,
  onUndo = () => {},
  onRedo = () => {},
  historyPastCount = 0,
  historyFutureCount = 0,
}) {
  const { connections, streamMeta, liveActivity } = useStreaming();
  const [activeTab, setActiveTab] = useState('widget');
  const [selectedFontCategory, setSelectedFontCategory] = useState('Sans Moderna');
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [libraryFavorites, setLibraryFavorites] = useState(() => {
    try {
      const uid = authClient.getUserDataCache()?.id || 'anonymous';
      const saved = localCache.get(uid, 'overlay_favorites');
      return Array.isArray(saved) ? saved : [];
    } catch (e) {
      return [];
    }
  });

  const toggleLibraryFavorite = (id, e) => {
    if (e) e.stopPropagation();
    setLibraryFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id];
      try {
        const uid = authClient.getUserDataCache()?.id || 'anonymous';
        localCache.set(uid, 'overlay_favorites', next);
      } catch (err) {}
      return next;
    });
  };

  const selectedInst = instances.find(i => i.id === selectedInstanceId);

  // Sync selected font category when instance selection changes
  useEffect(() => {
    if (selectedInst && selectedInst.config?.fontFamily) {
      const family = selectedInst.config.fontFamily;
      const category = Object.keys(FONT_CATEGORIES).find(cat => 
        FONT_CATEGORIES[cat].includes(family)
      );
      if (category) {
        setSelectedFontCategory(category);
      }
    }
  }, [selectedInstanceId]);

  // Load selected font dynamically in document head
  useEffect(() => {
    if (selectedInst?.config?.fontFamily) {
      loadGoogleFont(selectedInst.config.fontFamily);
    }
  }, [selectedInst?.config?.fontFamily]);

  const scrollContainerRef = useRef(null);
  const catContainerRef = useRef(null);
  const fontContainerRef = useRef(null);


  // Load all Google fonts of selected font category so they render correctly in the visual button list
  useEffect(() => {
    if (selectedFontCategory && FONT_CATEGORIES[selectedFontCategory]) {
      FONT_CATEGORIES[selectedFontCategory].forEach(font => {
        loadGoogleFont(font);
      });
    }
  }, [selectedFontCategory]);

  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [prebuiltModalOpen, setPrebuiltModalOpen] = useState(false);
  const [structuralModalOpen, setStructuralModalOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Arrow key scrolling for sidebar panel when hovered and no input is focused (does not conflict with visualizer or inputs)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (!isSidebarHovered) return;
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT' || activeEl.isContentEditable);
      if (isInput) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ top: -45, behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ top: 45, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSidebarHovered]);

  // Automatic proximity scrolling (1.5x speed) for main Editor panel (scrollContainerRef)
  useEffect(() => {
    if (!isOpen) return;

    const el = scrollContainerRef.current;
    if (!el) return;

    let animFrameId;
    let scrollSpeed = 0;
    const threshold = 40; // 40px proximity zone
    const maxSpeed = 7.5; // ~7.5px per frame (1.5x default speed)

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const mouseY = e.clientY;
      const mouseX = e.clientX;

      if (
        mouseX >= rect.left &&
        mouseX <= rect.right &&
        mouseY >= rect.top &&
        mouseY <= rect.bottom
      ) {
        const topEdge = rect.top + threshold;
        const bottomEdge = rect.bottom - threshold;

        if (mouseY < topEdge) {
          const intensity = (topEdge - mouseY) / threshold;
          scrollSpeed = -Math.max(0.15, intensity) * maxSpeed;
        } else if (mouseY > bottomEdge) {
          const intensity = (mouseY - bottomEdge) / threshold;
          scrollSpeed = Math.max(0.15, intensity) * maxSpeed;
        } else {
          scrollSpeed = 0;
        }
      } else {
        scrollSpeed = 0;
      }
    };

    const handleMouseLeave = () => {
      scrollSpeed = 0;
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    const step = () => {
      if (scrollSpeed !== 0 && el) {
        el.scrollTop += scrollSpeed;
      }
      animFrameId = requestAnimationFrame(step);
    };

    animFrameId = requestAnimationFrame(step);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animFrameId);
    };
  }, [isOpen, activeTab, selectedInst?.id, selectedWidgetId]);

  // Automatic proximity scrolling for Tipografia fields (Category and Font Family)
  useEffect(() => {
    if (!isOpen) return;

    const containers = [
      { ref: catContainerRef, maxSpeed: 45, threshold: 30 },
      { ref: fontContainerRef, maxSpeed: 45, threshold: 35 }
    ];

    const activeLoops = [];

    containers.forEach(({ ref, maxSpeed, threshold }) => {
      const el = ref.current;
      if (!el) return;

      let animationFrameId;
      let scrollSpeed = 0;

      const handleMouseMove = (e) => {
        const rect = el.getBoundingClientRect();
        const mouseY = e.clientY;
        const mouseX = e.clientX;
        const topEdge = rect.top + threshold;
        const bottomEdge = rect.bottom - threshold;

        // Check if cursor is inside the bounds of this specific container
        if (
          mouseX >= rect.left &&
          mouseX <= rect.right &&
          mouseY >= rect.top &&
          mouseY <= rect.bottom
        ) {
          if (mouseY < topEdge) {
            const intensity = (topEdge - mouseY) / threshold;
            scrollSpeed = -Math.max(0.1, intensity) * maxSpeed;
          } else if (mouseY > bottomEdge) {
            const intensity = (mouseY - bottomEdge) / threshold;
            scrollSpeed = Math.max(0.1, intensity) * maxSpeed;
          } else {
            scrollSpeed = 0;
          }
        } else {
          scrollSpeed = 0;
        }
      };

      const handleMouseLeave = () => {
        scrollSpeed = 0;
      };

      const preventManual = (e) => {
        e.preventDefault();
      };

      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);
      el.addEventListener('wheel', preventManual, { passive: false });
      el.addEventListener('touchmove', preventManual, { passive: false });

      const step = () => {
        if (scrollSpeed !== 0 && el) {
          el.scrollTop += scrollSpeed;
        }
        animationFrameId = requestAnimationFrame(step);
      };

      animationFrameId = requestAnimationFrame(step);

      activeLoops.push({
        cancel: () => {
          el.removeEventListener('mousemove', handleMouseMove);
          el.removeEventListener('mouseleave', handleMouseLeave);
          el.removeEventListener('wheel', preventManual);
          el.removeEventListener('touchmove', preventManual);
          cancelAnimationFrame(animationFrameId);
        }
      });
    });

    return () => {
      activeLoops.forEach(loop => loop.cancel());
    };
  }, [isOpen, selectedInst?.id, selectedFontCategory, activeTab]);

  const [elementGalleryOpen, setElementGalleryOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [showEffectsGroup, setShowEffectsGroup] = useState(false);
  const [showFontsGroup, setShowFontsGroup] = useState(false);
  const [activeWidgetId, setActiveWidgetId] = useState(() => selectedWidgetId || TWITCH_WIDGETS_CATALOG[0]?.id || null);

  useEffect(() => {
    if (selectedWidgetId) {
      setActiveWidgetId(selectedWidgetId);
    } else if (selectedInst?.widgetId) {
      setActiveWidgetId(selectedInst.widgetId);
    }
  }, [selectedWidgetId, selectedInst?.widgetId]);

  const currentWidgetId = activeWidgetId || selectedWidgetId || selectedInst?.widgetId || null;
  const selectedWidget = TWITCH_WIDGETS_CATALOG.find(w => w.id === currentWidgetId) || null;
  const availableElements = selectedWidget ? getWidgetInternalElements(selectedWidget.id) : [];
  const isFragmentable = selectedWidget ? isWidgetFragmentable(selectedWidget.id) : false;
  const isMusicWidget = selectedWidget?.id === 'media-current-music';

  const WidgetPreviewComponent = selectedWidget?.component;

  return (
    <aside className="fixed inset-0 z-50 flex items-center justify-end pointer-events-none">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      {/* Toggle Handle Button on left border of sidebar */}
      <button
        onClick={onToggleOpen}
        className="pointer-events-auto h-12 w-6 bg-purple-600 hover:bg-purple-500 text-white rounded-l-xl flex items-center justify-center shadow-2xl transition-all"
        title={isOpen ? 'Recolher Editor' : 'Expandir Editor'}
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Floating Panel (does NOT push visualizer) */}
      <div
        className={`pointer-events-auto h-full bg-slate-900/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
          isOpen ? 'w-80 md:w-88' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-white/10 shrink-0 bg-black/40">
          <div className="truncate pr-2">
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block">Editor de Overlay</span>
            <h2 className="font-bold text-white text-xs truncate" title={overlayName}>{overlayName}</h2>
          </div>
          <button
            onClick={onSaveTemplate}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all shadow-md shadow-purple-600/30 shrink-0"
          >
            <Save className="h-3.5 w-3.5" /> Salvar
          </button>
        </div>

        {/* Tabs */}
        <HorizontalScrollContainer className="bg-black/60 border-b border-white/10 p-2 shrink-0">
          {[
            { id: 'widget', label: 'Widget', icon: LayoutGrid },
            { id: 'config', label: 'Config', icon: Sliders },
            { id: 'effects', label: 'Efeitos', icon: Sparkles },
            { id: 'gallery', label: 'Biblioteca', icon: FolderPlus },
            { id: 'layers', label: 'Camadas', icon: Layers },
            { id: 'transform', label: 'Transformar', icon: Maximize2 },
            { id: 'align', label: 'Alinhar', icon: AlignLeft },
            { id: 'organize', label: 'Organizar', icon: Grid },
            { id: 'guides', label: 'Guias', icon: Ruler },
            { id: 'background', label: 'Fundo', icon: Palette },
            { id: 'presets', label: 'Presets', icon: Compass },
            { id: 'history', label: 'Histórico', icon: History },
            { id: 'data', label: 'Dados', icon: Database },
            { id: 'responsive', label: 'Responsivo', icon: Smartphone },
            { id: 'timeline', label: 'Timeline', icon: Film },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex flex-col items-center py-1.5 px-2.5 rounded-lg text-[10px] font-medium transition-all ${
                  isActive 
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40' 
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="h-3.5 w-3.5 mb-0.5" />
                {tab.label}
              </button>
            );
          })}
        </HorizontalScrollContainer>

        {/* Tab Scroll Content - Main Editor Panel with 1.5x mouse proximity auto-scroll */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-4"
        >
          {/* TAB 1: WIDGET - UMA ÚNICA PÁGINA VERTICAL CONTINUA */}
          {activeTab === 'widget' && (
            <div className="space-y-4">
              {/* 1. SEÇÃO ADICIONAR WIDGET / COMPONENTES / CATÁLOGO */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-4">
                {selectedWidget ? (
                  <>
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="truncate pr-2">
                        <span className="text-[10px] font-mono text-purple-400 block">Widget Selecionada</span>
                        <h3 className="text-xs font-bold text-white truncate">{selectedWidget.name}</h3>
                      </div>
                    </div>

                    {/* Preview Real da Widget */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-mono block">Visualização Real</span>
                      <div className="h-40 rounded-lg border border-white/5 bg-slate-950/85 p-2 overflow-hidden flex flex-col justify-end select-none">
                        {WidgetPreviewComponent && <WidgetPreviewComponent config={selectedWidget.defaultConfig} />}
                      </div>
                    </div>

                    {/* Identificação de Fragmentabilidade */}
                    <div className="py-2 px-3 rounded-lg border border-white/5 bg-slate-950/30 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">Tipo de Composição</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${isFragmentable ? 'bg-indigo-400 animate-pulse' : 'bg-amber-400'}`} />
                        <span className="text-xs font-semibold text-white">
                          {isFragmentable ? 'Composição Editável / Fragmentável' : 'Composição Fixa (Unidade Única)'}
                        </span>
                      </div>
                    </div>

                    {/* Botões de Dimensionamento Rápido */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          if (selectedInst) {
                            onUpdateInstance(selectedInst.id, {
                              width: visualizerSize.width,
                              height: visualizerSize.height,
                              x: 0,
                              y: 0
                            });
                          }
                        }}
                        className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-indigo-200 transition-all cursor-pointer"
                      >
                        <Maximize2 className="h-3 w-3" />
                        <span className="text-[9px] font-bold uppercase leading-none">Widget = Cenário</span>
                      </button>
                      <button
                        onClick={() => {
                          if (selectedInst) {
                            onUpdateVisualizerSize({
                              width: selectedInst.width || 400,
                              height: selectedInst.height || 300
                            });
                          }
                        }}
                        className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-teal-900/40 hover:bg-teal-800/60 border border-teal-500/30 text-teal-200 transition-all cursor-pointer"
                      >
                        <LayoutGrid className="h-3 w-3" />
                        <span className="text-[9px] font-bold uppercase leading-none">Cenário = Widget</span>
                      </button>
                    </div>

                    {/* Botões de Adicionar */}
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => onAddInstance({
                          widgetId: selectedWidget.id,
                          isFullWidget: true,
                          name: selectedWidget.name,
                          defaultConfig: selectedWidget.defaultConfig,
                          width: selectedWidget.defaultWidth,
                          height: selectedWidget.defaultHeight
                        })}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all active:scale-95 shadow-md border border-white/10 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" /> Adicionar Widget Inteira
                      </button>

                      {isFragmentable && availableElements.length > 0 && (
                        <div className="space-y-1.5 pt-2.5 border-t border-white/5">
                          <span className="text-[10px] text-slate-400 font-mono block">Componentes Internos</span>
                          <div className="grid gap-1.5">
                            {availableElements.map(elem => (
                              <button
                                key={elem.key}
                                onClick={() => onAddInstance({
                                  widgetId: selectedWidget.id,
                                  elementKey: elem.key,
                                  isFullWidget: false,
                                  name: `${selectedWidget.name} - ${elem.label}`,
                                  defaultConfig: selectedWidget.defaultConfig
                                })}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-[11px] transition-all border border-white/5 cursor-pointer"
                              >
                                <span className="truncate pr-2">{elem.label}</span>
                                <Plus className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Estado Limpo quando nenhuma widget está selecionada */
                  <div className="text-center py-6 px-4 space-y-2">
                    <LayoutGrid className="w-7 h-7 text-purple-400/50 mx-auto" />
                    <p className="text-xs font-semibold text-slate-300">Nenhuma widget selecionada</p>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      Selecione uma widget no menu lateral de Overlays para visualizar suas opções.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-3">
              <button type="button" onClick={() => setTemplateGalleryOpen(true)}
                className="w-full rounded-xl border border-violet-500/30 bg-slate-900/80 p-3 text-left text-sm font-semibold text-white hover:border-violet-400 hover:bg-slate-800">
                Templates
              </button>
              {selectedInst ? (
                <div className="space-y-4 bg-black/40 border border-white/10 rounded-xl p-3.5">
                  <div className="text-xs font-semibold text-purple-300 border-b border-white/10 pb-2 truncate flex items-center justify-between">
                    <span>Elemento: {selectedInst.name}</span>
                  </div>

                  {usesPlatformData(selectedInst) && (
                    <PlatformControls instance={selectedInst} onUpdateInstance={onUpdateInstance} />
                  )}
                  <ManualWidgetConfig instance={selectedInst} onUpdateInstance={onUpdateInstance} />
                  <TempoVisivelConfig instance={selectedInst} onUpdateInstance={onUpdateInstance} />

              {/* Modelos estruturais são exclusivos da widget inteira com modelos próprios. */}
              {selectedInst && (selectedInst.isFullWidget || selectedInst.elementKey === 'full_widget') && getTemplatesForWidget(selectedInst.widgetId).length > 0 && (
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="truncate pr-2">
                      <span className="text-[10px] font-mono text-purple-400 block">Elemento Selecionado</span>
                      <h3 className="text-xs font-bold text-white truncate">{selectedInst.name}</h3>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                      {resolveWidgetCategory(selectedInst.widgetId).toUpperCase()}
                    </span>
                  </div>

                  {/* Modelos válidos desta widget e apresentação original. */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="text-[11px] font-bold text-white tracking-wide uppercase">PADRÕES</span>
                      </div>
                      <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                        {getTemplateForWidget(selectedInst.widgetId, selectedInst.config?.structuralPreset) ? `Template ${selectedInst.config.structuralPreset} Ativo` : 'Padrão Ativo'}
                      </span>
                    </div>

                    {/* Faixa Horizontal com Botões ◀ e ▶ para Navegação */}
                    <HorizontalScrollContainer className="pb-1 border-b border-white/5" contentClassName="gap-1">
                      {/* Botão PADRÃO (Pill) */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextConfig = { ...(selectedInst.config || {}) };
                          delete nextConfig.structuralPreset;
                          delete nextConfig.widgetCategory;
                          const isChat = selectedInst.widgetId?.startsWith('chat');
                          const isGoal = selectedInst.widgetId?.startsWith('goals') || selectedInst.widgetId?.includes('goal');
                          const isAudience = selectedInst.widgetId?.includes('status') || selectedInst.widgetId?.includes('viewer');
                          const defaultW = selectedInst.isFullWidget ? (isChat ? 340 : isGoal ? 320 : isAudience ? 280 : 260) : 220;
                          const defaultH = selectedInst.isFullWidget ? (isChat ? 300 : isGoal ? 120 : isAudience ? 100 : 120) : 50;

                          onUpdateInstance(selectedInst.id, {
                            width: defaultW,
                            height: defaultH,
                            config: nextConfig
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold shrink-0 transition-all ${
                          !getTemplateForWidget(selectedInst.widgetId, selectedInst.config?.structuralPreset)
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400/60 shadow-md shadow-purple-900/30 ring-1 ring-purple-400/50'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
                        }`}
                        title="Restaurar layout original"
                      >
                        PADRÃO
                      </button>

                      {/* Botões de modelos próprios da widget. */}
                      {getTemplatesForWidget(selectedInst.widgetId).map((tpl) => {
                        const isActive = selectedInst.config?.structuralPreset === tpl.id;
                        const activeCat = resolveWidgetCategory(selectedInst.widgetId);
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => {
                              onUpdateInstance(selectedInst.id, {
                                width: tpl.defaultWidth,
                                height: tpl.defaultHeight,
                                config: {
                                  ...(selectedInst.config || {}),
                                  structuralPreset: tpl.id,
                                  widgetCategory: activeCat
                                }
                              });
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold shrink-0 transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border border-cyan-400/60 shadow-md shadow-cyan-900/30 ring-1 ring-cyan-400/50'
                                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10'
                            }`}
                            title={`Template ${String(tpl.number).padStart(2, '0')}: ${tpl.name} (${tpl.aspectRatio}px)`}
                          >
                            {String(tpl.number).padStart(2, '0')}
                          </button>
                        );
                      })}
                    </HorizontalScrollContainer>

                    {/* Lista de modelos próprios e apresentação original. */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      {/* Card PADRÃO Original */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextConfig = { ...(selectedInst.config || {}) };
                          delete nextConfig.structuralPreset;
                          delete nextConfig.widgetCategory;
                          const isChat = selectedInst.widgetId?.startsWith('chat');
                          const isGoal = selectedInst.widgetId?.startsWith('goals') || selectedInst.widgetId?.includes('goal');
                          const isAudience = selectedInst.widgetId?.includes('status') || selectedInst.widgetId?.includes('viewer');
                          const defaultW = selectedInst.isFullWidget ? (isChat ? 340 : isGoal ? 320 : isAudience ? 280 : 260) : 220;
                          const defaultH = selectedInst.isFullWidget ? (isChat ? 300 : isGoal ? 120 : isAudience ? 100 : 120) : 50;

                          onUpdateInstance(selectedInst.id, {
                            width: defaultW,
                            height: defaultH,
                            config: nextConfig
                          });
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          !getTemplateForWidget(selectedInst.widgetId, selectedInst.config?.structuralPreset)
                            ? 'bg-purple-950/60 border-purple-500/80 shadow-lg shadow-purple-950/40 ring-1 ring-purple-400/50'
                            : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">PADRÃO</span>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            ORIGINAL
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white mb-0.5">Layout Original da Widget</div>
                        <div className="text-[10px] text-slate-400">Restaura apresentação nativa da widget</div>
                      </button>

                      {/* Grid com os modelos disponíveis desta widget. */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {getTemplatesForWidget(selectedInst.widgetId).map((tpl) => {
                          const isActive = selectedInst.config?.structuralPreset === tpl.id;
                          const activeCat = resolveWidgetCategory(selectedInst.widgetId);
                          return (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => {
                                onUpdateInstance(selectedInst.id, {
                                  width: tpl.defaultWidth,
                                  height: tpl.defaultHeight,
                                  config: {
                                    ...(selectedInst.config || {}),
                                    structuralPreset: tpl.id,
                                    widgetCategory: activeCat
                                  }
                                });
                              }}
                              className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between overflow-hidden min-w-0 ${
                                isActive
                                  ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400/50'
                                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5 gap-1 min-w-0 w-full shrink-0">
                                <span className={`text-[10px] font-mono font-extrabold shrink-0 ${isActive ? 'text-cyan-300' : 'text-purple-400'}`}>
                                  {String(tpl.number).padStart(2, '0')}
                                </span>
                                <span className="text-[7.5px] font-mono px-1 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 truncate max-w-[65px] shrink-0 text-right">
                                  {tpl.badge}
                                </span>
                              </div>
                              <div
                                className={`font-bold text-white leading-tight break-words w-full overflow-hidden ${
                                  tpl.name.length > 20
                                    ? 'text-[8.5px] leading-snug'
                                    : tpl.name.length > 14
                                    ? 'text-[9px] leading-snug'
                                    : 'text-[9.5px]'
                                }`}
                                title={tpl.name}
                              >
                                {tpl.name}
                              </div>
                              <div className="text-[8px] text-slate-400 mt-1 font-mono">
                                {tpl.aspectRatio}px
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

                  {/* Dimensões e Posição */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Largura (px)</label>
                        <input
                          type="number"
                          value={selectedInst.width || 280}
                          onChange={(e) => onUpdateInstance(selectedInst.id, { width: Math.max(50, parseInt(e.target.value) || 280) })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Altura (px)</label>
                        <input
                          type="number"
                          value={selectedInst.height || 180}
                          onChange={(e) => onUpdateInstance(selectedInst.id, { height: Math.max(30, parseInt(e.target.value) || 180) })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Posição X</label>
                        <input
                          type="number"
                          value={selectedInst.x || 0}
                          onChange={(e) => onUpdateInstance(selectedInst.id, { x: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Posição Y</label>
                        <input
                          type="number"
                          value={selectedInst.y || 0}
                          onChange={(e) => onUpdateInstance(selectedInst.id, { y: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Config Text for custom text or library-text widget */}
                  {(selectedInst.widgetId?.includes('custom-text') || selectedInst.widgetId?.startsWith('library-text')) && (
                    <div className="border-t border-white/5 pt-3 space-y-2">
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">Conteúdo do Texto</label>
                      <textarea
                        rows={3}
                        value={selectedInst.config?.text || ''}
                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                          config: { ...selectedInst.config, text: e.target.value }
                        })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white resize-none"
                        placeholder="Insira seu texto"
                      />
                    </div>
                  )}

                  {/* Shapes configuration */}
                  {selectedInst.widgetId === 'library-shape' && (
                    <div className="border-t border-white/5 pt-3 space-y-2">
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">Tipo de Forma</label>
                      <select
                        value={selectedInst.config?.shapeType || 'rectangle'}
                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                          config: { ...selectedInst.config, shapeType: e.target.value }
                        })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="rectangle">Retângulo</option>
                        <option value="rounded-rectangle">Retângulo Arredondado</option>
                        <option value="square">Quadrado</option>
                        <option value="circle">Círculo</option>
                        <option value="ellipse">Elipse</option>
                        <option value="triangle">Triângulo</option>
                        <option value="rhombus">Losango</option>
                        <option value="pentagon">Pentágono</option>
                        <option value="hexagon">Hexágono</option>
                        <option value="star">Estrela</option>
                        <option value="heart">Coração</option>
                      </select>
                    </div>
                  )}

                  {/* Line & Arrow configurations */}
                  {selectedInst.widgetId === 'library-line' && (
                    <div className="border-t border-white/5 pt-3 space-y-3">
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Configurações da Linha</div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>Espessura</span>
                          <span>{selectedInst.config?.lineThickness || 3}px</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="15"
                          value={selectedInst.config?.lineThickness || 3}
                          onChange={(e) => onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, lineThickness: parseInt(e.target.value) }
                          })}
                          className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono block mb-1">Estilo da Linha</label>
                          <select
                            value={selectedInst.config?.lineStyle || 'solid'}
                            onChange={(e) => onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, lineStyle: e.target.value }
                            })}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          >
                            <option value="solid">Sólido</option>
                            <option value="dashed">Tracejado</option>
                            <option value="dotted">Pontilhado</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 font-mono block mb-1">Tipo de Linha</label>
                          <select
                            value={selectedInst.config?.lineType || 'line'}
                            onChange={(e) => onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, lineType: e.target.value }
                            })}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          >
                            <option value="line">Linha / Seta</option>
                            <option value="divisor">Divisor</option>
                          </select>
                        </div>
                      </div>

                      {selectedInst.config?.lineType !== 'divisor' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedInst.config?.arrowStart)}
                              onChange={(e) => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, arrowStart: e.target.checked }
                              })}
                              className="accent-purple-600 rounded bg-black/60 border-white/10"
                            />
                            <span>Seta no Início</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedInst.config?.arrowEnd)}
                              onChange={(e) => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, arrowEnd: e.target.checked }
                              })}
                              className="accent-purple-600 rounded bg-black/60 border-white/10"
                            />
                            <span>Seta no Fim</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Icons Configuration */}
                  {selectedInst.widgetId === 'library-icon' && (
                    <div className="border-t border-white/5 pt-3 space-y-2">
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">Tipo de Ícone</label>
                      <select
                        value={selectedInst.config?.iconType || 'heart'}
                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                          config: { ...selectedInst.config, iconType: e.target.value }
                        })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="heart">Coração</option>
                        <option value="star">Estrela</option>
                        <option value="user">Usuário</option>
                        <option value="users">Membros</option>
                        <option value="camera">Câmera</option>
                        <option value="mic">Microfone</option>
                        <option value="volume">Áudio</option>
                        <option value="video">Vídeo</option>
                        <option value="music">Música</option>
                        <option value="chat">Chat</option>
                        <option value="bell">Sino</option>
                        <option value="calendar">Agenda</option>
                        <option value="clock">Relógio</option>
                        <option value="map-pin">Localização</option>
                        <option value="link">Link</option>
                        <option value="share">Compartilhar</option>
                        <option value="gamepad">Jogo / Console</option>
                        <option value="trophy">Troféu</option>
                        <option value="settings">Configurações</option>
                        <option value="help">Ajuda</option>
                        <option value="smile">Sorriso</option>
                        <option value="sparkles">Brilho</option>
                      </select>
                    </div>
                  )}

                  {/* Social Network configuration */}
                  {selectedInst.widgetId === 'library-social' && (
                    <div className="border-t border-white/5 pt-3 space-y-3">
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Rede Social</div>
                      
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Plataforma</label>
                        <select
                          value={selectedInst.config?.socialType || 'twitch'}
                          onChange={(e) => onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, socialType: e.target.value }
                          })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                        >
                          <option value="twitch">Twitch</option>
                          <option value="youtube">YouTube</option>
                          <option value="tiktok">TikTok</option>
                          <option value="kick">Kick</option>
                          <option value="instagram">Instagram</option>
                          <option value="facebook">Facebook</option>
                          <option value="twitter">X / Twitter</option>
                          <option value="discord">Discord</option>
                          <option value="spotify">Spotify</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Nickname / Handle</label>
                        <input
                          type="text"
                          value={selectedInst.config?.text || '@username'}
                          onChange={(e) => onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, text: e.target.value }
                          })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono block mb-1">Modo Exibição</label>
                          <select
                            value={selectedInst.config?.displayMode || 'both'}
                            onChange={(e) => onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, displayMode: e.target.value }
                            })}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          >
                            <option value="both">Ícone + Texto</option>
                            <option value="icon">Apenas Ícone</option>
                            <option value="text">Apenas Texto</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 font-mono block mb-1">Cor do Ícone</label>
                          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg p-1">
                            <input
                              type="color"
                              value={selectedInst.config?.iconColor || selectedInst.config?.textColor || '#ffffff'}
                              onChange={(e) => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, iconColor: e.target.value }
                              })}
                              className="h-6 w-8 rounded border border-white/10 bg-transparent cursor-pointer p-0"
                            />
                            <input
                              type="text"
                              value={selectedInst.config?.iconColor || selectedInst.config?.textColor || '#ffffff'}
                              onChange={(e) => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, iconColor: e.target.value }
                              })}
                              className="w-full bg-transparent border-0 text-[9px] font-mono text-white p-0 uppercase"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ENQUETE INTERATIVA */}
                  {selectedInst.widgetId === 'twitch-poll' && (
                    <div className="space-y-3 border-t border-white/5 pt-3">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <Vote className="h-3.5 w-3.5" />
                        <span>Configuração da Enquete</span>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Pergunta da Votação</label>
                        <input
                          type="text"
                          value={selectedInst.config?.question !== undefined ? selectedInst.config.question : 'A live hoje está legal?'}
                          onChange={(e) => onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, question: e.target.value }
                          })}
                          placeholder="Escreva a pergunta da enquete..."
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-slate-400 font-mono">Opções de Votação</label>
                          <button
                            type="button"
                            onClick={() => {
                              const currentOpts = Array.isArray(selectedInst.config?.options)
                                ? selectedInst.config.options
                                : [{ text: 'Sim', label: '1' }, { text: 'Não', label: '2' }];
                              const nextNum = currentOpts.length + 1;
                              const nextOpts = [...currentOpts, { text: `Opção ${nextNum}`, label: String(nextNum) }];
                              onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, options: nextOpts }
                              });
                            }}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 rounded text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Opção</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {(Array.isArray(selectedInst.config?.options) ? selectedInst.config.options : [
                            { text: 'Sim', label: '1' },
                            { text: 'Não', label: '2' }
                          ]).map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-emerald-400 w-5 shrink-0 text-center">
                                {opt.label || String(idx + 1)}
                              </span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const currentOpts = [...(Array.isArray(selectedInst.config?.options) ? selectedInst.config.options : [
                                    { text: 'Sim', label: '1' },
                                    { text: 'Não', label: '2' }
                                  ])];
                                  currentOpts[idx] = { ...currentOpts[idx], text: e.target.value, label: String(idx + 1) };
                                  onUpdateInstance(selectedInst.id, {
                                    config: { ...selectedInst.config, options: currentOpts }
                                  });
                                }}
                                className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                              />
                              {(Array.isArray(selectedInst.config?.options) ? selectedInst.config.options.length : 2) > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentOpts = (Array.isArray(selectedInst.config?.options) ? selectedInst.config.options : [
                                      { text: 'Sim', label: '1' },
                                      { text: 'Não', label: '2' }
                                    ]).filter((_, i) => i !== idx)
                                      .map((item, i) => ({ ...item, label: String(i + 1) }));
                                    onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, options: currentOpts }
                                    });
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                                  title="Remover opção"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, resetVotes: Date.now() }
                          });
                        }}
                        className="w-full py-1.5 bg-black/40 hover:bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs font-bold text-rose-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Zerar Votos da Enquete</span>
                      </button>
                    </div>
                  )}

                  {/* SORTEIO DO CHAT */}
                  {selectedInst.widgetId === 'twitch-raffle' && (
                    <div className="space-y-3 border-t border-white/5 pt-3">
                      <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                        <Gift className="h-3.5 w-3.5" />
                        <span>Controles do Sorteio</span>
                      </div>

                      <div className="p-2.5 bg-black/50 border border-white/10 rounded-xl space-y-1 text-left">
                        <div className="text-[11px] text-slate-300 font-medium leading-relaxed">
                          Para participar do sorteio, os espectadores devem digitar <code className="text-cyan-400 font-bold font-mono bg-cyan-950/40 px-1 py-0.5 rounded border border-cyan-500/20">!entrar</code> no chat.
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, drawTrigger: Date.now() }
                            });
                          }}
                          className="w-full py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 rounded-lg text-xs font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Gift className="h-3.5 w-3.5" />
                          <span>Realizar Sorteio do Chat</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, resetTrigger: Date.now() }
                            });
                          }}
                          className="w-full py-1.5 bg-black/40 hover:bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs font-bold text-rose-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Zerar Participantes / Novo Sorteio</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AGENDA DA SEMANA */}
                  {selectedInst.widgetId === 'twitch-schedule' && (
                    <div className="space-y-3 border-t border-white/5 pt-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Agenda da Semana</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const current = Array.isArray(selectedInst.config?.schedule) ? selectedInst.config.schedule : [];
                            const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
                            const nextDay = days[current.length % days.length];
                            const updated = [...current, { day: nextDay, hour: '20:00', label: 'Gameplay' }];
                            onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, schedule: updated }
                            });
                          }}
                          className="px-2 py-0.5 bg-teal-600 hover:bg-teal-500 rounded text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Item</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(Array.isArray(selectedInst.config?.schedule) ? selectedInst.config.schedule : []).length === 0 ? (
                          <div className="text-[10px] text-slate-500 font-mono italic text-center py-2">
                            Nenhum item na agenda. Clique em "+ Item" para adicionar.
                          </div>
                        ) : (
                          (selectedInst.config.schedule).map((item, idx) => (
                            <div key={idx} className="p-2 bg-black/50 border border-white/10 rounded-lg space-y-1.5 relative">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Dia (ex: Segunda)"
                                  value={item.day || ''}
                                  onChange={(e) => {
                                    const updated = [...selectedInst.config.schedule];
                                    updated[idx] = { ...updated[idx], day: e.target.value };
                                    onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, schedule: updated }
                                    });
                                  }}
                                  className="w-1/3 bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white font-bold"
                                />
                                <input
                                  type="text"
                                  placeholder="Horário (ex: 20:00)"
                                  value={item.hour || ''}
                                  onChange={(e) => {
                                    const updated = [...selectedInst.config.schedule];
                                    updated[idx] = { ...updated[idx], hour: e.target.value };
                                    onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, schedule: updated }
                                    });
                                  }}
                                  className="w-1/4 bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-teal-300 font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = selectedInst.config.schedule.filter((_, i) => i !== idx);
                                    onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, schedule: updated }
                                    });
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-400 ml-auto shrink-0 cursor-pointer"
                                  title="Remover item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <input
                                type="text"
                                placeholder="Atividade (ex: Gameplay, Just Chatting)"
                                value={item.label || ''}
                                onChange={(e) => {
                                  const updated = [...selectedInst.config.schedule];
                                  updated[idx] = { ...updated[idx], label: e.target.value };
                                  onUpdateInstance(selectedInst.id, {
                                    config: { ...selectedInst.config, schedule: updated }
                                  });
                                }}
                                className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-slate-200"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* NOTÍCIAS / AVISOS DA STREAM */}
                  {selectedInst.widgetId === 'twitch-schedule-ticker' && (
                    <div className="space-y-3 border-t border-white/5 pt-3">
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span>Avisos e Notícias da Stream</span>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Texto do Letreiro / Avisos</label>
                        <textarea
                          rows={3}
                          value={selectedInst.config?.newsText !== undefined ? selectedInst.config.newsText : (selectedInst.config?.text || '')}
                          onChange={(e) => onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, newsText: e.target.value, text: e.target.value }
                          })}
                          placeholder="Escreva os avisos para passar na tela..."
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* REGRAS DO CANAL */}
                  {selectedInst.widgetId === 'twitch-rules' && (
                    <div className="space-y-3 border-t border-white/5 pt-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Scroll className="h-3.5 w-3.5" />
                          <span>Regras do Canal</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const current = Array.isArray(selectedInst.config?.rules) ? selectedInst.config.rules : [];
                            const updated = [...current, `Regra ${current.length + 1}`];
                            onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, rules: updated }
                            });
                          }}
                          className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 rounded text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Regra</span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {(Array.isArray(selectedInst.config?.rules) ? selectedInst.config.rules : []).length === 0 ? (
                          <div className="text-[10px] text-slate-500 font-mono italic text-center py-2">
                            Nenhuma regra cadastrada. Clique em "+ Regra" para adicionar.
                          </div>
                        ) : (
                          (selectedInst.config.rules).map((rule, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                              <input
                                type="text"
                                value={rule}
                                onChange={(e) => {
                                  const updated = [...selectedInst.config.rules];
                                  updated[idx] = e.target.value;
                                  onUpdateInstance(selectedInst.id, {
                                    config: { ...selectedInst.config, rules: updated }
                                  });
                                }}
                                className="flex-1 bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = selectedInst.config.rules.filter((_, i) => i !== idx);
                                  onUpdateInstance(selectedInst.id, {
                                    config: { ...selectedInst.config, rules: updated }
                                  });
                                }}
                                className="p-1 text-slate-500 hover:text-rose-400 shrink-0 cursor-pointer"
                                title="Remover regra"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* COMANDOS DE CHAT */}
                  {selectedInst.widgetId === 'twitch-commands-list' && (
                    <div className="space-y-3 border-t border-white/5 pt-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                          <Terminal className="h-3.5 w-3.5" />
                          <span>Comandos do Chat</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const current = Array.isArray(selectedInst.config?.commands) ? selectedInst.config.commands : [];
                            const updated = [...current, `!comando${current.length + 1}`];
                            onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, commands: updated }
                            });
                          }}
                          className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 rounded text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Comando</span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {(Array.isArray(selectedInst.config?.commands) ? selectedInst.config.commands : []).length === 0 ? (
                          <div className="text-[10px] text-slate-500 font-mono italic text-center py-2">
                            Nenhum comando cadastrado. Clique em "+ Comando" para adicionar.
                          </div>
                        ) : (
                          (selectedInst.config.commands).map((cmd, idx) => {
                            const val = typeof cmd === 'string' ? cmd : cmd.name || cmd.command || '';
                            return (
                              <div key={idx} className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => {
                                    const updated = [...selectedInst.config.commands];
                                    updated[idx] = e.target.value;
                                    onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, commands: updated }
                                    });
                                  }}
                                  placeholder="!comando"
                                  className="flex-1 bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-purple-300 font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = selectedInst.config.commands.filter((_, i) => i !== idx);
                                    onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, commands: updated }
                                    });
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-400 shrink-0 cursor-pointer"
                                  title="Remover comando"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* VALORES - Only if configurable values exist (goals, counters, uptime, etc.) */}
                  {(selectedInst.widgetId?.includes('goal') || selectedInst.widgetId?.includes('counter') || selectedInst.widgetId?.includes('uptime')) && (
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Valores</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono block mb-1">Valor Inicial</label>
                          <input
                            type="number"
                            value={selectedInst.config?.startValue !== undefined ? selectedInst.config.startValue : 0}
                            onChange={(e) => onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, startValue: parseInt(e.target.value) || 0 }
                            })}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                          />
                        </div>
                        {selectedInst.widgetId?.includes('goal') && (
                          <div>
                            <label className="text-[10px] text-slate-400 font-mono block mb-1">Valor Meta</label>
                            <input
                              type="number"
                              value={selectedInst.config?.targetValue !== undefined ? selectedInst.config.targetValue : 50}
                              onChange={(e) => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, targetValue: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* APARÊNCIA & FUNDO DO OBJETO SELECIONADO */}
                  <div className="space-y-3 border-t border-white/5 pt-3">
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Aparência & Fundo do Objeto</div>
                    
                    {/* Modo do Fundo: Normal, Transparente, Translúcido, Blur */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-mono block">Modo do Fundo</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateInstance(selectedInst.id, {
                            config: {
                              ...selectedInst.config,
                              effBgActiveType: 'bg-solid',
                              effGlassActiveType: 'none',
                              isTransparent: false,
                              backgroundColor: selectedInst.config?.backgroundColor && selectedInst.config.backgroundColor !== 'transparent' ? selectedInst.config.backgroundColor : '#111827'
                            }
                          })}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                            (!selectedInst.config?.effBgActiveType || selectedInst.config?.effBgActiveType === 'bg-solid') && !selectedInst.config?.isTransparent && selectedInst.config?.effGlassActiveType !== 'glass-blur' && selectedInst.config?.effGlassActiveType !== 'glass-translucent' && selectedInst.config?.effBgActiveType !== 'bg-transparent' && selectedInst.config?.backgroundColor !== 'transparent'
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          Normal
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateInstance(selectedInst.id, {
                            config: {
                              ...selectedInst.config,
                              effBgActiveType: 'bg-transparent',
                              effGlassActiveType: 'none',
                              isTransparent: true,
                              backgroundColor: 'transparent'
                            }
                          })}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                            selectedInst.config?.effBgActiveType === 'bg-transparent' || selectedInst.config?.backgroundColor === 'transparent' || selectedInst.config?.isTransparent
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          Transparente
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateInstance(selectedInst.id, {
                            config: {
                              ...selectedInst.config,
                              effGlassActiveType: 'glass-translucent',
                              effBgActiveType: 'none',
                              isTransparent: false
                            }
                          })}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                            selectedInst.config?.effGlassActiveType === 'glass-translucent'
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          Translúcido
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateInstance(selectedInst.id, {
                            config: {
                              ...selectedInst.config,
                              effGlassActiveType: 'glass-blur',
                              effBgActiveType: 'none',
                              isTransparent: false
                            }
                          })}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                            selectedInst.config?.effGlassActiveType === 'glass-blur'
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          Blur
                        </button>
                      </div>
                    </div>

                    {/* Cores Básicas (Texto e Fundo) */}
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Cor do Texto</label>
                        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg p-1">
                          <input
                            type="color"
                            value={selectedInst.config?.textColor || '#ffffff'}
                            onChange={(e) => onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, textColor: e.target.value }
                            })}
                            className="h-5 w-7 rounded border border-white/10 bg-transparent cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={selectedInst.config?.textColor || '#ffffff'}
                            onChange={(e) => onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, textColor: e.target.value }
                            })}
                            className="w-full bg-transparent border-0 text-[10px] font-mono text-white p-0 uppercase"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Cor de Fundo</label>
                        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg p-1">
                          <input
                            type="color"
                            value={selectedInst.config?.backgroundColor && selectedInst.config.backgroundColor !== 'transparent' ? selectedInst.config.backgroundColor : '#000000'}
                            onChange={(e) => onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, backgroundColor: e.target.value, isTransparent: false }
                            })}
                            className="h-5 w-7 rounded border border-white/10 bg-transparent cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={selectedInst.config?.backgroundColor || '#000000'}
                            onChange={(e) => onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, backgroundColor: e.target.value }
                            })}
                            className="w-full bg-transparent border-0 text-[10px] font-mono text-white p-0 uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Background Galeria / Imagem de Fundo do Objeto */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setElementGalleryOpen(true)}
                          className="flex-1 py-1.5 px-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-xs font-bold text-purple-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Palette className="h-3.5 w-3.5 text-purple-400" />
                          <span>Background (Galeria)</span>
                        </button>

                        {(selectedInst.config?.bgImage || selectedInst.config?.backgroundImage) && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextConfig = { ...(selectedInst.config || {}) };
                              delete nextConfig.bgImage;
                              delete nextConfig.backgroundImage;
                              onUpdateInstance(selectedInst.id, { config: nextConfig });
                            }}
                            className="p-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg text-rose-300 text-[10px] font-bold cursor-pointer"
                            title="Remover Imagem de Fundo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {(selectedInst.config?.bgImage || selectedInst.config?.backgroundImage) && (
                        <div className="h-10 w-full rounded-lg border border-white/10 bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url("${selectedInst.config.bgImage || selectedInst.config.backgroundImage}")` }} />
                      )}
                    </div>

                    {/* REQUISITO 4: BORDA (Sem Borda vs Com Borda) */}
                    <div className="space-y-2 border-t border-white/5 pt-2.5">
                      <label className="text-[10px] text-slate-400 font-mono block">Borda do Objeto</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, showBorder: false }
                          })}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                            selectedInst.config?.showBorder === false
                              ? 'bg-rose-600/30 border-rose-500/50 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          Sem Borda
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, showBorder: true }
                          })}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                            selectedInst.config?.showBorder !== false
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          Com Borda
                        </button>
                      </div>

                      {/* Opções de borda visíveis SOMENTE quando 'Com borda' estiver ativo */}
                      {selectedInst.config?.showBorder !== false && (
                        <div className="space-y-2 pl-2 border-l-2 border-purple-500/40 pt-1">
                          <div className="grid grid-cols-2 gap-2 items-center">
                            <span className="text-[10px] text-slate-400 font-mono">Cor da Borda</span>
                            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg p-1">
                              <input
                                type="color"
                                value={selectedInst.config?.borderColor || '#ffffff'}
                                onChange={(e) => onUpdateInstance(selectedInst.id, {
                                  config: { ...selectedInst.config, borderColor: e.target.value }
                                })}
                                className="h-5 w-7 rounded border border-white/10 bg-transparent cursor-pointer p-0"
                              />
                              <input
                                type="text"
                                value={selectedInst.config?.borderColor || '#ffffff'}
                                onChange={(e) => onUpdateInstance(selectedInst.id, {
                                  config: { ...selectedInst.config, borderColor: e.target.value }
                                })}
                                className="w-full bg-transparent border-0 text-[10px] font-mono text-white p-0 uppercase"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 font-mono block mb-1">Espessura (px)</label>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={parseInt(selectedInst.config?.borderWidth) || 1}
                                onChange={(e) => onUpdateInstance(selectedInst.id, {
                                  config: { ...selectedInst.config, borderWidth: `${e.target.value}px` }
                                })}
                                className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-mono block mb-1">Estilo da Borda</label>
                              <select
                                value={selectedInst.config?.borderStyle || 'solid'}
                                onChange={(e) => onUpdateInstance(selectedInst.id, {
                                  config: { ...selectedInst.config, borderStyle: e.target.value }
                                })}
                                className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                              >
                                <option value="solid">Sólido</option>
                                <option value="dashed">Tracejado</option>
                                <option value="dotted">Pontilhado</option>
                                <option value="double">Duplo</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-slate-300 font-mono">
                              <span>Arredondamento</span>
                              <span>{selectedInst.config?.borderRadius || '12px'}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="32"
                              value={parseInt(selectedInst.config?.borderRadius) || 12}
                              onChange={(e) => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, borderRadius: `${e.target.value}px` }
                              })}
                              className="w-full accent-purple-600 h-1 bg-black/40 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* REQUISITO 1: EFEITOS - BOTÕES PEQUENOS E COMPACTOS (SEM SELECTS) */}
                    <div className="border-t border-white/5 pt-2.5 space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowEffectsGroup(prev => !prev)}
                        className="w-full py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-400" />
                          <span>Efeitos</span>
                        </div>
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/30">
                          {showEffectsGroup ? 'Ocultar' : 'Expandir'}
                        </span>
                      </button>

                      {showEffectsGroup && (
                        <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-3 animate-fade-in text-left">
                          {/* Gradiente de Fundo */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-mono block">Gradiente de Fundo</label>
                            <div className="flex flex-wrap gap-1">
                              {[
                                { id: 'none', label: 'Nenhum' },
                                { id: 'gradient-linear', label: 'Linear' },
                                { id: 'gradient-radial', label: 'Radial' },
                                { id: 'gradient-conic', label: 'Cônico' },
                                { id: 'gradient-3-colors', label: '3 Cores' },
                                { id: 'gradient-smooth', label: 'Suave' },
                                { id: 'gradient-intense', label: 'Intenso' },
                              ].map((item) => {
                                const active = (selectedInst.config?.effGradientActiveType || 'none') === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, effGradientActiveType: item.id }
                                    })}
                                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                      active
                                        ? 'bg-purple-600 border-purple-400 text-white'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Efeito Vidro / Glass */}
                          <div className="space-y-1 pt-1 border-t border-white/5">
                            <label className="text-[10px] text-slate-400 font-mono block">Efeito Vidro / Glass</label>
                            <div className="flex flex-wrap gap-1">
                              {[
                                { id: 'none', label: 'Nenhum' },
                                { id: 'glass-normal', label: 'Normal' },
                                { id: 'glass-dark', label: 'Escuro' },
                                { id: 'glass-light', label: 'Claro' },
                                { id: 'glass-frosted', label: 'Frosted' },
                                { id: 'glass-translucent', label: 'Translúcido' },
                                { id: 'glass-blur', label: 'Desfoque' },
                              ].map((item) => {
                                const active = (selectedInst.config?.effGlassActiveType || 'none') === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, effGlassActiveType: item.id }
                                    })}
                                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                      active
                                        ? 'bg-purple-600 border-purple-400 text-white'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Luz / Glow */}
                          <div className="space-y-1 pt-1 border-t border-white/5">
                            <label className="text-[10px] text-slate-400 font-mono block">Luz / Glow</label>
                            <div className="flex flex-wrap gap-1">
                              {[
                                { id: 'none', label: 'Nenhum' },
                                { id: 'glow-normal', label: 'Normal' },
                                { id: 'glow-soft', label: 'Suave' },
                                { id: 'glow-strong', label: 'Forte' },
                                { id: 'glow-neon', label: 'Neon' },
                              ].map((item) => {
                                const active = (selectedInst.config?.effGlowActiveType || 'none') === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, effGlowActiveType: item.id }
                                    })}
                                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                      active
                                        ? 'bg-purple-600 border-purple-400 text-white'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Sombras */}
                          <div className="space-y-1 pt-1 border-t border-white/5">
                            <label className="text-[10px] text-slate-400 font-mono block">Sombras</label>
                            <div className="flex flex-wrap gap-1">
                              {[
                                { id: 'none', label: 'Nenhuma' },
                                { id: 'shadow-soft', label: 'Suave' },
                                { id: 'shadow-strong', label: 'Forte' },
                                { id: 'shadow-drop', label: 'Projetada' },
                              ].map((item) => {
                                const active = (selectedInst.config?.effShadowActiveType || 'none') === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, effShadowActiveType: item.id }
                                    })}
                                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                      active
                                        ? 'bg-purple-600 border-purple-400 text-white'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* REQUISITO 2: FONTES - BOTÕES COMPACTOS SEM DIVS GRANDES */}
                    <div className="border-t border-white/5 pt-2.5 space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowFontsGroup(prev => !prev)}
                        className="w-full py-2 px-3 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4 text-cyan-400" />
                          <span>Fontes</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-500/30 truncate max-w-[120px]">
                          {selectedInst.config?.fontFamily ? selectedInst.config.fontFamily : 'Padrão'}
                        </span>
                      </button>

                      {showFontsGroup && (
                        <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-3 animate-fade-in text-left">
                          {/* Categoria - Botões Pequenos Compactos (Sem DIV grande) */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-mono block">Categoria</label>
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(FONT_CATEGORIES).map(cat => {
                                const isCatSelected = selectedFontCategory === cat;
                                return (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                      setSelectedFontCategory(cat);
                                      const defaultFont = FONT_CATEGORIES[cat][0];
                                      onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, fontFamily: defaultFont }
                                      });
                                    }}
                                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all border cursor-pointer ${
                                      isCatSelected
                                        ? 'bg-purple-600 border-purple-400 text-white font-bold'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Família da Fonte - Botões Pequenos (Exibidos somente após interação com categoria) */}
                          <div className="space-y-1.5 pt-2 border-t border-white/5">
                            <label className="text-[10px] text-slate-400 font-mono block">Família da Fonte</label>
                            <div className="flex flex-wrap gap-1">
                              {FONT_CATEGORIES[selectedFontCategory]?.map(font => {
                                const isFontSelected = (selectedInst.config?.fontFamily || FONT_CATEGORIES[selectedFontCategory][0]) === font;
                                return (
                                  <button
                                    key={font}
                                    type="button"
                                    onClick={() => onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, fontFamily: font }
                                    })}
                                    className={`px-2.5 py-1 rounded text-[11px] transition-all border cursor-pointer ${
                                      isFontSelected
                                        ? 'bg-cyan-600 border-cyan-400 text-white font-bold shadow-md'
                                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                    style={{ fontFamily: font }}
                                  >
                                    {font}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Tamanho (px) & Peso (Normal / Negrito em Botões) */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                            <div>
                              <label className="text-[10px] text-slate-400 font-mono block mb-1">Tamanho (px)</label>
                              <input
                                type="number"
                                value={parseInt(selectedInst.config?.fontSize) || 14}
                                onChange={(e) => onUpdateInstance(selectedInst.id, {
                                  config: { ...selectedInst.config, fontSize: `${Math.max(6, parseInt(e.target.value) || 14)}px` }
                                })}
                                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 font-mono block mb-1">Peso</label>
                              <div className="grid grid-cols-2 gap-1">
                                <button
                                  type="button"
                                  onClick={() => onUpdateInstance(selectedInst.id, {
                                    config: { ...selectedInst.config, fontWeight: 'normal' }
                                  })}
                                  className={`py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                    (selectedInst.config?.fontWeight || 'normal') === 'normal'
                                      ? 'bg-purple-600 border-purple-400 text-white'
                                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Normal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onUpdateInstance(selectedInst.id, {
                                    config: { ...selectedInst.config, fontWeight: 'bold' }
                                  })}
                                  className={`py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                    selectedInst.config?.fontWeight === 'bold'
                                      ? 'bg-purple-600 border-purple-400 text-white'
                                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Negrito
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* REQUISITO 3: ALINHAMENTO - EXACTLY 3 SMALL BUTTONS [ Esquerda ] [ Centro ] [ Direita ] */}
                          <div className="space-y-1 pt-2 border-t border-white/5">
                            <label className="text-[10px] text-slate-400 font-mono block">Alinhamento</label>
                            <div className="grid grid-cols-3 gap-1">
                              <button
                                type="button"
                                onClick={() => onUpdateInstance(selectedInst.id, {
                                  config: { ...selectedInst.config, textAlign: 'left' }
                                })}
                                className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  (selectedInst.config?.textAlign || 'left') === 'left'
                                    ? 'bg-purple-600 border-purple-400 text-white'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                }`}
                              >
                                <AlignLeft className="h-3 w-3" />
                                <span>Esquerda</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onUpdateInstance(selectedInst.id, {
                                  config: { ...selectedInst.config, textAlign: 'center' }
                                })}
                                className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  selectedInst.config?.textAlign === 'center'
                                    ? 'bg-purple-600 border-purple-400 text-white'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                }`}
                              >
                                <AlignCenter className="h-3 w-3" />
                                <span>Centro</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onUpdateInstance(selectedInst.id, {
                                  config: { ...selectedInst.config, textAlign: 'right' }
                                })}
                                className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  selectedInst.config?.textAlign === 'right'
                                    ? 'bg-purple-600 border-purple-400 text-white'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                }`}
                              >
                                <AlignRight className="h-3 w-3" />
                                <span>Direita</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-500 font-mono bg-black/20 border border-white/5 rounded-xl">
                  Selecione um elemento no Visualizador para configurar.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EFEITOS */}
          {activeTab === 'effects' && (
            <div className="space-y-4">
              {selectedInst ? (
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-4">
                  {/* Identificação do Alvo */}
                  <div className="p-2.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-xs">
                    <span className="text-[10px] font-mono text-purple-400 block uppercase tracking-wider">Alvo Configurado</span>
                    <div className="font-bold text-white truncate">{selectedInst.name}</div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      {selectedInst.elementKey && selectedInst.elementKey !== 'full_widget' 
                        ? `Componente Interno: ${selectedInst.elementKey}` 
                        : 'Widget Completa (Unidade Inteira)'}
                    </div>
                  </div>

                  {/* ANIMAÇÕES */}
                  <div className="space-y-3 border-t border-white/5 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Efeito de Animação</div>
                      {selectedInst.config?.animationName && selectedInst.config?.animationName !== 'none' && (
                        <button
                          onClick={() => onUpdateInstance(selectedInst.id, {
                            config: {
                              ...selectedInst.config,
                              animationType: 'none',
                              animationName: 'none'
                            }
                          })}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 font-mono transition-all animate-fade-in"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    {/* Compact Categories of Animations */}
                    <div className="space-y-3">
                      {Object.entries(ANIMATION_CATEGORIES).map(([catKey, cat]) => {
                        const isTextTarget = selectedInst.elementKey && selectedInst.elementKey !== 'full_widget';
                        if (catKey === 'texto' && !isTextTarget) return null;

                        return (
                          <div key={catKey} className="space-y-1">
                            <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">{cat.label}</div>
                            <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                              {cat.animations.map(anim => {
                                const isActive = selectedInst.config?.animationName === anim.id;
                                return (
                                  <button
                                    key={anim.id}
                                    onClick={() => onUpdateInstance(selectedInst.id, {
                                      config: {
                                        ...selectedInst.config,
                                        animationType: catKey,
                                        animationName: anim.id
                                      }
                                    })}
                                    className={`text-[9px] px-2 py-1 rounded transition-all font-medium border ${
                                      isActive
                                        ? 'bg-purple-600/30 border-purple-500/50 text-white font-bold shadow-md'
                                        : 'bg-black/40 border-white/5 text-slate-300 hover:border-white/15 hover:bg-black/60'
                                    }`}
                                  >
                                    {anim.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Parameter Sliders only show after animation is selected */}
                    {selectedInst.config?.animationName && selectedInst.config.animationName !== 'none' && (
                      <div className="bg-purple-600/5 border border-purple-500/15 rounded-lg p-2.5 space-y-2.5 mt-2.5 animate-fade-in">
                        <div className="text-[9px] font-mono text-purple-300 uppercase tracking-wider">
                          Ajustes: {
                            Object.values(ANIMATION_CATEGORIES)
                              .flatMap(c => c.animations)
                              .find(a => a.id === selectedInst.config.animationName)?.name || selectedInst.config.animationName
                          }
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mb-0.5">
                              <span>Duração / Velocidade</span>
                              <span>{selectedInst.config?.animationDuration !== undefined ? selectedInst.config.animationDuration : 1.5}s ({(1.5 / (selectedInst.config?.animationDuration || 1.5)).toFixed(1)}x)</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="10"
                              step="0.1"
                              value={selectedInst.config?.animationDuration !== undefined ? selectedInst.config.animationDuration : 1.5}
                              onChange={(e) => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, animationDuration: parseFloat(e.target.value) }
                              })}
                              className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mb-0.5">
                              <span>Atraso p/ Iniciar</span>
                              <span>{selectedInst.config?.animationDelay !== undefined ? selectedInst.config.animationDelay : 0}s</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              step="0.1"
                              value={selectedInst.config?.animationDelay !== undefined ? selectedInst.config.animationDelay : 0}
                              onChange={(e) => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, animationDelay: parseFloat(e.target.value) }
                              })}
                              className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mb-0.5">
                              <span>Permanência</span>
                              <span>{selectedInst.config?.animationStay !== undefined ? selectedInst.config.animationStay : 0}s</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="20"
                              step="0.5"
                              value={selectedInst.config?.animationStay !== undefined ? selectedInst.config.animationStay : 0}
                              onChange={(e) => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, animationStay: parseFloat(e.target.value) }
                              })}
                              className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mb-0.5">
                              <span>Intervalo Repetir</span>
                              <span>{selectedInst.config?.animationInterval !== undefined ? selectedInst.config.animationInterval : 0}s</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="15"
                              step="0.5"
                              value={selectedInst.config?.animationInterval !== undefined ? selectedInst.config.animationInterval : 0}
                              onChange={(e) => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, animationInterval: parseFloat(e.target.value) }
                              })}
                              className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[9px] text-slate-400 font-mono block mb-0.5">Repetição</label>
                            <select
                              value={selectedInst.config?.animationRepeat || 'infinite'}
                              onChange={(e) => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, animationRepeat: e.target.value }
                              })}
                              className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-1 text-[10px] text-white"
                            >
                              <option value="infinite" className="bg-slate-900">Infinito</option>
                              <option value="1" className="bg-slate-900">1 Vez</option>
                              <option value="2" className="bg-slate-900">2 Vezes</option>
                              <option value="3" className="bg-slate-900">3 Vezes</option>
                              <option value="5" className="bg-slate-900">5 Vezes</option>
                              <option value="10" className="bg-slate-900">10 Vezes</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 font-mono block mb-0.5">Direção</label>
                            <select
                              value={selectedInst.config?.animationDirection || 'normal'}
                              onChange={(e) => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, animationDirection: e.target.value }
                              })}
                              className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-1 text-[10px] text-white"
                            >
                              <option value="normal" className="bg-slate-900">Normal</option>
                              <option value="reverse" className="bg-slate-900">Inversa</option>
                              <option value="alternate" className="bg-slate-900">Alternada</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* VISUAL EFFECTS SECTIONS */}
                  {Object.entries(EFFECT_GROUPS).map(([groupKey, group]) => {
                    const currentValue = selectedInst.config?.[group.field] || 'none';

                    return (
                      <div key={groupKey} className="space-y-1.5 pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] text-slate-300 font-mono uppercase tracking-wider">{group.label}</div>
                          {currentValue !== 'none' && (
                            <button
                              onClick={() => onUpdateInstance(selectedInst.id, {
                                config: { ...selectedInst.config, [group.field]: 'none' }
                              })}
                              className="text-[9px] text-rose-400 hover:text-rose-300 font-mono"
                            >
                              Limpar
                            </button>
                          )}
                        </div>

                        {/* Grid of options */}
                        <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                          {group.options.map(opt => {
                            const isActive = currentValue === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => onUpdateInstance(selectedInst.id, {
                                  config: { ...selectedInst.config, [group.field]: opt.id }
                                })}
                                className={`text-[9px] px-2 py-1 rounded transition-all font-medium border ${
                                  isActive
                                    ? 'bg-purple-600/30 border-purple-500/50 text-white font-bold shadow-md'
                                    : 'bg-black/40 border-white/5 text-slate-300 hover:border-white/15 hover:bg-black/60'
                                }`}
                              >
                                {opt.name}
                              </button>
                            );
                          })}
                        </div>

                        {/* Specific parameters shown only if selected */}
                        {currentValue !== 'none' && (
                          <div className="bg-black/20 border border-white/5 rounded-lg p-2.5 mt-1.5 space-y-2.5 animate-fade-in">
                            {groupKey === 'bg' && (
                              <>
                                {(currentValue === 'bg-solid' || currentValue === 'bg-semi-transparent') && (
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[9px] text-slate-400 font-mono">Cor de Fundo</span>
                                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded px-1.5 py-0.5">
                                      <input
                                        type="color"
                                        value={selectedInst.config?.effBgColor || '#000000'}
                                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                                          config: { ...selectedInst.config, effBgColor: e.target.value }
                                        })}
                                        className="h-5 w-8 border-0 bg-transparent cursor-pointer rounded"
                                      />
                                      <span className="text-[9px] text-slate-300 font-mono uppercase">
                                        {selectedInst.config?.effBgColor || '#000000'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {currentValue === 'bg-semi-transparent' && (
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                      <span>Opacidade do Fundo</span>
                                      <span>{selectedInst.config?.effBgOpacity !== undefined ? selectedInst.config.effBgOpacity : 50}%</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={selectedInst.config?.effBgOpacity !== undefined ? selectedInst.config.effBgOpacity : 50}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effBgOpacity: parseInt(e.target.value) }
                                      })}
                                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                    />
                                  </div>
                                )}
                                {currentValue === 'bg-opacity' && (
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                      <span>Opacidade do Elemento</span>
                                      <span>{selectedInst.config?.effOpacity !== undefined ? selectedInst.config.effOpacity : 100}%</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={selectedInst.config?.effOpacity !== undefined ? selectedInst.config.effOpacity : 100}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effOpacity: parseInt(e.target.value) }
                                      })}
                                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                    />
                                  </div>
                                )}
                              </>
                            )}

                            {groupKey === 'gradient' && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-mono block mb-0.5">Cor Inicial</label>
                                    <input
                                      type="color"
                                      value={selectedInst.config?.effGradientStart || '#a855f7'}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effGradientStart: e.target.value }
                                      })}
                                      className="h-6 w-full border-0 bg-transparent cursor-pointer rounded"
                                    />
                                  </div>
                                  {currentValue !== 'gradient-multi' && (
                                    <div>
                                      <label className="text-[9px] text-slate-400 font-mono block mb-0.5">Cor Final</label>
                                      <input
                                        type="color"
                                        value={selectedInst.config?.effGradientEnd || '#1e1b4b'}
                                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                                          config: { ...selectedInst.config, effGradientEnd: e.target.value }
                                        })}
                                        className="h-6 w-full border-0 bg-transparent cursor-pointer rounded"
                                      />
                                    </div>
                                  )}
                                </div>

                                {currentValue === 'gradient-3-colors' && (
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-mono block mb-0.5">Cor Intermediária</label>
                                    <input
                                      type="color"
                                      value={selectedInst.config?.effGradientMiddle || '#ec4899'}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effGradientMiddle: e.target.value }
                                      })}
                                      className="h-6 w-full border-0 bg-transparent cursor-pointer rounded"
                                    />
                                  </div>
                                )}

                                {currentValue !== 'gradient-radial' && currentValue !== 'gradient-conic' && (
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                      <span>Ângulo do Gradiente</span>
                                      <span>{selectedInst.config?.effGradientAngle || 135}°</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="360"
                                      value={selectedInst.config?.effGradientAngle || 135}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effGradientAngle: parseInt(e.target.value) }
                                      })}
                                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {groupKey === 'glass' && (
                              <div className="space-y-1.5">
                                <div className="space-y-0.5">
                                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                    <span>Intensidade do Desfoque</span>
                                    <span>{selectedInst.config?.effBackdropBlur !== undefined ? selectedInst.config.effBackdropBlur : 8}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="24"
                                    value={selectedInst.config?.effBackdropBlur !== undefined ? selectedInst.config.effBackdropBlur : 8}
                                    onChange={(e) => onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, effBackdropBlur: parseInt(e.target.value) }
                                    })}
                                    className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                  />
                                </div>

                                {(currentValue === 'glass-frosted' || currentValue === 'glass-normal' || currentValue === 'glass-translucent') && (
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                      <span>Opacidade / Brilho do Vidro</span>
                                      <span>{selectedInst.config?.effGlassOpacity !== undefined ? selectedInst.config.effGlassOpacity : (selectedInst.config?.effGlassIntensity !== undefined ? selectedInst.config.effGlassIntensity : 15)}%</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="5"
                                      max="90"
                                      value={selectedInst.config?.effGlassOpacity !== undefined ? selectedInst.config.effGlassOpacity : (selectedInst.config?.effGlassIntensity !== undefined ? selectedInst.config.effGlassIntensity : 15)}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { 
                                          ...selectedInst.config, 
                                          effGlassOpacity: parseInt(e.target.value),
                                          effGlassIntensity: parseInt(e.target.value) 
                                        }
                                      })}
                                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                    />
                                  </div>
                                )}

                                {currentValue === 'glass-colored' && (
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[9px] text-slate-400 font-mono">Cor do Vidro</span>
                                    <input
                                      type="color"
                                      value={selectedInst.config?.effGlassColor || '#a855f7'}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effGlassColor: e.target.value }
                                      })}
                                      className="h-5 w-8 border-0 bg-transparent cursor-pointer rounded"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {groupKey === 'glow' && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-mono block mb-0.5">Cor Principal</label>
                                    <input
                                      type="color"
                                      value={selectedInst.config?.effShadowColor || '#a855f7'}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effShadowColor: e.target.value }
                                      })}
                                      className="h-6 w-full border-0 bg-transparent cursor-pointer rounded"
                                    />
                                  </div>
                                  {currentValue === 'glow-colored' && (
                                    <div>
                                      <label className="text-[9px] text-slate-400 font-mono block mb-0.5">Segunda Cor</label>
                                      <input
                                        type="color"
                                        value={selectedInst.config?.effShadowColor2 || '#ec4899'}
                                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                                          config: { ...selectedInst.config, effShadowColor2: e.target.value }
                                        })}
                                        className="h-6 w-full border-0 bg-transparent cursor-pointer rounded"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-0.5">
                                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                    <span>Intensidade / Alcance</span>
                                    <span>{selectedInst.config?.effShadowIntensity !== undefined ? selectedInst.config.effShadowIntensity : 8}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="2"
                                    max="40"
                                    value={selectedInst.config?.effShadowIntensity !== undefined ? selectedInst.config.effShadowIntensity : 8}
                                    onChange={(e) => onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, effShadowIntensity: parseInt(e.target.value) }
                                    })}
                                    className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                  />
                                </div>
                              </div>
                            )}

                            {groupKey === 'shadow' && (
                              <div className="space-y-2">
                                {currentValue === 'shadow-drop' ? (
                                  <>
                                    <div className="grid grid-cols-3 gap-1.5">
                                      <div>
                                        <label className="text-[8px] text-slate-400 font-mono block">Offset X</label>
                                        <input
                                          type="number"
                                          value={selectedInst.config?.effShadowX !== undefined ? selectedInst.config.effShadowX : 4}
                                          onChange={(e) => onUpdateInstance(selectedInst.id, {
                                            config: { ...selectedInst.config, effShadowX: parseInt(e.target.value) || 0 }
                                          })}
                                          className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white font-mono"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[8px] text-slate-400 font-mono block">Offset Y</label>
                                        <input
                                          type="number"
                                          value={selectedInst.config?.effShadowY !== undefined ? selectedInst.config.effShadowY : 4}
                                          onChange={(e) => onUpdateInstance(selectedInst.id, {
                                            config: { ...selectedInst.config, effShadowY: parseInt(e.target.value) || 0 }
                                          })}
                                          className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white font-mono"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[8px] text-slate-400 font-mono block">Desfoque</label>
                                        <input
                                          type="number"
                                          value={selectedInst.config?.effShadowBlur !== undefined ? selectedInst.config.effShadowBlur : 8}
                                          onChange={(e) => onUpdateInstance(selectedInst.id, {
                                            config: { ...selectedInst.config, effShadowBlur: parseInt(e.target.value) || 0 }
                                          })}
                                          className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white font-mono"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[9px] text-slate-400 font-mono">Cor da Sombra</span>
                                      <input
                                        type="color"
                                        value={selectedInst.config?.effShadowColor || '#000000'}
                                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                                          config: { ...selectedInst.config, effShadowColor: e.target.value }
                                        })}
                                        className="h-5 w-8 border-0 bg-transparent cursor-pointer rounded"
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {(currentValue === 'shadow-inner' || currentValue === 'shadow-long' || currentValue === 'shadow-diffuse') && (
                                      <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                          <span>Extensão</span>
                                          <span>{selectedInst.config?.effShadowIntensity !== undefined ? selectedInst.config.effShadowIntensity : 10}px</span>
                                        </div>
                                        <input
                                          type="range"
                                          min="2"
                                          max="50"
                                          value={selectedInst.config?.effShadowIntensity !== undefined ? selectedInst.config.effShadowIntensity : 10}
                                          onChange={(e) => onUpdateInstance(selectedInst.id, {
                                            config: { ...selectedInst.config, effShadowIntensity: parseInt(e.target.value) }
                                          })}
                                          className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                        />
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                          <span className="text-[9px] text-slate-400 font-mono">Cor da Sombra</span>
                                          <input
                                            type="color"
                                            value={selectedInst.config?.effShadowColor || '#000000'}
                                            onChange={(e) => onUpdateInstance(selectedInst.id, {
                                              config: { ...selectedInst.config, effShadowColor: e.target.value }
                                            })}
                                            className="h-5 w-8 border-0 bg-transparent cursor-pointer rounded"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}

                            {groupKey === 'filter' && (
                              <div className="space-y-1">
                                {currentValue === 'filter-hue' ? (
                                  <>
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                      <span>Rotação de Matiz (Hue)</span>
                                      <span>{selectedInst.config?.effHueRotate || 90}°</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="360"
                                      value={selectedInst.config?.effHueRotate || 90}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effHueRotate: parseInt(e.target.value) }
                                      })}
                                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                    />
                                  </>
                                ) : (
                                  <>
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                      <span>Intensidade / Força</span>
                                      <span>{
                                        currentValue === 'filter-grayscale' ? (selectedInst.config?.effGrayscale !== undefined ? selectedInst.config.effGrayscale : 100) :
                                        currentValue === 'filter-sepia' ? (selectedInst.config?.effSepia !== undefined ? selectedInst.config.effSepia : 100) :
                                        currentValue === 'filter-saturate' ? (selectedInst.config?.effSaturation !== undefined ? selectedInst.config.effSaturation : 150) :
                                        currentValue === 'filter-desaturate' ? (selectedInst.config?.effDesaturate !== undefined ? selectedInst.config.effDesaturate : 50) :
                                        currentValue === 'filter-contrast' ? (selectedInst.config?.effContrast !== undefined ? selectedInst.config.effContrast : 130) :
                                        currentValue === 'filter-brightness' ? (selectedInst.config?.effBrightness !== undefined ? selectedInst.config.effBrightness : 120) :
                                        currentValue === 'filter-invert' ? (selectedInst.config?.effInvert !== undefined ? selectedInst.config.effInvert : 100) :
                                        currentValue === 'filter-blur' ? (selectedInst.config?.effBlur !== undefined ? selectedInst.config.effBlur : 4) : 100
                                      }{
                                        currentValue === 'filter-blur' ? 'px' : '%'
                                      }</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max={
                                        currentValue === 'filter-blur' ? "20" :
                                        currentValue === 'filter-saturate' || currentValue === 'filter-contrast' || currentValue === 'filter-brightness' ? "300" : "100"
                                      }
                                      value={
                                        currentValue === 'filter-grayscale' ? (selectedInst.config?.effGrayscale !== undefined ? selectedInst.config.effGrayscale : 100) :
                                        currentValue === 'filter-sepia' ? (selectedInst.config?.effSepia !== undefined ? selectedInst.config.effSepia : 100) :
                                        currentValue === 'filter-saturate' ? (selectedInst.config?.effSaturation !== undefined ? selectedInst.config.effSaturation : 150) :
                                        currentValue === 'filter-desaturate' ? (selectedInst.config?.effDesaturate !== undefined ? selectedInst.config.effDesaturate : 50) :
                                        currentValue === 'filter-contrast' ? (selectedInst.config?.effContrast !== undefined ? selectedInst.config.effContrast : 130) :
                                        currentValue === 'filter-brightness' ? (selectedInst.config?.effBrightness !== undefined ? selectedInst.config.effBrightness : 120) :
                                        currentValue === 'filter-invert' ? (selectedInst.config?.effInvert !== undefined ? selectedInst.config.effInvert : 100) :
                                        currentValue === 'filter-blur' ? (selectedInst.config?.effBlur !== undefined ? selectedInst.config.effBlur : 4) : 100
                                      }
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const keyMap = {
                                          'filter-grayscale': 'effGrayscale',
                                          'filter-sepia': 'effSepia',
                                          'filter-saturate': 'effSaturation',
                                          'filter-desaturate': 'effDesaturate',
                                          'filter-contrast': 'effContrast',
                                          'filter-brightness': 'effBrightness',
                                          'filter-invert': 'effInvert',
                                          'filter-blur': 'effBlur'
                                        };
                                        onUpdateInstance(selectedInst.id, {
                                          config: { ...selectedInst.config, [keyMap[currentValue]]: val }
                                        });
                                      }}
                                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                    />
                                  </>
                                )}
                              </div>
                            )}

                            {groupKey === 'reflect' && (currentValue === 'reflect-normal' || currentValue === 'reflect-transparent') && (
                              <div className="space-y-0.5">
                                <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                  <span>Opacidade do Reflexo</span>
                                  <span>{selectedInst.config?.effReflectionOpacity !== undefined ? selectedInst.config.effReflectionOpacity : 30}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="5"
                                  max="80"
                                  value={selectedInst.config?.effReflectionOpacity !== undefined ? selectedInst.config.effReflectionOpacity : 30}
                                  onChange={(e) => onUpdateInstance(selectedInst.id, {
                                    config: { ...selectedInst.config, effReflectionOpacity: parseInt(e.target.value) }
                                  })}
                                  className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                />
                              </div>
                            )}

                            {groupKey === 'border' && (
                              <div className="space-y-2">
                                {currentValue !== 'border-radius' && (
                                  <>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[9px] text-slate-400 font-mono">Cor da Borda</span>
                                      <input
                                        type="color"
                                        value={selectedInst.config?.effBorderColor || '#ffffff'}
                                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                                          config: { ...selectedInst.config, effBorderColor: e.target.value }
                                        })}
                                        className="h-5 w-8 border-0 bg-transparent cursor-pointer rounded"
                                      />
                                    </div>

                                    <div className="space-y-0.5">
                                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                        <span>Espessura da Borda</span>
                                        <span>{selectedInst.config?.effBorderThickness !== undefined ? selectedInst.config.effBorderThickness : 2}px</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={selectedInst.config?.effBorderThickness !== undefined ? selectedInst.config.effBorderThickness : 2}
                                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                                          config: { ...selectedInst.config, effBorderThickness: parseInt(e.target.value) }
                                        })}
                                        className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                      />
                                    </div>
                                  </>
                                )}

                                {currentValue === 'border-glow' && (
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                      <span>Intensidade do Glow</span>
                                      <span>{selectedInst.config?.effBorderGlow || 8}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="2"
                                      max="20"
                                      value={selectedInst.config?.effBorderGlow || 8}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effBorderGlow: parseInt(e.target.value) }
                                      })}
                                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                    />
                                  </div>
                                )}

                                {currentValue === 'border-neon' && (
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                      <span>Intensidade do Neon</span>
                                      <span>{selectedInst.config?.effBorderNeon || 8}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="2"
                                      max="20"
                                      value={selectedInst.config?.effBorderNeon || 8}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effBorderNeon: parseInt(e.target.value) }
                                      })}
                                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                    />
                                  </div>
                                )}

                                {currentValue === 'border-gradient' && (
                                  <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div>
                                      <label className="text-[8px] text-slate-400 font-mono block">Início Gradiente</label>
                                      <input
                                        type="color"
                                        value={selectedInst.config?.effBorderGradStart || '#a855f7'}
                                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                                          config: { ...selectedInst.config, effBorderGradStart: e.target.value }
                                        })}
                                        className="h-6 w-full border-0 bg-transparent cursor-pointer rounded"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[8px] text-slate-400 font-mono block">Fim Gradiente</label>
                                      <input
                                        type="color"
                                        value={selectedInst.config?.effBorderGradEnd || '#ec4899'}
                                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                                          config: { ...selectedInst.config, effBorderGradEnd: e.target.value }
                                        })}
                                        className="h-6 w-full border-0 bg-transparent cursor-pointer rounded"
                                      />
                                    </div>
                                  </div>
                                )}

                                {currentValue === 'border-radius' && (
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                      <span>Raio (Radius)</span>
                                      <span>{selectedInst.config?.effBorderRadius !== undefined ? selectedInst.config.effBorderRadius : 12}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="40"
                                      value={selectedInst.config?.effBorderRadius !== undefined ? selectedInst.config.effBorderRadius : 12}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effBorderRadius: parseInt(e.target.value) }
                                      })}
                                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                             {groupKey === 'animBg' && (
                              <div className="space-y-2.5">
                                <div className="space-y-0.5">
                                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                    <span>Velocidade / Duração</span>
                                    <span>{selectedInst.config?.effAnimSpeed !== undefined ? selectedInst.config.effAnimSpeed : 2.5}s</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0.5"
                                    max="10"
                                    step="0.1"
                                    value={selectedInst.config?.effAnimSpeed !== undefined ? selectedInst.config.effAnimSpeed : 2.5}
                                    onChange={(e) => onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, effAnimSpeed: parseFloat(e.target.value) }
                                    })}
                                    className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mb-0.5">
                                      <span>Atraso Iniciar</span>
                                      <span>{selectedInst.config?.effAnimDelay !== undefined ? selectedInst.config.effAnimDelay : 0}s</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="10"
                                      step="0.1"
                                      value={selectedInst.config?.effAnimDelay !== undefined ? selectedInst.config.effAnimDelay : 0}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effAnimDelay: parseFloat(e.target.value) }
                                      })}
                                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mb-0.5">
                                      <span>Intervalo</span>
                                      <span>{selectedInst.config?.effAnimInterval !== undefined ? selectedInst.config.effAnimInterval : 0}s</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="15"
                                      step="0.5"
                                      value={selectedInst.config?.effAnimInterval !== undefined ? selectedInst.config.effAnimInterval : 0}
                                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                                        config: { ...selectedInst.config, effAnimInterval: parseFloat(e.target.value) }
                                      })}
                                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[9px] text-slate-400 font-mono block mb-0.5">Repetição</label>
                                  <select
                                    value={selectedInst.config?.effAnimRepeat || 'infinite'}
                                    onChange={(e) => onUpdateInstance(selectedInst.id, {
                                      config: { ...selectedInst.config, effAnimRepeat: e.target.value }
                                    })}
                                    className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-1 text-[10px] text-white"
                                  >
                                    <option value="infinite" className="bg-slate-900">Infinito</option>
                                    <option value="1" className="bg-slate-900">1 Vez</option>
                                    <option value="2" className="bg-slate-900">2 Vezes</option>
                                    <option value="3" className="bg-slate-900">3 Vezes</option>
                                    <option value="5" className="bg-slate-900">5 Vezes</option>
                                    <option value="10" className="bg-slate-900">10 Vezes</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-500 font-mono bg-black/20 border border-white/5 rounded-xl">
                  Selecione um elemento no Visualizador para configurar Efeitos e Animações.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BIBLIOTECA DE CRIAÇÃO */}
          {activeTab === 'gallery' && (() => {
            const textItems = [
              {
                id: 'text-title',
                name: 'Título Grande',
                category: 'Textos Editáveis',
                instanceData: { widgetId: 'library-text', name: 'Texto: Título', defaultConfig: { text: 'Título Novo', textType: 'title', textColor: '#ffffff', fontSize: '32px', fontFamily: 'Inter', fontWeight: 'bold' }, width: 320, height: 60 },
                icon: Type,
                iconColor: 'text-purple-400',
                colSpan: 'col-span-1'
              },
              {
                id: 'text-subtitle',
                name: 'Subtítulo',
                category: 'Textos Editáveis',
                instanceData: { widgetId: 'library-text', name: 'Texto: Subtítulo', defaultConfig: { text: 'Subtítulo Novo', textType: 'subtitle', textColor: '#e9d5ff', fontSize: '20px', fontFamily: 'Inter', fontWeight: 'semibold' }, width: 280, height: 44 },
                icon: Type,
                iconColor: 'text-purple-300',
                colSpan: 'col-span-1'
              },
              {
                id: 'text-paragraph',
                name: 'Parágrafo / Corpo de Texto',
                category: 'Textos Editáveis',
                instanceData: { widgetId: 'library-text', name: 'Texto: Parágrafo', defaultConfig: { text: 'Texto longo explicativo que pode ocupar múltiplas linhas.', textType: 'text', textColor: '#cbd5e1', fontSize: '14px', fontFamily: 'Inter' }, width: 280, height: 80 },
                icon: Type,
                iconColor: 'text-slate-400',
                colSpan: 'col-span-2'
              },
              {
                id: 'text-label',
                name: 'Etiqueta (Label Uppercase)',
                category: 'Textos Editáveis',
                instanceData: { widgetId: 'library-text', name: 'Texto: Label', defaultConfig: { text: 'NOVO SEGUIDOR', textType: 'label', textColor: '#c084fc', fontSize: '12px', fontFamily: 'Inter', fontWeight: 'bold' }, width: 140, height: 36 },
                icon: Type,
                iconColor: 'text-purple-400',
                colSpan: 'col-span-2'
              }
            ];

            const shapeItems = [
              { id: 'rectangle', label: 'Retângulo', icon: Square },
              { id: 'rounded-rectangle', label: 'R. Arred.', icon: Square },
              { id: 'square', label: 'Quadrado', icon: Square },
              { id: 'circle', label: 'Círculo', icon: Circle },
              { id: 'ellipse', label: 'Elipse', icon: Circle },
              { id: 'triangle', label: 'Triângulo', icon: Smile },
              { id: 'rhombus', label: 'Losango', icon: Smile },
              { id: 'pentagon', label: 'Pentágono', icon: Smile },
              { id: 'hexagon', label: 'Hexágono', icon: Smile },
              { id: 'star', label: 'Estrela', icon: Star },
              { id: 'heart', label: 'Coração', icon: Heart },
            ].map(shape => ({
              id: `shape-${shape.id}`,
              name: `Forma: ${shape.label}`,
              label: shape.label,
              category: 'Biblioteca de Formas',
              instanceData: {
                widgetId: 'library-shape',
                name: `Forma: ${shape.label}`,
                defaultConfig: { shapeType: shape.id, textColor: shape.id === 'star' ? '#f59e0b' : shape.id === 'heart' ? '#ef4444' : '#8b5cf6', borderRadius: shape.id === 'rounded-rectangle' ? '12' : '0' },
                width: shape.id.includes('rectangle') || shape.id === 'ellipse' ? 140 : 90,
                height: shape.id.includes('rectangle') || shape.id === 'ellipse' ? 80 : 90,
              },
              icon: shape.icon
            }));

            const lineItems = [
              {
                id: 'line-solid',
                name: 'Linha Sólida',
                category: 'Linhas e Divisores',
                instanceData: { widgetId: 'library-line', name: 'Linha: Sólida', defaultConfig: { lineType: 'line', lineStyle: 'solid', lineThickness: '3', textColor: '#ffffff' }, width: 200, height: 30 },
                icon: Minus,
                iconColor: 'text-slate-300'
              },
              {
                id: 'line-dashed',
                name: 'Tracejada',
                category: 'Linhas e Divisores',
                instanceData: { widgetId: 'library-line', name: 'Linha: Tracejada', defaultConfig: { lineType: 'line', lineStyle: 'dashed', lineThickness: '3', textColor: '#ffffff' }, width: 200, height: 30 },
                icon: Minus,
                iconColor: 'text-slate-400 border-dashed'
              },
              {
                id: 'line-arrow',
                name: 'Seta Direita',
                category: 'Linhas e Divisores',
                instanceData: { widgetId: 'library-line', name: 'Seta: Direita', defaultConfig: { lineType: 'line', lineStyle: 'solid', lineThickness: '3', arrowEnd: true, textColor: '#ffffff' }, width: 200, height: 30 },
                icon: ArrowRight,
                iconColor: 'text-purple-400'
              },
              {
                id: 'line-divisor',
                name: 'Divisor Pontilhado',
                category: 'Linhas e Divisores',
                instanceData: { widgetId: 'library-line', name: 'Divisor', defaultConfig: { lineType: 'divisor', lineStyle: 'dashed', lineThickness: '2', textColor: '#4b5563' }, width: 300, height: 20 },
                icon: Minus,
                iconColor: 'text-slate-500'
              }
            ];

            const iconItems = [
              { id: 'heart', icon: Heart, label: 'Coração' },
              { id: 'star', icon: Star, label: 'Estrela' },
              { id: 'user', icon: User, label: 'Usuário' },
              { id: 'users', icon: Users, label: 'Membros' },
              { id: 'camera', icon: Camera, label: 'Câmera' },
              { id: 'mic', icon: Mic, label: 'Microfone' },
              { id: 'volume', icon: Volume2, label: 'Áudio' },
              { id: 'video', icon: Video, label: 'Vídeo' },
              { id: 'music', icon: Music, label: 'Música' },
              { id: 'chat', icon: MessageSquare, label: 'Chat' },
              { id: 'bell', icon: Bell, label: 'Sino' },
              { id: 'calendar', icon: Calendar, label: 'Agenda' },
              { id: 'clock', icon: Clock, label: 'Relógio' },
              { id: 'map-pin', icon: MapPin, label: 'Local' },
              { id: 'link', icon: Link, label: 'Link' },
              { id: 'share', icon: Share2, label: 'Partilhar' },
              { id: 'gamepad', icon: Gamepad2, label: 'Console' },
              { id: 'trophy', icon: Trophy, label: 'Troféu' },
              { id: 'settings', icon: Settings, label: 'Config' },
              { id: 'smile', icon: Smile, label: 'Sorriso' },
              { id: 'sparkles', icon: Sparkles, label: 'Brilho' },
            ].map(ico => ({
              id: `icon-${ico.id}`,
              name: `Ícone: ${ico.label}`,
              label: ico.label,
              category: 'Ícones de Interface',
              instanceData: { widgetId: 'library-icon', name: `Ícone: ${ico.label}`, defaultConfig: { iconType: ico.id, textColor: '#ffffff', fontSize: '32px' }, width: 50, height: 50 },
              icon: ico.icon
            }));

            const socialItems = [
              { id: 'twitch', label: 'Twitch', color: '#a855f7' },
              { id: 'youtube', label: 'YouTube', color: '#ef4444' },
              { id: 'tiktok', label: 'TikTok', color: '#2563eb' },
              { id: 'kick', label: 'Kick', color: '#22c55e' },
              { id: 'instagram', label: 'Instagram', color: '#ec4899' },
              { id: 'facebook', label: 'Facebook', color: '#3b82f6' },
              { id: 'twitter', label: 'X / Twitter', color: '#ffffff' },
              { id: 'discord', label: 'Discord', color: '#6366f1' },
              { id: 'spotify', label: 'Spotify', color: '#1db954' },
            ].map(platform => ({
              id: `social-${platform.id}`,
              name: `Social: ${platform.label}`,
              label: platform.label,
              category: 'Redes Sociais',
              instanceData: { widgetId: 'library-social', name: `Social: ${platform.label}`, defaultConfig: { socialType: platform.id, text: '@streamer', displayMode: 'both', textColor: '#ffffff', fontSize: '14px', fontFamily: 'Inter' }, width: 160, height: 40 },
              color: platform.color
            }));

            const allItems = [...textItems, ...shapeItems, ...lineItems, ...iconItems, ...socialItems];

            const searchQuery = librarySearchQuery.trim().toLowerCase();
            const filteredItems = searchQuery
              ? allItems.filter(item => 
                  item.name.toLowerCase().includes(searchQuery) || 
                  (item.label && item.label.toLowerCase().includes(searchQuery)) ||
                  item.category.toLowerCase().includes(searchQuery)
                )
              : null;

            const favItems = allItems.filter(item => libraryFavorites.includes(item.id));

            return (
              <div className="space-y-4 p-1.5">
                {/* BARRA DE PESQUISA EM TEMPO REAL */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400 pointer-events-none" />
                  <input
                    type="text"
                    value={librarySearchQuery}
                    onChange={(e) => setLibrarySearchQuery(e.target.value)}
                    placeholder="Pesquisar elementos, formas, ícones..."
                    className="w-full bg-black/60 border border-white/10 focus:border-purple-500/60 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-sans transition-all"
                  />
                  {librarySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setLibrarySearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      title="Limpar pesquisa"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* CATEGORIA FAVORITOS (NO TOPO DO PAINEL) */}
                {!searchQuery && (
                  <div className="bg-black/30 border border-amber-500/20 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 font-mono tracking-wider uppercase">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>Favoritos</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-amber-300/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {favItems.length}
                      </span>
                    </div>

                    {favItems.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {favItems.map(item => {
                          const IconComp = item.icon;
                          return (
                            <div
                              key={`fav-${item.id}`}
                              onClick={() => onAddInstance(item.instanceData)}
                              className="group relative flex items-center justify-between px-2 py-1.5 bg-white/5 border border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-500/10 rounded-lg text-left text-[10.5px] text-slate-200 transition-all font-mono cursor-pointer"
                              title={`Adicionar ${item.name}`}
                            >
                              <div className="flex items-center gap-1.5 truncate pr-1">
                                {IconComp ? (
                                  <IconComp className={`h-3.5 w-3.5 shrink-0 ${item.iconColor || 'text-purple-400'}`} />
                                ) : item.color ? (
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                ) : null}
                                <span className="truncate">{item.label || item.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => toggleLibraryFavorite(item.id, e)}
                                className="p-0.5 rounded text-amber-400 hover:text-amber-200 transition-colors shrink-0"
                                title="Remover dos Favoritos"
                              >
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 font-mono text-center py-2 px-1 bg-black/40 rounded-lg border border-white/5">
                        Clique na estrela (<Star className="h-2.5 w-2.5 inline fill-amber-400 text-amber-400 -mt-0.5" />) nos elementos abaixo para fixá-los aqui.
                      </div>
                    )}
                  </div>
                )}

                {/* MODO RESULTADOS DA PESQUISA */}
                {filteredItems !== null ? (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-purple-400 font-mono tracking-wider uppercase">
                      Resultados ({filteredItems.length})
                    </div>
                    {filteredItems.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {filteredItems.map(item => {
                          const isFav = libraryFavorites.includes(item.id);
                          const IconComp = item.icon;
                          return (
                            <div
                              key={`search-${item.id}`}
                              onClick={() => onAddInstance(item.instanceData)}
                              className={`group relative flex items-center justify-between px-2 py-1.5 bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-600/10 rounded-lg text-left text-[10.5px] text-slate-200 transition-all font-mono cursor-pointer ${item.colSpan || ''}`}
                              title={`Adicionar ${item.name}`}
                            >
                              <div className="flex items-center gap-1.5 truncate pr-1">
                                {IconComp ? (
                                  <IconComp className={`h-3.5 w-3.5 shrink-0 ${item.iconColor || 'text-purple-400'}`} />
                                ) : item.color ? (
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                ) : null}
                                <span className="truncate">{item.label || item.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => toggleLibraryFavorite(item.id, e)}
                                className={`p-0.5 rounded transition-colors shrink-0 ${
                                  isFav ? 'text-amber-400 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-amber-300'
                                }`}
                                title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                              >
                                <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400 font-mono bg-black/20 rounded-xl border border-white/5">
                        Nenhum elemento encontrado para "{librarySearchQuery}"
                      </div>
                    )}
                  </div>
                ) : (
                  /* MODO NORMAL - CATEGORIAS */
                  <>
                    {/* TEXTOS EDITÁVEIS */}
                    <div>
                      <div className="text-[11px] font-semibold text-purple-400 font-mono tracking-wider uppercase mb-1.5">Textos Editáveis</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {textItems.map(item => {
                          const isFav = libraryFavorites.includes(item.id);
                          const IconComp = item.icon;
                          return (
                            <div
                              key={item.id}
                              onClick={() => onAddInstance(item.instanceData)}
                              className={`group relative flex items-center justify-between px-2 py-1.5 bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-600/10 rounded-lg text-left text-[11px] text-slate-200 transition-all font-mono cursor-pointer ${item.colSpan || ''}`}
                            >
                              <div className="flex items-center gap-1.5 truncate pr-1">
                                <IconComp className={`h-3.5 w-3.5 shrink-0 ${item.iconColor}`} />
                                <span>{item.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => toggleLibraryFavorite(item.id, e)}
                                className={`p-0.5 rounded transition-colors shrink-0 ${
                                  isFav ? 'text-amber-400 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-amber-300'
                                }`}
                                title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                              >
                                <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* BIBLIOTECA DE FORMAS */}
                    <div>
                      <div className="text-[11px] font-semibold text-purple-400 font-mono tracking-wider uppercase mb-1.5">Biblioteca de Formas</div>
                      <div className="grid grid-cols-3 gap-1">
                        {shapeItems.map(item => {
                          const isFav = libraryFavorites.includes(item.id);
                          const ShapeIcon = item.icon;
                          return (
                            <div
                              key={item.id}
                              onClick={() => onAddInstance(item.instanceData)}
                              className="group relative flex flex-col items-center justify-center p-2 bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-600/10 rounded-lg text-center text-[10px] text-slate-300 transition-all gap-1 font-mono cursor-pointer"
                              title={item.label}
                            >
                              <button
                                type="button"
                                onClick={(e) => toggleLibraryFavorite(item.id, e)}
                                className={`absolute top-0.5 right-0.5 p-0.5 rounded transition-colors ${
                                  isFav ? 'text-amber-400 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-amber-300'
                                }`}
                                title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                              >
                                <Star className={`h-3 w-3 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                              </button>
                              <ShapeIcon className="h-4 w-4 text-purple-400" />
                              <span className="truncate w-full text-center">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* LINHAS E DIVISORES */}
                    <div>
                      <div className="text-[11px] font-semibold text-purple-400 font-mono tracking-wider uppercase mb-1.5">Linhas e Divisores</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {lineItems.map(item => {
                          const isFav = libraryFavorites.includes(item.id);
                          const IconComp = item.icon;
                          return (
                            <div
                              key={item.id}
                              onClick={() => onAddInstance(item.instanceData)}
                              className="group relative flex items-center justify-between px-2 py-1.5 bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-600/10 rounded-lg text-left text-[11px] text-slate-200 transition-all font-mono cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5 truncate pr-1">
                                <IconComp className={`h-4 w-4 shrink-0 ${item.iconColor}`} />
                                <span>{item.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => toggleLibraryFavorite(item.id, e)}
                                className={`p-0.5 rounded transition-colors shrink-0 ${
                                  isFav ? 'text-amber-400 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-amber-300'
                                }`}
                                title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                              >
                                <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ÍCONES DE INTERFACE */}
                    <div>
                      <div className="text-[11px] font-semibold text-purple-400 font-mono tracking-wider uppercase mb-1.5">Ícones de Interface</div>
                      <div className="grid grid-cols-4 gap-1">
                        {iconItems.map(item => {
                          const isFav = libraryFavorites.includes(item.id);
                          const IconComp = item.icon;
                          return (
                            <div
                              key={item.id}
                              onClick={() => onAddInstance(item.instanceData)}
                              className="group relative flex flex-col items-center justify-center p-2 bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-600/10 rounded-lg text-[10px] text-slate-300 transition-all font-mono cursor-pointer"
                              title={item.label}
                            >
                              <button
                                type="button"
                                onClick={(e) => toggleLibraryFavorite(item.id, e)}
                                className={`absolute top-0.5 right-0.5 p-0.5 rounded transition-colors ${
                                  isFav ? 'text-amber-400 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-amber-300'
                                }`}
                                title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                              >
                                <Star className={`h-3 w-3 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                              </button>
                              <IconComp className="h-4 w-4 text-purple-400" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* REDES SOCIAIS */}
                    <div>
                      <div className="text-[11px] font-semibold text-purple-400 font-mono tracking-wider uppercase mb-1.5">Redes Sociais</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {socialItems.map(item => {
                          const isFav = libraryFavorites.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => onAddInstance(item.instanceData)}
                              className="group relative flex items-center justify-between px-2 py-1.5 bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-600/10 rounded-lg text-left text-[11px] text-slate-200 transition-all font-mono cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5 truncate pr-1">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                <span>{item.label}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => toggleLibraryFavorite(item.id, e)}
                                className={`p-0.5 rounded transition-colors shrink-0 ${
                                  isFav ? 'text-amber-400 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-amber-300'
                                }`}
                                title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                              >
                                <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* TAB 5: CAMADAS */}
          {activeTab === 'layers' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 mb-2">Camadas da Overlay</div>
              {instances.length === 0 ? (
                <div className="text-xs text-slate-500 font-mono text-center py-8">
                  Nenhuma camada adicionada nesta overlay.
                </div>
              ) : (
                instances.map(inst => {
                  const isSelected = inst.id === selectedInstanceId;
                  return (
                    <div
                      key={inst.id}
                      onClick={() => onSelectInstance(inst.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/30 border-purple-500/50 text-white shadow-md'
                          : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-[10px] font-mono text-purple-400">#{inst.zIndex || 1}</span>
                        <span className="text-xs font-medium truncate">{inst.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onUpdateInstance(inst.id, { visible: inst.visible === false ? true : false })}
                          className="p-1 hover:text-white text-slate-400"
                          title={inst.visible === false ? 'Mostrar' : 'Ocultar'}
                        >
                          {inst.visible === false ? <EyeOff className="h-3.5 w-3.5 text-rose-400" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => onUpdateInstance(inst.id, { locked: !inst.locked })}
                          className="p-1 hover:text-white text-slate-400"
                          title={inst.locked ? 'Desbloquear' : 'Bloquear'}
                        >
                          {inst.locked ? <Lock className="h-3.5 w-3.5 text-amber-400" /> : <Unlock className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => onDeleteInstance(inst.id)}
                          className="p-1 hover:text-rose-400 text-slate-400"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 6: TRANSFORMAR */}
          {activeTab === 'transform' && (
            <div className="space-y-4">
              {selectedInst ? (
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-4">
                  <div className="text-xs font-semibold text-purple-300 border-b border-white/10 pb-2 truncate flex items-center justify-between">
                    <span>Transformar: {selectedInst.name}</span>
                  </div>

                  {/* Posição e Dimensões */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-purple-400 font-mono block uppercase tracking-wider">Dimensões e Posição</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Largura (px)</label>
                        <input
                          type="number"
                          value={selectedInst.width || 280}
                          onChange={(e) => onUpdateInstance(selectedInst.id, { width: Math.max(10, parseInt(e.target.value) || 280) })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Altura (px)</label>
                        <input
                          type="number"
                          value={selectedInst.height || 180}
                          onChange={(e) => onUpdateInstance(selectedInst.id, { height: Math.max(10, parseInt(e.target.value) || 180) })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Posição X (px)</label>
                        <input
                          type="number"
                          value={selectedInst.x || 0}
                          onChange={(e) => onUpdateInstance(selectedInst.id, { x: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Posição Y (px)</label>
                        <input
                          type="number"
                          value={selectedInst.y || 0}
                          onChange={(e) => onUpdateInstance(selectedInst.id, { y: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rotação */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-purple-400 font-mono uppercase tracking-wider">Rotação</span>
                      <span className="text-[10px] font-mono text-white bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                        {selectedInst.config?.rotation || 0}°
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={selectedInst.config?.rotation || 0}
                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                          config: { ...selectedInst.config, rotation: parseInt(e.target.value) || 0 }
                        })}
                        className="flex-1 accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={selectedInst.config?.rotation || 0}
                        onChange={(e) => {
                          let val = parseInt(e.target.value) || 0;
                          val = Math.max(0, Math.min(360, val));
                          onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, rotation: val }
                          });
                        }}
                        className="w-14 bg-black/60 border border-white/10 rounded-lg px-1.5 py-0.5 text-center text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Espelhamento */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <span className="text-[10px] text-purple-400 font-mono block uppercase tracking-wider">Espelhamento (Flip)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onUpdateInstance(selectedInst.id, {
                          config: { ...selectedInst.config, flipH: !selectedInst.config?.flipH }
                        })}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          selectedInst.config?.flipH
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                            : 'bg-black/40 border-white/10 text-slate-300 hover:bg-black/60 hover:text-white'
                        }`}
                      >
                        Inverter H
                      </button>
                      <button
                        onClick={() => onUpdateInstance(selectedInst.id, {
                          config: { ...selectedInst.config, flipV: !selectedInst.config?.flipV }
                        })}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          selectedInst.config?.flipV
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                            : 'bg-black/40 border-white/10 text-slate-300 hover:bg-black/60 hover:text-white'
                        }`}
                      >
                        Inverter V
                      </button>
                    </div>
                  </div>

                  {/* Reset transform */}
                  <div className="pt-2">
                    <button
                      onClick={() => onUpdateInstance(selectedInst.id, {
                        config: { ...selectedInst.config, rotation: 0, flipH: false, flipV: false }
                      })}
                      className="w-full py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/20 text-rose-300 text-xs font-medium transition-all"
                    >
                      Redefinir Transformações
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-500 font-mono bg-black/20 border border-white/5 rounded-xl">
                  Selecione um elemento no Visualizador para transformar.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ALINHAR */}
          {activeTab === 'align' && (
            <div className="space-y-4">
              {selectedInst ? (
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-4">
                  <div className="text-xs font-semibold text-purple-300 border-b border-white/10 pb-2 truncate flex items-center justify-between">
                    <span>Alinhamento: {selectedInst.name}</span>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] text-purple-400 font-mono block uppercase tracking-wider">Alinhamento Horizontal</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => onUpdateInstance(selectedInst.id, { x: 0 })}
                        className="py-2 px-1 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg text-center text-xs text-slate-200 hover:text-white transition-all font-mono"
                      >
                        Esquerda
                      </button>
                      <button
                        onClick={() => {
                          const w = selectedInst.width || 280;
                          const canvasW = visualizerSize?.width || 800;
                          onUpdateInstance(selectedInst.id, { x: Math.round((canvasW - w) / 2) });
                        }}
                        className="py-2 px-1 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg text-center text-xs text-slate-200 hover:text-white transition-all font-mono"
                      >
                        Centro
                      </button>
                      <button
                        onClick={() => {
                          const w = selectedInst.width || 280;
                          const canvasW = visualizerSize?.width || 800;
                          onUpdateInstance(selectedInst.id, { x: canvasW - w });
                        }}
                        className="py-2 px-1 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg text-center text-xs text-slate-200 hover:text-white transition-all font-mono"
                      >
                        Direita
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-white/5 pt-3">
                    <span className="text-[10px] text-purple-400 font-mono block uppercase tracking-wider">Alinhamento Vertical</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => onUpdateInstance(selectedInst.id, { y: 0 })}
                        className="py-2 px-1 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg text-center text-xs text-slate-200 hover:text-white transition-all font-mono"
                      >
                        Topo
                      </button>
                      <button
                        onClick={() => {
                          const h = selectedInst.height || 180;
                          const canvasH = visualizerSize?.height || 480;
                          onUpdateInstance(selectedInst.id, { y: Math.round((canvasH - h) / 2) });
                        }}
                        className="py-2 px-1 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg text-center text-xs text-slate-200 hover:text-white transition-all font-mono"
                      >
                        Meio
                      </button>
                      <button
                        onClick={() => {
                          const h = selectedInst.height || 180;
                          const canvasH = visualizerSize?.height || 480;
                          onUpdateInstance(selectedInst.id, { y: canvasH - h });
                        }}
                        className="py-2 px-1 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg text-center text-xs text-slate-200 hover:text-white transition-all font-mono"
                      >
                        Base
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-white/5 pt-3">
                    <span className="text-[10px] text-purple-400 font-mono block uppercase tracking-wider">Preenchimento</span>
                    <button
                      onClick={() => {
                        const canvasW = visualizerSize?.width || 800;
                        const canvasH = visualizerSize?.height || 480;
                        onUpdateInstance(selectedInst.id, {
                          x: 0,
                          y: 0,
                          width: canvasW,
                          height: canvasH
                        });
                      }}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white border border-white/10 rounded-lg text-center text-xs font-bold transition-all"
                    >
                      Ajustar à Tela Inteira
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-500 font-mono bg-black/20 border border-white/5 rounded-xl">
                  Selecione um elemento no Visualizador para alinhar.
                </div>
              )}
            </div>
          )}

          {/* TAB 8: ORGANIZAR */}
          {activeTab === 'organize' && (
            <div className="space-y-4">
              {selectedInst ? (
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-4">
                  <div className="text-xs font-semibold text-purple-300 border-b border-white/10 pb-2 truncate flex items-center justify-between">
                    <span>Organizar: {selectedInst.name}</span>
                  </div>

                  {/* Ordem de Camadas (zIndex) */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-purple-400 font-mono uppercase tracking-wider">Profundidade (Camada)</span>
                      <span className="text-[10px] font-mono text-white bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        Z-Index: {selectedInst.zIndex || 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const maxZ = instances.length > 0 ? Math.max(...instances.map(i => i.zIndex || 0)) : 1;
                          onUpdateInstance(selectedInst.id, { zIndex: maxZ + 1 });
                        }}
                        className="py-2 px-1 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg text-center text-[11px] text-slate-200 hover:text-white transition-all font-mono"
                        title="Mover para o topo de todas as camadas"
                      >
                        Trazer p/ Frente
                      </button>
                      <button
                        onClick={() => {
                          const minZ = instances.length > 0 ? Math.min(...instances.map(i => i.zIndex || 1)) : 1;
                          onUpdateInstance(selectedInst.id, { zIndex: Math.max(1, minZ - 1) });
                        }}
                        className="py-2 px-1 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg text-center text-[11px] text-slate-200 hover:text-white transition-all font-mono"
                        title="Mover para o fundo de todas as camadas"
                      >
                        Enviar p/ Trás
                      </button>

                      <button
                        onClick={() => {
                          onUpdateInstance(selectedInst.id, { zIndex: (selectedInst.zIndex || 1) + 1 });
                        }}
                        className="py-2 px-1 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg text-center text-[11px] text-slate-200 hover:text-white transition-all font-mono"
                        title="Mover uma posição para cima"
                      >
                        Avançar Nível
                      </button>
                      <button
                        onClick={() => {
                          onUpdateInstance(selectedInst.id, { zIndex: Math.max(1, (selectedInst.zIndex || 1) - 1) });
                        }}
                        className="py-2 px-1 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg text-center text-[11px] text-slate-200 hover:text-white transition-all font-mono"
                        title="Mover uma posição para baixo"
                      >
                        Recuar Nível
                      </button>
                    </div>
                  </div>

                  {/* Status do Elemento */}
                  <div className="space-y-3 border-t border-white/5 pt-3">
                    <span className="text-[10px] text-purple-400 font-mono block uppercase tracking-wider">Ações de Controle</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onUpdateInstance(selectedInst.id, { locked: !selectedInst.locked })}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                          selectedInst.locked
                            ? 'bg-amber-600/20 border-amber-500 text-amber-200'
                            : 'bg-black/40 border-white/10 text-slate-300 hover:bg-black/60 hover:text-white'
                        }`}
                      >
                        {selectedInst.locked ? (
                          <>
                            <Lock className="h-3.5 w-3.5" /> Bloqueado
                          </>
                        ) : (
                          <>
                            <Unlock className="h-3.5 w-3.5" /> Desbloqueado
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onUpdateInstance(selectedInst.id, { visible: selectedInst.visible === false ? true : false })}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                          selectedInst.visible === false
                            ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                            : 'bg-black/40 border-white/10 text-slate-300 hover:bg-black/60 hover:text-white'
                        }`}
                      >
                        {selectedInst.visible === false ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" /> Invisível
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" /> Visível
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Excluir Elemento */}
                  <div className="border-t border-white/5 pt-3">
                    <button
                      onClick={() => onDeleteInstance(selectedInst.id)}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white border border-white/10 rounded-lg text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Excluir Elemento
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-500 font-mono bg-black/20 border border-white/5 rounded-xl">
                  Selecione um elemento no Visualizador para organizar.
                </div>
              )}
            </div>
          )}

          {/* TAB 9: GUIAS */}
          {activeTab === 'guides' && (
            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-4">
                <div className="text-xs font-semibold text-purple-300 border-b border-white/10 pb-2">
                  Guias e Alinhamento
                </div>

                {/* Show/Hide Grid */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Exibir Grade</span>
                  <input
                    type="checkbox"
                    checked={Boolean(gridSettings?.showGrid)}
                    onChange={(e) => onUpdateGridSettings({ showGrid: e.target.checked })}
                    className="rounded border-white/10 text-purple-600 bg-black/40 focus:ring-0 cursor-pointer h-4.5 w-4.5"
                  />
                </div>

                {/* Snap to Grid */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Alinhar à Grade (Snap)</span>
                  <input
                    type="checkbox"
                    checked={Boolean(gridSettings?.snapToGrid)}
                    onChange={(e) => onUpdateGridSettings({ snapToGrid: e.target.checked })}
                    className="rounded border-white/10 text-purple-600 bg-black/40 focus:ring-0 cursor-pointer h-4.5 w-4.5"
                  />
                </div>

                {/* Grid Size Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Tamanho da Grade</span>
                    <span>{gridSettings?.gridSize || 20}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="5"
                    value={gridSettings?.gridSize || 20}
                    onChange={(e) => onUpdateGridSettings({ gridSize: parseInt(e.target.value) || 20 })}
                    className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                  />
                </div>

                {/* Show Safe Areas */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs text-slate-300 font-medium">Exibir Área Segura (Safe Area)</span>
                  <input
                    type="checkbox"
                    checked={Boolean(gridSettings?.showSafeAreas)}
                    onChange={(e) => onUpdateGridSettings({ showSafeAreas: e.target.checked })}
                    className="rounded border-white/10 text-purple-600 bg-black/40 focus:ring-0 cursor-pointer h-4.5 w-4.5"
                  />
                </div>

                {/* Linhas-Guia Personalizadas */}
                <div className="space-y-3 border-t border-white/5 pt-3">
                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex justify-between items-center">
                    <span>Linhas-Guia Manuais</span>
                    <span className="text-[9px] text-slate-500 font-mono">Sem limite</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const guides = gridSettings?.verticalGuides || [];
                        const nextId = `vg-${Date.now()}`;
                        onUpdateGridSettings({
                          verticalGuides: [...guides, { id: nextId, x: Math.round((visualizerSize?.width || 800) / 2) }]
                        });
                      }}
                      className="py-1.5 px-2 bg-purple-600/10 hover:bg-purple-600/20 active:scale-95 border border-purple-500/20 rounded-lg text-[10px] font-bold text-purple-200 transition-all text-center flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Guia Vertical
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const guides = gridSettings?.horizontalGuides || [];
                        const nextId = `hg-${Date.now()}`;
                        onUpdateGridSettings({
                          horizontalGuides: [...guides, { id: nextId, y: Math.round((visualizerSize?.height || 480) / 2) }]
                        });
                      }}
                      className="py-1.5 px-2 bg-purple-600/10 hover:bg-purple-600/20 active:scale-95 border border-purple-500/20 rounded-lg text-[10px] font-bold text-purple-200 transition-all text-center flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Guia Horizontal
                    </button>
                  </div>

                  {/* Vertical Guides List */}
                  {gridSettings?.verticalGuides && gridSettings.verticalGuides.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Guias Verticais (Eixo X)</div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {gridSettings.verticalGuides.map((guide, idx) => (
                          <div key={guide.id} className="flex items-center justify-between gap-2 bg-slate-950/30 border border-white/5 rounded-lg px-2 py-1">
                            <span className="text-[10px] text-slate-400 font-mono">X #{idx + 1}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-black/40 border border-white/10 rounded px-1.5 py-0.5">
                                <input
                                  type="number"
                                  value={guide.x}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    const updated = gridSettings.verticalGuides.map(g => g.id === guide.id ? { ...g, x: val } : g);
                                    onUpdateGridSettings({ verticalGuides: updated });
                                  }}
                                  className="w-12 bg-transparent border-0 outline-none p-0 text-[10px] font-mono text-right text-purple-200 focus:ring-0 font-bold"
                                />
                                <span className="text-[9px] text-slate-600 ml-0.5 select-none font-mono">px</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = gridSettings.verticalGuides.filter(g => g.id !== guide.id);
                                  onUpdateGridSettings({ verticalGuides: updated });
                                }}
                                className="text-slate-500 hover:text-red-400 transition-colors p-0.5 rounded hover:bg-white/5"
                                title="Remover guia"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Horizontal Guides List */}
                  {gridSettings?.horizontalGuides && gridSettings.horizontalGuides.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Guias Horizontais (Eixo Y)</div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {gridSettings.horizontalGuides.map((guide, idx) => (
                          <div key={guide.id} className="flex items-center justify-between gap-2 bg-slate-950/30 border border-white/5 rounded-lg px-2 py-1">
                            <span className="text-[10px] text-slate-400 font-mono">Y #{idx + 1}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-black/40 border border-white/10 rounded px-1.5 py-0.5">
                                <input
                                  type="number"
                                  value={guide.y}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    const updated = gridSettings.horizontalGuides.map(g => g.id === guide.id ? { ...g, y: val } : g);
                                    onUpdateGridSettings({ horizontalGuides: updated });
                                  }}
                                  className="w-12 bg-transparent border-0 outline-none p-0 text-[10px] font-mono text-right text-purple-200 focus:ring-0 font-bold"
                                />
                                <span className="text-[9px] text-slate-600 ml-0.5 select-none font-mono">px</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = gridSettings.horizontalGuides.filter(g => g.id !== guide.id);
                                  onUpdateGridSettings({ horizontalGuides: updated });
                                }}
                                className="text-slate-500 hover:text-red-400 transition-colors p-0.5 rounded hover:bg-white/5"
                                title="Remover guia"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="py-2 px-3 rounded-lg border border-white/5 bg-slate-950/30">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Adicione guias para referências de alinhamento personalizadas. Caso o alinhamento (Snap) esteja ativo, os elementos serão atraídos pelas guias manuais quando aproximados delas a menos de 8 pixels.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: FUNDO */}
          {activeTab === 'background' && (
            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-4">
                <div className="text-xs font-semibold text-purple-300 border-b border-white/10 pb-2">
                  Configurações do Fundo
                </div>

                {/* Tipo de Fundo */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono block">Tipo de Fundo</label>
                  <div className="grid grid-cols-2 gap-1 bg-black/40 border border-white/5 rounded-lg p-1">
                    {[
                      { id: 'transparent', label: 'Transparente' },
                      { id: 'solid', label: 'Cor Sólida' },
                      { id: 'gradient', label: 'Gradiente' },
                      { id: 'image', label: 'Imagem' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => onUpdateBackground({ type: type.id })}
                        className={`text-[10px] py-1 rounded transition-all font-medium ${
                          (background?.type || 'transparent') === type.id
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Borda do Fundo (Borda + Arredondamento) */}
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <label className="text-[10px] text-slate-400 font-mono block">Borda do Fundo</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateBackground({ showBorder: false, borderRadius: '0px' })}
                      className={`flex-1 py-1.5 text-[10px] rounded border font-bold transition-all ${
                        !background.showBorder
                          ? 'bg-purple-600 border-purple-400 text-white'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      Sem borda
                    </button>
                    <button
                      onClick={() => onUpdateBackground({ showBorder: true })}
                      className={`flex-1 py-1.5 text-[10px] rounded border font-bold transition-all ${
                        background.showBorder
                          ? 'bg-purple-600 border-purple-400 text-white'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      Com borda
                    </button>
                  </div>
                  
                  {background.showBorder && (
                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>Arredondamento</span>
                        <span>{parseInt(background.borderRadius) || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={parseInt(background.borderRadius) || 0}
                        onChange={(e) => onUpdateBackground({ borderRadius: `${e.target.value}px` })}
                        className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Solid Color Config */}
                {(background?.type || 'transparent') === 'solid' && (
                  <div className="space-y-3 border-t border-white/5 pt-3 animate-fade-in">
                    <div className="flex items-center justify-between gap-2 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5">
                      <span className="text-[10px] text-slate-400 font-mono">Selecionar Cor</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={background?.color || '#020617'}
                          onChange={(e) => onUpdateBackground({ color: e.target.value })}
                          className="h-5 w-8 border-0 bg-transparent cursor-pointer rounded"
                        />
                        <span className="text-[10px] text-slate-300 font-mono uppercase">
                          {background?.color || '#020617'}
                        </span>
                      </div>
                    </div>

                    {/* Predefined colors */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-mono block">Cores Recomendadas para Streams</span>
                      <div className="grid grid-cols-7 gap-1">
                        {[
                          '#020617', '#0f172a', '#1e1b4b', '#311042', '#1c0d02', '#022c22', '#000000',
                          '#1e293b', '#334155', '#475569', '#3b0764', '#581c87', '#7c3aed', '#ec4899'
                        ].map(c => (
                          <button
                            key={c}
                            onClick={() => onUpdateBackground({ color: c })}
                            style={{ backgroundColor: c }}
                            className="h-5 w-full rounded border border-white/10 hover:border-purple-500 transition-all shadow-sm"
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Gradient Config */}
                {(background?.type || 'transparent') === 'gradient' && (
                  <div className="space-y-3 border-t border-white/5 pt-3 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono block">Fórmula CSS do Gradiente</label>
                      <textarea
                        rows={2}
                        value={background?.gradient || 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)'}
                        onChange={(e) => onUpdateBackground({ gradient: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white font-mono resize-none leading-normal"
                        placeholder="linear-gradient(...)"
                      />
                    </div>

                    {/* Quick Gradient Presets */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-mono block">Catálogo Ampliado de Gradientes (Linear, Radial, Cônico)</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { name: 'Cyberpunk Cosmic', value: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)' },
                          { name: 'Sunset Neon', value: 'linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)' },
                          { name: 'Electric Aqua', value: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' },
                          { name: 'Emerald Abiss', value: 'linear-gradient(135deg, #022c22 0%, #052e16 100%)' },
                          { name: 'Retrowave Pink', value: 'linear-gradient(135deg, #db2777 0%, #312e81 100%)' },
                          { name: 'Dark Void', value: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 100%)' },
                          { name: 'Radial Aurora', value: 'radial-gradient(circle at center, #7c3aed 0%, #1e1b4b 60%, #020617 100%)' },
                          { name: 'Radial Sunset', value: 'radial-gradient(circle at top, #ec4899 0%, #3b0764 50%, #09090b 100%)' },
                          { name: 'Conic Neon Sweep', value: 'conic-gradient(from 90deg at 50% 50%, #7c3aed, #ec4899, #06b6d4, #22c55e, #7c3aed)' },
                          { name: '3-Color Cyber Gradient', value: 'linear-gradient(90deg, #3b0764 0%, #7c3aed 50%, #06b6d4 100%)' },
                          { name: 'Vertical Deep Purple', value: 'linear-gradient(180deg, #1e1b4b 0%, #000000 100%)' },
                          { name: 'Diagonal Gold Glow', value: 'linear-gradient(135deg, #d97706 0%, #78350f 50%, #09090b 100%)' }
                        ].map(grad => (
                          <button
                            key={grad.name}
                            onClick={() => onUpdateBackground({ gradient: grad.value })}
                            style={{ backgroundImage: grad.value }}
                            className="h-9 w-full rounded-lg border border-white/10 hover:border-purple-500 transition-all relative overflow-hidden flex items-end p-1 text-left active:scale-[0.98]"
                          >
                            <span className="text-[8px] bg-black/60 text-white px-1 py-0.5 rounded leading-none font-sans truncate w-full border border-white/5">{grad.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Config */}
                {(background?.type || 'transparent') === 'image' && (
                  <div className="space-y-3 border-t border-white/5 pt-3 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono block">URL da Imagem de Fundo</label>
                      <input
                        type="text"
                        value={background?.image || ''}
                        onChange={(e) => onUpdateBackground({ image: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                        placeholder="https://exemplo.com/fundo.png"
                      />
                    </div>

                    {/* Botão Principal: Galeria Pré-Montada */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPrebuiltModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-600 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-purple-600/30 border border-purple-400/40 tracking-wider group"
                      >
                        <Sparkles className="h-4 w-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                        <span>GALERIA PRÉ-MONTADA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGalleryPickerOpen(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] font-medium transition-all active:scale-95"
                      >
                        <FolderPlus className="h-3.5 w-3.5 text-slate-400" />
                        <span>Minha Galeria de Uploads</span>
                      </button>

                      {/* 3. OVERLAYS PRÉ-MONTADAS */}
                      <button
                        type="button"
                        onClick={() => setStructuralModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:via-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-cyan-600/25 border border-cyan-400/35 tracking-wider group"
                      >
                        <LayoutGrid className="h-4 w-4 text-cyan-200 group-hover:scale-110 transition-transform" />
                        <span>OVERLAYS PRÉ-MONTADAS</span>
                      </button>
                    </div>

                    {background?.image && (
                      <div className="mt-2 p-2 rounded-lg bg-black/40 border border-white/5 flex items-center gap-2">
                        <div className="h-9 w-14 rounded bg-slate-900 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                          <img src={background.image} alt="Preview" className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="truncate flex-1">
                          <span className="text-[9px] text-slate-400 font-mono block">Imagem Ativa</span>
                          <span className="text-[10px] text-purple-300 truncate block font-mono">{background.image}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onUpdateBackground({ image: '' })}
                          className="text-[10px] text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-all shrink-0"
                          title="Remover imagem do fundo"
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* AJUSTES VISUAIS (FILTERS) */}
                <div className="space-y-3 border-t border-white/5 pt-3">
                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Ajustes do Fundo</div>

                  {/* Opacidade */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Opacidade</span>
                      <span>{background?.opacity !== undefined ? background.opacity : 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={background?.opacity !== undefined ? background.opacity : 100}
                      onChange={(e) => onUpdateBackground({ opacity: parseInt(e.target.value) })}
                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Blur (Desfoque) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Desfoque (Blur)</span>
                      <span>{background?.blur || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={background?.blur || 0}
                      onChange={(e) => onUpdateBackground({ blur: parseInt(e.target.value) })}
                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Brilho */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Brilho</span>
                      <span>{background?.brightness !== undefined ? background.brightness : 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={background?.brightness !== undefined ? background.brightness : 100}
                      onChange={(e) => onUpdateBackground({ brightness: parseInt(e.target.value) })}
                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Contraste */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Contraste</span>
                      <span>{background?.contrast !== undefined ? background.contrast : 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={background?.contrast !== undefined ? background.contrast : 100}
                      onChange={(e) => onUpdateBackground({ contrast: parseInt(e.target.value) })}
                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Saturação */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Saturação</span>
                      <span>{background?.saturate !== undefined ? background.saturate : 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={background?.saturate !== undefined ? background.saturate : 100}
                      onChange={(e) => onUpdateBackground({ saturate: parseInt(e.target.value) })}
                      className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="py-2 px-3 rounded-lg border border-white/5 bg-slate-950/30">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Esse fundo pertence à composição da Overlay e acompanha automaticamente o tamanho definido do seu Visualizador. Ele não altera os elementos individuais.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {!selectedInst ? (
                <div className="p-6 text-center text-slate-400 font-mono text-xs border border-white/10 rounded-xl bg-black/40">
                  Selecione um elemento no Visualizador para poder aplicar as combinações de Presets Visuais.
                </div>
              ) : (
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-4">
                  <div className="p-2.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-xs">
                    <span className="text-[10px] font-mono text-purple-400 block uppercase tracking-wider">Destino do Preset</span>
                    <div className="font-bold text-white truncate">{selectedInst.name}</div>
                  </div>

                  {/* Estilos Visuais */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Presets de Estilos Visuais</div>
                    
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        {
                          name: 'Neon Púrpura Radiante',
                          desc: 'Borda com brilho neon roxo intenso e difuso.',
                          config: {
                            effGlowActiveType: 'glow-neon',
                            effBorderActiveType: 'border-neon',
                            effShadowColor: '#a855f7',
                            effShadowColor2: '#ec4899',
                            effShadowIntensity: 12
                          }
                        },
                        {
                          name: 'Vidro Fosco (Glassmorphism)',
                          desc: 'Visual moderno de vidro translúcido com desfoque.',
                          config: {
                            effGlassActiveType: 'glass-frosted',
                            effBackdropBlur: 12,
                            effGlassOpacity: 20,
                            effBorderActiveType: 'border-solid'
                          }
                        },
                        {
                          name: 'Glow Matrix Verde',
                          desc: 'Sombra brilhante e contornos no estilo hacker.',
                          config: {
                            effGlowActiveType: 'glow-neon',
                            effBorderActiveType: 'border-neon',
                            effShadowColor: '#22c55e',
                            effShadowColor2: '#15803d',
                            effShadowIntensity: 10
                          }
                        },
                        {
                          name: 'Sombra Projetada 3D',
                          desc: 'Sombra realista deslocada dando profundidade.',
                          config: {
                            effShadowActiveType: 'shadow-drop',
                            effShadowX: 8,
                            effShadowY: 8,
                            effShadowBlur: 12,
                            effShadowColor: '#000000'
                          }
                        },
                        {
                          name: 'Gradiente Cyber Vaporwave',
                          desc: 'Degradê diagonal do rosa vibrante ao azul elétrico.',
                          config: {
                            effGradientActiveType: 'gradient-linear',
                            effGradientStart: '#ec4899',
                            effGradientEnd: '#06b6d4',
                            effGradientAngle: 135
                          }
                        },
                        {
                          name: 'Gamer Dark Minimalista',
                          desc: 'Fundo escuro sólido com contorno sutil branco.',
                          config: {
                            effBgActiveType: 'bg-solid',
                            effBgColor: '#090d16',
                            effBorderActiveType: 'border-solid',
                            effShadowActiveType: 'shadow-soft'
                          }
                        }
                      ].map(preset => (
                        <button
                          key={preset.name}
                          onClick={() => onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, ...preset.config }
                          })}
                          className="w-full text-left p-2.5 rounded-lg border border-white/5 bg-slate-950/40 hover:bg-slate-950/80 hover:border-purple-500/40 transition-all flex flex-col gap-0.5 group"
                        >
                          <span className="text-xs font-semibold text-purple-200 group-hover:text-purple-300 transition-colors">{preset.name}</span>
                          <span className="text-[10px] text-slate-400">{preset.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animações e Movimentos */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Presets de Animações</div>
                    
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        {
                          name: 'Flutuação Constante',
                          desc: 'Efeito contínuo e suave de flutuação vertical.',
                          config: {
                            animationType: 'continua',
                            animationName: 'flutuacaoVertical',
                            animationDuration: 3,
                            animationDelay: 0,
                            animationRepeat: 'infinite',
                            animationDirection: 'normal'
                          }
                        },
                        {
                          name: 'Pulsação Ativa (Pulsar)',
                          desc: 'Efeito rítmico que cresce e diminui.',
                          config: {
                            animationType: 'enfase',
                            animationName: 'pulsar',
                            animationDuration: 1.5,
                            animationDelay: 0,
                            animationRepeat: 'infinite',
                            animationDirection: 'alternate'
                          }
                        },
                        {
                          name: 'Surgir com Pop Suave',
                          desc: 'Entrada dinâmica escalonada de 0.8s.',
                          config: {
                            animationType: 'entrada',
                            animationName: 'popIn',
                            animationDuration: 0.8,
                            animationDelay: 0,
                            animationRepeat: '1',
                            animationDirection: 'normal'
                          }
                        },
                        {
                          name: 'Giro Lento Infinito',
                          desc: 'Rotação contínua e suave para badges.',
                          config: {
                            animationType: 'rotacao',
                            animationName: 'spin',
                            animationDuration: 8,
                            animationDelay: 0,
                            animationRepeat: 'infinite',
                            animationDirection: 'normal'
                          }
                        },
                        {
                          name: 'Cintilar Misterioso (Flicker)',
                          desc: 'Brilho intermitente simulando luz neon falhando.',
                          config: {
                            animationType: 'enfase',
                            animationName: 'cintilar',
                            animationDuration: 2,
                            animationDelay: 0,
                            animationRepeat: 'infinite'
                          }
                        }
                      ].map(preset => (
                        <button
                          key={preset.name}
                          onClick={() => onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, ...preset.config }
                          })}
                          className="w-full text-left p-2.5 rounded-lg border border-white/5 bg-slate-950/40 hover:bg-slate-950/80 hover:border-purple-500/40 transition-all flex flex-col gap-0.5 group"
                        >
                          <span className="text-xs font-semibold text-purple-200 group-hover:text-purple-300 transition-colors">{preset.name}</span>
                          <span className="text-[10px] text-slate-400">{preset.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="py-2 px-3 rounded-lg border border-white/5 bg-slate-950/30">
                    <p className="text-[9.5px] text-slate-400 leading-relaxed">
                      Dica: Os presets utilizam os campos nativos de estilos e efeitos do editor. Você ainda poderá ajustar manualmente cada parâmetro nas abas Config e Efeitos após a aplicação.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 12: HISTÓRICO */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-4">
                <div className="text-xs font-semibold text-purple-300 border-b border-white/10 pb-2">
                  Histórico de Edições
                </div>

                {/* Undo / Redo side-by-side buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      canUndo
                        ? 'bg-purple-600/20 border-purple-500 text-purple-100 hover:bg-purple-600/40 active:scale-95'
                        : 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Desfazer {historyPastCount > 0 && `(${historyPastCount})`}
                  </button>

                  <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      canRedo
                        ? 'bg-purple-600/20 border-purple-500 text-purple-100 hover:bg-purple-600/40 active:scale-95'
                        : 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Refazer {historyFutureCount > 0 && `(${historyFutureCount})`}
                  </button>
                </div>

                {/* Timeline status indicator */}
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex justify-between items-center">
                    <span>Fluxo de Alterações</span>
                    <span className="text-[9px] text-slate-400 font-mono">Max: 50 passos</span>
                  </div>

                  <VerticalScrollContainer boxClassName="max-h-36 border border-white/10 bg-black/30 rounded-lg p-2" contentClassName="space-y-1.5">
                    {/* Future actions */}
                    {Array.from({ length: historyFutureCount }).map((_, idx) => (
                      <div key={`future-${idx}`} className="flex items-start gap-2.5 text-slate-500 font-mono text-[10px] pl-1 py-1 border-l border-white/5">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-700 mt-1.5" />
                        <span className="truncate">Ação futura disponível (Refazer)</span>
                      </div>
                    ))}

                    {/* Current state */}
                    <div className="flex items-start gap-2.5 text-purple-400 font-mono font-semibold text-[10px] bg-purple-600/10 border border-purple-500/25 rounded p-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-500 mt-0.5 animate-pulse" />
                      <div>
                        <div>Ponto de Edição Atual</div>
                        <div className="text-[8.5px] text-slate-400 font-sans font-normal pt-0.5">Sua composição possui {instances.length} elemento(s).</div>
                      </div>
                    </div>

                    {/* Past Actions */}
                    {Array.from({ length: historyPastCount }).map((_, idx) => {
                      const reverseIndex = historyPastCount - 1 - idx;
                      return (
                        <div key={`past-${idx}`} className="flex items-start gap-2.5 text-slate-300 font-mono text-[10px] pl-1 py-1 border-l border-purple-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500/60 mt-1.5" />
                          <span className="truncate">Alteração #{reverseIndex + 1} no Workspace</span>
                        </div>
                      );
                    })}

                    {historyPastCount === 0 && (
                      <div className="text-center py-6 text-[10px] text-slate-500">
                        Nenhuma alteração registrada ainda. Comece a criar para iniciar o histórico.
                      </div>
                    )}
                  </VerticalScrollContainer>
                </div>

                {/* Hotkeys info */}
                <div className="py-2 px-3 rounded-lg border border-white/5 bg-slate-950/30 font-sans text-[10px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300">Teclas de Atalho Suportadas:</div>
                  <div className="flex justify-between">
                    <span>Desfazer</span>
                    <kbd className="bg-black/50 border border-white/10 rounded px-1 text-[8.5px] font-mono text-slate-200">Ctrl + Z</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Refazer</span>
                    <kbd className="bg-black/50 border border-white/10 rounded px-1 text-[8.5px] font-mono text-slate-200">Ctrl + Y</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: DADOS */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              {!selectedInst ? (
                <div className="p-6 text-center text-slate-400 font-mono text-xs border border-white/10 rounded-xl bg-black/40">
                  Selecione um elemento de texto ou mídia no Visualizador para vincular a dados dinâmicos.
                </div>
              ) : (
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-4">
                  <div className="p-2.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-xs">
                    <span className="text-[10px] font-mono text-purple-400 block uppercase tracking-wider">Elemento Selecionado</span>
                    <div className="font-bold text-white truncate">{selectedInst.name}</div>
                  </div>

                  {!(selectedInst.widgetId === 'library-text' || selectedInst.widgetId === 'library-social') ? (
                    <div className="p-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      Este tipo de elemento não suporta vínculos de dados dinâmicos diretamente. Crie um elemento de Texto ou Rede Social na Biblioteca para vinculá-lo.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                          Vínculo de Dados Dinâmicos
                        </label>
                        <select
                          value={selectedInst.config?.dataBinding || 'none'}
                          onChange={(e) => onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, dataBinding: e.target.value }
                          })}
                          className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="none">Nenhum (Texto Estático Manual)</option>
                          <option value="last_sub">Último Inscrito</option>
                          <option value="last_bits">Bits / Doações Recentes</option>
                          <option value="viewers">Contador de Espectadores (Viewers)</option>
                          <option value="uptime">Tempo de Transmissão (Uptime)</option>
                          <option value="current_music">Música Tocando no Player</option>
                          <option value="last_follow">Último Seguidor</option>
                          <option value="events">Atividade Recente (Feed de Eventos)</option>
                        </select>
                        <p className="text-[10px] text-slate-400">
                          Escolha qual fonte de dados do sistema deve substituir dinamicamente o conteúdo textual deste elemento.
                        </p>
                      </div>

                      {/* Live Preview Box */}
                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Visualização em Tempo Real</span>
                          <span className="flex items-center gap-1 text-emerald-400 text-[9px] font-mono">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Sincronizado
                          </span>
                        </div>

                        <div className="p-3 rounded-lg border border-white/5 bg-slate-950/60 font-mono text-xs text-purple-200 break-all select-all">
                          {resolveDataBinding(
                            selectedInst.config?.dataBinding || 'none',
                            selectedInst.config?.text || 'Insira seu texto',
                            { connections, streamMeta, liveActivity },
                            selectedInst.config
                          )}
                        </div>
                      </div>

                      <div className="py-2 px-3 rounded-lg border border-white/5 bg-slate-950/30">
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          O vínculo consome diretamente as conexões ativas do painel. Caso esteja offline, valores de simulação serão exibidos como visualização no workspace sem alterar seu template original.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 14: RESPONSIVO */}
          {activeTab === 'responsive' && (
            <div className="space-y-4">
              {!selectedInst ? (
                <div className="p-6 text-center text-slate-400 font-mono text-xs border border-white/10 rounded-xl bg-black/40">
                  Selecione um elemento no Visualizador para configurar o comportamento responsivo.
                </div>
              ) : (
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-4">
                  <div className="p-2.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-xs">
                    <span className="text-[10px] font-mono text-purple-400 block uppercase tracking-wider">Elemento Selecionado</span>
                    <div className="font-bold text-white truncate">{selectedInst.name}</div>
                  </div>

                  {/* Responsive Mode Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                      Modo de Comportamento Responsivo
                    </label>
                    <select
                      value={selectedInst.config?.responsiveMode || 'relative'}
                      onChange={(e) => onUpdateInstance(selectedInst.id, {
                        config: { ...selectedInst.config, responsiveMode: e.target.value }
                      })}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="relative">Preservar Posição Relativa (Escalonamento)</option>
                      <option value="anchor">Ancoragem e Margens Fixas</option>
                      <option value="aspect-ratio">Manter Proporção Original</option>
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Define como o elemento deve se adaptar caso as dimensões ou proporção do Visualizador sejam alteradas.
                    </p>
                  </div>

                  {/* Responsive Anchor (Conditional) */}
                  {selectedInst.config?.responsiveMode === 'anchor' && (
                    <div className="space-y-2 border-t border-white/5 pt-3 animate-fade-in">
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                        Ponto de Ancoragem / Fixação
                      </label>
                      <select
                        value={selectedInst.config?.responsiveAnchor || 'top-left'}
                        onChange={(e) => onUpdateInstance(selectedInst.id, {
                          config: { ...selectedInst.config, responsiveAnchor: e.target.value }
                        })}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="top-left">Superior Esquerdo (Margem Esquerda/Topo)</option>
                        <option value="top-right">Superior Direito (Margem Direita/Topo)</option>
                        <option value="bottom-left">Inferior Esquerdo (Margem Esquerda/Fundo)</option>
                        <option value="bottom-right">Inferior Direito (Margem Direita/Fundo)</option>
                        <option value="center">Centro do Canvas (Relativo)</option>
                      </select>
                      <p className="text-[10px] text-slate-400">
                        O elemento manterá distância fixa das bordas selecionadas ao reajustar o tamanho da tela.
                      </p>
                    </div>
                  )}

                  {/* Summary coordinates list */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      Coordenadas Atuais da Composição
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Largura (W):</span>
                        <span className="text-purple-300 font-bold tabular-nums">{selectedInst.width || 220}px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Altura (H):</span>
                        <span className="text-purple-300 font-bold tabular-nums">{selectedInst.height || 50}px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Posição X:</span>
                        <span className="text-purple-300 font-bold tabular-nums">{selectedInst.x}px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Posição Y:</span>
                        <span className="text-purple-300 font-bold tabular-nums">{selectedInst.y}px</span>
                      </div>
                    </div>
                  </div>

                  <div className="py-2 px-3 rounded-lg border border-white/5 bg-slate-950/30">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Dica: Para testar a responsividade, altere o tamanho do Visualizador arrastando a alça roxa posicionada no canto inferior direito da tela de design.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 15: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {!selectedInst ? (
                <div className="p-6 text-center text-slate-400 font-mono text-xs border border-white/10 rounded-xl bg-black/40">
                  Selecione um elemento no Visualizador para gerenciar sua Timeline e Keyframes.
                </div>
              ) : (
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-4">
                  <div className="p-2.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-xs">
                    <span className="text-[10px] font-mono text-purple-400 block uppercase tracking-wider">Elemento Selecionado</span>
                    <div className="font-bold text-white truncate">{selectedInst.name}</div>
                  </div>

                  {/* Playback Controls & Duration */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Duração Total</span>
                      <div className="flex items-center gap-1 font-mono text-xs bg-slate-950/80 border border-white/10 rounded px-2 py-0.5">
                        <input
                          type="number"
                          min="1"
                          max="30"
                          step="0.5"
                          value={(selectedInst.config?.timelineDuration || 5000) / 1000}
                          onChange={(e) => {
                            const valSec = parseFloat(e.target.value) || 5;
                            onUpdateInstance(selectedInst.id, {
                              config: { ...selectedInst.config, timelineDuration: valSec * 1000 }
                            });
                          }}
                          className="w-10 bg-transparent border-0 outline-none p-0 text-right text-purple-300 font-bold focus:ring-0"
                        />
                        <span className="text-slate-500 text-[10px]">seg</span>
                      </div>
                    </div>

                    {/* Scrub bar time control */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>Cursor Temporal</span>
                        <span className="text-purple-300 font-bold">
                          {(((selectedInst.config?.timelineCurrentTime || 0)) / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={selectedInst.config?.timelineDuration || 5000}
                        step="50"
                        value={selectedInst.config?.timelineCurrentTime || 0}
                        onChange={(e) => {
                          onUpdateInstance(selectedInst.id, {
                            config: { ...selectedInst.config, timelineCurrentTime: parseInt(e.target.value) || 0 }
                          });
                        }}
                        className="w-full accent-purple-600 h-1 bg-black/40 rounded appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Add Keyframe Controls */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Adicionar Keyframe</div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { prop: 'x', label: 'Posição X', val: selectedInst.x },
                        { prop: 'y', label: 'Posição Y', val: selectedInst.y },
                        { prop: 'width', label: 'Largura', val: selectedInst.width || 220 },
                        { prop: 'height', label: 'Altura', val: selectedInst.height || 50 },
                        { prop: 'opacity', label: 'Opacidade', val: selectedInst.config?.effOpacity !== undefined ? selectedInst.config.effOpacity : 100 },
                        { prop: 'rotation', label: 'Rotação', val: selectedInst.config?.rotation || 0 },
                      ].map(item => (
                        <button
                          key={item.prop}
                          type="button"
                          onClick={() => {
                            const curTime = selectedInst.config?.timelineCurrentTime || 0;
                            const keyframes = selectedInst.config?.keyframes || {};
                            const propKf = keyframes[item.prop] || [];
                            const existingIdx = propKf.findIndex(kf => Math.abs(kf.time - curTime) < 100);
                            let updatedPropKf;
                            if (existingIdx >= 0) {
                              updatedPropKf = propKf.map((kf, i) => i === existingIdx ? { ...kf, value: item.val } : kf);
                            } else {
                              updatedPropKf = [...propKf, { time: curTime, value: item.val, easing: 'ease' }].sort((a, b) => a.time - b.time);
                            }

                            onUpdateInstance(selectedInst.id, {
                              config: {
                                ...selectedInst.config,
                                keyframes: {
                                  ...keyframes,
                                  [item.prop]: updatedPropKf
                                }
                              }
                            });
                          }}
                          className="py-1.5 px-2 bg-purple-600/10 hover:bg-purple-600/20 active:scale-95 border border-purple-500/20 rounded-lg text-[10px] font-bold text-purple-200 transition-all text-center flex items-center justify-between"
                        >
                          <span>{item.label}</span>
                          <span className="text-[9px] font-mono text-purple-400">+ KF</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Existing Keyframes List */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Keyframes Gravados</div>
                    
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {Object.entries(selectedInst.config?.keyframes || {}).flatMap(([prop, kfs]) => 
                        (kfs || []).map((kf, idx) => ({ prop, kf, idx }))
                      ).sort((a, b) => a.kf.time - b.kf.time).map(({ prop, kf, idx }) => (
                        <div key={`${prop}-${idx}`} className="flex items-center justify-between bg-slate-950/40 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-500" />
                            <span className="text-purple-300 uppercase font-bold">{prop}</span>
                            <span className="text-slate-400">@ {(kf.time / 1000).toFixed(1)}s</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-200 font-semibold">{kf.value}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const keyframes = { ...(selectedInst.config?.keyframes || {}) };
                                keyframes[prop] = keyframes[prop].filter((_, i) => i !== idx);
                                if (keyframes[prop].length === 0) delete keyframes[prop];
                                onUpdateInstance(selectedInst.id, {
                                  config: { ...selectedInst.config, keyframes }
                                });
                              }}
                              className="text-slate-500 hover:text-red-400 transition-colors p-0.5 rounded"
                              title="Remover keyframe"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {Object.keys(selectedInst.config?.keyframes || {}).length === 0 && (
                        <div className="text-center py-4 text-[10px] text-slate-500 font-mono">
                          Nenhum keyframe gravado ainda. Defina o tempo no cursor e adicione propriedades acima.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="py-2 px-3 rounded-lg border border-white/5 bg-slate-950/30">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Dica: A Timeline interpola os valores gravados de forma fluida durante a reprodução no Visualizador, mantendo prioridade temporal sem sobrescrever os valores-base permanentes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      <GalleryPicker
        open={galleryPickerOpen}
        onClose={() => setGalleryPickerOpen(false)}
        onSelect={(url) => onUpdateBackground({ image: url })}
        title="Escolher Imagem para Fundo da Overlay"
      />

      <TemplateEditorGalleryModal open={templateGalleryOpen} onClose={() => setTemplateGalleryOpen(false)}
        onSelect={item => onAddInstance({ widgetId: 'library-shape', isFullWidget: true,
          name: item.name, width: 360, height: 240,
          defaultConfig: { shapeType: 'rectangle', textColor: 'transparent', bgImage: item.imageUrl, backgroundImage: item.imageUrl } })} />

      <GalleryPicker
        open={elementGalleryOpen}
        onClose={() => setElementGalleryOpen(false)}
        onSelect={(url) => {
          if (selectedInst) {
            onUpdateInstance(selectedInst.id, {
              config: {
                ...selectedInst.config,
                bgImage: url,
                backgroundImage: url
              }
            });
          }
        }}
        title="Escolher Imagem para o Fundo do Objeto Selecionado"
      />

      <PrebuiltOverlayGalleryModal
        open={prebuiltModalOpen}
        onClose={() => setPrebuiltModalOpen(false)}
        onSelect={(url) => onUpdateBackground({ image: url, opacity: 100, type: 'image' })}
        currentImage={background?.image}
      />

      <PrebuiltStructuralOverlaysModal
        open={structuralModalOpen}
        onClose={() => setStructuralModalOpen(false)}
        onApplyStructuralPreset={(item) => {
          onAddInstance({
            widgetId: item.targetWidgetId,
            name: item.archetypeName,
            defaultConfig: item.config,
            width: item.width,
            height: item.height,
            isFullWidget: true
          });
        }}
      />
      </div>
    </aside>
  );
}
