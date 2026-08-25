'use client';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useI18n } from '@/components/I18nProvider';
import { UI_LANGUAGES, Language } from '@/lib/i18n/languages';
import { DESKTOP_MEDIA_QUERY } from '@/lib/consts';
import { cn } from '@/lib/utils';
import { useDialogStore } from '@/store/useDialogStore';
import { useUIStore } from '@/store/useUIStore';
import {
  DatabaseBackup,
  EllipsisVertical,
  FileText,
  Languages,
  Printer,
  Settings2,
  Share2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DROPDOWN_ITEM_CLASS,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface ActionsDropdownProps {
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  handlePrintClick: () => void;
  triggerClassName?: string;
}

export function ActionsDropdown({
  pdfInputRef,
  handlePrintClick,
  triggerClassName,
}: ActionsDropdownProps) {
  const setDialog = useDialogStore((state) => state.setDialog);
  const setUILanguage = useUIStore((state) => state.setUILanguage);
  const { lang, t } = useI18n();
  const isMobile = !useMediaQuery(DESKTOP_MEDIA_QUERY);

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
            className={cn('size-9 lg:size-8', triggerClassName)}
            aria-label={t('common.actions')}
          >
            <EllipsisVertical className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52 p-1.5">
        {isMobile && (
          <>
            <DropdownMenuItem
              onClick={() => setDialog('resumes', true)}
              className={DROPDOWN_ITEM_CLASS}
            >
              <FileText className="size-4 text-muted-foreground" />
              {t('editor.manageResumes')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={handleImportPDFClick}
          className={DROPDOWN_ITEM_CLASS}
        >
          <Upload className="size-4 text-muted-foreground" />
          {t('editor.importPdf')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDialog('aiAdjust', true)}
          className={DROPDOWN_ITEM_CLASS}
        >
          <Sparkles className="size-4 text-primary" />
          {t('editor.aiAdjust')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDialog('aiSettings', true)}
          className={DROPDOWN_ITEM_CLASS}
        >
          <Settings2 className="size-4 text-muted-foreground" />
          {t('editor.aiSettings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setDialog('share', true)}
          className={DROPDOWN_ITEM_CLASS}
        >
          <Share2 className="size-4 text-muted-foreground" />
          {t('editor.shareLink')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handlePrintClick}
          className={DROPDOWN_ITEM_CLASS}
        >
          <Printer className="size-4 text-muted-foreground" />
          {t('editor.printPdf')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setDialog('backup', true)}
          className={DROPDOWN_ITEM_CLASS}
        >
          <DatabaseBackup className="size-4 text-muted-foreground" />
          {t('editor.backupRestore')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={DROPDOWN_ITEM_CLASS}>
            <Languages className="size-4 text-muted-foreground" />
            {t('common.language')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <DropdownMenuRadioGroup
              value={lang}
              onValueChange={(value) => setUILanguage(value as Language)}
            >
              {UI_LANGUAGES.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  className={cn(DROPDOWN_ITEM_CLASS, 'pr-8')}
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
