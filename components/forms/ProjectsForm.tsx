'use client';

import { useI18n } from '@/hooks/useI18n';
import { FolderGit2 } from 'lucide-react';
import { SectionFieldArray } from './shared';

export const ProjectsForm = () => {
  const { t } = useI18n();
  return (
    <SectionFieldArray
      name="projects"
      emptyIcon={FolderGit2}
      title={t('projects.title')}
      description={t('projects.description')}
      addLabel={t('projects.add')}
      variant="card"
      itemLabel={t('projects.itemLabel')}
      removeTitle={t('projects.remove')}
      newItem={() => ({ name: '', date: '', description: '' })}
      fields={[
        {
          name: 'name',
          label: t('projects.nameLabel'),
          placeholder: t('projects.namePlaceholder'),
        },
        {
          name: 'date',
          label: t('projects.datesLabel'),
          placeholder: t('projects.datesPlaceholder'),
        },
        {
          name: 'description',
          as: 'textarea',
          className: '@[400px]/sidebar:col-span-2',
          label: t('projects.descriptionLabel'),
          placeholder: t('projects.descriptionPlaceholder'),
        },
      ]}
    />
  );
};
