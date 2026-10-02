import { useRef, useEffect, useCallback } from 'react';

/**
 * useAutoScroll — Hook padronizado de auto-scroll por proximidade do mouse do LiveNexus.
 *
 * Suporta:
 * - Rolagem vertical automática (mouse para baixo rola para baixo, mouse para cima rola para cima)
 * - Rolagem horizontal automática (mouse para direita rola para direita, mouse para esquerda rola para esquerda)
 * - Velocidade multiplicada em 1.5x por padrão
 * - Ocultação completa de barras de rolagem (sem barra de rolagem visual)
 * - Interrupção suave ao afastar o mouse ou atingir as bordas
 *
 * @param {Object} options
 * @param {number} [options.zone=80] - Zona de proximidade em pixels.
 * @param {number} [options.minSpeed=1.5] - Velocidade mínima.
 * @param {number} [options.maxSpeed=6.75] - Velocidade máxima (1.5x calibrado).
 * @param {number} [options.speedMultiplier=1.5] - Multiplicador de velocidade (padrão 1.5x).
 * @param {boolean} [options.ignoreInputs=true] - Ignora auto-scroll em inputs.
 * @param {boolean} [options.checkButtons=true] - Interrompe se o mouse estiver clicando/arrastando.
 * @param {boolean} [options.enabled=true] - Habilitado/desabilitado.
 * @param {React.RefObject} [options.externalRef] - Ref externa opcional.
 */
export function useAutoScroll(options = {}) {
  const {
    zone = 80,
    minSpeed = 1.5,
    maxSpeed = 6.75,
    speedMultiplier = 1.5,
    ignoreInputs = true,
    checkButtons = true,
    enabled = true,
    externalRef = null,
  } = options;

  const localRef = useRef(null);
  const containerRef = externalRef || localRef;
  const scrollSpeedYRef = useRef(0);
  const scrollSpeedXRef = useRef(0);
  const animFrameRef = useRef(null);

  const stopAutoScroll = useCallback(() => {
    scrollSpeedYRef.current = 0;
    scrollSpeedXRef.current = 0;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const startAutoScrollLoop = useCallback(() => {
    if (animFrameRef.current !== null) return;

    const loop = () => {
      const el = containerRef.current;
      if (!el) {
        animFrameRef.current = null;
        return;
      }

      let active = false;

      // Rolagem vertical
      if (scrollSpeedYRef.current !== 0) {
        if (scrollSpeedYRef.current < 0 && el.scrollTop <= 0) {
          scrollSpeedYRef.current = 0;
        } else if (scrollSpeedYRef.current > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
          scrollSpeedYRef.current = 0;
        } else {
          el.scrollTop += scrollSpeedYRef.current * speedMultiplier;
          active = true;
        }
      }

      // Rolagem horizontal (lateral)
      if (scrollSpeedXRef.current !== 0) {
        if (scrollSpeedXRef.current < 0 && el.scrollLeft <= 0) {
          scrollSpeedXRef.current = 0;
        } else if (scrollSpeedXRef.current > 0 && el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
          scrollSpeedXRef.current = 0;
        } else {
          el.scrollLeft += scrollSpeedXRef.current * speedMultiplier;
          active = true;
        }
      }

      if (active) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [containerRef, speedMultiplier]);

  const handleMouseMove = useCallback((e) => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    if (checkButtons && e.buttons !== 0) {
      stopAutoScroll();
      return;
    }

    if (ignoreInputs) {
      const target = e.target;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest?.('input, select, textarea, [data-no-auto-scroll]'))
      ) {
        stopAutoScroll();
        return;
      }
    }

    const rect = el.getBoundingClientRect();
    const mouseY = e.clientY;
    const mouseX = e.clientX;

    if (
      mouseY < rect.top ||
      mouseY > rect.bottom ||
      mouseX < rect.left ||
      mouseX > rect.right
    ) {
      stopAutoScroll();
      return;
    }

    // Calcular zona vertical
    const hasVerticalOverflow = el.scrollHeight > el.clientHeight + 4;
    const effectiveZoneY = Math.min(zone, Math.floor(rect.height / 3));

    if (hasVerticalOverflow && effectiveZoneY > 0) {
      const distFromTop = mouseY - rect.top;
      const distFromBottom = rect.bottom - mouseY;

      if (distFromTop < effectiveZoneY && distFromTop >= 0) {
        const factor = Math.max(0, Math.min(1, (effectiveZoneY - distFromTop) / effectiveZoneY));
        scrollSpeedYRef.current = -(minSpeed + factor * (maxSpeed - minSpeed));
      } else if (distFromBottom < effectiveZoneY && distFromBottom >= 0) {
        const factor = Math.max(0, Math.min(1, (effectiveZoneY - distFromBottom) / effectiveZoneY));
        scrollSpeedYRef.current = (minSpeed + factor * (maxSpeed - minSpeed));
      } else {
        scrollSpeedYRef.current = 0;
      }
    } else {
      scrollSpeedYRef.current = 0;
    }

    // Calcular zona horizontal (lateral)
    const hasHorizontalOverflow = el.scrollWidth > el.clientWidth + 4;
    const effectiveZoneX = Math.min(zone, Math.floor(rect.width / 4));

    if (hasHorizontalOverflow && effectiveZoneX > 0) {
      const distFromLeft = mouseX - rect.left;
      const distFromRight = rect.right - mouseX;

      if (distFromLeft < effectiveZoneX && distFromLeft >= 0) {
        const factor = Math.max(0, Math.min(1, (effectiveZoneX - distFromLeft) / effectiveZoneX));
        scrollSpeedXRef.current = -(minSpeed + factor * (maxSpeed - minSpeed));
      } else if (distFromRight < effectiveZoneX && distFromRight >= 0) {
        const factor = Math.max(0, Math.min(1, (effectiveZoneX - distFromRight) / effectiveZoneX));
        scrollSpeedXRef.current = (minSpeed + factor * (maxSpeed - minSpeed));
      } else {
        scrollSpeedXRef.current = 0;
      }
    } else {
      scrollSpeedXRef.current = 0;
    }

    if (scrollSpeedYRef.current !== 0 || scrollSpeedXRef.current !== 0) {
      startAutoScrollLoop();
    } else {
      stopAutoScroll();
    }
  }, [enabled, zone, minSpeed, maxSpeed, ignoreInputs, checkButtons, containerRef, startAutoScrollLoop, stopAutoScroll]);

  const handleMouseLeave = useCallback(() => {
    stopAutoScroll();
  }, [stopAutoScroll]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    // Oculta completamente barra de rolagem
    el.style.scrollbarWidth = 'none';
    el.style.msOverflowStyle = 'none';
    if (!el.classList.contains('no-scrollbar')) {
      el.classList.add('no-scrollbar');
    }

    const onMove = (e) => handleMouseMove(e);
    const onLeave = () => handleMouseLeave();

    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave, { passive: true });

    return () => {
      stopAutoScroll();
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [containerRef, enabled, handleMouseMove, handleMouseLeave, stopAutoScroll]);

  return {
    ref: containerRef,
    handleMouseMove,
    handleMouseLeave,
    stopAutoScroll,
  };
}

export function AutoScrollContainer({
  children,
  className = '',
  zone = 80,
  speedMultiplier = 1.5,
  as: Component = 'div',
  ...props
}) {
  const { ref } = useAutoScroll({
    zone,
    speedMultiplier,
  });

  return (
    <Component
      ref={ref}
      className={`no-scrollbar overflow-auto overscroll-contain ${className}`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      {...props}
    >
      {children}
    </Component>
  );
}

export default useAutoScroll;
