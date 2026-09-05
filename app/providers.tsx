'use client';

import { useEffect } from 'react';
import { SerwistProvider } from '@serwist/turbopack/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useUIStore } from '@/store/useUIStore';

function LanguageSync() {
  const lang = useUIStore((state) => state.uiLanguage);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}

export function Provider({ ...props }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <LanguageSync />
      <TooltipProvider {...props}>{props.children}</TooltipProvider>
    </SerwistProvider>
  );
}
