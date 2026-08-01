import { describe, expect, it } from 'vitest';
import { cn, formatRelativeTime } from '@/lib/utils';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, 0, '', 'b')).toBe('a b');
  });

  it('resolves tailwind conflicts with the last class winning', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('merges conditional class objects', () => {
    expect(cn({ a: true, b: false }, 'c')).toBe('a c');
  });

  it('handles an empty input', () => {
    expect(cn()).toBe('');
  });
});

describe('formatRelativeTime', () => {
  const now = 1_000_000_000_000;

  it('reports recent timestamps as just now', () => {
    expect(formatRelativeTime(now - 4_000, now)).toBe('just now');
    expect(formatRelativeTime(now, now)).toBe('just now');
  });

  it('reports seconds', () => {
    expect(formatRelativeTime(now - 45_000, now)).toBe('45s ago');
  });

  it('reports minutes', () => {
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5m ago');
  });

  it('reports hours', () => {
    expect(formatRelativeTime(now - 2 * 3_600_000, now)).toBe('2h ago');
  });

  it('reports days', () => {
    expect(formatRelativeTime(now - 3 * 86_400_000, now)).toBe('3d ago');
  });

  it('clamps future timestamps to just now', () => {
    expect(formatRelativeTime(now + 10_000, now)).toBe('just now');
  });
});
