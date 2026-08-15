'use client';

import { AISettingsFields } from '@/components/ai/AISettingsFields';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAISettings } from '@/hooks/useAISettings';
import { useAIStatus } from '@/hooks/useAIStatus';
import { useI18n } from '@/components/I18nProvider';

interface AISettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISettingsDialog({
  open,
  onOpenChange,
}: AISettingsDialogProps) {
  const settings = useAISettings();
  const { status, error } = useAIStatus(open);
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('aiSettings.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-2 -mx-1">
          <AISettingsFields
            {...settings}
            hasBundledKey={status?.hasBundledKey}
            bundledProvider={status?.provider ?? null}
            statusError={error}
          />
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {t('aiSettings.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
