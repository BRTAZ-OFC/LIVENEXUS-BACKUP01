import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function HorizontalScrollContainer({
  children,
  className = '',
  contentClassName = '',
  scrollAmount = 180,
  buttonClassName = ''
}) {
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(maxScroll - scrollLeft > 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  useEffect(() => {
    updateScrollState();
    const t = setTimeout(updateScrollState, 60);
    return () => clearTimeout(t);
  }, [children, updateScrollState]);

  const scrollByAmount = (direction) => {
    const el = containerRef.current;
    if (!el) return;
    const amount = scrollAmount || Math.max(120, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
    setTimeout(updateScrollState, 200);
    setTimeout(updateScrollState, 450);
  };

  return (
    <div className={`flex items-center w-full ${className}`}>
      {/* Left Arrow Button (‹) */}
      <button
        type="button"
        onClick={() => scrollByAmount(-1)}
        className={`flex items-center justify-center h-6 w-6 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95 text-[14px] font-medium leading-none select-none cursor-pointer shrink-0 ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${buttonClassName}`}
        style={{ marginRight: '2px' }}
        title="Voltar"
      >
        ‹
      </button>

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className={`flex-1 flex items-center overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap ${contentClassName}`}
      >
        {children}
      </div>

      {/* Right Arrow Button (›) */}
      <button
        type="button"
        onClick={() => scrollByAmount(1)}
        className={`flex items-center justify-center h-6 w-6 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95 text-[14px] font-medium leading-none select-none cursor-pointer shrink-0 ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${buttonClassName}`}
        style={{ marginLeft: '2px' }}
        title="Avançar"
      >
        ›
      </button>
    </div>
  );
}

