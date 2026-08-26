'use client';

import { useI18n } from '@/components/I18nProvider';
import { navTabLabel } from '@/lib/i18n';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { getCustomSections } from '@/lib/schema';
import { SAMPLE_CV_DATA } from '@/lib/sampleCv';
import { DEFAULT_SECTION_ORDER, TabName } from '@/lib/consts';
import { useDialogStore, DialogKey } from '@/store/useDialogStore';
import { useResumeStore } from '@/store/useResumeStore';
import { useUIStore } from '@/store/useUIStore';
import type { EditorFileActions } from './EditorSidebar';
import {
  ArrowLeftRight,
  DatabaseBackup,
  FilePlus2,
  FolderOpen,
  Printer,
  Settings2,
  Share2,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileActions: EditorFileActions;
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
}

export function CommandPalette({
  open,
  onOpenChange,
  fileActions,
  pdfInputRef,
}: CommandPaletteProps) {
  const { t } = useI18n();
  const setDialog = useDialogStore((state) => state.setDialog);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const activeId = useResumeStore((state) => state.activeId);
  const resumes = useResumeStore((state) => state.resumes);
  const sectionOrder =
    useResumeStore(
      (state) =>
        state.resumes.find((r) => r.id === state.activeId)?.sectionOrder,
    ) ?? DEFAULT_SECTION_ORDER;
  const customSections = getCustomSections(
    resumes.find((r) => r.id === activeId)?.data,
  );

  const close = () => onOpenChange(false);

  const run = (action: () => void) => {
    close();
    action();
  };

  const dialogAction = (key: DialogKey) => run(() => setDialog(key, true));

  const tabs: TabName[] = ['design', 'personal', ...sectionOrder];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[15%] translate-y-0 gap-0 p-0 sm:max-w-lg"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          {t('editor.commandPalette')}
        </DialogTitle>

        <Command loop>
          <CommandInput placeholder={t('palette.placeholder')} />
          <CommandList>
            <CommandEmpty>{t('palette.noResults')}</CommandEmpty>

            <CommandGroup heading={t('palette.groups.actions')}>
              <CommandItem onSelect={() => run(fileActions.handlePrintClick)}>
                <Printer />
                {t('editor.printPdf')}
              </CommandItem>
              <CommandItem onSelect={() => dialogAction('share')}>
                <Share2 />
                {t('editor.shareLink')}
              </CommandItem>
              <CommandItem
                onSelect={() => run(() => pdfInputRef.current?.click())}
              >
                <Upload />
                {t('editor.importPdf')}
              </CommandItem>
              <CommandItem onSelect={() => dialogAction('backup')}>
                <DatabaseBackup />
                {t('editor.backupRestore')}
              </CommandItem>
              <CommandItem onSelect={() => dialogAction('aiAdjust')}>
                <Sparkles />
                {t('editor.aiAdjust')}
              </CommandItem>
              <CommandItem onSelect={() => dialogAction('aiSettings')}>
                <Settings2 />
                {t('editor.aiSettings')}
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading={t('palette.groups.resumes')}>
              <CommandItem
                onSelect={() =>
                  run(() => useResumeStore.getState().createResume())
                }
              >
                <FilePlus2 />
                {t('resumes.newCv')}
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  run(() =>
                    useResumeStore
                      .getState()
                      .importResumeData(
                        SAMPLE_CV_DATA,
                        t('resumes.sampleTitle'),
                      ),
                  )
                }
              >
                <Wand2 />
                {t('resumes.newFromExample')}
              </CommandItem>
              <CommandItem onSelect={() => dialogAction('resumes')}>
                <FolderOpen />
                {t('editor.manageResumes')}
              </CommandItem>
              {resumes
                .filter((resume) => resume.id !== activeId)
                .map((resume) => (
                  <CommandItem
                    key={resume.id}
                    value={`switch ${resume.title} ${resume.id}`}
                    onSelect={() =>
                      run(() =>
                        useResumeStore.getState().setActiveResume(resume.id),
                      )
                    }
                  >
                    <ArrowLeftRight />
                    {t('palette.switchTo', { title: resume.title })}
                  </CommandItem>
                ))}
            </CommandGroup>

            <CommandGroup heading={t('palette.groups.sections')}>
              {tabs.map((tab) => (
                <CommandItem
                  key={tab}
                  value={`go to ${navTabLabel(tab, customSections, t)}`}
                  onSelect={() => run(() => setActiveTab(tab))}
                >
                  {navTabLabel(tab, customSections, t)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
