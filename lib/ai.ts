import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { AIProvider, AI_PROVIDERS } from '@/lib/consts';

export function createAIModel(provider: AIProvider, apiKey: string, modelName?: string) {
    switch (provider) {
        case 'anthropic':
            return createAnthropic({ apiKey })(modelName || AI_PROVIDERS[1].defaultModel);
        case 'google':
            return createGoogleGenerativeAI({ apiKey })(modelName || AI_PROVIDERS[2].defaultModel);
        case 'openai':
        default:
            return createOpenAI({ apiKey })(modelName || AI_PROVIDERS[0].defaultModel);
    }
}

export function aiErrorResponse(error: unknown): Response {
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
