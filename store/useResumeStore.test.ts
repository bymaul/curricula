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

describe('useResumeStore import & backup', () => {
  it('imports shared data as a new active resume', () => {
    getState().createResume();
    getState().importResumeData(
      makeData({ name: 'Grace Hopper' }),
      'Grace Hopper',
    );

    const resume = activeResume();
    expect(resume.title).toBe('Grace Hopper');
    expect(resume.data.name).toBe('Grace Hopper');
    expect(resume.autoTitle).toBe(true);
    expect(getHistory().entries).toHaveLength(1);
    expect(getHistory().entries[0].data).toEqual(
      makeData({ name: 'Grace Hopper' }),
    );
  });

  it('uses an explicit title when importing', () => {
    getState().createResume();
    getState().importResumeData(
      makeData({ name: 'Grace Hopper' }),
      'Shared CV',
    );
    expect(activeResume().title).toBe('Shared CV');
    expect(activeResume().data.name).toBe('Grace Hopper');
  });

  it('restores a backup and reseeds history for every resume', () => {
    getState().createResume();
    const originalId = activeId();
    const backup: ResumeRecord[] = [
      {
        id: 'r1',
        title: 'Resume A',
        data: makeData({ jobTitle: 'A' }),
        sectionOrder: [...DEFAULT_SECTION_ORDER],
        hiddenSections: ['skills'],
        language: 'en',
        photo: '',
        autoTitle: false,
        updatedAt: 1000,
      },
      {
        id: 'r2',
        title: 'Resume B',
        data: makeData({ jobTitle: 'B' }),
        sectionOrder: [...DEFAULT_SECTION_ORDER],
        hiddenSections: [],
        language: 'en',
        photo: '',
        autoTitle: true,
        updatedAt: 2000,
      },
    ];
    const revisionBefore = getState().revision;

    getState().restoreBackup(backup, 'r2');

    expect(getState().resumes.map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(getState().activeId).toBe('r2');
    expect(getState().histories['r1'].entries).toHaveLength(1);
    expect(getState().histories['r2'].entries).toHaveLength(1);
    expect(getState().histories['r2'].entries[0].data).toEqual(
      makeData({ jobTitle: 'B' }),
    );
    expect(getState().histories[originalId]).toBeUndefined();
    expect(getState().revision).toBe(revisionBefore + 1);
  });

  it('falls back to the first resume when the stored active id is missing', () => {
    getState().createResume();
    getState().restoreBackup(
      [
        {
          id: 'r1',
          title: 'Resume A',
          data: makeData(),
          sectionOrder: [...DEFAULT_SECTION_ORDER],
          hiddenSections: [],
          language: 'en',
          photo: '',
          autoTitle: true,
          updatedAt: 1000,
        },
      ],
      'missing',
    );

    expect(getState().activeId).toBe('r1');
    expect(getState().revision).toBeGreaterThan(0);
  });

  it('ignores an empty backup', () => {
    getState().createResume();
    const resumesBefore = getState().resumes;
    const revisionBefore = getState().revision;

    getState().restoreBackup([], null);

    expect(getState().resumes).toBe(resumesBefore);
    expect(getState().revision).toBe(revisionBefore);
  });
});

describe('useResumeStore language & photo', () => {
  it('defaults new resumes to English with no photo', () => {
    getState().createResume();
    expect(activeResume().language).toBe('en');
    expect(activeResume().photo).toBe('');
  });

  it('imports shared data with language and photo options', () => {
    getState().createResume();
    getState().importResumeData(
      makeData({ name: 'Grace Hopper' }),
      'Shared CV',
      { language: 'id', photo: 'data:image/jpeg;base64,Zm9v' },
    );

    const resume = activeResume();
    expect(resume.language).toBe('id');
    expect(resume.photo).toBe('data:image/jpeg;base64,Zm9v');
    expect(resume.data.name).toBe('Grace Hopper');
  });

  it('sets the resume language without creating history', () => {
    getState().createResume();
    const id = activeId();
    const historyBefore = getHistory().entries;

    getState().setResumeLanguage(id, 'id');

    expect(activeResume().language).toBe('id');
    expect(activeResume().updatedAt).toBeGreaterThan(0);
    expect(getHistory().entries).toBe(historyBefore);
  });

  it('sets the resume photo without creating history', () => {
    getState().createResume();
    const id = activeId();
    const photo = 'data:image/webp;base64,AAAA';

    getState().setResumePhoto(id, photo);

    expect(activeResume().photo).toBe(photo);
    expect(getHistory().entries).toHaveLength(1);
  });

  it('does not rewrite the resume when the value is unchanged', () => {
    getState().createResume();
    const id = activeId();
    const updatedAt = activeResume().updatedAt;

    getState().setResumeLanguage(id, 'en');
    getState().setResumePhoto(id, '');

    expect(activeResume().updatedAt).toBe(updatedAt);
  });

  it('backfills language and photo for legacy persisted resumes', () => {
    getState().createResume();
    const id = activeId();
    const legacy = getState().resumes.map((r) => ({
      id: r.id,
      title: r.title,
      data: r.data,
      sectionOrder: r.sectionOrder,
      hiddenSections: r.hiddenSections,
      autoTitle: r.autoTitle,
      updatedAt: r.updatedAt,
    }));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { resumes: legacy, activeId: id }, version: 0 }),
    );

    useResumeStore.persist.rehydrate();

    const resumed = useResumeStore.getState().resumes.find((r) => r.id === id);
    expect(resumed?.language).toBe('en');
    expect(resumed?.photo).toBe('');
  });
});
