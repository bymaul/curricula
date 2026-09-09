import { describe, expect, it, vi } from 'vitest';
import { createOnceGuard } from '@/hooks/useOnceAction';

describe('createOnceGuard', () => {
  it('runs the first call only', () => {
    const guard = createOnceGuard();
    const fn = vi.fn();
    guard.run(fn);
    guard.run(fn);
    guard.run(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs again after reset', () => {
    const guard = createOnceGuard();
    const fn = vi.fn();
    guard.run(fn);
    guard.reset();
    guard.run(fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
