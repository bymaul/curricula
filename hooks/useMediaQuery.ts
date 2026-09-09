'use client';

import { useSyncExternalStore } from 'react';

export const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';

export function useMediaQuery(query: string) {
  const getSnapshot = () => window.matchMedia(query).matches;
  const subscribe = (onStoreChange: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener('change', onStoreChange);
    return () => mq.removeEventListener('change', onStoreChange);
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
