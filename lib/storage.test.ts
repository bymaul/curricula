import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearStorageError,
  createQuotaAwareStorage,
  getStorageError,
  resetStorageStateForTests,
  subscribeToStorageErrors,
} from '@/lib/storage';

const originalLocalStorage = globalThis.localStorage;
const originalWindow = globalThis.window;

function installMockStorage() {
  const store = new Map<string, string>();
  const setItem = vi.fn((key: string, value: string) => {
    store.set(key, value);
  });
  const getItem = vi.fn((key: string) => store.get(key) ?? null);
  const removeItem = vi.fn((key: string) => {
    store.delete(key);
  });
  const mock: Storage = {
    getItem,
    setItem,
    removeItem,
    clear: vi.fn(() => store.clear()),
    key: vi.fn(() => null),
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: mock },
    configurable: true,
    writable: true,
  });
  return { setItem, getItem, removeItem };
}

function quotaError(): DOMException {
  return new DOMException('Quota exceeded', 'QuotaExceededError');
}

beforeEach(() => {
  resetStorageStateForTests();
});

afterEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: originalLocalStorage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: originalWindow,
    configurable: true,
    writable: true,
  });
});

describe('createQuotaAwareStorage', () => {
  it('persists the { state, version } wire format like the default JSON storage', () => {
    const { setItem, getItem } = installMockStorage();
    const storage = createQuotaAwareStorage();

    storage.setItem('curricula-resumes', {
      state: { resumes: [{ id: 'r1' }] },
      version: 0,
    });

    expect(setItem).toHaveBeenCalledWith(
      'curricula-resumes',
      JSON.stringify({ state: { resumes: [{ id: 'r1' }] }, version: 0 }),
    );
    expect(storage.getItem('curricula-resumes')).toEqual({
      state: { resumes: [{ id: 'r1' }] },
      version: 0,
    });
    expect(getItem('curricula-resumes')).not.toBeNull();
  });

  it('skips writes whose serialized payload is identical to the last one', () => {
    const { setItem } = installMockStorage();
    const storage = createQuotaAwareStorage();
    const value = { state: { resumes: [] }, version: 0 };

    storage.setItem('k', value);
    storage.setItem('k', { ...value, version: 0 });
    storage.setItem('k', { state: { resumes: [{}] }, version: 0 });
    storage.setItem('k', { state: { resumes: [{}] }, version: 0 });

    expect(setItem).toHaveBeenCalledTimes(2);
  });

  it('re-writes a removed key even with the same payload', () => {
    const { setItem } = installMockStorage();
    const storage = createQuotaAwareStorage();
    const value = { state: { resumes: [] }, version: 0 };

    storage.setItem('k', value);
    storage.removeItem('k');
    storage.setItem('k', value);

    expect(setItem).toHaveBeenCalledTimes(2);
  });

  it('surfaces quota errors and clears them after a successful write', () => {
    const { setItem } = installMockStorage();
    const listener = vi.fn();
    const unsubscribe = subscribeToStorageErrors(listener);

    setItem.mockImplementationOnce(() => {
      throw quotaError();
    });
    const storage = createQuotaAwareStorage();

    storage.setItem('curricula-resumes', {
      state: { resumes: [] },
      version: 0,
    });

    const error = getStorageError();
    expect(error).not.toBeNull();
    expect(error?.name).toBe('QuotaExceededError');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]?.name).toBe('QuotaExceededError');

    storage.setItem('curricula-resumes', {
      state: { resumes: [{}] },
      version: 0,
    });
    expect(getStorageError()).toBeNull();
    expect(listener).toHaveBeenLastCalledWith(null);

    unsubscribe();
  });

  it('notifies only once while writes keep failing', () => {
    const { setItem } = installMockStorage();
    const listener = vi.fn();
    subscribeToStorageErrors(listener);
    setItem.mockImplementation(() => {
      throw quotaError();
    });
    const storage = createQuotaAwareStorage();

    storage.setItem('k', { state: { resumes: [] }, version: 0 });
    storage.setItem('k', { state: { resumes: [{}] }, version: 0 });

    expect(getStorageError()?.name).toBe('QuotaExceededError');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('swallows non-quota errors without surfacing them', () => {
    const { setItem } = installMockStorage();
    const listener = vi.fn();
    const storage = createQuotaAwareStorage();
    setItem.mockImplementation(() => {
      throw new Error('boom');
    });

    expect(() =>
      storage.setItem('k', { state: { resumes: [] }, version: 0 }),
    ).not.toThrow();
    expect(getStorageError()).toBeNull();
    expect(listener).not.toHaveBeenCalled();
  });

  it('removes items from the underlying storage', () => {
    const { removeItem } = installMockStorage();
    const storage = createQuotaAwareStorage();

    storage.removeItem('curricula-resumes');

    expect(removeItem).toHaveBeenCalledWith('curricula-resumes');
  });

  it('unsubscribes listeners', () => {
    const { setItem } = installMockStorage();
    const listener = vi.fn();
    const unsubscribe = subscribeToStorageErrors(listener);
    unsubscribe();
    setItem.mockImplementationOnce(() => {
      throw quotaError();
    });

    createQuotaAwareStorage().setItem('k', { state: {}, version: 0 });

    expect(listener).not.toHaveBeenCalled();
    expect(getStorageError()).not.toBeNull();
  });

  it('clears the error explicitly', () => {
    const { setItem } = installMockStorage();
    setItem.mockImplementationOnce(() => {
      throw quotaError();
    });
    const storage = createQuotaAwareStorage();
    storage.setItem('k', { state: {}, version: 0 });
    expect(getStorageError()).not.toBeNull();

    clearStorageError();

    expect(getStorageError()).toBeNull();
  });

  it('is a no-op when the browser storage is unavailable', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const storage = createQuotaAwareStorage();

    expect(() => storage.setItem('k', { state: {}, version: 0 })).not.toThrow();
    expect(storage.getItem('k')).toBeNull();
  });
});
