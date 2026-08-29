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
const DAMPING = 0.3;
const MAX_STEP_PER_FRAME = 0.04;
const EPSILON = 0.0015;

interface UsePageScaleOptions {
  frameWidthPx: number;
  isVisible: boolean;
}

interface ZoomAnchor {
  docX: number;
  docY: number;
  viewX: number;
  viewY: number;
}

export function usePageScale({ frameWidthPx, isVisible }: UsePageScaleOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<ZoomAnchor | null>(null);
  const rafRef = useRef<number | null>(null);
  const initialScale = useUIStore.getState().scale ?? 1;
  const manualRef = useRef(useUIStore.getState().scale !== null);
  const targetRef = useRef(initialScale);
  const dispRef = useRef(initialScale);
  const reducedMotionRef = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const storedScale = useUIStore((state) => state.scale);
  const setScale = useUIStore((state) => state.setScale);

  const [displayed, setDisplayed] = useState(initialScale);
  const [contentHeight, setContentHeight] = useState(0);

  const applyAnchor = useCallback((disp: number) => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const panel = panelRef.current;
    if (!panel) return;
    const viewport = panel.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;
    viewport.scrollLeft = anchor.docX * disp - anchor.viewX;
    viewport.scrollTop = anchor.docY * disp - anchor.viewY;
  }, []);

  const animateRef = useRef<() => void>(() => {});

  const animate = useCallback(() => {
    rafRef.current = null;
    const target = targetRef.current;
    const current = dispRef.current;
    let next: number;
    if (reducedMotionRef.current || Math.abs(target - current) < EPSILON) {
      next = target;
    } else {
      const delta = (target - current) * DAMPING;
      const step =
        Math.sign(delta) * Math.min(Math.abs(delta), MAX_STEP_PER_FRAME);
      next = current + step;
      if (Math.abs(target - next) < EPSILON) next = target;
    }
    applyAnchor(next);
    dispRef.current = next;
    setDisplayed(next);
    if (next !== target) {
      rafRef.current = requestAnimationFrame(() => animateRef.current());
    }
  }, [applyAnchor]);

  useEffect(() => {
    animateRef.current = animate;
  });

  const requestAnimate = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const fitToWidth = useCallback(() => {
    if (manualRef.current) return;
    const panel = panelRef.current;
    if (!panel) return;
    const available = panel.clientWidth;
    if (available > 0) {
      anchorRef.current = null;
      targetRef.current = Math.min(1, available / frameWidthPx);
      requestAnimate();
    }
  }, [frameWidthPx, requestAnimate]);

  useLayoutEffect(() => {
    if (!isVisible) return;
    fitToWidth();
    window.addEventListener('resize', fitToWidth);
    return () => window.removeEventListener('resize', fitToWidth);
  }, [isVisible, frameWidthPx, fitToWidth]);

  useEffect(() => {
    if (storedScale === null) {
      manualRef.current = false;
      fitToWidth();
    } else {
      manualRef.current = true;
      targetRef.current = storedScale;
      requestAnimate();
    }
  }, [storedScale, fitToWidth, requestAnimate]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setContentHeight(frame.scrollHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(frame);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  const zoomTo = useCallback(
    (next: number, immediate = false) => {
      manualRef.current = true;
      targetRef.current = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, +(+next).toFixed(2)),
      );
      if (immediate) {
        applyAnchor(targetRef.current);
        dispRef.current = targetRef.current;
        setDisplayed(targetRef.current);
        return;
      }
      requestAnimate();
    },
    [applyAnchor, requestAnimate],
  );

  const zoomIn = useCallback(() => {
    manualRef.current = true;
    targetRef.current = Math.min(
      MAX_SCALE,
      +(targetRef.current + 0.1).toFixed(2),
    );
    requestAnimate();
  }, [requestAnimate]);

  const zoomOut = useCallback(() => {
    manualRef.current = true;
    targetRef.current = Math.max(
      MIN_SCALE,
      +(targetRef.current - 0.1).toFixed(2),
    );
    requestAnimate();
  }, [requestAnimate]);

  const zoomReset = useCallback(() => {
    manualRef.current = false;
    anchorRef.current = null;
    const panel = panelRef.current;
    const available = panel ? panel.clientWidth : 0;
    targetRef.current =
      available > 0 ? Math.min(1, available / frameWidthPx) : 1;
    requestAnimate();
    setScale(null);
  }, [frameWidthPx, requestAnimate, setScale]);

  const commitScale = useCallback(() => {
    if (!manualRef.current) return;
    setScale(+targetRef.current.toFixed(2));
  }, [setScale]);

  const setAnchor = useCallback((anchor: ZoomAnchor) => {
    anchorRef.current = anchor;
  }, []);

  return {
    panelRef,
    frameRef,
    scale: displayed,
    contentHeight,
    zoomTo,
    zoomIn,
    zoomOut,
    zoomReset,
    setAnchor,
    commitScale,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  };
}
