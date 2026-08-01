'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useResumeStore } from '@/store/useResumeStore';
import { cn } from '@/lib/utils';
import { Check, Copy, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ResumesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const ACTION_CLASSNAME =
  'shrink-0 p-2 lg:p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors';

export function ResumesDialog({ open, onOpenChange }: ResumesDialogProps) {
  const resumes = useResumeStore((state) => state.resumes);
  const activeId = useResumeStore((state) => state.activeId);
  const setActiveResume = useResumeStore((state) => state.setActiveResume);
  const createResume = useResumeStore((state) => state.createResume);
  const duplicateResume = useResumeStore((state) => state.duplicateResume);
  const deleteResume = useResumeStore((state) => state.deleteResume);
  const renameResume = useResumeStore((state) => state.renameResume);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setDraft(title);
  };

  const commitRename = () => {
    if (editingId) renameResume(editingId, draft);
    setEditingId(null);
  };

  const handleCreate = () => {
    createResume();
    onOpenChange(false);
  };

  const handleSelect = (id: string) => {
    setActiveResume(id);
    onOpenChange(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (resumes.length <= 1) return;
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteResume(id);
    if (editingId === id) setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Resumes</DialogTitle>
          <DialogDescription>
            Create, switch, or manage your CVs.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 -mx-1">
          <ScrollArea className="h-full p-2">
            <div className="space-y-2">
              {resumes.map((r) => {
                const active = r.id === activeId;
                const editing = editingId === r.id;
                return (
                  <div
                    key={r.id}
                    className={cn(
                      'group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border p-3 w-full min-w-0 transition-colors',
                      active
                        ? 'bg-muted/40 border-primary/40'
                        : 'hover:bg-muted/30',
                    )}
                  >
                    {editing ? (
                      <Input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={commitRename}
                        autoFocus
                        aria-label="Resume title"
                        className="h-8 text-sm w-full"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelect(r.id)}
                        className="flex items-center gap-2 min-w-0 text-left"
                      >
                        <FileText
                          className={cn(
                            'w-4 h-4 shrink-0',
                            active ? 'text-primary' : 'text-muted-foreground',
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold truncate">
                            {r.title}
                          </span>
                          <span className="block text-xs text-muted-foreground truncate">
                            {formatRelativeTime(r.updatedAt)}
                          </span>
                        </span>
                      </button>
                    )}

                    <div className="flex items-center gap-0.5 shrink-0">
                      {!editing && (
                        <div className="flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => startRename(r.id, r.title)}
                            title="Rename"
                            aria-label={`Rename ${r.title}`}
                            className={ACTION_CLASSNAME}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateResume(r.id)}
                            title="Duplicate"
                            aria-label={`Duplicate ${r.title}`}
                            className={ACTION_CLASSNAME}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id, r.title)}
                            title="Delete"
                            aria-label={`Delete ${r.title}`}
                            disabled={resumes.length <= 1}
                            className={cn(
                              ACTION_CLASSNAME,
                              'hover:text-destructive hover:bg-destructive/10',
                            )}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {active && (
                        <Check className="w-4 h-4 mx-1 text-primary shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCreate}>
            <Plus className="w-4 h-4" />
            New CV
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
