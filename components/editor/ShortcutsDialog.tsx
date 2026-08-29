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
import { isApplePlatform } from '@/lib/platform';

interface ShortcutRow {
  keys: string[];
  labelKey: TranslationKey;
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="border-border bg-muted text-foreground inline-flex min-w-7 items-center justify-center rounded-md border px-1.5 py-0.5 font-mono text-xs font-medium">
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
  const isApple = useMemo(() => isApplePlatform(), []);
  const mod = isApple ? '⌘' : 'Ctrl';

  const rows: ShortcutRow[] = [
    {
      keys: [mod, 'K'],
      labelKey: 'editor.shortcutLabels.palette',
    },
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

        <ul className="divide-border divide-y">
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
