import { describe, expect, it } from 'vitest';
import { useImportStore } from '@/store/useImportStore';

describe('useImportStore', () => {
  it('starts empty', () => {
    expect(useImportStore.getState().pendingImport).toBeNull();
  });

  it('stores a pending import', () => {
    const pending = { data: { name: 'Ada' } as never, warnings: ['x'] };
    useImportStore.getState().setPendingImport(pending);
    expect(useImportStore.getState().pendingImport).toBe(pending);
  });

  it('clears the pending import', () => {
    useImportStore.getState().setPendingImport({
      data: {} as never,
      warnings: [],
    });
    useImportStore.getState().clearPendingImport();
    expect(useImportStore.getState().pendingImport).toBeNull();
  });
});
