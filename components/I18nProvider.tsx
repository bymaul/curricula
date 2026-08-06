'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { translate, TranslationKey } from '@/lib/i18n';
import { Language } from '@/lib/i18n/languages';
import { useUIStore } from '@/store/useUIStore';

type T = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

interface I18nValue {
  lang: Language;
  t: T;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const lang = useUIStore((state) => state.uiLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      t: (key, params) => translate(lang, key, params),
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
