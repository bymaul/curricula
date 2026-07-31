import { generateText, Output } from 'ai';
import { cvSchema } from '@/lib/schema';
import { aiErrorResponse, createAIModel } from '@/lib/ai';
import z from 'zod';

export const runtime = 'edge';

const requestSchema = z.object({
    cvData: cvSchema,
    jobDescription: z.string().max(10000, 'Job description too long'),
    provider: z.enum(['openai', 'anthropic', 'google']).default('openai'),
    modelName: z.string().optional(),
    apiKey: z.string().min(10, 'Invalid API Key'),
});

export async function POST(req: Request) {
    try {
        const parsedBody = requestSchema.safeParse(await req.json());
        if (!parsedBody.success) {
            return Response.json({ error: 'Invalid payload', details: parsedBody.error }, { status: 400 });
        }
        const { cvData, jobDescription, provider, modelName, apiKey } = parsedBody.data;

        const model = createAIModel(provider, apiKey, modelName);

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
10. Do not pad sections that are empty in the source CV — leave empty arrays as empty arrays.`;

        const { output } = await generateText({
            model,
            system: systemPrompt,
            prompt: `CV Data: ${JSON.stringify(cvData)}\n\nJob Description: ${jobDescription}`,
            output: Output.object({ schema: cvSchema }),
            maxRetries: 0,
        });

        return Response.json(output);
    } catch (error: unknown) {
        return aiErrorResponse(error);
    }
}
