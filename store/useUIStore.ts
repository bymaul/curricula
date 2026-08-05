import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIProvider } from '@/lib/consts';

interface UIState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  aiProvider: AIProvider;
  aiModel: string;
  setAIPrefs: (provider: AIProvider, model: string) => void;
  scale: number | null;
  setScale: (scale: number | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: 'Personal',
      setActiveTab: (tab) => set({ activeTab: tab }),
      aiProvider: 'google',
      aiModel: '',
      setAIPrefs: (aiProvider, aiModel) => set({ aiProvider, aiModel }),
      scale: null,
      setScale: (scale) => set({ scale }),
    }),
    {
      name: 'curricula-ui-state',
      partialize: (state) => ({
        activeTab: state.activeTab,
        aiProvider: state.aiProvider,
        aiModel: state.aiModel,
      }),
    },
  ),
);
