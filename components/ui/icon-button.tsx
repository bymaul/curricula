'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type IconButtonProps = React.ComponentProps<typeof Button> & {
  'aria-label': string;
};

export function IconButton({
  variant = 'ghost',
  size = 'icon',
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        'text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-40 transition-colors',
        className,
      )}
      {...props}
    />
  );
}
