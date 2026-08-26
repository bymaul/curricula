import { describe, expect, it } from 'vitest';
import { parseCvJson } from './cvImport';
import { CVData } from './schema';

const VALID_CV: CVData = {
  name: 'Jane Doe',
  jobTitle: 'Engineer',
  email: 'jane@example.com',
  phone: '+1 555 0100',
  location: 'Berlin',
  links: [{ url: 'https://jane.example' }],
  summary: 'Engineer with a decade of shipped products.',
  experience: [
    {
      role: 'Senior Engineer',
      company: 'Acme',
      date: '2020 - now',
      location: 'Berlin',
      description: 'Shipped things.',
    },
  ],
  projects: [],
  education: [],
  skills: [{ category: 'Languages', items: 'TypeScript, Python' }],
  certifications: [],
  customSections: {},
};

describe('parseCvJson', () => {
  it('parses a valid CV payload', () => {
    const result = parseCvJson(JSON.stringify(VALID_CV));
    expect(result).toEqual({ ok: true, data: VALID_CV });
  });

  it('accepts payloads without the optional fields', () => {
    const minimal: Record<string, unknown> = { ...VALID_CV };
    delete minimal.location;
    delete minimal.customSections;
    const result = parseCvJson(JSON.stringify(minimal));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.location).toBeUndefined();
      expect(result.data.customSections).toBeUndefined();
    }
  });

  it('reports syntax errors for non-JSON text', () => {
    const result = parseCvJson('{not json');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('syntax');
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });

  it('formats schema issue paths with array brackets', () => {
    const invalid = {
      ...VALID_CV,
      experience: [{ role: '', company: '', date: '' }],
    };
    const result = parseCvJson(JSON.stringify(invalid));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('schema');
      expect(
        result.issues.some((issue) => issue.startsWith('experience[0].')),
      ).toBe(true);
    }
  });

  it('uses (root) when the whole value is wrong', () => {
    const result = parseCvJson('[]');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toContain('(root)');
    }
  });

  it('truncates long issue lists with a +N more line', () => {
    const badItem = { role: '', company: '', date: '', description: '' };
    const invalid = {
      ...VALID_CV,
      name: '',
      email: 'nope',
      phone: '',
      summary: 'short',
      experience: [badItem, badItem, badItem],
    };
    const result = parseCvJson(JSON.stringify(invalid));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.at(-1)).toMatch(/^\+\d+ more$/);
      expect(result.issues.length).toBeLessThanOrEqual(6);
    }
  });
});
