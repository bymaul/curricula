import { beforeEach } from 'vitest';

const backing = new Map<string, string>();

const localStorageMock: Storage = {
  getItem: (key: string) => backing.get(key) ?? null,
  setItem: (key: string, value: string) => void backing.set(key, value),
  removeItem: (key: string) => void backing.delete(key),
  clear: () => backing.clear(),
  key: (index: number) => [...backing.keys()][index] ?? null,
  get length() {
    return backing.size;
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, 'window', {
  value: { localStorage: localStorageMock },
  configurable: true,
  writable: true,
});

if (
  typeof globalThis.crypto === 'undefined' ||
  !('randomUUID' in globalThis.crypto)
) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () =>
        `test-${Math.random().toString(36).slice(2)}-${Date.now()}`,
    },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  backing.clear();
});
