import { CVData } from '@/lib/schema';
import { useResumeStore } from '@/store/useResumeStore';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { UseFormReturn } from 'react-hook-form';

const SAVE_DEBOUNCE_MS = 600;

const emptySubscribe = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function useCVAutoSave(methods: UseFormReturn<CVData>) {
  const mounted = useHasHydrated();
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const { watch, reset } = methods;

  const revision = useResumeStore((state) => state.revision);
  const activeId = useResumeStore((state) => state.activeId);

  // Latest form values, kept in a ref so typing never re-renders the page.
  const latestRef = useRef<CVData>(methods.getValues());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const persistNow = useCallback(() => {
    clearTimer();
    const id = useResumeStore.getState().activeId;
    if (!id) return;
    const stored = useResumeStore
      .getState()
      .resumes.find((r) => r.id === id)?.data;
    const synced =
      !!stored && JSON.stringify(stored) === JSON.stringify(latestRef.current);
    if (!synced) {
      useResumeStore.getState().updateResumeData(id, latestRef.current);
      setLastSavedAt(Date.now());
    }
    setSaveStatus('saved');
  }, [clearTimer]);

  useEffect(() => {
    const record = useResumeStore
      .getState()
      .resumes.find((r) => r.id === activeId);
    if (!record) return;
    latestRef.current = record.data;
    clearTimer();
    reset(record.data);
  }, [activeId, revision, reset, clearTimer]);

  useEffect(() => {
    const sub = watch((values) => {
      latestRef.current = values as CVData;
      clearTimer();
      setSaveStatus('saving');
      timerRef.current = setTimeout(persistNow, SAVE_DEBOUNCE_MS);
    });
    return () => {
      sub.unsubscribe();
      clearTimer();
    };
  }, [watch, persistNow, clearTimer]);

  return { mounted, saveStatus, lastSavedAt, saveNow: persistNow };
}
