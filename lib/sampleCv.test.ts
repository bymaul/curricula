import { describe, expect, it } from 'vitest';
import { cvSchema } from '@/lib/schema';
import { SAMPLE_CV_DATA } from '@/lib/sampleCv';

describe('SAMPLE_CV_DATA', () => {
  it('passes the strict edit schema', () => {
    const result = cvSchema.safeParse(SAMPLE_CV_DATA);
    expect(result.success).toBe(true);
  });

  it('is fully populated so the example reads like a real CV', () => {
    expect(SAMPLE_CV_DATA.name).toBeTruthy();
    expect(SAMPLE_CV_DATA.experience.length).toBeGreaterThan(0);
    expect(SAMPLE_CV_DATA.education.length).toBeGreaterThan(0);
    expect(SAMPLE_CV_DATA.skills.length).toBeGreaterThan(0);
  });
});
