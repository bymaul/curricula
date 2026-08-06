import { useState } from 'react';
import {
  AI_API_KEY_STORAGE_KEY,
  AIProvider,
  getStoredAIAPIKey,
} from '@/lib/consts';
import { useUIStore } from '@/store/useUIStore';

export function useAISettings() {
  const { aiProvider, aiModel, setAIPrefs } = useUIStore();
  const [apiKey, setApiKey] = useState(() => getStoredAIAPIKey());

  const onProviderChange = (value: AIProvider | null) => {
    if (value) {
      setAIPrefs(value, '');
    }
  };

  const onModelChange = (value: string) => {
    setAIPrefs(aiProvider, value);
  };

  const onKeyChange = (value: string) => {
    setApiKey(value);
    if (value.trim()) {
      localStorage.setItem(AI_API_KEY_STORAGE_KEY, value.trim());
    } else {
      localStorage.removeItem(AI_API_KEY_STORAGE_KEY);
    }
  };

  return {
    provider: aiProvider,
    modelName: aiModel,
    apiKey,
    onProviderChange,
    onModelChange,
    onKeyChange,
  };
}
