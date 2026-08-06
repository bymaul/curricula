'use client';

import {
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { useI18n } from '@/components/I18nProvider';
import { CVData } from '@/lib/schema';
import { translateValidationMessage } from '@/lib/i18n';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField } from '../ui/form-field';
import { AddItemButton, ItemRemoveButton, SectionHeading } from './shared';

export const PersonalForm = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CVData>();
  const { t } = useI18n();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'links',
  });

  const errorFor = (message: string | undefined) =>
    translateValidationMessage(t, message);

  return (
    <div className="p-2">
      <div className="mb-4">
        <SectionHeading
          title={t('personalDetails.title')}
          description={t('personalDetails.description')}
        />
      </div>

      <FieldGroup>
        <FieldSet>
          <FieldLegend>{t('personalDetails.contactInformation')}</FieldLegend>

          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2">
            <FormField
              name="name"
              label={t('personalDetails.fullName')}
              placeholder={t('personalDetails.fullNamePlaceholder')}
              register={register}
              error={errorFor(errors.name?.message)}
            />
            <FormField
              name="jobTitle"
              label={t('personalDetails.jobTitle')}
              placeholder={t('personalDetails.jobTitlePlaceholder')}
              register={register}
              error={errorFor(errors.jobTitle?.message)}
            />
            <FormField
              name="email"
              label={t('personalDetails.email')}
              type="email"
              placeholder={t('personalDetails.emailPlaceholder')}
              register={register}
              error={errorFor(errors.email?.message)}
            />
            <FormField
              name="phone"
              label={t('personalDetails.phone')}
              placeholder={t('personalDetails.phonePlaceholder')}
              register={register}
              error={errorFor(errors.phone?.message)}
            />
            <FormField
              name="location"
              label={t('personalDetails.location')}
              placeholder={t('personalDetails.locationPlaceholder')}
              register={register}
              className="sm:col-span-2"
            />
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>{t('personalDetails.customLinks')}</FieldLegend>
          <FieldGroup>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col space-y-1.5 bg-muted/20 p-3 rounded-xl border border-border relative"
              >
                <div className="flex gap-3 items-end">
                  <FormField
                    name={`links.${index}.url` as const}
                    label={t('personalDetails.linkUrlLabel')}
                    placeholder={t('personalDetails.linkUrlPlaceholder')}
                    register={register}
                    error={errorFor(errors.links?.[index]?.url?.message)}
                    className="flex-1"
                  />

                  <ItemRemoveButton
                    onClick={() => remove(index)}
                    title={t('personalDetails.removeLink')}
                  />
                </div>
              </div>
            ))}

            <AddItemButton size="sm" onClick={() => append({ url: '' })}>
              {t('personalDetails.addLink')}
            </AddItemButton>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>{t('personalDetails.professionalSummary')}</FieldLegend>
          <FieldGroup>
            <FormField
              as="textarea"
              name="summary"
              placeholder={t('personalDetails.summaryPlaceholder')}
              register={register}
              error={errorFor(errors.summary?.message)}
            />
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </div>
  );
};
