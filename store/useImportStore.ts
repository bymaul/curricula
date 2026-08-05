import { create } from 'zustand';
import { CVData } from '@/lib/schema';

export interface PendingImport {
  data: CVData;
  warnings: string[];
}

interface ImportState {
  pendingImport: PendingImport | null;
  setPendingImport: (pending: PendingImport) => void;
  clearPendingImport: () => void;
}

export const useImportStore = create<ImportState>()((set) => ({
  pendingImport: null,
  setPendingImport: (pendingImport) => set({ pendingImport }),
  clearPendingImport: () => set({ pendingImport: null }),
}));
