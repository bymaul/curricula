'use client';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/hooks/useI18n';
import { CvJsonImportDialog } from '@/components/import/CvJsonImportDialog';
import { BackupFile, parseBackup, serializeBackup } from '@/lib/backup';
import { CVData } from '@/lib/schema';
import { downloadFile } from '@/lib/utils';
import { useResumeStore } from '@/store/useResumeStore';
import {
  Download,
  FileJson,
  FolderDown,
  RefreshCcw,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

interface BackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackupDialog({ open, onOpenChange }: BackupDialogProps) {
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [pendingRestore, setPendingRestore] = useState<BackupFile | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const { t } = useI18n();
  const { getValues, reset } = useFormContext<CVData>();

  const handleDownload = () => {
    const { resumes, activeId } = useResumeStore.getState();
    downloadFile(
      serializeBackup(resumes, activeId),
      `curricula-backup-${new Date().toISOString().slice(0, 10)}.json`,
    );
    toast.add({
      type: 'success',
      description:
        resumes.length === 1
          ? t('backup.toast.backedUpOne', { count: String(resumes.length) })
          : t('backup.toast.backedUpMany', { count: String(resumes.length) }),
    });
  };

  const handleBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (event) => {
      const backup = parseBackup(event.target?.result as string);
      if (!backup || backup.resumes.length === 0) {
        toast.add({
          type: 'error',
          description: t('backup.toast.invalidFile'),
          priority: 'high',
        });
        return;
      }
      setPendingRestore(backup);
    };
    reader.readAsText(file);
  };

  const handleRestore = () => {
    if (!pendingRestore) return;
    const count = pendingRestore.resumes.length;
    useResumeStore
      .getState()
      .restoreBackup(pendingRestore.resumes, pendingRestore.activeId);
    setPendingRestore(null);
    toast.add({
      type: 'success',
      description:
        count === 1
          ? t('backup.toast.restoredOne', { count: String(count) })
          : t('backup.toast.restoredMany', { count: String(count) }),
    });
  };

  const handleExportJSON = () => {
    const cvData = getValues();
    downloadFile(
      JSON.stringify(cvData, null, 2),
      `${cvData.name ? cvData.name.replace(/\s+/g, '_') : 'My'}_CV_Data.json`,
    );
  };

  const handleImportedCv = (data: CVData) => {
    reset(data);
    toast.add({
      type: 'success',
      description: t('backup.toast.cvImported'),
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('backup.title')}</DialogTitle>
            <DialogDescription>{t('backup.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {t('backup.allCvs')}
              </h3>
              <Button onClick={handleDownload} className="w-full">
                <FolderDown className="size-4" />
                {t('backup.downloadBackup')}
              </Button>
              <Button
                variant="outline"
                onClick={() => backupInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="size-4" />
                {t('backup.restoreFromFile')}
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {t('backup.currentCv')}
              </h3>
              <Button
                variant="outline"
                onClick={handleExportJSON}
                className="w-full"
              >
                <Download className="size-4" />
                {t('backup.exportJson')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
                className="w-full"
              >
                <FileJson className="size-4" />
                {t('backup.importJson')}
              </Button>
            </div>
          </div>

          <input
            type="file"
            accept=".json,application/json"
            ref={backupInputRef}
            onChange={handleBackupFileChange}
            aria-label={t('backup.restoreFileAria')}
            className="hidden"
          />
        </DialogContent>
      </Dialog>

      <CvJsonImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImportedCv}
      />

      <ConfirmDialog
        open={pendingRestore !== null}
        onOpenChange={(next) => !next && setPendingRestore(null)}
        title={t('backup.confirmRestoreTitle')}
        description={t(
          pendingRestore?.resumes.length === 1
            ? 'backup.confirmRestoreDescriptionOne'
            : 'backup.confirmRestoreDescriptionMany',
          { count: String(pendingRestore?.resumes.length ?? 0) },
        )}
        confirmLabel={
          <>
            <RefreshCcw className="size-4" />
            {t('backup.confirmRestoreAction')}
          </>
        }
        onConfirm={handleRestore}
      >
        <ul className="border-border divide-border max-h-48 divide-y overflow-auto rounded-lg border">
          {pendingRestore?.resumes.map((resume) => (
            <li key={resume.id} className="flex items-center gap-2 px-3 py-2">
              <FileJson className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 truncate text-sm font-medium">
                {resume.title}
              </span>
              {resume.id === pendingRestore.activeId && (
                <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                  {t('backup.activeBadge')}
                </span>
              )}
            </li>
          ))}
        </ul>
      </ConfirmDialog>
    </>
  );
}
