import { CVData } from '@/lib/schema';
import type { TranslationKey } from '@/lib/i18n';

export interface CVChangeSummary {
  labelKey: TranslationKey;
  detailKey: TranslationKey;
  params?: Record<string, string | number>;
}

const SCALAR_SECTIONS: { key: keyof CVData; labelKey: TranslationKey }[] = [
  { key: 'summary', labelKey: 'changes.labelSummary' },
  { key: 'name', labelKey: 'changes.labelName' },
  { key: 'jobTitle', labelKey: 'changes.labelJobTitle' },
  { key: 'email', labelKey: 'changes.labelEmail' },
  { key: 'phone', labelKey: 'changes.labelPhone' },
  { key: 'location', labelKey: 'changes.labelLocation' },
];

const ARRAY_SECTIONS: { key: keyof CVData; labelKey: TranslationKey }[] = [
  { key: 'experience', labelKey: 'changes.labelExperience' },
  { key: 'projects', labelKey: 'changes.labelProjects' },
  { key: 'education', labelKey: 'changes.labelEducation' },
  { key: 'skills', labelKey: 'changes.labelSkills' },
  { key: 'certifications', labelKey: 'changes.labelCertifications' },
  { key: 'links', labelKey: 'changes.labelLinks' },
];

function countChangedItems(
  original: unknown[],
  adjusted: unknown[],
): {
  changed: number;
  count: number;
} {
  const count = Math.max(original.length, adjusted.length);
  let changed = 0;
  for (let i = 0; i < count; i++) {
    if (
      JSON.stringify(original[i] ?? null) !==
      JSON.stringify(adjusted[i] ?? null)
    ) {
      changed += 1;
    }
  }
  return { changed, count };
}

export function summarizeCVChanges(
  original: CVData,
  adjusted: CVData,
): CVChangeSummary[] {
  const summaries: CVChangeSummary[] = [];

  for (const { key, labelKey } of SCALAR_SECTIONS) {
    if (original[key] !== adjusted[key]) {
      summaries.push({ labelKey, detailKey: 'changes.detailChanged' });
    }
  }

  for (const { key, labelKey } of ARRAY_SECTIONS) {
    const originalItems = original[key] as unknown[];
    const adjustedItems = adjusted[key] as unknown[];
    const { changed, count } = countChangedItems(originalItems, adjustedItems);
    if (changed === 0) continue;

    const params = (
      originalItems.length !== adjustedItems.length
        ? { from: originalItems.length, to: adjustedItems.length }
        : { changed, count }
    ) as Record<string, string | number>;

    summaries.push({
      labelKey,
      detailKey:
        originalItems.length !== adjustedItems.length
          ? 'changes.detailEntryCount'
          : 'changes.detailEntriesUpdated',
      params,
    });
  }

  return summaries;
}
