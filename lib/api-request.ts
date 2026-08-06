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
import { clientIP, rateLimitResponse, rateLimitStatus } from '@/lib/rateLimit';

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

export async function handleAIRequest<Schema extends z.ZodType<ProviderConfig>>(
  req: Request,
  schema: Schema,
  handle: (ctx: AIRequestContext<z.output<Schema>>) => Promise<Response>,
): Promise<Response> {
  try {
    const ip = clientIP(req);
    const { limited, retryAfterSeconds } = rateLimitStatus(ip);
    if (limited) return rateLimitResponse(retryAfterSeconds);

    const parsedBody = schema.safeParse(await req.json());
    if (!parsedBody.success) {
      return Response.json(
        { error: 'Invalid payload', details: parsedBody.error },
        { status: 400 },
      );
    }

    const key = resolveAIKey(parsedBody.data.apiKey);
    if (!key) {
      return Response.json(
        { error: 'AI is not configured. Add an API key in AI Settings.' },
        { status: 400 },
      );
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
