import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBDatabase, IDBFactory } from 'fake-indexeddb';
import { createIdbStorage, resetIdbStorageForTests } from './idbStorage';
import {
  getStorageError,
  resetStorageStateForTests,
  subscribeToStorageErrors,
} from './storage';

interface FakeState {
  count: number;
}

const KEY = 'curricula-test';

function seedLegacy(value: unknown): void {
  localStorage.setItem(KEY, JSON.stringify(value));
}

async function corruptIdbRaw(dbName: string, raw: string): Promise<void> {
  const request = indexedDB.open(dbName);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains('keyvalue')) {
      db.createObjectStore('keyvalue');
    }
  };
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const tx = db.transaction('keyvalue', 'readwrite');
  tx.objectStore('keyvalue').put(raw, KEY);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

describe('createIdbStorage', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    resetIdbStorageForTests();
    resetStorageStateForTests();
    localStorage.clear();
  });

  it('round-trips values through IndexedDB', async () => {
    const storage = createIdbStorage<FakeState>();
    const value = { state: { count: 1 }, version: 0 };

    await storage.setItem(KEY, value);

    expect(await storage.getItem(KEY)).toEqual(value);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('returns null for missing keys', async () => {
    const storage = createIdbStorage<FakeState>();

    expect(await storage.getItem(KEY)).toBeNull();
  });

  it('serves the legacy localStorage copy when IndexedDB is empty', async () => {
    const legacy = { state: { count: 5 }, version: 3 };
    seedLegacy(legacy);
    const storage = createIdbStorage<FakeState>();

    expect(await storage.getItem(KEY)).toEqual(legacy);
    expect(localStorage.getItem(KEY)).not.toBeNull();
  });

  it('drops the legacy copy after a successful write', async () => {
    seedLegacy({ state: { count: 5 }, version: 3 });
    const storage = createIdbStorage<FakeState>();

    await storage.getItem(KEY);
    await storage.setItem(KEY, { state: { count: 6 }, version: 3 });

    expect(localStorage.getItem(KEY)).toBeNull();
    expect(await storage.getItem(KEY)).toEqual({
      state: { count: 6 },
      version: 3,
    });
  });

  it('falls back to the legacy copy when the stored payload is corrupt', async () => {
    await corruptIdbRaw('corrupt-db', '{not json');
    seedLegacy({ state: { count: 7 }, version: 1 });
    const storage = createIdbStorage<FakeState>({ dbName: 'corrupt-db' });

    expect(await storage.getItem(KEY)).toEqual({
      state: { count: 7 },
      version: 1,
    });
  });

  it('removes values from both stores', async () => {
    seedLegacy({ state: { count: 1 }, version: 0 });
    const storage = createIdbStorage<FakeState>();
    await storage.setItem(KEY, { state: { count: 2 }, version: 0 });

    await storage.removeItem(KEY);

    expect(await storage.getItem(KEY)).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('keeps the legacy copy and reports quota errors on failed writes', async () => {
    seedLegacy({ state: { count: 1 }, version: 0 });
    const storage = createIdbStorage<FakeState>({ dbName: 'fail-db' });
    await storage.setItem(KEY, { state: { count: 2 }, version: 0 });

    const listener = vi.fn();
    subscribeToStorageErrors(listener);
    const originalTransaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function () {
      throw Object.assign(new Error('too big'), {
        name: 'QuotaExceededError',
      });
    };
    try {
      await storage.setItem(KEY, { state: { count: 3 }, version: 0 });
    } finally {
      IDBDatabase.prototype.transaction = originalTransaction;
    }

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getStorageError()?.name).toBe('QuotaExceededError');
    expect(await storage.getItem(KEY)).toEqual({
      state: { count: 2 } as never,
      version: 0,
    });
  });

  it('skips redundant writes with identical payloads', async () => {
    const storage = createIdbStorage<FakeState>({ dbName: 'dedupe-db' });
    const value = { state: { count: 9 }, version: 4 };
    await storage.setItem(KEY, value);

    const putSpy = vi.spyOn(IDBDatabase.prototype, 'transaction');
    await storage.setItem(KEY, value);

    expect(putSpy).not.toHaveBeenCalled();
    expect(await storage.getItem(KEY)).toEqual(value);
  });

  it('delegates to localStorage synchronously when IndexedDB is unavailable', async () => {
    const original = globalThis.indexedDB;
    // @ts-expect-error simulate environments without IndexedDB
    delete globalThis.indexedDB;
    try {
      resetIdbStorageForTests();
      const storage = createIdbStorage<FakeState>();
      const value = { state: { count: 11 }, version: 0 };

      await storage.setItem(KEY, value);

      expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(value);
      expect(await storage.getItem(KEY)).toEqual(value);
    } finally {
      globalThis.indexedDB = original;
      resetIdbStorageForTests();
    }
  });
});
