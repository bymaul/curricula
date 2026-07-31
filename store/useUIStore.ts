import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIProvider } from '@/lib/consts';

interface UIState {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    aiProvider: AIProvider;
    aiModel: string;
    setAIPrefs: (provider: AIProvider, model: string) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            activeTab: 'Personal',
            setActiveTab: (tab) => set({ activeTab: tab }),
            aiProvider: 'openai',
            aiModel: '',
            setAIPrefs: (aiProvider, aiModel) => set({ aiProvider, aiModel }),
        }),
        {
            name: 'curricula-ui-state',
        },
    ),
);
