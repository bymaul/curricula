import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clientIP, rateLimitStatus } from '@/lib/rateLimit';

describe('clientIP', () => {
  it('returns the first x-forwarded-for address', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    expect(clientIP(req)).toBe('1.2.3.4');
  });

  it('trims and picks the first address from a chain', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '  1.2.3.4 , 10.0.0.1 , 10.0.0.2 ' },
    });
    expect(clientIP(req)).toBe('1.2.3.4');
  });

  it('returns "unknown" when no forwarding header is present', () => {
    const req = new Request('http://localhost');
    expect(clientIP(req)).toBe('unknown');
  });
});

describe('rateLimitStatus', () => {
  const BASE = new Date('2026-01-01T00:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within the window limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(rateLimitStatus('1.1.1.1').limited).toBe(false);
    }
  });

  it('limits after the window maximum is reached', () => {
    for (let i = 0; i < 10; i++) rateLimitStatus('2.2.2.2');
    const result = rateLimitStatus('2.2.2.2');
    expect(result.limited).toBe(true);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('resets the window after it expires', () => {
    for (let i = 0; i < 10; i++) rateLimitStatus('3.3.3.3');
    vi.setSystemTime(BASE + 61_000);
    expect(rateLimitStatus('3.3.3.3').limited).toBe(false);
  });

  it('enforces the daily limit independently of the window', () => {
    const ip = '4.4.4.4';
    for (let i = 0; i < 100; i++) {
      vi.setSystemTime(BASE + i * 61_000);
      rateLimitStatus(ip);
    }
    const result = rateLimitStatus(ip);
    expect(result.limited).toBe(true);
    expect(result.retryAfterSeconds).toBeGreaterThan(60);
  });
});
