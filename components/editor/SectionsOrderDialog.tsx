'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SortableList, SortableRow } from '@/components/forms/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconButton } from '@/components/ui/icon-button';
import { useI18n } from '@/components/I18nProvider';
import { TranslationKey } from '@/lib/i18n';
import { SectionId } from '@/lib/consts';
import { useResumeStore } from '@/store/useResumeStore';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

const SECTION_TITLE_KEYS: Record<SectionId, TranslationKey> = {
  summary: 'template.summary',
  experience: 'template.experience',
  projects: 'template.projects',
  education: 'template.education',
  skills: 'template.skills',
  certifications: 'template.certifications',
};

interface SectionsOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SectionsOrderDialog({
  open,
  onOpenChange,
}: SectionsOrderDialogProps) {
  const activeResume = useResumeStore((state) =>
    state.resumes.find((r) => r.id === state.activeId),
  );
  const moveSection = useResumeStore((state) => state.moveSection);
  const toggleSectionVisibility = useResumeStore(
    (state) => state.toggleSectionVisibility,
  );
  const resetSectionOrder = useResumeStore((state) => state.resetSectionOrder);
  const { t } = useI18n();

  const sectionOrder = activeResume?.sectionOrder ?? [];
  const hiddenSections = new Set(activeResume?.hiddenSections ?? []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('sectionsOrder.title')}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 -mx-1">
          <ScrollArea className="h-full p-2">
            <p className="text-xs text-muted-foreground mb-3 px-1">
              {t('sectionsOrder.description')}
            </p>
            <SortableList ids={sectionOrder} onMove={moveSection}>
              {sectionOrder.map((id) => {
                const title = t(SECTION_TITLE_KEYS[id]);
                const hidden = hiddenSections.has(id);
                return (
                  <SortableRow
                    key={id}
                    id={id}
                    className={cn('items-center', hidden && 'opacity-60')}
                    handleClassName="mb-0"
                  >
                    <span className="flex-1 text-sm font-semibold">
                      {title}
                    </span>
                    <IconButton
                      aria-label={t(
                        hidden ? 'sectionsOrder.show' : 'sectionsOrder.hide',
                        { title },
                      )}
                      onClick={() => toggleSectionVisibility(id as SectionId)}
                      aria-pressed={!hidden}
                    >
                      {hidden ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </IconButton>
                  </SortableRow>
                );
              })}
            </SortableList>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetSectionOrder}>
            <RotateCcw className="w-4 h-4" />
            {t('sectionsOrder.resetOrder')}
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            {t('common.done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
