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
import { stripInvisibleChars } from '@/lib/cleanText';
import { getStoredAIAPIKey } from '@/lib/consts';
import { CVChangeSummary, summarizeCVChanges } from '@/lib/cvDiff';
import { CVData } from '@/lib/schema';
import { useUIStore } from '@/store/useUIStore';
import { Loader2, FilePenLine } from 'lucide-react';
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
  const [pendingResult, setPendingResult] = useState<CVData | null>(null);
  const [changeSummary, setChangeSummary] = useState<CVChangeSummary[]>([]);

  const effectiveError = error ?? localError;

  const resetState = () => {
    setJobDescription('');
    setLocalError(null);
    setPendingResult(null);
    setChangeSummary([]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetState();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    setLocalError(null);

    if (!jobDescription.trim()) {
      setLocalError('Please paste a job description.');
      return;
    }

    const apiKey = getStoredAIAPIKey() || undefined;

    const result = await adjustCV({
      cvData,
      jobDescription: stripInvisibleChars(jobDescription.trim()),
      provider: aiProvider,
      modelName: aiModel.trim() || undefined,
      apiKey,
    });

    if (result) {
      setPendingResult(result);
      setChangeSummary(summarizeCVChanges(cvData, result));
    }
  };

  const handleApply = () => {
    if (!pendingResult) return;
    onApply(pendingResult);
    toast.add({
      type: 'success',
      description: 'CV adjusted to match the job description.',
      priority: 'high',
    });
    handleOpenChange(false);
  };

  if (pendingResult) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Review changes</DialogTitle>
          </DialogHeader>

          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain p-2 -mx-1">
            {changeSummary.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No changes detected.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {changeSummary.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-2 px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium min-w-0">
                      <FilePenLine className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {item.detail}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            onClick={() => handleOpenChange(false)}
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
