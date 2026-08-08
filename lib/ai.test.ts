import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aiErrorResponse,
  createAIModel,
  resolveAIKey,
  resolveAIModel,
} from '@/lib/ai';

describe('resolveAIKey', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers the client key and strips invisible characters', () => {
    expect(resolveAIKey('sk\u2060-test\u00AD')).toBe('sk-test');
  });

  it('falls back to the environment key', () => {
    vi.stubEnv('AI_API_KEY', 'env-key');
    expect(resolveAIKey()).toBe('env-key');
  });

  it('returns null when no key is available', () => {
    vi.stubEnv('AI_API_KEY', '');
    expect(resolveAIKey()).toBeNull();
  });
});

describe('resolveAIModel', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers the explicit model name', () => {
    expect(resolveAIModel('  my\u2060-model ')).toBe('my-model');
  });

  it('falls back to the environment model', () => {
    vi.stubEnv('AI_MODEL', 'env-model');
    expect(resolveAIModel()).toBe('env-model');
  });

  it('returns undefined when nothing is configured', () => {
    vi.stubEnv('AI_MODEL', '');
    expect(resolveAIModel('   ')).toBeUndefined();
  });
});

describe('createAIModel', () => {
  it('creates a model for each provider with the given key', () => {
    for (const provider of ['openai', 'anthropic', 'google'] as const) {
      const model = createAIModel(provider, 'test-key');
      expect(model).toBeTruthy();
    }
  });

  it('uses the provided model name', () => {
    const model = createAIModel('google', 'test-key', 'custom-model');
    expect((model as { modelId?: string }).modelId).toBe('custom-model');
  });
});

describe('aiErrorResponse', () => {
  it('maps a 429 status code to a rate-limit response', async () => {
    const response = aiErrorResponse({ statusCode: 429, message: 'limit' });
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('Rate limit'),
    });
  });

  it('maps a message containing 429 to a rate-limit response', async () => {
    const response = aiErrorResponse(new Error('status 429: too many'));
    expect(response.status).toBe(429);
  });

  it('passes the provider Retry-After header through', async () => {
    const response = aiErrorResponse({
      statusCode: 429,
      headers: new Headers({ 'retry-after': '37' }),
    });
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('37');
  });

  it('maps 401/403 to a generic auth error without leaking details', async () => {
    const response = aiErrorResponse({
      statusCode: 401,
      message: 'sk-invalid-secret rejected: API key is invalid',
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'The AI provider rejected the API key. Check AI Settings.',
    });
  });

  it('maps 404 to a generic model-not-found error', async () => {
    const response = aiErrorResponse({
      statusCode: 404,
      message: 'model "gemini-9" not found',
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'The AI model was not found. Check AI Settings.',
    });
  });

  it('returns a generic message for other errors', async () => {
    const response = aiErrorResponse(new Error('boom'));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Error processing AI request',
    });
  });

  it('uses a default message when none is provided', async () => {
    const response = aiErrorResponse({});
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Error processing AI request',
    });
  });
});
