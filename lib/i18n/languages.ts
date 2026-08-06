export const UI_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa Indonesia' },
] as const;

export const RESUME_LANGUAGES = ['en', 'id'] as const;

export type Language = (typeof UI_LANGUAGES)[number]['value'];
export type ResumeLanguage = (typeof RESUME_LANGUAGES)[number];
