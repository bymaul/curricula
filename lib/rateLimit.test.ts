import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clientIP, keyRateLimitStatus, rateLimitStatus } from '@/lib/rateLimit';

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

  it('prefers cf-connecting-ip over x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '1.2.3.4',
        'cf-connecting-ip': '9.9.9.9',
      },
    });
    expect(clientIP(req)).toBe('9.9.9.9');
  });

  it('prefers x-real-ip over x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '8.8.8.8' },
    });
    expect(clientIP(req)).toBe('8.8.8.8');
  });

  it('prefers cf-connecting-ip over x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '8.8.8.8', 'cf-connecting-ip': '9.9.9.9' },
    });
    expect(clientIP(req)).toBe('9.9.9.9');
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

describe('keyRateLimitStatus', () => {
  const BASE = new Date('2026-01-01T00:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within the per-key window limit', () => {
    for (let i = 0; i < 30; i++) {
      expect(keyRateLimitStatus('sk-bundled').limited).toBe(false);
    }
  });

  it('limits after the per-key window maximum is reached', () => {
    for (let i = 0; i < 30; i++) keyRateLimitStatus('sk-bundled');
    const result = keyRateLimitStatus('sk-bundled');
    expect(result.limited).toBe(true);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('limits per key independently of the IP limit', () => {
    // The per-IP window (10) is exhausted for this IP.
    for (let i = 0; i < 10; i++) rateLimitStatus('5.5.5.5');
    // A fresh key is still under its own cap.
    for (let i = 0; i < 30; i++) keyRateLimitStatus('sk-fresh');
    expect(keyRateLimitStatus('sk-fresh').limited).toBe(true);
    // A different key is not affected.
    expect(keyRateLimitStatus('sk-other').limited).toBe(false);
  });

  it('enforces the per-key daily limit', () => {
    for (let i = 0; i < 500; i++) {
      vi.setSystemTime(BASE + i * 61_000);
      keyRateLimitStatus('sk-daily');
    }
    const result = keyRateLimitStatus('sk-daily');
    expect(result.limited).toBe(true);
    expect(result.retryAfterSeconds).toBeGreaterThan(60);
  });
});
