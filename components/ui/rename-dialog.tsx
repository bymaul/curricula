'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/hooks/useI18n';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: string;
  onRename: (value: string) => void;
  renameLabel?: ReactNode;
  cancelLabel?: ReactNode;
}

export function RenameDialog({
  open,
  onOpenChange,
  title,
  value,
  onRename,
  renameLabel,
  cancelLabel,
}: RenameDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState(value);

  useEffect(() => {
    if (open) setName(value);
  }, [open, value]);

  const handleSubmit = () => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    onRename(trimmedName);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSubmit();
          }}
          autoFocus
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel ?? t('common.cancel')}
          </Button>

          <Button type="button" disabled={!name.trim()} onClick={handleSubmit}>
            {renameLabel ?? t('resumes.rename')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
