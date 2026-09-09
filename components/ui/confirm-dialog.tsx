'use client';

import { ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n';
import { useOnceAction } from '@/hooks/useOnceAction';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel: ReactNode;
  onConfirm: () => void;
  cancelLabel?: ReactNode;
  onCancel?: () => void;
  destructive?: boolean;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
  destructive = false,
  children,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const [runConfirmOnce, isConfirming, resetConfirm] = useOnceAction();

  useEffect(() => {
    if (open) resetConfirm();
  }, [open, resetConfirm]);

  const handleConfirm = () => {
    runConfirmOnce(onConfirm);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isConfirming}
            onClick={() => {
              onCancel?.();
              onOpenChange(false);
            }}
          >
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            disabled={isConfirming}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
