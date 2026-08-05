'use client';

import { IconButton } from '@/components/ui/icon-button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TooltipIconButtonProps extends Omit<
  React.ComponentProps<typeof IconButton>,
  'aria-label'
> {
  label: string;
  side?: React.ComponentProps<typeof TooltipContent>['side'];
}

export function TooltipIconButton({
  label,
  side = 'top',
  ...props
}: TooltipIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<IconButton aria-label={label} {...props} />} />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
