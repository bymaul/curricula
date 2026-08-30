'use client';

import { useCallback, useEffect, useRef } from 'react';

interface MobileSliderOptions {
  enabled: boolean;
  view: 'edit' | 'preview';
}

export function useMobileSlider({ enabled, view }: MobileSliderOptions) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const apply = useCallback((px: number, animate = false) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.style.transitionDuration = animate ? '260ms' : '0ms';
    strip.style.transitionTimingFunction = animate
      ? 'cubic-bezier(0.22, 1, 0.36, 1)'
      : 'auto';
    strip.style.transform = `translate3d(${px}px, 0, 0)`;
  }, []);

  const baseOffset = useCallback(() => {
    const width = trackRef.current?.offsetWidth ?? 0;
    return view === 'preview' ? -width : 0;
  }, [view]);

  useEffect(() => {
    apply(enabled ? baseOffset() : 0, enabled);
  }, [enabled, view, apply, baseOffset]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(() => {
      apply(enabled ? baseOffset() : 0);
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, [enabled, apply, baseOffset]);

  return { trackRef, stripRef };
}
