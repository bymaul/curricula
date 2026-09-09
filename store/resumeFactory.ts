import { DEFAULT_SECTION_ORDER, SECTION_IDS } from '@/lib/consts';
import { DesignSettings, normalizeDesign } from '@/lib/design';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { CVData, cvDataStoredSchema, initialCVState } from '@/lib/schema';
import { DEFAULT_TEMPLATE_ID, TemplateId } from '@/lib/templates';
import type { ResumeRecord } from './useResumeStore';

export const LEGACY_KEY = 'curricula-data';

export const now = () => Date.now();

export function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID();
  return `${now()}-${Math.random().toString(36).slice(2)}`;
}

export function makeResume(
  data: CVData = initialCVState,
  title?: string,
  options: {
    language?: ResumeLanguage;
    photo?: string;
    template?: TemplateId;
    design?: DesignSettings;
  } = {},
): ResumeRecord {
  return {
    id: makeId(),
    title: title?.trim() || data.name?.trim() || 'Untitled CV',
    data,
    sectionOrder: [
      ...DEFAULT_SECTION_ORDER,
      ...Object.keys(data.customSections ?? {}),
    ],
    hiddenSections: [],
    language: options.language ?? 'en',
    photo: options.photo ?? '',
    templateId: options.template ?? DEFAULT_TEMPLATE_ID,
    design: normalizeDesign(options.design),
    autoTitle: true,
    favorite: false,
    updatedAt: now(),
  };
}

export function normalizeResume(record: ResumeRecord): ResumeRecord {
  const customIds = Object.keys(record.data?.customSections ?? {});
  const validIds = new Set<string>([...SECTION_IDS, ...customIds]);
  const sectionOrder = (
    record.sectionOrder ?? [...DEFAULT_SECTION_ORDER]
  ).filter((id) => validIds.has(id));
  for (const id of customIds) {
    if (!sectionOrder.includes(id)) sectionOrder.push(id);
  }
  return {
    ...record,
    sectionOrder,
    hiddenSections: (record.hiddenSections ?? []).filter((id) =>
      validIds.has(id),
    ),
    language: record.language ?? 'en',
    photo: record.photo ?? '',
    templateId: record.templateId ?? DEFAULT_TEMPLATE_ID,
    design: normalizeDesign(record.design),
    favorite: !!record.favorite,
  };
}

export function withoutPhoto(
  record: ResumeRecord,
): Omit<ResumeRecord, 'photo'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { photo, ...rest } = record;
  return rest;
}

export function parseLegacyData(raw: string | null): CVData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const result = cvDataStoredSchema.safeParse(parsed);
    if (!result.success) return null;
    return { ...initialCVState, ...result.data };
  } catch {
    return null;
  }
}

export function seedResumes(): ResumeRecord[] {
  const legacy = parseLegacyData(localStorage.getItem(LEGACY_KEY));
  if (legacy) {
    localStorage.removeItem(LEGACY_KEY);
    return [makeResume(legacy)];
  }
  return [makeResume()];
}
