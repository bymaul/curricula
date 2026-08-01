import { useState } from 'react';
import { CVData } from '@/lib/schema';
import { AIProvider } from '@/lib/consts';
import { parseResponseJSON } from '@/lib/request';

interface AIAdjustParams {
    cvData: CVData;
    jobDescription: string;
    provider: AIProvider;
    modelName?: string;
    apiKey: string;
}

export function useAIAdjustCV() {
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const adjustCV = async (params: AIAdjustParams): Promise<CVData | null> => {
        setIsAdjusting(true);
        setError(null);

        try {
            const response = await fetch('/api/adjust-cv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            return await parseResponseJSON<CVData>(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unexpected error while adjusting CV');
            return null;
        } finally {
            setIsAdjusting(false);
        }
    };

    return { isAdjusting, error, adjustCV };
}
