import { CVData } from '@/lib/schema';
import { useResumeStore } from '@/store/useResumeStore';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
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

  const activeResume = useResumeStore((state) =>
    state.resumes.find((r) => r.id === state.activeId),
  );
  const updateResumeData = useResumeStore((state) => state.updateResumeData);
  const revision = useResumeStore((state) => state.revision);
  const activeId = activeResume?.id ?? null;

  const cvData = watch();
  const snapshot = JSON.stringify(cvData);
  const prevSnapshotRef = useRef(snapshot);

  useEffect(() => {
    if (!activeResume) return;
    reset(activeResume.data);
    prevSnapshotRef.current = snapshot;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, revision]);

  useEffect(() => {
    if (prevSnapshotRef.current === snapshot) return;
    prevSnapshotRef.current = snapshot;
    const stored = useResumeStore
      .getState()
      .resumes.find((r) => r.id === activeId)?.data;
    const isSynced = !!stored && JSON.stringify(stored) === snapshot;
    setSaveStatus(isSynced ? 'saved' : 'saving');
  }, [snapshot, activeId]);

  useEffect(() => {
    if (saveStatus !== 'saving' || !activeId) return;

    const id = activeId;
    const stored = useResumeStore
      .getState()
      .resumes.find((r) => r.id === id)?.data;
    if (stored && JSON.stringify(stored) === snapshot) return;

    const timer = setTimeout(() => {
      updateResumeData(id, cvData);
      setLastSavedAt(Date.now());
      setSaveStatus('saved');
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [saveStatus, snapshot, activeId, cvData, revision, updateResumeData]);

  return { mounted, cvData, saveStatus, lastSavedAt };
}
