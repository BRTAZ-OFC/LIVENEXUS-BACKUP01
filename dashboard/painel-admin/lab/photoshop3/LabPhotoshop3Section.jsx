import React, { useState, useRef, useEffect } from 'react';
import {
  Type, Image as ImageIcon, Square, Circle, Trash2, ChevronUp, ChevronDown,
  Sparkles, Play, Layers, Minus, Triangle, Zap, MoveRight, Repeat,
  ChevronLeft, ChevronRight, Search, X, Smile
} from 'lucide-react';
import 'iconify-icon';

/* ──────────────────────────────────────────────────────────────
   Catálogo de Coleções de Animações de Texto
   Cada coleção permanece isolada para evitar sobrescrita de efeitos.
   Novas coleções podem ser adicionadas no futuro como 3, 4, 5...
   ────────────────────────────────────────────────────────────── */
const TEXT_ANIMATION_COLLECTIONS = [
  {
    id: 'text-col-1',
    name: 'Animações de Texto 1',
    description: 'Efeitos tipográficos clássicos (MotionEditor)',
    items: [
      { id: 'typewriter', label: 'Typewriter (Máquina de Escrever)', animClass: 'anim-typewriter' },
      { id: 'typewriter-soft', label: 'Soft Type In (Digitação Suave)', animClass: 'anim-typewriter-soft' },
      { id: 'char-pop-type', label: 'Pop Characters (Letras Saltando)', animClass: 'anim-char-pop' },
      { id: 'falling-letters', label: 'Falling Letters (Letras Caindo)', animClass: 'anim-falling' },
      { id: 'rising-letters', label: 'Rising Letters (Letras Subindo)', animClass: 'anim-rising' },
      { id: 'spin-type', label: 'Spin Type (Giro Tipográfico)', animClass: 'anim-spin-type' },
      { id: 'blur-type', label: 'Blur Type (Tipo Desfoque)', animClass: 'anim-blur-type' },
      { id: 'text-pop', label: 'Text Pop (Explosão de Texto)', animClass: 'anim-text-pop' },
      { id: 'text-flicker', label: 'Flicker In (Cintilar / Piscar)', animClass: 'anim-text-flicker' },
    ],
  },
  {
    id: 'text-col-2',
    name: 'Animações de Texto 2',
    description: 'Efeitos dinâmicos, neon, gradientes e letras',
    items: [
      { id: 't2-neon-glow', label: 'Neon Glow Pulse (Brilho Neon)', animClass: 'anim-text-neon-glow' },
      { id: 't2-rainbow-flow', label: 'Rainbow Flow (Gradiente Vivo)', animClass: 'anim-text-rainbow-flow' },
      { id: 't2-wavy-wave', label: 'Wavy Letter (Ondulação Suave)', animClass: 'anim-text-wavy-wave' },
      { id: 't2-cyber-glitch', label: 'Cyber Glitch (Distorção Digital)', animClass: 'anim-text-cyber-glitch' },
      { id: 't2-shimmer-shine', label: 'Shimmer Sweeper (Varredura de Luz)', animClass: 'anim-text-shimmer-shine' },
      { id: 't2-shadow-pop', label: '3D Shadow Pop (Profundidade 3D)', animClass: 'anim-text-shadow-pop' },
      { id: 't2-tracking-expand', label: 'Tracking Expand (Espaçamento)', animClass: 'anim-text-tracking-expand' },
      { id: 't2-rubber-stretch', label: 'Rubber Text (Elástico / Mola)', animClass: 'anim-text-rubber-stretch' },
      { id: 't2-bounce-letters', label: 'Bounce Letters (Salto Letras)', animClass: 'anim-text-bounce-letters' },
      { id: 't2-swing-letters', label: 'Swing Letters (Pêndulo)', animClass: 'anim-text-swing-letters' },
      { id: 't2-flip-3d', label: 'Flip 3D Type (Giro Tipográfico)', animClass: 'anim-text-flip-3d' },
      { id: 't2-flicker-sign', label: 'Flicker Sign (Letreiro Piscante)', animClass: 'anim-text-flicker-sign' },
      { id: 't2-smoke-blur', label: 'Smoke Dissolve (Névoa / Fumaça)', animClass: 'anim-text-smoke-blur' },
      { id: 't2-heartbeat-throb', label: 'Heartbeat Throb (Pulso Duplo)', animClass: 'anim-text-heartbeat-throb' },
      { id: 't2-jitter-shiver', label: 'Jitter Shiver (Vibração / Tremor)', animClass: 'anim-text-jitter-shiver' },
    ],
  },
  {
    id: 'text-col-react-animator',
    name: 'Text Animator (React)',
    description: 'Animações baseadas em react-text-animator',
    items: [
       { id: 'ta-slide-up', label: 'Slide Up Text', animClass: 'anim-ta-slide-up' },
       { id: 'ta-fade-in-blur', label: 'Fade Blur', animClass: 'anim-ta-fade-in-blur' },
    ]
  },
  {
    id: 'text-col-reveal',
    name: 'Text Reveal (React)',
    description: 'Efeitos de revelação de texto',
    items: [
       { id: 'tr-reveal-down', label: 'Reveal Down', animClass: 'anim-tr-reveal-down' },
       { id: 'tr-reveal-right', label: 'Reveal Right', animClass: 'anim-tr-reveal-right' },
    ]
  }
];

const IMAGE_TRANSITIONS = [
  { id: 'gl-fade', label: 'GL Fade', animClass: 'anim-gl-fade' },
  { id: 'gl-zoom-blur', label: 'GL Zoom Blur', animClass: 'anim-gl-zoom-blur' },
];

/* ──────────────────────────────────────────────────────────────
   Catálogo Real do MotionEditor (tomaslachmann/motion-editor)
   PRESETS extraídos diretamente de AnimationPresetsPanel.tsx
   ────────────────────────────────────────────────────────────── */
