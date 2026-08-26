import { describe, expect, it, vi } from 'vitest';
import { isApplePlatform } from '@/lib/platform';

describe('isApplePlatform', () => {
  it('returns true for macOS user agents', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    });
    expect(isApplePlatform()).toBe(true);
  });

  it('returns true for iOS user agents', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });
    expect(isApplePlatform()).toBe(true);
  });

  it('returns false for Windows user agents', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });
    expect(isApplePlatform()).toBe(false);
  });
});
