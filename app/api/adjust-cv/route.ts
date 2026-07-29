import { generateText, Output } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { cvSchema } from '@/lib/schema';
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

        let model;

        switch (provider) {
            case 'anthropic':
                model = createAnthropic({ apiKey })(modelName || 'claude-3-5-sonnet-latest');
                break;
            case 'google':
                model = createGoogleGenerativeAI({ apiKey })(modelName || 'gemini-2.5-flash');
                break;
            case 'openai':
            default:
                model = createOpenAI({ apiKey })(modelName || 'gpt-4o-mini');
                break;
        }

        const systemPrompt = `You are an expert ATS resume writer. Rewrite the provided CV to align strictly with the Job Description. Output ONLY a valid JSON object matching the requested schema. Ensure bullet points are impactful, metric-driven, and without fluff.`;

        const { output } = await generateText({
            model,
            system: systemPrompt,
            prompt: `CV Data: ${JSON.stringify(cvData)}\n\nJob Description: ${jobDescription}`,
            output: Output.object({ schema: cvSchema }),
            maxRetries: 0,
        });

        return Response.json(output);
    } catch (error: unknown) {
        const err = error as {
            statusCode?: number;
            message?: string;
        };
        console.error('AI Error:', error);

        if (err?.statusCode === 429 || err?.message?.includes('429')) {
            return new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded for this free API key. Please wait a moment and try again.',
                }),
                { status: 429 },
            );
        }

        return new Response(JSON.stringify({ error: err.message || 'Error processing AI request' }), { status: 500 });
    }
}
