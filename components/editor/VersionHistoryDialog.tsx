'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  const entries = history?.entries ?? [];
  const cursor = history?.cursor ?? -1;
  const reversed = [...entries].reverse();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 -mx-1">
          <ScrollArea className="h-full p-2">
            <p className="text-xs text-muted-foreground mb-3 px-1">
              Undo, redo, and restore any earlier version of this CV. History is
              kept in memory for this session.
            </p>
            {reversed.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1">
                No saved versions yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {reversed.map((entry, i) => {
                  const index = entries.length - 1 - i;
                  const isCurrent = index === cursor;
                  const title = entry.data.name?.trim() || 'Untitled CV';
                  return (
                    <li
                      key={index}
                      className={cn(
                        'flex items-center justify-between gap-3 py-2.5 px-1',
                        !isCurrent && 'opacity-80',
                      )}
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold truncate">
                          {isCurrent && (
                            <History className="w-4 h-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate">{title}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(entry.at)}
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
                        {isCurrent ? 'Current' : 'Restore'}
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
