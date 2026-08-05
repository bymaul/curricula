'use client';

import { cn } from '@/lib/utils';
import {
  DatabaseBackup,
  EllipsisVertical,
  FileText,
  Printer,
  Settings2,
  Share2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface ActionsDropdownProps {
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  handlePrintClick: () => void;
  onOpenShare: () => void;
  onOpenBackup: () => void;
  onOpenAIAdjust: () => void;
  onOpenAISettings: () => void;
  onOpenResumes?: () => void;
  triggerClassName?: string;
}

const ITEM_CLASSNAME = 'gap-3 py-2.5 px-3 text-sm cursor-pointer rounded-md';

export function ActionsDropdown({
  pdfInputRef,
  handlePrintClick,
  onOpenShare,
  onOpenBackup,
  onOpenAIAdjust,
  onOpenAISettings,
  onOpenResumes,
  triggerClassName,
}: ActionsDropdownProps) {
  const handleImportPDFClick = () => {
    pdfInputRef.current?.click();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn('h-9 lg:h-8', triggerClassName)}
            aria-label="Actions"
          >
            <EllipsisVertical className="w-4 h-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52 p-1.5">
        {onOpenResumes && (
          <>
            <DropdownMenuItem
              onClick={onOpenResumes}
              className={ITEM_CLASSNAME}
            >
              <FileText className="w-4 h-4 text-muted-foreground" />
              Manage Resumes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={handleImportPDFClick}
          className={ITEM_CLASSNAME}
        >
          <Upload className="w-4 h-4 text-muted-foreground" />
          Import PDF (AI)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenAIAdjust} className={ITEM_CLASSNAME}>
          <Sparkles className="w-4 h-4 text-primary" />
          AI Adjust
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenAISettings} className={ITEM_CLASSNAME}>
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          AI Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenShare} className={ITEM_CLASSNAME}>
          <Share2 className="w-4 h-4 text-muted-foreground" />
          Share Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrintClick} className={ITEM_CLASSNAME}>
          <Printer className="w-4 h-4 text-muted-foreground" />
          Print / PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenBackup} className={ITEM_CLASSNAME}>
          <DatabaseBackup className="w-4 h-4 text-muted-foreground" />
          Backup &amp; Restore
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
