// Catálogo de Cenários Pré-Montados para Transmissão Completa
import { packGamerEsports } from './packs/Scenario_packGamerEsports';
import { packCyberpunk } from './packs/Scenario_packCyberpunk';
import { packFuturista } from './packs/Scenario_packFuturista';
import { packSciFi } from './packs/Scenario_packSciFi';
import { packSynthwave } from './packs/Scenario_packSynthwave';
import { packGlitch } from './packs/Scenario_packGlitch';
import { packHudTactical } from './packs/Scenario_packHudTactical';
import { packHolografico } from './packs/Scenario_packHolografico';
import { packTechwear } from './packs/Scenario_packTechwear';
import { packStreamerRGB } from './packs/Scenario_packStreamerRGB';
import { novasIdentidades } from './packs/Scenario_packNovasIdentidades';
import { universosGamer } from './packs/Scenario_packUniversosGamer';

export const PREBUILT_SCENARIO_PACKS = [
  {
    id: 'pack-live-completa-pro',
    name: 'Transmissão Completa Pro',
    tagline: 'Pacote essencial com 7 subcenários prontos para todas as etapas da live',
    description: 'Composições profissionais completas para Início, Live Principal, Intervalo, Retorno, Bate-papo com Inscritos, React de Vídeos e Encerramento.',
    badge: 'Completo',
    category: 'Gamer & Broadcast',
    subcenariosCount: 7,
    previewColor: 'from-violet-600 via-purple-600 to-indigo-900',
    data: {
      name: 'Live Completa Pro',
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
            gradient: 'radial-gradient(ellipse at 50% 40%, #1e1b4b 0%, #09090b 70%, #020617 100%)',
            opacity: 100,
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturate: 100
          },
          instances: [
            // Header Tag
            {
              id: 'inst-inicio-tag',
              widgetId: 'library-text',
              name: 'Tag de Status',
              x: 760,
              y: 280,
              width: 400,
              height: 40,
              zIndex: 2,
              visible: true,
              locked: false,
              config: {
                text: '• TRANSMISSÃO AO VIVO •',
                textType: 'label',
                textColor: '#a855f7',
                fontSize: '15px',
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            // Main Big Title
            {
              id: 'inst-inicio-titulo',
              widgetId: 'library-text',
              name: 'Título: Live vai Começar',
              x: 460,
              y: 330,
              width: 1000,
              height: 90,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                text: 'A LIVE VAI COMEÇAR',
                textType: 'title',
                textColor: '#ffffff',
                fontSize: '64px',
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            // Subtitle
            {
              id: 'inst-inicio-sub',
              widgetId: 'library-text',
              name: 'Subtítulo',
              x: 560,
              y: 430,
              width: 800,
              height: 50,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                text: 'Ajuste seu fone, pegue sua bebida e prepare-se!',
                textType: 'subtitle',
                textColor: '#cbd5e1',
                fontSize: '22px',
                fontFamily: 'Inter',
                fontWeight: 'normal',
                textAlign: 'center'
              }
            },
            // Central Separator Line
            {
              id: 'inst-inicio-linha',
              widgetId: 'library-line',
              name: 'Divisor Central',
              x: 760,
              y: 500,
              width: 400,
              height: 20,
              zIndex: 2,
              visible: true,
              locked: false,
              config: {
                lineType: 'line',
                lineStyle: 'solid',
                lineThickness: '3',
                textColor: '#8b5cf6'
              }
            },
            // Status Label / Stream info
            {
              id: 'inst-inicio-status',
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
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                borderRadius: '6px',
                showBorder: true,
                fontFamily: 'Inter, sans-serif'
              }
            },
            // Social Networks Bar at bottom
            {
              id: 'inst-inicio-social-twitch',
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
                text: '@streamer',
                displayMode: 'both',
                textColor: '#ffffff',
                fontSize: '14px',
                fontFamily: 'Inter'
              }
            },
            {
              id: 'inst-inicio-social-yt',
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
                text: '@streamer',
                displayMode: 'both',
                textColor: '#ffffff',
                fontSize: '14px',
                fontFamily: 'Inter'
              }
            },
            {
              id: 'inst-inicio-social-insta',
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
                text: '@streamer',
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
            // Webcam Border Frame (Bottom-Right, 16:9 ratio: 480x270)
            {
              id: 'inst-princ-cam-moldura',
              widgetId: 'library-shape',
              name: 'Moldura Webcam',
              x: 1400,
              y: 770,
              width: 480,
              height: 270,
              zIndex: 1,
              visible: true,
              locked: false,
              config: {
                shapeType: 'rounded-rectangle',
                textColor: 'rgba(139, 92, 246, 0.25)',
                borderRadius: '6px',
                effBorderActiveType: 'border-solid',
                effBorderColor: '#8b5cf6',
                effBorderThickness: 2
              }
            },
            // Streamer Tag on Webcam
            {
              id: 'inst-princ-cam-tag',
              widgetId: 'library-text',
              name: 'Nome Streamer',
              x: 1410,
              y: 780,
              width: 180,
              height: 32,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                text: 'LIVE STREAM',
                textType: 'label',
                textColor: '#ffffff',
                backgroundColor: 'rgba(139, 92, 246, 0.85)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            // Top Alerts
            {
              id: 'inst-princ-alerts',
              widgetId: 'twitch-alerts',
              elementKey: 'full_widget',
              isFullWidget: true,
              name: 'Alertas da Twitch',
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
            // Top-Left Stream Status
            {
              id: 'inst-princ-status',
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
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '6px',
                showBorder: true,
                fontFamily: 'Inter, sans-serif'
              }
            },
            // Top Bits/Sub Goal (Top-Right)
            {
              id: 'inst-princ-sub-goal',
              widgetId: 'twitch-sub-goal',
              elementKey: 'full_widget',
              isFullWidget: true,
              name: 'Meta de Inscritos',
              x: 1540,
              y: 40,
              width: 340,
              height: 74,
              zIndex: 5,
              visible: true,
              locked: false,
              config: {
                startValue: 0,
                targetValue: 50,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '6px',
                showBorder: true,
                fontFamily: 'Inter, sans-serif'
              }
            },
            // Twitch Chat Box (Vertical, Left-side overlay or Bottom-Left)
            {
              id: 'inst-princ-chat',
              widgetId: 'twitch-chat-box',
              elementKey: 'full_widget',
              isFullWidget: true,
              name: 'Chat da Twitch',
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
                borderRadius: '6px',
                showBorder: true,
                fontFamily: 'Inter, sans-serif'
              }
            }
          ]
        },

        // 3. JÁ VOLTO (Pausa / Intervalo)
        {
          id: 'sub-intervalo',
          name: '3. JÁ VOLTO',
          trigger: 'Shift',
          key: '3',
          shortcut: 'Shift + 3',
          background: {
            type: 'gradient',
            color: '#020617',
            gradient: 'linear-gradient(135deg, #090d16 0%, #17112c 50%, #030712 100%)',
            opacity: 100,
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturate: 100
          },
          instances: [
            // Center Badge
            {
              id: 'inst-volto-badge',
              widgetId: 'library-shape',
              name: 'Fundo Badge',
              x: 860,
              y: 310,
              width: 200,
              height: 36,
              zIndex: 1,
              visible: true,
              locked: false,
              config: {
                shapeType: 'rounded-rectangle',
                textColor: '#f59e0b',
                borderRadius: '6px'
              }
            },
            {
              id: 'inst-volto-tag',
              widgetId: 'library-text',
              name: 'Tag de Intervalo',
              x: 860,
              y: 310,
              width: 200,
              height: 36,
              zIndex: 2,
              visible: true,
              locked: false,
              config: {
                text: 'PAUSA / INTERVALO',
                textType: 'label',
                textColor: '#020617',
                fontSize: '12px',
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            // Main Text
            {
              id: 'inst-volto-titulo',
              widgetId: 'library-text',
              name: 'Título Já Volto',
              x: 460,
              y: 370,
              width: 1000,
              height: 80,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                text: 'JÁ VOLTAMOS!',
                textType: 'title',
                textColor: '#ffffff',
                fontSize: '56px',
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            {
              id: 'inst-volto-sub',
              widgetId: 'library-text',
              name: 'Mensagem de Espera',
              x: 560,
              y: 460,
              width: 800,
              height: 40,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                text: 'Fique à vontade no chat, retornaremos em poucos minutos.',
                textType: 'subtitle',
                textColor: '#94a3b8',
                fontSize: '20px',
                fontFamily: 'Inter',
                fontWeight: 'normal',
                textAlign: 'center'
              }
            },
            // Chat preview on right side
            {
              id: 'inst-volto-chat',
              widgetId: 'twitch-chat-box',
              elementKey: 'full_widget',
              isFullWidget: true,
              name: 'Chat da Live',
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
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                borderRadius: '6px',
                showBorder: true,
                fontFamily: 'Inter, sans-serif'
              }
            },
            // Event List on left side
            {
              id: 'inst-volto-events',
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
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                borderRadius: '6px',
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
            gradient: 'radial-gradient(ellipse at 50% 50%, #1e1b4b 0%, #030712 85%)',
            opacity: 100,
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturate: 100
          },
          instances: [
            // Status Icon / Graphic
            {
              id: 'inst-retorno-icon',
              widgetId: 'library-icon',
              name: 'Ícone Brilho',
              x: 930,
              y: 280,
              width: 60,
              height: 60,
              zIndex: 2,
              visible: true,
              locked: false,
              config: {
                iconType: 'sparkles',
                textColor: '#ec4899',
                fontSize: '48px'
              }
            },
            // Title
            {
              id: 'inst-retorno-titulo',
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
                text: 'ESTAMOS DE VOLTA!',
                textType: 'title',
                textColor: '#ffffff',
                fontSize: '60px',
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            // Subtitle
            {
              id: 'inst-retorno-sub',
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
                text: 'A transmissão continua agora. Bora pra cima!',
                textType: 'subtitle',
                textColor: '#cbd5e1',
                fontSize: '22px',
                fontFamily: 'Inter',
                fontWeight: 'normal',
                textAlign: 'center'
              }
            },
            // Status indicator
            {
              id: 'inst-retorno-status',
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
                borderRadius: '6px',
                showBorder: true,
                fontFamily: 'Inter, sans-serif'
              }
            }
          ]
        },

        // 5. CONVERSA COM INSCRITOS (Just Chatting)
        {
          id: 'sub-conversa',
          name: '5. CONVERSA COM INSCRITOS',
          trigger: 'Shift',
          key: '5',
          shortcut: 'Shift + 5',
          background: {
            type: 'gradient',
            color: '#020617',
            gradient: 'linear-gradient(135deg, #0b0f19 0%, #15102a 60%, #030712 100%)',
            opacity: 100,
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturate: 100
          },
          instances: [
            // Big Webcam Frame Area on Left (16:9, 1280x720)
            {
              id: 'inst-chatting-cam-frame',
              widgetId: 'library-shape',
              name: 'Área da Câmera (Webcam)',
              x: 60,
              y: 120,
              width: 1280,
              height: 720,
              zIndex: 1,
              visible: true,
              locked: false,
              config: {
                shapeType: 'rounded-rectangle',
                textColor: 'rgba(2, 6, 23, 0.6)',
                borderRadius: '6px',
                effBorderActiveType: 'border-solid',
                effBorderColor: '#a855f7',
                effBorderThickness: 3
              }
            },
            // Webcam Placeholder Tag
            {
              id: 'inst-chatting-cam-label',
              widgetId: 'library-text',
              name: 'Espaço Webcam',
              x: 80,
              y: 140,
              width: 220,
              height: 36,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                text: 'CÂMERA PRINCIPAL',
                textType: 'label',
                textColor: '#ffffff',
                backgroundColor: 'rgba(168, 85, 247, 0.9)',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            // Header Title
            {
              id: 'inst-chatting-header-title',
              widgetId: 'library-text',
              name: 'Título da Tela',
              x: 60,
              y: 50,
              width: 500,
              height: 50,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                text: 'BATE-PAPO COM A GALERA',
                textType: 'title',
                textColor: '#ffffff',
                fontSize: '28px',
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'left'
              }
            },
            // Twitch Chat on the right (Full vertical height: 480x900)
            {
              id: 'inst-chatting-chat-box',
              widgetId: 'twitch-chat-box',
              elementKey: 'full_widget',
              isFullWidget: true,
              name: 'Chat da Comunidade',
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
                borderRadius: '6px',
                showBorder: true,
                fontFamily: 'Inter, sans-serif'
              }
            },
            // Bottom goal / sub counter under camera
            {
              id: 'inst-chatting-sub-goal',
              widgetId: 'twitch-sub-goal',
              elementKey: 'full_widget',
              isFullWidget: true,
              name: 'Meta de Inscritos',
              x: 60,
              y: 860,
              width: 620,
              height: 74,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                startValue: 0,
                targetValue: 50,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '6px',
                showBorder: true,
                fontFamily: 'Inter, sans-serif'
              }
            },
            // Bottom bits goal
            {
              id: 'inst-chatting-bits-goal',
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
                targetValue: 2500,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '6px',
                showBorder: true,
                fontFamily: 'Inter, sans-serif'
              }
            },
            // Socials at bottom left
            {
              id: 'inst-chatting-social-1',
              widgetId: 'library-social',
              name: 'Twitch',
              x: 60,
              y: 960,
              width: 220,
              height: 40,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                socialType: 'twitch',
                text: '@streamer',
                displayMode: 'both',
                textColor: '#ffffff',
                fontSize: '13px',
                fontFamily: 'Inter'
              }
            },
            {
              id: 'inst-chatting-social-2',
              widgetId: 'library-social',
              name: 'Instagram',
              x: 300,
              y: 960,
              width: 220,
              height: 40,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                socialType: 'instagram',
                text: '@streamer',
                displayMode: 'both',
                textColor: '#ffffff',
                fontSize: '13px',
                fontFamily: 'Inter'
              }
            },
            {
              id: 'inst-chatting-social-3',
              widgetId: 'library-social',
              name: 'Discord',
              x: 540,
              y: 960,
              width: 220,
              height: 40,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                socialType: 'discord',
                text: 'discord.gg/streamer',
                displayMode: 'both',
                textColor: '#ffffff',
                fontSize: '13px',
                fontFamily: 'Inter'
              }
            }
          ]
        },

        // 6. REACT (Vídeos enviados pelos usuários + Câmera menor do streamer)
        {
          id: 'sub-react',
          name: '6. REACT',
          trigger: 'Shift',
          key: '6',
          shortcut: 'Shift + 6',
          background: {
            type: 'gradient',
            color: '#020617',
            gradient: 'linear-gradient(135deg, #020617 0%, #0d1222 50%, #020617 100%)',
            opacity: 100,
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturate: 100
          },
          instances: [
            // Top Bar: Title & Category
            {
              id: 'inst-react-title',
              widgetId: 'library-text',
              name: 'Título React',
              x: 60,
              y: 40,
              width: 400,
              height: 44,
              zIndex: 2,
              visible: true,
              locked: false,
              config: {
                text: 'REACT DA COMUNIDADE',
                textType: 'title',
                textColor: '#ffffff',
                fontSize: '26px',
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'left'
              }
            },
            // Main Big Video Area (1400x788, 16:9 ratio)
            {
              id: 'inst-react-video-frame',
              widgetId: 'library-shape',
              name: 'Área do Vídeo (React)',
              x: 60,
              y: 100,
              width: 1400,
              height: 788,
              zIndex: 1,
              visible: true,
              locked: false,
              config: {
                shapeType: 'rounded-rectangle',
                textColor: 'rgba(3, 7, 18, 0.7)',
                borderRadius: '6px',
                effBorderActiveType: 'border-solid',
                effBorderColor: '#3b82f6',
                effBorderThickness: 2
              }
            },
            // Tag inside Video Area
            {
              id: 'inst-react-video-tag',
              widgetId: 'library-text',
              name: 'Aviso Vídeo',
              x: 80,
              y: 120,
              width: 220,
              height: 32,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                text: 'VÍDEO / CLIPE EM FOCO',
                textType: 'label',
                textColor: '#ffffff',
                backgroundColor: 'rgba(59, 130, 246, 0.85)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            // Streamer Camera Area on Right Column (400x225, 16:9)
            {
              id: 'inst-react-cam-frame',
              widgetId: 'library-shape',
              name: 'Câmera do Streamer',
              x: 1480,
              y: 100,
              width: 380,
              height: 220,
              zIndex: 2,
              visible: true,
              locked: false,
              config: {
                shapeType: 'rounded-rectangle',
                textColor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '6px',
                effBorderActiveType: 'border-solid',
                effBorderColor: '#a855f7',
                effBorderThickness: 2
              }
            },
            {
              id: 'inst-react-cam-tag',
              widgetId: 'library-text',
              name: 'Tag Câmera',
              x: 1500,
              y: 115,
              width: 140,
              height: 28,
              zIndex: 4,
              visible: true,
              locked: false,
              config: {
                text: 'STREAMER',
                textType: 'label',
                textColor: '#ffffff',
                backgroundColor: 'rgba(168, 85, 247, 0.85)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            // Twitch Chat on Right Column below camera
            {
              id: 'inst-react-chat',
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
                borderRadius: '6px',
                showBorder: true,
                fontFamily: 'Inter, sans-serif'
              }
            },
            // Bottom Info Bar / Labels
            {
              id: 'inst-react-sub-goal',
              widgetId: 'twitch-sub-goal',
              elementKey: 'full_widget',
              isFullWidget: true,
              name: 'Meta de Subs',
              x: 60,
              y: 904,
              width: 440,
              height: 74,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                startValue: 0,
                targetValue: 50,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '6px',
                showBorder: true,
                fontFamily: 'Inter, sans-serif'
              }
            },
            {
              id: 'inst-react-social',
              widgetId: 'library-social',
              name: 'Rede Social',
              x: 520,
              y: 918,
              width: 240,
              height: 40,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                socialType: 'twitch',
                text: '@streamer',
                displayMode: 'both',
                textColor: '#ffffff',
                fontSize: '13px',
                fontFamily: 'Inter'
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
            gradient: 'radial-gradient(ellipse at 50% 40%, #2e1065 0%, #09090b 70%, #020617 100%)',
            opacity: 100,
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturate: 100
          },
          instances: [
            // Top Heart Icon
            {
              id: 'inst-fim-icon',
              widgetId: 'library-icon',
              name: 'Ícone Coração',
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
            // Title
            {
              id: 'inst-fim-titulo',
              widgetId: 'library-text',
              name: 'Título Encerramento',
              x: 460,
              y: 300,
              width: 1000,
              height: 80,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                text: 'MUITO OBRIGADO POR ASSISTIR!',
                textType: 'title',
                textColor: '#ffffff',
                fontSize: '56px',
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            // Subtitle
            {
              id: 'inst-fim-sub',
              widgetId: 'library-text',
              name: 'Mensagem Final',
              x: 560,
              y: 390,
              width: 800,
              height: 40,
              zIndex: 3,
              visible: true,
              locked: false,
              config: {
                text: 'A live encerrou por hoje. Acompanhe as redes para a próxima!',
                textType: 'subtitle',
                textColor: '#cbd5e1',
                fontSize: '22px',
                fontFamily: 'Inter',
                fontWeight: 'normal',
                textAlign: 'center'
              }
            },
            // Summary Event List in center
            {
              id: 'inst-fim-events',
              widgetId: 'twitch-event-list',
              elementKey: 'full_widget',
              isFullWidget: true,
              name: 'Eventos da Transmissão',
              x: 680,
              y: 470,
              width: 560,
              height: 380,
              zIndex: 4,
              visible: true,
              locked: false,
              config: {
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '6px',
                showBorder: true,
                fontFamily: 'Inter, sans-serif'
              }
            },
            // Socials at bottom
            {
              id: 'inst-fim-social-1',
              widgetId: 'library-social',
              name: 'Twitch',
              x: 580,
              y: 910,
              width: 220,
              height: 40,
              zIndex: 5,
              visible: true,
              locked: false,
              config: {
                socialType: 'twitch',
                text: '@streamer',
                displayMode: 'both',
                textColor: '#ffffff',
                fontSize: '14px',
                fontFamily: 'Inter'
              }
            },
            {
              id: 'inst-fim-social-2',
              widgetId: 'library-social',
              name: 'YouTube',
              x: 850,
              y: 910,
              width: 220,
              height: 40,
              zIndex: 5,
              visible: true,
              locked: false,
              config: {
                socialType: 'youtube',
                text: '@streamer',
                displayMode: 'both',
                textColor: '#ffffff',
                fontSize: '14px',
                fontFamily: 'Inter'
              }
            },
            {
              id: 'inst-fim-social-3',
              widgetId: 'library-social',
              name: 'Instagram',
              x: 1120,
              y: 910,
              width: 220,
              height: 40,
              zIndex: 5,
              visible: true,
              locked: false,
              config: {
                socialType: 'instagram',
                text: '@streamer',
                displayMode: 'both',
                textColor: '#ffffff',
                fontSize: '14px',
                fontFamily: 'Inter'
              }
            }
          ]
        }
      ]
    }
  },
  packGamerEsports,
  packCyberpunk,
  packFuturista,
  packSciFi,
  packSynthwave,
  packGlitch,
  packHudTactical,
  packHolografico,
  packTechwear,
  packStreamerRGB,
  ...novasIdentidades,
  ...universosGamer
];
