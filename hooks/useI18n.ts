'use client';

import { useMemo } from 'react';
import { translate, TranslationKey } from '@/lib/i18n';
import { Language } from '@/lib/i18n/languages';
import { useUIStore } from '@/store/useUIStore';

type T = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

export function useI18n(): { lang: Language; t: T } {
  const lang = useUIStore((state) => state.uiLanguage);
  return useMemo(
    () => ({
      lang,
      t: (key, params) => translate(lang, key, params),
    }),
    [lang],
  );
}
