import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { AIProvider, AI_PROVIDERS } from '@/lib/consts';
import { stripInvisibleChars } from '@/lib/cleanText';
import { parseEnv } from '@/lib/env';

export function resolveAIKey(clientKey?: string): string | null {
  if (clientKey) return stripInvisibleChars(clientKey);
  return parseEnv().apiKey;
}

export function resolveAIModel(modelName?: string): string | undefined {
  const value = modelName?.trim();
  if (value) return stripInvisibleChars(value) || undefined;
  return parseEnv().model;
}

export function createAIModel(
  provider: AIProvider,
  apiKey: string,
  modelName?: string,
) {
  switch (provider) {
    case 'anthropic':
      return createAnthropic({ apiKey })(
        modelName || AI_PROVIDERS[1].defaultModel,
      );
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(
        modelName || AI_PROVIDERS[2].defaultModel,
      );
    case 'openai':
    default:
      return createOpenAI({ apiKey })(
        modelName || AI_PROVIDERS[0].defaultModel,
      );
  }
}

function extractRetryAfter(headers: unknown): number | null {
  if (!headers) return null;
  let value: string | null = null;
  if (typeof (headers as Headers).get === 'function') {
    value = (headers as Headers).get('retry-after');
  } else if (typeof headers === 'object') {
    value = (headers as Record<string, string>)['retry-after'] ?? null;
  }
  if (!value) return null;
  const seconds = Number(value);
  return Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds)) : null;
}

export function aiErrorResponse(error: unknown): Response {
  const err = error as {
    statusCode?: number;
    message?: string;
    headers?: unknown;
  };
  console.error('AI Error:', error);

  const message = err?.message ?? '';

  // Provider rate limits: pass the provider's Retry-After through so clients
  // can show "wait N seconds" instead of a generic failure.
  if (err?.statusCode === 429 || message.includes('429')) {
    const retryAfter = extractRetryAfter(err.headers);
    const headers =
      retryAfter !== null ? { 'Retry-After': String(retryAfter) } : undefined;
    return new Response(
      JSON.stringify({
        error:
          'Rate limit exceeded for this API key. Please wait a moment and try again.',
      }),
      { status: 429, headers },
    );
  }

  // Map provider errors to safe generic messages. Full details stay in the
  // server logs (see console.error above); never echo provider internals.
  if (
    err?.statusCode === 401 ||
    err?.statusCode === 403 ||
    /unauthorized|invalid api key|authentication|permission/i.test(message)
  ) {
    return new Response(
      JSON.stringify({
        error: 'The AI provider rejected the API key. Check AI Settings.',
      }),
      { status: 500 },
    );
  }

  if (err?.statusCode === 404 || /model.*not found|not found/i.test(message)) {
    return new Response(
      JSON.stringify({
        error: 'The AI model was not found. Check AI Settings.',
      }),
      { status: 500 },
    );
  }

  return new Response(
    JSON.stringify({ error: 'Error processing AI request' }),
    { status: 500 },
  );
}
