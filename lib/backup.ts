import { z } from 'zod';
import { SECTION_IDS, SectionId } from '@/lib/consts';
import { cvDataStoredSchema } from '@/lib/schema';
import type { ResumeRecord } from '@/store/useResumeStore';

const sectionIdSchema = z
  .string()
  .refine((value): value is SectionId =>
    SECTION_IDS.includes(value as SectionId),
  );

export const backupSchema = z.object({
  app: z.literal('curricula'),
  version: z.literal(1),
  exportedAt: z.number(),
  activeId: z.string().min(1).nullable(),
  resumes: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string(),
      data: cvDataStoredSchema,
      sectionOrder: z.array(sectionIdSchema),
      hiddenSections: z.array(sectionIdSchema),
      autoTitle: z.boolean(),
      updatedAt: z.number(),
    }),
  ),
});

export type BackupFile = z.infer<typeof backupSchema>;

export const BACKUP_VERSION = 1;

export function serializeBackup(
  resumes: ResumeRecord[],
  activeId: string | null,
): string {
  const backup: BackupFile = {
    app: 'curricula',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    activeId,
    resumes: resumes.map((record) => ({
      id: record.id,
      title: record.title,
      data: record.data,
      sectionOrder: record.sectionOrder,
      hiddenSections: record.hiddenSections,
      autoTitle: record.autoTitle,
      updatedAt: record.updatedAt,
    })),
  };
  return JSON.stringify(backup, null, 2);
}

export function parseBackup(raw: string): BackupFile | null {
  try {
    const parsed = JSON.parse(raw);
    const result = backupSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
