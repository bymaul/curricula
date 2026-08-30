'use client';

import { useI18n } from '@/hooks/useI18n';
import { Wrench } from 'lucide-react';
import { SectionFieldArray } from './shared';

export const SkillsForm = () => {
  const { t } = useI18n();
  return (
    <SectionFieldArray
      name="skills"
      emptyIcon={Wrench}
      title={t('skills.title')}
      description={t('skills.description')}
      addLabel={t('skills.addCategory')}
      variant="row"
      removeTitle={t('skills.removeCategory')}
      newItem={() => ({ category: '', items: '' })}
      fields={[
        {
          name: 'category',
          label: t('skills.categoryLabel'),
          placeholder: t('skills.categoryPlaceholder'),
        },
        {
          name: 'items',
          label: t('skills.itemsLabel'),
          placeholder: t('skills.itemsPlaceholder'),
        },
      ]}
    />
  );
};
