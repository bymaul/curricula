'use client';

import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPrint: () => void;
  onShowShortcuts?: () => void;
  onTogglePalette?: () => void;
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSave,
  onPrint,
  onShowShortcuts,
  onTogglePalette,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (mod && key === 'k' && onTogglePalette) {
        event.preventDefault();
        onTogglePalette();
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isTyping) return;

      if (!mod && event.key === '?') {
        if (onShowShortcuts) {
          event.preventDefault();
          onShowShortcuts();
        }
        return;
      }

      if (!mod) return;

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
  }, [onUndo, onRedo, onSave, onPrint, onShowShortcuts, onTogglePalette]);
}
