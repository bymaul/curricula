'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';

export function LanguageSync() {
  const lang = useUIStore((state) => state.uiLanguage);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
