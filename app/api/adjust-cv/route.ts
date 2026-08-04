import {
  aiErrorResponse,
  createAIModel,
  resolveAIKey,
  resolveAIModel,
} from '@/lib/ai';
import { sanitizeJSON, stripInvisibleChars } from '@/lib/cleanText';
import {
  MAX_CV_IMAGE_BASE64_CHARS,
  MAX_CV_IMAGES,
  adjustCVWithRepair,
} from '@/lib/cvParsing';
import { parseEnv } from '@/lib/env';
import { clientIP, rateLimitResponse, rateLimitStatus } from '@/lib/rateLimit';
import { cvSchema } from '@/lib/schema';
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
    cvData: cvSchema,
    jobDescription: z.string().max(10000, 'Job description too long'),
    provider: z
      .enum(['openai', 'anthropic', 'google'])
      .default(parseEnv().provider),
    modelName: z.string().optional(),
    apiKey: z.string().min(10, 'Invalid API Key').optional(),
    scope: z
      .enum([
        'full',
        'summary',
        'experience',
        'projects',
        'education',
        'skills',
      ])
      .default('full'),
    images: z.array(imageSchema).max(MAX_CV_IMAGES).optional(),
  })
  .refine(
    (body) =>
      body.jobDescription.trim().length > 0 || (body.images?.length ?? 0) > 0,
    { message: 'Provide a job description or job description image(s)' },
  );

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
    const { cvData, jobDescription, provider, apiKey, scope, images } =
      parsedBody.data;

    const cleanCVData = sanitizeJSON(cvData);
    const cleanJobDescription = stripInvisibleChars(jobDescription);

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

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume writer. Rewrite the provided CV to align strictly with the Job Description while remaining honest to the candidate's original information.

CRITICAL RULES:
1. Output ONLY a valid JSON object matching the requested schema. No explanations, no markdown code fences.
2. Descriptions (experience, projects, education) MUST be formatted as bullet points. Separate each bullet with a newline and prefix each one with "- ". Use 3-6 concise, achievement-oriented bullets per entry.
3. Prioritize keywords and exact phrases from the Job Description, woven naturally into bullet points and the summary.
4. Make every bullet impactful and metric-driven (e.g. "Reduced load time by 40%", "Led a team of 5"). Include numbers, percentages, and tangible outcomes when the source CV supports it. Never fabricate metrics not implied by the source.
5. Start bullets with strong action verbs (Led, Built, Improved, Spearheaded, Optimized, Delivered...). Vary the verbs; never repeat the same opener in a bullet list.
6. Avoid fluff, vague claims, filler words, pronouns ("I", "we"), and redundant phrasing.
7. Keep each bullet under ~25 words and scannable for a recruiter skimming in 30 seconds.
8. Tailor the summary (2-3 sentences) to mirror the Job Description's seniority level, title, and core requirements.
9. Preserve all factual details: company names, institutions, dates, certifications, locations, and contact info must remain unchanged.
10. Do not pad sections that are empty in the source CV — leave empty arrays as empty arrays.
11. If the job description is provided as image(s), read the text visible in each image carefully.`;

    const { data, warnings } = await adjustCVWithRepair({
      model,
      system: systemPrompt,
      cvData: cleanCVData,
      jobDescription: cleanJobDescription,
      imageParts: images?.length ? images : undefined,
      scope,
    });

    return Response.json({ data, warnings });
  } catch (error: unknown) {
    return aiErrorResponse(error);
  }
}
