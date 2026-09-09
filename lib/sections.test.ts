import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SECTION_ORDER,
  RENDERABLE_SECTIONS,
  SECTIONS,
  getSectionIdFromTab,
  getSectionTabName,
} from '@/lib/sections';

describe('section tab mapping', () => {
  it('maps the summary section to the Personal tab', () => {
    expect(getSectionTabName('summary')).toBe('personal');
  });

  it('maps content sections to their tab keys', () => {
    expect(getSectionTabName('experience')).toBe('experience');
    expect(getSectionTabName('skills')).toBe('skills');
    expect(getSectionTabName('certifications')).toBe('certifications');
  });

  it('maps section tabs back to their section id', () => {
    expect(getSectionIdFromTab('experience')).toBe('experience');
    expect(getSectionIdFromTab('education')).toBe('education');
  });

  it('maps the Personal tab to the summary section', () => {
    expect(getSectionIdFromTab('personal')).toBe('summary');
  });

  it('passes unknown tabs through as custom section ids', () => {
    expect(getSectionIdFromTab('Nope')).toBe('Nope');
  });
});

describe('section metadata', () => {
  it('derives default section order from renderable sections', () => {
    expect(DEFAULT_SECTION_ORDER).toEqual(RENDERABLE_SECTIONS.map((s) => s.id));
  });

  it('covers all renderable sections in SECTIONS', () => {
    const sectionFields = SECTIONS.flatMap((s) => s.fields);
    for (const { id } of RENDERABLE_SECTIONS) {
      expect(sectionFields).toContain(id);
    }
  });
});
