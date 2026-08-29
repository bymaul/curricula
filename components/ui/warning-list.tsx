'use client';

import { cn } from '@/lib/utils';
import { TriangleAlertIcon } from 'lucide-react';

interface WarningListProps {
  title: string;
  warnings: string[];
  className?: string;
}

export function WarningList({ title, warnings, className }: WarningListProps) {
  if (warnings.length === 0) return null;
  return (
    <div
      role="alert"
      className={cn(
        'border-warning/40 bg-warning/10 rounded-lg border px-3 py-2.5',
        className,
      )}
    >
      <div className="text-warning mb-1 flex items-center gap-2 text-sm font-medium">
        <TriangleAlertIcon className="size-4 shrink-0" aria-hidden="true" />
        {title}
      </div>
      <ul className="text-muted-foreground space-y-0.5 text-sm">
        {warnings.map((warning) => (
          <li key={warning}>- {warning}</li>
        ))}
      </ul>
    </div>
  );
}
