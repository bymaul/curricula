import { useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { CVData } from '@/lib/schema';
import { AIAdjustScope, AIProvider } from '@/lib/consts';
import type { CVImagePart } from '@/lib/cvParsing';
import { parseResponseJSON, RateLimitError } from '@/lib/request';

const ADJUST_TIMEOUT_MS = 55_000;

interface AIAdjustParams {
  cvData: CVData;
  jobDescription: string;
  provider: AIProvider;
  modelName?: string;
  apiKey?: string;
  scope?: AIAdjustScope;
  images?: CVImagePart[];
}

export interface AIAdjustResult {
  data: CVData;
  warnings: string[];
}

export function useAIAdjustCV() {
  const { t } = useI18n();
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adjustCV = async (
    params: AIAdjustParams,
  ): Promise<AIAdjustResult | null> => {
    setIsAdjusting(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ADJUST_TIMEOUT_MS);

    try {
      const response = await fetch('/api/adjust-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      return await parseResponseJSON<AIAdjustResult>(response);
    } catch (err) {
      if (controller.signal.aborted) {
        setError(t('aiAdjust.timeoutError'));
      } else if (err instanceof RateLimitError) {
        setError(t('aiAdjust.rateLimited', { seconds: err.retryAfterSeconds }));
      } else {
        setError(
          err instanceof Error ? err.message : t('aiAdjust.unexpectedError'),
        );
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      setIsAdjusting(false);
    }
  };

  return { isAdjusting, error, adjustCV };
}
