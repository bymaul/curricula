'use client';

import { useSyncExternalStore } from 'react';
import { getStorageError, subscribeToStorageErrors } from '@/lib/storage';

export function useStorageError() {
  return useSyncExternalStore(
    subscribeToStorageErrors,
    getStorageError,
    () => null,
  );
}
