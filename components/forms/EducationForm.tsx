'use client';

import { useI18n } from '@/components/I18nProvider';
import { GraduationCap } from 'lucide-react';
import { SectionFieldArray } from './shared';

export const EducationForm = () => {
  const { t } = useI18n();
  return (
    <SectionFieldArray
      name="education"
      emptyIcon={GraduationCap}
      title={t('education.title')}
      description={t('education.description')}
      addLabel={t('education.add')}
      variant="card"
      itemLabel={t('education.itemLabel')}
      removeTitle={t('education.remove')}
      newItem={() => ({
        degree: '',
        institution: '',
        date: '',
        location: '',
        description: '',
      })}
      fields={[
        {
          name: 'institution',
          label: t('education.institutionLabel'),
          placeholder: t('education.institutionPlaceholder'),
        },
        {
          name: 'degree',
          label: t('education.degreeLabel'),
          placeholder: t('education.degreePlaceholder'),
        },
        {
          name: 'location',
          label: t('education.locationLabel'),
          placeholder: t('education.locationPlaceholder'),
        },
        {
          name: 'date',
          label: t('education.datesLabel'),
          placeholder: t('education.datesPlaceholder'),
        },
        {
          name: 'description',
          as: 'textarea',
          className: 'sm:col-span-2',
          label: t('education.summaryLabel'),
          placeholder: t('education.summaryPlaceholder'),
        },
      ]}
    />
  );
};
