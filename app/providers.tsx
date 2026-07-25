import { TooltipProvider } from '@/components/ui/tooltip';

export function Provider({ ...props }) {
    return <TooltipProvider {...props}>{props.children}</TooltipProvider>;
}
