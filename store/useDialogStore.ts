import { create } from 'zustand';

export type DialogKey =
  | 'aiAdjust'
  | 'aiSettings'
  | 'resumes'
  | 'sections'
  | 'history'
  | 'share'
  | 'backup'
  | 'shortcuts'
  | 'palette';

interface DialogState {
  dialogs: Record<DialogKey, boolean>;
  everOpened: Record<DialogKey, boolean>;
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
  shortcuts: false,
  palette: false,
};

export const useDialogStore = create<DialogState>()((set) => ({
  dialogs: INITIAL_DIALOGS,
  everOpened: { ...INITIAL_DIALOGS },
  setDialog: (key, isOpen) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [key]: isOpen },
      everOpened: isOpen
        ? { ...state.everOpened, [key]: true }
        : state.everOpened,
    })),
}));
