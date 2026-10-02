// Pacote Gamer / Esports Pro
export const packGamerEsports = {
  id: 'pack-gamer-esports',
  name: 'Gamer / Esports',
  tagline: 'Estética agressiva e competitiva de arenas de eSports e campeonatos',
  description: 'Design de alta intensidade com cortes angulares, contrastes em Vermelho Crimson e Amarelo Ouro, feito para transmissões focadas em jogos competitivos.',
  badge: 'Esports',
  category: 'Gamer & Esports',
  subcenariosCount: 7,
  previewColor: 'from-red-600 via-orange-600 to-amber-900',
  data: {
    name: 'Gamer / Esports',
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
          color: '#08080c',
          gradient: 'radial-gradient(ellipse at 50% 35%, #3f0713 0%, #0d0d12 70%, #050508 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'esports-inc-tag',
            widgetId: 'library-text',
            name: 'Tag Arena',
            x: 760,
            y: 260,
            width: 400,
            height: 40,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: '⚡ ARENA MATCH DAY ⚡',
              textType: 'label',
              textColor: '#ef4444',
              fontSize: '16px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'esports-inc-titulo',
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
              text: 'A PARTIDA VAI COMEÇAR',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '68px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'esports-inc-sub',
            widgetId: 'library-text',
            name: 'Subtítulo',
            x: 560,
            y: 420,
            width: 800,
            height: 50,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'Aqueça as mãos, o lobby já está aberto!',
              textType: 'subtitle',
              textColor: '#fca5a5',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'esports-inc-line',
            widgetId: 'library-line',
            name: 'Divisor Vermelho',
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
              textColor: '#ef4444'
            }
          },
          {
            id: 'esports-inc-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status da Transmissão',
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
              backgroundColor: 'rgba(15, 10, 15, 0.9)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'esports-inc-soc1',
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
              text: '@esports_player',
              displayMode: 'both',
              textColor: '#ffffff',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'esports-inc-soc2',
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
              text: '@esports_player',
              displayMode: 'both',
              textColor: '#ffffff',
              fontSize: '14px',
              fontFamily: 'Inter'
            }
          },
          {
            id: 'esports-inc-soc3',
            widgetId: 'library-social',
            name: 'Twitter',
            x: 1120,
            y: 960,
            width: 220,
            height: 40,
            zIndex: 5,
            visible: true,
            locked: false,
            config: {
              socialType: 'twitter',
              text: '@esports_player',
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
          color: '#08080c',
          gradient: '',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'esports-pr-cam-frame',
            widgetId: 'library-shape',
            name: 'Moldura Webcam Esports',
            x: 1400,
            y: 770,
            width: 480,
            height: 270,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '2px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#ef4444',
              effBorderThickness: 3
            }
          },
          {
            id: 'esports-pr-cam-tag',
            widgetId: 'library-text',
            name: 'Tag PRO CAM',
            x: 1410,
            y: 780,
            width: 160,
            height: 30,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'PRO PLAYER',
              textType: 'label',
              textColor: '#ffffff',
              backgroundColor: '#ef4444',
              borderRadius: '2px',
              fontSize: '11px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'esports-pr-alerts',
            widgetId: 'twitch-alerts',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Alertas Esports',
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
            id: 'esports-pr-status',
            widgetId: 'twitch-status-label',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Status Match',
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
              backgroundColor: 'rgba(15, 10, 15, 0.85)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'esports-pr-sub-goal',
            widgetId: 'twitch-sub-goal',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Meta de MVP/Subs',
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
              backgroundColor: 'rgba(15, 10, 15, 0.85)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'esports-pr-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Arena',
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
              backgroundColor: 'rgba(15, 10, 15, 0.75)',
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
          color: '#08080c',
          gradient: 'linear-gradient(135deg, #0f080c 0%, #2a080e 50%, #050508 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'esports-pausa-tag',
            widgetId: 'library-text',
            name: 'Tag de Tática',
            x: 810,
            y: 310,
            width: 300,
            height: 36,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: 'PAUSA TÁTICA // TIMEOUT',
              textType: 'label',
              textColor: '#f59e0b',
              fontSize: '13px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'esports-pausa-titulo',
            widgetId: 'library-text',
            name: 'Título Pausa',
            x: 460,
            y: 360,
            width: 1000,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'VOLTAMOS EM BREVE!',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '58px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'esports-pausa-sub',
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
              text: 'Reagrupando a equipe. Não saia do seu lugar!',
              textType: 'subtitle',
              textColor: '#9ca3af',
              fontSize: '20px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'esports-pausa-chat',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Arena',
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
              backgroundColor: 'rgba(15, 10, 15, 0.8)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'esports-pausa-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Feed do Campeonato',
            x: 60,
            y: 560,
            width: 440,
            height: 460,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(15, 10, 15, 0.8)',
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
          color: '#08080c',
          gradient: 'radial-gradient(ellipse at 50% 50%, #450a0a 0%, #08080c 85%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'esports-ret-icon',
            widgetId: 'library-icon',
            name: 'Ícone Troféu',
            x: 930,
            y: 280,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'sparkles',
              textColor: '#ef4444',
              fontSize: '48px'
            }
          },
          {
            id: 'esports-ret-titulo',
            widgetId: 'library-text',
            name: 'Título Retorno',
            x: 460,
            y: 360,
            width: 1000,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'PRONTOS PARA O ROUND 2!',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '60px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'esports-ret-sub',
            widgetId: 'library-text',
            name: 'Subtítulo Retorno',
            x: 560,
            y: 450,
            width: 800,
            height: 40,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'De volta à ação. Bora buscar a vitória!',
              textType: 'subtitle',
              textColor: '#fca5a5',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'esports-ret-status',
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
              backgroundColor: 'rgba(15, 10, 15, 0.85)',
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
          color: '#08080c',
          gradient: 'linear-gradient(135deg, #0d0814 0%, #280812 60%, #050508 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'esports-chat-cam-frame',
            widgetId: 'library-shape',
            name: 'Área da Câmera Principal',
            x: 60,
            y: 120,
            width: 1280,
            height: 720,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(8, 8, 12, 0.7)',
              borderRadius: '2px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#ef4444',
              effBorderThickness: 3
            }
          },
          {
            id: 'esports-chat-header',
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
              text: 'DEBRIEFING // BATE-PAPO',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '28px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'esports-chat-box',
            widgetId: 'twitch-chat-box',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Chat Torcida',
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
              backgroundColor: 'rgba(15, 10, 15, 0.85)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'esports-chat-goal',
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
              backgroundColor: 'rgba(15, 10, 15, 0.85)',
              borderRadius: '2px',
              showBorder: true,
              fontFamily: 'Inter, sans-serif'
            }
          },
          {
            id: 'esports-chat-bits',
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
              backgroundColor: 'rgba(15, 10, 15, 0.85)',
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
          color: '#08080c',
          gradient: 'linear-gradient(135deg, #050508 0%, #1a080d 50%, #050508 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'esports-react-title',
            widgetId: 'library-text',
            name: 'Título React',
            x: 60,
            y: 40,
            width: 500,
            height: 44,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              text: 'ANALISANDO PLAYBOOK // CLIPS',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '26px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left'
            }
          },
          {
            id: 'esports-react-frame',
            widgetId: 'library-shape',
            name: 'Área do Vídeo React',
            x: 60,
            y: 100,
            width: 1400,
            height: 788,
            zIndex: 1,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(8, 8, 12, 0.8)',
              borderRadius: '2px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#ef4444',
              effBorderThickness: 3
            }
          },
          {
            id: 'esports-react-cam',
            widgetId: 'library-shape',
            name: 'Câmera Caster',
            x: 1480,
            y: 100,
            width: 380,
            height: 220,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              shapeType: 'rounded-rectangle',
              textColor: 'rgba(15, 10, 15, 0.7)',
              borderRadius: '2px',
              effBorderActiveType: 'border-solid',
              effBorderColor: '#f59e0b',
              effBorderThickness: 2
            }
          },
          {
            id: 'esports-react-chat',
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
              backgroundColor: 'rgba(15, 10, 15, 0.85)',
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
          color: '#08080c',
          gradient: 'radial-gradient(ellipse at 50% 40%, #3f0713 0%, #0d0d12 70%, #050508 100%)',
          opacity: 100,
          blur: 0,
          brightness: 100,
          contrast: 100,
          saturate: 100
        },
        instances: [
          {
            id: 'esports-fim-icon',
            widgetId: 'library-icon',
            name: 'Ícone Vitoria',
            x: 930,
            y: 220,
            width: 60,
            height: 60,
            zIndex: 2,
            visible: true,
            locked: false,
            config: {
              iconType: 'heart',
              textColor: '#ef4444',
              fontSize: '52px'
            }
          },
          {
            id: 'esports-fim-titulo',
            widgetId: 'library-text',
            name: 'Título Fim',
            x: 410,
            y: 300,
            width: 1100,
            height: 80,
            zIndex: 3,
            visible: true,
            locked: false,
            config: {
              text: 'FIM DE JOGO // GG WELL PLAYED!',
              textType: 'title',
              textColor: '#ffffff',
              fontSize: '56px',
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          },
          {
            id: 'esports-fim-sub',
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
              text: 'Obrigado pelo apoio na torcida de hoje! Até o próximo combate.',
              textType: 'subtitle',
              textColor: '#fca5a5',
              fontSize: '22px',
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center'
            }
          },
          {
            id: 'esports-fim-events',
            widgetId: 'twitch-event-list',
            elementKey: 'full_widget',
            isFullWidget: true,
            name: 'Mural de Destaques',
            x: 680,
            y: 470,
            width: 560,
            height: 380,
            zIndex: 4,
            visible: true,
            locked: false,
            config: {
              backgroundColor: 'rgba(15, 10, 15, 0.85)',
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
