import en, { Dictionary } from './en';
import id from './id';
import { Language, ResumeLanguage } from './languages';
import { AIAdjustScope, BuiltinTabName, TabName } from '@/lib/consts';

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

export const TAB_KEYS: Record<BuiltinTabName, TranslationKey> = {
  personal: 'tabs.personal',
  design: 'tabs.design',
  experience: 'tabs.experience',
  projects: 'tabs.projects',
  education: 'tabs.education',
  skills: 'tabs.skills',
  certifications: 'tabs.certifications',
};

export function tabKey(tab: TabName): TranslationKey | undefined {
  return (TAB_KEYS as Record<string, TranslationKey>)[tab];
}

export function navTabLabel(
  tab: TabName,
  customSections: ReadonlyArray<{ id: string; title: string }>,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string {
  const key = tabKey(tab);
  if (key) return t(key);
  return customSections.find((s) => s.id === tab)?.title ?? '';
}

export const AI_ADJUST_SCOPE_KEYS: Record<AIAdjustScope, TranslationKey> = {
  full: 'aiAdjust.scopeFull',
  summary: 'aiAdjust.scopeSummary',
  experience: 'aiAdjust.scopeExperience',
  projects: 'aiAdjust.scopeProjects',
  education: 'aiAdjust.scopeEducation',
  skills: 'aiAdjust.scopeSkills',
};

function isTranslationKey(key: string): key is TranslationKey {
  return lookup(en, key) !== undefined;
}

export function translateValidationMessage(
  translateFn: (
    key: TranslationKey,
    params?: Record<string, string | number>,
  ) => string,
  message: string | undefined,
): string | undefined {
  if (!message) return undefined;
  if (!isTranslationKey(message)) return message;
  return translateFn(message);
}

export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

function lookup(dictionary: Dictionary, key: string): string | undefined {
  let value: unknown = dictionary;
  for (const part of key.split('.')) {
    value = (value as Record<string, unknown> | undefined)?.[part];
    if (value === undefined) break;
  }
  return typeof value === 'string' ? value : undefined;
}

export function translate(
  lang: Language | ResumeLanguage,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const dictionary = DICTIONARIES[lang] ?? en;
  const value = lookup(dictionary, key) ?? lookup(en, key);
  if (value === undefined) return key;
  return interpolate(value, params);
}
