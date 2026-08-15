import { useEffect, useState } from 'react';
import { AIProvider } from '@/lib/consts';

export interface AIStatus {
  hasBundledKey: boolean;
  provider: AIProvider;
  defaultModel: string;
}

export function useAIStatus(enabled: boolean) {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    fetch('/api/ai-status')
      .then((response) => {
        if (!response.ok) throw new Error(`status ${response.status}`);
        return response.json() as Promise<AIStatus>;
      })
      .then((data) => {
        if (!cancelled) {
          setStatus(data);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus(null);
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { status, error };
}
