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
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
import { AIProvider, AI_PROVIDERS } from '@/lib/consts';
import { CVData } from '@/lib/schema';
import { useUIStore } from '@/store/useUIStore';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const API_KEY_STORAGE_KEY = 'curricula-ai-api-key';

interface AIAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvData: CVData;
  onApply: (data: CVData) => void;
}

export function AIAdjustDialog({ open, onOpenChange, cvData, onApply }: AIAdjustDialogProps) {
  const { isAdjusting, error, adjustCV } = useAIAdjustCV();
  const { aiProvider, aiModel, setAIPrefs } = useUIStore();

  const [jobDescription, setJobDescription] = useState('');
  const [provider, setProvider] = useState<AIProvider>(aiProvider);
  const [modelName, setModelName] = useState(aiModel);
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem(API_KEY_STORAGE_KEY) ?? '');
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedProvider = AI_PROVIDERS.find((p) => p.value === provider);
  const effectiveError = error ?? localError;

  const handleProviderChange = (value: AIProvider | null) => {
    if (value) {
      setProvider(value);
      setModelName('');
      setAIPrefs(value, '');
    }
  };

  const handleModelChange = (value: string) => {
    setModelName(value);
    setAIPrefs(provider, value);
  };

  const handleKeyChange = (value: string) => {
    setApiKey(value);
    if (value.trim()) {
      sessionStorage.setItem(API_KEY_STORAGE_KEY, value.trim());
    } else {
      sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  };

  const handleSubmit = async () => {
    setLocalError(null);

    if (!jobDescription.trim()) {
      setLocalError('Please paste a job description.');
      return;
    }
    if (!apiKey.trim()) {
      setLocalError('Please enter your API key.');
      return;
    }

    const result = await adjustCV({
      cvData,
      jobDescription: jobDescription.trim(),
      provider,
      modelName: modelName.trim() || undefined,
      apiKey: apiKey.trim(),
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Provider</FieldLabel>
              <Select value={provider} onValueChange={handleProviderChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {AI_PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Model</FieldLabel>
              <Input
                value={modelName}
                onChange={(e) => handleModelChange(e.target.value)}
                placeholder={selectedProvider?.defaultModel}
              />
              <FieldDescription>
                Optional. Defaults to {selectedProvider?.defaultModel}.
              </FieldDescription>
            </Field>
          </div>

          <Field>
            <FieldLabel>API Key</FieldLabel>
            <FieldDescription>
              Kept in this browser tab only, never stored permanently.
            </FieldDescription>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="sk-..."
              autoComplete="off"
            />
          </Field>

          {effectiveError && <FieldError className="-mt-2">{effectiveError}</FieldError>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdjusting}>
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
