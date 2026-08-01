'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useAIAdjustCV } from '@/hooks/useAIAdjustCV';
import { getStoredAIAPIKey } from '@/lib/consts';
import { CVData } from '@/lib/schema';
import { useUIStore } from '@/store/useUIStore';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface AIAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvData: CVData;
  onApply: (data: CVData) => void;
}

export function AIAdjustDialog({
  open,
  onOpenChange,
  cvData,
  onApply,
}: AIAdjustDialogProps) {
  const { isAdjusting, error, adjustCV } = useAIAdjustCV();
  const { aiProvider, aiModel } = useUIStore();

  const [jobDescription, setJobDescription] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const effectiveError = error ?? localError;

  const handleSubmit = async () => {
    setLocalError(null);

    if (!jobDescription.trim()) {
      setLocalError('Please paste a job description.');
      return;
    }

    const apiKey = getStoredAIAPIKey();

    if (!apiKey) {
      setLocalError('Add your API key in AI Settings first.');
      return;
    }

    const result = await adjustCV({
      cvData,
      jobDescription: jobDescription.trim(),
      provider: aiProvider,
      modelName: aiModel.trim() || undefined,
      apiKey,
    });

    if (result) {
      onApply(result);
      toast.add({
        type: 'success',
        description: 'CV adjusted to match the job description.',
        priority: 'high',
      });
      onOpenChange(false);
      setJobDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)] overflow-hidden">
        <DialogHeader>
          <DialogTitle>AI CV Adjust</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain p-2 -mx-1">
          <Field>
            <FieldLabel>Job Description</FieldLabel>
            <FieldDescription>
              Paste the job posting you want to tailor your CV for.
            </FieldDescription>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              className="min-h-32 sm:min-h-40 max-h-40 sm:max-h-60 resize-y"
              aria-invalid={!!effectiveError}
            />
          </Field>

          {effectiveError && (
            <FieldError className="-mt-2">{effectiveError}</FieldError>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdjusting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isAdjusting}>
            {isAdjusting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isAdjusting ? 'Adjusting...' : 'Adjust CV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
