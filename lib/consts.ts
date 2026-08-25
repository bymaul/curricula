import { CVData } from './schema';

export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

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

export type BuiltinSectionId =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'certifications';

export type SectionId = BuiltinSectionId | (string & {});

export const RENDERABLE_SECTIONS: {
  id: BuiltinSectionId;
  title: string;
}[] = [
  { id: 'summary', title: 'Summary' },
  { id: 'experience', title: 'Experience' },
  { id: 'projects', title: 'Projects' },
  { id: 'education', title: 'Education' },
  { id: 'skills', title: 'Skills' },
  { id: 'certifications', title: 'Certifications' },
];

export type BuiltinTabName =
  'personal' | 'design' | Exclude<BuiltinSectionId, 'summary'>;

export type TabName = BuiltinTabName | (string & {});

export const getSectionTabName = (sectionId: SectionId): TabName => {
  if (sectionId === 'summary') return 'personal';
  return sectionId;
};

export const getSectionIdFromTab = (tab: string): SectionId | null => {
  if (tab === 'personal') return 'summary';
  const builtin = RENDERABLE_SECTIONS.find((section) => section.id === tab);
  return builtin ? builtin.id : tab;
};

export const DEFAULT_SECTION_ORDER: SectionId[] = RENDERABLE_SECTIONS.map(
  (s) => s.id,
);

export const SECTION_IDS: SectionId[] = RENDERABLE_SECTIONS.map((s) => s.id);

export const SECTIONS: { name: TabName; fields: (keyof CVData)[] }[] = [
  {
    name: 'personal',
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
  { name: 'experience', fields: ['experience'] },
  { name: 'projects', fields: ['projects'] },
  { name: 'education', fields: ['education'] },
  { name: 'skills', fields: ['skills'] },
  { name: 'certifications', fields: ['certifications'] },
];
