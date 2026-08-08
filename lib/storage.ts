import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * Storage error surfaced to the UI when a persistence write fails (e.g. the
 * browser quota is exhausted). Kept opaque so callers never touch the raw
 * DOMException.
 */
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

// Last successfully written payload per storage key. Persistence writes are
// skipped when the serialized payload is byte-identical to the previous one,
// which cuts redundant writes for state updates that change nothing.
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

export function clearStorageError(): void {
  if (lastError === null) return;
  lastError = null;
  notify(null);
}

/** Resets module state; used by tests between cases. */
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

/**
 * A zustand `PersistStorage` that guards every write, matching the wire format
 * of the default `createJSONStorage` (`{ state, version }` in localStorage):
 *
 * - Identical serialized payloads are skipped, so no redundant localStorage
 *   writes happen while the persisted state is unchanged.
 * - Failed writes are captured and surfaced through
 *   `subscribeToStorageErrors`/`getStorageError` instead of being silently
 *   swallowed by the persist middleware, so the UI can warn that changes are
 *   no longer being saved.
 * - The error clears automatically once a write succeeds again.
 */
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
        const err = error as { name?: string; message?: string };
        const name_ = err?.name ?? 'UnknownError';
        if (QUOTA_ERROR_NAMES.has(name_) && lastError === null) {
          lastError = {
            name: name_,
            message: err?.message ?? '',
            at: Date.now(),
          };
          notify(lastError);
        }
      }
    },
    removeItem: (name) => {
      lastPayloadByKey.delete(name);
      getBrowserStorage()?.removeItem(name);
    },
  };
}