const MOTION_EDITOR_PRESETS = {
  // Animações reais aplicáveis a IMAGENS e aos demais ELEMENTOS
  imageElements: [
    { id: 'phone-twist-in', label: 'Giro 3D Phone Twist', animClass: 'anim-phone-twist-in' },
    { id: 'flip-x', label: 'Flip In X (Giro 3D Horiz.)', animClass: 'anim-flip-x' },
    { id: 'flip-y', label: 'Flip In Y (Giro 3D Vert.)', animClass: 'anim-flip-y' },
    { id: 'perspective-tilt', label: 'Perspective Tilt (Inclinação 3D)', animClass: 'anim-perspective-tilt' },
    { id: 'lift', label: 'Elevação 3D (Lift)', animClass: 'anim-lift' },
    { id: 'glitch', label: 'Glitch (Distorção Digital)', animClass: 'anim-glitch' },
    { id: 'bounce-in', label: 'Bounce In (Salto Elástico)', animClass: 'anim-bounce-in' },
    { id: 'scale-in', label: 'Scale In (Zoom de Entrada)', animClass: 'anim-scale-in' },
    { id: 'scale-out', label: 'Scale Out (Zoom de Saída)', animClass: 'anim-scale-out' },
    { id: 'fade-in', label: 'Fade In (Surgir)', animClass: 'anim-fade-in' },
    { id: 'fade-out', label: 'Fade Out (Desaparecer)', animClass: 'anim-fade-out' },
    { id: 'fade-up', label: 'Fade In Up (Subir com Fade)', animClass: 'anim-fade-up' },
    { id: 'fade-down', label: 'Fade In Down (Descer com Fade)', animClass: 'anim-fade-down' },
    { id: 'slide-left', label: 'Slide In Left (Deslizar Esq.)', animClass: 'anim-slide-left' },
    { id: 'slide-right', label: 'Slide In Right (Deslizar Dir.)', animClass: 'anim-slide-right' },
    { id: 'blur-in', label: 'Blur In (Desfoque de Entrada)', animClass: 'anim-blur-in' },
    { id: 'breath-soft', label: 'Respiração Suave (Soft)', animClass: 'anim-breath-soft' },
    { id: 'breath-glow', label: 'Brilho Pulsante (Glow)', animClass: 'anim-breath-glow' },
    { id: 'breath-float', label: 'Flutuação Contínua (Float)', animClass: 'anim-breath-float' },
    { id: 'breath-bob', label: 'Balanço Vertical (Bob)', animClass: 'anim-breath-bob' },
  ],
  in: [
    { id: 'fade-in', label: 'Fade In', animClass: 'anim-fade-in' },
    { id: 'fade-up', label: 'Fade In Up', animClass: 'anim-fade-up' },
    { id: 'fade-down', label: 'Fade In Down', animClass: 'anim-fade-down' },
    { id: 'slide-left', label: 'Slide In Left', animClass: 'anim-slide-left' },
    { id: 'slide-right', label: 'Slide In Right', animClass: 'anim-slide-right' },
    { id: 'scale-in', label: 'Scale In', animClass: 'anim-scale-in' },
    { id: 'bounce-in', label: 'Bounce In', animClass: 'anim-bounce-in' },
    { id: 'flip-x', label: 'Flip In X', animClass: 'anim-flip-x' },
    { id: 'flip-y', label: 'Flip In Y', animClass: 'anim-flip-y' },
    { id: 'blur-in', label: 'Blur In', animClass: 'anim-blur-in' },
  ],
  out: [
    { id: 'fade-out', label: 'Fade Out', animClass: 'anim-fade-out' },
    { id: 'scale-out', label: 'Scale Out', animClass: 'anim-scale-out' },
  ],
  text: [
    { id: 'typewriter', label: 'Typewriter (Máquina de Escrever)', animClass: 'anim-typewriter' },
    { id: 'typewriter-soft', label: 'Soft Type In (Digitação Suave)', animClass: 'anim-typewriter-soft' },
    { id: 'char-pop-type', label: 'Pop Characters (Letras Saltando)', animClass: 'anim-char-pop' },
    { id: 'falling-letters', label: 'Falling Letters (Letras Caindo)', animClass: 'anim-falling' },
    { id: 'rising-letters', label: 'Rising Letters (Letras Subindo)', animClass: 'anim-rising' },
    { id: 'spin-type', label: 'Spin Type (Giro Tipográfico)', animClass: 'anim-spin-type' },
    { id: 'blur-type', label: 'Blur Type (Tipo Desfoque)', animClass: 'anim-blur-type' },
    { id: 'text-pop', label: 'Text Pop (Explosão de Texto)', animClass: 'anim-text-pop' },
    { id: 'text-flicker', label: 'Flicker In (Cintilar / Piscar)', animClass: 'anim-text-flicker' },
  ],
};

/* ──────────────────────────────────────────────────────────────
   Efeitos Reais do MotionEditor (EffectsPanel.tsx)
   blur, backdropBlur, brightness, contrast, grayscale, shadow
   ────────────────────────────────────────────────────────────── */
const MOTION_EDITOR_EFFECTS = [
  { id: 'blur-0', label: 'Desfoque: 0px', prop: 'blur', val: 0 },
  { id: 'blur-4', label: 'Desfoque: 4px', prop: 'blur', val: 4 },
  { id: 'blur-10', label: 'Desfoque: 10px', prop: 'blur', val: 10 },
  { id: 'blur-20', label: 'Desfoque: 20px', prop: 'blur', val: 20 },
  { id: 'bright-100', label: 'Brilho: 100%', prop: 'brightness', val: 100 },
  { id: 'bright-140', label: 'Brilho: 140%', prop: 'brightness', val: 140 },
  { id: 'bright-60', label: 'Brilho: 60%', prop: 'brightness', val: 60 },
  { id: 'contrast-100', label: 'Contraste: 100%', prop: 'contrast', val: 100 },
  { id: 'contrast-150', label: 'Contraste: 150%', prop: 'contrast', val: 150 },
  { id: 'contrast-70', label: 'Contraste: 70%', prop: 'contrast', val: 70 },
  { id: 'gray-0', label: 'Escala de Cinza: 0%', prop: 'grayscale', val: 0 },
  { id: 'gray-100', label: 'Escala de Cinza: 100%', prop: 'grayscale', val: 100 },
  { id: 'shadow-none', label: 'Sombra: Nenhuma', prop: 'shadow', val: { x: 0, y: 0, blur: 0 } },
  { id: 'shadow-soft', label: 'Sombra: Suave', prop: 'shadow', val: { x: 0, y: 8, blur: 16 } },
  { id: 'shadow-bold', label: 'Sombra: Elevada', prop: 'shadow', val: { x: 0, y: 16, blur: 32 } },
];

export default function LabPhotoshop3Section() {
  const [elements, setElements] = useState([
    {
      id: 'el-1',
      type: 'text',
      x: 160,
      y: 120,
      width: 250,
      height: 52,
      content: 'MotionEditor Texto',
      color: '#8b5cf6',
      fontSize: 22,
      opacity: 1,
      rotation: 0,
      blur: 0,
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      shadow: { x: 0, y: 0, blur: 0 },
      animation: 'fade-in',
      animDuration: 1.0,
      speed: 1.0,
      repeat: false,
    },
    {
      id: 'el-2',
      type: 'shape',
      shapeType: 'rect',
      x: 160,
      y: 200,
      width: 150,
      height: 100,
      color: '#3b82f6',
      borderRadius: 10,
      opacity: 1,
      rotation: 0,
      blur: 0,
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      shadow: { x: 0, y: 0, blur: 0 },
      animation: 'bounce-in',
      animDuration: 1.2,
      speed: 1.0,
      repeat: false,
    },
    {
      id: 'el-3',
      type: 'shape',
      shapeType: 'circle',
      x: 350,
      y: 200,
      width: 100,
      height: 100,
      color: '#10b981',
      borderRadius: 50,
      opacity: 1,
      rotation: 0,
      blur: 0,
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      shadow: { x: 0, y: 0, blur: 0 },
      animation: 'breath-float',
      animDuration: 1.5,
      speed: 1.0,
      repeat: true,
    },
    {
      id: 'el-4',
      type: 'image',
      x: 480,
      y: 120,
      width: 220,
      height: 180,
      src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60',
      opacity: 1,
      rotation: 0,
      blur: 0,
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      shadow: { x: 0, y: 8, blur: 16 },
      animation: 'phone-twist-in',
      animDuration: 1.4,
      speed: 1.0,
      repeat: false,
    },
  ]);

  const [selectedId, setSelectedId] = useState('el-1');
  const [draggingId, setDraggingId] = useState(null);
  const [resizingHandle, setResizingHandle] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, elX: 0, elY: 0 });
  const [animKey, setAnimKey] = useState(0);
  const canvasRef = useRef(null);

