import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            activeTab: 'Personal',
            setActiveTab: (tab) => set({ activeTab: tab }),
        }),
        {
            name: 'curricula-ui-state',
        },
    ),
);
