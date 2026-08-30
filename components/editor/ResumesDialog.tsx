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
import { TooltipIconButton } from '@/components/ui/tooltip-icon-button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/hooks/useI18n';
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
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type SortMode = 'recent' | 'name';

interface ResumesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useResumeCardScale(pageWidthPx: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / pageWidthPx);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageWidthPx]);

  return { ref, scale };
}

interface ResumeCardProps {
  resume: ResumeRecord;
  active: boolean;
  editing: boolean;
  draft: string;
  canDelete: boolean;
  onDraftChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onSelect: () => void;
  onStartRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

function ResumeCard({
  resume,
  active,
  editing,
  draft,
  canDelete,
  onDraftChange,
  onCommitRename,
  onCancelRename,
  onSelect,
  onStartRename,
  onDuplicate,
  onDelete,
  onToggleFavorite,
}: ResumeCardProps) {
  const { t } = useI18n();
  const page = getPageDimensions(resume.design.pageSize);
  const Preview = TEMPLATE_COMPONENTS[resume.templateId];
  const { ref, scale } = useResumeCardScale(page.width);

  return (
    <div className="group border-border hover:bg-muted/30 relative flex min-w-0 flex-col rounded-lg border p-2 transition-colors">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className="focus-visible:ring-ring/50 relative w-full rounded-md text-left outline-none focus-visible:ring-3"
      >
        <div
          ref={ref}
          className="border-border relative w-full overflow-hidden rounded-md border bg-white"
          style={{ aspectRatio: `${page.width} / ${page.height}` }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 origin-top-left text-black select-none"
            style={{
              width: page.width,
              transform: `scale(${scale})`,
              visibility: scale > 0 ? 'visible' : 'hidden',
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
      </button>

      <div className="absolute top-2.5 right-2.5 left-2.5 z-10 flex items-center justify-between">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="icon-sm"
                aria-label={
                  resume.favorite
                    ? t('resumes.unfavoriteAria', { title: resume.title })
                    : t('resumes.favoriteAria', { title: resume.title })
                }
                onClick={onToggleFavorite}
                className={cn(
                  'size-6 rounded-full transition-[opacity,background-color,color,box-shadow] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100',
                  resume.favorite
                    ? 'ring-border bg-amber-500/15 text-amber-600 opacity-100 shadow-sm ring-1 hover:bg-amber-500/30 hover:text-amber-700 [@media(hover:hover)]:opacity-100'
                    : 'text-muted-foreground ring-border bg-white/70 shadow-sm ring-1 hover:bg-white/90 hover:text-amber-600',
                )}
              >
                <Star className="size-3.5 fill-current" />
              </Button>
            }
          />
          <TooltipContent>
            {resume.favorite
              ? t('resumes.unfavoriteAria', { title: resume.title })
              : t('resumes.favoriteAria', { title: resume.title })}
          </TooltipContent>
        </Tooltip>
        {active && (
          <span className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm">
            <Check className="size-3" />
            {t('resumes.active')}
          </span>
        )}
      </div>

      <div className="mt-2 min-w-0">
        {editing ? (
          <Input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitRename();
              if (e.key === 'Escape') onCancelRename();
            }}
            onBlur={onCommitRename}
            autoFocus
            aria-label={t('resumes.titleInputAria')}
            className="h-7 w-full text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={onSelect}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="truncate text-sm font-semibold">
              {resume.title}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {formatRelativeTime(resume.updatedAt, undefined, t)}
            </span>
          </button>
        )}

        {!editing && (
          <div className="mt-1.5 flex items-center gap-0.5">
            <TooltipIconButton
              label={t('resumes.renameAria', { title: resume.title })}
              onClick={onStartRename}
            >
              <Pencil className="size-4" />
            </TooltipIconButton>
            <TooltipIconButton
              label={t('resumes.duplicateAria', { title: resume.title })}
              onClick={onDuplicate}
            >
              <Copy className="size-4" />
            </TooltipIconButton>
            <TooltipIconButton
              label={t('resumes.deleteAria', { title: resume.title })}
              onClick={onDelete}
              disabled={!canDelete}
              className="hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4" />
            </TooltipIconButton>
          </div>
        )}
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
  const toggleFavorite = useResumeStore((state) => state.toggleFavorite);
  const { t } = useI18n();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleResumes = resumes
    .filter((resume) => {
      const matchesQuery = `${resume.title} ${resume.data.name ?? ''}`
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesFavorite = favoriteOnly ? !!resume.favorite : true;
      return matchesQuery && matchesFavorite;
    })
    .sort((a, b) => {
      if (!!a.favorite !== !!b.favorite) return a.favorite ? -1 : 1;
      return sort === 'name'
        ? a.title.localeCompare(b.title)
        : b.updatedAt - a.updatedAt;
    });

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
      setFavoriteOnly(false);
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
        <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('resumes.title')}</DialogTitle>
            <DialogDescription>{t('resumes.description')}</DialogDescription>
          </DialogHeader>

          <div className="-mx-1 flex min-h-0 flex-col">
            <div className="mb-6 flex min-w-0 flex-col gap-2 px-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('resumes.searchPlaceholder')}
                  aria-label={t('resumes.searchAria')}
                  className="h-9 w-full pl-8 text-sm"
                />
              </div>
              <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-start">
                <Button
                  type="button"
                  aria-label={t('resumes.filterFavorites')}
                  aria-pressed={favoriteOnly}
                  onClick={() => setFavoriteOnly((v) => !v)}
                  variant={favoriteOnly ? 'default' : 'outline'}
                  className="min-h-9 min-w-9 gap-1.5 px-2.5"
                >
                  <Star
                    className={cn(
                      'size-4',
                      favoriteOnly ? 'fill-current' : 'text-muted-foreground',
                    )}
                  />
                  <span className="max-sm:hidden">
                    {t('resumes.filterFavorites')}
                  </span>
                </Button>
                <Select
                  items={[...sortOptions]}
                  value={sort}
                  onValueChange={(value) => setSort(value as SortMode)}
                >
                  <SelectTrigger
                    className="min-h-9 w-full flex-1 justify-between gap-1.5 px-2.5 sm:w-fit sm:flex-none"
                    aria-label={t('resumes.sortAria')}
                  >
                    <ArrowUpDown className="text-muted-foreground size-3.5" />
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
            </div>

            <ScrollArea className="min-h-0 flex-1 px-2 pt-0">
              {visibleResumes.length === 0 ? (
                favoriteOnly && !normalizedQuery ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <p className="text-muted-foreground text-sm">
                      {t('resumes.noFavorites')}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setFavoriteOnly(false)}
                    >
                      <Star className="size-4" />
                      {t('resumes.showAll')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <p className="text-muted-foreground text-sm">
                      {t('resumes.noMatches')}
                    </p>
                    <Button variant="outline" onClick={() => setQuery('')}>
                      <X className="size-4" />
                      {t('resumes.clearSearch')}
                    </Button>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 lg:grid-cols-4">
                  {visibleResumes.map((r) => {
                    const active = r.id === activeId;
                    const editing = editingId === r.id;
                    return (
                      <ResumeCard
                        key={r.id}
                        resume={r}
                        active={active}
                        editing={editing}
                        draft={draft}
                        canDelete={resumes.length > 1}
                        onDraftChange={setDraft}
                        onCommitRename={commitRename}
                        onCancelRename={() => setEditingId(null)}
                        onSelect={() => handleSelect(r.id)}
                        onStartRename={() => startRename(r.id, r.title)}
                        onDuplicate={() => duplicateResume(r.id)}
                        onDelete={() => handleDelete(r.id, r.title)}
                        onToggleFavorite={() => toggleFavorite(r.id)}
                      />
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter className="bg-muted flex-col items-stretch sm:items-center">
            <Button onClick={handleCreate}>
              <Plus className="size-4" />
              {t('resumes.newCv')}
            </Button>
            <Button variant="outline" onClick={handleCreateFromSample}>
              {t('resumes.newFromExample')}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
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
