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
import { BackupFile, parseBackup, serializeBackup } from '@/lib/backup';
import { CVData, cvSchema } from '@/lib/schema';
import { useResumeStore } from '@/store/useResumeStore';
import {
  Download,
  FileJson,
  FolderDown,
  RefreshCcw,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';

interface BackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvData: CVData;
  onApplyCVData: (data: CVData) => void;
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function BackupDialog({
  open,
  onOpenChange,
  cvData,
  onApplyCVData,
}: BackupDialogProps) {
  const backupInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [pendingRestore, setPendingRestore] = useState<BackupFile | null>(null);

  const handleDownload = () => {
    const { resumes, activeId } = useResumeStore.getState();
    downloadFile(
      serializeBackup(resumes, activeId),
      `curricula-backup-${new Date().toISOString().slice(0, 10)}.json`,
    );
    toast.add({
      type: 'success',
      description: `Backed up ${resumes.length} resume${resumes.length === 1 ? '' : 's'}.`,
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
          description:
            'Invalid backup file. It is corrupted or from an older version.',
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
      description: `Restored ${count} resume${count === 1 ? '' : 's'} from backup.`,
    });
  };

  const handleExportJSON = () => {
    downloadFile(
      JSON.stringify(cvData, null, 2),
      `${cvData.name ? cvData.name.replace(/\s+/g, '_') : 'My'}_CV_Data.json`,
    );
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const result = cvSchema.safeParse(parsed);
        if (!result.success) {
          toast.add({
            type: 'error',
            description:
              'Invalid CV format. The file is corrupted or from an older version.',
            priority: 'high',
          });
          return;
        }
        onApplyCVData(result.data);
        toast.add({
          type: 'success',
          description: 'CV Data imported successfully!',
        });
      } catch {
        toast.add({
          type: 'error',
          description:
            'Could not read file. Please upload a valid JSON backup.',
          priority: 'high',
        });
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Backup &amp; Restore</DialogTitle>
            <DialogDescription>
              Back up all of your CVs to a single file, or restore from a
              previous backup. Backups include every CV, its data, section
              order, and visibility.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                All CVs
              </h3>
              <Button onClick={handleDownload} className="w-full">
                <FolderDown className="w-4 h-4" />
                Download backup
              </Button>
              <Button
                variant="outline"
                onClick={() => backupInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4" />
                Restore from file
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Current CV
              </h3>
              <Button
                variant="outline"
                onClick={handleExportJSON}
                className="w-full"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                onClick={() => jsonInputRef.current?.click()}
                className="w-full"
              >
                <FileJson className="w-4 h-4" />
                Import JSON
              </Button>
            </div>
          </div>

          <input
            type="file"
            accept=".json,application/json"
            ref={backupInputRef}
            onChange={handleBackupFileChange}
            aria-label="Restore from backup file"
            className="hidden"
          />
          <input
            type="file"
            accept=".json,application/json"
            ref={jsonInputRef}
            onChange={handleImportJSON}
            aria-label="Import CV data (JSON file)"
            className="hidden"
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingRestore !== null}
        onOpenChange={(next) => !next && setPendingRestore(null)}
        title="Restore backup?"
        description={`This replaces ${pendingRestore?.resumes.length} current CV${
          pendingRestore?.resumes.length === 1 ? '' : 's'
        } with the backup. This cannot be undone.`}
        confirmLabel={
          <>
            <RefreshCcw className="w-4 h-4" />
            Restore
          </>
        }
        onConfirm={handleRestore}
      >
        <ul className="max-h-48 overflow-auto rounded-lg border border-border divide-y divide-border">
          {pendingRestore?.resumes.map((resume) => (
            <li key={resume.id} className="flex items-center gap-2 px-3 py-2">
              <FileJson className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate text-sm font-medium">
                {resume.title}
              </span>
              {resume.id === pendingRestore.activeId && (
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  active
                </span>
              )}
            </li>
          ))}
        </ul>
      </ConfirmDialog>
    </>
  );
}
