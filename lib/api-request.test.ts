import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import z from 'zod';

vi.mock('@/lib/ai', () => ({
  createAIModel: vi.fn(() => ({ mock: true })),
  resolveAIKey: vi.fn((key?: string) => key ?? null),
  resolveAIModel: vi.fn((name?: string) => name),
  aiErrorResponse: vi.fn(
    (error: unknown) =>
      new Response(JSON.stringify({ error: String(error) }), { status: 500 }),
  ),
}));

vi.mock('@/lib/rateLimit', () => ({
  clientIP: vi.fn(() => '1.2.3.4'),
  rateLimitStatus: vi.fn(() => ({ limited: false, retryAfterSeconds: 0 })),
  keyRateLimitStatus: vi.fn(() => ({
    limited: false,
    retryAfterSeconds: 0,
  })),
  rateLimitResponse: vi.fn(
    (retryAfterSeconds: number) =>
      new Response(JSON.stringify({ error: 'rate limited' }), {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      }),
  ),
}));

import {
  aiErrorResponse,
  createAIModel,
  resolveAIKey,
  resolveAIModel,
} from '@/lib/ai';
import {
  keyRateLimitStatus,
  rateLimitResponse,
  rateLimitStatus,
} from '@/lib/rateLimit';
import { MAX_CV_IMAGE_BASE64_CHARS } from '@/lib/cvParsing';
import {
  handleAIRequest,
  imageSchema,
  providerConfigSchema,
} from '@/lib/api-request';

const testSchema = providerConfigSchema.extend({
  ping: z.string().optional(),
});

function jsonRequest(body: unknown, init?: { origin?: string }): Request {
  return new Request('http://test/api', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: init?.origin ? { Origin: init.origin } : undefined,
  });
}

