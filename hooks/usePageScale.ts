'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useUIStore } from '@/store/useUIStore';

const MIN_SCALE = 0.3;
const MAX_SCALE = 1.5;

interface UsePageScaleOptions {
  frameWidthPx: number;
  isVisible: boolean;
}

export function usePageScale({ frameWidthPx, isVisible }: UsePageScaleOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const scale = useUIStore((state) => state.scale);
  const setScale = useUIStore((state) => state.setScale);
  const [frameHeight, setFrameHeight] = useState<number>();
  const activeScale = scale ?? 1;

  // Auto-fit only runs while the user has not chosen a manual zoom level
  // (scale === null); a browser resize must never override a manual zoom.
  const fitToWidth = useCallback(() => {
    if (useUIStore.getState().scale !== null) return;
    const panel = panelRef.current;
    if (!panel) return;
    const available = panel.clientWidth;
    if (available > 0) setScale(Math.min(1, available / frameWidthPx));
  }, [frameWidthPx, setScale]);

  useLayoutEffect(() => {
    if (!isVisible) return;
    fitToWidth();
    window.addEventListener('resize', fitToWidth);
    return () => window.removeEventListener('resize', fitToWidth);
  }, [isVisible, frameWidthPx, fitToWidth]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setFrameHeight(frame.scrollHeight * activeScale);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(frame);
    return () => ro.disconnect();
  }, [activeScale]);

  return {
    panelRef,
    frameRef,
    scale: activeScale,
    frameHeight,
    zoomTo: (next: number) =>
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, +next.toFixed(2)))),
    zoomIn: () => {
      const current = useUIStore.getState().scale ?? 1;
      setScale(Math.min(MAX_SCALE, +(current + 0.1).toFixed(2)));
    },
    zoomOut: () => {
      const current = useUIStore.getState().scale ?? 1;
      setScale(Math.max(MIN_SCALE, +(current - 0.1).toFixed(2)));
    },
    zoomReset: () => {
      setScale(null);
      requestAnimationFrame(fitToWidth);
    },
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  };
}
