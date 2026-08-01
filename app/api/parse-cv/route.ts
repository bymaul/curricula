import {
  aiErrorResponse,
  createAIModel,
  resolveAIKey,
  resolveAIModel,
} from '@/lib/ai';
import { stripInvisibleChars } from '@/lib/cleanText';
import {
  MAX_CV_IMAGE_BASE64_CHARS,
  MAX_CV_IMAGES,
  normalizeCVText,
  parseCVWithRepair,
} from '@/lib/cvParsing';
import { clientIP, rateLimitResponse, rateLimitStatus } from '@/lib/rateLimit';
import z from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60;

const supportedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const imageSchema = z
  .object({
    data: z.string().min(1),
    mimeType: z.string().refine((v) => supportedMimeTypes.has(v)),
  })
  .refine((img) => img.data.length <= MAX_CV_IMAGE_BASE64_CHARS, {
    message: 'Image too large',
  });

const requestSchema = z
  .object({
    cvText: z.string().optional(),
    provider: z.enum(['openai', 'anthropic', 'google']).default('google'),
    modelName: z.string().optional(),
    apiKey: z.string().min(10, 'Invalid API Key').optional(),
    images: z.array(imageSchema).max(MAX_CV_IMAGES).optional(),
  })
  .refine((body) => !!body.cvText?.trim() || (body.images?.length ?? 0) > 0, {
    message: 'Provide resume text or page images',
  });

export async function POST(req: Request) {
  try {
    const ip = clientIP(req);
    const { limited, retryAfterSeconds } = rateLimitStatus(ip);
    if (limited) return rateLimitResponse(retryAfterSeconds);

    const parsedBody = requestSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return Response.json(
        { error: 'Invalid payload', details: parsedBody.error },
        { status: 400 },
      );
    }
    const { cvText, provider, apiKey, images } = parsedBody.data;

    const cleanCVText = normalizeCVText(stripInvisibleChars(cvText ?? ''));

    const key = resolveAIKey(apiKey);
    if (!key) {
      return Response.json(
        { error: 'AI is not configured. Add an API key in AI Settings.' },
        { status: 400 },
      );
    }

    const model = createAIModel(
      provider,
      key,
      resolveAIModel(parsedBody.data.modelName),
    );

    const systemPrompt = `You are an expert resume parser. Extract structured data from the provided resume and return it as a single valid JSON object matching the requested schema.

CRITICAL RULES:
1. Output ONLY a valid JSON object matching the requested schema. No explanations, no markdown code fences.
2. Preserve facts exactly as written: names, email, phone, URLs, company names, institutions, dates, locations, degree titles.
3. Description fields (experience, projects, education) MUST be formatted as bullet points. Separate each bullet with a newline and prefix each one with "- ". Use 1-5 concise bullets per entry based on the source text.
4. Experience entries: "role" is the job title, "company" is the employer. If either is missing, put the available line there and leave the other empty.
5. Projects: "name" is the project title, "description" its bullets.
6. Education: "degree" is the credential, "institution" the school.
7. Skills: preserve the resume's own category groupings when present (e.g. "Languages: ..." -> category "Languages"). If no categories exist, use a single entry with an empty category.
8. Certifications: "name", "issuer", and "date" (if shown).
9. Links: include only meaningful URLs (GitHub, LinkedIn, portfolio, email-derived are not links). Store the URL string without "http://" or "https://".
10. If a field cannot be found in the resume, leave it as an empty string (scalar) or empty array (list). Never invent content.
11. If the resume is provided as page images, carefully read the text visible in each image.`;

    const { data, warnings } = await parseCVWithRepair({
      model,
      system: systemPrompt,
      resumeText: cleanCVText,
      imageParts: images?.length ? images : undefined,
    });

    return Response.json({ data, warnings });
  } catch (error: unknown) {
    return aiErrorResponse(error);
  }
}
