'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SortableList, SortableRow } from '@/components/forms/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/components/I18nProvider';
import { SectionId } from '@/lib/consts';
import { getCustomSections } from '@/lib/schema';
import type { TranslationKey } from '@/lib/i18n';
import { useResumeStore } from '@/store/useResumeStore';
import {
  DROPDOWN_ITEM_CLASS,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, ListPlus, Plus, RotateCcw } from 'lucide-react';

const SECTION_TITLE_KEYS: Partial<Record<SectionId, TranslationKey>> = {
  summary: 'template.summary',
  experience: 'template.experience',
  projects: 'template.projects',
  education: 'template.education',
  skills: 'template.skills',
  certifications: 'template.certifications',
};

const PRESETS: { titleKey: TranslationKey }[] = [
  { titleKey: 'sectionsOrder.presetPublications' },
  { titleKey: 'sectionsOrder.presetAwards' },
  { titleKey: 'sectionsOrder.presetLanguages' },
  { titleKey: 'sectionsOrder.presetVolunteer' },
  { titleKey: 'sectionsOrder.presetInterests' },
];

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
  const addCustomSection = useResumeStore((state) => state.addCustomSection);
  const customSections = getCustomSections(activeResume?.data);
  const { t } = useI18n();

  const sectionOrder = activeResume?.sectionOrder ?? [];
  const hiddenSections = new Set(activeResume?.hiddenSections ?? []);

  const resolveTitle = (id: SectionId) => {
    const key = SECTION_TITLE_KEYS[id];
    if (key) return t(key);
    return customSections.find((s) => s.id === id)?.title ?? '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('sectionsOrder.title')}</DialogTitle>
          <DialogDescription>
            {t('sectionsOrder.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 -mx-1">
          <ScrollArea className="h-full p-2">
            <SortableList ids={sectionOrder} onMove={moveSection}>
              {sectionOrder.map((id) => {
                const title = resolveTitle(id);
                const hidden = hiddenSections.has(id);
                return (
                  <SortableRow
                    key={id}
                    id={id}
                    className={cn('items-center', hidden && 'opacity-60')}
                    handleClassName="mb-0"
                  >
                    <span className="flex-1 truncate text-sm font-semibold">
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
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </IconButton>
                  </SortableRow>
                );
              })}
            </SortableList>
          </ScrollArea>
        </div>

        <DialogFooter className="items-stretch sm:items-center">
          <AddSectionControl onAdd={addCustomSection} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={resetSectionOrder}>
              <RotateCcw className="size-4" />
              {t('sectionsOrder.resetOrder')}
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              {t('common.done')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddSectionControl({ onAdd }: { onAdd: (title: string) => void }) {
  const { t } = useI18n();
  const [customMode, setCustomMode] = useState(false);
  const [name, setName] = useState('');

  const submitCustom = () => {
    if (!name.trim()) return;
    onAdd(name);
    setName('');
    setCustomMode(false);
  };

  if (customMode) {
    return (
      <div className="flex w-full gap-2 sm:w-auto">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('sectionsOrder.namePlaceholder')}
          aria-label={t('sectionsOrder.namePlaceholder')}
          onKeyDown={(e) => e.key === 'Enter' && submitCustom()}
          autoFocus
        />
        <Button onClick={submitCustom}>{t('sectionsOrder.add')}</Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            <Plus className="size-4" />
            {t('sectionsOrder.addSection')}
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-52 p-1.5">
        {PRESETS.map(({ titleKey }) => (
          <DropdownMenuItem
            key={titleKey}
            className={DROPDOWN_ITEM_CLASS}
            onClick={() => onAdd(t(titleKey))}
          >
            {t(titleKey)}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={DROPDOWN_ITEM_CLASS}
          onClick={() => setCustomMode(true)}
        >
          <ListPlus className="size-4 text-muted-foreground" />
          {t('sectionsOrder.customSection')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
