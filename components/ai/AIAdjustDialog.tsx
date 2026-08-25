'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { WarningList } from '@/components/ui/warning-list';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/components/I18nProvider';
import { useAIAdjustCV } from '@/hooks/useAIAdjustCV';
import { stripInvisibleChars } from '@/lib/cleanText';
import { getStoredAIAPIKey } from '@/lib/consts';
import { AIAdjustScope } from '@/lib/consts';
import { AI_ADJUST_SCOPE_KEYS } from '@/lib/i18n';
import type { CVImagePart } from '@/lib/cvParsing';
import { MAX_ADJUST_IMAGES } from '@/lib/cvParsing';
import { CVChangeSummary, summarizeCVChanges } from '@/lib/cvDiff';
import { readImagePartsFromFiles } from '@/lib/imageFiles';
import { CVData } from '@/lib/schema';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';
import { Loader2, FilePenLine, ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

interface AIAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIAdjustDialog({ open, onOpenChange }: AIAdjustDialogProps) {
  const { isAdjusting, error, adjustCV, abort } = useAIAdjustCV();
  const { aiProvider, aiModel } = useUIStore();
  const { t } = useI18n();
  const { getValues, reset } = useFormContext<CVData>();

  const [jobDescription, setJobDescription] = useState('');
  const [images, setImages] = useState<CVImagePart[]>([]);
  const [isDragging, setIsDragging] = useState(false);
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
    setIsDragging(false);
    setScope('full');
    setLocalError(null);
    setPendingResult(null);
    setChangeSummary([]);
  };

  const processFiles = async (files: FileList | readonly File[] | null) => {
    if (!files?.length) return;

    setLocalError(null);
    const { parts, errors } = await readImagePartsFromFiles(files, {
      maxImages: MAX_ADJUST_IMAGES,
    });
    setImages((prev) => [...prev, ...parts].slice(0, MAX_ADJUST_IMAGES));
    if (errors.length > 0) setLocalError(errors[0]);
  };

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = '';
    void processFiles(files);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (isAdjusting) abort();
      resetState();
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    setLocalError(null);

    if (!jobDescription.trim() && images.length === 0) {
      setLocalError(t('aiAdjust.emptyInputError'));
      return;
    }

    const apiKey = getStoredAIAPIKey() || undefined;
    const source = getValues();

    const result = await adjustCV({
      cvData: source,
      jobDescription: stripInvisibleChars(jobDescription.trim()),
      provider: aiProvider,
      modelName: aiModel.trim() || undefined,
      apiKey,
      scope,
      images: images.length ? images : undefined,
    });

    if (result) {
      setPendingResult(result);
      setChangeSummary(summarizeCVChanges(source, result.data));
    }
  };

  const handleApply = () => {
    if (!pendingResult) return;
    reset(pendingResult.data);
    toast.add({
      type: 'success',
      description: t('aiAdjust.toastAdjusted'),
      priority: 'high',
    });
    handleOpenChange(false);
  };

  if (pendingResult) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t('aiAdjust.reviewTitle')}</DialogTitle>
            <DialogDescription>{t('import.reviewResult')}</DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain p-2 -mx-1">
            <WarningList
              title={t('importPreview.reviewFields')}
              warnings={pendingResult.warnings}
            />

            {changeSummary.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('aiAdjust.noChanges')}
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {changeSummary.map((item) => (
                  <li
                    key={item.labelKey}
                    className="flex items-center justify-between gap-2 px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium min-w-0">
                      <FilePenLine className="size-4 text-primary shrink-0" />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </span>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {t(item.detailKey, item.params)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {t('aiAdjust.cancel')}
            </Button>
            <Button onClick={handleApply}>{t('aiAdjust.applyChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('aiAdjust.title')}</DialogTitle>
          <DialogDescription>{t('aiAdjust.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain p-2 -mx-1">
          <Field>
            <FieldLabel>{t('aiAdjust.scopeLabel')}</FieldLabel>
            <FieldDescription>
              {t('aiAdjust.scopeDescription')}
            </FieldDescription>
            <Select
              items={(Object.keys(AI_ADJUST_SCOPE_KEYS) as AIAdjustScope[]).map(
                (value) => ({
                  value,
                  label: t(AI_ADJUST_SCOPE_KEYS[value]),
                }),
              )}
              value={scope}
              onValueChange={(value) => value && setScope(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {(Object.keys(AI_ADJUST_SCOPE_KEYS) as AIAdjustScope[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {t(AI_ADJUST_SCOPE_KEYS[value])}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>{t('aiAdjust.jobDescriptionLabel')}</FieldLabel>
            <FieldDescription>
              {t('aiAdjust.jobDescriptionDescription')}
            </FieldDescription>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder={t('aiAdjust.jobDescriptionPlaceholder')}
              className="min-h-32 sm:min-h-40 max-h-40 sm:max-h-60 resize-y"
              aria-invalid={!!effectiveError}
            />
          </Field>

          <Field>
            <FieldLabel>{t('aiAdjust.imageLabel')}</FieldLabel>
            <FieldDescription>
              {t('aiAdjust.imageDescription', { max: MAX_ADJUST_IMAGES })}
            </FieldDescription>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label={t('aiAdjust.imageUploadAria')}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsDragging(false);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                void processFiles(e.dataTransfer.files);
              }}
              className={cn(
                'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm text-muted-foreground border-border transition-colors',
                isDragging ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
              )}
            >
              {images.length === 0 ? (
                <>
                  <ImagePlus className="size-6" aria-hidden="true" />
                  <span className="font-medium">
                    {t('aiAdjust.imageDropText')}
                  </span>
                  <span>
                    {t('aiAdjust.imageDropHint', { max: MAX_ADJUST_IMAGES })}
                  </span>
                </>
              ) : (
                <>
                  <ul className="flex flex-wrap justify-center gap-2">
                    {images.map((image, index) => (
                      <li key={index} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:${image.mimeType};base64,${image.data}`}
                          alt={t('aiAdjust.imageAlt', {
                            index: index + 1,
                          })}
                          className="h-16 w-16 rounded-lg border border-border object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          aria-label={t('aiAdjust.imageRemoveAria', {
                            index: index + 1,
                          })}
                          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm border border-border transition-colors hover:text-foreground"
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <span className="font-medium">
                    {t('aiAdjust.imageAttachedText', {
                      current: images.length,
                      max: MAX_ADJUST_IMAGES,
                    })}
                  </span>
                </>
              )}
            </div>
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
            {t('aiAdjust.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isAdjusting}>
            {isAdjusting && <Loader2 className="size-4 animate-spin" />}
            {isAdjusting ? t('aiAdjust.adjusting') : t('aiAdjust.adjustCv')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
