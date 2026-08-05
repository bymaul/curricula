import { describe, expect, it } from 'vitest';
import {
  buildSharePayload,
  buildShareUrl,
  parseSharePayload,
} from '@/lib/share';
import { CVData } from '@/lib/schema';

function makeData(): CVData {
  return {
    name: 'Ada Lovelace',
    jobTitle: 'Analytical Engineer',
    email: 'ada@example.com',
    phone: '+44 000 000 000',
    location: 'London',
    links: [{ url: 'https://github.com/ada' }],
    summary: 'Mathematician and early computer pioneer.',
    experience: [
      {
        role: 'Analytical Engine Programmer',
        company: 'Babbage & Co',
        date: '1843',
        location: 'London',
        description: 'Wrote the first published computer program.',
      },
    ],
    projects: [],
    education: [],
    skills: [{ category: 'Mathematics', items: 'Calculus, Logic' }],
    certifications: [],
  };
}

function encodeUncompressed(data: object): string {
  const b64 = btoa(JSON.stringify(data));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('share payload', () => {
  it('round-trips CV data through a compressed payload', async () => {
    const data = makeData();
    const payload = await buildSharePayload(data);

    expect(payload.startsWith('c1:')).toBe(true);
    expect(await parseSharePayload(payload)).toEqual(data);
  });

  it('creates a shorter payload than the uncompressed encoding', async () => {
    const data = makeData();
    const payload = await buildSharePayload(data);

    expect(payload.length).toBeLessThan(encodeUncompressed(data).length);
  });

  it('parses an uncompressed legacy payload', async () => {
    const data = makeData();
    const payload = encodeUncompressed(data);

    expect(await parseSharePayload(payload)).toEqual(data);
  });

  it('returns null when the payload does not match the schema', async () => {
    const invalid = makeData();
    invalid.email = 'not-an-email';
    const payload = encodeUncompressed(invalid);

    expect(await parseSharePayload(payload)).toBeNull();
  });

  it('returns null for garbage payloads', async () => {
    expect(await parseSharePayload('not-a-payload')).toBeNull();
    expect(await parseSharePayload('c1:%bad%')).toBeNull();
    expect(await parseSharePayload('')).toBeNull();
  });

  it('builds a share URL from the current location', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://example.com',
        pathname: '/',
        search: '?v=1',
        hash: '',
      },
      configurable: true,
      writable: true,
    });

    const url = await buildShareUrl(makeData());
    expect(url).toMatch(/^https:\/\/example\.com\/\?v=1#resume=c1:/);
  });
});
