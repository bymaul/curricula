'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

export function createOnceGuard() {
  let fired = false;
  return {
    run<T>(fn: () => T): T | undefined {
      if (fired) return undefined;
      fired = true;
      return fn();
    },
    reset() {
      fired = false;
    },
    get fired() {
      return fired;
    },
  };
}

export function useOnceAction() {
  const guardRef = useRef(createOnceGuard());
  const [isPending, setIsPending] = useState(false);

  const runOnce = useCallback((fn: () => void) => {
    if (guardRef.current.fired) return;
    guardRef.current.run(fn);
    setIsPending(true);
  }, []);

  const reset = useCallback(() => {
    guardRef.current.reset();
    setIsPending(false);
  }, []);

  return [runOnce, isPending, reset] as const;
}

export interface CooldownGuard {
  run: (fn: () => void) => boolean;
  subscribe: (listener: (cooling: boolean) => void) => () => void;
  dispose: () => void;
  readonly cooling: boolean;
}

export function createCooldownGuard(cooldownMs: number): CooldownGuard {
  let cooling = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<(cooling: boolean) => void>();

  const set = (value: boolean) => {
    cooling = value;
    for (const listener of listeners) listener(value);
  };

  return {
    run(fn) {
      if (cooling) return false;
      set(true);
      fn();
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        set(false);
      }, cooldownMs);
      return true;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      listeners.clear();
      set(false);
    },
    get cooling() {
      return cooling;
    },
  };
}

export function useCooldownAction(cooldownMs = 800) {
  const [guard] = useState(() => createCooldownGuard(cooldownMs));

  const isCooling = useSyncExternalStore(
    (onStoreChange) => guard.subscribe(onStoreChange),
    () => guard.cooling,
    () => false,
  );

  useEffect(() => () => guard.dispose(), [guard]);

  const run = useCallback(
    (fn: () => void) => {
      guard.run(fn);
    },
    [guard],
  );

  return [run, isCooling] as const;
}
