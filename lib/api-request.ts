import z from 'zod';
import {
  aiErrorResponse,
  createAIModel,
  resolveAIKey,
  resolveAIModel,
} from '@/lib/ai';
import { AI_PROVIDERS, AIProvider } from '@/lib/consts';
import { MAX_CV_IMAGE_BASE64_CHARS } from '@/lib/cvParsing';
import { parseEnv } from '@/lib/env';
import {
  clientIP,
  keyRateLimitStatus,
  rateLimitResponse,
  rateLimitStatus,
} from '@/lib/rateLimit';

const supportedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const imageSchema = z
  .object({
    data: z.string().min(1),
    mimeType: z.string().refine((v) => supportedMimeTypes.has(v)),
  })
  .refine((img) => img.data.length <= MAX_CV_IMAGE_BASE64_CHARS, {
    message: 'Image too large',
  });

const providerValues = AI_PROVIDERS.map((provider) => provider.value) as [
  AIProvider,
  ...AIProvider[],
];

export const providerConfigSchema = z.object({
  provider: z.enum(providerValues).default(parseEnv().provider),
  modelName: z.string().optional(),
  apiKey: z.string().min(10, 'Invalid API Key').optional(),
});

export type ProviderConfig = z.infer<typeof providerConfigSchema>;

export type AIModel = ReturnType<typeof createAIModel>;

interface AIRequestContext<Body> {
  body: Body;
  model: AIModel;
}

/**
 * Same-origin gate (throttle-only protection, no auth).
 *
 * When the Origin header is present it must match the request origin or one of
 * the configured AI_ALLOWED_ORIGINS, otherwise the request is rejected with
 * 403. Requests without an Origin header (curl, scripts, native clients) are
 * left to the rate limiter.
 */
function enforceOrigin(req: Request): Response | null {
  const { enforceOrigin, allowedOrigins } = parseEnv();
  if (!enforceOrigin) return null;

  const origin = req.headers.get('origin');
  if (!origin) return null;

  const requestOrigin = new URL(req.url).origin;
  if (origin === requestOrigin || allowedOrigins.includes(origin)) return null;

  return Response.json({ error: 'Forbidden' }, { status: 403 });
}

export async function handleAIRequest<Schema extends z.ZodType<ProviderConfig>>(
  req: Request,
  schema: Schema,
  handle: (ctx: AIRequestContext<z.output<Schema>>) => Promise<Response>,
): Promise<Response> {
  try {
    const originResponse = enforceOrigin(req);
    if (originResponse) return originResponse;

    const ip = clientIP(req);
    const { limited, retryAfterSeconds } = rateLimitStatus(ip);
    if (limited) return rateLimitResponse(retryAfterSeconds);

    const parsedBody = schema.safeParse(await req.json());
    if (!parsedBody.success) {
      console.error('AI request validation failed:', parsedBody.error);
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const key = resolveAIKey(parsedBody.data.apiKey);
    if (!key) {
      return Response.json(
        { error: 'AI is not configured. Add an API key in AI Settings.' },
        { status: 400 },
      );
    }

    const keyLimit = keyRateLimitStatus(key);
    if (keyLimit.limited) {
      return rateLimitResponse(keyLimit.retryAfterSeconds);
    }

    const model = createAIModel(
      parsedBody.data.provider,
      key,
      resolveAIModel(parsedBody.data.modelName),
    );

    return await handle({ body: parsedBody.data, model });
  } catch (error: unknown) {
    return aiErrorResponse(error);
  }
}
