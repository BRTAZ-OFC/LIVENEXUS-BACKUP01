import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function VerticalScrollContainer({
  children,
  className = '',
  boxClassName = '',
  contentClassName = '',
  scrollAmount = 80
}) {
  const containerRef = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    setCanScrollUp(scrollTop > 2);
    setCanScrollDown(maxScroll - scrollTop > 2);
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

  const scrollByAmount = (direction) => {
    const el = containerRef.current;
    if (!el) return;
    const amount = scrollAmount || Math.max(60, Math.floor(el.clientHeight * 0.7));
    el.scrollBy({ top: direction * amount, behavior: 'smooth' });
    setTimeout(updateScrollState, 250);
  };

  const hasButtons = canScrollUp || canScrollDown;

  return (
    <div className={`relative flex items-center w-full gap-1.5 ${className}`}>
      {/* The Scrollable Inner Box */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth ${boxClassName}`}
      >
        <div className={contentClassName}>{children}</div>
      </div>

      {/* Lateral / Side Buttons Column OUTSIDE the box */}
      {hasButtons && (
        <div className="flex flex-col justify-between items-center gap-1 shrink-0 self-stretch py-0.5 min-h-[50px]">
          {canScrollUp ? (
            <button
              type="button"
              onClick={() => scrollByAmount(-1)}
              className="h-6 w-6 flex items-center justify-center rounded bg-purple-900/90 hover:bg-purple-600 border border-purple-500/60 text-white shadow-md transition-all active:scale-95 text-[10px] font-bold leading-none select-none cursor-pointer shrink-0"
              title="▲ Subir"
            >
              ▲
            </button>
          ) : (
            <div className="h-6 w-6 shrink-0" />
          )}

          {canScrollDown ? (
            <button
              type="button"
              onClick={() => scrollByAmount(1)}
              className="h-6 w-6 flex items-center justify-center rounded bg-purple-900/90 hover:bg-purple-600 border border-purple-500/60 text-white shadow-md transition-all active:scale-95 text-[10px] font-bold leading-none select-none cursor-pointer shrink-0"
              title="▼ Descer"
            >
              ▼
            </button>
          ) : (
            <div className="h-6 w-6 shrink-0" />
          )}
        </div>
      )}
    </div>
  );
}

