// Pacote Cyberpunk 2099
export const packCyberpunk = {
  id: 'pack-cyberpunk-2099',
  name: 'Cyberpunk 2099',
  tagline: 'Visual futurista distópico com neons Amarelo Cyber, Magenta e linhas técnicas',
  description: 'Estética futurista de alta voltagem com bordas sem arredondamento, avisos em caixas industriais e paleta neon para transmissões sci-fi e cyberpunk.',
  badge: 'Cyberpunk',
  category: 'Sci-Fi & Cyberpunk',
  subcenariosCount: 7,
  previewColor: 'from-yellow-400 via-pink-600 to-cyan-700',
  data: {
    name: 'Cyberpunk 2099',
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
          color: '#030712',
          gradient: 'radial-gradient(ellipse at 50% 40%, #1e1b4b 0%, #030712 75%, #000000 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'cp-inc-tag',
            widgetId: 'library-text',
            name: 'Tag Cyber Status',
            x: 760,
            y: 260,
            width: 400,
            height: 40,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: '// SYSTEM_INITIALIZATION :: 99%',
              textType: 'label',
              textColor: '#facc15',
              fontSize: '15px',
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'cp-inc-titulo',
            widgetId: 'library-text',
            name: 'Título Cyberpunk',
            x: 410,
            y: 310,
            width: 1100,
            height: 100,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'CONEXÃO EM ANDAMENTO',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '64px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'cp-inc-sub',
            widgetId: 'library-text',
            name: 'Subtítulo Cyber',
            x: 560,
            y: 420,
            width: 800,
            height: 50,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'Aguarde o estabelecimento do link neural do mainframe...',
              textType: 'subtitle',
              textColor: '#22d3ee',
              fontSize: '20px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'cp-inc-line',
            widgetId: 'library-line',
            name: 'Divisor Neon Cyan',
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
              textColor: '#facc15'
            }
          },
          {
            id: 'cp-inc-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status Mainframe',
            x: 760,
            y: 520,
            width: 400,
            height: 90,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              fontSize: '13px',
              textColor: '#facc15',
              backgroundColor: 'rgba(3, 7, 18, 0.95)',
              borderRadius: '0px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'cp-inc-soc1',
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
              text: '@cyber_runner',
              displayMode: 'both',
              textColor: '#22d3ee',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'cp-inc-soc2',
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
              text: '@cyber_runner',
              displayMode: 'both',
              textColor: '#22d3ee',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'cp-inc-soc3',
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
              text: 'discord.gg/cyber',
              displayMode: 'both',
              textColor: '#22d3ee',
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
          color: '#030712',
          gradient: '',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'cp-pr-cam-frame',
            widgetId: 'library-shape',
            name: 'Moldura Webcam Cyber',
            x: 1400,
            y: 770,
            width: 480,
            height: 270,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(250, 204, 21, 0.15)',
              borderRadius: '0px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#facc15',
              effBorderThickness: 3
            }
          },
          {
            id: 'cp-pr-cam-tag',
            widgetId: 'library-text',
            name: 'Tag OPERADOR',
            x: 1410,
            y: 780,
            width: 170,
            height: 30,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'CYBER OPERATOR',
              textType: 'label',
              textColor: '#000000',
              backgroundColor: '#facc15',
              borderRadius: '0px',
              fontSize: '11px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'cp-pr-alerts',
            widgetId: 'twitch-alerts',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Alertas Neon',
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
            id: 'cp-pr-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status Feed',
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
              backgroundColor: 'rgba(3, 7, 18, 0.9)',
              borderRadius: '0px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'cp-pr-sub-goal',
            widgetId: 'twitch-sub-goal',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Meta de Uplinks',
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
              backgroundColor: 'rgba(3, 7, 18, 0.9)',
              borderRadius: '0px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'cp-pr-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Netfeed',
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
              backgroundColor: 'rgba(3, 7, 18, 0.85)',
              borderRadius: '0px',
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
          color: '#030712',
          gradient: 'linear-gradient(135deg, #030712 0%, #1e1b4b 50%, #030712 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'cp-pausa-tag',
            widgetId: 'library-text',
            name: 'Tag de Recarga',
            x: 810,
            y: 310,
            width: 300,
            height: 36,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: '[RECHARGING_CYBERWARE]',
              textType: 'label',
              textColor: '#facc15',
              fontSize: '13px',
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'cp-pausa-titulo',
            widgetId: 'library-text',
            name: 'Título Intervalo Cyber',
            x: 460,
            y: 360,
            width: 1000,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'SINAL EM ESPERA',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '58px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'cp-pausa-sub',
            widgetId: 'library-text',
            name: 'Subtítulo Intervalo',
            x: 560,
            y: 450,
            width: 800,
            height: 40,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'Calibrando sensores. Retornamos em instantes.',
              textType: 'subtitle',
              textColor: '#22d3ee',
              fontSize: '20px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'cp-pausa-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Netfeed',
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
              backgroundColor: 'rgba(3, 7, 18, 0.9)',
              borderRadius: '0px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'cp-pausa-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Registros de Dados',
            x: 60,
            y: 560,
            width: 440,
            height: 460,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(3, 7, 18, 0.9)',
              borderRadius: '0px',
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
          color: '#030712',
          gradient: 'radial-gradient(ellipse at 50% 50%, #31103f 0%, #030712 85%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'cp-ret-icon',
            widgetId: 'library-icon',
            name: 'Ícone Cyber Spark',
            x: 930,
            y: 280,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'sparkles',
              textColor: '#facc15',
              fontSize: '48px'
            }
          },
          {
            id: 'cp-ret-titulo',
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
              text: 'LINK RESTABELECIDO!',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '60px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'cp-ret-sub',
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
              text: 'A transmissão ao vivo na rede continua agora.',
              textType: 'subtitle',
              textColor: '#22d3ee',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'cp-ret-status',
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
              backgroundColor: 'rgba(3, 7, 18, 0.9)',
              borderRadius: '0px',
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
          color: '#030712',
          gradient: 'linear-gradient(135deg, #030712 0%, #1e1b4b 60%, #030712 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'cp-chat-cam-frame',
            widgetId: 'library-shape',
            name: 'Moldura Câmera Main',
            x: 60,
            y: 120,
            width: 1280,
            height: 720,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(3, 7, 18, 0.8)',
              borderRadius: '0px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#facc15',
              effBorderThickness: 3
            }
          },
          {
            id: 'cp-chat-header',
            widgetId: 'library-text',
            name: 'Título Canal',
            x: 60,
            y: 50,
            width: 600,
            height: 50,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'HUB DE CONVERSA // NETCHAT',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '28px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'cp-chat-box',
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
              backgroundColor: 'rgba(3, 7, 18, 0.9)',
              borderRadius: '0px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'cp-chat-goal',
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
              backgroundColor: 'rgba(3, 7, 18, 0.9)',
              borderRadius: '0px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'cp-chat-bits',
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
              backgroundColor: 'rgba(3, 7, 18, 0.9)',
              borderRadius: '0px',
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
          color: '#030712',
          gradient: 'linear-gradient(135deg, #030712 0%, #15092b 50%, #030712 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'cp-react-title',
            widgetId: 'library-text',
            name: 'Título React Cyber',
            x: 60,
            y: 40,
            width: 500,
            height: 44,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: 'MEDIA_FEED // REACT',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '26px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'cp-react-frame',
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
              textColor: 'rgba(3, 7, 18, 0.85)',
              borderRadius: '0px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#06b6d4',
              effBorderThickness: 3
            }
          },
          {
            id: 'cp-react-cam',
            widgetId: 'library-shape',
            name: 'Moldura Câmera Runner',
            x: 1480,
            y: 100,
            width: 380,
            height: 220,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(3, 7, 18, 0.85)',
              borderRadius: '0px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#facc15',
              effBorderThickness: 2
            }
          },
          {
            id: 'cp-react-chat',
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
              backgroundColor: 'rgba(3, 7, 18, 0.9)',
              borderRadius: '0px',
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
          color: '#030712',
          gradient: 'radial-gradient(ellipse at 50% 40%, #1e1b4b 0%, #030712 75%, #000000 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'cp-fim-icon',
            widgetId: 'library-icon',
            name: 'Ícone Coração Neon',
            x: 930,
            y: 220,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'heart',
              textColor: '#ec4899',
              fontSize: '52px'
            }
          },
          {
            id: 'cp-fim-titulo',
            widgetId: 'library-text',
            name: 'Título Fim Cyber',
            x: 410,
            y: 300,
            width: 1100,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'SESSÃO ENCERRADA // DISCONNECT',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '56px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'cp-fim-sub',
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
              text: 'Logoff concluído com sucesso. Conecte-se novamente em breve!',
              textType: 'subtitle',
              textColor: '#22d3ee',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'cp-fim-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Relatório da Sessão',
            x: 680,
            y: 470,
            width: 560,
            height: 380,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(3, 7, 18, 0.9)',
              borderRadius: '0px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          }
        ]
      }
    ]
  }
};
