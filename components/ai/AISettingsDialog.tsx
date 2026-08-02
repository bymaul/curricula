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

interface AISettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISettingsDialog({
  open,
  onOpenChange,
}: AISettingsDialogProps) {
  const settings = useAISettings();
  const status = useAIStatus(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-2 -mx-1">
          <AISettingsFields
            {...settings}
            hasBundledKey={status?.hasBundledKey}
            bundledProvider={status?.provider ?? null}
          />
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
