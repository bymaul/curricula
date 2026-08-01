import { useState } from 'react';
import {
  AI_API_KEY_STORAGE_KEY,
  AIProvider,
  getStoredAIAPIKey,
} from '@/lib/consts';
import { useUIStore } from '@/store/useUIStore';

export function useAISettings() {
  const { aiProvider, aiModel, setAIPrefs } = useUIStore();
  const [provider, setProvider] = useState<AIProvider>(aiProvider);
  const [modelName, setModelName] = useState(aiModel);
  const [apiKey, setApiKey] = useState(() => getStoredAIAPIKey());

  const onProviderChange = (value: AIProvider | null) => {
    if (value) {
      setProvider(value);
      setModelName('');
      setAIPrefs(value, '');
    }
  };

  const onModelChange = (value: string) => {
    setModelName(value);
    setAIPrefs(provider, value);
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
    provider,
    modelName,
    apiKey,
    onProviderChange,
    onModelChange,
    onKeyChange,
  };
}
