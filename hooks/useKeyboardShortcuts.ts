'use client';

import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPrint: () => void;
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSave,
  onPrint,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isTyping) return;

      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;

      const key = event.key.toLowerCase();

      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) onRedo();
        else onUndo();
        return;
      }
      if (key === 'y') {
        event.preventDefault();
        onRedo();
        return;
      }
      if (key === 's') {
        event.preventDefault();
        onSave();
        return;
      }
      if (key === 'p') {
        event.preventDefault();
        onPrint();
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onUndo, onRedo, onSave, onPrint]);
}
