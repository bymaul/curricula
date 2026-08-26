import type { PersistStorage, StorageValue } from 'zustand/middleware';
import {
  clearStorageError,
  createQuotaAwareStorage,
  reportStorageError,
} from '@/lib/storage';

const DB_NAME = 'curricula';
const DB_VERSION = 1;
const STORE_NAME = 'keyvalue';

interface IdbStorageOptions {
  dbName?: string;
}

export function resetIdbStorageForTests(): void {
  dbPromise = null;
  fallbackStorage = null;
  lastPayloadByKey.clear();
}

let dbPromise: Promise<IDBDatabase | null> | null = null;
let fallbackStorage: PersistStorage<never> | null = null;
const lastPayloadByKey = new Map<string, string>();

function openDb(dbName: string): Promise<IDBDatabase | null> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase | null>((resolve) => {
      try {
        if (typeof indexedDB === 'undefined') {
          resolve(null);
          return;
        }
        const request = indexedDB.open(dbName, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    }).catch(() => null);
  }
  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function getFallback<S>(): PersistStorage<S> {
  if (!fallbackStorage) {
    fallbackStorage =
      createQuotaAwareStorage() as unknown as PersistStorage<never>;
  }
  return fallbackStorage as unknown as PersistStorage<S>;
}

function readLegacyRaw(name: string): string | null {
  try {
    return typeof localStorage === 'undefined'
      ? null
      : localStorage.getItem(name);
  } catch {
    return null;
  }
}

function parseRaw(raw: string | null): StorageValue<never> | null {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as StorageValue<never>;
  } catch {
    return null;
  }
}

function hasIndexedDB(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

export function createIdbStorage<S>(
  options: IdbStorageOptions = {},
): PersistStorage<S> {
  const dbName = options.dbName ?? DB_NAME;

  if (!hasIndexedDB()) {
    return getFallback<S>();
  }

  return {
    async getItem(name) {
      const db = await openDb(dbName);
      if (db) {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const raw = await requestToPromise(
            tx.objectStore(STORE_NAME).get(name),
          );
          if (raw !== undefined && raw !== null) {
            const parsed = parseRaw(raw as string);
            if (parsed !== null) return parsed as StorageValue<S>;
          }
        } catch {}
      }
      return parseRaw(readLegacyRaw(name)) as StorageValue<S> | null;
    },

    async setItem(name, value) {
      const payload = JSON.stringify(value);
      if (lastPayloadByKey.get(name) === payload) return;

      const db = await openDb(dbName);
      if (!db) {
        getFallback<S>().setItem(name, value);
        lastPayloadByKey.set(name, payload);
        clearStorageError();
        return;
      }

      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        await requestToPromise(tx.objectStore(STORE_NAME).put(payload, name));
      } catch (error) {
        reportStorageError(error as { name?: string; message?: string });
        return;
      }

      lastPayloadByKey.set(name, payload);
      clearStorageError();

      try {
        localStorage.removeItem(name);
      } catch {}
    },

    async removeItem(name) {
      lastPayloadByKey.delete(name);
      const db = await openDb(dbName);
      if (db) {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          await requestToPromise(tx.objectStore(STORE_NAME).delete(name));
        } catch {}
      }
      try {
        localStorage.removeItem(name);
      } catch {}
    },
  };
}
