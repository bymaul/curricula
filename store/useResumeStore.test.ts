import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SECTION_ORDER } from '@/lib/consts';
import { CVData } from '@/lib/schema';
import { ResumeRecord, useResumeStore } from '@/store/useResumeStore';

const STORAGE_KEY = 'curricula-resumes';

function makeData(overrides: Partial<CVData> = {}): CVData {
  return {
    name: 'Ada Lovelace',
    jobTitle: 'Analytical Engineer',
    email: 'ada@example.com',
    phone: '+44 000 000 000',
    location: 'London',
    links: [],
    summary: 'Mathematician and early computer pioneer.',
    experience: [],
    projects: [],
    education: [],
    skills: [],
    certifications: [],
    ...overrides,
  };
}

function getState() {
  return useResumeStore.getState();
}

function activeId(): string {
  return getState().activeId!;
}

function activeResume(): ResumeRecord {
  return getState().resumes.find((r) => r.id === getState().activeId)!;
}

function getHistory() {
  return getState().histories[getState().activeId!];
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  useResumeStore.setState({
    resumes: [],
    activeId: null,
    histories: {},
    revision: 0,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useResumeStore history', () => {
  it('seeds an initial history entry on create', () => {
    getState().createResume();
    const history = getHistory();
    expect(history.entries).toHaveLength(1);
    expect(history.cursor).toBe(0);
    expect(history.entries[0].data).toEqual({
      name: '',
      jobTitle: '',
      email: '',
      phone: '',
      location: '',
      links: [],
      summary: '',
      experience: [],
      projects: [],
      education: [],
      skills: [],
      certifications: [],
    });
  });

  it('records distinct data changes as separate entries', () => {
    getState().createResume();
    const id = activeId();
    getState().updateResumeData(id, makeData({ jobTitle: 'A' }));
    vi.advanceTimersByTime(5000);
    getState().updateResumeData(id, makeData({ jobTitle: 'B' }));

    const history = getHistory();
    expect(history.entries.map((e) => e.data.jobTitle)).toEqual(['', 'A', 'B']);
    expect(history.cursor).toBe(2);
  });

  it('coalesces rapid consecutive changes into a single entry', () => {
    getState().createResume();
    const id = activeId();
    getState().updateResumeData(id, makeData({ jobTitle: 'A' }));
    getState().updateResumeData(id, makeData({ jobTitle: 'B' }));

    const history = getHistory();
    expect(history.entries.map((e) => e.data.jobTitle)).toEqual(['', 'B']);
    expect(history.cursor).toBe(1);
  });

  it('keeps the initial entry distinct from the first edit', () => {
    getState().createResume();
    const id = activeId();
    getState().updateResumeData(id, makeData());

    const history = getHistory();
    expect(history.entries).toHaveLength(2);
    expect(history.entries[0].data.jobTitle).toBe('');
    expect(history.entries[1].data).toEqual(makeData());
  });

  it('ignores no-op data updates', () => {
    getState().createResume();
    const id = activeId();
    getState().updateResumeData(id, makeData({ jobTitle: 'A' }));
    vi.advanceTimersByTime(5000);
    const before = getHistory().entries.length;
    const updatedAtBefore = activeResume().updatedAt;

    getState().updateResumeData(id, { ...makeData({ jobTitle: 'A' }) });

    expect(getHistory().entries).toHaveLength(before);
    expect(activeResume().data.jobTitle).toBe('A');
    expect(activeResume().updatedAt).toBe(updatedAtBefore);
  });

  it('caps history entries at the maximum', () => {
    getState().createResume();
    const id = activeId();
    for (let i = 0; i < 110; i++) {
      vi.advanceTimersByTime(5000);
      getState().updateResumeData(id, makeData({ jobTitle: `v${i}` }));
    }
    const history = getHistory();
    expect(history.entries).toHaveLength(100);
    expect(history.entries[99].data.jobTitle).toBe('v109');
    expect(history.cursor).toBe(99);
  });

  it('undo restores the previous data and bumps revision', () => {
    getState().createResume();
    const id = activeId();
    getState().updateResumeData(id, makeData({ jobTitle: 'A' }));
    vi.advanceTimersByTime(5000);
    getState().updateResumeData(id, makeData({ jobTitle: 'B' }));
    const revisionBefore = getState().revision;

    getState().undo();
    expect(activeResume().data.jobTitle).toBe('A');
    expect(getState().revision).toBe(revisionBefore + 1);

    getState().undo();
    expect(activeResume().data.jobTitle).toBe('');
    expect(getState().revision).toBe(revisionBefore + 2);

    getState().undo();
    expect(activeResume().data.jobTitle).toBe('');
    expect(getState().revision).toBe(revisionBefore + 2);
  });

  it('redo steps forward through history', () => {
    getState().createResume();
    const id = activeId();
    getState().updateResumeData(id, makeData({ jobTitle: 'A' }));
    vi.advanceTimersByTime(5000);
    getState().updateResumeData(id, makeData({ jobTitle: 'B' }));
    getState().undo();
    getState().undo();
    const revisionBefore = getState().revision;

    getState().redo();
    expect(activeResume().data.jobTitle).toBe('A');
    expect(getState().revision).toBe(revisionBefore + 1);

    getState().redo();
    expect(activeResume().data.jobTitle).toBe('B');

    getState().redo();
    expect(activeResume().data.jobTitle).toBe('B');
    expect(getState().revision).toBe(revisionBefore + 2);
  });

  it('clears redo history when a new change is made after undo', () => {
    getState().createResume();
    const id = activeId();
    getState().updateResumeData(id, makeData({ jobTitle: 'A' }));
    vi.advanceTimersByTime(5000);
    getState().updateResumeData(id, makeData({ jobTitle: 'B' }));
    getState().undo();
    vi.advanceTimersByTime(5000);
    getState().updateResumeData(id, makeData({ jobTitle: 'C' }));

    const history = getHistory();
    expect(history.entries.map((e) => e.data.jobTitle)).toEqual(['', 'A', 'C']);
    expect(history.cursor).toBe(history.entries.length - 1);
    expect(activeResume().data.jobTitle).toBe('C');
  });

  it('undo restores section order and visibility', () => {
    getState().createResume();
    const defaultOrder = [...DEFAULT_SECTION_ORDER];
    getState().toggleSectionVisibility('skills');
    vi.advanceTimersByTime(5000);
    getState().moveSection(1, 3);

    getState().undo();
    expect(activeResume().sectionOrder).toEqual(defaultOrder);
    expect(activeResume().hiddenSections).toContain('skills');

    getState().undo();
    expect(activeResume().sectionOrder).toEqual(defaultOrder);
    expect(activeResume().hiddenSections).toEqual([]);

    getState().redo();
    expect(activeResume().hiddenSections).toContain('skills');
  });

  it('restores a specific history entry', () => {
    getState().createResume();
    const id = activeId();
    getState().updateResumeData(id, makeData({ jobTitle: 'A' }));
    vi.advanceTimersByTime(5000);
    getState().updateResumeData(id, makeData({ jobTitle: 'B' }));
    const revisionBefore = getState().revision;

    getState().restoreHistory(id, 0);
    expect(activeResume().data.jobTitle).toBe('');
    expect(getState().revision).toBe(revisionBefore + 1);

    getState().restoreHistory(id, 0);
    expect(getState().revision).toBe(revisionBefore + 1);
  });

  it('seeds history for duplicated resumes', () => {
    getState().createResume();
    const id = activeId();
    getState().updateResumeData(id, makeData());
    vi.advanceTimersByTime(5000);
    getState().duplicateResume(id);

    const history = getHistory();
    expect(history.entries).toHaveLength(1);
    expect(history.entries[0].data).toEqual(makeData());
  });

  it('seeds history when switching to a resume without one', () => {
    getState().createResume();
    const first = activeId();
    getState().updateResumeData(first, makeData({ jobTitle: 'A' }));
    vi.advanceTimersByTime(5000);
    getState().createResume();
    const second = activeId();
    getState().updateResumeData(second, makeData({ jobTitle: 'B' }));

    getState().setActiveResume(first);
    expect(activeResume().data.jobTitle).toBe('A');
    expect(getHistory().entries.map((e) => e.data.jobTitle)).toEqual(['', 'A']);

    getState().setActiveResume(second);
    expect(activeResume().data.jobTitle).toBe('B');
    expect(getHistory().entries.map((e) => e.data.jobTitle)).toEqual(['', 'B']);

    getState().undo();
    expect(activeResume().data.jobTitle).toBe('');
  });

  it('drops history when a resume is deleted', () => {
    getState().createResume();
    const first = activeId();
    getState().createResume();
    const second = activeId();
    getState().updateResumeData(second, makeData({ jobTitle: 'B' }));

    expect(getState().histories[second]).toBeDefined();
    getState().deleteResume(second);

    expect(getState().histories[second]).toBeUndefined();
    expect(getState().activeId).toBe(first);
  });

  it('does not persist history or revision', () => {
    getState().createResume();
    const id = activeId();
    getState().updateResumeData(id, makeData({ jobTitle: 'A' }));
    getState().undo();

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.state).toHaveProperty('resumes');
    expect(persisted.state).toHaveProperty('activeId');
    expect(persisted.state).not.toHaveProperty('histories');
    expect(persisted.state).not.toHaveProperty('revision');
  });
});
