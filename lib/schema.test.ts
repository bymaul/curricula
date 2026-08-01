import { describe, expect, it } from 'vitest';
import { cvSchema, initialCVState } from '@/lib/schema';

const validCV = {
  name: 'Jane Doe',
  jobTitle: 'Engineer',
  email: 'jane@example.com',
  phone: '+1-555-0100',
  location: 'San Francisco',
  links: [{ url: 'github.com/jane' }],
  summary: 'Experienced engineer with 8 years building web apps.',
  experience: [
    {
      role: 'Dev',
      company: 'Acme',
      date: '2020-2022',
      location: '',
      description: '- Led team.',
    },
  ],
  projects: [],
  education: [],
  skills: [{ category: 'Languages', items: 'JavaScript, TypeScript' }],
  certifications: [],
};

describe('cvSchema', () => {
  it('accepts a complete valid CV', () => {
    const result = cvSchema.safeParse(validCV);
    expect(result.success).toBe(true);
  });

  it('accepts optional fields being omitted', () => {
    const withoutLocation: Record<string, unknown> = { ...validCV };
    delete withoutLocation.location;
    const result = cvSchema.safeParse(withoutLocation);
    expect(result.success).toBe(true);
  });

  it('rejects the empty initial state', () => {
    const result = cvSchema.safeParse(initialCVState);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = cvSchema.safeParse({ ...validCV, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a too-short summary', () => {
    const result = cvSchema.safeParse({ ...validCV, summary: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing required scalar field', () => {
    const result = cvSchema.safeParse({ ...validCV, phone: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty array entries with required fields', () => {
    const result = cvSchema.safeParse({
      ...validCV,
      skills: [{ category: '', items: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a bad link entry', () => {
    const result = cvSchema.safeParse({
      ...validCV,
      links: [{ url: '' }],
    });
    expect(result.success).toBe(false);
  });
});
