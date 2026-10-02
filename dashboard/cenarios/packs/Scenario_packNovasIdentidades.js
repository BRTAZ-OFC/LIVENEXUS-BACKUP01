// Dez identidades completas usando exclusivamente elementos existentes do Editor.
// Cada instância mantém geometria e configuração próprias para edição individual.
const styles = [
  { id: 'dark', name: 'Dark', category: 'Dark', badge: 'Dark', color: '#c5cbd5', muted: '#788293', base: '#090b10', depth: '#1a202b', edge: '#414b59', font: 'Inter', motif: 'minimal', label: 'NO ESCURO', phrases: ['A NOITE COMEÇA AQUI', 'O PALCO É SEU', 'LUZES EM PAUSA', 'DE VOLTA À CENA', 'A VOZ É DE VOCÊS', 'OLHO NA TELA', 'A NOITE TERMINA'] },
  { id: 'dark-fantasy', name: 'Dark Fantasy / Soulslike', category: 'Dark Fantasy / Soulslike', badge: 'Soulslike', color: '#c49a52', muted: '#a78d71', base: '#100e12', depth: '#35242a', edge: '#735e43', font: 'Georgia', motif: 'rune', label: 'CRÔNICAS DAS CINZAS', phrases: ['A JORNADA DESPERTA', 'ENTRE BRASAS E SOMBRAS', 'DESCANSO NA FOGUEIRA', 'A CHAMA RENASCE', 'CONSELHO DOS VIAJANTES', 'VISÕES DO REINO', 'QUE A CHAMA PERDURE'] },
  { id: 'military', name: 'Military / Tactical', category: 'Military / Tactical', badge: 'Tactical', color: '#b8cf84', muted: '#879976', base: '#10170f', depth: '#273323', edge: '#68785a', font: 'Arial', motif: 'grid', label: 'CENTRO DE OPERAÇÕES', phrases: ['OPERAÇÃO EM PREPARO', 'MISSÃO EM ANDAMENTO', 'PAUSA OPERACIONAL', 'EQUIPE DE VOLTA', 'BRIEFING DA EQUIPE', 'ANÁLISE DE MISSÃO', 'MISSÃO ENCERRADA'] },
  { id: 'post-apocalyptic', name: 'Post-apocalyptic', category: 'Post-apocalyptic', badge: 'Wasteland', color: '#e3a46e', muted: '#ad8168', base: '#1b1715', depth: '#493427', edge: '#8c6149', font: 'Arial', motif: 'hazard', label: 'SINAL DO ERMO', phrases: ['SINAL ENCONTRADO', 'TRANSMISSÃO DO ERMO', 'ABRIGO TEMPORÁRIO', 'SINAL RESTABELECIDO', 'VOZES DO REFÚGIO', 'REGISTROS ENCONTRADOS', 'ATÉ O PRÓXIMO SINAL'] },
  { id: 'industrial', name: 'Industrial', category: 'Industrial', badge: 'Industrial', color: '#e2a938', muted: '#a99576', base: '#121618', depth: '#30383b', edge: '#667074', font: 'Arial', motif: 'beam', label: 'LINHA DE PRODUÇÃO', phrases: ['SISTEMA LIGANDO', 'OPERAÇÃO EM CURSO', 'PARADA TÉCNICA', 'MÁQUINAS EM MARCHA', 'SALA DE CONTROLE', 'MONITOR DE VÍDEOS', 'TURNO ENCERRADO'] },
  { id: 'steampunk', name: 'Steampunk', category: 'Steampunk', badge: 'Steampunk', color: '#e0b56b', muted: '#aa8c68', base: '#1c1512', depth: '#4d3529', edge: '#977452', font: 'Georgia', motif: 'clock', label: 'OFICINA A VAPOR', phrases: ['A MÁQUINA DESPERTA', 'EXPEDIÇÃO NO AR', 'PRESSÃO EM REPOUSO', 'VAPOR RESTABELECIDO', 'SALÃO DOS INVENTORES', 'LUNETA DE REAÇÕES', 'ATÉ A PRÓXIMA VIAGEM'] },
  { id: 'horror-gamer', name: 'Horror Gamer', category: 'Horror Gamer', badge: 'Horror', color: '#ee4d55', muted: '#a27a80', base: '#100b10', depth: '#381722', edge: '#7c303b', font: 'Georgia', motif: 'slash', label: 'SINAL PERDIDO', phrases: ['ALGO SE APROXIMA', 'ENTRE NA ESCURIDÃO', 'SILÊNCIO POR ENQUANTO', 'AINDA ESTAMOS AQUI', 'SUSSURROS DO CHAT', 'NÃO DESVIE O OLHAR', 'SOBREVIVEMOS À NOITE'] },
  { id: 'gotico', name: 'Gótico', category: 'Gótico', badge: 'Gótico', color: '#c7a8ce', muted: '#a78baa', base: '#130e19', depth: '#38223d', edge: '#79527d', font: 'Georgia', motif: 'arch', label: 'SALÃO DA MEIA-NOITE', phrases: ['AS PORTAS SE ABREM', 'O SALÃO ESTÁ VIVO', 'INTERLÚDIO NOTURNO', 'DE VOLTA AO SALÃO', 'VOZES DA CONGREGAÇÃO', 'ESPELHO DAS HISTÓRIAS', 'AS PORTAS SE FECHAM'] },
  { id: 'fantasy-rpg', name: 'Fantasy RPG', category: 'Fantasy RPG', badge: 'RPG', color: '#7de3ba', muted: '#9dbba3', base: '#0e1a18', depth: '#27413b', edge: '#527b6e', font: 'Georgia', motif: 'quest', label: 'DIÁRIO DE AVENTURA', phrases: ['A AVENTURA COMEÇA', 'MISSÃO EM ANDAMENTO', 'DESCANSO NA TAVERNA', 'O GRUPO RETORNA', 'CONSELHO DOS HERÓIS', 'HISTÓRIAS DA GUILDA', 'FIM DE CAPÍTULO'] },
  { id: 'neon-racing', name: 'Neon Racing', category: 'Neon Racing', badge: 'Racing', color: '#45e6f5', muted: '#d29cdd', base: '#0b0d1b', depth: '#252250', edge: '#9647bd', font: 'Arial', motif: 'speed', label: 'PISTA NOTURNA', phrases: ['MOTORES PRONTOS', 'CORRIDA EM CURSO', 'PIT STOP', 'DE VOLTA À PISTA', 'RÁDIO DA EQUIPE', 'REPLAY DA PISTA', 'BANDEIRA QUADRICULADA'] },
];

