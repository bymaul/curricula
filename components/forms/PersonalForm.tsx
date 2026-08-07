'use client';

import { useRef } from 'react';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/components/I18nProvider';
import { CVData } from '@/lib/schema';
import { translateValidationMessage } from '@/lib/i18n';
import { UI_LANGUAGES } from '@/lib/i18n/languages';
import { SUPPORTED_IMAGE_TYPES, resizeSquarePhoto } from '@/lib/imageFiles';
import { useResumeStore } from '@/store/useResumeStore';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { UserRound } from 'lucide-react';
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
  const language = useResumeStore(
    (state) =>
      state.resumes.find((r) => r.id === state.activeId)?.language ?? 'en',
  );
  const setResumePhoto = useResumeStore((state) => state.setResumePhoto);
  const setResumeLanguage = useResumeStore((state) => state.setResumeLanguage);

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
    <div className="p-2">
      <div className="mb-4">
        <SectionHeading
          title={t('personalDetails.title')}
          description={t('personalDetails.description')}
        />
      </div>

      <FieldGroup>
        <FieldSet>
          <FieldLegend>{t('personalDetails.resumeSettings')}</FieldLegend>

          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                {t('personalDetails.resumeLanguageLabel')}
              </FieldLabel>
              <Select
                value={language}
                onValueChange={(value) => {
                  if (activeId && (value === 'en' || value === 'id')) {
                    setResumeLanguage(activeId, value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UI_LANGUAGES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('personalDetails.resumeLanguageHint')}
              </p>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>{t('personalDetails.contactInformation')}</FieldLegend>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="flex w-40 shrink-0 flex-col items-center gap-3">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photo
                    ? t('personalDetails.photoChange')
                    : t('personalDetails.photoUpload')}
                </Button>
                {photo ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => activeId && setResumePhoto(activeId, '')}
                  >
                    {t('personalDetails.photoRemove')}
                  </Button>
                ) : null}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {t('personalDetails.photoHint')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            <FieldGroup className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2">
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
          </div>
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
