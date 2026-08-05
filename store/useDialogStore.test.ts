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
];

beforeEach(() => {
  useDialogStore.setState({
    dialogs: Object.fromEntries(ALL_KEYS.map((key) => [key, false])) as Record<
      DialogKey,
      boolean
    >,
  });
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
});
