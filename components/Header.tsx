'use client';

import { ChevronsUpDown, FileText } from 'lucide-react';
import { GitHubLink } from './GitHubLink';
import { LanguageSwitcher } from './LanguageSwitcher';
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
  { value: 'edit', label: 'Edit' },
  { value: 'preview', label: 'Preview' },
] as const;

export function Header({ value, onChange }: HeaderProps) {
  const { setDialog } = useDialogStore();
  const activeResume = useResumeStore((state) =>
    state.resumes.find((r) => r.id === state.activeId),
  );

  const activeResumeTitle = activeResume?.title ?? 'Untitled CV';

  return (
    <header className="p-4 lg:p-0 flex items-center justify-between shrink-0 lg:mb-6 print:hidden">
      <h1 className="text-lg font-bold tracking-tight shrink-0">Curricula</h1>

      <div className="flex items-center h-5 gap-2">
        <GitHubLink />
        <Separator orientation="vertical" />
        <LanguageSwitcher />
        <Separator orientation="vertical" />
        <Tabs
          value={value}
          onValueChange={(v) => onChange(v)}
          className="flex lg:hidden"
        >
          <TabsList>
            {OPTIONS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
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
          <FileText className="w-4 h-4" data-icon="inline-start" />
          <span className="truncate">{activeResumeTitle}</span>
          <ChevronsUpDown className="w-4 h-4" data-icon="inline-end" />
        </Button>
      </div>
    </header>
  );
}