const CATEGORIES = [
  {
    id: 'image-elements', label: 'Imagens & Elem.', icon: Zap,
    collections: [
      { name: 'Padrões', items: MOTION_EDITOR_PRESETS.imageElements },
      { name: 'Transições GL', items: IMAGE_TRANSITIONS }
    ]
  },
  {
    id: 'text', label: 'Texto', icon: Type,
    collections: TEXT_ANIMATION_COLLECTIONS
  },
  {
    id: 'icons', label: 'Ícones', icon: Smile,
    collections: [{ name: 'Galeria', items: [
        { id: 'icon-star', label: 'Estrela', icon: 'mdi:star' },
        { id: 'icon-heart', label: 'Coração', icon: 'mdi:heart' },
        { id: 'icon-check', label: 'Check', icon: 'mdi:check' },
        { id: 'icon-circle', label: 'Círculo', icon: 'mdi:circle' },
    ] }]
  },
  {
    id: 'in', label: 'Entrada (In)', icon: Play,
    collections: [{ name: 'Entradas', items: MOTION_EDITOR_PRESETS.in }]
  },
  {
    id: 'out', label: 'Saída (Out)', icon: MoveRight,
    collections: [{ name: 'Saídas', items: MOTION_EDITOR_PRESETS.out }]
  },
  {
    id: 'fx', label: 'Efeitos (FX)', icon: Sparkles,
    collections: [{ name: 'Ajustes', items: MOTION_EDITOR_EFFECTS }]
  },
  {
    id: 'tools', label: 'Ferramentas', icon: Layers,
    collections: [{
      name: 'Adicionar', items: [
        { id: 'tool-text', label: '+ Texto', type: 'text', icon: Type, iconColor: 'text-violet-400' },
        { id: 'tool-rect', label: '+ Retângulo', type: 'shape', shapeType: 'rect', icon: Square, iconColor: 'text-blue-400' },
        { id: 'tool-circle', label: '+ Círculo', type: 'shape', shapeType: 'circle', icon: Circle, iconColor: 'text-emerald-400' },
        { id: 'tool-triangle', label: '+ Triângulo', type: 'shape', shapeType: 'triangle', icon: Triangle, iconColor: 'text-amber-400' },
        { id: 'tool-line', label: '+ Linha', type: 'shape', shapeType: 'line', icon: Minus, iconColor: 'text-purple-400' },
        { id: 'tool-image', label: '+ Imagem', type: 'image', icon: ImageIcon, iconColor: 'text-pink-400' },
      ]
    }]
  },
];

  // Bottom toolbar category state
  const [isBarOpen, setIsBarOpen] = useState(true);

  // Generic pop-up state
  const [activePopupCategory, setActivePopupCategory] = useState(null);
  const [selectedColId, setSelectedColId] = useState(null);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Horizontal category carousel scroll state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [canScrollLeftPopup, setCanScrollLeftPopup] = useState(false);
  const [canScrollRightPopup, setCanScrollRightPopup] = useState(true);
  const categoriesContainerRef = useRef(null);
  const collectionsContainerRef = useRef(null);

  const updateScrollButtons = (containerRef, setLeft, setRight) => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const atStart = scrollLeft <= 2;
    const atEnd = scrollLeft >= (scrollWidth - clientWidth - 2);
    setLeft(!atStart);
    setRight(!atEnd);
  };

  const scrollContainer = (containerRef, direction, setLeft, setRight) => {
    const el = containerRef.current;
    if (!el) return;
    const scrollAmount = 180;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(() => updateScrollButtons(containerRef, setLeft, setRight), 350);
  };

  const scrollCategories = (direction) => {
    scrollContainer(categoriesContainerRef, direction, setCanScrollLeft, setCanScrollRight);
  };


  useEffect(() => {
    updateScrollButtons(categoriesContainerRef, setCanScrollLeft, setCanScrollRight);
    const t = setTimeout(() => updateScrollButtons(categoriesContainerRef, setCanScrollLeft, setCanScrollRight), 100);
    window.addEventListener('resize', () => updateScrollButtons(categoriesContainerRef, setCanScrollLeft, setCanScrollRight));
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', () => updateScrollButtons(categoriesContainerRef, setCanScrollLeft, setCanScrollRight));
    };
  }, []);
  
  useEffect(() => {
    if (activePopupCategory) {
       const t = setTimeout(() => updateScrollButtons(collectionsContainerRef, setCanScrollLeftPopup, setCanScrollRightPopup), 100);
       return () => clearTimeout(t);
    }
  }, [activePopupCategory]);

  const activeCategory = CATEGORIES.find((c) => c.id === activePopupCategory);
  
  // Reset collection selection when category changes
  useEffect(() => {
    if (activeCategory && (!selectedColId || !activeCategory.collections.find(c => c.name === selectedColId))) {
      setSelectedColId(activeCategory.collections[0].name);
    }
  }, [activePopupCategory]);

  const currentCollection = activeCategory?.collections.find((c) => c.name === selectedColId) || activeCategory?.collections[0];

  const filterItems = (items) => {
    if (!items) return [];
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => (item.label || item.name || '').toLowerCase().includes(q));
  };


  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  // Keyboard Delete / Backspace
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        e.preventDefault();
        setElements((prev) => prev.filter((el) => el.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  // Tool: Adicionar elementos
  const handleAddTool = (toolType, shapeType = 'rect') => {
    const baseId = `el-${Date.now()}`;
    const x = 180 + Math.random() * 40;
    const y = 180 + Math.random() * 40;
    let newEl = null;

    if (toolType === 'text') {
      newEl = {
        id: baseId,
        type: 'text',
        x, y, width: 220, height: 48,
        content: 'Novo Texto',
        color: '#ffffff',
        fontSize: 20,
        opacity: 1, rotation: 0, blur: 0, brightness: 100, contrast: 100, grayscale: 0,
        shadow: { x: 0, y: 0, blur: 0 },
        animation: 'typewriter',
        animDuration: 1.2,
        speed: 1.0,
        repeat: false,
      };
    } else if (toolType === 'shape') {
      newEl = {
        id: baseId,
        type: 'shape',
        shapeType,
        x, y,
        width: shapeType === 'line' ? 160 : 130,
        height: shapeType === 'line' ? 6 : 130,
        color: shapeType === 'circle' ? '#ec4899' : shapeType === 'triangle' ? '#f59e0b' : '#6366f1',
        borderRadius: shapeType === 'circle' ? 65 : shapeType === 'line' ? 3 : 10,
        opacity: 1, rotation: 0, blur: 0, brightness: 100, contrast: 100, grayscale: 0,
        shadow: { x: 0, y: 0, blur: 0 },
        animation: 'breath-soft',
        animDuration: 1.2,
        speed: 1.0,
        repeat: false,
      };
    } else if (toolType === 'image') {
      const url = prompt('URL da Imagem:', 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&auto=format&fit=crop&q=60');
      if (!url) return;
      newEl = {
        id: baseId,
        type: 'image',
        x, y, width: 220, height: 160,
        src: url,
        opacity: 1, rotation: 0, blur: 0, brightness: 100, contrast: 100, grayscale: 0,
        shadow: { x: 0, y: 8, blur: 16 },
        animation: 'phone-twist-in',
        animDuration: 1.4,
        speed: 1.0,
        repeat: false,
      };
    } else if (toolType === 'icon') {
      const icon = prompt('Nome do Ícone Iconify (ex: mdi:star):', 'mdi:star');
      if (!icon) return;
      newEl = {
        id: baseId,
        type: 'icon',
        x, y, width: 64, height: 64,
        icon,
        opacity: 1, rotation: 0, blur: 0, brightness: 100, contrast: 100, grayscale: 0,
        shadow: { x: 0, y: 0, blur: 0 },
        animation: 'fade-in',
        animDuration: 1.0,
        speed: 1.0,
        repeat: false,
      };
    }

    if (newEl) {
      setElements((prev) => [...prev, newEl]);
      setSelectedId(newEl.id);
    }
  };

  const updateSelected = (field, value) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, [field]: value } : el))
    );
  };

  const toggleRepeat = () => {
    if (!selectedElement) return;
    const newRepeat = !selectedElement.repeat;
    updateSelected('repeat', newRepeat);
    setAnimKey((prev) => prev + 1);
  };

  const applyAnimation = (animId) => {
    if (!selectedElement) return;
    updateSelected('animation', animId);
    setAnimKey((prev) => prev + 1);
  };

  const triggerAnimationPreview = () => {
    setAnimKey((prev) => prev + 1);
  };

  // Dragging handlers
  const handleMouseDown = (e, el) => {
    if (resizingHandle) return;
    e.stopPropagation();
    setSelectedId(el.id);
    setDraggingId(el.id);
    const canvasRect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    setDragOffset({
      x: (e.clientX - canvasRect.left) - el.x,
      y: (e.clientY - canvasRect.top) - el.y,
    });
  };

  const handleResizeStart = (e, el, handle) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setResizingHandle(handle);
    const canvasRect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    setResizeStart({
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top,
      w: el.width,
      h: el.height,
      elX: el.x,
      elY: el.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      const mouseX = e.clientX - canvasRect.left;
      const mouseY = e.clientY - canvasRect.top;

      if (draggingId) {
        setElements((prev) =>
          prev.map((el) => {
            if (el.id === draggingId) {
              return {
                ...el,
                x: Math.max(0, mouseX - dragOffset.x),
                y: Math.max(0, mouseY - dragOffset.y),
              };
            }
            return el;
          })
        );
      } else if (resizingHandle && selectedId) {
        const dx = mouseX - resizeStart.x;
        const dy = mouseY - resizeStart.y;
        setElements((prev) =>
          prev.map((el) => {
            if (el.id === selectedId) {
              let newW = resizeStart.w;
              let newH = resizeStart.h;
              let newX = resizeStart.elX;
              let newY = resizeStart.elY;

              if (resizingHandle.includes('r')) newW = Math.max(40, resizeStart.w + dx);
              if (resizingHandle.includes('b')) newH = Math.max(30, resizeStart.h + dy);
              if (resizingHandle.includes('l')) {
                const potentialW = resizeStart.w - dx;
                if (potentialW >= 40) {
                  newW = potentialW;
                  newX = resizeStart.elX + dx;
                }
              }
              if (resizingHandle.includes('t')) {
                const potentialH = resizeStart.h - dy;
                if (potentialH >= 30) {
                  newH = potentialH;
                  newY = resizeStart.elY + dy;
                }
              }

              return { ...el, x: newX, y: newY, width: newW, height: newH };
            }
            return el;
          })
        );
      }
    };

    const handleMouseUp = () => {
      setDraggingId(null);
      setResizingHandle(null);
    };

    if (draggingId || resizingHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, resizingHandle, selectedId, dragOffset, resizeStart]);

  const getAnimationClass = (anim) => {
    if (!anim || anim === 'none') return '';
    const allPresets = [
      ...MOTION_EDITOR_PRESETS.imageElements,
      ...MOTION_EDITOR_PRESETS.in,
      ...MOTION_EDITOR_PRESETS.out,
      ...MOTION_EDITOR_PRESETS.text,
      ...TEXT_ANIMATION_COLLECTIONS.flatMap((col) => col.items),
    ];
    const found = allPresets.find((p) => p.id === anim);
    return found ? found.animClass : '';
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] min-h-[700px] relative overflow-hidden rounded-2xl border border-white/10 bg-[#07090e] flex flex-col select-none">
      {/* Estilos CSS com keyframes reais do MotionEditor */}
      <style>{`
        @keyframes me-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes me-fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes me-fade-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes me-fade-down { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes me-slide-left { from { opacity: 0; transform: translateX(-200px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes me-slide-right { from { opacity: 0; transform: translateX(200px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes me-scale-in { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
        @keyframes me-scale-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0); } }
        @keyframes me-bounce-in {
          0% { opacity: 0; transform: scale(0); }
          60% { opacity: 1; transform: scale(1.2); }
          75% { transform: scale(0.9); }
          90% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes me-flip-x { from { opacity: 0; transform: perspective(400px) rotateX(90deg); } to { opacity: 1; transform: perspective(400px) rotateX(0deg); } }
        @keyframes me-flip-y { from { opacity: 0; transform: perspective(400px) rotateY(90deg); } to { opacity: 1; transform: perspective(400px) rotateY(0deg); } }
        @keyframes me-blur-in { from { opacity: 0; filter: blur(20px); } to { opacity: 1; filter: blur(0px); } }
        @keyframes me-glitch {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-10px, 5px); }
          20% { transform: translate(8px, -4px); }
          30% { transform: translate(-6px, -6px); }
          40% { transform: translate(5px, 7px); }
          50% { transform: translate(-3px, -2px); }
          60% { transform: translate(6px, 1px); }
          70% { transform: translate(-4px, 4px); }
          80% { transform: translate(3px, -5px); }
        }
        @keyframes me-perspective-tilt {
          0% { transform: perspective(600px) rotateX(15deg) rotateY(-10deg); }
          50% { transform: perspective(600px) rotateX(-10deg) rotateY(15deg); }
          100% { transform: perspective(600px) rotateX(0deg) rotateY(0deg); }
        }
        @keyframes me-lift {
          0% { transform: translateY(28px) scale(0.97); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
          100% { transform: translateY(0px) scale(1); filter: drop-shadow(0 16px 28px rgba(0,0,0,0.5)); }
        }
        @keyframes me-phone-twist-in {
          0% {
            opacity: 0;
            transform: perspective(900px) rotateY(-82deg) rotateX(8deg) rotateZ(-5deg) skewY(3deg) scale(0.88) translateZ(-120px);
            filter: blur(8px);
          }
          34% {
            opacity: 1;
            transform: perspective(900px) rotateY(18deg) rotateX(-4deg) rotateZ(2deg) skewY(-1.5deg) scale(1.035) translateZ(28px);
            filter: blur(0px);
          }
          62% {
            opacity: 1;
            transform: perspective(900px) rotateY(-8deg) rotateX(2deg) rotateZ(-1deg) skewY(0.8deg) scale(0.992) translateZ(8px);
            filter: blur(0px);
          }
          84% {
            opacity: 1;
            transform: perspective(900px) rotateY(2deg) rotateX(0deg) rotateZ(0.35deg) scale(1.006);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: perspective(900px) rotateY(0deg) rotateX(0deg) rotateZ(0deg) scale(1);
            filter: blur(0px);
          }
        }
        @keyframes me-breath-soft {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); }
          50% { transform: scale(1.06); filter: drop-shadow(0 12px 24px rgba(0,0,0,0.5)); }
        }
        @keyframes me-breath-glow {
          0%, 100% { transform: scale(1); filter: brightness(100%) drop-shadow(0 0 10px rgba(139,92,246,0.3)); }
          50% { transform: scale(1.05); filter: brightness(140%) drop-shadow(0 0 30px rgba(139,92,246,0.8)); }
        }
        @keyframes me-breath-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(1deg); }
        }
        @keyframes me-breath-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes me-typewriter {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }
        @keyframes me-type-soft {
          0% { opacity: 0; filter: blur(4px); transform: translateY(10px); }
          100% { opacity: 1; filter: blur(0); transform: translateY(0); }
        }
        @keyframes me-char-pop {
          0% { transform: scale(0.6); opacity: 0; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes me-falling {
          0% { transform: translateY(-40px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes me-rising {
          0% { transform: translateY(40px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes me-spin-type {
          0% { transform: rotate(-90deg) scale(0.5); opacity: 0; }
          100% { transform: rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes me-blur-type {
          0% { filter: blur(12px); opacity: 0; }
          100% { filter: blur(0); opacity: 1; }
        }
        @keyframes me-text-pop {
          0% { transform: scale(0.85); opacity: 0; }
          65% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes me-text-flicker {
          0%, 25%, 50% { opacity: 0.15; }
          15%, 35%, 100% { opacity: 1; }
        }

        .anim-fade-in { animation-name: me-fade-in; }
        .anim-fade-out { animation-name: me-fade-out; }
        .anim-fade-up { animation-name: me-fade-up; }
        .anim-fade-down { animation-name: me-fade-down; }
        .anim-slide-left { animation-name: me-slide-left; }
        .anim-slide-right { animation-name: me-slide-right; }
        .anim-scale-in { animation-name: me-scale-in; }
        .anim-scale-out { animation-name: me-scale-out; }
        .anim-bounce-in { animation-name: me-bounce-in; }
        .anim-flip-x { animation-name: me-flip-x; }
        .anim-flip-y { animation-name: me-flip-y; }
        .anim-blur-in { animation-name: me-blur-in; }
        .anim-glitch { animation-name: me-glitch; }
        .anim-perspective-tilt { animation-name: me-perspective-tilt; }
        .anim-lift { animation-name: me-lift; }
        .anim-phone-twist-in { animation-name: me-phone-twist-in; }
        .anim-breath-soft { animation-name: me-breath-soft; }
        .anim-breath-glow { animation-name: me-breath-glow; }
        .anim-breath-float { animation-name: me-breath-float; }
        .anim-breath-bob { animation-name: me-breath-bob; }
        .anim-typewriter { animation-name: me-typewriter; }
        .anim-typewriter-soft { animation-name: me-type-soft; }
        .anim-char-pop { animation-name: me-char-pop; }
        .anim-falling { animation-name: me-falling; }
        .anim-rising { animation-name: me-rising; }
        .anim-spin-type { animation-name: me-spin-type; }
        .anim-blur-type { animation-name: me-blur-type; }
        .anim-text-pop { animation-name: me-text-pop; }
        .anim-text-flicker { animation-name: me-text-flicker; }

        /* Keyframes para Coleção 2 de Animações de Texto */
        @keyframes ta-neon-glow {
          0%, 100% { text-shadow: 0 0 4px #a855f7, 0 0 10px #a855f7, 0 0 20px #8b5cf6, 0 0 40px #8b5cf6; filter: brightness(100%); }
          50% { text-shadow: 0 0 8px #c084fc, 0 0 18px #a855f7, 0 0 35px #a855f7, 0 0 60px #7c3aed; filter: brightness(130%); }
        }
        @keyframes ta-rainbow-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ta-wavy-wave {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-1.5deg); }
          75% { transform: translateY(8px) rotate(1.5deg); }
        }
        @keyframes ta-cyber-glitch {
          0%, 100% { transform: translate(0, 0); text-shadow: none; }
          15% { transform: translate(-3px, 1px); text-shadow: 2px 0 #06b6d4, -2px 0 #ec4899; }
          30% { transform: translate(3px, -1px); text-shadow: -2px 0 #06b6d4, 2px 0 #ec4899; }
          45% { transform: translate(-1px, 2px); text-shadow: 1px 0 #06b6d4, -1px 0 #ec4899; }
          60% { transform: translate(1px, -2px); text-shadow: -1px 0 #06b6d4, 1px 0 #ec4899; }
          75% { transform: translate(0, 0); text-shadow: none; }
        }
        @keyframes ta-shimmer-shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes ta-shadow-pop {
          0%, 100% { transform: translate(0, 0); text-shadow: none; }
          50% { transform: translate(-4px, -4px); text-shadow: 1px 1px #6366f1, 2px 2px #6366f1, 3px 3px #6366f1, 4px 4px #818cf8, 5px 5px #a5b4fc; }
        }
        @keyframes ta-tracking-expand {
          0%, 100% { letter-spacing: normal; opacity: 1; }
          50% { letter-spacing: 0.22em; opacity: 0.88; }
        }
        @keyframes ta-rubber-stretch {
          0%, 100% { transform: scale3d(1, 1, 1); }
          30% { transform: scale3d(1.22, 0.78, 1); }
          40% { transform: scale3d(0.78, 1.22, 1); }
          50% { transform: scale3d(1.12, 0.88, 1); }
          65% { transform: scale3d(0.96, 1.04, 1); }
          75% { transform: scale3d(1.04, 0.96, 1); }
        }
        @keyframes ta-bounce-letters {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px) scaleY(1.05); }
        }
        @keyframes ta-swing-letters {
          20% { transform: rotate3d(0, 0, 1, 15deg); }
          40% { transform: rotate3d(0, 0, 1, -10deg); }
          60% { transform: rotate3d(0, 0, 1, 5deg); }
          80% { transform: rotate3d(0, 0, 1, -5deg); }
          100% { transform: rotate3d(0, 0, 1, 0deg); }
        }
        @keyframes ta-flip-3d {
          0% { transform: perspective(400px) rotate3d(0, 1, 0, -360deg); }
          40% { transform: perspective(400px) translate3d(0, 0, 80px) rotate3d(0, 1, 0, -170deg); }
          50% { transform: perspective(400px) translate3d(0, 0, 80px) rotate3d(0, 1, 0, -190deg); }
          80% { transform: perspective(400px) rotate3d(0, 1, 0, 0deg); }
          100% { transform: perspective(400px) rotate3d(0, 1, 0, 0deg); }
        }
        @keyframes ta-flicker-sign {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.8)); }
          10%, 12% { opacity: 0.2; filter: none; }
          20%, 22% { opacity: 1; filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.8)); }
          50%, 52% { opacity: 0.3; filter: none; }
          70%, 72% { opacity: 1; filter: drop-shadow(0 0 14px rgba(245, 158, 11, 0.9)); }
        }
        @keyframes ta-smoke-blur {
          0%, 100% { filter: blur(0px); opacity: 1; transform: scale(1); }
          50% { filter: blur(5px); opacity: 0.45; transform: scale(1.05) translateY(-3px); }
        }
        @keyframes ta-heartbeat-throb {
          0%, 100% { transform: scale(1); }
          14% { transform: scale(1.16); }
          28% { transform: scale(1); }
          42% { transform: scale(1.1); }
          70% { transform: scale(1); }
        }
        @keyframes ta-jitter-shiver {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-2px, 1px); }
          40% { transform: translate(2px, -1px); }
          60% { transform: translate(-1px, -1px); }
          80% { transform: translate(1px, 2px); }
        }

        .anim-text-neon-glow { animation-name: ta-neon-glow; }
        .anim-text-rainbow-flow,
        .anim-text-rainbow-flow span,
        .anim-text-rainbow-flow input {
          background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ec4899);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation-name: ta-rainbow-flow;
        }
        .anim-text-wavy-wave { animation-name: ta-wavy-wave; }
        .anim-text-cyber-glitch { animation-name: ta-cyber-glitch; }
        .anim-text-shimmer-shine,
        .anim-text-shimmer-shine span,
        .anim-text-shimmer-shine input {
          background: linear-gradient(110deg, currentColor 35%, #ffffff 50%, currentColor 65%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation-name: ta-shimmer-shine;
        }
        .anim-text-shadow-pop { animation-name: ta-shadow-pop; }
        .anim-text-tracking-expand { animation-name: ta-tracking-expand; }
        .anim-text-rubber-stretch { animation-name: ta-rubber-stretch; }
        .anim-text-bounce-letters { animation-name: ta-bounce-letters; }
        .anim-text-swing-letters { animation-name: ta-swing-letters; }
        .anim-text-flip-3d { animation-name: ta-flip-3d; }
        .anim-text-flicker-sign { animation-name: ta-flicker-sign; }
        .anim-text-smoke-blur { animation-name: ta-smoke-blur; }
        .anim-text-heartbeat-throb { animation-name: ta-heartbeat-throb; }
        .anim-text-jitter-shiver { animation-name: ta-jitter-shiver; }
      `}</style>

      {/* Canvas Area: Clicar na área vazia é o único clique que desseleciona */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-[#0b0f19] cursor-default"
        onClick={(e) => {
          if (e.target === canvasRef.current) {
            setSelectedId(null);
          }
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {elements.map((el) => {
          const isSelected = el.id === selectedId;
          const animClass = getAnimationClass(el.animation);
          const shadowStyle = el.shadow
            ? `drop-shadow(${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px rgba(0,0,0,0.5))`
            : 'none';

          return (
            <div
              key={`${el.id}-${animKey}`}
              onMouseDown={(e) => handleMouseDown(e, el)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(el.id);
              }}
              style={{
                position: 'absolute',
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                height: `${el.height}px`,
                opacity: el.opacity ?? 1,
                transform: `rotate(${el.rotation || 0}deg)`,
                filter: `blur(${el.blur || 0}px) brightness(${el.brightness ?? 100}%) contrast(${el.contrast ?? 100}%) grayscale(${el.grayscale || 0}%) ${shadowStyle}`,
                animationDuration: `${(el.animDuration || 1.0) / (el.speed || 1.0)}s`,
                animationIterationCount: el.repeat ? 'infinite' : '1',
                animationFillMode: 'forwards',
                animationTimingFunction: 'ease-out',
              }}
              className={`absolute group cursor-move ${animClass} ${
                isSelected ? 'ring-2 ring-violet-500 shadow-xl shadow-violet-500/20 z-25' : 'hover:ring-1 hover:ring-white/30 z-10'
              }`}
            >
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {el.type === 'text' && (
                  <div
                    className="w-full h-full flex items-center px-2 font-sans font-medium"
                    style={{ color: el.color, fontSize: `${el.fontSize || 20}px` }}
                  >
                    {isSelected ? (
                      <input
                        type="text"
                        value={el.content}
                        onChange={(e) => updateSelected('content', e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-inherit font-inherit p-0 m-0"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate">{el.content}</span>
                    )}
                  </div>
                )}

                {el.type === 'shape' && (
                  <div
                    className="w-full h-full transition-all"
                    style={{
                      backgroundColor: el.color,
                      borderRadius: `${el.borderRadius || 0}px`,
                    }}
                  />
                )}

                {el.type === 'image' && (
                  <img
                    src={el.src}
                    alt="Canvas item"
                    className="w-full h-full object-cover pointer-events-none"
                  />
                )}
                {el.type === 'icon' && (
                  <iconify-icon icon={el.icon} width="100%" height="100%"></iconify-icon>
                )}
              </div>

              {isSelected && (
                <>
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-violet-500 border border-white rounded-full cursor-nwse-resize" onMouseDown={(e) => handleResizeStart(e, el, 'tl')} />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-violet-500 border border-white rounded-full cursor-nesw-resize" onMouseDown={(e) => handleResizeStart(e, el, 'tr')} />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-violet-500 border border-white rounded-full cursor-nesw-resize" onMouseDown={(e) => handleResizeStart(e, el, 'bl')} />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-violet-500 border border-white rounded-full cursor-nwse-resize" onMouseDown={(e) => handleResizeStart(e, el, 'br')} />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra Horizontal Inferior de Ferramentas: Botão Categoria -> Submenu de Botões */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 ${isBarOpen ? 'translate-y-0' : 'translate-y-[calc(100%-36px)]'}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center">
          <button
            onClick={() => setIsBarOpen(!isBarOpen)}
            className="flex items-center gap-2 px-5 py-1.5 rounded-t-2xl bg-[#0e121d]/90 backdrop-blur-md border-t border-x border-white/10 text-xs font-medium text-violet-300 hover:bg-[#131929] transition shadow-xl shadow-black/50"
          >
            <span>MotionEditor · Barra de Ferramentas & Efeitos</span>
            {isBarOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* Pop-up de Ferramentas / Coleções (aberto acima da barra) */}
        {activePopupCategory && (
          <div
            className="absolute bottom-[calc(100%+8px)] left-6 z-40 bg-[#0e1322]/98 backdrop-blur-2xl border border-white/15 rounded-2xl p-4 shadow-2xl shadow-black/80 max-w-[560px] w-[calc(100%-48px)] transition-all"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Pop-up */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                {activeCategory?.icon && <activeCategory.icon size={15} className="text-violet-400" />}
                <span className="text-xs font-semibold text-white">{activeCategory?.label}</span>
              </div>
              <button
                onClick={() => setActivePopupCategory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                title="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            {/* Seletor de Coleções */}
            <div className="flex items-center gap-2 mb-3">
              {canScrollLeftPopup && (
                <div className="mr-[4px] shrink-0">
                  <button onClick={() => scrollContainer(collectionsContainerRef, 'left', setCanScrollLeftPopup, setCanScrollRightPopup)} className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-slate-300">
                    <ChevronLeft size={15} />
                  </button>
                </div>
              )}
              <div ref={collectionsContainerRef} onScroll={() => updateScrollButtons(collectionsContainerRef, setCanScrollLeftPopup, setCanScrollRightPopup)} className="flex items-center gap-2 overflow-x-hidden pb-1" style={{ scrollbarWidth: 'none' }}>
                {activeCategory?.collections.map((col) => {
                  const isColActive = selectedColId === col.name;
                  return (
                    <button
                      key={col.name}
                      onClick={() => setSelectedColId(col.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 border shrink-0 ${
                        isColActive
                          ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{col.name}</span>
                    </button>
                  );
                })}
              </div>
              {canScrollRightPopup && (
                <div className="ml-[4px] shrink-0">
                  <button onClick={() => scrollContainer(collectionsContainerRef, 'right', setCanScrollLeftPopup, setCanScrollRightPopup)} className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-slate-300">
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Botões das Ferramentas/Animações da coleção selecionada */}
            <div className="flex items-center gap-2 flex-wrap max-h-52 overflow-y-auto pr-1">
              {filterItems(currentCollection?.items).length > 0 ? (
                filterItems(currentCollection.items).map((item) => {
                  const isItemActive = item.animClass 
                    ? selectedElement?.animation === item.id
                    : false;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.animClass) applyAnimation(item.id);
                        else if (item.prop) updateSelected(item.prop, item.val);
                        else if (item.type) handleAddTool(item.type, item.shapeType);
                        else if (item.icon) {
                          const baseId = `el-${Date.now()}`;
                          const x = 180 + Math.random() * 40;
                          const y = 180 + Math.random() * 40;
                          const newEl = {
                            id: baseId,
                            type: 'icon',
                            x, y, width: 64, height: 64,
                            icon: item.icon,
                            opacity: 1, rotation: 0, blur: 0, brightness: 100, contrast: 100, grayscale: 0,
                            shadow: { x: 0, y: 0, blur: 0 },
                            animation: 'fade-in',
                            animDuration: 1.0,
                            speed: 1.0,
                            repeat: false,
                          };
                          setElements((prev) => [...prev, newEl]);
                          setSelectedId(baseId);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 border ${
                        isItemActive
                          ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 italic py-2">
                  Nenhuma ferramenta encontrada.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-[#0b0f19]/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 shadow-2xl">
          {/* Botões Principais de Categoria (Row 1) */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 gap-3">
            {/* Navegação Horizontal das Categorias: Botões < e > FORA da área com 4px de espaço */}
            <div className="flex items-center min-w-0 max-w-[440px] sm:max-w-[500px] md:max-w-[560px] shrink-0">
              {/* Botão < : No início fica oculto */}
              {canScrollLeft && (
                <div className="mr-[4px] shrink-0">
                  <button
                    onClick={() => scrollCategories('left')}
                    className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition active:scale-95 shadow-sm"
                    title="Rolar categorias para a esquerda"
                  >
                    <ChevronLeft size={15} />
                  </button>
                </div>
              )}

              {/* Caixa/Área horizontal onde as categorias se movimentam (sem scrollbar) */}
              <div
                ref={categoriesContainerRef}
                onScroll={() => updateScrollButtons(categoriesContainerRef, setCanScrollLeft, setCanScrollRight)}
                className="flex items-center gap-2 overflow-x-hidden scroll-smooth py-0.5"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {[
                  { id: 'image-elements', label: 'Imagens & Elementos', icon: Zap },
                  { id: 'text', label: 'Animações de Texto', icon: Type },
                  { id: 'icons', label: 'Ícones', icon: Smile },
                  { id: 'in', label: 'Animações (In)', icon: Play },
                  { id: 'out', label: 'Animações (Out)', icon: MoveRight },
                  { id: 'fx', label: 'Efeitos (FX)', icon: Sparkles },
                  { id: 'tools', label: 'Ferramentas', icon: Layers },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activePopupCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActivePopupCategory(prev => prev === cat.id ? null : cat.id);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 border shrink-0 ${
                        isActive
                          ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Botão > : Visível até chegar ao final direito */}
              {canScrollRight && (
                <div className="ml-[4px] shrink-0">
                  <button
                    onClick={() => scrollCategories('right')}
                    className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition active:scale-95 shadow-sm"
                    title="Rolar categorias para a direita"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Controles do Lado Direito: Repetir, Barra de Pesquisa, Testar e Excluir */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {selectedElement && (
                <>
                    {/* Controle de Velocidade */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => updateSelected('speed', Math.max(0.05, (selectedElement.speed || 1.0) - 0.05))}
                        className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-slate-300"
                      >-</button>
                      
                      <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold mx-[4px]">
                        <span>Vel:</span>
                        <input
                          type="number"
                          min="0.05"
                          max="10"
                          step="0.05"
                          value={selectedElement.speed || 1.0}
                          onChange={(e) => updateSelected('speed', parseFloat(e.target.value))}
                          className="w-10 bg-transparent text-white text-center focus:outline-none"
                        />
                        <span>x</span>
                      </div>
                      
                      <button 
                        onClick={() => updateSelected('speed', Math.min(10, (selectedElement.speed || 1.0) + 0.05))}
                        className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-slate-300"
                      >+</button>
                    </div>

                    {/* Botão Repetir (Loop) */}
                    <button
                      onClick={toggleRepeat}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition active:scale-95 border ${
                        selectedElement.repeat
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title={selectedElement.repeat ? 'Animação em repetição contínua (loop)' : 'Executar apenas uma vez'}
                    >
                      <Repeat size={13} className={selectedElement.repeat ? 'animate-spin' : ''} />
                      <span>Repetir: {selectedElement.repeat ? 'Ligado' : 'Desligado'}</span>
                    </button>
                </>
              )}

              {/* Barra de Pesquisa ao lado do botão Repetir */}
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-7 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500/60 focus:bg-white/10 w-28 sm:w-36 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-slate-400 hover:text-white text-xs font-bold"
                    title="Limpar pesquisa"
                  >
                    ✕
                  </button>
                )}
              </div>

              {selectedElement && (
                <>
                  {/* Botão Testar Animação */}
                  <button
                    onClick={triggerAnimationPreview}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/30 text-xs font-medium transition active:scale-95"
                    title="Executar animação do elemento selecionado"
                  >
                    <Play size={13} />
                    <span>Testar Animação</span>
                  </button>

                  {/* Botão Excluir */}
                  <button
                    onClick={() => {
                      setElements((prev) => prev.filter((el) => el.id !== selectedId));
                      setSelectedId(null);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium transition active:scale-95"
                  >
                    <Trash2 size={13} />
                    <span>Excluir</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Submenu de Botões da Categoria Selecionada (Row 2) */}
          <div className="min-h-[48px] flex items-center">
            {/* Categoria: Animações Reais de Imagens & Elementos do MotionEditor */}
            {activeCategory === 'image-elements' && (
              <div className="flex items-center gap-2 w-full flex-wrap">
                {selectedElement ? (
                  <>
                    {/* Botão Repetir nas opções de animações */}
                    <button
                      onClick={toggleRepeat}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 border ${
                        selectedElement.repeat
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title={selectedElement.repeat ? 'Animação em repetição contínua (loop)' : 'Executar apenas uma vez'}
                    >
                      <Repeat size={13} className={selectedElement.repeat ? 'animate-spin' : ''} />
                      <span>Repetir: {selectedElement.repeat ? 'Ativado' : 'Desativado'}</span>
                    </button>
                    <div className="h-5 w-px bg-white/10 mx-1" />

                    {filterItems(MOTION_EDITOR_PRESETS.imageElements).length > 0 ? (
                      filterItems(MOTION_EDITOR_PRESETS.imageElements).map((preset) => {
                        const isAnimActive = selectedElement.animation === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => applyAnimation(preset.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 border ${
                              isAnimActive
                                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        Nenhuma animação encontrada para "{searchQuery}".
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-400 italic">Selecione uma imagem ou elemento no Canvas para aplicar as animações do MotionEditor.</div>
                )}
              </div>
            )}

            {/* Categoria: Animações de Texto (Text) - Mostra os botões da coleção selecionada */}
            {activeCategory === 'text' && (
              <div className="flex items-center gap-2 w-full flex-wrap">
                {selectedElement ? (
                  <>
                    {/* Botão Repetir nas opções de animações */}
                    <button
                      onClick={toggleRepeat}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 border ${
                        selectedElement.repeat
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title={selectedElement.repeat ? 'Animação em repetição contínua (loop)' : 'Executar apenas uma vez'}
                    >
                      <Repeat size={13} className={selectedElement.repeat ? 'animate-spin' : ''} />
                      <span>Repetir: {selectedElement.repeat ? 'Ativado' : 'Desativado'}</span>
                    </button>

                    {/* Botão para alternar / abrir Pop-up das Coleções */}
                    <div className="h-5 w-px bg-white/10 mx-1" />

                    {filterItems(currentTextCollection.items).length > 0 ? (
                      filterItems(currentTextCollection.items).map((preset) => {
                        const isAnimActive = selectedElement.animation === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => applyAnimation(preset.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 border ${
                              isAnimActive
                                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        Nenhuma animação encontrada para "{searchQuery}".
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-400 italic">Selecione um elemento de texto para aplicar animações de tipografia.</div>
                )}
              </div>
            )}

            {/* Categoria: Animações de Entrada (In) Reais */}
            {activeCategory === 'in' && (
              <div className="flex items-center gap-2 w-full flex-wrap">
                {selectedElement ? (
                  <>
                    <button
                      onClick={toggleRepeat}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 border ${
                        selectedElement.repeat
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title={selectedElement.repeat ? 'Animação em repetição contínua (loop)' : 'Executar apenas uma vez'}
                    >
                      <Repeat size={13} className={selectedElement.repeat ? 'animate-spin' : ''} />
                      <span>Repetir: {selectedElement.repeat ? 'Ativado' : 'Desativado'}</span>
                    </button>
                    <div className="h-5 w-px bg-white/10 mx-1" />

                    {filterItems(MOTION_EDITOR_PRESETS.in).length > 0 ? (
                      filterItems(MOTION_EDITOR_PRESETS.in).map((preset) => {
                        const isAnimActive = selectedElement.animation === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => applyAnimation(preset.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 border ${
                              isAnimActive
                                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        Nenhuma animação encontrada para "{searchQuery}".
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-400 italic">Selecione um elemento para aplicar as animações de entrada (In).</div>
                )}
              </div>
            )}

            {/* Categoria: Animações de Saída (Out) Reais */}
            {activeCategory === 'out' && (
              <div className="flex items-center gap-2 w-full flex-wrap">
                {selectedElement ? (
                  <>
                    <button
                      onClick={toggleRepeat}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 border ${
                        selectedElement.repeat
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title={selectedElement.repeat ? 'Animação em repetição contínua (loop)' : 'Executar apenas uma vez'}
                    >
                      <Repeat size={13} className={selectedElement.repeat ? 'animate-spin' : ''} />
                      <span>Repetir: {selectedElement.repeat ? 'Ativado' : 'Desativado'}</span>
                    </button>
                    <div className="h-5 w-px bg-white/10 mx-1" />

                    {filterItems(MOTION_EDITOR_PRESETS.out).length > 0 ? (
                      filterItems(MOTION_EDITOR_PRESETS.out).map((preset) => {
                        const isAnimActive = selectedElement.animation === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => applyAnimation(preset.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 border ${
                              isAnimActive
                                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        Nenhuma animação encontrada para "{searchQuery}".
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-400 italic">Selecione um elemento para aplicar as animações de saída (Out).</div>
                )}
              </div>
            )}

            {/* Categoria: Efeitos (FX) Reais do MotionEditor */}
            {activeCategory === 'fx' && (
              <div className="flex items-center gap-2 w-full flex-wrap">
                {selectedElement ? (
                  filterItems(MOTION_EDITOR_EFFECTS).length > 0 ? (
                    filterItems(MOTION_EDITOR_EFFECTS).map((eff) => {
                      const isEffectActive = eff.prop === 'shadow'
                        ? selectedElement.shadow?.blur === eff.val.blur && selectedElement.shadow?.y === eff.val.y
                        : selectedElement[eff.prop] === eff.val;

                      return (
                        <button
                          key={eff.id}
                          onClick={() => updateSelected(eff.prop, eff.val)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 border ${
                            isEffectActive
                              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {eff.label}
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      Nenhum efeito encontrado para "{searchQuery}".
                    </div>
                  )
                ) : (
                  <div className="text-xs text-slate-400 italic">Selecione um elemento no Canvas para aplicar os efeitos FX do MotionEditor.</div>
                )}
              </div>
            )}

            {/* Categoria: Ferramentas */}
            {activeCategory === 'tools' && (
              <div className="flex items-center gap-2.5 w-full flex-wrap">
                {filterItems([
                  { id: 'tool-text', label: '+ Texto', type: 'text', icon: Type, iconColor: 'text-violet-400' },
                  { id: 'tool-rect', label: '+ Retângulo', type: 'shape', shapeType: 'rect', icon: Square, iconColor: 'text-blue-400' },
                  { id: 'tool-circle', label: '+ Círculo', type: 'shape', shapeType: 'circle', icon: Circle, iconColor: 'text-emerald-400' },
                  { id: 'tool-triangle', label: '+ Triângulo', type: 'shape', shapeType: 'triangle', icon: Triangle, iconColor: 'text-amber-400' },
                  { id: 'tool-line', label: '+ Linha', type: 'shape', shapeType: 'line', icon: Minus, iconColor: 'text-purple-400' },
                  { id: 'tool-image', label: '+ Imagem', type: 'image', icon: ImageIcon, iconColor: 'text-pink-400' },
                ]).map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleAddTool(tool.type, tool.shapeType)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-white transition active:scale-95"
                    >
                      <ToolIcon size={14} className={tool.iconColor} />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
