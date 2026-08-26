import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SECTION_ORDER } from '@/lib/consts';
import { DEFAULT_DESIGN } from '@/lib/design';
import { CVData } from '@/lib/schema';
import { resetStorageStateForTests } from '@/lib/storage';
import { usePhotoStore } from '@/store/usePhotoStore';
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

function firstCustomId(): string {
  return Object.keys(activeResume().data.customSections ?? {})[0];
}

function firstCustomTitle(): string {
  return Object.values(activeResume().data.customSections ?? {})[0].title;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  resetStorageStateForTests();
  usePhotoStore.setState({ photos: {} });
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
      customSections: {},
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

  it('isolates history snapshots from in-place mutations of the live data', () => {
    getState().createResume();
    const id = activeId();
    getState().updateResumeData(id, makeData());

    getState()
      .resumes.find((r) => r.id === id)!
      .data.experience.push({
        role: 'Mutated',
        company: 'Bad',
        date: '2026',
        description: 'Must not leak into history.',
      });

    getState().undo();

    expect(getHistory().entries[1].data.experience).toEqual([]);
    expect(activeResume().data.experience).toEqual([]);
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

  it('does not persist history, revision, or photos', () => {
    getState().createResume();
    const id = activeId();
    getState().updateResumeData(id, makeData({ jobTitle: 'A' }));
    getState().setResumePhoto(id, 'data:image/jpeg;base64,Zm9v');
    getState().undo();

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.state).toHaveProperty('resumes');
    expect(persisted.state).toHaveProperty('activeId');
    expect(persisted.state).not.toHaveProperty('histories');
    expect(persisted.state).not.toHaveProperty('revision');
    expect(persisted.state.resumes[0]).not.toHaveProperty('photo');
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
        templateId: 'harvard',
        design: { ...DEFAULT_DESIGN },
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
        templateId: 'harvard',
        design: { ...DEFAULT_DESIGN },
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
          templateId: 'harvard',
          design: { ...DEFAULT_DESIGN },
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

describe('useResumeStore language, photo & template', () => {
  it('defaults new resumes to English with no photo and the Harvard template', () => {
    getState().createResume();
    expect(activeResume().language).toBe('en');
    expect(activeResume().photo).toBe('');
    expect(activeResume().templateId).toBe('harvard');
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

  it('imports shared data with the template option', () => {
    getState().createResume();
    getState().importResumeData(
      makeData({ name: 'Grace Hopper' }),
      'Shared CV',
      { template: 'modern' },
    );

    const resume = activeResume();
    expect(resume.templateId).toBe('modern');
    expect(resume.data.name).toBe('Grace Hopper');
  });

  it('records the resume language in history and undo restores it', () => {
    getState().createResume();
    const id = activeId();

    getState().setResumeLanguage(id, 'id');

    expect(activeResume().language).toBe('id');
    expect(getHistory().entries).toHaveLength(2);

    getState().undo();
    expect(activeResume().language).toBe('en');

    getState().redo();
    expect(activeResume().language).toBe('id');
  });

  it('records the resume photo in history and undo restores it', () => {
    getState().createResume();
    const id = activeId();
    const photo = 'data:image/webp;base64,AAAA';

    getState().setResumePhoto(id, photo);

    expect(activeResume().photo).toBe(photo);
    expect(getHistory().entries).toHaveLength(2);

    getState().undo();
    expect(activeResume().photo).toBe('');
    expect(usePhotoStore.getState().photos[id]).toBe('');

    getState().redo();
    expect(activeResume().photo).toBe(photo);
    expect(usePhotoStore.getState().photos[id]).toBe(photo);
  });

  it('records the resume template in history and undo restores it', () => {
    getState().createResume();
    const id = activeId();

    getState().setResumeTemplate(id, 'modern');

    expect(activeResume().templateId).toBe('modern');
    expect(getHistory().entries).toHaveLength(2);

    getState().undo();
    expect(activeResume().templateId).toBe('harvard');

    getState().redo();
    expect(activeResume().templateId).toBe('modern');
  });

  it('defaults new resumes to the default design', () => {
    getState().createResume();
    expect(activeResume().design).toEqual(DEFAULT_DESIGN);
  });

  it('imports shared data with the design option', () => {
    getState().createResume();
    const design = {
      accentColor: 'teal',
      fontFamily: 'serif',
      density: 'relaxed',
      pageSize: 'letter',
    } as const;

    getState().importResumeData(
      makeData({ name: 'Grace Hopper' }),
      'Shared CV',
      { design },
    );

    expect(activeResume().design).toEqual(design);
  });

  it('records the resume design in history and undo restores it', () => {
    getState().createResume();
    const id = activeId();

    getState().setResumeDesign(id, {
      accentColor: 'blue',
      fontFamily: 'serif',
      density: 'compact',
      pageSize: 'letter',
    });

    expect(activeResume().design.accentColor).toBe('blue');
    expect(getHistory().entries).toHaveLength(2);

    getState().undo();
    expect(activeResume().design).toEqual(DEFAULT_DESIGN);

    getState().redo();
    expect(activeResume().design.accentColor).toBe('blue');
  });

  it('does not rewrite the resume when the design is unchanged', () => {
    getState().createResume();
    const id = activeId();
    const updatedAt = activeResume().updatedAt;

    getState().setResumeDesign(id, { ...DEFAULT_DESIGN });

    expect(activeResume().updatedAt).toBe(updatedAt);
  });

  it('carries the template over when duplicating a resume', () => {
    getState().createResume();
    const id = activeId();
    getState().setResumeTemplate(id, 'modern');

    getState().duplicateResume(id);
    const duplicated = getState().resumes.find((r) => r.id !== id)!;
    expect(duplicated.templateId).toBe('modern');
  });
});

describe('useResumeStore custom sections', () => {
  it('bumps revision on structural changes so the editor form resyncs', () => {
    getState().createResume();
    const before = getState().revision;

    getState().addCustomSection('Publications');
    expect(getState().revision).toBe(before + 1);

    const sectionId = firstCustomId();
    vi.advanceTimersByTime(5000);
    getState().renameCustomSection(sectionId, 'Papers');
    expect(getState().revision).toBe(before + 2);
  });

  it('adds a section to data and appends its id to the order in one step', () => {
    getState().createResume();

    getState().addCustomSection('Publications');

    const sections = activeResume().data.customSections ?? {};
    const [sectionId, section] = Object.entries(sections)[0];
    expect(section.title).toBe('Publications');
    expect(activeResume().sectionOrder).toContain(sectionId);

    const history = getHistory();
    expect(history.entries).toHaveLength(2);
  });

  it('ignores empty titles', () => {
    getState().createResume();

    getState().addCustomSection('   ');

    expect(activeResume().data.customSections).toEqual({});
    expect(getHistory().entries).toHaveLength(1);
  });

  it('renames a section without touching order', () => {
    getState().createResume();
    getState().addCustomSection('Publications');
    const sectionId = firstCustomId();
    vi.advanceTimersByTime(5000);

    getState().renameCustomSection(sectionId, 'Papers & Talks');

    expect(firstCustomTitle()).toBe('Papers & Talks');
    expect(getHistory().entries).toHaveLength(3);
  });

  it('removes a section together with its order and hidden entries', () => {
    getState().createResume();
    getState().addCustomSection('Languages');
    const sectionId = firstCustomId();
    vi.advanceTimersByTime(5000);

    getState().removeCustomSection(sectionId);

    expect(activeResume().data.customSections).toEqual({});
    expect(activeResume().sectionOrder).not.toContain(sectionId);
    expect(getHistory().entries).toHaveLength(3);
  });

  it('undoes an add by removing data and the nav entry together', () => {
    getState().createResume();
    getState().addCustomSection('Awards');
    const sectionId = firstCustomId();

    getState().undo();

    expect(activeResume().data.customSections).toEqual({});
    expect(activeResume().sectionOrder).not.toContain(sectionId);
  });

  it('keeps custom ids when resetting the order', () => {
    getState().createResume();
    getState().addCustomSection('Interests');
    const sectionId = firstCustomId();
    vi.advanceTimersByTime(5000);

    getState().resetSectionOrder();

    const order = activeResume().sectionOrder;
    expect(order[order.length - 1]).toBe(sectionId);
    expect(order.slice(0, -1)).toEqual([...DEFAULT_SECTION_ORDER]);
  });

  it('appends missing custom ids and prunes dangling ids on rehydrate', () => {
    getState().createResume();
    getState().addCustomSection('Volunteer');
    const kept = Object.values(activeResume().data.customSections ?? {})[0];
    const id = activeId();

    const stale = {
      ...getState().resumes.find((r) => r.id === id)!,
      sectionOrder: [...DEFAULT_SECTION_ORDER, 'ghost-id'],
      hiddenSections: ['ghost-id'],
      data: {
        ...makeData(),
        customSections: { [kept.id]: kept },
      },
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { resumes: [stale], activeId: id },
        version: 0,
      }),
    );
    useResumeStore.persist.rehydrate();

    const resumed = getState().resumes.find((r) => r.id === id)!;
    expect(resumed.sectionOrder).not.toContain('ghost-id');
    expect(resumed.hiddenSections).not.toContain('ghost-id');
    expect(resumed.sectionOrder[resumed.sectionOrder.length - 1]).toBe(kept.id);
  });

  it('records renames in history and undo restores the previous title', () => {
    getState().createResume();
    const id = activeId();

    getState().renameResume(id, 'My Resume');

    expect(activeResume().title).toBe('My Resume');
    expect(activeResume().autoTitle).toBe(false);
    expect(getHistory().entries).toHaveLength(2);

    getState().undo();
    expect(activeResume().title).toBe('Untitled CV');
    expect(activeResume().autoTitle).toBe(true);

    getState().redo();
    expect(activeResume().title).toBe('My Resume');
    expect(activeResume().autoTitle).toBe(false);
  });

  it('does not rewrite the resume when the value is unchanged', () => {
    getState().createResume();
    const id = activeId();
    const updatedAt = activeResume().updatedAt;

    getState().setResumeLanguage(id, 'en');
    getState().setResumePhoto(id, '');
    getState().setResumeTemplate(id, 'harvard');

    expect(activeResume().updatedAt).toBe(updatedAt);
  });

  it('backfills language, photo, and template for legacy persisted resumes', () => {
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
    expect(resumed?.templateId).toBe('harvard');
    expect(resumed?.design).toEqual(DEFAULT_DESIGN);
  });

  it('migrates legacy curricula-data even when it fails the strict schema', () => {
    const legacyData = {
      name: 'Old CV',
      jobTitle: 'Engineer',
      email: 'old@example.com',
      phone: '123',
      summary: 'short',
      links: [],
      experience: [],
      projects: [],
      education: [],
      skills: [],
      certifications: [],
    };
    localStorage.setItem('curricula-data', JSON.stringify(legacyData));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { resumes: [], activeId: null }, version: 0 }),
    );

    useResumeStore.persist.rehydrate();

    const resumed = useResumeStore.getState().resumes[0];
    expect(resumed).toBeDefined();
    expect(resumed.data.name).toBe('Old CV');
    expect(resumed.data.summary).toBe('short');
    expect(resumed.data.location).toBe('');
    expect(localStorage.getItem('curricula-data')).toBeNull();
  });
});

describe('useResumeStore photo persistence', () => {
  const PHOTO = 'data:image/jpeg;base64,Zm9v';
  const PHOTO_STORAGE_KEY = 'curricula-photos';

  it('persists photos in the dedicated photo store, not the resume payload', () => {
    getState().createResume();
    const id = activeId();
    getState().setResumePhoto(id, PHOTO);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.state.resumes[0]).not.toHaveProperty('photo');

    const photoPersisted = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY)!);
    expect(photoPersisted.state.photos[id]).toBe(PHOTO);
  });

  it('reattaches photos from the photo store after rehydration', () => {
    getState().createResume();
    const id = activeId();
    getState().setResumePhoto(id, PHOTO);

    const persistedPayload = localStorage.getItem(STORAGE_KEY)!;
    expect(JSON.parse(persistedPayload).state.resumes[0]).not.toHaveProperty(
      'photo',
    );
    useResumeStore.setState({
      resumes: [],
      activeId: null,
      histories: {},
      revision: 0,
    });
    localStorage.setItem(STORAGE_KEY, persistedPayload);
    useResumeStore.persist.rehydrate();

    const resumed = getState().resumes.find((r) => r.id === id);
    expect(resumed?.photo).toBe(PHOTO);
    expect(getState().activeId).toBe(id);
  });

  it('migrates inline photos from the old storage layout', () => {
    getState().createResume();
    const id = activeId();
    const legacy = {
      ...getState().resumes.find((r) => r.id === id)!,
      photo: PHOTO,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { resumes: [legacy], activeId: id },
        version: 0,
      }),
    );

    useResumeStore.persist.rehydrate();

    const resumed = getState().resumes.find((r) => r.id === id);
    expect(resumed?.photo).toBe(PHOTO);
    expect(usePhotoStore.getState().photos[id]).toBe(PHOTO);
  });

  it('cleans up the stored photo when a resume is deleted', () => {
    getState().createResume();
    const first = activeId();
    getState().createResume();
    const second = activeId();
    getState().setResumePhoto(second, PHOTO);
    expect(usePhotoStore.getState().photos[second]).toBe(PHOTO);

    getState().deleteResume(second);

    expect(usePhotoStore.getState().photos[second]).toBeUndefined();
    expect(getState().activeId).toBe(first);
  });

  it('copies the stored photo when duplicating a resume', () => {
    getState().createResume();
    const id = activeId();
    getState().setResumePhoto(id, PHOTO);

    getState().duplicateResume(id);
    const copy = getState().resumes.find((r) => r.id !== id)!;

    expect(copy.photo).toBe(PHOTO);
    expect(usePhotoStore.getState().photos[copy.id]).toBe(PHOTO);
  });

  it('mirrors backup photos into the photo store', () => {
    getState().createResume();
    const backup: ResumeRecord[] = [
      {
        id: 'r1',
        title: 'A',
        data: makeData(),
        sectionOrder: [...DEFAULT_SECTION_ORDER],
        hiddenSections: [],
        language: 'en',
        photo: PHOTO,
        templateId: 'harvard',
        design: { ...DEFAULT_DESIGN },
        autoTitle: true,
        updatedAt: 1000,
      },
    ];

    getState().restoreBackup(backup, 'r1');

    expect(usePhotoStore.getState().photos.r1).toBe(PHOTO);
    expect(getState().resumes[0].photo).toBe(PHOTO);
  });
});
