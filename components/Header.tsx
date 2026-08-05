'use client';

import { ChevronsUpDown, FileText } from 'lucide-react';
import { GitHubLink } from './GitHubLink';
import { Button, buttonVariants } from './ui/button';
import { Separator } from './ui/separator';
import { useResumeStore } from '@/store/useResumeStore';
import { useDialogStore } from '@/store/useDialogStore';

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

      <div className="flex items-center gap-2">
        <GitHubLink size="sm" />
        <Separator orientation="vertical" />
        <div className="flex items-center gap-1 lg:hidden">
          {OPTIONS.map(({ value: v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              aria-current={value === v ? 'page' : undefined}
              className={buttonVariants({
                variant: value === v ? 'outline' : 'ghost',
                size: 'sm',
              })}
            >
              {label}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
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
