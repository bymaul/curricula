import { describe, expect, it } from 'vitest';
import {
  buildSharePayload,
  buildShareUrl,
  matchShareHash,
  parseSharePayload,
} from '@/lib/share';
import { DEFAULT_DESIGN } from '@/lib/design';
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

function toBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function encodeUncompressed(data: object): string {
  return toBase64url(new TextEncoder().encode(JSON.stringify(data)));
}

async function encodeCompressed(data: object, prefix: string): Promise<string> {
  const stream = new Blob([JSON.stringify(data)])
    .stream()
    .pipeThrough(new CompressionStream('deflate-raw'));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  return prefix + toBase64url(compressed);
}

describe('share payload', () => {
  it('round-trips CV data through a compressed v2 payload', async () => {
    const data = makeData();
    const payload = await buildSharePayload(data);

    expect(payload.startsWith('c2:')).toBe(true);
    expect(await parseSharePayload(payload)).toEqual({
      data,
      language: 'en',
      photo: '',
      template: 'harvard',
      design: { ...DEFAULT_DESIGN },
    });
  });

  it('round-trips language and photo options', async () => {
    const data = makeData();
    const photo = 'data:image/jpeg;base64,Zm9v';
    const payload = await buildSharePayload(data, { language: 'id', photo });

    expect(await parseSharePayload(payload)).toEqual({
      data,
      language: 'id',
      photo,
      template: 'harvard',
      design: { ...DEFAULT_DESIGN },
    });
  });

  it('round-trips the template option', async () => {
    const data = makeData();
    const payload = await buildSharePayload(data, { template: 'modern' });

    expect(await parseSharePayload(payload)).toEqual({
      data,
      language: 'en',
      photo: '',
      template: 'modern',
      design: { ...DEFAULT_DESIGN },
    });
  });

  it('round-trips the design option', async () => {
    const data = makeData();
    const design = {
      accentColor: 'teal',
      fontFamily: 'sans',
      density: 'relaxed',
      pageSize: 'letter',
    } as const;
    const payload = await buildSharePayload(data, { design });

    expect(await parseSharePayload(payload)).toEqual({
      data,
      language: 'en',
      photo: '',
      template: 'harvard',
      design,
    });
  });

  it('creates a shorter payload than the uncompressed encoding', async () => {
    const data = makeData();
    const payload = await buildSharePayload(data);

    expect(payload.length).toBeLessThan(encodeUncompressed(data).length);
  });

  it('parses a legacy compressed payload with default language and photo', async () => {
    const data = makeData();
    const payload = await encodeCompressed(data, 'c1:');

    expect(await parseSharePayload(payload)).toEqual({
      data,
      language: 'en',
      photo: '',
      template: 'harvard',
      design: { ...DEFAULT_DESIGN },
    });
  });

  it('parses an uncompressed legacy payload', async () => {
    const data = makeData();
    const payload = encodeUncompressed(data);

    expect(await parseSharePayload(payload)).toEqual({
      data,
      language: 'en',
      photo: '',
      template: 'harvard',
      design: { ...DEFAULT_DESIGN },
    });
  });

  it('round-trips an in-progress CV with empty fields', async () => {
    const incomplete: CVData = {
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
    };

    const payload = await buildSharePayload(incomplete);
    expect(await parseSharePayload(payload)).toEqual({
      data: incomplete,
      language: 'en',
      photo: '',
      template: 'harvard',
      design: { ...DEFAULT_DESIGN },
    });
  });

  it('returns null when the payload is missing a required field', async () => {
    const payload = encodeUncompressed({ ...makeData(), name: null });

    expect(await parseSharePayload(payload)).toBeNull();
  });

  it('returns null for garbage payloads', async () => {
    expect(await parseSharePayload('not-a-payload')).toBeNull();
    expect(await parseSharePayload('c1:%bad%')).toBeNull();
    expect(await parseSharePayload('c2:%bad%')).toBeNull();
    expect(await parseSharePayload('')).toBeNull();
  });

  it('builds a share URL pointing at the public CV viewer', async () => {
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
    expect(url).toMatch(/^https:\/\/example\.com\/cv#resume=c2:/);
  });
});

describe('matchShareHash', () => {
  it('extracts a v2 payload with the c2: prefix', () => {
    expect(matchShareHash('#resume=c2:AbCdEfGhIjK_l-mnOpQrStUvWxYz')).toBe(
      'c2:AbCdEfGhIjK_l-mnOpQrStUvWxYz',
    );
  });

  it('extracts a legacy c1: payload', () => {
    expect(matchShareHash('#resume=c1:AbCdEfGhIjK_l-mnOpQrStUvWxYz')).toBe(
      'c1:AbCdEfGhIjK_l-mnOpQrStUvWxYz',
    );
  });

  it('extracts a bare base64url payload without a prefix', () => {
    expect(matchShareHash('#resume=AbCdEfGhIjK_l-mnOpQrStUvWxYz')).toBe(
      'AbCdEfGhIjK_l-mnOpQrStUvWxYz',
    );
  });

  it('rejects hashes with characters outside the payload charset', () => {
    expect(matchShareHash('#resume=c2:Ab+Ef')).toBeNull();
    expect(matchShareHash('#resume=c2:Ab/Ef')).toBeNull();
    expect(matchShareHash('#resume=c2:Ab=Ef')).toBeNull();
  });

  it('rejects non-share or malformed hashes', () => {
    expect(matchShareHash('')).toBeNull();
    expect(matchShareHash('#about')).toBeNull();
    expect(matchShareHash('#resume=')).toBeNull();
    expect(matchShareHash('#resume=c3:Ab')).toBeNull();
    expect(matchShareHash('#resume=c2:')).toBeNull();
    expect(matchShareHash('resume=c2:Ab')).toBeNull();
  });
});
