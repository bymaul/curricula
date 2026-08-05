'use client';

import { GitHubLink } from '@/components/GitHubLink';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface MobileTopBarProps {
  value: 'edit' | 'preview';
  onChange: (view: 'edit' | 'preview') => void;
}

const OPTIONS = [
  { value: 'edit', label: 'Edit' },
  { value: 'preview', label: 'Preview' },
] as const;

export function MobileTopBar({ value, onChange }: MobileTopBarProps) {
  return (
    <header className="lg:hidden shrink-0 p-4 print:hidden">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold tracking-tight shrink-0">Curricula</h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {OPTIONS.map(({ value: v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v)}
                aria-current={value === v ? 'page' : undefined}
                className={cn(
                  'h-7 px-2 rounded-md text-xs font-semibold transition-colors',
                  value === v
                    ? 'text-foreground border border-border'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-5" />
          <GitHubLink />
        </div>
      </div>
    </header>
  );
}
