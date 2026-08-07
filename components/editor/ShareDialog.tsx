'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/components/I18nProvider';
import { buildShareUrl } from '@/lib/share';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { TemplateId } from '@/lib/templates';
import { CVData } from '@/lib/schema';
import { useResumeStore } from '@/store/useResumeStore';
import { Check, Copy, ExternalLink, Loader2, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvData: CVData;
}

function ShareLinkContent({
  cvData,
  language,
  photo,
  template,
}: {
  cvData: CVData;
  language: ResumeLanguage;
  photo: string;
  template: TemplateId;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    void buildShareUrl(cvData, { language, photo, template }).then((url) => {
      if (!cancelled) setLink(url);
    });
    return () => {
      cancelled = true;
    };
  }, [cvData, language, photo, template]);

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
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('share.building')}
      </div>
    );
  }

  return (
    <>
      <textarea
        readOnly
        value={link}
        aria-label={t('share.linkAria')}
        className="h-24 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-xs break-all leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onFocus={(e) => e.currentTarget.select()}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={handleCopy} disabled={copied}>
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? t('share.copied') : t('share.copyLink')}
        </Button>
        <Button onClick={() => window.open(link, '_blank')}>
          <ExternalLink className="w-4 h-4" />
          {t('share.open')}
        </Button>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Share2 className="w-3.5 h-3.5 shrink-0" />
        {t('share.longLinkNote')}
      </p>
    </>
  );
}

export function ShareDialog({ open, onOpenChange, cvData }: ShareDialogProps) {
  const { t } = useI18n();
  const activeResume = useResumeStore((state) =>
    state.resumes.find((r) => r.id === state.activeId),
  );
  const language = activeResume?.language ?? 'en';
  const photo = activeResume?.photo ?? '';
  const template = activeResume?.templateId ?? 'harvard';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('share.title')}</DialogTitle>
          <DialogDescription>{t('share.description')}</DialogDescription>
        </DialogHeader>

        {open && (
          <ShareLinkContent
            cvData={cvData}
            language={language}
            photo={photo}
            template={template}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
