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
});

export interface ParsedAIEnv {
  apiKey: string | null;
  model: string | undefined;
  provider: AIProvider;
}

export function parseEnv(): ParsedAIEnv {
  const parsed = envSchema.parse(process.env);
  return {
    apiKey: parsed.AI_API_KEY ?? null,
    model: parsed.AI_MODEL,
    provider: parsed.AI_PROVIDER ?? 'google',
  };
}
