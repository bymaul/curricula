import 'server-only';

import { z } from 'zod';
import { stripInvisibleChars } from '@/lib/cleanText';
import { AIProvider } from '@/lib/consts';

const envSchema = z.object({
  AI_API_KEY: z
    .string()
    .trim()
    .transform(stripInvisibleChars)
    .refine((value) => value.length > 0)
    .optional()
    .catch(undefined),
  AI_MODEL: z
    .string()
    .trim()
    .transform(stripInvisibleChars)
    .refine((value) => value.length > 0)
    .optional()
    .catch(undefined),
  AI_PROVIDER: z
    .enum(['openai', 'anthropic', 'google'])
    .optional()
    .catch(undefined),
  AI_ENFORCE_ORIGIN: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => {
      if (value === undefined) return true;
      return !['false', '0', 'off', 'no'].includes(value.trim().toLowerCase());
    }),
  AI_ALLOWED_ORIGINS: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) =>
      (value ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
});

export interface ParsedAIEnv {
  apiKey: string | null;
  model: string | undefined;
  provider: AIProvider;
  enforceOrigin: boolean;
  allowedOrigins: string[];
}

export function parseEnv(): ParsedAIEnv {
  const parsed = envSchema.parse(process.env);
  return {
    apiKey: parsed.AI_API_KEY ?? null,
    model: parsed.AI_MODEL,
    provider: parsed.AI_PROVIDER ?? 'google',
    enforceOrigin: parsed.AI_ENFORCE_ORIGIN,
    allowedOrigins: parsed.AI_ALLOWED_ORIGINS,
  };
}
