import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCooldownGuard, createOnceGuard } from '@/hooks/useOnceAction';

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

describe('createCooldownGuard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('blocks calls during the cooldown window', () => {
    vi.useFakeTimers();
    const guard = createCooldownGuard(800);
    const fn = vi.fn();
    expect(guard.run(fn)).toBe(true);
    expect(guard.run(fn)).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(guard.cooling).toBe(true);
  });

  it('accepts calls again after the cooldown elapses', () => {
    vi.useFakeTimers();
    const guard = createCooldownGuard(800);
    const fn = vi.fn();
    guard.run(fn);
    vi.advanceTimersByTime(800);
    expect(guard.cooling).toBe(false);
    expect(guard.run(fn)).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('notifies subscribers on cooling changes', () => {
    vi.useFakeTimers();
    const guard = createCooldownGuard(800);
    const listener = vi.fn();
    const unsubscribe = guard.subscribe(listener);
    guard.run(vi.fn());
    vi.advanceTimersByTime(800);
    expect(listener).toHaveBeenNthCalledWith(1, true);
    expect(listener).toHaveBeenNthCalledWith(2, false);
    unsubscribe();
    guard.run(vi.fn());
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('dispose clears the timer and cooling flag', () => {
    vi.useFakeTimers();
    const guard = createCooldownGuard(800);
    guard.run(vi.fn());
    guard.dispose();
    expect(guard.cooling).toBe(false);
    vi.advanceTimersByTime(800);
  });
});
