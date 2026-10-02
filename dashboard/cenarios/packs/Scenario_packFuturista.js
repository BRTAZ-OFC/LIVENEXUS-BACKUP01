// Pacote Futurista Ultra
export const packFuturista = {
  id: 'pack-futurista-ultra',
  name: 'Futurista Ultra',
  tagline: 'Design hiper-tecnológico com bordas suavemente arredondadas e efeito vidro translúcido',
  description: 'Composições limpas com superfícies de vidro fosco, iluminação Azul Elétrico e grafismos minimalistas da era espacial.',
  badge: 'Futurista',
  category: 'Sci-Fi & Futurismo',
  subcenariosCount: 7,
  previewColor: 'from-blue-600 via-cyan-500 to-slate-900',
  data: {
    name: 'Futurista Ultra',
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
          gradient: 'radial-gradient(ellipse at 50% 40%, #172554 0%, #020617 80%, #000000 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'fut-inc-tag',
            widgetId: 'library-text',
            name: 'Tag Futurista',
            x: 760,
            y: 260,
            width: 400,
            height: 40,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: '✦ PROTOCOLO DE TRANSMISSÃO ✦',
              textType: 'label',
              textColor: '#38bdf8',
              fontSize: '15px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'fut-inc-titulo',
            widgetId: 'library-text',
            name: 'Título Principal',
            x: 410,
            y: 310,
            width: 1100,
            height: 100,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'INICIALIZANDO STREAM',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '66px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'fut-inc-sub',
            widgetId: 'library-text',
            name: 'Subtítulo Futurista',
            x: 560,
            y: 420,
            width: 800,
            height: 50,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'Sincronizando frequências quânticas do canal...',
              textType: 'subtitle',
              textColor: '#93c5fd',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'fut-inc-line',
            widgetId: 'library-line',
            name: 'Divisor Azul Glow',
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
              textColor: '#38bdf8'
            }
          },
          {
            id: 'fut-inc-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status Quântico',
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
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '16px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'fut-inc-soc1',
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
              text: '@future_stream',
              displayMode: 'both',
              textColor: '#ffffff',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'fut-inc-soc2',
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
              text: '@future_stream',
              displayMode: 'both',
              textColor: '#ffffff',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'fut-inc-soc3',
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
              text: '@future_stream',
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
            id: 'fut-pr-cam-frame',
            widgetId: 'library-shape',
            name: 'Moldura Webcam Glass',
            x: 1400,
            y: 770,
            width: 480,
            height: 270,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(30, 58, 138, 0.25)',
              borderRadius: '16px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#38bdf8',
              effBorderThickness: 2
            }
          },
          {
            id: 'fut-pr-cam-tag',
            widgetId: 'library-text',
            name: 'Tag CAM STREAM',
            x: 1410,
            y: 780,
            width: 170,
            height: 30,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'PILOT CAM',
              textType: 'label',
              textColor: '#ffffff',
              backgroundColor: 'rgba(56, 189, 248, 0.85)',
              borderRadius: '8px',
              fontSize: '11px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'fut-pr-alerts',
            widgetId: 'twitch-alerts',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Alertas Futuristas',
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
            id: 'fut-pr-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status da Transmissão',
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
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '16px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'fut-pr-sub-goal',
            widgetId: 'twitch-sub-goal',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Meta Futurista',
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
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '16px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'fut-pr-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Glass',
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
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              borderRadius: '16px',
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
          gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #020617 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'fut-pausa-tag',
            widgetId: 'library-text',
            name: 'Tag de Espera',
            x: 810,
            y: 310,
            width: 300,
            height: 36,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: 'MODO STANDBY ATIVADO',
              textType: 'label',
              textColor: '#38bdf8',
              fontSize: '13px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'fut-pausa-titulo',
            widgetId: 'library-text',
            name: 'Título Pausa Futurista',
            x: 460,
            y: 360,
            width: 1000,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'RETORNAREMOS EM BREVE',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '58px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'fut-pausa-sub',
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
              text: 'Permanecemos online. Ajustando geradores...',
              textType: 'subtitle',
              textColor: '#93c5fd',
              fontSize: '20px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'fut-pausa-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Glass',
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
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '16px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'fut-pausa-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Eventos Glass',
            x: 60,
            y: 560,
            width: 440,
            height: 460,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '16px',
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
          gradient: 'radial-gradient(ellipse at 50% 50%, #1e3a8a 0%, #020617 85%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'fut-ret-icon',
            widgetId: 'library-icon',
            name: 'Ícone Spark Blue',
            x: 930,
            y: 280,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'sparkles',
              textColor: '#38bdf8',
              fontSize: '48px'
            }
          },
          {
            id: 'fut-ret-titulo',
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
              text: 'SINAL RECONECTADO!',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '60px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'fut-ret-sub',
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
              text: 'Transmissão no ar a 100% de capacidade.',
              textType: 'subtitle',
              textColor: '#93c5fd',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'fut-ret-status',
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
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '16px',
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
          gradient: 'linear-gradient(135deg, #020617 0%, #1e3a8a 60%, #020617 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'fut-chat-cam-frame',
            widgetId: 'library-shape',
            name: 'Câmera Principal Glass',
            x: 60,
            y: 120,
            width: 1280,
            height: 720,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(15, 23, 42, 0.65)',
              borderRadius: '16px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#38bdf8',
              effBorderThickness: 3
            }
          },
          {
            id: 'fut-chat-header',
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
              text: 'SALÃO DE INTERAÇÃO // BATE-PAPO',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '28px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'fut-chat-box',
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
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '16px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'fut-chat-goal',
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
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '16px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'fut-chat-bits',
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
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '16px',
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
          gradient: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'fut-react-title',
            widgetId: 'library-text',
            name: 'Título React Futurista',
            x: 60,
            y: 40,
            width: 500,
            height: 44,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: 'PAINEL DE MÍDIA // REACT',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '26px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'fut-react-frame',
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
              textColor: 'rgba(15, 23, 42, 0.7)',
              borderRadius: '16px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#38bdf8',
              effBorderThickness: 3
            }
          },
          {
            id: 'fut-react-cam',
            widgetId: 'library-shape',
            name: 'Câmera Pilot',
            x: 1480,
            y: 100,
            width: 380,
            height: 220,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(15, 23, 42, 0.7)',
              borderRadius: '16px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#818cf8',
              effBorderThickness: 2
            }
          },
          {
            id: 'fut-react-chat',
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
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '16px',
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
          gradient: 'radial-gradient(ellipse at 50% 40%, #172554 0%, #020617 80%, #000000 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'fut-fim-icon',
            widgetId: 'library-icon',
            name: 'Ícone Coração Blue',
            x: 930,
            y: 220,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'heart',
              textColor: '#38bdf8',
              fontSize: '52px'
            }
          },
          {
            id: 'fut-fim-titulo',
            widgetId: 'library-text',
            name: 'Título Fim Futurista',
            x: 410,
            y: 300,
            width: 1100,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'TRANSMISSÃO CONCLUÍDA',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '56px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'fut-fim-sub',
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
              text: 'Agradecemos a sua presença no canal hoje. Até a próxima!',
              textType: 'subtitle',
              textColor: '#93c5fd',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'fut-fim-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Histórico de Eventos',
            x: 680,
            y: 470,
            width: 560,
            height: 380,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '16px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          }
        ]
      }
    ]
  }
};
