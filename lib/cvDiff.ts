import { CVData } from '@/lib/schema';

export interface CVChangeSummary {
  label: string;
  detail: string;
}

const SCALAR_SECTIONS: { key: keyof CVData; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'name', label: 'Name' },
  { key: 'jobTitle', label: 'Job title' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location' },
];

const ARRAY_SECTIONS: { key: keyof CVData; label: string }[] = [
  { key: 'experience', label: 'Experience' },
  { key: 'projects', label: 'Projects' },
  { key: 'education', label: 'Education' },
  { key: 'skills', label: 'Skills' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'links', label: 'Links' },
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

  for (const { key, label } of SCALAR_SECTIONS) {
    if (original[key] !== adjusted[key]) {
      summaries.push({ label, detail: 'changed' });
    }
  }

  for (const { key, label } of ARRAY_SECTIONS) {
    const originalItems = original[key] as unknown[];
    const adjustedItems = adjusted[key] as unknown[];
    const { changed, count } = countChangedItems(originalItems, adjustedItems);
    if (changed === 0) continue;

    const detail =
      originalItems.length !== adjustedItems.length
        ? `${originalItems.length} → ${adjustedItems.length} entries`
        : `${changed} of ${count} entries updated`;

    summaries.push({ label, detail });
  }

  return summaries;
}
