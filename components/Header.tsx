'use client';

import { ChevronsUpDown, FileText, Search } from 'lucide-react';
import { useI18n } from './I18nProvider';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useResumeStore } from '@/store/useResumeStore';
import { useDialogStore } from '@/store/useDialogStore';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

interface HeaderProps {
  value: 'edit' | 'preview';
  onChange: (view: 'edit' | 'preview') => void;
}

const OPTIONS = [
  { value: 'edit', labelKey: 'header.viewEdit' },
  { value: 'preview', labelKey: 'header.viewPreview' },
] as const;

export function Header({ value, onChange }: HeaderProps) {
  const { t } = useI18n();
  const { setDialog } = useDialogStore();
  const activeResume = useResumeStore((state) =>
    state.resumes.find((r) => r.id === state.activeId),
  );

  const activeResumeTitle = activeResume?.title ?? t('header.untitledCv');

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 p-3 sm:p-4 lg:mb-6 lg:p-0 print:hidden">
      <h1 className="shrink-0 text-base font-bold tracking-tight sm:text-lg">
        {t('brand.name')}
      </h1>

      <div className="flex h-5 items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-9"
          aria-label={t('editor.commandPalette')}
          aria-keyshortcuts="Control+k Meta+k"
          onClick={() => setDialog('palette', true)}
        >
          <Search className="size-4" />
        </Button>
        <Separator orientation="vertical" />
        <ThemeToggle />
        <Separator orientation="vertical" />
        <Tabs
          value={value}
          onValueChange={(v) => onChange(v)}
          className="flex lg:hidden"
        >
          <TabsList>
            {OPTIONS.map(({ value, labelKey }) => (
              <TabsTrigger key={value} value={value}>
                {t(labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button
          variant="secondary"
          type="button"
          onClick={() => setDialog('resumes', true)}
          className="hidden lg:inline-flex"
        >
          <FileText className="size-4" data-icon="inline-start" />
          <span className="truncate">{activeResumeTitle}</span>
          <ChevronsUpDown className="size-4" data-icon="inline-end" />
        </Button>
      </div>
    </header>
  );
}
