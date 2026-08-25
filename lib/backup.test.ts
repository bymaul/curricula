import { describe, expect, it } from 'vitest';
import { parseBackup, serializeBackup } from '@/lib/backup';
import { DEFAULT_SECTION_ORDER, SectionId } from '@/lib/consts';
import { DEFAULT_DESIGN } from '@/lib/design';
import { CVData } from '@/lib/schema';
import type { ResumeRecord } from '@/store/useResumeStore';

function makeData(): CVData {
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
  };
}

function makeRecord(overrides: Partial<ResumeRecord> = {}): ResumeRecord {
  return {
    id: 'r1',
    title: 'Ada CV',
    data: makeData(),
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenSections: ['skills'],
    language: 'en',
    photo: '',
    templateId: 'harvard',
    design: { ...DEFAULT_DESIGN },
    autoTitle: false,
    updatedAt: 123456,
    ...overrides,
  };
}

describe('backup', () => {
  it('round-trips a resume collection', () => {
    const raw = serializeBackup([makeRecord()], 'r1');

    const parsed = parseBackup(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.app).toBe('curricula');
    expect(parsed!.version).toBe(1);
    expect(parsed!.activeId).toBe('r1');
    expect(parsed!.resumes).toEqual([makeRecord()]);
  });

  it('round-trips language and photo on each resume', () => {
    const record = makeRecord({
      language: 'id',
      photo: 'data:image/png;base64,eA==',
    });
    const parsed = parseBackup(serializeBackup([record], 'r1'));

    expect(parsed!.resumes[0].language).toBe('id');
    expect(parsed!.resumes[0].photo).toBe('data:image/png;base64,eA==');
  });

  it('round-trips the template on each resume', () => {
    const record = makeRecord({ templateId: 'modern' });
    const parsed = parseBackup(serializeBackup([record], 'r1'));

    expect(parsed!.resumes[0].templateId).toBe('modern');
  });

  it('round-trips the design on each resume', () => {
    const record = makeRecord({
      design: {
        accentColor: 'burgundy',
        fontFamily: 'serif',
        density: 'compact',
      },
    });
    const parsed = parseBackup(serializeBackup([record], 'r1'));

    expect(parsed!.resumes[0].design).toEqual({
      accentColor: 'burgundy',
      fontFamily: 'serif',
      density: 'compact',
    });
  });

  it('falls back to the default design for a garbage value', () => {
    const record = makeRecord();
    const raw = serializeBackup([record], 'r1').replace(
      '"accentColor":"default"',
      '"accentColor":"neon"',
    );

    const parsed = parseBackup(raw);
    expect(parsed!.resumes[0].design).toEqual(DEFAULT_DESIGN);
  });

  it('round-trips custom section ids in order and visibility', () => {
    const record = makeRecord({
      data: {
        ...makeData(),
        customSections: {
          cs1: {
            id: 'cs1',
            title: 'Publications',
            items: [
              {
                title: 'A Paper',
                subtitle: '',
                date: '2024',
                location: '',
                description: 'Details',
              },
            ],
          },
        },
      },
      sectionOrder: [...DEFAULT_SECTION_ORDER, 'cs1'],
      hiddenSections: ['cs1'],
    });

    const parsed = parseBackup(serializeBackup([record], 'r1'));

    expect(parsed).not.toBeNull();
    expect(parsed!.resumes[0].data.customSections).toEqual(
      record.data.customSections,
    );
    expect(parsed!.resumes[0].sectionOrder).toContain('cs1');
    expect(parsed!.resumes[0].hiddenSections).toContain('cs1');
  });

  it('rejects an unknown builtin id that no custom section defines', () => {
    const record = makeRecord();
    const payload = JSON.parse(serializeBackup([record], 'r1'));
    payload.resumes[0].sectionOrder = ['ghost-id', ...DEFAULT_SECTION_ORDER];

    expect(parseBackup(JSON.stringify(payload))).toBeNull();
  });

  it('defaults language, photo, and template for legacy backups', () => {
    const record = makeRecord();
    const legacy = {
      id: record.id,
      title: record.title,
      data: record.data,
      sectionOrder: record.sectionOrder,
      hiddenSections: record.hiddenSections,
      autoTitle: record.autoTitle,
      updatedAt: record.updatedAt,
    };
    const raw = JSON.stringify({
      app: 'curricula',
      version: 1,
      exportedAt: 0,
      activeId: 'r1',
      resumes: [legacy],
    });

    const parsed = parseBackup(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.resumes[0].language).toBe('en');
    expect(parsed!.resumes[0].photo).toBe('');
    expect(parsed!.resumes[0].templateId).toBe('harvard');
    expect(parsed!.resumes[0].design).toEqual(DEFAULT_DESIGN);
  });

  it('round-trips multiple resumes and a null active id', () => {
    const resumes = [
      makeRecord({ id: 'r1', title: 'First' }),
      makeRecord({ id: 'r2', title: 'Second', autoTitle: true }),
    ];
    const raw = serializeBackup(resumes, null);

    const parsed = parseBackup(raw);
    expect(parsed!.activeId).toBeNull();
    expect(parsed!.resumes.map((r) => r.title)).toEqual(['First', 'Second']);
  });

  it('round-trips an in-progress CV with empty fields', () => {
    const record = makeRecord({
      title: 'Untitled CV',
      data: {
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
      },
    });

    const parsed = parseBackup(serializeBackup([record], 'r1'));
    expect(parsed).not.toBeNull();
    expect(parsed!.resumes[0].data).toEqual(record.data);
    expect(parsed!.resumes[0].title).toBe('Untitled CV');
  });

  it('rejects invalid JSON', () => {
    expect(parseBackup('not json')).toBeNull();
  });

  it('rejects a payload with invalid resume data', () => {
    const raw = JSON.stringify({
      app: 'curricula',
      version: 1,
      exportedAt: 0,
      activeId: null,
      resumes: [
        {
          id: 'x',
          title: 'X',
          data: {},
          sectionOrder: [],
          hiddenSections: [],
          autoTitle: true,
          updatedAt: 0,
        },
      ],
    });

    expect(parseBackup(raw)).toBeNull();
  });

  it('rejects a backup with an unknown section id', () => {
    const record = makeRecord({
      sectionOrder: ['bogus' as SectionId, ...DEFAULT_SECTION_ORDER],
    });

    expect(parseBackup(serializeBackup([record], null))).toBeNull();
  });

  it('rejects a backup from another app', () => {
    const raw = serializeBackup([makeRecord()], null);
    expect(parseBackup(raw.replace('"curricula"', '"other"'))).toBeNull();
  });
});
