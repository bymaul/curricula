'use client';

import { useCallback, useEffect, useRef } from 'react';

const ENGAGE_DELTA_PX = 12;
const COMMIT_FRACTION = 0.25;
const FLICK_DISTANCE_PX = 48;
const FLICK_DURATION_MS = 220;
const RUBBER_BAND = 0.3;

function isSwipeBlocked(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return true;
  if (
    target.closest(
      'a, button, input, textarea, select, label, [role="button"], [role="radio"], [role="tab"], [data-no-swipe]',
    )
  ) {
    return true;
  }
  let node: HTMLElement | null = target;
  while (node && node !== document.body) {
    if (node.scrollWidth > node.clientWidth + 1) {
      const { overflowX } = getComputedStyle(node);
      if (overflowX === 'auto' || overflowX === 'scroll') return true;
    }
    node = node.parentElement;
  }
  return false;
}

interface MobileSliderOptions {
  enabled: boolean;
  view: 'edit' | 'preview';
  onViewChange: (view: 'edit' | 'preview') => void;
  onEngage?: () => void;
  onSettle?: () => void;
}

export function useMobileSlider({
  enabled,
  view,
  onViewChange,
  onEngage,
  onSettle,
}: MobileSliderOptions) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const gesture = useRef({
    started: false,
    engaged: false,
    startX: 0,
    startY: 0,
    startAt: 0,
    base: 0,
    width: 0,
  });

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
    const blockBrowserGesture = (event: TouchEvent) => {
      if (gesture.current.engaged) event.preventDefault();
    };
    window.addEventListener('touchmove', blockBrowserGesture, {
      passive: false,
    });
    return () => window.removeEventListener('touchmove', blockBrowserGesture);
  }, []);

  useEffect(() => {
    apply(enabled ? baseOffset() : 0, enabled);
  }, [enabled, view, apply, baseOffset]);

  const onTouchStart = (event: React.TouchEvent) => {
    const g = gesture.current;
    g.started = false;
    g.engaged = false;
    if (!enabled || event.touches.length !== 1) return;

    const touch = event.touches[0];
    if (isSwipeBlocked(touch.target)) return;

    g.started = true;
    g.startX = touch.clientX;
    g.startY = touch.clientY;
    g.startAt = performance.now();
    g.width = trackRef.current?.offsetWidth || 0;
    g.base = baseOffset();
  };

  const onTouchMove = (event: React.TouchEvent) => {
    const g = gesture.current;
    if (!g.started || event.touches.length !== 1) {
      g.started = false;
      g.engaged = false;
      return;
    }

    const touch = event.touches[0];
    const dx = touch.clientX - g.startX;
    const dy = touch.clientY - g.startY;

    if (!g.engaged) {
      if (Math.abs(dx) < ENGAGE_DELTA_PX || Math.abs(dx) < Math.abs(dy)) {
        return;
      }
      g.engaged = true;
      onEngage?.();
    }

    const min = -g.width;
    let x = g.base + dx;
    if (x > 0) x *= RUBBER_BAND;
    else if (x < min) x = min + (x - min) * RUBBER_BAND;
    apply(x);
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const g = gesture.current;
    const wasEngaged = g.engaged;
    const elapsed = performance.now() - g.startAt;
    const dx =
      event.changedTouches.length === 1
        ? event.changedTouches[0].clientX - g.startX
        : 0;
    g.started = false;
    g.engaged = false;
    if (!wasEngaged) return;

    const width = g.width || 1;
    const target = dx < 0 ? 'preview' : 'edit';
    const distanceOk = Math.abs(dx) >= Math.max(width * COMMIT_FRACTION, 56);
    const flickOk =
      Math.abs(dx) >= FLICK_DISTANCE_PX && elapsed <= FLICK_DURATION_MS;

    if ((distanceOk || flickOk) && target !== view) {
      onViewChange(target);
      onSettle?.();
    } else {
      apply(g.base, true);
      onSettle?.();
    }
  };

  const onTouchCancel = () => {
    const g = gesture.current;
    const wasEngaged = g.engaged;
    g.started = false;
    g.engaged = false;
    if (wasEngaged) {
      apply(g.base, true);
      onSettle?.();
    }
  };

  return {
    trackRef,
    stripRef,
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel },
  };
}
