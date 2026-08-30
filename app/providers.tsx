import { SerwistProvider } from '@serwist/turbopack/react';
import { LanguageSync } from '@/components/LanguageSync';
import { TooltipProvider } from '@/components/ui/tooltip';

export function Provider({ ...props }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <LanguageSync />
      <TooltipProvider {...props}>{props.children}</TooltipProvider>
    </SerwistProvider>
  );
}
