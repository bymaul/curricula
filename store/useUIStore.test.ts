import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from '@/store/useUIStore';

const STORAGE_KEY = 'curricula-ui-state';

beforeEach(() => {
  useUIStore.setState({
    activeTab: 'personal',
    aiProvider: 'google',
    aiModel: '',
    scale: null,
    uiLanguage: 'en',
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
    useUIStore.getState().setActiveTab('experience');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.state.scale).toBeUndefined();
    expect(stored.state.activeTab).toBe('experience');
  });
});

describe('useUIStore UI language', () => {
  it('defaults to English', () => {
    expect(useUIStore.getState().uiLanguage).toBe('en');
  });

  it('sets the UI language', () => {
    useUIStore.getState().setUILanguage('id');
    expect(useUIStore.getState().uiLanguage).toBe('id');
  });

  it('persists the UI language to localStorage', () => {
    useUIStore.getState().setUILanguage('id');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.state.uiLanguage).toBe('id');
  });
});
