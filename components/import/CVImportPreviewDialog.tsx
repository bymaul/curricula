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
import { useI18n } from '@/components/I18nProvider';
import { CVData } from '@/lib/schema';
import { getSectionTabName } from '@/lib/consts';
import { TAB_KEYS } from '@/lib/i18n';
import { TriangleAlertIcon } from 'lucide-react';

interface CVImportPreviewDialogProps {
  cvData: CVData | null;
  warnings?: string[];
  onApply: () => void;
  onDiscard: () => void;
}

function CountRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{count}</span>
    </div>
  );
}

export function CVImportPreviewDialog({
  cvData,
  warnings = [],
  onApply,
  onDiscard,
}: CVImportPreviewDialogProps) {
  const { t } = useI18n();
  const open = cvData !== null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDiscard()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('importPreview.title')}</DialogTitle>
          <DialogDescription>
            {t('importPreview.description')}
          </DialogDescription>
        </DialogHeader>

        {cvData && (
          <div className="space-y-4">
            {warnings.length > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                  <TriangleAlertIcon
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {t('importPreview.reviewFields')}
                </div>
                <ul className="space-y-0.5 text-sm text-muted-foreground">
                  {warnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-0.5">
              <p className="text-base font-semibold leading-tight">
                {cvData.name || t('importPreview.unnamed')}
              </p>
              {cvData.jobTitle && (
                <p className="text-sm text-muted-foreground">
                  {cvData.jobTitle}
                </p>
              )}
              {cvData.email && (
                <p className="text-sm text-muted-foreground">{cvData.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <CountRow
                label={t(TAB_KEYS[getSectionTabName('experience')])}
                count={cvData.experience.length}
              />
              <CountRow
                label={t(TAB_KEYS[getSectionTabName('projects')])}
                count={cvData.projects.length}
              />
              <CountRow
                label={t(TAB_KEYS[getSectionTabName('education')])}
                count={cvData.education.length}
              />
              <CountRow
                label={t('importPreview.skillGroups')}
                count={cvData.skills.length}
              />
              <CountRow
                label={t(TAB_KEYS[getSectionTabName('certifications')])}
                count={cvData.certifications.length}
              />
              <CountRow
                label={t('importPreview.links')}
                count={cvData.links.length}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDiscard}>
            {t('importPreview.discard')}
          </Button>
          <Button onClick={onApply}>{t('importPreview.applyToEditor')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
