'use client';

import { ChevronsUpDown, FileText, Search } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useResumeStore } from '@/store/useResumeStore';
import { useDialogStore } from '@/store/useDialogStore';

export function Header() {
  const { t } = useI18n();
  const { setDialog } = useDialogStore();
  const activeResume = useResumeStore((state) =>
    state.resumes.find((r) => r.id === state.activeId),
  );

  const activeResumeTitle = activeResume?.title ?? t('header.untitledCv');

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 p-3 sm:p-4 md:mb-6 md:p-0 print:hidden">
      <h1 className="shrink-0 text-base font-bold tracking-tight sm:text-lg">
        {t('brand.name')}
      </h1>

      <div className="flex h-5 items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('editor.commandPalette')}
          aria-keyshortcuts="Control+k Meta+k"
          onClick={() => setDialog('palette', true)}
        >
          <Search className="size-4" />
        </Button>
        <Separator orientation="vertical" />
        <ThemeToggle />

        <Separator orientation="vertical" className="hidden md:inline-flex" />
        <Button
          variant="secondary"
          type="button"
          onClick={() => setDialog('resumes', true)}
          className="hidden md:inline-flex"
        >
          <FileText className="size-4" data-icon="inline-start" />
          <span className="truncate">{activeResumeTitle}</span>
          <ChevronsUpDown className="size-4" data-icon="inline-end" />
        </Button>
      </div>
    </header>
  );
}
