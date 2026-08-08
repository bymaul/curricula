'use client';

import { useSyncExternalStore } from 'react';
import { getStorageError, subscribeToStorageErrors } from '@/lib/storage';

/**
 * Subscribes to the latest persistence write error (e.g. quota exhausted).
 * Returns `null` when storage writes are healthy.
 */
export function useStorageError() {
  return useSyncExternalStore(
    subscribeToStorageErrors,
    getStorageError,
    () => null,
  );
}
