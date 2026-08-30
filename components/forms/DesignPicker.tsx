'use client';

import { useI18n } from '@/hooks/useI18n';
import {
  ACCENT_COLORS,
  AccentColorId,
  DensityId,
  FontId,
  PAGE_SIZE_IDS,
  PageSizeId,
} from '@/lib/design';
import { TranslationKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const ACCENT_SWATCH: Record<AccentColorId, string> = {
  default:
    'conic-gradient(from 0deg, #4a6fa5, #45898c, #5e8c61, #a85d6b, #8e6fb0, #64748b, #4a6fa5)',
  blue: '#4a6fa5',
  teal: '#45898c',
  green: '#5e8c61',
  burgundy: '#a85d6b',
  purple: '#8e6fb0',
  slate: '#64748b',
};

const ACCENT_LABEL_KEYS: Record<AccentColorId, TranslationKey> = {
  default: 'personalDetails.designAccentDefault',
  blue: 'personalDetails.designAccentBlue',
  teal: 'personalDetails.designAccentTeal',
  green: 'personalDetails.designAccentGreen',
  burgundy: 'personalDetails.designAccentBurgundy',
  purple: 'personalDetails.designAccentPurple',
  slate: 'personalDetails.designAccentSlate',
};

const FONT_LABEL_KEYS: Record<FontId, TranslationKey> = {
  default: 'personalDetails.designFontDefault',
  serif: 'personalDetails.designFontSerif',
  sans: 'personalDetails.designFontSans',
};

const DENSITY_LABEL_KEYS: Record<DensityId, TranslationKey> = {
  compact: 'personalDetails.designDensityCompact',
  normal: 'personalDetails.designDensityNormal',
  relaxed: 'personalDetails.designDensityRelaxed',
};

const PAGE_SIZE_LABEL_KEYS: Record<PageSizeId, TranslationKey> = {
  a4: 'personalDetails.designPageSizeA4',
  letter: 'personalDetails.designPageSizeLetter',
};

function Segmented<T extends string>({
  options,
  labelKeys,
  value,
  onChange,
}: {
  options: readonly T[];
  labelKeys: Record<T, TranslationKey>;
  value: T;
  onChange: (value: T) => void;
}) {
  const { t } = useI18n();
  return (
    <div
      role="radiogroup"
      className="border-border bg-muted/30 inline-flex w-full items-stretch gap-0.5 rounded-lg border p-0.5 sm:w-fit"
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={cn(
              'flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors outline-none sm:flex-none',
              'focus-visible:ring-ring/50 focus-visible:ring-3',
              selected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(labelKeys[option])}
          </button>
        );
      })}
    </div>
  );
}

export function AccentColorPicker({
  value,
  onChange,
}: {
  value: AccentColorId;
  onChange: (value: AccentColorId) => void;
}) {
  const { t } = useI18n();
  return (
    <div role="radiogroup" className="flex flex-wrap items-center gap-2">
      {ACCENT_COLORS.map((color) => {
        const selected = color.id === value;
        const label = t(ACCENT_LABEL_KEYS[color.id]);
        return (
          <button
            key={color.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => onChange(color.id)}
            className={cn(
              'border-border size-8 cursor-pointer rounded-full border transition-shadow outline-none',
              'focus-visible:ring-ring/50 focus-visible:ring-3',
              selected &&
                'ring-ring ring-offset-background ring-2 ring-offset-2',
            )}
            style={{ background: ACCENT_SWATCH[color.id] }}
          />
        );
      })}
    </div>
  );
}

export function FontFamilyPicker({
  value,
  onChange,
}: {
  value: FontId;
  onChange: (value: FontId) => void;
}) {
  return (
    <Segmented
      options={['default', 'serif', 'sans'] as const}
      labelKeys={FONT_LABEL_KEYS}
      value={value}
      onChange={onChange}
    />
  );
}

export function DensityPicker({
  value,
  onChange,
}: {
  value: DensityId;
  onChange: (value: DensityId) => void;
}) {
  return (
    <Segmented
      options={['compact', 'normal', 'relaxed'] as const}
      labelKeys={DENSITY_LABEL_KEYS}
      value={value}
      onChange={onChange}
    />
  );
}

export function PageSizePicker({
  value,
  onChange,
}: {
  value: PageSizeId;
  onChange: (value: PageSizeId) => void;
}) {
  return (
    <Segmented
      options={PAGE_SIZE_IDS}
      labelKeys={PAGE_SIZE_LABEL_KEYS}
      value={value}
      onChange={onChange}
    />
  );
}
