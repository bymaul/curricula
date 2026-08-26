import { beforeEach, describe, expect, it } from 'vitest';
import { DialogKey, useDialogStore } from '@/store/useDialogStore';

const ALL_KEYS: DialogKey[] = [
  'aiAdjust',
  'aiSettings',
  'resumes',
  'sections',
  'history',
  'share',
  'backup',
  'shortcuts',
];

function allFalse(): Record<DialogKey, boolean> {
  return Object.fromEntries(ALL_KEYS.map((key) => [key, false])) as Record<
    DialogKey,
    boolean
  >;
}

beforeEach(() => {
  useDialogStore.setState({ dialogs: allFalse(), everOpened: allFalse() });
});

describe('useDialogStore', () => {
  it('starts with every dialog closed', () => {
    const { dialogs } = useDialogStore.getState();
    for (const key of ALL_KEYS) {
      expect(dialogs[key]).toBe(false);
    }
  });

  it('opens and closes a dialog', () => {
    useDialogStore.getState().setDialog('share', true);
    expect(useDialogStore.getState().dialogs.share).toBe(true);

    useDialogStore.getState().setDialog('share', false);
    expect(useDialogStore.getState().dialogs.share).toBe(false);
  });

  it('leaves other dialogs untouched when toggling one', () => {
    useDialogStore.getState().setDialog('aiAdjust', true);
    const { dialogs } = useDialogStore.getState();
    for (const key of ALL_KEYS) {
      expect(dialogs[key]).toBe(key === 'aiAdjust');
    }
  });

  it('records everOpened when a dialog opens and keeps it after closing', () => {
    expect(useDialogStore.getState().everOpened.resumes).toBe(false);

    useDialogStore.getState().setDialog('resumes', true);
    expect(useDialogStore.getState().everOpened.resumes).toBe(true);

    useDialogStore.getState().setDialog('resumes', false);
    expect(useDialogStore.getState().dialogs.resumes).toBe(false);
    expect(useDialogStore.getState().everOpened.resumes).toBe(true);
  });

  it('does not change everOpened when closing an unopened dialog', () => {
    useDialogStore.getState().setDialog('share', false);
    expect(useDialogStore.getState().everOpened).toEqual(allFalse());
  });
});
