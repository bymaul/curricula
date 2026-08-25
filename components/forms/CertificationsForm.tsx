'use client';

import { useI18n } from '@/components/I18nProvider';
import { Award } from 'lucide-react';
import { SectionFieldArray } from './shared';

export const CertificationsForm = () => {
  const { t } = useI18n();
  return (
    <SectionFieldArray
      name="certifications"
      emptyIcon={Award}
      title={t('certifications.title')}
      description={t('certifications.description')}
      addLabel={t('certifications.add')}
      variant="row"
      removeTitle={t('certifications.remove')}
      newItem={() => ({ name: '', issuer: '', date: '' })}
      fields={[
        {
          name: 'name',
          label: t('certifications.nameLabel'),
          placeholder: t('certifications.namePlaceholder'),
        },
        {
          name: 'issuer',
          label: t('certifications.issuerLabel'),
          placeholder: t('certifications.issuerPlaceholder'),
        },
        {
          name: 'date',
          label: t('certifications.dateLabel'),
          placeholder: t('certifications.datePlaceholder'),
        },
      ]}
    />
  );
};
