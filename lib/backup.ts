import { z } from 'zod';
import { SECTION_IDS } from '@/lib/consts';
import { DEFAULT_DESIGN, designSchema } from '@/lib/design';
import { RESUME_LANGUAGES } from '@/lib/i18n/languages';
import { cvDataStoredSchema } from '@/lib/schema';
import { TEMPLATE_IDS, DEFAULT_TEMPLATE_ID, TemplateId } from '@/lib/templates';
import type { ResumeRecord } from '@/store/useResumeStore';

const templateIdSchema = z
  .string()
  .refine((value): value is TemplateId =>
    TEMPLATE_IDS.includes(value as TemplateId),
  );

const resumeSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    data: cvDataStoredSchema,
    sectionOrder: z.array(z.string()),
    hiddenSections: z.array(z.string()),
    language: z.enum(RESUME_LANGUAGES).default('en'),
    photo: z.string().default(''),
    templateId: templateIdSchema.default(DEFAULT_TEMPLATE_ID),
    design: designSchema.catch(DEFAULT_DESIGN),
    autoTitle: z.boolean(),
    updatedAt: z.number(),
  })
  .superRefine((record, ctx) => {
    const valid = new Set<string>([
      ...SECTION_IDS,
      ...Object.keys(record.data.customSections ?? {}),
    ]);
    const lists: [string, string[]][] = [
      ['sectionOrder', record.sectionOrder],
      ['hiddenSections', record.hiddenSections],
    ];
    for (const [path, ids] of lists) {
      ids.forEach((id, index) => {
        if (!valid.has(id)) {
          ctx.addIssue({
            code: 'custom',
            path: [path, index],
            message: `Unknown section id: ${id}`,
          });
        }
      });
    }
  });

export const backupSchema = z.object({
  app: z.literal('curricula'),
  version: z.literal(1),
  exportedAt: z.number(),
  activeId: z.string().min(1).nullable(),
  resumes: z.array(resumeSchema),
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
      language: record.language,
      photo: record.photo,
      templateId: record.templateId,
      design: record.design,
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
