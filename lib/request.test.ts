import { describe, expect, it } from 'vitest';
import { parseResponseJSON } from '@/lib/request';

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

  it('falls back to a generic message for an empty error body', async () => {
    const response = new Response('', { status: 429 });
    await expect(parseResponseJSON(response)).rejects.toThrow(
      'Request failed (429)',
    );
  });
});
