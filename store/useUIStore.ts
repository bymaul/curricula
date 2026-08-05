import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIProvider, TabName } from '@/lib/consts';

interface UIState {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
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
