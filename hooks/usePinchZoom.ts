'use client';

import { useEffect, useRef } from 'react';
import { clampScale } from '@/lib/utils';

const WHEEL_GAIN = 0.002;
const WHEEL_IDLE_MS = 150;

interface UsePinchZoomOptions {
  scale: number;
  minScale: number;
  maxScale: number;
  onZoomChange: (
    scale: number,
    anchorClientX?: number,
    anchorClientY?: number,
    immediate?: boolean,
  ) => void;
  onGestureEnd?: () => void;
}

export function usePinchZoom<T extends HTMLElement>({
  scale,
  minScale,
  maxScale,
  onZoomChange,
  onGestureEnd,
}: UsePinchZoomOptions) {
  const containerRef = useRef<T>(null);
  const startRef = useRef<{ distance: number; scale: number } | null>(null);
  const gestureScaleRef = useRef(scale);
  const lastDistanceRef = useRef(0);
  const idleRef = useRef<number | null>(null);
  const optionsRef = useRef({ minScale, maxScale, onZoomChange, onGestureEnd });

  useEffect(() => {
    optionsRef.current = { minScale, maxScale, onZoomChange, onGestureEnd };
  });

  useEffect(() => {
    gestureScaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const distance = (touches: TouchList) => {
      const [a, b] = [touches[0], touches[1]];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };

    const clamp = (value: number) => {
      const { minScale, maxScale } = optionsRef.current;
      return clampScale(value, minScale, maxScale);
    };

    const endGesture = () => {
      if (idleRef.current !== null) {
        window.clearTimeout(idleRef.current);
        idleRef.current = null;
      }
      optionsRef.current.onGestureEnd?.();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (idleRef.current !== null) {
        window.clearTimeout(idleRef.current);
        idleRef.current = null;
      }
      if (e.touches.length === 2) {
        const d = distance(e.touches);
        startRef.current = {
          distance: d,
          scale: gestureScaleRef.current,
        };
        lastDistanceRef.current = d;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startRef.current) {
        e.preventDefault();
        const d = distance(e.touches);
        const ratio =
          lastDistanceRef.current > 0 ? d / lastDistanceRef.current : 1;
        lastDistanceRef.current = d;
        const next = clamp(gestureScaleRef.current * ratio);
        gestureScaleRef.current = next;
        const [a, b] = [e.touches[0], e.touches[1]];
        optionsRef.current.onZoomChange(
          +clamp(next).toFixed(2),
          (a.clientX + b.clientX) / 2,
          (a.clientY + b.clientY) / 2,
          true,
        );
      }
    };

    const handleTouchEnd = () => {
      startRef.current = null;
      lastDistanceRef.current = 0;
      endGesture();
    };

    const handleWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * WHEEL_GAIN);
      optionsRef.current.onZoomChange(
        +clamp(gestureScaleRef.current * factor).toFixed(2),
        e.clientX,
        e.clientY,
      );
      if (idleRef.current !== null) window.clearTimeout(idleRef.current);
      idleRef.current = window.setTimeout(() => {
        idleRef.current = null;
        optionsRef.current.onGestureEnd?.();
      }, WHEEL_IDLE_MS);
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);
    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      if (idleRef.current !== null) window.clearTimeout(idleRef.current);
      idleRef.current = null;
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return { containerRef };
}
