import { SerwistProvider } from '@serwist/turbopack/react';
import { TooltipProvider } from '@/components/ui/tooltip';

export function Provider({ ...props }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <TooltipProvider {...props}>{props.children}</TooltipProvider>
    </SerwistProvider>
  );
}
