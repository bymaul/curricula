import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from '@/store/useUIStore';

const STORAGE_KEY = 'curricula-ui-state';

beforeEach(() => {
  useUIStore.setState({
    activeTab: 'Personal',
    aiProvider: 'google',
    aiModel: '',
    scale: null,
  });
  localStorage.clear();
});

describe('useUIStore zoom scale', () => {
  it('starts unset', () => {
    expect(useUIStore.getState().scale).toBeNull();
  });

  it('sets and resets the scale', () => {
    useUIStore.getState().setScale(0.75);
    expect(useUIStore.getState().scale).toBe(0.75);

    useUIStore.getState().setScale(null);
    expect(useUIStore.getState().scale).toBeNull();
  });

  it('does not persist scale to localStorage', () => {
    useUIStore.getState().setScale(0.75);
    useUIStore.getState().setActiveTab('Experience');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.state.scale).toBeUndefined();
    expect(stored.state.activeTab).toBe('Experience');
  });
});
