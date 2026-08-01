'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UseFormReset } from 'react-hook-form';
import { CVData } from '@/lib/schema';

const clone = (data: CVData): CVData => JSON.parse(JSON.stringify(data));

export function useUndoRedo(
    cvData: CVData,
    reset: UseFormReset<CVData>,
    isDirty: boolean,
    resetKey?: string | null,
) {
    const snapshot = JSON.stringify(cvData);
    const snapshotRef = useRef(snapshot);
    const cvDataRef = useRef(cvData);
    const stableDataRef = useRef(cvData);
    const stableSnapshotRef = useRef(snapshot);
    const skipCommitRef = useRef(false);
    const prevResetKeyRef = useRef(resetKey);

    const [past, setPast] = useState<CVData[]>([]);
    const [future, setFuture] = useState<CVData[]>([]);

    useEffect(() => {
        snapshotRef.current = snapshot;
        cvDataRef.current = cvData;
    });

    useEffect(() => {
        if (prevResetKeyRef.current === resetKey) return;
        prevResetKeyRef.current = resetKey;
        setPast([]);
        setFuture([]);
        stableDataRef.current = cvDataRef.current;
        stableSnapshotRef.current = snapshotRef.current;
    }, [resetKey]);

    useEffect(() => {
        if (skipCommitRef.current) {
            skipCommitRef.current = false;
            stableDataRef.current = cvDataRef.current;
            stableSnapshotRef.current = snapshotRef.current;
            return;
        }
        if (snapshot === stableSnapshotRef.current) return;

        if (!isDirty) {
            stableDataRef.current = cvDataRef.current;
            stableSnapshotRef.current = snapshot;
            return;
        }

        const committed = clone(stableDataRef.current);
        setPast((p) => [...p, committed]);
        setFuture([]);
        stableDataRef.current = cvDataRef.current;
        stableSnapshotRef.current = snapshot;
    }, [snapshot, isDirty]);

    const undo = useCallback(() => {
        if (past.length === 0) return;
        const prev = clone(past[past.length - 1]);
        const current = clone(cvDataRef.current);
        setPast(past.slice(0, -1));
        setFuture((f) => [current, ...f]);
        skipCommitRef.current = true;
        reset(prev);
    }, [past, reset]);

    const redo = useCallback(() => {
        if (future.length === 0) return;
        const next = clone(future[0]);
        const current = clone(cvDataRef.current);
        setFuture(future.slice(1));
        setPast((p) => [...p, current]);
        skipCommitRef.current = true;
        reset(next);
    }, [future, reset]);

    const undoRef = useRef(undo);
    const redoRef = useRef(redo);
    useEffect(() => {
        undoRef.current = undo;
        redoRef.current = redo;
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            const key = e.key.toLowerCase();
            if (key === 'z') {
                e.preventDefault();
                if (e.shiftKey) redoRef.current();
                else undoRef.current();
            } else if (key === 'y') {
                e.preventDefault();
                redoRef.current();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return { canUndo: past.length > 0, canRedo: future.length > 0, undo, redo };
}
