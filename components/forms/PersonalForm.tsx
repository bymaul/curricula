'use client';

import { useRef, useState } from 'react';
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
import { SAMPLE_CV_DATA } from '@/lib/sampleCv';
import { translateValidationMessage } from '@/lib/i18n';
import { UI_LANGUAGES } from '@/lib/i18n/languages';
import { SUPPORTED_IMAGE_TYPES, resizeSquarePhoto } from '@/lib/imageFiles';
import { TEMPLATES, TemplateId } from '@/lib/templates';
import { useResumeStore } from '@/store/useResumeStore';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Sparkles, UserRound } from 'lucide-react';
import { FormField } from '../ui/form-field';
import { AddItemButton, ItemRemoveButton, SectionHeading } from './shared';

export const PersonalForm = () => {
  const {
    register,
    control,
    reset,
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
  const templateId = useResumeStore(
    (state) =>
      state.resumes.find((r) => r.id === state.activeId)?.templateId ??
      'harvard',
  );
  const setResumeTemplate = useResumeStore((state) => state.setResumeTemplate);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'links',
  });

  const errorFor = (message: string | undefined) =>
    translateValidationMessage(t, message);

  const cvValues = useWatch({ control }) as CVData;
  const isEmptyResume =
    !cvValues.name &&
    !cvValues.email &&
    !cvValues.phone &&
    !cvValues.summary &&
    cvValues.experience.length === 0;
  const [sampleDismissed, setSampleDismissed] = useState(false);
  const showSampleCta = isEmptyResume && !sampleDismissed;

  const loadSample = () => {
    reset(SAMPLE_CV_DATA);
    setSampleDismissed(true);
  };

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

      {showSampleCta && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <Sparkles className="w-4 h-4 mt-0.5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {t('personalDetails.sampleCtaTitle')}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('personalDetails.sampleCtaDescription')}
            </p>
            <div className="flex gap-2 mt-2.5">
              <Button type="button" size="sm" onClick={loadSample}>
                {t('personalDetails.sampleCtaLoad')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSampleDismissed(true)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <FieldGroup>
        <FieldSet>
          <FieldLegend>{t('personalDetails.resumeSettings')}</FieldLegend>

          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2">
            <Field>
              <FieldLabel>{t('personalDetails.photoLabel')}</FieldLabel>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('personalDetails.photoHint')}
              </p>
            </Field>

            <Field>
              <FieldLabel>
                {t('personalDetails.resumeLanguageLabel')}
              </FieldLabel>
              <Select
                items={UI_LANGUAGES}
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

            <Field className="sm:col-span-2">
              <FieldLabel>{t('personalDetails.templateLabel')}</FieldLabel>
              <Select
                items={TEMPLATES.map((template) => ({
                  value: template.id,
                  label: t(`templates.${template.id}.name`),
                }))}
                value={templateId}
                onValueChange={(value) => {
                  const template = value as TemplateId;
                  if (activeId && TEMPLATES.some((t) => t.id === template)) {
                    setResumeTemplate(activeId, template);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {t(`templates.${option.id}.name`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('personalDetails.templateHint')}
              </p>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

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
