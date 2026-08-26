'use client';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/I18nProvider';
import { SAMPLE_CV_DATA } from '@/lib/sampleCv';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { CVData } from '@/lib/schema';

export function EditorEmptyState() {
  const { t } = useI18n();
  const { reset } = useFormContext<CVData>();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mx-4 mt-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t('editor.emptyStateTitle')}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('editor.emptyStateDescription')}
        </p>
        <div className="mt-2.5 flex gap-2">
          <Button type="button" size="sm" onClick={() => reset(SAMPLE_CV_DATA)}>
            {t('editor.emptyStateLoadExample')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
          >
            {t('editor.emptyStateStartBlank')}
          </Button>
        </div>
      </div>
    </div>
  );
}
