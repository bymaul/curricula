'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const MIN_SCALE = 0.3;
const MAX_SCALE = 1.5;

interface UsePageScaleOptions {
  frameWidthPx: number;
  isVisible: boolean;
}

export function usePageScale({ frameWidthPx, isVisible }: UsePageScaleOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [frameHeight, setFrameHeight] = useState<number>();

  const fitToWidth = () => {
    const panel = panelRef.current;
    if (!panel) return;
    const available = panel.clientWidth;
    if (available > 0) setScale(Math.min(1, available / frameWidthPx));
  };

  useLayoutEffect(() => {
    if (!isVisible) return;
    fitToWidth();
    window.addEventListener('resize', fitToWidth);
    return () => window.removeEventListener('resize', fitToWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, frameWidthPx]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setFrameHeight(frame.scrollHeight * scale);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(frame);
    return () => ro.disconnect();
  }, [scale]);

  return {
    panelRef,
    frameRef,
    scale,
    frameHeight,
    zoomTo: (next: number) =>
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, +next.toFixed(2)))),
    zoomIn: () => setScale((s) => Math.min(MAX_SCALE, +(s + 0.1).toFixed(2))),
    zoomOut: () => setScale((s) => Math.max(MIN_SCALE, +(s - 0.1).toFixed(2))),
    zoomReset: fitToWidth,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  };
}
