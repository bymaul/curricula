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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useAIAdjustCV } from '@/hooks/useAIAdjustCV';
import { stripInvisibleChars } from '@/lib/cleanText';
import {
  AIAdjustScope,
  AI_ADJUST_SCOPES,
  getStoredAIAPIKey,
} from '@/lib/consts';
import type { CVImagePart } from '@/lib/cvParsing';
import { MAX_CV_IMAGES } from '@/lib/cvParsing';
import { CVChangeSummary, summarizeCVChanges } from '@/lib/cvDiff';
import { readImagePartsFromFiles } from '@/lib/imageFiles';
import { CVData } from '@/lib/schema';
import { useUIStore } from '@/store/useUIStore';
import {
  Loader2,
  FilePenLine,
  TriangleAlertIcon,
  ImagePlus,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';

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
  const [images, setImages] = useState<CVImagePart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scope, setScope] = useState<AIAdjustScope>('full');
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingResult, setPendingResult] = useState<{
    data: CVData;
    warnings: string[];
  } | null>(null);
  const [changeSummary, setChangeSummary] = useState<CVChangeSummary[]>([]);

  const effectiveError = error ?? localError;

  const resetState = () => {
    setJobDescription('');
    setImages([]);
    setScope('full');
    setLocalError(null);
    setPendingResult(null);
    setChangeSummary([]);
  };

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    event.target.value = '';
    if (!files?.length) return;

    setLocalError(null);
    const { parts, errors } = await readImagePartsFromFiles(files);
    setImages((prev) => [...prev, ...parts].slice(0, MAX_CV_IMAGES));
    if (errors.length > 0) setLocalError(errors[0]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetState();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    setLocalError(null);

    if (!jobDescription.trim() && images.length === 0) {
      setLocalError('Please paste a job description or upload an image.');
      return;
    }

    const apiKey = getStoredAIAPIKey() || undefined;

    const result = await adjustCV({
      cvData,
      jobDescription: stripInvisibleChars(jobDescription.trim()),
      provider: aiProvider,
      modelName: aiModel.trim() || undefined,
      apiKey,
      scope,
      images: images.length ? images : undefined,
    });

    if (result) {
      setPendingResult(result);
      setChangeSummary(summarizeCVChanges(cvData, result.data));
    }
  };

  const handleApply = () => {
    if (!pendingResult) return;
    onApply(pendingResult.data);
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
            {pendingResult.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                  <TriangleAlertIcon
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  />
                  Review these fields
                </div>
                <ul className="space-y-0.5 text-sm text-muted-foreground">
                  {pendingResult.warnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              </div>
            )}

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
            <FieldLabel>Adjust Scope</FieldLabel>
            <FieldDescription>
              Rewrite the whole CV or just one section to match the job
              description.
            </FieldDescription>
            <Select
              value={scope}
              onValueChange={(value) => value && setScope(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {AI_ADJUST_SCOPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Job Description</FieldLabel>
            <FieldDescription>
              Paste the job posting, or upload a screenshot or photo of it.
            </FieldDescription>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              className="min-h-32 sm:min-h-40 max-h-40 sm:max-h-60 resize-y"
              aria-invalid={!!effectiveError}
            />
          </Field>

          <Field>
            <FieldLabel>Job Description Image</FieldLabel>
            <FieldDescription>
              Prefer to tailor from an image? Attach up to {MAX_CV_IMAGES} JPEG,
              PNG, or WebP screenshots.
            </FieldDescription>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAdjusting}
              aria-label="Upload job description image"
              className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              <ImagePlus className="w-6 h-6" aria-hidden="true" />
              <span className="font-medium">Upload job description image</span>
              <span>
                JPEG, PNG, or WebP — up to {MAX_CV_IMAGES} screenshots
              </span>
            </button>
            {images.length > 0 && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {images.length}/{MAX_CV_IMAGES} attached
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAdjusting}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Add more
                  </button>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {images.map((image, index) => (
                    <li key={index} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:${image.mimeType};base64,${image.data}`}
                        alt={`Job description image ${index + 1}`}
                        className="h-16 w-16 rounded-md border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        aria-label={`Remove image ${index + 1}`}
                        className="absolute -top-1.5 -right-1.5 rounded-full bg-background p-1 text-muted-foreground shadow-sm border border-border hover:text-foreground"
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
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