const names = ['LIVE VAI COMEÇAR', 'LIVE PRINCIPAL', 'JÁ VOLTO', 'VOLTAMOS', 'CONVERSA COM INSCRITOS', 'REACT', 'FINAL DA LIVE'];
const subIds = ['inicio', 'principal', 'intervalo', 'voltamos', 'conversa', 'react', 'fim'];
const previewColors = [
  'from-slate-500 via-slate-800 to-black',
  'from-amber-700 via-stone-800 to-black',
  'from-lime-700 via-stone-900 to-slate-950',
  'from-orange-700 via-stone-700 to-slate-950',
  'from-amber-600 via-zinc-700 to-slate-950',
  'from-amber-500 via-orange-900 to-stone-950',
  'from-red-600 via-rose-950 to-black',
  'from-purple-500 via-violet-950 to-black',
  'from-emerald-500 via-teal-900 to-slate-950',
  'from-cyan-400 via-fuchsia-700 to-slate-950',
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
      minimal: [[80, 110, 470], [1370, 950, 470]],
      rune: [[220, 150, 360], [1340, 900, 360]],
      grid: [[80, 140, 580], [1260, 930, 580]],
      hazard: [[80, 150, 600], [1240, 930, 600]],
      beam: [[85, 180, 520], [1315, 900, 520]],
      clock: [[160, 130, 440], [1320, 940, 440]],
      slash: [[80, 230, 400], [1440, 840, 400]],
      arch: [[150, 130, 470], [1300, 930, 470]],
      quest: [[140, 150, 470], [1310, 920, 470]],
      speed: [[75, 200, 650], [1195, 880, 650]],
    };
    const marks = {
      minimal: ['DARK  /  01', 'SOMBRA  ·  LUZ'],
      rune: ['✧  CINZAS  ✧', '✧  A CHAMA  ✧'],
      grid: ['[  OPERAÇÃO  ]', '[  TÁTICO  ]'],
      hazard: ['////  REFÚGIO', '////  ERMO'],
      beam: ['▮  SETOR 01', '▮  FÁBRICA'],
      clock: ['⚙  VAPOR  ⚙', '⚙  ENGENHO  ⚙'],
      slash: ['X  NÃO OLHE', 'X  SOBREVIVA'],
      arch: ['✦  NOCTURNO  ✦', '✦  SALÃO  ✦'],
      quest: ['◆  MISSÃO  ◆', '◆  GUILDA  ◆'],
      speed: ['///  GRID  ///', '///  VELOCIDADE  ///'],
    };
    return [
      ...patterns[s.motif].map(([x, y, width], i) => line(scene, `motif-${i}`, x, y, width, i ? s.edge : s.color, s.motif === 'beam' ? 6 : 3)),
      text(scene, 'signature-left', marks[s.motif][0], 80, 190, 390, 38, 18, s.muted, 'left'),
      text(scene, 'signature-right', marks[s.motif][1], 1450, 850, 390, 38, 18, s.muted, 'right'),
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

export const novasIdentidades = styles.map(buildPack);
