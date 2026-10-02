// Dez universos gamer adicionais usando exclusivamente elementos existentes do Editor.
// Cada instância mantém geometria e configuração próprias para edição individual.
const styles = [
  { id: 'anime-gamer', name: 'Anime Gamer', category: 'Anime Gamer', badge: 'Anime', color: '#ff8ec7', muted: '#b8a6ec', base: '#161027', depth: '#462950', edge: '#d269ad', font: 'Arial', motif: 'anime', label: 'ARCO DA LIVE', phrases: ['UM NOVO EPISÓDIO COMEÇA', 'AÇÃO EM CENA', 'INTERVALO DO EPISÓDIO', 'O PRÓXIMO ARCO CHEGOU', 'CONVERSA COM A GALERA', 'REAGINDO JUNTOS', 'CONTINUA NO PRÓXIMO EPISÓDIO'] },
  { id: 'retro-gaming', name: 'Retro Gaming', category: 'Retro Gaming', badge: 'Retro', color: '#ffb957', muted: '#92c9ca', base: '#1e1930', depth: '#514063', edge: '#f18568', font: 'Courier New', motif: 'retro', label: 'PRESS START', phrases: ['INSIRA UMA FICHA', 'MODO ARCADE', 'PAUSE', 'CONTINUE', 'MULTIPLAYER NO CHAT', 'REPLAY ARCADE', 'GAME OVER POR HOJE'] },
  { id: 'pixel-art', name: 'Pixel Art / 8-bit / 16-bit', category: 'Pixel Art / 8-bit / 16-bit', badge: 'Pixel Art', color: '#a6ef69', muted: '#f4d16a', base: '#172035', depth: '#34465a', edge: '#8e75ca', font: 'Courier New', motif: 'pixel', label: '8-BIT / 16-BIT', phrases: ['CARREGANDO FASE', 'LEVEL EM CURSO', 'FASE PAUSADA', 'RESPAWN COMPLETO', 'CO-OP COM INSCRITOS', 'TELA DE REACT', 'FASE CONCLUÍDA'] },
  { id: 'space-cosmic', name: 'Space / Cosmic', category: 'Space / Cosmic', badge: 'Cosmic', color: '#a9b7ff', muted: '#b6a0db', base: '#090e25', depth: '#2d2b60', edge: '#7982d3', font: 'Inter', motif: 'cosmic', label: 'ÓRBITA DA LIVE', phrases: ['CONTAGEM PARA DECOLAGEM', 'EM ÓRBITA', 'PAUSA NA ESTAÇÃO', 'CONTATO RESTABELECIDO', 'ENCONTRO INTERGALÁCTICO', 'OBSERVATÓRIO REACT', 'FIM DA EXPEDIÇÃO'] },
  { id: 'terminal-hacker', name: 'Terminal / Hacker', category: 'Terminal / Hacker', badge: 'Terminal', color: '#47ed80', muted: '#78a592', base: '#050e0b', depth: '#123426', edge: '#237d4b', font: 'Courier New', motif: 'terminal', label: 'LIVE@TERMINAL:~$', phrases: ['INICIANDO SESSÃO_', 'SESSÃO ATIVA_', 'PROCESSO EM ESPERA_', 'SESSÃO RETOMADA_', 'CHAT> INSCRITOS_', 'REACT> ARQUIVOS_', 'ENCERRANDO SESSÃO_'] },
  { id: 'voxel', name: 'Voxel', category: 'Voxel', badge: 'Voxel', color: '#71d6c5', muted: '#a6c9d2', base: '#142531', depth: '#35505b', edge: '#58a693', font: 'Arial', motif: 'voxel', label: 'MUNDO EM BLOCOS', phrases: ['GERANDO MUNDO', 'EXPLORANDO O MAPA', 'SALVANDO PROGRESSO', 'MUNDO CARREGADO', 'ENCONTRO NO SERVIDOR', 'REAÇÕES EM BLOCOS', 'MUNDO SALVO'] },
  { id: 'cartoon-gamer', name: 'Cartoon Gamer', category: 'Cartoon Gamer', badge: 'Cartoon', color: '#ffdd55', muted: '#7fcbe7', base: '#233469', depth: '#3359a0', edge: '#ff7b78', font: 'Arial', motif: 'cartoon', label: 'PLAY TIME!', phrases: ['VEM BRINCAR!', 'BORA JOGAR!', 'PIT STOP DIVERTIDO', 'ESTAMOS DE VOLTA!', 'PAPO COM A TURMA', 'REAÇÃO EM CENA!', 'ATÉ A PRÓXIMA!'] },
  { id: 'comic-hq', name: 'Comic / HQ', category: 'Comic / HQ', badge: 'HQ', color: '#ffe36d', muted: '#ee9292', base: '#181c43', depth: '#404b92', edge: '#e45d57', font: 'Arial', motif: 'comic', label: 'NOVA EDIÇÃO', phrases: ['A HISTÓRIA COMEÇA!', 'CAPÍTULO AO VIVO!', 'INTERVALO!', 'VOLTOU!', 'BALÃO DE CONVERSA', 'REAÇÃO: POW!', 'FIM DE EDIÇÃO!'] },
  { id: 'pop-gamer', name: 'Pop Gamer', category: 'Pop Gamer', badge: 'Pop', color: '#ff74b7', muted: '#7de8e2', base: '#261846', depth: '#553985', edge: '#c874ed', font: 'Arial', motif: 'pop', label: 'POP ON AIR', phrases: ['PARTIU LIVE!', 'MODO POP ON', 'JÁ VOLTO!', 'A FESTA CONTINUA', 'BATE-PAPO POP', 'VAMOS REAGIR!', 'ATÉ LOGO!'] },
  { id: 'minimal-gamer', name: 'Minimal Gamer', category: 'Minimal Gamer', badge: 'Minimal', color: '#e5edf3', muted: '#9caab8', base: '#10161d', depth: '#202c35', edge: '#586c79', font: 'Inter', motif: 'clean', label: 'PLAY / LIVE', phrases: ['EM INSTANTES', 'AO VIVO', 'PAUSA', 'DE VOLTA', 'CONVERSA', 'REACT', 'ATÉ A PRÓXIMA'] },
];

