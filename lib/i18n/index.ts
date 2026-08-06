import en, { Dictionary } from './en';
import id from './id';
import { Language, ResumeLanguage } from './languages';
import { TabName } from '@/lib/consts';

export type { Language, ResumeLanguage } from './languages';
export { UI_LANGUAGES, RESUME_LANGUAGES } from './languages';

export const DICTIONARIES: Record<Language, Dictionary> = { en, id };

type LeafPaths<T> = T extends string
  ? []
  : { [K in keyof T]: [K, ...LeafPaths<T[K]>] }[keyof T];

type Join<T extends string[], Sep extends string> = T extends [
  infer Head extends string,
  ...infer Tail extends string[],
]
  ? Tail extends []
    ? Head
    : `${Head}${Sep}${Join<Tail, Sep>}`
  : never;

export type TranslationKey = Join<LeafPaths<Dictionary>, '.'>;

export const TAB_KEYS: Record<TabName, TranslationKey> = {
  personal: 'tabs.personal',
  experience: 'tabs.experience',
  projects: 'tabs.projects',
  education: 'tabs.education',
  skills: 'tabs.skills',
  certifications: 'tabs.certifications',
};

export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function translate(
  lang: Language | ResumeLanguage,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const dictionary = DICTIONARIES[lang] ?? en;
  let value: unknown = dictionary;
  for (const part of key.split('.')) {
    value = (value as Record<string, unknown>)?.[part];
  }
  if (typeof value !== 'string') return key;
  return interpolate(value, params);
}
