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

const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Decodes strict base64 into bytes, or null when the payload is not valid
 * base64 (length mod 4 == 1 is impossible in base64).
 */
function decodeBase64(data: string): Buffer | null {
  if (data.length === 0 || data.length % 4 === 1) return null;
  if (!BASE64_RE.test(data)) return null;
  try {
    const bytes = Buffer.from(data, 'base64');
    return bytes.length > 0 ? bytes : null;
  } catch {
    return null;
  }
}

/** Verifies the decoded bytes carry the file signature of the declared MIME type. */
function hasImageSignature(bytes: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return (
      bytes.length >= 3 &&
      bytes[0] === JPEG_SIGNATURE[0] &&
      bytes[1] === JPEG_SIGNATURE[1] &&
      bytes[2] === JPEG_SIGNATURE[2]
    );
  }
  if (mimeType === 'image/png') {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE);
  }
  if (mimeType === 'image/webp') {
    return (
      bytes.length >= 12 &&
      bytes.toString('latin1', 0, 4) === 'RIFF' &&
      bytes.toString('latin1', 8, 12) === 'WEBP'
    );
  }
  return false;
}

export const imageSchema = z
  .object({
    data: z.string().min(1),
    mimeType: z.string().refine((v) => supportedMimeTypes.has(v)),
  })
  .refine((img) => img.data.length <= MAX_CV_IMAGE_BASE64_CHARS, {
    message: 'Image too large',
  })
  .refine((img) => {
    const bytes = decodeBase64(img.data);
    return bytes !== null && hasImageSignature(bytes, img.mimeType);
  }, { message: 'Invalid image data' });

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

/** Upper bound on the JSON request body (6 images x 1.5M chars + overhead). */
export const MAX_REQUEST_BODY_CHARS = 10_500_000;

interface ReadBodyResult {
  text: string;
  tooLarge: boolean;
}

/** Reads the request body text, rejecting oversized bodies before JSON parsing. */
async function readBody(req: Request): Promise<ReadBodyResult> {
  const contentLength = Number(req.headers.get('content-length'));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_REQUEST_BODY_CHARS
  ) {
    return { text: '', tooLarge: true };
  }

  const text = await req.text();
  if (text.length > MAX_REQUEST_BODY_CHARS) {
    return { text, tooLarge: true };
  }
  return { text, tooLarge: false };
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

    const { text, tooLarge } = await readBody(req);
    if (tooLarge) {
      return Response.json({ error: 'Request body too large' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = text.length > 0 ? JSON.parse(text) : {};
    } catch {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const parsedBody = schema.safeParse(body);
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
