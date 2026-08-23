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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { IconButton } from '@/components/ui/icon-button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useI18n } from '@/components/I18nProvider';
import { SAMPLE_CV_DATA } from '@/lib/sampleCv';
import { useResumeStore } from '@/store/useResumeStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Check, Copy, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ResumesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumesDialog({ open, onOpenChange }: ResumesDialogProps) {
  const resumes = useResumeStore((state) => state.resumes);
  const activeId = useResumeStore((state) => state.activeId);
  const setActiveResume = useResumeStore((state) => state.setActiveResume);
  const createResume = useResumeStore((state) => state.createResume);
  const importResumeData = useResumeStore((state) => state.importResumeData);
  const duplicateResume = useResumeStore((state) => state.duplicateResume);
  const deleteResume = useResumeStore((state) => state.deleteResume);
  const renameResume = useResumeStore((state) => state.renameResume);
  const { t } = useI18n();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

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

  const handleCreateFromSample = () => {
    importResumeData(SAMPLE_CV_DATA, t('resumes.sampleTitle'));
    onOpenChange(false);
  };

  const handleSelect = (id: string) => {
    setActiveResume(id);
    onOpenChange(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (resumes.length <= 1) return;
    setDeleteTarget({ id, title });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteResume(deleteTarget.id);
    if (editingId === deleteTarget.id) setEditingId(null);
    setDeleteTarget(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t('resumes.title')}</DialogTitle>
            <DialogDescription>{t('resumes.description')}</DialogDescription>
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
                          aria-label={t('resumes.titleInputAria')}
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
                              {formatRelativeTime(r.updatedAt, undefined, t)}
                            </span>
                          </span>
                        </button>
                      )}

                      <div className="flex items-center gap-0.5 shrink-0">
                        {!editing && (
                          <div className="flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-opacity">
                            <IconButton
                              aria-label={t('resumes.renameAria', {
                                title: r.title,
                              })}
                              onClick={() => startRename(r.id, r.title)}
                            >
                              <Pencil className="w-4 h-4" />
                            </IconButton>
                            <IconButton
                              aria-label={t('resumes.duplicateAria', {
                                title: r.title,
                              })}
                              onClick={() => duplicateResume(r.id)}
                            >
                              <Copy className="w-4 h-4" />
                            </IconButton>
                            <IconButton
                              aria-label={t('resumes.deleteAria', {
                                title: r.title,
                              })}
                              onClick={() => handleDelete(r.id, r.title)}
                              disabled={resumes.length <= 1}
                              className="hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </IconButton>
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
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="sm:mr-auto"
            >
              {t('common.done')}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCreate}
                className="flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4" data-icon="inline-start" />
                {t('resumes.newCv')}
              </Button>
              <Button
                variant="outline"
                onClick={handleCreateFromSample}
                className="flex-1 sm:flex-none"
              >
                <FileText className="w-4 h-4" data-icon="inline-start" />
                {t('resumes.newFromExample')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title={t('resumes.confirmDeleteTitle')}
        description={
          deleteTarget
            ? t('resumes.confirmDeleteDescription', {
                title: deleteTarget.title,
              })
            : undefined
        }
        confirmLabel={
          <>
            <Trash2 className="w-4 h-4" />
            {t('common.delete')}
          </>
        }
        destructive
        onConfirm={confirmDelete}
      />
    </>
  );
}
