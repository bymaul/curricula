'use client';

import { useRef } from 'react';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/hooks/useI18n';
import { CVData } from '@/lib/schema';
import { translateValidationMessage } from '@/lib/i18n';
import { SUPPORTED_IMAGE_TYPES, resizeSquarePhoto } from '@/lib/imageFiles';
import { useResumeStore } from '@/store/useResumeStore';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { UserRound, X } from 'lucide-react';
import { FormField } from '../ui/form-field';
import { AddItemButton, ItemRemoveButton, SectionHeading } from './shared';

export const PersonalForm = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CVData>();
  const { t } = useI18n();

  const activeId = useResumeStore((state) => state.activeId);
  const photo = useResumeStore(
    (state) => state.resumes.find((r) => r.id === state.activeId)?.photo ?? '',
  );
  const setResumePhoto = useResumeStore((state) => state.setResumePhoto);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'links',
  });

  const errorFor = (message: string | undefined) =>
    translateValidationMessage(t, message);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeId) return;
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      toast.add({
        type: 'error',
        description: t('personalDetails.photoErrorInvalid'),
        priority: 'high',
      });
      return;
    }
    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
    if (!dataUrl) {
      toast.add({
        type: 'error',
        description: t('personalDetails.photoErrorRead'),
        priority: 'high',
      });
      return;
    }
    const resized = await resizeSquarePhoto(dataUrl);
    if (!resized) {
      toast.add({
        type: 'error',
        description: t('personalDetails.photoErrorRead'),
        priority: 'high',
      });
      return;
    }
    setResumePhoto(activeId, resized);
  };

  return (
    <div className="px-3 py-2">
      <div className="mb-3">
        <SectionHeading
          title={t('personalDetails.title')}
          description={t('personalDetails.description')}
        />
      </div>

      <FieldGroup>
        <FieldSet>
          <FieldLegend>{t('personalDetails.resumeSettings')}</FieldLegend>

          <FieldGroup>
            <Field>
              <FieldLabel>{t('personalDetails.photoLabel')}</FieldLabel>
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={
                      photo
                        ? t('personalDetails.photoChange')
                        : t('personalDetails.photoUpload')
                    }
                    className="border-border bg-muted focus-visible:border-ring focus-visible:ring-ring/50 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border outline-none focus-visible:ring-3"
                  >
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="text-muted-foreground h-6 w-6" />
                    )}
                  </button>
                  {photo && activeId ? (
                    <button
                      type="button"
                      onClick={() => setResumePhoto(activeId, '')}
                      aria-label={t('personalDetails.photoRemove')}
                      className="border-border bg-card text-muted-foreground hover:text-destructive focus-visible:border-ring focus-visible:ring-ring/50 absolute right-1 bottom-1 flex size-5 items-center justify-center rounded-full border shadow-sm outline-none focus-visible:ring-3"
                    >
                      <X className="size-3" />
                    </button>
                  ) : null}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              <FieldDescription>
                {t('personalDetails.photoHint')}
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>{t('personalDetails.contactInformation')}</FieldLegend>

          <FieldGroup className="grid grid-cols-1 @[400px]/sidebar:grid-cols-2">
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
              className="@[400px]/sidebar:col-span-2"
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
                className="bg-card border-border rounded-xl border p-3 shadow-sm"
              >
                <div className="flex items-end gap-3">
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
