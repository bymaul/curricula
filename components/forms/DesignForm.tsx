'use client';

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/hooks/useI18n';
import { CVData } from '@/lib/schema';
import { UI_LANGUAGES } from '@/lib/i18n/languages';
import { DEFAULT_DESIGN } from '@/lib/design';
import { TEMPLATES } from '@/lib/templates';
import { useResumeStore } from '@/store/useResumeStore';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  AccentColorPicker,
  DensityPicker,
  FontFamilyPicker,
  PageSizePicker,
} from './DesignPicker';
import { SectionHeading } from './shared';
import { TemplatePicker } from './TemplatePicker';

export const DesignForm = () => {
  const { control } = useFormContext<CVData>();
  const { t } = useI18n();

  const activeId = useResumeStore((state) => state.activeId);
  const photo = useResumeStore(
    (state) => state.resumes.find((r) => r.id === state.activeId)?.photo ?? '',
  );
  const language = useResumeStore(
    (state) =>
      state.resumes.find((r) => r.id === state.activeId)?.language ?? 'en',
  );
  const setResumeLanguage = useResumeStore((state) => state.setResumeLanguage);
  const templateId = useResumeStore(
    (state) =>
      state.resumes.find((r) => r.id === state.activeId)?.templateId ??
      'harvard',
  );
  const setResumeTemplate = useResumeStore((state) => state.setResumeTemplate);
  const design =
    useResumeStore(
      (state) => state.resumes.find((r) => r.id === state.activeId)?.design,
    ) ?? DEFAULT_DESIGN;
  const setResumeDesign = useResumeStore((state) => state.setResumeDesign);
  const sectionOrder = useResumeStore(
    (state) => state.resumes.find((r) => r.id === state.activeId)?.sectionOrder,
  );
  const hiddenSections = useResumeStore(
    (state) =>
      state.resumes.find((r) => r.id === state.activeId)?.hiddenSections,
  );

  const cvValues = useWatch({ control }) as CVData;

  const updateDesign = (patch: Partial<typeof design>) => {
    if (activeId) setResumeDesign(activeId, { ...design, ...patch });
  };

  return (
    <div className="px-4 py-2">
      <div className="mb-4">
        <SectionHeading
          title={t('appearance.title')}
          description={t('appearance.description')}
        />
      </div>

      <FieldGroup>
        <FieldSet>
          <FieldLegend>{t('personalDetails.templateLabel')}</FieldLegend>

          <Field>
            <TemplatePicker
              value={templateId}
              onChange={(template) => {
                if (activeId && TEMPLATES.some((t) => t.id === template)) {
                  setResumeTemplate(activeId, template);
                }
              }}
              cvData={cvValues}
              sectionOrder={sectionOrder}
              hiddenSections={hiddenSections}
              language={language}
              photo={photo}
              design={design}
            />
            <FieldDescription>
              {t('personalDetails.templateHint')}
            </FieldDescription>
          </Field>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>{t('appearance.styleLabel')}</FieldLegend>

          <FieldGroup>
            <Field>
              <FieldLabel>{t('personalDetails.designAccentLabel')}</FieldLabel>
              <AccentColorPicker
                value={design.accentColor}
                onChange={(accentColor) => updateDesign({ accentColor })}
              />
            </Field>

            <Field>
              <FieldLabel>{t('personalDetails.designFontLabel')}</FieldLabel>
              <FontFamilyPicker
                value={design.fontFamily}
                onChange={(fontFamily) => updateDesign({ fontFamily })}
              />
            </Field>

            <Field>
              <FieldLabel>{t('personalDetails.designDensityLabel')}</FieldLabel>
              <DensityPicker
                value={design.density}
                onChange={(density) => updateDesign({ density })}
              />
            </Field>

            <Field>
              <FieldLabel>
                {t('personalDetails.designPageSizeLabel')}
              </FieldLabel>
              <PageSizePicker
                value={design.pageSize}
                onChange={(pageSize) => updateDesign({ pageSize })}
              />
            </Field>
          </FieldGroup>

          <FieldDescription>{t('personalDetails.designHint')}</FieldDescription>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>{t('personalDetails.resumeLanguageLabel')}</FieldLegend>

          <Field>
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
            <FieldDescription>
              {t('personalDetails.resumeLanguageHint')}
            </FieldDescription>
          </Field>
        </FieldSet>
      </FieldGroup>
    </div>
  );
};
