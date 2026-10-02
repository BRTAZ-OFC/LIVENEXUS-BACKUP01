// Pacote Sci-Fi Command Deck
export const packSciFi = {
  id: 'pack-scifi-command',
  name: 'Sci-Fi Command',
  tagline: 'Interface de ponte de comando de nave espacial com indicadores Verde Esmeralda e Roxo Plasma',
  description: 'Design espacial de ficção científica com painéis de bordo, dados telemétricos e molduras de estação orbital.',
  badge: 'Sci-Fi',
  category: 'Sci-Fi & Futurismo',
  subcenariosCount: 7,
  previewColor: 'from-emerald-600 via-teal-700 to-purple-950',
  data: {
    name: 'Sci-Fi Command',
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
          color: '#020617',
          gradient: 'radial-gradient(ellipse at 50% 40%, #064e3b 0%, #0f172a 70%, #020617 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'scifi-inc-tag',
            widgetId: 'library-text',
            name: 'Tag de Órbita',
            x: 760,
            y: 260,
            width: 400,
            height: 40,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: '🛰️ ORBITAL STATION FEED :: ONLINE',
              textType: 'label',
              textColor: '#34d399',
              fontSize: '15px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'scifi-inc-titulo',
            widgetId: 'library-text',
            name: 'Título Sci-Fi',
            x: 410,
            y: 310,
            width: 1100,
            height: 100,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'INICIANDO SEQUÊNCIA DE LANÇAMENTO',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '60px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'scifi-inc-sub',
            widgetId: 'library-text',
            name: 'Subtítulo Sci-Fi',
            x: 560,
            y: 420,
            width: 800,
            height: 50,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'Sistemas de navegação e reatores em 100% de capacidade.',
              textType: 'subtitle',
              textColor: '#a7f3d0',
              fontSize: '20px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'scifi-inc-line',
            widgetId: 'library-line',
            name: 'Divisor Esmeralda',
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
              lineThickness: '3',
              textColor: '#10b981'
            }
          },
          {
            id: 'scifi-inc-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status da Nave',
            x: 760,
            y: 520,
            width: 400,
            height: 90,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              fontSize: '13px',
              textColor: '#10b981',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              borderRadius: '8px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'scifi-inc-soc1',
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
              text: '@scifi_captain',
              displayMode: 'both',
              textColor: '#ffffff',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'scifi-inc-soc2',
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
              text: '@scifi_captain',
              displayMode: 'both',
              textColor: '#ffffff',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'scifi-inc-soc3',
            widgetId: 'library-social',
            name: 'Discord',
            x: 1120,
            y: 960,
            width: 220,
            height: 40,
            zIndex: 5,
            visible: true,
            locked: false,
            config: {
              socialType: 'discord',
              text: 'discord.gg/command',
              displayMode: 'both',
              textColor: '#ffffff',
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
          color: '#020617',
          gradient: '',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'scifi-pr-cam-frame',
            widgetId: 'library-shape',
            name: 'Moldura Câmera Command',
            x: 1400,
            y: 770,
            width: 480,
            height: 270,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#10b981',
              effBorderThickness: 2
            }
          },
          {
            id: 'scifi-pr-cam-tag',
            widgetId: 'library-text',
            name: 'Tag Comandante',
            x: 1410,
            y: 780,
            width: 160,
            height: 30,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'COMMANDER',
              textType: 'label',
              textColor: '#ffffff',
              backgroundColor: '#10b981',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'scifi-pr-alerts',
            widgetId: 'twitch-alerts',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Alertas Sci-Fi',
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
            id: 'scifi-pr-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Telemetria',
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
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '8px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'scifi-pr-sub-goal',
            widgetId: 'twitch-sub-goal',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Meta de Tripulantes',
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
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '8px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'scifi-pr-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Comunicações',
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
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '8px',
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
          color: '#020617',
          gradient: 'linear-gradient(135deg, #020617 0%, #064e3b 50%, #020617 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'scifi-pausa-tag',
            widgetId: 'library-text',
            name: 'Tag de Órbita',
            x: 810,
            y: 310,
            width: 300,
            height: 36,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: 'MODO DE HIPERSONO // INTERVALO',
              textType: 'label',
              textColor: '#10b981',
              fontSize: '13px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'scifi-pausa-titulo',
            widgetId: 'library-text',
            name: 'Título Pausa Sci-Fi',
            x: 460,
            y: 360,
            width: 1000,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'RETORNAMOS EM BREVE',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '58px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'scifi-pausa-sub',
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
              text: 'Nave em velocidade de dobra espacial. Aguarde sinal.',
              textType: 'subtitle',
              textColor: '#a7f3d0',
              fontSize: '20px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'scifi-pausa-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Comunicações',
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
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '8px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'scifi-pausa-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Log de Bordo',
            x: 60,
            y: 560,
            width: 440,
            height: 460,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '8px',
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
          color: '#020617',
          gradient: 'radial-gradient(ellipse at 50% 50%, #065f46 0%, #020617 85%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'scifi-ret-icon',
            widgetId: 'library-icon',
            name: 'Ícone Foguete',
            x: 930,
            y: 280,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'sparkles',
              textColor: '#10b981',
              fontSize: '48px'
            }
          },
          {
            id: 'scifi-ret-titulo',
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
              text: 'SINAL EM ÓRBITA RESTAURADO!',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '58px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'scifi-ret-sub',
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
              text: 'Motores principais religados. Retornando ao comando.',
              textType: 'subtitle',
              textColor: '#a7f3d0',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'scifi-ret-status',
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
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '8px',
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
          color: '#020617',
          gradient: 'linear-gradient(135deg, #020617 0%, #064e3b 60%, #020617 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'scifi-chat-cam-frame',
            widgetId: 'library-shape',
            name: 'Câmera Comandante',
            x: 60,
            y: 120,
            width: 1280,
            height: 720,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '8px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#10b981',
              effBorderThickness: 3
            }
          },
          {
            id: 'scifi-chat-header',
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
              text: 'SALA DE COMUNICAÇÕES // TRIPULAÇÃO',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '28px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'scifi-chat-box',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat da Nave',
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
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '8px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'scifi-chat-goal',
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
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '8px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'scifi-chat-bits',
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
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '8px',
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
          color: '#020617',
          gradient: 'linear-gradient(135deg, #020617 0%, #0d2818 50%, #020617 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'scifi-react-title',
            widgetId: 'library-text',
            name: 'Título React Sci-Fi',
            x: 60,
            y: 40,
            width: 500,
            height: 44,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: 'SISTEMA DE TRANSMISSÃO // REACT',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '26px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'scifi-react-frame',
            widgetId: 'library-shape',
            name: 'Moldura Vídeo Principal',
            x: 60,
            y: 100,
            width: 1400,
            height: 788,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '8px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#10b981',
              effBorderThickness: 3
            }
          },
          {
            id: 'scifi-react-cam',
            widgetId: 'library-shape',
            name: 'Moldura Câmera Pilot',
            x: 1480,
            y: 100,
            width: 380,
            height: 220,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '8px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#a855f7',
              effBorderThickness: 2
            }
          },
          {
            id: 'scifi-react-chat',
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
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '8px',
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
          color: '#020617',
          gradient: 'radial-gradient(ellipse at 50% 40%, #064e3b 0%, #020617 75%, #000000 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'scifi-fim-icon',
            widgetId: 'library-icon',
            name: 'Ícone Coração Emerald',
            x: 930,
            y: 220,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'heart',
              textColor: '#10b981',
              fontSize: '52px'
            }
          },
          {
            id: 'scifi-fim-titulo',
            widgetId: 'library-text',
            name: 'Título Fim Sci-Fi',
            x: 410,
            y: 300,
            width: 1100,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'MISSÃO CUMPRIDA // POUSO AUTORIZADO',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '54px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'scifi-fim-sub',
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
              text: 'Obrigado por voar conosco. Até a próxima expedição espacial!',
              textType: 'subtitle',
              textColor: '#a7f3d0',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'scifi-fim-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Relatório da Missão',
            x: 680,
            y: 470,
            width: 560,
            height: 380,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '8px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          }
        ]
      }
    ]
  }
};