describe('handleAIRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimitStatus).mockReturnValue({
      limited: false,
      retryAfterSeconds: 0,
    });
    vi.mocked(keyRateLimitStatus).mockReturnValue({
      limited: false,
      retryAfterSeconds: 0,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the rate limit response when rate limited', async () => {
    vi.mocked(rateLimitStatus).mockReturnValue({
      limited: true,
      retryAfterSeconds: 30,
    });

    const res = await handleAIRequest(
      jsonRequest({ provider: 'openai' }),
      testSchema,
      vi.fn(async () => new Response('unreachable')),
    );

    expect(rateLimitResponse).toHaveBeenCalledWith(30);
    expect(res.status).toBe(429);
  });

  it('rejects invalid payloads with 400', async () => {
    const res = await handleAIRequest(
      jsonRequest({ ping: 42 }),
      testSchema,
      vi.fn(async () => new Response('unreachable')),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid payload');
  });

  it('does not leak validation details in the 400 body', async () => {
    const res = await handleAIRequest(
      jsonRequest({ ping: 42 }),
      testSchema,
      vi.fn(async () => new Response('unreachable')),
    );

    const body = await res.json();
    expect(body).toEqual({ error: 'Invalid payload' });
  });

  it('rejects cross-origin requests with 403', async () => {
    const res = await handleAIRequest(
      jsonRequest(
        { provider: 'openai', ping: 'pong' },
        {
          origin: 'https://evil.example',
        },
      ),
      testSchema,
      vi.fn(async () => new Response('unreachable')),
    );

    expect(res.status).toBe(403);
    expect(rateLimitStatus).not.toHaveBeenCalled();
  });

  it('allows same-origin requests', async () => {
    vi.mocked(resolveAIKey).mockReturnValue('sk-test-123');

    const res = await handleAIRequest(
      jsonRequest(
        { provider: 'openai', ping: 'pong' },
        { origin: 'http://test' },
      ),
      testSchema,
      vi.fn(async () => new Response('ok')),
    );

    expect(res.status).toBe(200);
  });

  it('allows requests without an origin header', async () => {
    vi.mocked(resolveAIKey).mockReturnValue('sk-test-123');

    const res = await handleAIRequest(
      jsonRequest({ provider: 'openai', ping: 'pong' }),
      testSchema,
      vi.fn(async () => new Response('ok')),
    );

    expect(res.status).toBe(200);
  });

  it('skips the origin gate when AI_ENFORCE_ORIGIN is off', async () => {
    vi.stubEnv('AI_ENFORCE_ORIGIN', 'false');
    vi.mocked(resolveAIKey).mockReturnValue('sk-test-123');

    const res = await handleAIRequest(
      jsonRequest(
        { provider: 'openai', ping: 'pong' },
        {
          origin: 'https://evil.example',
        },
      ),
      testSchema,
      vi.fn(async () => new Response('ok')),
    );

    expect(res.status).toBe(200);
  });

  it('respects AI_ALLOWED_ORIGINS', async () => {
    vi.stubEnv('AI_ALLOWED_ORIGINS', 'https://app.example, https://cv.example');
    vi.mocked(resolveAIKey).mockReturnValue('sk-test-123');

    const res = await handleAIRequest(
      jsonRequest(
        { provider: 'openai', ping: 'pong' },
        {
          origin: 'https://cv.example',
        },
      ),
      testSchema,
      vi.fn(async () => new Response('ok')),
    );

    expect(res.status).toBe(200);
  });

  it('applies the per-key rate limit after resolving the key', async () => {
    vi.mocked(resolveAIKey).mockReturnValue('sk-test-123');
    vi.mocked(keyRateLimitStatus).mockReturnValue({
      limited: true,
      retryAfterSeconds: 45,
    });

    const res = await handleAIRequest(
      jsonRequest({ provider: 'openai', apiKey: 'sk-test-123' }),
      testSchema,
      vi.fn(async () => new Response('unreachable')),
    );

    expect(keyRateLimitStatus).toHaveBeenCalledWith('sk-test-123');
    expect(rateLimitResponse).toHaveBeenCalledWith(45);
    expect(res.status).toBe(429);
  });

  it('rejects requests without an AI key', async () => {
    vi.mocked(resolveAIKey).mockReturnValue(null);

    const res = await handleAIRequest(
      jsonRequest({ provider: 'openai' }),
      testSchema,
      vi.fn(async () => new Response('unreachable')),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'AI is not configured. Add an API key in AI Settings.',
    });
  });

  it('creates the model and delegates to the handler', async () => {
    vi.mocked(resolveAIKey).mockReturnValue('sk-test-123');
    let captured: { body: Record<string, unknown>; model: unknown } | undefined;
    const handler = vi.fn(
      async (ctx: { body: Record<string, unknown>; model: unknown }) => {
        captured = ctx;
        return new Response('ok');
      },
    );

    const res = await handleAIRequest(
      jsonRequest({
        provider: 'anthropic',
        apiKey: 'sk-test-123',
        modelName: 'claude-x',
        ping: 'pong',
      }),
      testSchema,
      handler,
    );

    expect(res.status).toBe(200);
    expect(createAIModel).toHaveBeenCalledWith(
      'anthropic',
      'sk-test-123',
      'claude-x',
    );
    expect(handler).toHaveBeenCalledOnce();
    expect(captured?.body).toMatchObject({
      provider: 'anthropic',
      apiKey: 'sk-test-123',
      modelName: 'claude-x',
      ping: 'pong',
    });
    expect(captured?.model).toEqual({ mock: true });
  });

  it('falls back to the env model when no model name is given', async () => {
    vi.mocked(resolveAIKey).mockReturnValue('sk-test-123');

    await handleAIRequest(
      jsonRequest({ provider: 'google' }),
      testSchema,
      vi.fn(async () => new Response('ok')),
    );

    expect(resolveAIModel).toHaveBeenCalledWith(undefined);
  });

  it('routes handler errors through aiErrorResponse', async () => {
    vi.mocked(resolveAIKey).mockReturnValue('sk-test-123');
    const boom = new Error('boom');
    const handler = vi.fn(async () => {
      throw boom;
    });

    const res = await handleAIRequest(
      jsonRequest({ provider: 'openai' }),
      testSchema,
      handler,
    );

    expect(aiErrorResponse).toHaveBeenCalledWith(boom);
    expect(res.status).toBe(500);
  });
});

describe('imageSchema', () => {
  it('accepts supported mime types', () => {
    expect(
      imageSchema.safeParse({ data: 'abc', mimeType: 'image/png' }).success,
    ).toBe(true);
    expect(
      imageSchema.safeParse({ data: 'abc', mimeType: 'image/jpeg' }).success,
    ).toBe(true);
    expect(
      imageSchema.safeParse({ data: 'abc', mimeType: 'image/webp' }).success,
    ).toBe(true);
  });

  it('rejects empty data', () => {
    expect(
      imageSchema.safeParse({ data: '', mimeType: 'image/png' }).success,
    ).toBe(false);
  });

  it('rejects unsupported mime types', () => {
    expect(
      imageSchema.safeParse({ data: 'abc', mimeType: 'image/gif' }).success,
    ).toBe(false);
  });

  it('rejects oversized images', () => {
    const result = imageSchema.safeParse({
      data: 'x'.repeat(MAX_CV_IMAGE_BASE64_CHARS + 1),
      mimeType: 'image/png',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(JSON.stringify(result.error)).toContain('Image too large');
    }
  });
});

describe('providerConfigSchema', () => {
  it('defaults the provider to the parsed env provider', () => {
    const result = providerConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.provider).toBeDefined();
  });

  it('rejects unknown providers', () => {
    expect(providerConfigSchema.safeParse({ provider: 'grok' }).success).toBe(
      false,
    );
  });

  it('rejects short API keys', () => {
    const result = providerConfigSchema.safeParse({
      provider: 'openai',
      apiKey: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(JSON.stringify(result.error)).toContain('Invalid API Key');
    }
  });
});
