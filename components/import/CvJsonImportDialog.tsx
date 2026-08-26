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
import { WarningList } from '@/components/ui/warning-list';
import { parseCvJson } from '@/lib/cvImport';
import type { CVData } from '@/lib/schema';
import { FileJson, FileUp } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import { Textarea } from '../ui/textarea';

interface CvJsonImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: CVData) => void;
}

export function CvJsonImportDialog({
  open,
  onOpenChange,
  onImport,
}: CvJsonImportDialogProps) {
  const { t } = useI18n();
  const [raw, setRaw] = useState('');
  const [issues, setIssues] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAndClose = () => {
    setRaw('');
    setIssues(null);
    onOpenChange(false);
  };

  const handleImport = () => {
    const result = parseCvJson(raw);
    if (!result.ok) {
      setIssues(
        result.kind === 'syntax'
          ? [t('backup.importJsonSyntaxError'), ...result.issues]
          : result.issues,
      );
      return;
    }
    onImport(result.data);
    resetAndClose();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (event) => {
      setRaw((event.target?.result as string) ?? '');
      setIssues(null);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAndClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('backup.importJsonTitle')}</DialogTitle>
          <DialogDescription>
            {t('backup.importJsonDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              if (issues) setIssues(null);
            }}
            placeholder={t('backup.importJsonPlaceholder')}
            aria-label={t('backup.importJsonAria')}
            className="max-h-72 min-h-40 font-mono text-xs"
            spellCheck={false}
          />

          <WarningList
            title={t('backup.importJsonInvalid')}
            warnings={issues ?? []}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors outline-none hover:border-ring hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <FileUp className="size-4" />
            {t('backup.importJsonChooseFile')}
          </button>

          <input
            type="file"
            accept=".json,application/json,text/plain"
            ref={fileInputRef}
            onChange={handleFileChange}
            aria-label={t('backup.importFileAria')}
            className="hidden"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleImport} disabled={!raw.trim()}>
            <FileJson className="size-4" />
            {t('backup.importJsonAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
