import { generateText, Output } from 'ai';
import { cvSchema } from '@/lib/schema';
import { aiErrorResponse, createAIModel } from '@/lib/ai';
import z from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60;

const requestSchema = z.object({
  cvText: z.string().min(1, 'Resume text is empty'),
  provider: z.enum(['openai', 'anthropic', 'google']).default('openai'),
  modelName: z.string().optional(),
  apiKey: z.string().min(10, 'Invalid API Key'),
});

export async function POST(req: Request) {
  try {
    const parsedBody = requestSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return Response.json(
        { error: 'Invalid payload', details: parsedBody.error },
        { status: 400 },
      );
    }
    const { cvText, provider, modelName, apiKey } = parsedBody.data;

    const model = createAIModel(provider, apiKey, modelName);

    const systemPrompt = `You are an expert resume parser. Extract structured data from the provided resume text and return it as a single valid JSON object matching the requested schema.

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
10. If a field cannot be found in the resume, leave it as an empty string (scalar) or empty array (list). Never invent content.`;

    const { output } = await generateText({
      model,
      system: systemPrompt,
      prompt: `Resume text to parse:\n\n${cvText}`,
      output: Output.object({ schema: cvSchema }),
      maxRetries: 0,
    });

    return Response.json(output);
  } catch (error: unknown) {
    return aiErrorResponse(error);
  }
}
