import { SerwistProvider } from '@serwist/turbopack/react';
import { I18nProvider } from '@/components/I18nProvider';
import { TooltipProvider } from '@/components/ui/tooltip';

export function Provider({ ...props }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <I18nProvider>
        <TooltipProvider {...props}>{props.children}</TooltipProvider>
      </I18nProvider>
    </SerwistProvider>
  );
}
