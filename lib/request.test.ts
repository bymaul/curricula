import { describe, expect, it } from 'vitest';
import { parseResponseJSON, RateLimitError } from '@/lib/request';

describe('parseResponseJSON', () => {
  it('parses a successful JSON response', async () => {
    const response = new Response(JSON.stringify({ hello: 'world' }), {
      status: 200,
    });
    await expect(parseResponseJSON(response)).resolves.toEqual({
      hello: 'world',
    });
  });

  it('returns null for a successful empty response', async () => {
    const response = new Response('', { status: 200 });
    await expect(parseResponseJSON(response)).resolves.toBeNull();
  });

  it('throws the server error message for failed responses', async () => {
    const response = new Response(
      JSON.stringify({ error: 'Invalid payload' }),
      { status: 400 },
    );
    await expect(parseResponseJSON(response)).rejects.toThrow(
      'Invalid payload',
    );
  });

  it('throws a RateLimitError for 429 with the Retry-After hint', async () => {
    const response = new Response(JSON.stringify({ error: 'limited' }), {
      status: 429,
      headers: { 'Retry-After': '45' },
    });

    await expect(parseResponseJSON(response)).rejects.toMatchObject({
      name: 'RateLimitError',
      retryAfterSeconds: 45,
    });
  });

  it('defaults retryAfterSeconds when the Retry-After header is missing', async () => {
    const response = new Response('', { status: 429 });

    await expect(parseResponseJSON(response)).rejects.toMatchObject({
      name: 'RateLimitError',
      retryAfterSeconds: 60,
    });
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    const response = new Response('Internal Server Error', { status: 500 });
    await expect(parseResponseJSON(response)).rejects.toThrow(
      'Request failed (500)',
    );
  });

  it('falls back to a generic message when the error field is not a string', async () => {
    const response = new Response(JSON.stringify({ error: { code: 1 } }), {
      status: 500,
    });
    await expect(parseResponseJSON(response)).rejects.toThrow(
      'Request failed (500)',
    );
  });

  it('exposes RateLimitError as an instanceof error', async () => {
    const response = new Response('', { status: 429 });
    try {
      await parseResponseJSON(response);
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).retryAfterSeconds).toBe(60);
    }
  });
});
