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
import { BuiltinTabName, getSectionTabName } from '@/lib/consts';
import { TAB_KEYS } from '@/lib/i18n';
import { useImportStore } from '@/store/useImportStore';
import { WarningList } from '@/components/ui/warning-list';
import { useFormContext } from 'react-hook-form';
import type { CVData } from '@/lib/schema';

function CountRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{count}</span>
    </div>
  );
}

export function CVImportPreviewDialog() {
  const { t } = useI18n();
  const pendingImport = useImportStore((state) => state.pendingImport);
  const clearPendingImport = useImportStore(
    (state) => state.clearPendingImport,
  );
  const { reset } = useFormContext<CVData>();
  const open = pendingImport !== null;
  const cvData = pendingImport?.data ?? null;
  const warnings = pendingImport?.warnings ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && clearPendingImport()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('importPreview.title')}</DialogTitle>
          <DialogDescription>
            {t('importPreview.description')}
          </DialogDescription>
        </DialogHeader>

        {cvData && (
          <div className="space-y-4">
            <WarningList
              title={t('importPreview.reviewFields')}
              warnings={warnings}
            />

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
                label={t(
                  TAB_KEYS[getSectionTabName('experience') as BuiltinTabName],
                )}
                count={cvData.experience.length}
              />
              <CountRow
                label={t(
                  TAB_KEYS[getSectionTabName('projects') as BuiltinTabName],
                )}
                count={cvData.projects.length}
              />
              <CountRow
                label={t(
                  TAB_KEYS[getSectionTabName('education') as BuiltinTabName],
                )}
                count={cvData.education.length}
              />
              <CountRow
                label={t('importPreview.skillGroups')}
                count={cvData.skills.length}
              />
              <CountRow
                label={t(
                  TAB_KEYS[
                    getSectionTabName('certifications') as BuiltinTabName
                  ],
                )}
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
          <Button variant="outline" onClick={clearPendingImport}>
            {t('importPreview.discard')}
          </Button>
          <Button
            onClick={() => {
              if (!pendingImport) return;
              reset(pendingImport.data);
              clearPendingImport();
            }}
          >
            {t('importPreview.applyToEditor')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
