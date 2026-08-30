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
import { FieldDescription } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/hooks/useI18n';
import { buildShareUrl } from '@/lib/share';
import { DesignSettings } from '@/lib/design';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { TemplateId } from '@/lib/templates';
import { CVData } from '@/lib/schema';
import { useResumeStore } from '@/store/useResumeStore';
import { Check, Copy, ExternalLink, Loader2, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ShareLinkContent({
  language,
  photo,
  template,
  design,
}: {
  language: ResumeLanguage;
  photo: string;
  template: TemplateId;
  design: DesignSettings;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();
  const { control } = useFormContext<CVData>();
  const cvData = useWatch({ control }) as CVData;

  useEffect(() => {
    let cancelled = false;
    void buildShareUrl(cvData, { language, photo, template, design }).then(
      (url) => {
        if (!cancelled) setLink(url);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [cvData, language, photo, template, design]);

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.add({
        type: 'success',
        description: t('share.toast.copied'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.add({
        type: 'error',
        description: t('share.toast.copyFailed'),
        priority: 'high',
      });
    }
  };

  if (!link) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t('share.building')}
      </div>
    );
  }

  return (
    <>
      <Textarea
        readOnly
        value={link}
        aria-label={t('share.linkAria')}
        className="h-24 resize-none text-xs break-all"
        onFocus={(e) => e.currentTarget.select()}
      />
      <FieldDescription className="flex items-center gap-1.5">
        <Share2 className="size-3.5 shrink-0" />
        {t('share.longLinkNote')}
      </FieldDescription>
      <DialogFooter>
        <Button variant="outline" onClick={handleCopy} disabled={copied}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? t('share.copied') : t('share.copyLink')}
        </Button>
        <Button onClick={() => window.open(link, '_blank')}>
          <ExternalLink className="size-4" />
          {t('share.open')}
        </Button>
      </DialogFooter>
    </>
  );
}

export function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const { t } = useI18n();
  const activeResume = useResumeStore((state) =>
    state.resumes.find((r) => r.id === state.activeId),
  );
  const language = activeResume?.language ?? 'en';
  const photo = activeResume?.photo ?? '';
  const template = activeResume?.templateId ?? 'harvard';
  const design = activeResume?.design;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('share.title')}</DialogTitle>
          <DialogDescription>{t('share.description')}</DialogDescription>
        </DialogHeader>

        {open && design && (
          <ShareLinkContent
            language={language}
            photo={photo}
            template={template}
            design={design}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
