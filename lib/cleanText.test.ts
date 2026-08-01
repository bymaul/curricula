import { describe, expect, it } from 'vitest';
import { sanitizeJSON, stripInvisibleChars } from '@/lib/cleanText';

const INVISIBLE = '\u200B\u200C\u200D\u200E\u200F\u2060\u00AD\uFEFF';

describe('stripInvisibleChars', () => {
  it('removes all invisible unicode characters', () => {
    const input = `a${INVISIBLE}b${INVISIBLE}c`;
    expect(stripInvisibleChars(input)).toBe('abc');
  });

  it('removes each invisible character individually', () => {
    for (const ch of INVISIBLE) {
      expect(stripInvisibleChars(`x${ch}y`)).toBe('xy');
    }
  });

  it('preserves normal text', () => {
    expect(stripInvisibleChars('Hello, world!')).toBe('Hello, world!');
  });

  it('handles empty strings', () => {
    expect(stripInvisibleChars('')).toBe('');
  });
});

describe('sanitizeJSON', () => {
  it('strips invisible chars from nested strings', () => {
    const value = {
      name: `Jane\u2060 Doe`,
      experience: [
        { description: `Led\u00AD team` },
        { description: `No invisible here` },
      ],
    };
    const result = sanitizeJSON(value);
    expect(result.name).toBe('Jane Doe');
    expect(
      (result.experience as { description: string }[])[0].description,
    ).toBe('Led team');
    expect(
      (result.experience as { description: string }[])[1].description,
    ).toBe('No invisible here');
  });

  it('leaves primitives untouched', () => {
    expect(sanitizeJSON(42)).toBe(42);
    expect(sanitizeJSON(true)).toBe(true);
    expect(sanitizeJSON(null)).toBe(null);
    expect(sanitizeJSON('text')).toBe('text');
  });

  it('handles arrays of primitives and objects', () => {
    const result = sanitizeJSON(['a\u2060b', { key: 'v\u00AD' }]);
    expect(result).toEqual(['ab', { key: 'v' }]);
  });
});
