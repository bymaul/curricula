import { create } from 'zustand';

export type DialogKey =
  | 'aiAdjust'
  | 'aiSettings'
  | 'resumes'
  | 'sections'
  | 'history'
  | 'share'
  | 'backup';

interface DialogState {
  dialogs: Record<DialogKey, boolean>;
  setDialog: (key: DialogKey, isOpen: boolean) => void;
}

const INITIAL_DIALOGS: Record<DialogKey, boolean> = {
  aiAdjust: false,
  aiSettings: false,
  resumes: false,
  sections: false,
  history: false,
  share: false,
  backup: false,
};

export const useDialogStore = create<DialogState>()((set) => ({
  dialogs: INITIAL_DIALOGS,
  setDialog: (key, isOpen) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [key]: isOpen },
    })),
}));
