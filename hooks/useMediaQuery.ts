'use client';

import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string) {
    const getSnapshot = () => window.matchMedia(query).matches;
    const subscribe = (onStoreChange: () => void) => {
        const mq = window.matchMedia(query);
        mq.addEventListener('change', onStoreChange);
        return () => mq.removeEventListener('change', onStoreChange);
    };

    return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