const names = ['LIVE VAI COMEÇAR', 'LIVE PRINCIPAL', 'JÁ VOLTO', 'VOLTAMOS', 'CONVERSA COM INSCRITOS', 'REACT', 'FINAL DA LIVE'];
const subIds = ['inicio', 'principal', 'intervalo', 'voltamos', 'conversa', 'react', 'fim'];
const previewColors = [
  'from-pink-400 via-purple-600 to-indigo-950',
  'from-orange-400 via-fuchsia-700 to-slate-950',
  'from-lime-400 via-violet-600 to-slate-950',
  'from-indigo-400 via-purple-700 to-slate-950',
  'from-green-400 via-emerald-900 to-black',
  'from-teal-400 via-sky-700 to-slate-950',
  'from-yellow-300 via-blue-600 to-slate-950',
  'from-yellow-400 via-red-600 to-indigo-950',
  'from-pink-400 via-violet-600 to-indigo-950',
  'from-slate-300 via-slate-600 to-slate-950',
];

function buildPack(s) {
  const id = (scene, part) => `${s.id}-${scene}-${part}`;
  const instance = (scene, part, widgetId, name, x, y, width, height, config, zIndex = 3) => ({
    id: id(scene, part), widgetId, name, x, y, width, height, zIndex,
    visible: true, locked: false, config,
    ...(widgetId.startsWith('twitch-') ? { elementKey: 'full_widget', isFullWidget: true } : {}),
  });
  const text = (scene, part, content, x, y, width, height, size, color = s.color, align = 'center') =>
    instance(scene, part, 'library-text', part, x, y, width, height, {
      text: content, textType: size > 34 ? 'title' : 'label', textColor: color,
      fontSize: `${size}px`, fontFamily: s.font, fontWeight: size > 34 ? 'bold' : 'normal', textAlign: align,
    });
  const line = (scene, part, x, y, width, color = s.color, thickness = 3) =>
    instance(scene, part, 'library-line', part, x, y, width, 14, {
      lineType: 'line', lineStyle: 'solid', lineThickness: String(thickness), textColor: color,
    }, 2);
  const shape = (scene, part, x, y, width, height, fill = s.depth, border = s.edge) =>
    instance(scene, part, 'library-shape', part, x, y, width, height, {
      shapeType: s.motif === 'arch' || s.motif === 'clock' ? 'rounded-rectangle' : 'rectangle',
      textColor: fill, borderRadius: s.motif === 'arch' ? '28px' : '4px',
      effBorderActiveType: 'border-solid', effBorderColor: border, effBorderThickness: 2,
    }, 1);
  const widget = (scene, part, type, x, y, width, height) => instance(scene, part, type, part, x, y, width, height, {
    fontSize: '14px', textColor: '#ffffff', backgroundColor: s.depth,
    borderRadius: '6px', showBorder: true, fontFamily: `${s.font}, sans-serif`,
  }, 5);
  const cam = (scene, x, y, width, height) => instance(scene, 'camera', 'library-webcam', 'Câmera', x, y, width, height, {
    borderColor: s.color, showBorder: true, borderRadius: '6px',
  }, 5);
  const frame = (scene, x, y, width, height) => [
    shape(scene, 'camera-frame', x - 8, y - 8, width + 16, height + 16, 'rgba(0,0,0,0)', s.color),
    cam(scene, x, y, width, height),
  ];
  const ornament = (scene) => {
    const patterns = {
      anime: [[80, 115, 650], [1310, 925, 530]],
      retro: [[90, 155, 560], [1270, 880, 560]],
      pixel: [[80, 140, 400], [1440, 940, 400]],
      cosmic: [[140, 120, 580], [1200, 950, 580]],
      terminal: [[70, 150, 700], [1150, 940, 700]],
      voxel: [[90, 130, 450], [1380, 910, 450]],
      cartoon: [[110, 130, 620], [1190, 925, 620]],
      comic: [[70, 120, 670], [1180, 920, 670]],
      pop: [[100, 170, 580], [1240, 880, 580]],
      clean: [[140, 175, 420], [1360, 895, 420]],
    };
    const marks = {
      anime: ['✦  EPISÓDIO  ✦', '✧  PRÓXIMO ARCO  ✧'],
      retro: ['◀  PRESS START', 'INSERT COIN  ▶'],
      pixel: ['▣ ▣ ▣  PIXELS', '▣ ▣ ▣  LEVEL UP'],
      cosmic: ['✦  SISTEMA ESTELAR', '✧  GALÁXIA  ✧'],
      terminal: ['>  SYSTEM READY_', '>  LIVE.EXE_'],
      voxel: ['▦  BLOCO A BLOCO', '▦  CONSTRUINDO'],
      cartoon: ['★  SUPER PLAY!', '★  YEAH!'],
      comic: ['★  POW!', '★  TO BE CONTINUED'],
      pop: ['✦  PLAY  ✦', '✧  POP  ✧'],
      clean: ['LIVE / 01', 'PLAY / 07'],
    };
    const accents = {
      anime: ['✦', '✦', '✦'], retro: ['◀', '■', '▶'], pixel: ['■', '■', '■'],
      cosmic: ['✦', '✧', '✦'], terminal: ['>', '_', '/'], voxel: ['▣', '▣', '▣'],
      cartoon: ['★', '●', '★'], comic: ['✦', '★', '✦'], pop: ['✦', '●', '✧'], clean: ['·', '·', '·'],
    };
    return [
      ...patterns[s.motif].map(([x, y, width], i) => line(scene, `motif-${i}`, x, y, width, i ? s.edge : s.color, ['pixel', 'voxel', 'comic'].includes(s.motif) ? 7 : 3)),
      text(scene, 'signature-left', marks[s.motif][0], 80, 190, 390, 38, 18, s.muted, 'left'),
      text(scene, 'signature-right', marks[s.motif][1], 1450, 850, 390, 38, 18, s.muted, 'right'),
      ...accents[s.motif].map((mark, i) => text(scene, `accent-${i}`, mark, 830 + i * 95, 90, 70, 65, s.motif === 'clean' ? 25 : 40, i === 1 ? s.muted : s.color)),
    ];
  };
  const title = (scene, index, x = 350, y = 345, width = 1220, size = 62) => [
    text(scene, 'eyebrow', s.label, x, y - 72, width, 42, 20, s.muted),
    text(scene, 'headline', s.phrases[index], x, y, width, 100, size, s.color),
    line(scene, 'headline-rule', x + width * 0.32, y + 120, width * 0.36),
  ];
  const background = (index) => index === 1 ? {
    type: 'transparent', color: s.base, gradient: '', opacity: 100, blur: 0, brightness: 100, contrast: 100, saturate: 100,
  } : {
    type: 'gradient', color: s.base,
    gradient: index === 2 || index === 6
      ? `linear-gradient(135deg, ${s.base} 0%, ${s.depth} 50%, ${s.base} 100%)`
      : `radial-gradient(ellipse at ${index === 5 ? '35% 48%' : '50% 40%'}, ${s.depth} 0%, ${s.base} 75%)`,
    opacity: 100, blur: 0, brightness: 100, contrast: 100, saturate: 100,
  };
  const sceneContent = (index) => {
    const scene = subIds[index];
    switch (index) {
      case 0: return [
        ...ornament(scene), ...title(scene, index, 280, 355, 1360, 68),
        text(scene, 'start-note', 'A TRANSMISSÃO COMEÇA EM BREVE', 530, 535, 860, 56, 23, '#ffffff'),
        shape(scene, 'bottom-panel', 560, 835, 800, 98),
        text(scene, 'bottom-note', s.label, 600, 855, 720, 58, 22),
      ];
      case 1: return [
        ...ornament(scene), line(scene, 'top-line', 38, 36, 490),
        text(scene, 'live-title', s.phrases[index], 45, 54, 560, 56, 29, s.color, 'left'),
        ...frame(scene, 1430, 755, 440, 248),
        widget(scene, 'chat', 'twitch-chat-box', 45, 665, 360, 340),
        widget(scene, 'status', 'twitch-status-label', 45, 135, 320, 82),
        widget(scene, 'alerts', 'twitch-alerts', 680, 35, 560, 120),
        text(scene, 'cam-label', 'CÂMERA', 1440, 710, 300, 36, 18, s.muted, 'left'),
      ];
      case 2: return [
        ...ornament(scene), ...title(scene, index, 360, 285, 1200),
        text(scene, 'pause-note', 'O CHAT CONTINUA ABERTO', 470, 465, 980, 52, 22, '#ffffff'),
        widget(scene, 'events', 'twitch-event-list', 140, 610, 540, 360),
        widget(scene, 'chat', 'twitch-chat-box', 1240, 610, 540, 360),
      ];
      case 3: return [
        ...ornament(scene), shape(scene, 'return-panel', 230, 280, 1460, 400),
        ...title(scene, index, 330, 400, 1260, 72),
        text(scene, 'return-note', 'A TRANSMISSÃO CONTINUA', 530, 585, 860, 52, 24, '#ffffff'),
        widget(scene, 'status', 'twitch-status-label', 790, 750, 340, 85),
      ];
      case 4: return [
        ...ornament(scene),
        text(scene, 'talk-title', s.phrases[index], 72, 68, 1100, 80, 52, s.color, 'left'),
        line(scene, 'talk-rule', 72, 158, 900),
        ...frame(scene, 75, 230, 1000, 562),
        widget(scene, 'chat', 'twitch-chat-box', 1150, 230, 690, 670),
        text(scene, 'talk-note', 'CONVERSA COM INSCRITOS', 88, 845, 850, 44, 22, s.muted, 'left'),
        widget(scene, 'status', 'twitch-status-label', 90, 925, 320, 80),
      ];
      case 5: return [
        ...ornament(scene),
        text(scene, 'react-title', s.phrases[index], 60, 36, 900, 54, 38, s.color, 'left'),
        line(scene, 'react-rule', 60, 92, 950),
        instance(scene, 'react-player', 'library-react-player', 'Vídeo enviado pela comunidade', 60, 135, 1370, 771, {
          borderColor: s.color, showBorder: true, borderRadius: '6px',
        }, 5),
        ...frame(scene, 1470, 135, 390, 220),
        widget(scene, 'chat', 'twitch-chat-box', 1470, 390, 390, 516),
        text(scene, 'react-note', 'VÍDEOS ENVIADOS PELA COMUNIDADE', 60, 943, 1100, 52, 22, s.muted, 'left'),
      ];
      case 6: return [
        ...ornament(scene), ...title(scene, index, 340, 300, 1240),
        text(scene, 'farewell', 'OBRIGADO POR ACOMPANHAR. ATÉ A PRÓXIMA!', 390, 490, 1140, 65, 24, '#ffffff'),
        shape(scene, 'closing-panel', 660, 695, 600, 130),
        text(scene, 'closing-mark', s.label, 690, 735, 540, 46, 23),
      ];
    }
  };
  return {
    id: `pack-${s.id}`, name: s.name, tagline: `Transmissão completa em estilo ${s.name}`,
    description: `Sete composições editáveis com identidade ${s.name} para as etapas da live.`,
    badge: s.badge, category: s.category, subcenariosCount: 7,
    previewColor: previewColors[styles.indexOf(s)],
    data: {
      name: s.name, mode: 'LOCAL', visualizerSize: { width: 1920, height: 1080 },
      gridSettings: { showGrid: false, gridSize: 20, snapToGrid: false, showSafeAreas: false, verticalGuides: [], horizontalGuides: [] },
      activeSubcenarioId: 'sub-inicio',
      subcenarios: names.map((name, index) => ({
        id: `sub-${subIds[index]}`, name: `${index + 1}. ${name}`,
        trigger: 'Shift', key: String(index + 1), shortcut: `Shift + ${index + 1}`,
        background: background(index), instances: sceneContent(index),
      })),
    },
  };
}

export const universosGamer = styles.map(buildPack);
