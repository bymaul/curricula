'use client';

import { useRef } from 'react';

const SWIPE_MIN_DELTA_PX = 56;

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

export type SwipeDirection = 'left' | 'right';

export function useHorizontalSwipe(
  onSwipe: (direction: SwipeDirection) => void,
) {
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const reset = () => {
    originRef.current = null;
    firedRef.current = false;
  };

  const evaluate = (clientX: number, clientY: number) => {
    const origin = originRef.current;
    if (!origin || firedRef.current) return;

    const dx = clientX - origin.x;
    const dy = clientY - origin.y;
    if (
      Math.abs(dx) < SWIPE_MIN_DELTA_PX ||
      Math.abs(dx) < Math.abs(dy) * 1.5
    ) {
      return;
    }

    firedRef.current = true;
    originRef.current = null;
    onSwipe(dx < 0 ? 'left' : 'right');
  };

  return {
    onTouchStart: (event: React.TouchEvent) => {
      reset();
      if (
        event.touches.length !== 1 ||
        isSwipeBlocked(event.touches[0].target)
      ) {
        return;
      }
      const touch = event.touches[0];
      originRef.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchMove: (event: React.TouchEvent) => {
      if (event.touches.length !== 1) {
        reset();
        return;
      }
      const touch = event.touches[0];
      // Fire mid-gesture as soon as the threshold is crossed so the view
      // flips while the finger is still down instead of waiting for lift.
      evaluate(touch.clientX, touch.clientY);
    },
    onTouchEnd: (event: React.TouchEvent) => {
      if (!firedRef.current && event.changedTouches.length === 1) {
        const touch = event.changedTouches[0];
        evaluate(touch.clientX, touch.clientY);
      }
      reset();
    },
    onTouchCancel: reset,
  };
}
