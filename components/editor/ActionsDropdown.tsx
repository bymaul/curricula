import { getStoredAIAPIKey } from '@/lib/consts';
import { cn } from '@/lib/utils';
import {
  Download,
  EllipsisVertical,
  FileJson,
  FileText,
  Printer,
  Settings2,
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
  jsonInputRef: React.RefObject<HTMLInputElement | null>;
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  handleExportData: () => void;
  handlePrintClick: () => void;
  onOpenAIAdjust: () => void;
  onOpenAISettings: () => void;
  onOpenResumes?: () => void;
  triggerClassName?: string;
}

const ITEM_CLASSNAME = 'gap-3 py-2.5 px-3 text-sm cursor-pointer rounded-md';

export function ActionsDropdown({
  jsonInputRef,
  pdfInputRef,
  handleExportData,
  handlePrintClick,
  onOpenAIAdjust,
  onOpenAISettings,
  onOpenResumes,
  triggerClassName,
}: ActionsDropdownProps) {
  const handleImportPDFClick = () => {
    if (!getStoredAIAPIKey()) {
      onOpenAISettings();
      return;
    }
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
          onClick={() => jsonInputRef.current?.click()}
          className={ITEM_CLASSNAME}
        >
          <FileJson className="w-4 h-4 text-muted-foreground" />
          Import JSON
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleImportPDFClick}
          className={ITEM_CLASSNAME}
        >
          <Upload className="w-4 h-4 text-muted-foreground" />
          Import PDF (AI)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportData} className={ITEM_CLASSNAME}>
          <Download className="w-4 h-4 text-muted-foreground" />
          Export JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrintClick} className={ITEM_CLASSNAME}>
          <Printer className="w-4 h-4 text-muted-foreground" />
          Print / PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenAIAdjust} className={ITEM_CLASSNAME}>
          <Sparkles className="w-4 h-4 text-primary" />
          AI Adjust
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenAISettings} className={ITEM_CLASSNAME}>
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          AI Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
