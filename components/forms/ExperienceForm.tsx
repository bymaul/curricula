'use client';

import { useI18n } from '@/hooks/useI18n';
import { Briefcase } from 'lucide-react';
import { SectionFieldArray } from './shared';

export const ExperienceForm = () => {
  const { t } = useI18n();
  return (
    <SectionFieldArray
      name="experience"
      emptyIcon={Briefcase}
      title={t('workExperience.title')}
      description={t('workExperience.description')}
      addLabel={t('workExperience.add')}
      variant="card"
      itemLabel={t('workExperience.itemLabel')}
      removeTitle={t('workExperience.remove')}
      newItem={() => ({
        role: '',
        company: '',
        date: '',
        location: '',
        description: '',
      })}
      fields={[
        {
          name: 'role',
          label: t('workExperience.roleLabel'),
          placeholder: t('workExperience.rolePlaceholder'),
        },
        {
          name: 'company',
          label: t('workExperience.companyLabel'),
          placeholder: t('workExperience.companyPlaceholder'),
        },
        {
          name: 'location',
          label: t('workExperience.locationLabel'),
          placeholder: t('workExperience.locationPlaceholder'),
        },
        {
          name: 'date',
          label: t('workExperience.datesLabel'),
          placeholder: t('workExperience.datesPlaceholder'),
        },
        {
          name: 'description',
          as: 'textarea',
          className: '@[400px]/sidebar:col-span-2',
          label: t('workExperience.descriptionLabel'),
          placeholder: t('workExperience.descriptionPlaceholder'),
        },
      ]}
    />
  );
};
