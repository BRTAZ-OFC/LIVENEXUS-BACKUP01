// Pacote Streamer RGB Wave
export const packStreamerRGB = {
  id: 'pack-streamer-rgb',
  name: 'Streamer RGB Wave',
  tagline: 'Visual gamer dinâmico com bordas em degradê RGB pulsante, iluminação fuchsia e azul neon',
  description: 'Design moderno de alta energia para criadores de conteúdo com molduras arredondadas RGB, iluminação periférica e estética vibrante.',
  badge: 'RGB Wave',
  category: 'Gamer & Streamer',
  subcenariosCount: 7,
  previewColor: 'from-pink-500 via-purple-600 to-cyan-500',
  data: {
    name: 'Streamer RGB Wave',
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
          color: '#090d16',
          gradient: 'radial-gradient(ellipse at 50% 40%, #581c87 0%, #090d16 75%, #020617 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'rgb-inc-tag',
            widgetId: 'library-text',
            name: 'Tag RGB Status',
            x: 760,
            y: 260,
            width: 400,
            height: 40,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: '🌈 RGB LIGHTING :: LIVE STREAM 🌈',
              textType: 'label',
              textColor: '#f43f5e',
              fontSize: '15px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'rgb-inc-titulo',
            widgetId: 'library-text',
            name: 'Título RGB Streamer',
            x: 410,
            y: 310,
            width: 1100,
            height: 100,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'LIGANDO OS LEDS DA LIVE',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '64px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'rgb-inc-sub',
            widgetId: 'library-text',
            name: 'Subtítulo RGB',
            x: 560,
            y: 420,
            width: 800,
            height: 50,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'Ajuste a resolução em 1080p60 e venha interagir no chat!',
              textType: 'subtitle',
              textColor: '#38bdf8',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'rgb-inc-line',
            widgetId: 'library-line',
            name: 'Divisor Neon Multi',
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
              textColor: '#f43f5e'
            }
          },
          {
            id: 'rgb-inc-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status RGB',
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
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '14px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'rgb-inc-soc1',
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
              text: '@rgb_streamer',
              displayMode: 'both',
              textColor: '#ffffff',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'rgb-inc-soc2',
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
              text: '@rgb_streamer',
              displayMode: 'both',
              textColor: '#ffffff',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'rgb-inc-soc3',
            widgetId: 'library-social',
            name: 'TikTok',
            x: 1120,
            y: 960,
            width: 220,
            height: 40,
            zIndex: 5,
            visible: true,
            locked: false,
            config: {
              socialType: 'tiktok',
              text: '@rgb_streamer',
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
          color: '#090d16',
          gradient: '',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'rgb-pr-cam-frame',
            widgetId: 'library-shape',
            name: 'Moldura Câmera RGB',
            x: 1400,
            y: 770,
            width: 480,
            height: 270,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(244, 63, 94, 0.2)',
              borderRadius: '14px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#f43f5e',
              effBorderThickness: 3
            }
          },
          {
            id: 'rgb-pr-cam-tag',
            widgetId: 'library-text',
            name: 'Tag RGB CAM',
            x: 1410,
            y: 780,
            width: 170,
            height: 30,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'LIVE STREAMER',
              textType: 'label',
              textColor: '#ffffff',
              backgroundColor: '#f43f5e',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'rgb-pr-alerts',
            widgetId: 'twitch-alerts',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Alertas RGB',
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
            id: 'rgb-pr-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status RGB',
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
              borderRadius: '14px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'rgb-pr-sub-goal',
            widgetId: 'twitch-sub-goal',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Meta RGB',
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
              borderRadius: '14px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'rgb-pr-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Streamer',
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
              borderRadius: '14px',
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
          color: '#090d16',
          gradient: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #090d16 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'rgb-pausa-tag',
            widgetId: 'library-text',
            name: 'Tag de Intervalo',
            x: 810,
            y: 310,
            width: 300,
            height: 36,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: 'INTERVALO RÁPIDO // VOLTO JÁ',
              textType: 'label',
              textColor: '#38bdf8',
              fontSize: '13px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'rgb-pausa-titulo',
            widgetId: 'library-text',
            name: 'Título Pausa RGB',
            x: 460,
            y: 360,
            width: 1000,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'JÁ VOLTO PRA CONTINUAR!',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '58px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'rgb-pausa-sub',
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
              text: 'Pegando uma água e já retorno para a live!',
              textType: 'subtitle',
              textColor: '#f43f5e',
              fontSize: '20px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'rgb-pausa-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Streamer',
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
              borderRadius: '14px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'rgb-pausa-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Eventos Recentes',
            x: 60,
            y: 560,
            width: 440,
            height: 460,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '14px',
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
          color: '#090d16',
          gradient: 'radial-gradient(ellipse at 50% 50%, #581c87 0%, #090d16 85%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'rgb-ret-icon',
            widgetId: 'library-icon',
            name: 'Ícone Spark Pink',
            x: 930,
            y: 280,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'sparkles',
              textColor: '#f43f5e',
              fontSize: '48px'
            }
          },
          {
            id: 'rgb-ret-titulo',
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
              text: 'VOLTAMOS AO VIVO!',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '60px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'rgb-ret-sub',
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
              text: 'Energia renovada. Bora dar continuidade ao gameplay!',
              textType: 'subtitle',
              textColor: '#38bdf8',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'rgb-ret-status',
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
              borderRadius: '14px',
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
          color: '#090d16',
          gradient: 'linear-gradient(135deg, #090d16 0%, #3b0764 60%, #090d16 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'rgb-chat-cam-frame',
            widgetId: 'library-shape',
            name: 'Câmera Principal RGB',
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
              borderRadius: '14px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#f43f5e',
              effBorderThickness: 3
            }
          },
          {
            id: 'rgb-chat-header',
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
              text: 'SALA DE BATE-PAPO // INSCRITOS',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '28px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'rgb-chat-box',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Comunidade',
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
              borderRadius: '14px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'rgb-chat-goal',
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
              borderRadius: '14px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'rgb-chat-bits',
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
              borderRadius: '14px',
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
          color: '#090d16',
          gradient: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #090d16 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'rgb-react-title',
            widgetId: 'library-text',
            name: 'Título React RGB',
            x: 60,
            y: 40,
            width: 500,
            height: 44,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: 'REACT DOS INSCRITOS',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '26px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'rgb-react-frame',
            widgetId: 'library-shape',
            name: 'Moldura Tela Vídeo',
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
              borderRadius: '14px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#38bdf8',
              effBorderThickness: 3
            }
          },
          {
            id: 'rgb-react-cam',
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
              textColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '14px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#f43f5e',
              effBorderThickness: 2
            }
          },
          {
            id: 'rgb-react-chat',
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
              borderRadius: '14px',
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
          color: '#090d16',
          gradient: 'radial-gradient(ellipse at 50% 40%, #581c87 0%, #090d16 75%, #020617 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'rgb-fim-icon',
            widgetId: 'library-icon',
            name: 'Ícone Coração RGB',
            x: 930,
            y: 220,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'heart',
              textColor: '#f43f5e',
              fontSize: '52px'
            }
          },
          {
            id: 'rgb-fim-titulo',
            widgetId: 'library-text',
            name: 'Título Fim RGB',
            x: 410,
            y: 300,
            width: 1100,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'MUITO OBRIGADO PELA PRESENÇA!',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '56px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'rgb-fim-sub',
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
              text: 'A live se encerra por hoje. Acompanhe as redes para o próximo horário!',
              textType: 'subtitle',
              textColor: '#38bdf8',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'rgb-fim-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Destaques do Dia',
            x: 680,
            y: 470,
            width: 560,
            height: 380,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '14px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          }
        ]
      }
    ]
  }
};
