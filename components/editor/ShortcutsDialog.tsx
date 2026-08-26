'use client';

import { useI18n } from '@/components/I18nProvider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMemo } from 'react';
import type { TranslationKey } from '@/lib/i18n';

interface ShortcutRow {
  keys: string[];
  labelKey: TranslationKey;
}

function useIsApplePlatform(): boolean {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }, []);
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-7 items-center justify-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
      {children}
    </kbd>
  );
}

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const isApple = useIsApplePlatform();
  const mod = isApple ? '⌘' : 'Ctrl';

  const rows: ShortcutRow[] = [
    {
      keys: isApple ? ['⌘', 'Z'] : ['Ctrl', 'Z'],
      labelKey: 'editor.shortcutLabels.undo',
    },
    {
      keys: isApple ? ['⌘⇧', 'Z'] : ['Ctrl', 'Shift', 'Z'],
      labelKey: 'editor.shortcutLabels.redo',
    },
    ...(isApple
      ? []
      : ([
          { keys: ['Ctrl', 'Y'], labelKey: 'editor.shortcutLabels.redo' },
        ] as ShortcutRow[])),
    {
      keys: [mod, 'S'],
      labelKey: 'editor.shortcutLabels.save',
    },
    {
      keys: [mod, 'P'],
      labelKey: 'editor.shortcutLabels.print',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('editor.shortcutsTitle')}</DialogTitle>
          <DialogDescription>
            {t('editor.shortcutsDescription')}
          </DialogDescription>
        </DialogHeader>

        <ul className="divide-y divide-border">
          {rows.map((row, index) => (
            <li
              key={`${row.labelKey}-${index}`}
              className="flex items-center justify-between gap-4 py-2.5"
            >
              <span className="text-sm">{t(row.labelKey)}</span>
              <span className="flex shrink-0 items-center gap-1">
                {row.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
