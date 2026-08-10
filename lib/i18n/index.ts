import en, { Dictionary } from './en';
import id from './id';
import { Language, ResumeLanguage } from './languages';
import { AIAdjustScope, TabName } from '@/lib/consts';

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

export const AI_ADJUST_SCOPE_KEYS: Record<AIAdjustScope, TranslationKey> = {
  full: 'aiAdjust.scopeFull',
  summary: 'aiAdjust.scopeSummary',
  experience: 'aiAdjust.scopeExperience',
  projects: 'aiAdjust.scopeProjects',
  education: 'aiAdjust.scopeEducation',
  skills: 'aiAdjust.scopeSkills',
};

const VALIDATION_MESSAGE_KEYS: Record<string, TranslationKey> = {
  'URL is required': 'validation.urlRequired',
  'Role is required': 'validation.roleRequired',
  'Company is required': 'validation.companyRequired',
  'Date is required': 'validation.dateRequired',
  'Project name is required': 'validation.projectNameRequired',
  'Degree is required': 'validation.degreeRequired',
  'Institution is required': 'validation.institutionRequired',
  'Category is required': 'validation.categoryRequired',
  'Skills are required': 'validation.skillsRequired',
  'Name is required': 'validation.nameRequired',
  'Issuer is required': 'validation.issuerRequired',
  'Full Name is required': 'validation.fullNameRequired',
  'Invalid email address': 'validation.emailInvalid',
  'Email is required': 'validation.emailRequired',
  'Phone number is required': 'validation.phoneRequired',
  'Summary must be at least 10 characters': 'validation.summaryMinLength',
};

export function translateValidationMessage(
  translateFn: (
    key: TranslationKey,
    params?: Record<string, string | number>,
  ) => string,
  message: string | undefined,
): string | undefined {
  if (!message) return undefined;
  const key = VALIDATION_MESSAGE_KEYS[message];
  return key ? translateFn(key) : message;
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
  // English is the source of truth: if the active language is missing a key
  // (dictionary drift), fall back to the English string instead of leaking a
  // bare key into the UI.
  const value = lookup(dictionary, key) ?? lookup(en, key);
  if (value === undefined) return key;
  return interpolate(value, params);
}
