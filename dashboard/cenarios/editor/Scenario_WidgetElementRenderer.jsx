import React, { useMemo } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { TWITCH_WIDGETS_CATALOG } from '@dashboard/widgets/Widget_twitchWidgetsCatalog';
import { TextMarquee } from './Scenario_textMarquee';
import StructuralWidgetRenderer from './Scenario_StructuralWidgetRenderer';
import { getTemplateForWidget } from './templates/Scenario_index';
import { resolveWidgetCategory } from './Scenario_prebuiltStructuralCatalog';
import { platformIsOnline, platformMeta, platformViewers, selectedPlatforms } from '@dashboard/overlays/Overlay_platformData';
import ReactVideoPlayer from '../Scenario_ReactVideoPlayer';
import ReactChatAndVideoArea from '../Scenario_ReactChatAndVideoArea';
import WebcamSourceRenderer from './Scenario_WebcamSourceRenderer';
import BrowserSourceRenderer from './Scenario_BrowserSourceRenderer';
import { 
  Users, Gamepad2, Award,
  User, Heart, Star, Camera, Mic, Volume2, Video, Music, MessageSquare, Bell, Calendar, Clock, MapPin, Link, Share2, Trophy, Settings, HelpCircle, Smile,
  Twitch, Youtube, Instagram, Facebook, Twitter
} from 'lucide-react';

const LUCIDE_ICONS_MAP = {
  user: User,
  users: Users,
  heart: Heart,
  star: Star,
  camera: Camera,
  mic: Mic,
  volume: Volume2,
  video: Video,
  music: Music,
  chat: MessageSquare,
  bell: Bell,
  calendar: Calendar,
  clock: Clock,
  'map-pin': MapPin,
  link: Link,
  share: Share2,
  gamepad: Gamepad2,
  trophy: Trophy,
  settings: Settings,
  help: HelpCircle,
  smile: Smile,
  twitch: Twitch,
  youtube: Youtube,
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter
};

const SOCIAL_ICONS = {
  twitch: (props) => <Twitch {...props} />,
  youtube: (props) => <Youtube {...props} />,
  instagram: (props) => <Instagram {...props} />,
  facebook: (props) => <Facebook {...props} />,
  twitter: (props) => <Twitter {...props} />,
  kick: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7.5V7H9v3.5l2.5-3.5H13l-3 4 3.5 6h-1.8L9 12v5zm7.5 0h-2V7h2v10z"/>
    </svg>
  ),
  tiktok: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.95-1.72-.1.08-.18.17-.27.25-.02 3.78-.01 7.56-.01 11.34-.11 1.43-.65 2.86-1.63 3.93-1.48 1.66-3.83 2.5-6.02 2.15-2.2-.27-4.21-1.7-5.08-3.75C4.24 21.64 4 19.92 4.19 18.2c.26-2.12 1.65-4.08 3.64-4.87 1.52-.64 3.28-.73 4.8-.2.03-3.04.01-6.09.01-9.14-.94-.09-1.88-.04-2.82.04v-4c1.14-.07 2.29-.07 3.43-.01h-.72z"/>
    </svg>
  ),
  discord: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.27 4.58a15.47 15.47 0 00-3.81-1.2 1 1 0 00-1 .44c-.33.58-.69 1.34-.95 1.96-1.62-.24-3.23-.24-4.82 0-.27-.61-.64-1.37-.97-1.96a1 1 0 00-1-.44 15.36 15.36 0 00-3.81 1.2.98.98 0 00-.45.38C.53 9.42-.32 14.15.1 18.82a1 1 0 00.41.71 15.82 15.82 0 004.88 2.47 1 1 0 001.09-.36c.42-.57.8-1.18 1.12-1.82a1 1 0 00-.54-1.39 10.37 10.37 0 01-1.51-.72 1 1 0 01-.1-.17c.1-.07.2-.15.3-.23a10.51 10.51 0 001.62-.84c3.27 1.51 6.83 1.51 10.06 0a10.74 10.74 0 001.62.84c.1.08.2.16.3.23a1 1 0 01-.1.17 11.23 11.23 0 01-1.51.72 1 1 0 00-.54 1.39c.32.64.7 1.25 1.12 1.82a1 1 0 001.1.36 15.87 15.87 0 004.88-2.47 1 1 0 00.41-.71c.49-5.32-.85-10.02-3.15-13.86a1 1 0 00-.45-.38zM8.02 15.1c-.95 0-1.74-.88-1.74-1.95s.76-1.95 1.74-1.95c.99 0 1.76.88 1.74 1.95-.02 1.07-.77 1.95-1.74 1.95zm7.97 0c-.95 0-1.74-.88-1.74-1.95s.76-1.95 1.74-1.95c.99 0 1.76.88 1.74 1.95-.02 1.07-.77 1.95-1.74 1.95z"/>
    </svg>
  ),
  spotify: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .003C5.373.003 0 5.376 0 12c0 6.627 5.373 12 12 12 6.627 0 12-5.373 12-12 0-6.624-5.373-11.997-12-11.997zm5.49 17.306c-.237.387-.74.512-1.127.275-3.048-1.863-6.884-2.287-11.402-1.253-.44.1-.88-.175-.98-.615-.1-.44.175-.88.615-.98 4.954-1.134 9.176-.662 12.617 1.442.387.237.512.74.277 1.13zm1.464-3.265c-.3.487-.937.643-1.424.343-3.487-2.143-8.805-2.763-12.93-1.512-.55.168-1.12-.15-1.288-.7-.168-.55.15-1.12.7-1.288 4.712-1.43 10.574-.74 14.594 1.73.487.3.643.937.343 1.424zm.125-3.375C15.116 8.223 8.56 8.003 4.773 9.153a1.2 1.2 0 01-1.442-.888 1.2 1.2 0 01.888-1.442C8.598 5.493 15.836 5.753 20.36 8.443a1.2 1.2 0 01-.41 2.21 1.18 1.18 0 01-.88-.18z"/>
    </svg>
  )
};

export function resolveDataBinding(binding, originalText, { connections, streamMeta, liveActivity }, config = {}) {
  if (!binding || binding === 'none') return originalText;

  const twConn = connections?.Twitch || {};
  const kickConn = connections?.Kick || {};
  const isOnline = twConn.status === 'connected' || kickConn.status === 'connected';

  switch (binding) {
    case 'last_sub': {
      const subEvent = (liveActivity?.items || []).find(item =>
        item.eventType === 'twitch_sub' ||
        item.eventType === 'twitch_resub' ||
        item.eventType === 'twitch_subgift' ||
        item.eventType === 'events-last-sub' ||
        (item.eventType && item.eventType.toLowerCase().includes('sub'))
      );
      return subEvent 
        ? (subEvent.user || subEvent.author || subEvent.username) 
        : (isOnline ? 'Nenhum inscrito' : 'Live não conectada');
    }
    case 'last_bits': {
      const bitsEvent = (liveActivity?.items || []).find(item =>
        item.eventType === 'twitch_bits' ||
        item.eventType === 'events-last-bits' ||
        (item.eventType && item.eventType.toLowerCase().includes('bits'))
      );
      return bitsEvent 
        ? `${bitsEvent.user || bitsEvent.author || 'Doador'}: ${bitsEvent.amount || bitsEvent.bits || 0} Bits` 
        : (isOnline ? 'Nenhum cheer registrado' : 'Live não conectada');
    }
    case 'viewers': {
      if (!platformIsOnline(connections, config)) return 'Live offline';
      const viewers = platformViewers(connections, config);
      return viewers === null ? 'Aguardando dados' : String(viewers);
    }
    case 'uptime': {
      if (!platformIsOnline(connections, config)) return 'Live offline';
      const startedAt = platformMeta(streamMeta, connections, config, 'startedAt').startedAt;
      if (startedAt) {
        try {
          const diffMs = Date.now() - new Date(startedAt).getTime();
          if (diffMs > 0) {
            const diffSecs = Math.floor(diffMs / 1000);
            const hrs = Math.floor(diffSecs / 3600);
            const mins = Math.floor((diffSecs % 3600) / 60);
            const secs = diffSecs % 60;
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          }
        } catch (e) {
          console.error(e);
        }
      }
      return 'Aguardando dados';
    }
    case 'current_music': {
      const musicEvent = (liveActivity?.items || []).find(item =>
        item.eventType === 'media-current-music' ||
        (item.eventType && item.eventType.toLowerCase().includes('music'))
      );
      return musicEvent ? (musicEvent.title || musicEvent.text || 'Música Atual') : 'Nenhuma música detectada';
    }
    case 'last_follow': {
      const followEvent = (liveActivity?.items || []).find(item =>
        item.eventType === 'twitch_follow' ||
        item.eventType === 'events-last-follow' ||
        (item.eventType && item.eventType.toLowerCase().includes('follow'))
      );
      return followEvent 
        ? (followEvent.user || followEvent.author || followEvent.username) 
        : (isOnline ? 'Nenhum seguidor recente' : 'Live não conectada');
    }
    case 'events': {
      const latestItem = (liveActivity?.items || []).find(item => selectedPlatforms(config).includes(item.platform) && (item.eventType || item.text || item.message));
      return latestItem 
        ? (latestItem.text || latestItem.message || latestItem.author) 
        : (isOnline ? 'Nenhum evento registrado' : 'Live não conectada');
    }
    default:
      return originalText;
  }
}

