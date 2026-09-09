'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RenameDialog } from '@/components/ui/rename-dialog';
import { useI18n } from '@/hooks/useI18n';
import type { CustomSection } from '@/lib/schema';
import { useResumeStore } from '@/store/useResumeStore';
import { Pencil, Trash2 } from 'lucide-react';
import { SectionFieldArray } from './shared';
import { Button } from '@/components/ui/button';

type CustomItemsPath = `customSections.${number}.items`;

interface CustomSectionFormProps {
  section: CustomSection;
}

export const CustomSectionForm = ({ section }: CustomSectionFormProps) => {
  const { t } = useI18n();
  const itemsName =
    `customSections.${section.id}.items` as unknown as CustomItemsPath;
  const renameCustomSection = useResumeStore(
    (state) => state.renameCustomSection,
  );
  const removeCustomSection = useResumeStore(
    (state) => state.removeCustomSection,
  );

  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleRename = (title: string) => {
    if (title.trim() && title.trim() !== section.title) {
      renameCustomSection(section.id, title.trim());
    }
    setRenameOpen(false);
  };

  return (
    <div className="px-4 py-2">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div>
            <h2 className="truncate text-xl font-bold tracking-tight">
              {section.title}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('customSection.description')}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('customSection.rename')}
            onClick={() => setRenameOpen(true)}
          >
            <Pencil />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('customSection.deleteAria', {
              title: section.title,
            })}
            onClick={() => setConfirmDelete(true)}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <SectionFieldArray
        name={itemsName}
        title={section.title}
        description={t('customSection.description')}
        showHeading={false}
        addLabel={`${t('sectionsOrder.add')}: ${section.title}`}
        variant="card"
        removeTitle={t('common.delete')}
        itemLabel={section.title}
        newItem={() => ({
          title: '',
          subtitle: '',
          date: '',
          location: '',
          description: '',
        })}
        fields={[
          {
            name: 'title',
            label: t('customSection.titleLabel'),
          },
          {
            name: 'date',
            label: t('customSection.dateLabel'),
          },
          {
            name: 'subtitle',
            label: t('customSection.subtitleLabel'),
          },
          {
            name: 'location',
            label: t('customSection.locationLabel'),
          },
          {
            name: 'description',
            as: 'textarea',
            className: '@[400px]/sidebar:col-span-2',
            label: t('customSection.descriptionLabel'),
          },
        ]}
      />
      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title={t('customSection.rename')}
        value={section.title}
        onRename={handleRename}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('customSection.confirmDeleteTitle')}
        description={t('customSection.confirmDeleteDescription', {
          title: section.title,
        })}
        confirmLabel={
          <>
            <Trash2 />
            {t('common.delete')}
          </>
        }
        onConfirm={() => {
          removeCustomSection(section.id);
          setConfirmDelete(false);
        }}
        destructive
      />
    </div>
  );
};
