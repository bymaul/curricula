export const TEMPLATES = [
  { id: 'harvard' },
  { id: 'modern' },
  { id: 'minimal' },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]['id'];

export const DEFAULT_TEMPLATE_ID: TemplateId = 'harvard';

export const TEMPLATE_IDS: TemplateId[] = TEMPLATES.map((t) => t.id);
