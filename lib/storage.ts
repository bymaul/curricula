import type { PersistStorage, StorageValue } from 'zustand/middleware';

export interface StorageError {
  name: string;
  message: string;
  at: number;
}

type Listener = (error: StorageError | null) => void;

const QUOTA_ERROR_NAMES = new Set([
  'QuotaExceededError',
  'NS_ERROR_DOM_QUOTA_REACHED',
]);

let lastError: StorageError | null = null;
const listeners = new Set<Listener>();

const lastPayloadByKey = new Map<string, string>();

function notify(error: StorageError | null) {
  for (const listener of listeners) listener(error);
}

export function subscribeToStorageErrors(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStorageError(): StorageError | null {
  return lastError;
}

export function reportStorageError(error: {
  name?: string;
  message?: string;
}): void {
  const name = error?.name ?? 'UnknownError';
  if (!QUOTA_ERROR_NAMES.has(name) || lastError !== null) return;
  lastError = { name, message: error?.message ?? '', at: Date.now() };
  notify(lastError);
}

export function clearStorageError(): void {
  if (lastError === null) return;
  lastError = null;
  notify(null);
}

export function resetStorageStateForTests(): void {
  lastError = null;
  lastPayloadByKey.clear();
}

function getBrowserStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function createQuotaAwareStorage<S>(): PersistStorage<S> {
  return {
    getItem: (name) => {
      const raw = getBrowserStorage()?.getItem(name) ?? null;
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as StorageValue<S>;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      const payload = JSON.stringify(value);
      if (lastPayloadByKey.get(name) === payload) return;
      const storage = getBrowserStorage();
      if (!storage) return;
      try {
        storage.setItem(name, payload);
        lastPayloadByKey.set(name, payload);
        clearStorageError();
      } catch (error) {
        lastPayloadByKey.delete(name);
        reportStorageError(error as { name?: string; message?: string });
      }
    },
    removeItem: (name) => {
      lastPayloadByKey.delete(name);
      getBrowserStorage()?.removeItem(name);
    },
  };
}
