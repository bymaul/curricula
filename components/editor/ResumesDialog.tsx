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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/components/I18nProvider';
import { TEMPLATE_COMPONENTS } from '@/components/resume/registry';
import { SAMPLE_CV_DATA } from '@/lib/sampleCv';
import { getPageDimensions } from '@/lib/pagination';
import { useResumeStore, ResumeRecord } from '@/store/useResumeStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  ArrowUpDown,
  Check,
  Copy,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

const THUMB_WIDTH_PX = 56;

type SortMode = 'recent' | 'name';

interface ResumesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ResumeThumb({ resume }: { resume: ResumeRecord }) {
  const Preview = TEMPLATE_COMPONENTS[resume.templateId];
  const page = getPageDimensions(resume.design.pageSize);
  const height = THUMB_WIDTH_PX * (page.height / page.width);

  return (
    <div
      aria-hidden="true"
      className="relative shrink-0 overflow-hidden rounded-md border border-border bg-white"
      style={{ width: THUMB_WIDTH_PX, height }}
    >
      <div
        className="pointer-events-none absolute top-0 left-0 origin-top-left select-none"
        style={{
          width: page.width,
          transform: `scale(${THUMB_WIDTH_PX / page.width})`,
        }}
      >
        <Preview
          cvData={resume.data}
          sectionOrder={resume.sectionOrder}
          hiddenSections={resume.hiddenSections}
          language={resume.language}
          photo={resume.photo}
          design={resume.design}
        />
      </div>
    </div>
  );
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
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');

  const normalizedQuery = query.trim().toLowerCase();
  const visibleResumes = resumes
    .filter((resume) =>
      `${resume.title} ${resume.data.name ?? ''}`
        .toLowerCase()
        .includes(normalizedQuery),
    )
    .sort((a, b) =>
      sort === 'name'
        ? a.title.localeCompare(b.title)
        : b.updatedAt - a.updatedAt,
    );

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

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setQuery('');
      setSort('recent');
    }
    onOpenChange(next);
  };

  const sortOptions = [
    { value: 'recent', label: t('resumes.sortRecent') },
    { value: 'name', label: t('resumes.sortName') },
  ] as const;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-xl grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t('resumes.title')}</DialogTitle>
            <DialogDescription>{t('resumes.description')}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 -mx-1">
            <div className="mb-2 flex gap-2 px-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('resumes.searchPlaceholder')}
                  aria-label={t('resumes.searchAria')}
                  className="h-9 pl-8 text-sm"
                />
              </div>
              <Select
                items={[...sortOptions]}
                value={sort}
                onValueChange={(value) => setSort(value as SortMode)}
              >
                <SelectTrigger
                  size="sm"
                  className="w-fit gap-1.5 px-2.5"
                  aria-label={t('resumes.sortAria')}
                >
                  <ArrowUpDown className="size-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-full p-2 pt-0">
              <div className="space-y-2">
                {visibleResumes.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('resumes.noMatches')}
                  </p>
                )}
                {visibleResumes.map((r) => {
                  const active = r.id === activeId;
                  const editing = editingId === r.id;
                  return (
                    <div
                      key={r.id}
                      className={cn(
                        'group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border p-2.5 w-full min-w-0 transition-colors',
                        active
                          ? 'bg-muted/40 border-primary/40'
                          : 'hover:bg-muted/30',
                      )}
                    >
                      <ResumeThumb resume={r} />

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
                          className="flex min-w-0 flex-1 items-start justify-between gap-2 text-left"
                        >
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

                      <div className="flex items-center gap-0.5 shrink-0 self-start">
                        {!editing && (
                          <div className="flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-opacity">
                            <IconButton
                              aria-label={t('resumes.renameAria', {
                                title: r.title,
                              })}
                              onClick={() => startRename(r.id, r.title)}
                            >
                              <Pencil className="size-4" />
                            </IconButton>
                            <IconButton
                              aria-label={t('resumes.duplicateAria', {
                                title: r.title,
                              })}
                              onClick={() => duplicateResume(r.id)}
                            >
                              <Copy className="size-4" />
                            </IconButton>
                            <IconButton
                              aria-label={t('resumes.deleteAria', {
                                title: r.title,
                              })}
                              onClick={() => handleDelete(r.id, r.title)}
                              disabled={resumes.length <= 1}
                              className="hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-4" />
                            </IconButton>
                          </div>
                        )}

                        {active && (
                          <Check className="size-4 mx-1 text-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="items-stretch sm:items-center">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={handleCreate}>
                <Plus className="size-4" />
                {t('resumes.newCv')}
              </Button>
              <Button variant="outline" onClick={handleCreateFromSample}>
                {t('resumes.newFromExample')}
              </Button>
            </div>
            <Button onClick={() => onOpenChange(false)}>
              {t('common.done')}
            </Button>
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
            <Trash2 className="size-4" />
            {t('common.delete')}
          </>
        }
        destructive
        onConfirm={confirmDelete}
      />
    </>
  );
}
