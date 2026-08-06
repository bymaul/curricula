import { describe, expect, it } from 'vitest';
import {
  AI_ADJUST_SCOPE_KEYS,
  DICTIONARIES,
  interpolate,
  TAB_KEYS,
  translate,
  translateValidationMessage,
  TranslationKey,
} from '@/lib/i18n';
import { Language } from '@/lib/i18n/languages';
import { AIAdjustScope, TabName } from '@/lib/consts';

function leafKeys(value: unknown): string[] {
  if (typeof value === 'string') return [''];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    leafKeys(v).map((path) => (path ? `${k}.${path}` : k)),
  );
}

const EN_KEYS = leafKeys(DICTIONARIES.en);

describe('translate', () => {
  it('returns the English string for en', () => {
    expect(translate('en', 'tabs.personal')).toBe('Personal');
    expect(translate('en', 'template.skills')).toBe('Skills');
  });

  it('returns the Indonesian string for id', () => {
    expect(translate('id', 'tabs.personal')).toBe('Data Pribadi');
    expect(translate('id', 'template.skills')).toBe('Keahlian');
  });

  it('falls back to English for unknown languages', () => {
    expect(translate('es' as Language, 'tabs.personal')).toBe('Personal');
  });

  it('returns the key itself when missing', () => {
    expect(translate('en', 'missing.key' as TranslationKey)).toBe(
      'missing.key',
    );
  });
});

describe('interpolate', () => {
  it('replaces named placeholders with params', () => {
    expect(interpolate('Hi {name}', { name: 'Erika' })).toBe('Hi Erika');
    expect(interpolate('{count} items', { count: 3 })).toBe('3 items');
  });

  it('keeps unknown placeholders when params are missing', () => {
    expect(interpolate('Hi {name}', { other: 'x' })).toBe('Hi {name}');
    expect(interpolate('Hi {name}')).toBe('Hi {name}');
  });
});

describe('dictionary parity', () => {
  it('registers exactly en and id', () => {
    expect(Object.keys(DICTIONARIES)).toEqual(['en', 'id']);
  });

  it('keeps Indonesian keys identical to English keys', () => {
    expect(leafKeys(DICTIONARIES.id)).toEqual(EN_KEYS);
  });

  it('is non-empty', () => {
    expect(EN_KEYS.length).toBeGreaterThan(0);
  });
});

describe('TAB_KEYS', () => {
  const TAB_NAMES: TabName[] = [
    'personal',
    'experience',
    'projects',
    'education',
    'skills',
    'certifications',
  ];

  it('maps every tab to a defined translation', () => {
    for (const tab of TAB_NAMES) {
      expect(EN_KEYS).toContain(TAB_KEYS[tab]);
    }
  });

  it('has a distinct key per tab', () => {
    const keys = TAB_NAMES.map((tab) => TAB_KEYS[tab]);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('AI_ADJUST_SCOPE_KEYS', () => {
  const SCOPES: AIAdjustScope[] = [
    'full',
    'summary',
    'experience',
    'projects',
    'education',
    'skills',
  ];

  it('maps every scope to a defined translation', () => {
    for (const scope of SCOPES) {
      expect(EN_KEYS).toContain(AI_ADJUST_SCOPE_KEYS[scope]);
    }
  });

  it('has a distinct key per scope', () => {
    const keys = SCOPES.map((scope) => AI_ADJUST_SCOPE_KEYS[scope]);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('translateValidationMessage', () => {
  const t = (key: TranslationKey) => `[${key}]`;

  it('maps known zod messages to translated keys', () => {
    expect(translateValidationMessage(t, 'Role is required')).toBe(
      '[validation.roleRequired]',
    );
    expect(translateValidationMessage(t, 'Invalid email address')).toBe(
      '[validation.emailInvalid]',
    );
  });

  it('passes through unknown messages unchanged', () => {
    expect(translateValidationMessage(t, 'Something weird')).toBe(
      'Something weird',
    );
  });

  it('returns undefined for empty input', () => {
    expect(translateValidationMessage(t, undefined)).toBeUndefined();
    expect(translateValidationMessage(t, '')).toBeUndefined();
  });
});
