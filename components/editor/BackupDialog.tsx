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
import { toast } from '@/components/ui/toast';
import { BackupFile, parseBackup, serializeBackup } from '@/lib/backup';
import { useResumeStore } from '@/store/useResumeStore';
import { FileJson, FolderDown, RefreshCcw, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

interface BackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackupDialog({ open, onOpenChange }: BackupDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingRestore, setPendingRestore] = useState<BackupFile | null>(null);

  const handleDownload = () => {
    const { resumes, activeId } = useResumeStore.getState();
    const blob = new Blob([serializeBackup(resumes, activeId)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `curricula-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.add({
      type: 'success',
      description: `Backed up ${resumes.length} resume${resumes.length === 1 ? '' : 's'}.`,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

          <input
            type="file"
            accept=".json,application/json"
            ref={fileInputRef}
            onChange={handleFileChange}
            aria-label="Restore from backup file"
            className="hidden"
          />

          <div className="space-y-2">
            <Button onClick={handleDownload} className="w-full">
              <FolderDown className="w-4 h-4" />
              Download backup
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4" />
              Restore from file
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingRestore !== null}
        onOpenChange={(next) => !next && setPendingRestore(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restore backup?</DialogTitle>
            <DialogDescription>
              This replaces {pendingRestore?.resumes.length} current CV
              {pendingRestore?.resumes.length === 1 ? '' : 's'} with the backup.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>

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

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRestore(null)}>
              Cancel
            </Button>
            <Button onClick={handleRestore}>
              <RefreshCcw className="w-4 h-4" />
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