export default function WidgetElementRenderer({
  widgetId,
  elementKey,
  isFullWidget,
  config = {},
  isEditing = false,
  onUpdateConfig = () => {},
  onFinishEditing = () => {},
  instanceId = '',
  instanceName = '',
  liveActivity: propLiveActivity,
  connections: propConnections,
  streamMeta: propStreamMeta
}) {
  const contextStreaming = useStreaming();
  const liveActivity = propLiveActivity || contextStreaming?.liveActivity || { items: [] };
  const connections = propConnections || contextStreaming?.connections || {};
  const streamMeta = propStreamMeta || contextStreaming?.streamMeta || {};

  const isReactWebcam = (instanceId && instanceId.includes('react-cam')) || 
                        (instanceName && instanceName.toLowerCase().includes('câmera do streamer')) ||
                        (config.isWebcamFrame === true);

  const baseStyle = {
    color: config.textColor || '#ffffff',
    fontSize: config.fontSize || '14px',
    fontFamily: config.fontFamily || 'Inter, sans-serif',
    fontWeight: config.fontWeight || 'normal',
    textAlign: config.textAlign || 'left',
  };

  const showBorder = config.showBorder === true;
  const thicknessVal = showBorder
    ? (config.effBorderThickness !== undefined ? config.effBorderThickness : (parseInt(config.borderWidth) || 0))
    : 0;
  const effectiveRadius = showBorder
    ? (config.effBorderRadius !== undefined ? `${config.effBorderRadius}px` : (config.borderRadius ? `${parseFloat(config.borderRadius) || 0}px` : '0px'))
    : '0px';

  const containerStyle = {
    ...baseStyle,
    background: config.backgroundColor || 'transparent',
    border: showBorder && thicknessVal > 0
      ? `${thicknessVal}px ${config.borderStyle || 'solid'} ${config.borderColor || config.effBorderColor || 'rgba(255, 255, 255, 0.1)'}`
      : 'none',
    borderRadius: effectiveRadius
  };

  const uniqueClass = useMemo(() => {
    const rand = Math.random().toString(36).substring(2, 9);
    return `widget-override-${rand}`;
  }, []);

  const styleBlock = useMemo(() => {
    // Determine if we have explicit/custom background, border, or shadow selected
    // Default background and border (such as the default automatic container) should NOT count as explicit custom effects.
    const hasExplicitBg = !!(
      (config.effBgActiveType && config.effBgActiveType !== 'bg-transparent') ||
      (config.effBgType && config.effBgType !== 'transparent') ||
      config.effGradientActiveType ||
      config.effGlassActiveType ||
      config.effAnimBgActiveType ||
      (config.backgroundColor && config.backgroundColor !== 'rgba(0, 0, 0, 0.45)' && config.backgroundColor !== 'transparent')
    );

    const thickness = config.effBorderThickness !== undefined ? config.effBorderThickness : (parseInt(config.borderWidth) || 0);
    const hasExplicitBorder = !!(
      (config.showBorder === true && thickness > 0) ||
      (config.effBorderActiveType && config.effBorderActiveType !== 'border-transparent' && config.effBorderActiveType !== 'none' && config.effBorderActiveType !== 'border-radius' && config.showBorder !== false && thickness > 0) ||
      config.effGlowActiveType === 'glow-neon'
    );

    const isNoBorder = !hasExplicitBorder || config.showBorder === false || !config.showBorder || config.effBorderActiveType === 'none' || config.effBorderActiveType === 'border-transparent' || config.effBorderActiveType === 'border-radius' || config.border === 'none' || thickness === 0;

    const hasExplicitShadow = !!(
      config.effShadowActiveType ||
      config.effGlowActiveType
    );

    // 1. Text styling overrides
    const fontFamily = config.fontFamily;
    const textColor = config.textColor;
    const fontSize = config.fontSize;

    let textOverrideCSS = '';
    if (fontFamily) {
      textOverrideCSS += `font-family: ${fontFamily} !important; `;
    }
    if (textColor) {
      textOverrideCSS += `color: ${textColor} !important; `;
    }
    if (fontSize) {
      textOverrideCSS += `font-size: ${fontSize} !important; `;
    }

    // 2. Define Selectors for specific visual elements
    const textSelector = `.${uniqueClass} span, .${uniqueClass} p, .${uniqueClass} h1, .${uniqueClass} h2, .${uniqueClass} h3, .${uniqueClass} h4, .${uniqueClass} marquee, .${uniqueClass} .text-marquee-content, .${uniqueClass} .font-bold, .${uniqueClass} .font-black, .${uniqueClass} label, .${uniqueClass} .text-xs, .${uniqueClass} .text-slate-300`;
    const imageSelector = `.${uniqueClass} img, .${uniqueClass} [role="img"], .${uniqueClass} .thumbnail, .${uniqueClass} .avatar`;
    const iconSelector = `.${uniqueClass} svg, .${uniqueClass} .lucide`;
    const barSelector = `.${uniqueClass} .bg-gradient-to-r, .${uniqueClass} .progress-bar, .${uniqueClass} .bar, .${uniqueClass} .h-full`;

    // Target selector for Content CSS (animations, filters, reflections, glows, drop-shadows, opacity)
    let contentSelector = `.${uniqueClass}`; // Default fallback is container

    if (elementKey && elementKey !== 'full_widget') {
      const lowerKey = elementKey.toLowerCase();
      if (lowerKey.includes('title') || lowerKey.includes('label') || lowerKey.includes('values') || lowerKey.includes('count') || lowerKey.includes('text') || lowerKey === 'status_badge' || lowerKey === 'stream_game' || lowerKey === 'stream_title') {
        // Text and icon components
        contentSelector = `${textSelector}, ${iconSelector}`;
      } else if (lowerKey.includes('bar') || lowerKey.includes('progress')) {
        // Progress bar visual element
        contentSelector = barSelector;
      } else if (lowerKey.includes('image') || lowerKey.includes('avatar') || lowerKey.includes('capa') || lowerKey.includes('thumbnail') || lowerKey.includes('photo')) {
        // Image visual elements
        contentSelector = imageSelector;
      } else if (lowerKey.includes('icon') || lowerKey.includes('badge')) {
        // Icons
        contentSelector = iconSelector;
      }
    } else if (isFullWidget || widgetId) {
      // For full widgets, apply content effects (animations, glows, filters) to actual inner widget content
      contentSelector = `.${uniqueClass} .widget-inner-content`;
    }

    // Container Specific CSS (Background, Border, Frost, Box Shadows)
    let containerCSS = '';
    // Content Specific CSS (Filters, Opacity, Reflection, Drop Shadows, Animations)
    let contentCSS = '';

    // Opacity - content effect
    if (config.effOpacity !== undefined) {
      contentCSS += `opacity: ${config.effOpacity / 100} !important; `;
    }

    const isTransparent = (config.effBgActiveType === 'bg-transparent' || config.backgroundColor === 'transparent' || config.isTransparent === true || config.bgMode === 'transparent' || config.effBgType === 'transparent') && config.effBgActiveType !== 'bg-solid' && config.isTransparent !== false;

    // 1. FUNDOS BÁSICOS - container effect
    if (isReactWebcam) {
      containerCSS += `background: transparent !important; `;
    } else if (isTransparent) {
      containerCSS += `background: transparent !important; background-image: none !important; box-shadow: none !important; `;
    } else if (config.effBgActiveType) {
      if (config.effBgActiveType === 'bg-solid') {
        const solidColor = (config.effBgColor && config.effBgColor !== 'transparent')
          ? config.effBgColor
          : (config.backgroundColor && config.backgroundColor !== 'transparent' ? config.backgroundColor : '#111827');
        containerCSS += `background: ${solidColor} !important; background-color: ${solidColor} !important; `;
      } else if (config.effBgActiveType === 'bg-semi-transparent') {
        const op = config.effBgOpacity !== undefined ? config.effBgOpacity : 50;
        containerCSS += `background: ${config.effBgColor || '#000000'} !important; opacity: ${op / 100} !important; `;
      } else if (config.effBgActiveType === 'bg-opacity') {
        containerCSS += `opacity: ${(config.effOpacity !== undefined ? config.effOpacity : 100) / 100} !important; `;
      }
    } else if (config.backgroundColor && config.backgroundColor !== 'transparent') {
      containerCSS += `background: ${config.backgroundColor} !important; `;
    } else {
      // Legacy support/fallback
      if (config.effBgType === 'gradient') {
        const gStart = config.effGradientStart || '#a855f7';
        const gEnd = config.effGradientEnd || '#1e1b4b';
        const gAngle = config.effGradientAngle || 135;
        if (config.effGradientType === 'radial') {
          containerCSS += `background: radial-gradient(circle, ${gStart} 0%, ${gEnd} 100%) !important; `;
        } else {
          containerCSS += `background: linear-gradient(${gAngle}deg, ${gStart} 0%, ${gEnd} 100%) !important; `;
        }
      } else if (config.effBgType === 'flat' && config.effBgColor) {
        containerCSS += `background: ${config.effBgColor} !important; `;
      } else if (config.effBgType === 'transparent') {
        containerCSS += `background: transparent !important; `;
      } else if (!hasExplicitBg) {
        containerCSS += `background: transparent !important; `;
      }
    }

    // 2. GRADIENTES - container effect
    if (config.effGradientActiveType) {
      const gStart = config.effGradientStart || '#a855f7';
      const gMiddle = config.effGradientMiddle || '#ec4899';
      const gEnd = config.effGradientEnd || '#1e1b4b';
      let gAngle = config.effGradientAngle !== undefined ? config.effGradientAngle : 135;

      if (config.effGradientActiveType === 'gradient-vertical') gAngle = 180;
      if (config.effGradientActiveType === 'gradient-horizontal') gAngle = 90;
      if (config.effGradientActiveType === 'gradient-diagonal') gAngle = 135;

      if (config.effGradientActiveType === 'gradient-radial') {
        containerCSS += `background: radial-gradient(circle, ${gStart} 0%, ${gEnd} 100%) !important; `;
      } else if (config.effGradientActiveType === 'gradient-conic') {
        containerCSS += `background: conic-gradient(${gStart}, ${gEnd}) !important; `;
      } else if (config.effGradientActiveType === 'gradient-3-colors') {
        containerCSS += `background: linear-gradient(${gAngle}deg, ${gStart} 0%, ${gMiddle} 50%, ${gEnd} 100%) !important; `;
      } else if (config.effGradientActiveType === 'gradient-multi') {
        containerCSS += `background: linear-gradient(${gAngle}deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff) !important; `;
      } else if (config.effGradientActiveType === 'gradient-smooth') {
        containerCSS += `background: linear-gradient(${gAngle}deg, ${gStart} 0%, rgba(168, 85, 247, 0.5) 50%, ${gEnd} 100%) !important; `;
      } else if (config.effGradientActiveType === 'gradient-intense') {
        containerCSS += `background: linear-gradient(${gAngle}deg, #ff007f 0%, #7f00ff 100%) !important; `;
      } else {
        containerCSS += `background: linear-gradient(${gAngle}deg, ${gStart} 0%, ${gEnd} 100%) !important; `;
      }
    }

    // 3. VIDRO / BLUR - container effect
    if (config.effGlassActiveType) {
      const backdropBlur = config.effBackdropBlur !== undefined ? config.effBackdropBlur : 8;
      
      if (config.effGlassActiveType === 'glass-blur') {
        containerCSS += `filter: blur(${backdropBlur}px) !important; `;
      } else if (config.effGlassActiveType === 'glass-backdrop') {
        containerCSS += `backdrop-filter: blur(${backdropBlur}px) !important; `;
      } else if (config.effGlassActiveType === 'glass-frosted') {
        const intensity = config.effGlassIntensity !== undefined ? config.effGlassIntensity : 15;
        containerCSS += `backdrop-filter: blur(${backdropBlur}px) !important; background: rgba(255, 255, 255, ${intensity / 100}) !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; `;
      } else if (config.effGlassActiveType === 'glass-normal') {
        const op = config.effGlassOpacity !== undefined ? config.effGlassOpacity : 20;
        containerCSS += `backdrop-filter: blur(${backdropBlur}px) !important; background: rgba(255, 255, 255, ${op / 100}) !important; border: 1px solid rgba(255, 255, 255, 0.15) !important; `;
      } else if (config.effGlassActiveType === 'glass-dark') {
        containerCSS += `backdrop-filter: blur(${backdropBlur}px) !important; background: rgba(0, 0, 0, 0.45) !important; border: 1px solid rgba(255, 255, 255, 0.08) !important; `;
      } else if (config.effGlassActiveType === 'glass-light') {
        containerCSS += `backdrop-filter: blur(${backdropBlur}px) !important; background: rgba(255, 255, 255, 0.45) !important; border: 1px solid rgba(0, 0, 0, 0.08) !important; `;
      } else if (config.effGlassActiveType === 'glass-colored') {
        const glassCol = config.effGlassColor || '#a855f7';
        containerCSS += `backdrop-filter: blur(${backdropBlur}px) !important; background: ${glassCol}22 !important; border: 1px solid ${glassCol}44 !important; `;
      } else if (config.effGlassActiveType === 'glass-translucent') {
        const op = config.effGlassOpacity !== undefined ? config.effGlassOpacity : 10;
        containerCSS += `backdrop-filter: blur(${backdropBlur}px) !important; background: rgba(255, 255, 255, ${op / 100}) !important; `;
      }
    } else {
      // Legacy glass
      if (config.effGlass) {
        containerCSS += `backdrop-filter: blur(${config.effBackdropBlur || 8}px) !important; background: rgba(255, 255, 255, 0.08) !important; border: 1px solid rgba(255, 255, 255, 0.15) !important; `;
      } else if (config.effBackdropBlur) {
        containerCSS += `backdrop-filter: blur(${config.effBackdropBlur}px) !important; `;
      }
    }

    // 4. LUZ / GLOW - Filter is content, box-shadow is container
    if (config.effGlowActiveType) {
      const glowColor = config.effShadowColor || '#a855f7';
      const glowColor2 = config.effShadowColor2 || '#ec4899';
      const glowIntensity = config.effShadowIntensity !== undefined ? config.effShadowIntensity : 8;

      if (config.effGlowActiveType === 'glow-normal' || config.effGlowActiveType === 'glow-soft') {
        contentCSS += `filter: drop-shadow(0 0 ${glowIntensity}px ${glowColor}) !important; `;
      } else if (config.effGlowActiveType === 'glow-strong') {
        contentCSS += `filter: drop-shadow(0 0 ${glowIntensity}px ${glowColor}) drop-shadow(0 0 ${glowIntensity / 2}px ${glowColor}) !important; `;
      } else if (config.effGlowActiveType === 'glow-colored') {
        contentCSS += `filter: drop-shadow(0 0 ${glowIntensity}px ${glowColor}) drop-shadow(0 0 ${glowIntensity / 2}px ${glowColor2}) !important; `;
      } else if (config.effGlowActiveType === 'glow-neon') {
        containerCSS += `box-shadow: 0 0 ${glowIntensity}px ${glowColor}, inset 0 0 ${glowIntensity / 2}px ${glowColor} !important; border: 1px solid ${glowColor} !important; `;
      } else if (config.effGlowActiveType === 'glow-halo') {
        containerCSS += `box-shadow: 0 0 0 ${glowIntensity}px ${glowColor} !important; `;
      } else if (config.effGlowActiveType === 'glow-outer') {
        containerCSS += `box-shadow: 0 0 ${glowIntensity}px 2px ${glowColor} !important; `;
      } else if (config.effGlowActiveType === 'glow-inner') {
        containerCSS += `box-shadow: inset 0 0 ${glowIntensity}px ${glowColor} !important; `;
      }
    } else {
      // Legacy Glow
      if (config.effShadowType === 'neon') {
        const neonColor = config.effShadowColor || '#a855f7';
        const neonIntensity = config.effShadowIntensity !== undefined ? config.effShadowIntensity : 8;
        containerCSS += `box-shadow: 0 0 ${neonIntensity}px ${neonColor}, inset 0 0 ${neonIntensity / 2}px ${neonColor} !important; border: 1px solid ${neonColor} !important; `;
      } else if (config.effShadowType === 'glow') {
        const glowColor = config.effShadowColor || '#a855f7';
        const glowIntensity = config.effShadowIntensity !== undefined ? config.effShadowIntensity : 6;
        contentCSS += `filter: drop-shadow(0 0 ${glowIntensity}px ${glowColor}) !important; `;
      }
    }

    // 5. SOMBRAS - Sombra drop is content, others are container
    if (config.effShadowActiveType) {
      const sColor = config.effShadowColor || 'rgba(0,0,0,0.4)';
      const sIntensity = config.effShadowIntensity !== undefined ? config.effShadowIntensity : 10;

      if (config.effShadowActiveType === 'shadow-soft') {
        containerCSS += `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important; `;
      } else if (config.effShadowActiveType === 'shadow-strong') {
        containerCSS += `box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4) !important; `;
      } else if (config.effShadowActiveType === 'shadow-drop') {
        contentCSS += `filter: drop-shadow(${config.effShadowX || 4}px ${config.effShadowY || 4}px ${config.effShadowBlur || 8}px ${sColor}) !important; `;
      } else if (config.effShadowActiveType === 'shadow-inner') {
        containerCSS += `box-shadow: inset 0 0 ${sIntensity}px ${sColor} !important; `;
      } else if (config.effShadowActiveType === 'shadow-long') {
        let shadows = [];
        for (let i = 1; i <= sIntensity; i++) {
          shadows.push(`${i}px ${i}px ${sColor}`);
        }
        containerCSS += `box-shadow: ${shadows.join(', ')} !important; `;
      } else if (config.effShadowActiveType === 'shadow-diffuse') {
        containerCSS += `box-shadow: 0 0 ${sIntensity}px rgba(0,0,0,0.2) !important; `;
      }
    } else {
      // Legacy Shadow fallback
      if (config.effShadowType === 'soft') {
        containerCSS += `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important; `;
      } else if (config.effShadowType === 'strong') {
        containerCSS += `box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4) !important; `;
      }
    }

    // 6. ACABAMENTO VISUAL (Filters) - Content effect
    let filters = [];
    if (config.effBlur) filters.push(`blur(${config.effBlur}px)`);
    if (config.effBrightness !== undefined) filters.push(`brightness(${config.effBrightness}%)`);
    if (config.effContrast !== undefined) filters.push(`contrast(${config.effContrast}%)`);
    if (config.effSaturation !== undefined) filters.push(`saturate(${config.effSaturation}%)`);
    if (config.effGrayscale) filters.push(`grayscale(${config.effGrayscale}%)`);
    if (config.effSepia) filters.push(`sepia(${config.effSepia}%)`);
    if (config.effInvert) filters.push(`invert(${config.effInvert}%)`);
    if (config.effHueRotate) filters.push(`hue-rotate(${config.effHueRotate}deg)`);

    if (config.effFilterActiveType) {
      if (config.effFilterActiveType === 'filter-grayscale') {
        filters.push(`grayscale(${config.effGrayscale !== undefined ? config.effGrayscale : 100}%)`);
      } else if (config.effFilterActiveType === 'filter-sepia') {
        filters.push(`sepia(${config.effSepia !== undefined ? config.effSepia : 100}%)`);
      } else if (config.effFilterActiveType === 'filter-saturate') {
        filters.push(`saturate(${config.effSaturation !== undefined ? config.effSaturation : 100}%)`);
      } else if (config.effFilterActiveType === 'filter-desaturate') {
        const des = config.effDesaturate !== undefined ? config.effDesaturate : 50;
        filters.push(`saturate(${100 - des}%)`);
      } else if (config.effFilterActiveType === 'filter-contrast') {
        filters.push(`contrast(${config.effContrast !== undefined ? config.effContrast : 100}%)`);
      } else if (config.effFilterActiveType === 'filter-brightness') {
        filters.push(`brightness(${config.effBrightness !== undefined ? config.effBrightness : 100}%)`);
      } else if (config.effFilterActiveType === 'filter-hue') {
        filters.push(`hue-rotate(${config.effHueRotate !== undefined ? config.effHueRotate : 90}deg)`);
      } else if (config.effFilterActiveType === 'filter-invert') {
        filters.push(`invert(${config.effInvert !== undefined ? config.effInvert : 100}%)`);
      } else if (config.effFilterActiveType === 'filter-blur') {
        filters.push(`blur(${config.effBlur !== undefined ? config.effBlur : 4}px)`);
      }
    }

    if (filters.length > 0) {
      contentCSS += `filter: ${filters.join(' ')} !important; `;
    }

    // 7. ESPELHAMENTO / REFLEXO - Content effect
    if (config.effReflectActiveType) {
      if (config.effReflectActiveType === 'reflect-h') {
        contentCSS += `transform: scaleX(-1) !important; `;
      } else if (config.effReflectActiveType === 'reflect-v') {
        contentCSS += `transform: scaleY(-1) !important; `;
      } else if (config.effReflectActiveType === 'reflect-normal') {
        const op = config.effReflectionOpacity !== undefined ? config.effReflectionOpacity : 30;
        contentCSS += `-webkit-box-reflect: below 2px linear-gradient(transparent, rgba(255, 255, 255, ${op / 100})) !important; `;
      } else if (config.effReflectActiveType === 'reflect-transparent') {
        const op = config.effReflectionOpacity !== undefined ? config.effReflectionOpacity : 15;
        contentCSS += `-webkit-box-reflect: below 4px linear-gradient(transparent 30%, rgba(255, 255, 255, ${op / 100})) !important; `;
      }
    } else {
      // Legacy reflection
      if (config.effReflection) {
        contentCSS += `-webkit-box-reflect: below 2px linear-gradient(transparent, rgba(255, 255, 255, 0.15)) !important; `;
      }
    }

    // 8. BORDA / SUPERFÍCIE - Container effect
    const effectiveRadiusVal = (config.showBorder === true && config.borderRadius) ? `${parseFloat(config.borderRadius) || 0}px` : '0px';
    if (config.showBorder === true && thickness > 0) {
      const bColor = config.borderColor || config.effBorderColor || '#ffffff';
      const bThickness = thickness;
      const bRadius = config.effBorderRadius !== undefined ? config.effBorderRadius : (parseFloat(config.borderRadius) ? parseFloat(config.borderRadius) : 0);
      const bStyle = config.borderStyle || 'solid';

      if (config.effBorderActiveType === 'border-glow') {
        const glow = config.effBorderGlow !== undefined ? config.effBorderGlow : 8;
        containerCSS += `border: ${bThickness}px ${bStyle} ${bColor} !important; box-shadow: 0 0 ${glow}px ${bColor} !important; `;
      } else if (config.effBorderActiveType === 'border-neon') {
        const neon = config.effBorderNeon !== undefined ? config.effBorderNeon : 8;
        containerCSS += `border: ${bThickness}px ${bStyle} ${bColor} !important; box-shadow: 0 0 ${neon}px ${bColor}, inset 0 0 ${neon / 2}px ${bColor} !important; `;
      } else if (config.effBorderActiveType === 'border-gradient') {
        const bGradStart = config.effBorderGradStart || '#a855f7';
        const bGradEnd = config.effBorderGradEnd || '#ec4899';
        containerCSS += `border: ${bThickness}px solid transparent !important; border-image: linear-gradient(to right, ${bGradStart}, ${bGradEnd}) 1 !important; `;
      } else {
        containerCSS += `border: ${bThickness}px ${bStyle} ${bColor} !important; `;
      }
      containerCSS += `border-radius: ${bRadius}px !important; `;
    } else {
      containerCSS += `border: none !important; border-width: 0px !important; outline: none !important; border-radius: 0px !important; `;
    }

    // 3. Composite Animations (Core animations & animated effects) - Content or Container
    let containerAnimations = [];
    let contentAnimations = [];

    // Core Animation Configuration - Content effect
    if (config.animationName && config.animationName !== 'none') {
      const duration = config.animationDuration !== undefined ? config.animationDuration : 1.5;
      const delay = config.animationDelay !== undefined ? config.animationDelay : 0;
      const repeat = config.animationRepeat || 'infinite';
      const direction = config.animationDirection || 'normal';
      
      let animStr = `${config.animationName} ${duration}s ${repeat === 'infinite' ? 'infinite' : repeat} ${direction} ease-in-out`;
      if (delay > 0) {
        animStr += ` ${delay}s`;
      }
      if (repeat !== 'infinite') {
        animStr += ' forwards';
      }
      contentAnimations.push(animStr);
    }

    // 9. FUNDOS ANIMADOS (Visual Effect Animations) - Container for bg, content for glow/pulse/shimmer
    if (config.effAnimBgActiveType) {
      const animSpeed = config.effAnimSpeed !== undefined ? config.effAnimSpeed : 2.5;
      const animDelay = config.effAnimDelay !== undefined ? config.effAnimDelay : 0;
      const animRepeat = config.effAnimRepeat || 'infinite';

      const suffix = `${animSpeed}s ${animDelay > 0 ? animDelay + 's' : ''} ${animRepeat === 'infinite' ? 'infinite' : animRepeat} ${animRepeat !== 'infinite' ? 'forwards' : ''}`;

      if (config.effAnimBgActiveType === 'anim-bg-gradient') {
        containerCSS += `background-size: 200% 200% !important; `;
        containerAnimations.push(`gradientAnimated ${suffix} ease-in-out`);
      } else if (config.effAnimBgActiveType === 'anim-bg-glow-pulse') {
        contentAnimations.push(`glowPulsing ${suffix} ease-in-out`);
      } else if (config.effAnimBgActiveType === 'anim-bg-neon-pulse') {
        containerAnimations.push(`neonPulsing ${suffix} ease-in-out`);
      } else if (config.effAnimBgActiveType === 'anim-bg-shimmer') {
        contentAnimations.push(`shimmerEffect ${suffix} ease-in-out`);
      } else if (config.effAnimBgActiveType === 'anim-bg-flicker') {
        contentAnimations.push(`cintilar ${suffix} ease-in-out`);
      } else if (config.effAnimBgActiveType === 'anim-bg-hue-shift') {
        contentAnimations.push(`hueShiftAnim ${suffix} linear`);
      } else if (config.effAnimBgActiveType === 'anim-bg-blur-pulse') {
        contentAnimations.push(`blurPulse ${suffix} ease-in-out`);
      } else if (config.effAnimBgActiveType === 'anim-bg-pulse') {
        contentAnimations.push(`bgPulseAnim ${suffix} ease-in-out`);
      } else if (config.effAnimBgActiveType === 'anim-bg-grad-move') {
        containerCSS += `background-size: 200% 200% !important; `;
        containerAnimations.push(`gradientAnimated ${suffix} linear`);
      }
    } else {
      // Legacy Animated Effects Fallbacks
      if (config.effShadowType === 'glow' && config.effGlowPulsing) {
        contentAnimations.push('glowPulsing 2s infinite ease-in-out');
      }
      if (config.effShadowType === 'neon' && config.effNeonPulsing) {
        containerAnimations.push('neonPulsing 2s infinite ease-in-out');
      }
      if (config.effBgType === 'gradient' && config.effGradientAnimated) {
        containerAnimations.push('gradientAnimated 4s infinite ease-in-out');
      }
      if (config.effBlurAnimated) {
        contentAnimations.push('blurPulse 3s infinite ease-in-out');
      }
      if (config.effShimmer) {
        contentAnimations.push('shimmerEffect 2.5s infinite ease-in-out');
      }
    }

    let containerAnimationsCSS = '';
    if (containerAnimations.length > 0) {
      containerAnimationsCSS = `animation: ${containerAnimations.join(', ')} !important; `;
    }

    let contentAnimationsCSS = '';
    if (contentAnimations.length > 0) {
      contentAnimationsCSS = `animation: ${contentAnimations.join(', ')} !important; `;
    }

    return (
      <style>{`
        /* Text styling overrides scoped to unique class */
        .${uniqueClass} * {
          ${textOverrideCSS}
        }

        /* Container specific visual effects and animations */
        .${uniqueClass} {
          ${containerCSS}
          ${containerAnimationsCSS}
        }

        /* Transparency overrides when Transparente is selected or no explicit background is configured */
        ${isTransparent ? `
        .${uniqueClass},
        .${uniqueClass} header,
        .${uniqueClass} .header,
        .${uniqueClass} nav,
        .${uniqueClass} section,
        .${uniqueClass} article,
        .${uniqueClass} main,
        .${uniqueClass} aside,
        .${uniqueClass} div,
        .${uniqueClass} ul,
        .${uniqueClass} ol,
        .${uniqueClass} li,
        .${uniqueClass} table,
        .${uniqueClass} tr,
        .${uniqueClass} td,
        .${uniqueClass} th,
        .${uniqueClass} form,
        .${uniqueClass} .widget-inner-content,
        .${uniqueClass} [class*="bg-"],
        .${uniqueClass} [style*="background"] {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          backdrop-filter: none !important;
          box-shadow: none !important;
        }
        ` : (!hasExplicitBg ? `
        .${uniqueClass},
        .${uniqueClass} .widget-inner-content, 
        .${uniqueClass} .widget-inner-content > div,
        .${uniqueClass} [style*="background"],
        .${uniqueClass} [style*="background-color"] {
          background: transparent !important;
          background-color: transparent !important;
          backdrop-filter: none !important;
        }
        ` : '')}

        ${isNoBorder ? `
        .${uniqueClass},
        .${uniqueClass} > div,
        .${uniqueClass} > div > div:first-child,
        .${uniqueClass} .widget-inner-content,
        .${uniqueClass} .widget-inner-content > div:first-child {
          border: none !important;
          border-width: 0px !important;
          border-color: transparent !important;
          border-style: none !important;
          outline: none !important;
          border-radius: 0px !important;
        }
        ` : ''}

        ${!hasExplicitShadow ? `
        .${uniqueClass},
        .${uniqueClass} .widget-inner-content, 
        .${uniqueClass} .widget-inner-content > div {
          box-shadow: none !important;
        }
        ` : ''}

        /* Content specific visual effects, filters, glows, shadows and core animations */
        ${contentSelector} {
          ${contentCSS}
          ${contentAnimationsCSS}
        }

        /* --- OVERLAY KEYFRAME DEFINITIONS --- */

        /* 1. ENTRADA */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes surgir { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideInCima { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInBaixo { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInEsquerda { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInDireita { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes reveal { from { clip-path: inset(0 0 100% 0); opacity: 0; } to { clip-path: inset(0 0 0 0); opacity: 1; } }
        @keyframes expandir { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes flipIn { from { transform: perspective(400px) rotateY(90deg); opacity: 0; } to { transform: perspective(400px) rotateY(0deg); opacity: 1; } }
        @keyframes rotateIn { from { transform: rotate(-180deg) scale(0.5); opacity: 0; } to { transform: rotate(0deg) scale(1); opacity: 1; } }
        @keyframes bounceIn {
          0%, 20%, 40%, 60%, 80%, 100% { transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000); }
          0% { opacity: 0; transform: scale3d(.3, .3, .3); }
          20% { transform: scale3d(1.1, 1.1, 1.1); }
          40% { transform: scale3d(.9, .9, .9); }
          60% { opacity: 1; transform: scale3d(1.03, 1.03, 1.03); }
          80% { transform: scale3d(.97, .97, .97); }
          100% { opacity: 1; transform: scale3d(1, 1, 1); }
        }
        @keyframes blurIn { from { filter: blur(20px); opacity: 0; } to { filter: blur(0px); opacity: 1; } }
        @keyframes lightSpeedIn {
          from { transform: translate3d(100%, 0, 0) skewX(-30deg); opacity: 0; }
          60% { transform: skewX(20deg); opacity: 1; }
          80% { transform: skewX(-5deg); }
          to { transform: translate3d(0, 0, 0); }
        }

        /* 2. SAÍDA */
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes zoomOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0); opacity: 0; } }
        @keyframes scaleOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.6); opacity: 0; } }
        @keyframes slideOutCima { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-50px); opacity: 0; } }
        @keyframes slideOutBaixo { from { transform: translateY(0); opacity: 1; } to { transform: translateY(50px); opacity: 0; } }
        @keyframes slideOutEsquerda { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-50px); opacity: 0; } }
        @keyframes slideOutDireita { from { transform: translateX(0); opacity: 1; } to { transform: translateX(50px); opacity: 0; } }
        @keyframes encolher { from { transform: scale(1); opacity: 1; } to { transform: scale(0.5); opacity: 0; } }
        @keyframes flipOut { from { transform: perspective(400px) rotateY(0deg); opacity: 1; } to { transform: perspective(400px) rotateY(90deg); opacity: 0; } }
        @keyframes rotateOut { from { transform: rotate(0deg) scale(1); opacity: 1; } to { transform: rotate(180deg) scale(0.5); opacity: 0; } }
        @keyframes bounceOut {
          20% { transform: scale3d(.9, .9, .9); }
          50%, 55% { opacity: 1; transform: scale3d(1.1, 1.1, 1.1); }
          100% { opacity: 0; transform: scale3d(.3, .3, .3); }
        }
        @keyframes blurOut { from { filter: blur(0px); opacity: 1; } to { filter: blur(20px); opacity: 0; } }
        @keyframes lightSpeedOut {
          from { opacity: 1; }
          to { transform: translate3d(100%, 0, 0) skewX(30deg); opacity: 0; }
        }

        /* 3. ÊNFASE */
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes heartbeat { 0% { transform: scale(1); } 14% { transform: scale(1.11); } 28% { transform: scale(1); } 42% { transform: scale(1.11); } 70% { transform: scale(1); } }
        @keyframes pop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0; } }
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-12px); } 60% { transform: translateY(-6px); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        @keyframes shakeHorizontal { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
        @keyframes shakeVertical { 0%, 100% { transform: translateY(0); } 10%, 30%, 50%, 70%, 90% { transform: translateY(-5px); } 20%, 40%, 60%, 80% { transform: translateY(5px); } }
        @keyframes swing { 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); } 100% { transform: rotate(0deg); } }
        @keyframes wobble { 0% { transform: translateX(0%); } 15% { transform: translateX(-15%) rotate(-5deg); } 30% { transform: translateX(10%) rotate(3deg); } 45% { transform: translateX(-10%) rotate(-3deg); } 60% { transform: translateX(5%) rotate(2deg); } 75% { transform: translateX(-3%) rotate(-1deg); } 100% { transform: translateX(0%); } }
        @keyframes jello { 11.1% { transform: none } 22.2% { transform: skewX(-12.5deg) skewY(-12.5deg) } 33.3% { transform: skewX(6.25deg) skewY(6.25deg) } 44.4% { transform: skewX(-3.125deg) skewY(-3.125deg) } 55.5% { transform: skewX(1.5625deg) skewY(1.5625deg) } 66.6% { transform: skewX(-0.78125deg) skewY(-0.78125deg) } 77.7% { transform: skewX(0.390625deg) skewY(0.390625deg) } 88.8% { transform: skewX(-0.1953125deg) skewY(-0.1953125deg) } 100% { transform: none } }
        @keyframes rubberBand { 0% { transform: scale3d(1, 1, 1); } 30% { transform: scale3d(1.25, 0.75, 1); } 40% { transform: scale3d(0.75, 1.25, 1); } 50% { transform: scale3d(1.15, 0.85, 1); } 65% { transform: scale3d(0.95, 1.05, 1); } 75% { transform: scale3d(1.05, 0.95, 1); } 100% { transform: scale3d(1, 1, 1); } }
        @keyframes tada {
          0% { transform: scale3d(1, 1, 1); }
          10%, 20% { transform: scale3d(.9, .9, .9) rotate3d(0, 0, 1, -3deg); }
          30%, 50%, 70%, 90% { transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg); }
          40%, 60%, 80% { transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg); }
          100% { transform: scale3d(1, 1, 1); }
        }
        @keyframes cintilar { 0%, 100% { opacity: 1; filter: brightness(100%); } 50% { opacity: 0.4; filter: brightness(180%); } }

        /* 4. MOVIMENTO CONTÍNUO */
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes flutuacaoVertical { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes flutuacaoHorizontal { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(10px); } }
        @keyframes movimentoLateral { 0%, 100% { transform: translateX(-15px); } 50% { transform: translateX(15px); } }
        @keyframes movimentoVertical { 0%, 100% { transform: translateY(-15px); } 50% { transform: translateY(15px); } }
        @keyframes bounceContinuo { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes pulseContinuo { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes respiracao { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.04); opacity: 0.85; } }
        @keyframes swingContinuo { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } }
        @keyframes giroContinuo { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes zoomSuave { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes pan { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes drift { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(4px, -4px) rotate(1deg); } }

        /* 5. ROTAÇÃO / TRANSFORMAÇÃO */
        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes flipHorizontal { 0%, 100% { transform: perspective(400px) rotateY(0deg); } 50% { transform: perspective(400px) rotateY(180deg); } }
        @keyframes flipVertical { 0%, 100% { transform: perspective(400px) rotateX(0deg); } 50% { transform: perspective(400px) rotateX(180deg); } }
        @keyframes tilt { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        @keyframes cambalhota { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes scale { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes stretch { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(1.25); } }
        @keyframes squash { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.25); } }
        @keyframes elastic {
          0%, 100% { transform: scale3d(1, 1, 1); }
          30% { transform: scale3d(1.25, 0.75, 1); }
          40% { transform: scale3d(0.75, 1.25, 1); }
          50% { transform: scale3d(1.15, 0.85, 1); }
        }

        /* 6. TEXTO */
        @keyframes typewriter { from { width: 0; } to { width: 100%; } }
        @keyframes textReveal { from { opacity: 0; transform: translateY(8px); filter: blur(3px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes textFade { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes textSlide { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes textPop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        @keyframes textBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes textWave { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        @keyframes textCintilar { 0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px rgba(255,255,255,0.8)); } 50% { opacity: 0.5; } }
        @keyframes textPanorama { 0%, 100% { transform: translateX(-5px); } 50% { transform: translateX(5px); } }
        @keyframes textSurgir { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes textQuicar { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes textLetterReveal { from { letter-spacing: -0.2em; filter: blur(5px); opacity: 0; } to { letter-spacing: normal; filter: blur(0); opacity: 1; } }

        /* 9. FUNDOS ANIMADOS */
        @keyframes glowPulsing { 0%, 100% { filter: drop-shadow(0 0 4px var(--glow-color, #a855f7)) !important; } 50% { filter: drop-shadow(0 0 15px var(--glow-color, #a855f7)) !important; } }
        @keyframes neonPulsing { 0%, 100% { box-shadow: 0 0 5px var(--glow-color, #a855f7), inset 0 0 5px var(--glow-color, #a855f7) !important; } 50% { box-shadow: 0 0 20px var(--glow-color, #a855f7), inset 0 0 10px var(--glow-color, #a855f7) !important; } }
        @keyframes gradientAnimated { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes blurPulse { 0%, 100% { filter: blur(0px); } 50% { filter: blur(4px); } }
        @keyframes shimmerEffect { 0% { opacity: 0.85; filter: brightness(1); } 50% { opacity: 1; filter: brightness(1.25); } 100% { opacity: 0.85; filter: brightness(1); } }
        @keyframes hueShiftAnim { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
        @keyframes bgPulseAnim { 0%, 100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.02); filter: brightness(1.1); } }
      `}</style>
    );
  }, [
    config.fontFamily,
    config.textColor,
    config.fontSize,
    config.effOpacity,
    config.effBgActiveType,
    config.effBgColor,
    config.effBgOpacity,
    config.effGradientActiveType,
    config.effGradientStart,
    config.effGradientMiddle,
    config.effGradientEnd,
    config.effGradientType,
    config.effGradientAngle,
    config.effGradientColorsCount,
    config.effGradientMulti,
    config.effGradientSmooth,
    config.effGradientIntense,
    config.effGlassActiveType,
    config.effBackdropBlur,
    config.effGlassIntensity,
    config.effGlassOpacity,
    config.effGlassColor,
    config.effGlowActiveType,
    config.effShadowColor,
    config.effShadowColor2,
    config.effShadowIntensity,
    config.effShadowActiveType,
    config.effShadowX,
    config.effShadowY,
    config.effShadowBlur,
    config.effGrayscaleActive,
    config.effGrayscale,
    config.effSepiaActive,
    config.effSepia,
    config.effSaturateActive,
    config.effSaturation,
    config.effDesaturateActive,
    config.effDesaturate,
    config.effContrastActive,
    config.effContrast,
    config.effBrightnessActive,
    config.effBrightness,
    config.effHueActive,
    config.effHueRotate,
    config.effInvertActive,
    config.effInvert,
    config.effBlurActive,
    config.effBlur,
    config.effReflectActiveType,
    config.effReflectionOpacity,
    config.effReflectionTransparent,
    config.effBorderActiveType,
    config.effBorderColor,
    config.effBorderThickness,
    config.effBorderGlow,
    config.effBorderNeon,
    config.effBorderGradStart,
    config.effBorderGradEnd,
    config.effBorderRadius,
    config.effAnimBgActiveType,
    config.effAnimSpeed,
    config.effAnimIntensity,
    config.effAnimDelay,
    config.effAnimRepeat,
    config.effAnimInterval,
    config.animationName,
    config.animationDuration,
    config.animationDelay,
    config.animationStay,
    config.animationInterval,
    config.animationRepeat,
    config.animationDirection,
    config.backgroundColor,
    config.showBorder,
    uniqueClass,
    elementKey,
    isFullWidget,
    widgetId,
    instanceId,
    instanceName
  ]);

  const renderContent = () => {
    if (widgetId?.startsWith('manual-')) {
      const manualWidget = TWITCH_WIDGETS_CATALOG.find(widget => widget.id === widgetId);
      if (manualWidget) {
        const ManualComponent = manualWidget.component;
        return <ManualComponent config={{ ...manualWidget.defaultConfig, ...config }} elementKey={elementKey} instanceId={instanceId} />;
      }
    }
    // If instance is configured with a structural pre-mold preset
    if (config?.structuralPreset && (isFullWidget || elementKey === 'full_widget') && getTemplateForWidget(widgetId, config.structuralPreset)) {
      const targetCategory = config.widgetCategory || resolveWidgetCategory(widgetId);
      const twitchMeta = streamMeta?.Twitch || {};
      const kickMeta = streamMeta?.Kick || {};

      const twConn = connections?.Twitch || {};
      const kickConn = connections?.Kick || {};
      const ytConn = connections?.YouTube || {};
      const isOnline = twConn.status === 'connected' || kickConn.status === 'connected' || ytConn.status === 'connected';

      // 1. GOALS: Mesma lógica de cálculo da widget original
      let currentCount = 0;
      let targetCount = config.targetValue ? Number(config.targetValue) : 50;

      if (widgetId === 'twitch-bits-goal') {
        const bitEvents = (liveActivity?.items || [])
          .filter(item => item.platform === 'Twitch' && item.eventType === 'twitch_bits');
        const gathered = bitEvents.reduce((acc, curr) => acc + (curr.eventMeta?.amount || 0), 0);
        const start = config.startValue !== undefined && config.startValue !== '' && !isNaN(Number(config.startValue)) ? Number(config.startValue) : 0;
        currentCount = isOnline ? (start + gathered) : 0;
        targetCount = config.targetValue ? Number(config.targetValue) : 2500;
      } else if (widgetId === 'twitch-raid-goal') {
        const raidEvents = (liveActivity?.items || [])
          .filter(item => item.platform === 'Twitch' && item.eventType === 'twitch_raid');
        const start = config.startValue !== undefined && config.startValue !== '' && !isNaN(Number(config.startValue)) ? Number(config.startValue) : 0;
        currentCount = isOnline ? (start + raidEvents.length) : 0;
        targetCount = config.targetValue ? Number(config.targetValue) : 5;
      } else {
        // Meta de subs (twitch-sub-goal, twitch-sub-counter ou meta padrão)
        const subs = (liveActivity?.items || [])
          .filter(item => item.platform === 'Twitch' && (item.eventType === 'twitch_sub' || item.eventType === 'twitch_resub' || item.eventType === 'twitch_subgift'));
        const start = config.startValue !== undefined && config.startValue !== '' && !isNaN(Number(config.startValue)) ? Number(config.startValue) : 0;
        currentCount = isOnline ? (start + subs.length) : 0;
        targetCount = config.targetValue ? Number(config.targetValue) : 50;
      }

      // 2. ALERTS / LABELS: Evento real correspondente à widget
      let userName = '';
      let eventDetail = '';

      if (widgetId === 'twitch-latest-cheer') {
        const latestCheer = (liveActivity?.items || [])
          .find(item => item.platform === 'Twitch' && item.eventType === 'twitch_bits');
        userName = latestCheer ? latestCheer.author : (config.placeholder || (isOnline ? 'Nenhum cheer enviado' : 'Live não conectada'));
        eventDetail = latestCheer && latestCheer.eventMeta?.amount ? `Cheer de ${latestCheer.eventMeta.amount} Bits!` : '';
      } else if (widgetId === 'twitch-latest-raid') {
        const latestRaid = (liveActivity?.items || [])
          .find(item => item.platform === 'Twitch' && item.eventType === 'twitch_raid');
        userName = latestRaid ? latestRaid.author : (config.placeholder || (isOnline ? 'Nenhuma raid recebida' : 'Live não conectada'));
        eventDetail = latestRaid && latestRaid.eventMeta?.viewers ? `Raid com ${latestRaid.eventMeta.viewers} espectadores!` : '';
      } else if (widgetId === 'twitch-latest-sub') {
        const latestSub = (liveActivity?.items || [])
          .find(item => item.platform === 'Twitch' && (item.eventType === 'twitch_sub' || item.eventType === 'twitch_resub' || item.eventType === 'twitch_subgift'));
        userName = latestSub ? (latestSub.author || latestSub.user) : (config.placeholder || (isOnline ? 'Sem novos inscritos' : 'Live não conectada'));
        eventDetail = latestSub && latestSub.eventMeta?.months ? `Inscrito por ${latestSub.eventMeta.months} meses!` : (latestSub ? 'Novo Inscrito' : '');
      } else {
        // Alerta genérico ou último evento detectado
        const lastEv = liveActivity?.lastEvent || (liveActivity?.items || []).find(item => item.eventType);
        userName = lastEv ? (lastEv.author || lastEv.user) : (config.placeholder || (isOnline ? 'Sem novos eventos' : 'Live não conectada'));
        eventDetail = lastEv ? (lastEv.text || lastEv.eventType?.replace('twitch_', '').toUpperCase()) : '';
      }

      // 3. AUDIÊNCIA: Espectadores reais da live
      const twViewers = twConn.viewers !== null && twConn.viewers !== undefined ? twConn.viewers : null;
      const kickViewers = kickConn.viewers !== null && kickConn.viewers !== undefined ? kickConn.viewers : null;
      const ytViewers = ytConn.viewers !== null && ytConn.viewers !== undefined ? ytConn.viewers : null;
      const totalViewers = (twViewers || 0) + (kickViewers || 0) + (ytViewers || 0);
      const viewersStr = !isOnline 
        ? 'Live offline' 
        : (twViewers !== null || kickViewers !== null || ytViewers !== null) 
        ? String(totalViewers) 
        : 'Aguardando dados';

      // 4. METADADOS DA TRANSMISSÃO: Título e Categoria reais
      const strTitle = !isOnline 
        ? 'Live offline' 
        : (twitchMeta.title || kickMeta.title || 'Aguardando título...');
      const strGame = !isOnline 
        ? '' 
        : (twitchMeta.game || kickMeta.game || 'Geral');

      // 5. CHAT: Última mensagem real recebida do chat
      const chatMessages = (liveActivity?.items || [])
        .filter(item => item.platform === 'Twitch' && !item.eventType);
      const latestChat = chatMessages[0] || null;
      const chatAuthor = latestChat ? latestChat.author : '';
      const chatMessage = latestChat 
        ? latestChat.text 
        : (isOnline ? 'Aguardando mensagens do chat...' : 'Live não conectada');

      // 6. TEMPO & UPTIME: Tempo real da live
      const timeString = new Date().toLocaleTimeString('pt-BR', { hour12: false });
      let uptimeString = '';
      const startedAt = twitchMeta.startedAt || kickMeta.startedAt;
      if (startedAt) {
        try {
          const diffMs = Date.now() - new Date(startedAt).getTime();
          if (diffMs > 0) {
            const diffSecs = Math.floor(diffMs / 1000);
            const hrs = Math.floor(diffSecs / 3600);
            const mins = Math.floor((diffSecs % 3600) / 60);
            const secs = diffSecs % 60;
            uptimeString = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          }
        } catch (e) {
          console.error('Error calculating uptime:', e);
        }
      }
      if (!isOnline) {
        uptimeString = 'Live offline';
      } else if (!uptimeString) {
        uptimeString = 'Aguardando dados';
      }

      return (
        <div className="w-full h-full relative overflow-hidden widget-inner-content" style={{ borderRadius: effectiveRadius }}>
          <StructuralWidgetRenderer
            typeId={targetCategory}
            widgetId={widgetId || config.targetWidgetId || config.widgetId}
            presetId={config.structuralPreset}
            isMiniPreview={false}
            config={{
              currentCount,
              targetCount,
              userName,
              eventDetail,
              viewersCount: viewersStr,
              streamTitle: strTitle,
              streamGame: strGame,
              chatAuthor,
              chatMessage,
              timeString,
              uptimeString,
              ...config
            }}
          />
        </div>
      );
    }

    // Check if this instance is the dedicated REACT chat and community videos queue
    const isReactChatInstance = (instanceId && instanceId.includes('react-chat')) || 
                                (instanceName && instanceName.toLowerCase().includes('chat') && instanceName.toLowerCase().includes('react')) ||
                                (widgetId === 'twitch-chat-box' && instanceId && instanceId.includes('react'));

    if (isReactChatInstance) {
      return (
        <div className="w-full h-full relative overflow-hidden widget-inner-content pointer-events-auto" style={{ borderRadius: effectiveRadius }}>
          <ReactChatAndVideoArea config={config} isEditing={isEditing} />
        </div>
      );
    }

    // Find widget in Twitch catalog
    const foundWidget = TWITCH_WIDGETS_CATALOG.find(w => w.id === widgetId);

    // If it's a full widget instance, render the whole widget component!
    if (foundWidget && (isFullWidget || elementKey === 'full_widget')) {
      const WidgetComponent = foundWidget.component;
      return (
        <div className="w-full h-full relative overflow-hidden widget-inner-content" style={{ borderRadius: effectiveRadius }}>
          <WidgetComponent config={{ ...foundWidget.defaultConfig, ...config }} />
        </div>
      );
    }

    if (widgetId === 'youtube-native-poll' && foundWidget) {
      const PollComponent = foundWidget.component;
      return <PollComponent config={{ ...foundWidget.defaultConfig, ...config }} elementKey={elementKey} />;
    }

    // If it's a Twitch sub-component (fragmented elements), render the specific sub-component!
    if (widgetId === 'twitch-status-label') {
      const isOnline = platformIsOnline(connections, config);
      const viewersCount = platformViewers(connections, config, { aggregate: false });
      const streamTitle = platformMeta(streamMeta, connections, config, 'title').title || (isOnline ? 'Aguardando título...' : 'Live offline');
      const streamGame = platformMeta(streamMeta, connections, config, 'game').game || (isOnline ? 'Geral' : '');

      if (elementKey === 'status_badge') {
        return (
          <div className="flex items-center gap-2 p-2 w-full h-full justify-center" style={containerStyle}>
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isOnline ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="uppercase tracking-wider font-bold select-none" style={{ color: config.textColor }}>
              {isOnline ? 'Ao Vivo' : 'Live offline'}
            </span>
          </div>
        );
      }

      if (elementKey === 'viewers_count') {
        return (
          <div className="flex items-center gap-2 p-2 w-full h-full justify-center font-semibold" style={containerStyle}>
            <Users className="h-4 w-4 text-purple-400 shrink-0" />
            <span>
              {!isOnline 
                ? 'Live não conectada' 
                : viewersCount !== null 
                ? `${viewersCount} espectador${viewersCount !== 1 ? 'es' : ''}` 
                : 'Aguardando dados'}
            </span>
          </div>
        );
      }

      if (elementKey === 'stream_title') {
        return (
          <div className="flex items-center p-3 w-full h-full justify-center overflow-hidden min-w-[120px]" style={containerStyle}>
            <TextMarquee text={streamTitle} className="font-bold w-full" style={{ fontFamily: config.fontFamily, color: config.textColor }} />
          </div>
        );
      }

      if (elementKey === 'stream_game') {
        return (
          <div className="flex items-center gap-2 p-2 w-full h-full justify-center font-semibold truncate px-3" style={containerStyle}>
            <Gamepad2 className="h-4 w-4 text-purple-400 shrink-0" />
            <span className="truncate">{streamGame || 'Live offline'}</span>
          </div>
        );
      }
    }

    if (widgetId === 'twitch-sub-goal') {
      const isOnline = connections?.Twitch?.status === 'connected';
      const subs = (liveActivity?.items || [])
        .filter(item => item.platform === 'Twitch' && (item.eventType === 'twitch_sub' || item.eventType === 'twitch_resub' || item.eventType === 'twitch_subgift'));
      const start = config.startValue !== undefined && config.startValue !== '' && !isNaN(Number(config.startValue)) ? Number(config.startValue) : 0;
      const subCount = isOnline ? (start + subs.length) : 0;
      const targetValue = config.targetValue ? Number(config.targetValue) : 50;
      const percentage = targetValue > 0 ? Math.min(Math.round((subCount / targetValue) * 100), 100) : 0;

      if (elementKey === 'goal_title') {
        return (
          <div className="flex items-center gap-2 p-2 w-full h-full justify-center font-bold" style={containerStyle}>
            <Award className="h-4.5 w-4.5 text-purple-400 shrink-0" />
            <span>Meta de Inscritos</span>
          </div>
        );
      }

      if (elementKey === 'goal_progress_bar') {
        return (
          <div className="p-2.5 w-full h-full flex items-center justify-center" style={containerStyle}>
            <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500 relative"
                style={{ width: `${percentage}%` }}
              >
                <span className="absolute inset-0 flex items-center justify-end pr-2 font-bold text-white">
                  {percentage}%
                </span>
              </div>
            </div>
          </div>
        );
      }

    }

    // --- LIBRARY CUSTOM CREATED ELEMENTS ---

    // 1. TEXT
    if (widgetId === 'library-text') {
      let textVal = config.text !== undefined ? config.text : 'Insira seu texto';
      if (!isEditing && config.dataBinding && config.dataBinding !== 'none') {
        textVal = resolveDataBinding(config.dataBinding, textVal, { connections, streamMeta, liveActivity }, config);
      }
      if (isEditing) {
        return (
          <div className="w-full h-full p-2" style={containerStyle}>
            <div className="w-full h-full relative overflow-hidden widget-inner-content" style={{ borderRadius: config.borderRadius || '12px' }}>
              <textarea
                autoFocus
                value={textVal}
                onChange={(e) => onUpdateConfig({ ...config, text: e.target.value })}
                onBlur={onFinishEditing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onFinishEditing();
                  }
                }}
                className="w-full h-full bg-transparent border-0 outline-none resize-none overflow-hidden p-0 m-0 focus:ring-0 focus:outline-none"
                style={{
                  color: config.textColor || '#ffffff',
                  fontSize: config.fontSize || '16px',
                  fontFamily: config.fontFamily || 'Inter, sans-serif',
                  fontWeight: config.fontWeight || 'normal',
                  textAlign: config.textAlign || 'left',
                }}
              />
            </div>
          </div>
        );
      }

      const textType = config.textType || 'text';
      let classes = "w-full h-full p-2.5 flex items-center";
      if (config.textAlign === 'center') classes += " justify-center text-center";
      else if (config.textAlign === 'right') classes += " justify-end text-right";
      else classes += " justify-start text-left";

      const textStyle = {
        color: config.textColor || '#ffffff',
        fontSize: config.fontSize || (textType === 'title' ? '32px' : textType === 'subtitle' ? '20px' : '14px'),
        fontFamily: config.fontFamily || 'Inter, sans-serif',
        fontWeight: config.fontWeight || (textType === 'title' ? 'bold' : textType === 'subtitle' ? 'semibold' : 'normal'),
        textTransform: textType === 'label' ? 'uppercase' : 'none',
        letterSpacing: textType === 'label' ? '0.05em' : 'normal',
      };

      return (
        <div className={classes} style={containerStyle}>
          <div className="w-full h-full relative overflow-hidden widget-inner-content flex items-center justify-inherit" style={{ borderRadius: config.borderRadius || '6px', justifyContent: 'inherit' }}>
            <span style={textStyle} className="whitespace-pre-wrap break-words select-none w-full">
              {textVal}
            </span>
          </div>
        </div>
      );
    }

    // 2. SHAPE
    if (widgetId === 'library-shape') {
      const shapeType = config.shapeType || 'rectangle';
      const fillColor = config.textColor || '#8b5cf6';

      if (config.bgImage || config.backgroundImage) {
        return <div className="h-full w-full" style={containerStyle}>
          <img src={config.bgImage || config.backgroundImage} alt="" className="widget-inner-content h-full w-full object-contain" draggable={false} />
        </div>;
      }

      // Special handling for REACT Subscenario:
      // A. Main Video Player Area (1400x788): real playback for user-submitted videos
      const isReactVideo = (instanceId && instanceId.includes('react-video')) || 
                           (instanceName && instanceName.toLowerCase().includes('área do vídeo (react)')) ||
                           (config.isReactVideoArea === true);
      
      if (isReactVideo) {
        return (
          <div className="w-full h-full pointer-events-auto">
            <ReactVideoPlayer config={config} isEditing={isEditing} />
          </div>
        );
      }

      // B. Streamer Webcam Frame: must remain 100% transparent inside, using only the moldura/border to delimit the camera
      const isReactWebcam = (instanceId && instanceId.includes('react-cam')) || 
                            (instanceName && instanceName.toLowerCase().includes('câmera do streamer')) ||
                            (config.isWebcamFrame === true);
      
      if (isReactWebcam) {
        const radius = effectiveRadius;
        const borderThickness = config.effBorderThickness !== undefined ? config.effBorderThickness : (parseInt(config.borderWidth) || 0);
        const hasBorder = config.showBorder === true && borderThickness > 0;

        return (
          <div 
            className="w-full h-full relative overflow-hidden flex items-center justify-center p-0"
            style={{
              borderRadius: radius,
              backgroundColor: 'transparent',
              boxShadow: hasBorder ? 'inset 0 0 15px rgba(168, 85, 247, 0.05)' : 'none'
            }}
          >
            {isEditing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 text-purple-400/50 font-mono text-[10px] pointer-events-none select-none">
                <Camera className="w-6 h-6 mb-1 opacity-50 text-purple-400" />
                <span className="font-bold tracking-wider">MOLDURA DA WEBCAM</span>
                <span className="text-[9px] opacity-40">(Fundo 100% transparente)</span>
              </div>
            )}
          </div>
        );
      }

      // For rectangles and rounded rectangles, render HTML div with real 100% dimensions and clean CSS border-radius
      if (shapeType === 'rounded-rectangle' || shapeType === 'rectangle' || shapeType === 'square') {
        const radius = shapeType === 'rounded-rectangle'
          ? effectiveRadius
          : '0px';

        return (
          <div className="w-full h-full flex items-center justify-center p-0" style={containerStyle}>
            <div 
              className="w-full h-full relative overflow-hidden widget-inner-content" 
              style={{ 
                borderRadius: radius,
                backgroundColor: fillColor 
              }} 
            />
          </div>
        );
      }

      const renderSvgShape = () => {
        switch (shapeType) {
          case 'circle':
            return <circle cx="50%" cy="50%" r="48%" fill={fillColor} />;
          case 'ellipse':
            return <ellipse cx="50%" cy="50%" rx="48%" ry="40%" fill={fillColor} />;
          case 'triangle':
            return <polygon points="50,4 96,94 4,94" fill={fillColor} />;
          case 'rhombus':
            return <polygon points="50,4 96,50 50,96 4,50" fill={fillColor} />;
          case 'pentagon':
            return <polygon points="50,4 96,38 78,94 22,94 4,38" fill={fillColor} />;
          case 'hexagon':
            return <polygon points="50,4 96,27 96,73 50,96 4,73 4,27" fill={fillColor} />;
          case 'star':
            return <polygon points="50,4 63,38 98,38 70,59 81,94 50,73 19,94 30,59 2,38 37,38" fill={fillColor} />;
          case 'heart':
            return <path d="M12,21.35L10.55,20.03C5.4,15.36,2,12.28,2,8.5C2,5.42,4.42,3,7.5,3C9.24,3,10.91,3.81,12,5.09C13.09,3.81,14.76,3,16.5,3C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z" fill={fillColor} />;
          default:
            return <rect x="0" y="0" width="100%" height="100%" fill={fillColor} />;
        }
      };

      return (
        <div className="w-full h-full flex items-center justify-center p-0" style={containerStyle}>
          <div className="w-full h-full relative overflow-hidden widget-inner-content flex items-center justify-center" style={{ borderRadius: config.borderRadius || '6px' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
              {renderSvgShape()}
            </svg>
          </div>
        </div>
      );
    }

    // 3. LINE & ARROW
    if (widgetId === 'library-line') {
      const thickness = parseInt(config.lineThickness) || 3;
      const color = config.textColor || '#ffffff';
      const style = config.lineStyle || 'solid';
      const arrowStart = config.arrowStart || false;
      const arrowEnd = config.arrowEnd || false;
      const isDivisor = config.lineType === 'divisor';

      if (isDivisor) {
        return (
          <div className="w-full h-full flex items-center justify-center px-4" style={containerStyle}>
            <div className="w-full h-full relative overflow-hidden widget-inner-content flex items-center justify-center" style={{ borderRadius: config.borderRadius || '6px' }}>
              <div className="w-full border-t border-dashed" style={{ borderColor: color, borderWidth: `${thickness}px`, opacity: 0.6 }} />
            </div>
          </div>
        );
      }

      return (
        <div className="w-full h-full flex items-center justify-center px-4" style={containerStyle}>
          <div className="w-full h-full relative overflow-hidden widget-inner-content flex items-center justify-center" style={{ borderRadius: config.borderRadius || '6px' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none" className="overflow-visible">
              <defs>
                <marker id="arrow-end-marker" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                </marker>
                <marker id="arrow-start-marker" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 10 0 L 0 5 L 10 10 z" fill={color} />
                </marker>
              </defs>
              <line
                x1={arrowStart ? "12" : "2"}
                y1="10"
                x2={arrowEnd ? "88" : "98"}
                y2="10"
                stroke={color}
                strokeWidth={thickness}
                strokeDasharray={
                  style === 'dashed' ? '6 4' :
                  style === 'dotted' ? '2 2' : 'none'
                }
                markerStart={arrowStart ? "url(#arrow-start-marker)" : undefined}
                markerEnd={arrowEnd ? "url(#arrow-end-marker)" : undefined}
              />
            </svg>
          </div>
        </div>
      );
    }

    // 4. ICON
    if (widgetId === 'library-icon') {
      const IconComponent = LUCIDE_ICONS_MAP[config.iconType || 'heart'] || Heart;
      return (
        <div className="w-full h-full flex items-center justify-center p-2" style={containerStyle}>
          <div className="w-full h-full relative overflow-hidden widget-inner-content flex items-center justify-center" style={{ borderRadius: config.borderRadius || '6px' }}>
            <IconComponent 
              size={parseInt(config.fontSize) || 32} 
              style={{ color: config.textColor || '#ffffff' }} 
            />
          </div>
        </div>
      );
    }

    // 5. SOCIAL NETWORKS
    if (widgetId === 'library-social') {
      const platform = config.socialType || 'twitch';
      const displayMode = config.displayMode || 'both';
      let handleText = config.text !== undefined ? config.text : '@streamer';
      if (!isEditing && config.dataBinding && config.dataBinding !== 'none') {
        handleText = resolveDataBinding(config.dataBinding, handleText, { connections, streamMeta, liveActivity }, config);
      }
      const iconColor = config.iconColor || config.textColor || '#ffffff';
      const textCol = config.textColor || '#ffffff';
      const fSize = config.fontSize || '14px';
      const fFamily = config.fontFamily || 'Inter, sans-serif';

      const SocialIcon = SOCIAL_ICONS[platform] || SOCIAL_ICONS.twitch;

      if (isEditing && displayMode !== 'icon') {
        return (
          <div className="w-full h-full flex items-center gap-2 p-2" style={containerStyle}>
            <div className="w-full h-full relative overflow-hidden widget-inner-content flex items-center gap-2" style={{ borderRadius: config.borderRadius || '6px' }}>
              {displayMode !== 'text' && (
                <span style={{ color: iconColor, width: fSize, height: fSize }} className="shrink-0">
                  <SocialIcon style={{ width: '100%', height: '100%' }} />
                </span>
              )}
              <input
                autoFocus
                type="text"
                value={handleText}
                onChange={(e) => onUpdateConfig({ ...config, text: e.target.value })}
                onBlur={onFinishEditing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onFinishEditing();
                  }
                }}
                className="bg-transparent border-0 outline-none p-0 m-0 focus:ring-0 focus:outline-none w-full"
                style={{
                  color: textCol,
                  fontSize: fSize,
                  fontFamily: fFamily,
                  fontWeight: 'bold',
                }}
              />
            </div>
          </div>
        );
      }

      return (
        <div className="w-full h-full flex items-center gap-2 px-3 py-1.5 justify-center" style={containerStyle}>
          <div className="w-full h-full relative overflow-hidden widget-inner-content flex items-center gap-2 justify-center" style={{ borderRadius: config.borderRadius || '6px' }}>
            {displayMode !== 'text' && (
              <span style={{ color: iconColor, width: fSize, height: fSize }} className="shrink-0 flex items-center justify-center">
                <SocialIcon style={{ width: '100%', height: '100%' }} />
              </span>
            )}
            {displayMode !== 'icon' && (
              <span
                style={{
                  color: textCol,
                  fontSize: fSize,
                  fontFamily: fFamily,
                  fontWeight: 'bold',
                }}
                className="truncate select-none"
              >
                {handleText}
              </span>
            )}
          </div>
        </div>
      );
    }

    // 6. WEBCAM / CÂMERA
    if (widgetId === 'library-webcam') {
      return (
        <div className="w-full h-full pointer-events-auto">
          <WebcamSourceRenderer config={config} isEditing={isEditing} />
        </div>
      );
    }

    // 7. BROWSER SOURCE
    if (widgetId === 'library-browser') {
      return (
        <div className="w-full h-full pointer-events-auto">
          <BrowserSourceRenderer config={config} isEditing={isEditing} />
        </div>
      );
    }

    // 8. RECEPTOR DE REACT (PLAYER INDEPENDENTE)
    if (widgetId === 'library-react-player' || widgetId === 'react-video-player') {
      return (
        <div className="w-full h-full pointer-events-auto">
          <ReactVideoPlayer config={config} isEditing={isEditing} />
        </div>
      );
    }

    // Fallback default placeholder
    return (
      <div className="w-full h-full p-2.5 flex items-center justify-center" style={containerStyle}>
        <div className="w-full h-full relative overflow-hidden widget-inner-content flex items-center justify-center" style={{ borderRadius: config.borderRadius || '6px' }}>
          <TextMarquee text={config.text || 'Elemento de Overlay'} style={baseStyle} />
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`w-full h-full ${uniqueClass}`}
      style={{
        '--glow-color': config.effShadowColor || '#a855f7'
      }}
    >
      {styleBlock}
      {renderContent()}
    </div>
  );
}
