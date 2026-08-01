import { CVData } from '@/lib/schema';
import { useResumeStore } from '@/store/useResumeStore';
import { useEffect, useState, useSyncExternalStore } from 'react';
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

  const activeResume = useResumeStore((state) => state.resumes.find((r) => r.id === state.activeId));
  const updateResumeData = useResumeStore((state) => state.updateResumeData);
  const activeId = activeResume?.id ?? null;

  useEffect(() => {
    if (!activeResume) return;
    reset(activeResume.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const cvData = watch();
  const snapshot = JSON.stringify(cvData);
  const [prevSnapshot, setPrevSnapshot] = useState(snapshot);

  if (prevSnapshot !== snapshot) {
    setPrevSnapshot(snapshot);
    setSaveStatus('saving');
  }

  useEffect(() => {
    if (saveStatus !== 'saving' || !activeId) return;

    const id = activeId;
    const timer = setTimeout(() => {
      updateResumeData(id, cvData);
      setLastSavedAt(Date.now());
      setSaveStatus('saved');
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [saveStatus, snapshot, activeId, cvData, updateResumeData]);

  return { mounted, cvData, saveStatus, lastSavedAt };
}
