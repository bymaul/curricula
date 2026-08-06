import { describe, expect, it } from 'vitest';
import { summarizeCVChanges } from '@/lib/cvDiff';
import { CVData } from '@/lib/schema';

const baseCV: CVData = {
  name: 'Jane Doe',
  jobTitle: 'Engineer',
  email: 'jane@example.com',
  phone: '+1-555-0100',
  location: 'SF',
  links: [{ url: 'github.com/jane' }],
  summary: 'Experienced engineer.',
  experience: [
    {
      role: 'Dev',
      company: 'Acme',
      date: '2020-2022',
      location: '',
      description: '- Led team.',
    },
    {
      role: 'Senior Dev',
      company: 'Acme',
      date: '2022-2024',
      location: '',
      description: '- Scaled infra.',
    },
    {
      role: 'Lead',
      company: 'Beta',
      date: '2024',
      location: '',
      description: '- Directed roadmap.',
    },
  ],
  projects: [],
  education: [],
  skills: [{ category: 'Languages', items: 'JS' }],
  certifications: [],
};

describe('summarizeCVChanges', () => {
  it('returns an empty summary when nothing changed', () => {
    expect(summarizeCVChanges(baseCV, baseCV)).toEqual([]);
  });

  it('reports scalar field changes', () => {
    const adjusted = { ...baseCV, summary: 'A rewritten summary.' };
    expect(summarizeCVChanges(baseCV, adjusted)).toEqual([
      { labelKey: 'changes.labelSummary', detailKey: 'changes.detailChanged' },
    ]);
  });

  it('reports multiple scalar changes', () => {
    const adjusted = {
      ...baseCV,
      name: 'Janet Doe',
      jobTitle: 'Staff Engineer',
    };
    const result = summarizeCVChanges(baseCV, adjusted);
    expect(result).toContainEqual({
      labelKey: 'changes.labelName',
      detailKey: 'changes.detailChanged',
    });
    expect(result).toContainEqual({
      labelKey: 'changes.labelJobTitle',
      detailKey: 'changes.detailChanged',
    });
    expect(result).toHaveLength(2);
  });

  it('describes changed entries when lengths are equal', () => {
    const adjusted: CVData = {
      ...baseCV,
      experience: [
        { ...baseCV.experience[0], role: 'Software Dev' },
        baseCV.experience[1],
        baseCV.experience[2],
      ],
    };
    expect(summarizeCVChanges(baseCV, adjusted)).toEqual([
      {
        labelKey: 'changes.labelExperience',
        detailKey: 'changes.detailEntriesUpdated',
        params: { changed: 1, count: 3 },
      },
    ]);
  });

  it('describes entry count changes when lengths differ', () => {
    const adjusted: CVData = {
      ...baseCV,
      experience: baseCV.experience.slice(0, 1),
    };
    expect(summarizeCVChanges(baseCV, adjusted)).toEqual([
      {
        labelKey: 'changes.labelExperience',
        detailKey: 'changes.detailEntryCount',
        params: { from: 3, to: 1 },
      },
    ]);
  });

  it('ignores array sections where entries are unchanged', () => {
    const adjusted: CVData = {
      ...baseCV,
      skills: [{ category: 'Languages', items: 'JS' }],
    };
    expect(summarizeCVChanges(baseCV, adjusted)).toEqual([]);
  });

  it('reports additions to empty arrays', () => {
    const adjusted: CVData = {
      ...baseCV,
      education: [
        {
          degree: 'BSc',
          institution: 'MIT',
          date: '2015',
          location: '',
          description: '',
        },
      ],
    };
    expect(summarizeCVChanges(baseCV, adjusted)).toEqual([
      {
        labelKey: 'changes.labelEducation',
        detailKey: 'changes.detailEntryCount',
        params: { from: 0, to: 1 },
      },
    ]);
  });
});
