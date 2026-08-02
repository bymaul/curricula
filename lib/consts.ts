import { CVData } from './schema';

export const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-5.6-luna' },
  { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-haiku-4-5' },
  { value: 'google', label: 'Google', defaultModel: 'gemini-3-flash-preview' },
] as const;

export const AI_API_KEY_STORAGE_KEY = 'curricula-ai-api-key';

export const getStoredAIAPIKey = () =>
  localStorage.getItem(AI_API_KEY_STORAGE_KEY)?.trim() || '';

export type AIProvider = (typeof AI_PROVIDERS)[number]['value'];

export const AI_ADJUST_SCOPES = [
  { value: 'full', label: 'Entire CV' },
  { value: 'summary', label: 'Summary' },
  { value: 'experience', label: 'Experience' },
  { value: 'projects', label: 'Projects' },
  { value: 'education', label: 'Education' },
  { value: 'skills', label: 'Skills' },
] as const;

export type AIAdjustScope = (typeof AI_ADJUST_SCOPES)[number]['value'];

export type SectionId =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'certifications';

export const RENDERABLE_SECTIONS: { id: SectionId; title: string }[] = [
  { id: 'summary', title: 'Summary' },
  { id: 'experience', title: 'Experience' },
  { id: 'projects', title: 'Projects' },
  { id: 'education', title: 'Education' },
  { id: 'skills', title: 'Skills' },
  { id: 'certifications', title: 'Certifications' },
];

export const DEFAULT_SECTION_ORDER: SectionId[] = RENDERABLE_SECTIONS.map(
  (s) => s.id,
);

export const SECTIONS: { name: string; fields: (keyof CVData)[] }[] = [
  {
    name: 'Personal',
    fields: [
      'name',
      'jobTitle',
      'email',
      'phone',
      'location',
      'links',
      'summary',
    ],
  },
  { name: 'Experience', fields: ['experience'] },
  { name: 'Projects', fields: ['projects'] },
  { name: 'Education', fields: ['education'] },
  { name: 'Skills', fields: ['skills'] },
  { name: 'Certifications', fields: ['certifications'] },
];
