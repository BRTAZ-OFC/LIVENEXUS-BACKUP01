// Pacote Synthwave / Retrowave
export const packSynthwave = {
  id: 'pack-synthwave-80s',
  name: 'Synthwave / Retrowave',
  tagline: 'Nostalgia dos anos 80 com gradientes Pôr-do-Sol Rosa Neon, Laranja e Roxo Neon',
  description: 'Estética retrô-futurista inspirada no synthpop, vaporwave e corridas noturnas arcade com linhas neon reluzentes.',
  badge: 'Synthwave',
  category: 'Retro & Synthwave',
  subcenariosCount: 7,
  previewColor: 'from-fuchsia-600 via-purple-700 to-amber-600',
  data: {
    name: 'Synthwave 80s',
    mode: 'LOCAL',
    visualizerSize: { width: 1920, height: 1080 },
    gridSettings: {
      showGrid: false,
      gridSize: 20,
      snapToGrid: false,
      showSafeAreas: false,
      verticalGuides: [],
      horizontalGuides: []
    },
    activeSubcenarioId: 'sub-inicio',
    subcenarios: [
      // 1. LIVE VAI COMEÇAR
      {
        id: 'sub-inicio',
        name: '1. LIVE VAI COMEÇAR',
        trigger: 'Shift',
        key: '1',
        shortcut: 'Shift + 1',
        background: {
          type: 'gradient',
          color: '#090514',
          gradient: 'linear-gradient(180deg, #3b0764 0%, #701a75 45%, #c2410c 75%, #090514 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'synth-inc-tag',
            widgetId: 'library-text',
            name: 'Tag Sunset',
            x: 760,
            y: 260,
            width: 400,
            height: 40,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: '🌴 RETRO NIGHTS // LIVE STREAM 🌴',
              textType: 'label',
              textColor: '#f472b6',
              fontSize: '15px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'synth-inc-titulo',
            widgetId: 'library-text',
            name: 'Título Synthwave',
            x: 410,
            y: 310,
            width: 1100,
            height: 100,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'SINTONIZANDO TRANSMISSÃO',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '64px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'synth-inc-sub',
            widgetId: 'library-text',
            name: 'Subtítulo Synthwave',
            x: 560,
            y: 420,
            width: 800,
            height: 50,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'Coloque seus óculos escuros e aperte o play no synth!',
              textType: 'subtitle',
              textColor: '#fef08a',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'synth-inc-line',
            widgetId: 'library-line',
            name: 'Divisor Neon Pink',
            x: 760,
            y: 490,
            width: 400,
            height: 20,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              lineType: 'line',
              lineStyle: 'solid',
              lineThickness: '4',
              textColor: '#e879f9'
            }
          },
          {
            id: 'synth-inc-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status Synth',
            x: 760,
            y: 520,
            width: 400,
            height: 90,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              fontSize: '13px',
              textColor: '#ffffff',
              backgroundColor: 'rgba(24, 9, 40, 0.85)',
              borderRadius: '12px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'synth-inc-soc1',
            widgetId: 'library-social',
            name: 'Twitch',
            x: 580,
            y: 960,
            width: 220,
            height: 40,
            zIndex: 5,
            visible: true,
            locked: false,
            config: {
              socialType: 'twitch',
              text: '@synth_rider',
              displayMode: 'both',
              textColor: '#f472b6',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'synth-inc-soc2',
            widgetId: 'library-social',
            name: 'YouTube',
            x: 850,
            y: 960,
            width: 220,
            height: 40,
            zIndex: 5,
            visible: true,
            locked: false,
            config: {
              socialType: 'youtube',
              text: '@synth_rider',
              displayMode: 'both',
              textColor: '#f472b6',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'synth-inc-soc3',
            widgetId: 'library-social',
            name: 'Instagram',
            x: 1120,
            y: 960,
            width: 220,
            height: 40,
            zIndex: 5,
            visible: true,
            locked: false,
            config: {
              socialType: 'instagram',
              text: '@synth_rider',
              displayMode: 'both',
              textColor: '#f472b6',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          }
        ]
      },

      // 2. LIVE PRINCIPAL
      {
        id: 'sub-principal',
        name: '2. LIVE PRINCIPAL',
        trigger: 'Shift',
        key: '2',
        shortcut: 'Shift + 2',
        background: {
          type: 'transparent',
          color: '#090514',
          gradient: '',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'synth-pr-cam-frame',
            widgetId: 'library-shape',
            name: 'Moldura Câmera Retrowave',
            x: 1400,
            y: 770,
            width: 480,
            height: 270,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(217, 70, 239, 0.25)',
              borderRadius: '12px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#e879f9',
              effBorderThickness: 3
            }
          },
          {
            id: 'synth-pr-cam-tag',
            widgetId: 'library-text',
            name: 'Tag SYNTH CAM',
            x: 1410,
            y: 780,
            width: 170,
            height: 30,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'SYNTH DRIVER',
              textType: 'label',
              textColor: '#ffffff',
              backgroundColor: '#d946ef',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'synth-pr-alerts',
            widgetId: 'twitch-alerts',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Alertas Neon 80s',
            x: 710,
            y: 40,
            width: 500,
            height: 120,
            zIndex: 10,
            visible: true,
            locked: false,
            config: {
              duration: 5000,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'synth-pr-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status Neon',
            x: 40,
            y: 40,
            width: 280,
            height: 88,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              fontSize: '12px',
              textColor: '#ffffff',
              backgroundColor: 'rgba(24, 9, 40, 0.85)',
              borderRadius: '12px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'synth-pr-sub-goal',
            widgetId: 'twitch-sub-goal',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Meta Neon',
            x: 1540,
            y: 40,
            width: 340,
            height: 74,
            zIndex: 5,
            visible: true,
            locked: false,
            config: {
              startValue: 0,
              targetValue: 100,
              backgroundColor: 'rgba(24, 9, 40, 0.85)',
              borderRadius: '12px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'synth-pr-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Retro',
            x: 40,
            y: 680,
            width: 340,
            height: 360,
            zIndex: 5,
            visible: true,
            locked: false,
            config: {
              fontSize: '13px',
              textColor: '#ffffff',
              backgroundColor: 'rgba(24, 9, 40, 0.8)',
              borderRadius: '12px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          }
        ]
      },

      // 3. JÁ VOLTO
      {
        id: 'sub-intervalo',
        name: '3. JÁ VOLTO',
        trigger: 'Shift',
        key: '3',
        shortcut: 'Shift + 3',
        background: {
          type: 'gradient',
          color: '#090514',
          gradient: 'linear-gradient(135deg, #3b0764 0%, #701a75 50%, #090514 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'synth-pausa-tag',
            widgetId: 'library-text',
            name: 'Tag de Pitstop',
            x: 810,
            y: 310,
            width: 300,
            height: 36,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: 'PITSTOP // PAUSA SUNSET',
              textType: 'label',
              textColor: '#fde047',
              fontSize: '13px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'synth-pausa-titulo',
            widgetId: 'library-text',
            name: 'Título Pausa Synth',
            x: 460,
            y: 360,
            width: 1000,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'VOLTAMOS EM ALGUNS MINUTOS',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '56px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'synth-pausa-sub',
            widgetId: 'library-text',
            name: 'Subtítulo Pausa',
            x: 560,
            y: 450,
            width: 800,
            height: 40,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'Aproveite o som do lounge retro enquanto aguarda.',
              textType: 'subtitle',
              textColor: '#f472b6',
              fontSize: '20px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'synth-pausa-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Sunset',
            x: 1380,
            y: 560,
            width: 480,
            height: 460,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              fontSize: '13px',
              textColor: '#ffffff',
              backgroundColor: 'rgba(24, 9, 40, 0.85)',
              borderRadius: '12px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'synth-pausa-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Eventos Neon',
            x: 60,
            y: 560,
            width: 440,
            height: 460,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(24, 9, 40, 0.85)',
              borderRadius: '12px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          }
        ]
      },

      // 4. VOLTAMOS
      {
        id: 'sub-voltamos',
        name: '4. VOLTAMOS',
        trigger: 'Shift',
        key: '4',
        shortcut: 'Shift + 4',
        background: {
          type: 'gradient',
          color: '#090514',
          gradient: 'radial-gradient(ellipse at 50% 50%, #701a75 0%, #090514 85%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'synth-ret-icon',
            widgetId: 'library-icon',
            name: 'Ícone Brilho Magenta',
            x: 930,
            y: 280,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'sparkles',
              textColor: '#d946ef',
              fontSize: '48px'
            }
          },
          {
            id: 'synth-ret-titulo',
            widgetId: 'library-text',
            name: 'Título Voltamos',
            x: 460,
            y: 360,
            width: 1000,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'DE VOLTA ÀS PISTAS!',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '60px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'synth-ret-sub',
            widgetId: 'library-text',
            name: 'Subtítulo Voltamos',
            x: 560,
            y: 450,
            width: 800,
            height: 40,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'Motor aquecido e ritmo ligado. Vamos nessa!',
              textType: 'subtitle',
              textColor: '#f472b6',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'synth-ret-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status da Transmissão',
            x: 760,
            y: 510,
            width: 400,
            height: 90,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              fontSize: '13px',
              textColor: '#ffffff',
              backgroundColor: 'rgba(24, 9, 40, 0.85)',
              borderRadius: '12px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          }
        ]
      },

      // 5. CONVERSA COM INSCRITOS
      {
        id: 'sub-conversa',
        name: '5. CONVERSA COM INSCRITOS',
        trigger: 'Shift',
        key: '5',
        shortcut: 'Shift + 5',
        background: {
          type: 'gradient',
          color: '#090514',
          gradient: 'linear-gradient(135deg, #180928 0%, #4a044e 60%, #090514 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'synth-chat-cam-frame',
            widgetId: 'library-shape',
            name: 'Câmera Principal Retrowave',
            x: 60,
            y: 120,
            width: 1280,
            height: 720,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(24, 9, 40, 0.8)',
              borderRadius: '12px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#e879f9',
              effBorderThickness: 3
            }
          },
          {
            id: 'synth-chat-header',
            widgetId: 'library-text',
            name: 'Título da Tela',
            x: 60,
            y: 50,
            width: 600,
            height: 50,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'SYNTH LOUNGE // BATE-PAPO',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '28px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'synth-chat-box',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Galera',
            x: 1380,
            y: 120,
            width: 480,
            height: 890,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              fontSize: '14px',
              textColor: '#ffffff',
              backgroundColor: 'rgba(24, 9, 40, 0.85)',
              borderRadius: '12px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'synth-chat-goal',
            widgetId: 'twitch-sub-goal',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Meta de Subs',
            x: 60,
            y: 860,
            width: 620,
            height: 74,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              startValue: 0,
              targetValue: 100,
              backgroundColor: 'rgba(24, 9, 40, 0.85)',
              borderRadius: '12px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'synth-chat-bits',
            widgetId: 'twitch-bits-goal',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Meta de Bits',
            x: 720,
            y: 860,
            width: 620,
            height: 74,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              startValue: 0,
              targetValue: 5000,
              backgroundColor: 'rgba(24, 9, 40, 0.85)',
              borderRadius: '12px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          }
        ]
      },

      // 6. REACT
      {
        id: 'sub-react',
        name: '6. REACT',
        trigger: 'Shift',
        key: '6',
        shortcut: 'Shift + 6',
        background: {
          type: 'gradient',
          color: '#090514',
          gradient: 'linear-gradient(135deg, #090514 0%, #2e0832 50%, #090514 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'synth-react-title',
            widgetId: 'library-text',
            name: 'Título React Synth',
            x: 60,
            y: 40,
            width: 500,
            height: 44,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: 'TAPE PLAYBACK // REACT',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '26px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'synth-react-frame',
            widgetId: 'library-shape',
            name: 'Moldura Vídeo React',
            x: 60,
            y: 100,
            width: 1400,
            height: 788,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(24, 9, 40, 0.8)',
              borderRadius: '12px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#e879f9',
              effBorderThickness: 3
            }
          },
          {
            id: 'synth-react-cam',
            widgetId: 'library-shape',
            name: 'Moldura Câmera Streamer',
            x: 1480,
            y: 100,
            width: 380,
            height: 220,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(24, 9, 40, 0.8)',
              borderRadius: '12px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#06b6d4',
              effBorderThickness: 2
            }
          },
          {
            id: 'synth-react-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Twitch',
            x: 1480,
            y: 340,
            width: 380,
            height: 548,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              fontSize: '13px',
              textColor: '#ffffff',
              backgroundColor: 'rgba(24, 9, 40, 0.85)',
              borderRadius: '12px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          }
        ]
      },

      // 7. FINAL DA LIVE
      {
        id: 'sub-fim',
        name: '7. FINAL DA LIVE',
        trigger: 'Shift',
        key: '7',
        shortcut: 'Shift + 7',
        background: {
          type: 'gradient',
          color: '#090514',
          gradient: 'radial-gradient(ellipse at 50% 40%, #701a75 0%, #3b0764 70%, #090514 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'synth-fim-icon',
            widgetId: 'library-icon',
            name: 'Ícone Coração Pink',
            x: 930,
            y: 220,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'heart',
              textColor: '#e879f9',
              fontSize: '52px'
            }
          },
          {
            id: 'synth-fim-titulo',
            widgetId: 'library-text',
            name: 'Título Fim Synth',
            x: 410,
            y: 300,
            width: 1100,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'OBRIGADO POR CURTIR A VIAGEM!',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '56px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'synth-fim-sub',
            widgetId: 'library-text',
            name: 'Mensagem Fim',
            x: 560,
            y: 390,
            width: 800,
            height: 40,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'A live encerrou. Nos vemos na próxima corrida neon!',
              textType: 'subtitle',
              textColor: '#f472b6',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'synth-fim-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Destaques Retro',
            x: 680,
            y: 470,
            width: 560,
            height: 380,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(24, 9, 40, 0.85)',
              borderRadius: '12px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          }
        ]
      }
    ]
  }
};
