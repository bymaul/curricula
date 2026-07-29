import { generateText, Output } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { cvSchema } from '@/lib/schema';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { cvData, jobDescription, provider, modelName, apiKey } = await req.json();

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API Key is required' }), { status: 401 });
        }

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
    } catch (error: any) {
        console.error('AI Error:', error);

        if (error?.statusCode === 429 || error?.message?.includes('429')) {
            return new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded for this free API key. Please wait a moment and try again.',
                }),
                { status: 429 },
            );
        }

        return new Response(JSON.stringify({ error: error.message || 'Error processing AI request' }), { status: 500 });
    }
}
