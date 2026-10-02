// Pacote Techwear Industrial
export const packTechwear = {
  id: 'pack-techwear-industrial',
  name: 'Techwear Industrial',
  tagline: 'Estética urbana industrial com Grafite Escuro, Amarelo Alerta e tipografia streetwear técnica',
  description: 'Design de inspiração utility/streetwear com faixas de aviso, marcações numéricas severas e cartões de contenção de alta durabilidade.',
  badge: 'Techwear',
  category: 'Industrial & Urban',
  subcenariosCount: 7,
  previewColor: 'from-amber-500 via-stone-800 to-zinc-950',
  data: {
    name: 'Techwear Industrial',
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
          color: '#09090b',
          gradient: 'radial-gradient(ellipse at 50% 40%, #27272a 0%, #09090b 75%, #000000 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'tcw-inc-tag',
            widgetId: 'library-text',
            name: 'Tag Industrial',
            x: 760,
            y: 260,
            width: 400,
            height: 40,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: '⚠ UTILITY_SPEC :: BROADCAST_UNIT_01 ⚠',
              textType: 'label',
              textColor: '#eab308',
              fontSize: '15px',
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'tcw-inc-titulo',
            widgetId: 'library-text',
            name: 'Título Techwear',
            x: 410,
            y: 310,
            width: 1100,
            height: 100,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'PREPARANDO UNIDADE DE TRANSMISSÃO',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '58px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'tcw-inc-sub',
            widgetId: 'library-text',
            name: 'Subtítulo Techwear',
            x: 560,
            y: 420,
            width: 800,
            height: 50,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'Equipamentos checados. Iniciando sincronização da malha urbana.',
              textType: 'subtitle',
              textColor: '#fef08a',
              fontSize: '20px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'tcw-inc-line',
            widgetId: 'library-line',
            name: 'Divisor Amarelo Industrial',
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
              textColor: '#eab308'
            }
          },
          {
            id: 'tcw-inc-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status da Unidade',
            x: 760,
            y: 520,
            width: 400,
            height: 90,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              fontSize: '13px',
              textColor: '#eab308',
              backgroundColor: 'rgba(24, 24, 27, 0.95)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'tcw-inc-soc1',
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
              text: '@techwear_stream',
              displayMode: 'both',
              textColor: '#eab308',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'tcw-inc-soc2',
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
              text: '@techwear_stream',
              displayMode: 'both',
              textColor: '#eab308',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'tcw-inc-soc3',
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
              text: '@techwear_stream',
              displayMode: 'both',
              textColor: '#eab308',
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
          color: '#09090b',
          gradient: '',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'tcw-pr-cam-frame',
            widgetId: 'library-shape',
            name: 'Moldura Câmera Techwear',
            x: 1400,
            y: 770,
            width: 480,
            height: 270,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(234, 179, 8, 0.15)',
              borderRadius: '2px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#eab308',
              effBorderThickness: 3
            }
          },
          {
            id: 'tcw-pr-cam-tag',
            widgetId: 'library-text',
            name: 'Tag CAM UNIT',
            x: 1410,
            y: 780,
            width: 170,
            height: 30,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'URBAN OPERATOR',
              textType: 'label',
              textColor: '#000000',
              backgroundColor: '#eab308',
              borderRadius: '2px',
              fontSize: '11px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'tcw-pr-alerts',
            widgetId: 'twitch-alerts',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Alertas Industriais',
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
            id: 'tcw-pr-status',
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
              backgroundColor: 'rgba(24, 24, 27, 0.9)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'tcw-pr-sub-goal',
            widgetId: 'twitch-sub-goal',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Meta Industrial',
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
              backgroundColor: 'rgba(24, 24, 27, 0.9)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'tcw-pr-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Techwear',
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
              backgroundColor: 'rgba(24, 24, 27, 0.85)',
              borderRadius: '2px',
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
          color: '#09090b',
          gradient: 'linear-gradient(135deg, #09090b 0%, #27272a 50%, #09090b 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'tcw-pausa-tag',
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
              text: '[SYSTEM_STANDBY :: MAINTENANCE]',
              textType: 'label',
              textColor: '#eab308',
              fontSize: '13px',
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'tcw-pausa-titulo',
            widgetId: 'library-text',
            name: 'Título Pausa Techwear',
            x: 460,
            y: 360,
            width: 1000,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'INTERVALO TÉCNICO',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '58px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'tcw-pausa-sub',
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
              text: 'Manutenção de rotina na unidade. Retornamos em breve.',
              textType: 'subtitle',
              textColor: '#fef08a',
              fontSize: '20px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'tcw-pausa-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Terminal',
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
              backgroundColor: 'rgba(24, 24, 27, 0.9)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'tcw-pausa-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Registros do Sistema',
            x: 60,
            y: 560,
            width: 440,
            height: 460,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(24, 24, 27, 0.9)',
              borderRadius: '2px',
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
          color: '#09090b',
          gradient: 'radial-gradient(ellipse at 50% 50%, #3f3f46 0%, #09090b 85%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'tcw-ret-icon',
            widgetId: 'library-icon',
            name: 'Ícone Spark Yellow',
            x: 930,
            y: 280,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'sparkles',
              textColor: '#eab308',
              fontSize: '48px'
            }
          },
          {
            id: 'tcw-ret-titulo',
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
              text: 'UNIDADE OPERACIONAL ONLINE!',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '58px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'tcw-ret-sub',
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
              text: 'Checagem finalizada. Retomando transmissão ao vivo.',
              textType: 'subtitle',
              textColor: '#fef08a',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'tcw-ret-status',
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
              textColor: '#eab308',
              backgroundColor: 'rgba(24, 24, 27, 0.9)',
              borderRadius: '2px',
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
          color: '#09090b',
          gradient: 'linear-gradient(135deg, #09090b 0%, #18181b 60%, #09090b 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'tcw-chat-cam-frame',
            widgetId: 'library-shape',
            name: 'Câmera Principal Techwear',
            x: 60,
            y: 120,
            width: 1280,
            height: 720,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(24, 24, 27, 0.85)',
              borderRadius: '2px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#eab308',
              effBorderThickness: 3
            }
          },
          {
            id: 'tcw-chat-header',
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
              text: 'CENTRAL DE INTERAÇÃO // CHAT',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '28px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'tcw-chat-box',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Geral',
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
              backgroundColor: 'rgba(24, 24, 27, 0.9)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'tcw-chat-goal',
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
              backgroundColor: 'rgba(24, 24, 27, 0.9)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'tcw-chat-bits',
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
              backgroundColor: 'rgba(24, 24, 27, 0.9)',
              borderRadius: '2px',
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
          color: '#09090b',
          gradient: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'tcw-react-title',
            widgetId: 'library-text',
            name: 'Título React Techwear',
            x: 60,
            y: 40,
            width: 500,
            height: 44,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: 'MEDIA_UNIT // REACT',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '26px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'tcw-react-frame',
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
              textColor: 'rgba(24, 24, 27, 0.9)',
              borderRadius: '2px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#eab308',
              effBorderThickness: 3
            }
          },
          {
            id: 'tcw-react-cam',
            widgetId: 'library-shape',
            name: 'Moldura Câmera Operator',
            x: 1480,
            y: 100,
            width: 380,
            height: 220,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(24, 24, 27, 0.9)',
              borderRadius: '2px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#ea580c',
              effBorderThickness: 2
            }
          },
          {
            id: 'tcw-react-chat',
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
              backgroundColor: 'rgba(24, 24, 27, 0.9)',
              borderRadius: '2px',
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
          color: '#09090b',
          gradient: 'radial-gradient(ellipse at 50% 40%, #27272a 0%, #09090b 75%, #000000 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'tcw-fim-icon',
            widgetId: 'library-icon',
            name: 'Ícone Coração Techwear',
            x: 930,
            y: 220,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'heart',
              textColor: '#eab308',
              fontSize: '52px'
            }
          },
          {
            id: 'tcw-fim-titulo',
            widgetId: 'library-text',
            name: 'Título Fim Techwear',
            x: 410,
            y: 300,
            width: 1100,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'OPERAÇÃO ENCERRADA // DISCONNECT',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '54px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'tcw-fim-sub',
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
              text: 'Unidade desativada por hoje. Nos vemos no próximo turno.',
              textType: 'subtitle',
              textColor: '#fef08a',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'tcw-fim-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Relatório Final',
            x: 680,
            y: 470,
            width: 560,
            height: 380,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(24, 24, 27, 0.9)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          }
        ]
      }
    ]
  }
};
