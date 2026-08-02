import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseEnv } from '@/lib/env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('parseEnv', () => {
  it('returns null key and google provider when no env is set', () => {
    vi.stubEnv('AI_API_KEY', '');
    vi.stubEnv('AI_MODEL', '');
    vi.stubEnv('AI_PROVIDER', '');
    expect(parseEnv()).toEqual({
      apiKey: null,
      model: undefined,
      provider: 'google',
    });
  });

  it('reads a valid API key', () => {
    vi.stubEnv('AI_API_KEY', 'valid-key');
    expect(parseEnv().apiKey).toBe('valid-key');
  });

  it('strips invisible characters from the key', () => {
    vi.stubEnv('AI_API_KEY', 'goog\u2060le-key\u00AD');
    expect(parseEnv().apiKey).toBe('google-key');
  });

  it('treats a whitespace-only key as unset', () => {
    vi.stubEnv('AI_API_KEY', '   ');
    expect(parseEnv().apiKey).toBeNull();
  });

  it('treats an invisible-chars-only key as unset', () => {
    vi.stubEnv('AI_API_KEY', '\u2060\u00AD\uFEFF');
    expect(parseEnv().apiKey).toBeNull();
  });

  it('reads the model override', () => {
    vi.stubEnv('AI_MODEL', '  my\u2060-model ');
    expect(parseEnv().model).toBe('my-model');
  });

  it('falls back to google for an invalid provider', () => {
    vi.stubEnv('AI_PROVIDER', 'amazon');
    expect(parseEnv().provider).toBe('google');
  });

  it('preserves a valid key when the provider is invalid', () => {
    vi.stubEnv('AI_API_KEY', 'still-valid');
    vi.stubEnv('AI_PROVIDER', 'nope');
    const env = parseEnv();
    expect(env.apiKey).toBe('still-valid');
    expect(env.provider).toBe('google');
  });

  it('reads a valid provider', () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic');
    expect(parseEnv().provider).toBe('anthropic');
  });
});
