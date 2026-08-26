'use client';

import { useRef } from 'react';

const SWIPE_MIN_DELTA_PX = 64;

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

  return {
    onTouchStart: (event: React.TouchEvent) => {
      if (
        event.touches.length !== 1 ||
        isSwipeBlocked(event.touches[0].target)
      ) {
        originRef.current = null;
        return;
      }
      const touch = event.touches[0];
      originRef.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchMove: (event: React.TouchEvent) => {
      if (event.touches.length !== 1) originRef.current = null;
    },
    onTouchEnd: (event: React.TouchEvent) => {
      const origin = originRef.current;
      originRef.current = null;
      if (!origin || event.changedTouches.length !== 1) return;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      if (
        Math.abs(dx) < SWIPE_MIN_DELTA_PX ||
        Math.abs(dx) < Math.abs(dy) * 1.5
      ) {
        return;
      }
      onSwipe(dx < 0 ? 'left' : 'right');
    },
    onTouchCancel: () => {
      originRef.current = null;
    },
  };
}
