'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useI18n } from '@/hooks/useI18n';
import { useResumeStore } from '@/store/useResumeStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import { History } from 'lucide-react';

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VersionHistoryDialog({
  open,
  onOpenChange,
}: VersionHistoryDialogProps) {
  const activeId = useResumeStore((state) => state.activeId);
  const history = useResumeStore((state) =>
    activeId ? state.histories[activeId] : undefined,
  );
  const restoreHistory = useResumeStore((state) => state.restoreHistory);
  const { t } = useI18n();

  const entries = history?.entries ?? [];
  const cursor = history?.cursor ?? -1;
  const reversed = [...entries].reverse();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('versionHistory.title')}</DialogTitle>
          <DialogDescription>
            {t('versionHistory.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-1 min-h-0">
          <ScrollArea className="h-full p-2">
            {reversed.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-1 py-10 text-center">
                <History
                  className="text-muted-foreground size-5"
                  aria-hidden="true"
                />
                <p className="text-muted-foreground max-w-xs text-sm">
                  {t('versionHistory.empty')}
                </p>
              </div>
            ) : (
              <ul className="divide-border divide-y">
                {reversed.map((entry, i) => {
                  const index = entries.length - 1 - i;
                  const isCurrent = index === cursor;
                  const title =
                    entry.data.name?.trim() || t('header.untitledCv');
                  return (
                    <li
                      key={index}
                      className={cn(
                        'flex items-center justify-between gap-3 px-1 py-2.5',
                        !isCurrent && 'opacity-80',
                      )}
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-sm font-semibold">
                          {isCurrent && (
                            <History className="text-muted-foreground size-4 shrink-0" />
                          )}
                          <span className="truncate">{title}</span>
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatRelativeTime(entry.at, undefined, t)}
                        </p>
                      </div>
                      <Button
                        variant={isCurrent ? 'ghost' : 'outline'}
                        size="sm"
                        disabled={isCurrent}
                        onClick={() =>
                          activeId && restoreHistory(activeId, index)
                        }
                        className="shrink-0"
                      >
                        {isCurrent ? t('common.current') : t('common.restore')}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
