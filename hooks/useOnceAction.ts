'use client';

import { useCallback, useRef, useState } from 'react';

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
