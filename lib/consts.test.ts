import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AI_API_KEY_STORAGE_KEY,
  AI_PROVIDERS,
  DEFAULT_SECTION_ORDER,
  RENDERABLE_SECTIONS,
  SECTIONS,
  getStoredAIAPIKey,
} from '@/lib/consts';

const createStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
  };
};

describe('AI_PROVIDERS', () => {
  it('exposes providers with default models', () => {
    expect(AI_PROVIDERS).toHaveLength(3);
    expect(AI_PROVIDERS.map((p) => p.value)).toEqual([
      'openai',
      'anthropic',
      'google',
    ]);
    expect(AI_PROVIDERS[2].defaultModel).toBeTruthy();
  });
});

describe('getStoredAIAPIKey', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
  });

  it('returns an empty string when no key is stored', () => {
    expect(getStoredAIAPIKey()).toBe('');
  });

  it('returns the stored key trimmed', () => {
    localStorage.setItem(AI_API_KEY_STORAGE_KEY, '  sk-test-key  ');
    expect(getStoredAIAPIKey()).toBe('sk-test-key');
  });
});

describe('section metadata', () => {
  it('derives default section order from renderable sections', () => {
    expect(DEFAULT_SECTION_ORDER).toEqual(RENDERABLE_SECTIONS.map((s) => s.id));
  });

  it('covers all renderable sections in SECTIONS', () => {
    const sectionFields = SECTIONS.flatMap((s) => s.fields);
    for (const { id } of RENDERABLE_SECTIONS) {
      expect(sectionFields).toContain(id);
    }
  });
});
