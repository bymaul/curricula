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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AIProvider, AI_PROVIDERS } from '@/lib/consts';
import { useI18n } from '@/hooks/useI18n';

interface AISettingsFieldsProps {
  provider: AIProvider;
  modelName: string;
  apiKey: string;
  onProviderChange: (value: AIProvider | null) => void;
  onModelChange: (value: string) => void;
  onKeyChange: (value: string) => void;
  hasBundledKey?: boolean;
  bundledProvider?: AIProvider | null;
  statusError?: boolean;
}

export function AISettingsFields({
  provider,
  modelName,
  apiKey,
  onProviderChange,
  onModelChange,
  onKeyChange,
  hasBundledKey,
  bundledProvider = null,
  statusError = false,
}: AISettingsFieldsProps) {
  const selectedProvider = AI_PROVIDERS.find((p) => p.value === provider);
  const { t } = useI18n();

  const bundledProviderLabel =
    AI_PROVIDERS.find((p) => p.value === bundledProvider)?.label ??
    t('aiSettings.bundledFallback');

  const apiKeyDescription =
    hasBundledKey === true
      ? t('aiSettings.apiKeyDescriptionBundled', {
          provider: bundledProviderLabel,
        })
      : hasBundledKey === false
        ? t('aiSettings.apiKeyDescriptionNone')
        : t('aiSettings.apiKeyDescriptionOptional');

  return (
    <>
      {statusError && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
          {t('aiSettings.statusError')}
        </div>
      )}
      <FieldGroup>
        <FieldSet>
          <FieldLegend>{t('aiSettings.modelSectionLabel')}</FieldLegend>

          <Field>
            <FieldLabel>{t('aiSettings.providerLabel')}</FieldLabel>
            <Select
              items={AI_PROVIDERS}
              value={provider}
              onValueChange={onProviderChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {AI_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>{t('aiSettings.modelLabel')}</FieldLabel>
            <Input
              value={modelName}
              onChange={(e) => onModelChange(e.target.value)}
              placeholder={selectedProvider?.defaultModel}
            />
            <FieldDescription>
              {t('aiSettings.modelDescription', {
                model: selectedProvider?.defaultModel ?? '',
              })}
            </FieldDescription>
          </Field>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>{t('aiSettings.apiKeyLabel')}</FieldLegend>

          <Field>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => onKeyChange(e.target.value)}
              placeholder={t('aiSettings.apiKeyPlaceholder')}
              autoComplete="off"
            />
            <FieldDescription>{apiKeyDescription}</FieldDescription>
          </Field>
        </FieldSet>
      </FieldGroup>
    </>
  );
}
