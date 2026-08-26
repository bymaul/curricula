import type { CSSProperties } from 'react';
import { z } from 'zod';

export const ACCENT_COLORS = [
  { id: 'default', hex: null },
  { id: 'blue', hex: '#4a6fa5' },
  { id: 'teal', hex: '#45898c' },
  { id: 'green', hex: '#5e8c61' },
  { id: 'burgundy', hex: '#a85d6b' },
  { id: 'purple', hex: '#8e6fb0' },
  { id: 'slate', hex: '#64748b' },
] as const;

export type AccentColorId = (typeof ACCENT_COLORS)[number]['id'];

export const FONT_IDS = ['default', 'serif', 'sans'] as const;
export type FontId = (typeof FONT_IDS)[number];

export const DENSITY_IDS = ['compact', 'normal', 'relaxed'] as const;
export type DensityId = (typeof DENSITY_IDS)[number];

export const PAGE_SIZE_IDS = ['a4', 'letter'] as const;
export type PageSizeId = (typeof PAGE_SIZE_IDS)[number];

export interface DesignSettings {
  accentColor: AccentColorId;
  fontFamily: FontId;
  density: DensityId;
  pageSize: PageSizeId;
}

export const DEFAULT_DESIGN: DesignSettings = {
  accentColor: 'default',
  fontFamily: 'default',
  density: 'normal',
  pageSize: 'a4',
};

export const designSchema = z.object({
  accentColor: z.enum(ACCENT_COLORS.map((c) => c.id)).catch('default'),
  fontFamily: z.enum(FONT_IDS).catch('default'),
  density: z.enum(DENSITY_IDS).catch('normal'),
  pageSize: z.enum(PAGE_SIZE_IDS).catch('a4'),
});

const ACCENT_HEX: Record<
  Exclude<AccentColorId, 'default'>,
  string
> = Object.fromEntries(
  ACCENT_COLORS.filter(
    (
      c,
    ): c is (typeof ACCENT_COLORS)[number] & {
      hex: string;
    } => c.hex !== null,
  ).map((c) => [c.id, c.hex]),
) as Record<Exclude<AccentColorId, 'default'>, string>;

const FONT_STACKS: Record<FontId, string> = {
  default:
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  serif: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
  sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
};

const DENSITY_GAPS: Record<DensityId, { section: number; item: number }> = {
  compact: { section: 7, item: 5 },
  normal: { section: 10, item: 7 },
  relaxed: { section: 13, item: 10 },
};

export function normalizeDesign(value: unknown): DesignSettings {
  const result = designSchema.safeParse(value);
  return result.success ? result.data : { ...DEFAULT_DESIGN };
}

export interface DesignVarOptions {
  accentFallback: string;
  fontFallback: Exclude<FontId, 'default'>;
}

export interface DesignVars extends CSSProperties {
  '--cv-accent': string;
  '--cv-font': string;
  '--cv-section-gap': string;
  '--cv-item-gap': string;
}

export function designCssVars(
  design: DesignSettings,
  options: DesignVarOptions,
): DesignVars {
  const accent =
    design.accentColor === 'default'
      ? options.accentFallback
      : ACCENT_HEX[design.accentColor];
  const font =
    design.fontFamily === 'default'
      ? FONT_STACKS[options.fontFallback]
      : FONT_STACKS[design.fontFamily];
  const gaps = DENSITY_GAPS[design.density];
  return {
    '--cv-accent': accent,
    '--cv-font': font,
    '--cv-section-gap': `${gaps.section}pt`,
    '--cv-item-gap': `${gaps.item}pt`,
  };
}
