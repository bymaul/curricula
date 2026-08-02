import { useEffect, useState } from 'react';
import { AIProvider } from '@/lib/consts';

export interface AIStatus {
  hasBundledKey: boolean;
  provider: AIProvider;
  defaultModel: string;
}

export function useAIStatus(enabled: boolean) {
  const [status, setStatus] = useState<AIStatus | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    fetch('/api/ai-status')
      .then((response) => {
        if (!response.ok) throw new Error(`status ${response.status}`);
        return response.json() as Promise<AIStatus>;
      })
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return status;
}
