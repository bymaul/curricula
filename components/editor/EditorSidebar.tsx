'use client';

import { useI18n } from '@/components/I18nProvider';
import { DEFAULT_SECTION_ORDER, TabName } from '@/lib/consts';
import { TAB_KEYS } from '@/lib/i18n';
import { CVData } from '@/lib/schema';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useDialogStore } from '@/store/useDialogStore';
import { useResumeStore } from '@/store/useResumeStore';
import { useUIStore } from '@/store/useUIStore';
import { useStorageError } from '@/hooks/useStorageError';
import {
  AlertTriangle,
  CheckCircle2,
  History,
  ListOrdered,
  Loader2,
  Redo2,
  Undo2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { CertificationsForm } from '../forms/CertificationsForm';
import { EducationForm } from '../forms/EducationForm';
import { ExperienceForm } from '../forms/ExperienceForm';
import { PersonalForm } from '../forms/PersonalForm';
import { ProjectsForm } from '../forms/ProjectsForm';
import { SkillsForm } from '../forms/SkillsForm';
import { ScrollArea } from '../ui/scroll-area';
import { TooltipIconButton } from '../ui/tooltip-icon-button';
import { ActionsDropdown } from './ActionsDropdown';
import { BackupDialog } from './BackupDialog';
import { SectionsOrderDialog } from './SectionsOrderDialog';
import { ShareDialog } from './ShareDialog';
import { VersionHistoryDialog } from './VersionHistoryDialog';

export interface EditorFileActions {
  handlePrintClick: () => void;
  onImportPDF: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface EditorSidebarProps {
  className?: string;
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  fileActions: EditorFileActions;
  cvData: CVData;
  onApplyCVData: (data: CVData) => void;
  saveStatus: 'saving' | 'saved';
  lastSavedAt: number | null;
}

function SaveStatus({
  saveStatus,
  lastSavedAt,
}: {
  saveStatus: 'saving' | 'saved';
  lastSavedAt: number | null;
}) {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (saveStatus !== 'saved') return;
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, [saveStatus]);

  if (saveStatus === 'saving') {
    return (
      <>
        <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          {t('editor.saveStatus.saving')}
        </span>
      </>
    );
  }

  return (
    <>
      <CheckCircle2 className="w-4 h-4 text-green-500" />
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
        {lastSavedAt
          ? t('editor.saveStatus.saved', {
              time: formatRelativeTime(lastSavedAt, now, t),
            })
          : ''}
      </span>
    </>
  );
}

export function EditorSidebar({
  className,
  pdfInputRef,
  fileActions,
  cvData,
  onApplyCVData,
  saveStatus,
  lastSavedAt,
}: EditorSidebarProps) {
  const { activeTab, setActiveTab } = useUIStore();
  const { t } = useI18n();
  const storageError = useStorageError();
  const { dialogs, setDialog } = useDialogStore();
  const sectionOrder =
    useResumeStore(
      (state) =>
        state.resumes.find((r) => r.id === state.activeId)?.sectionOrder,
    ) ?? DEFAULT_SECTION_ORDER;
  const undo = useResumeStore((state) => state.undo);
  const redo = useResumeStore((state) => state.redo);
  const history = useResumeStore((state) =>
    state.activeId ? state.histories[state.activeId] : undefined,
  );
  const canUndo = (history?.cursor ?? 0) > 0;
  const canRedo = !!history && history.cursor < history.entries.length - 1;

  const navTabs: TabName[] = [
    'personal',
    ...sectionOrder.filter((id) => id !== 'summary'),
  ] as TabName[];

  return (
    <section
      className={cn(
        'w-full lg:w-[35%] xl:w-[30%] flex-col border border-border bg-card rounded-xl shadow-lg overflow-hidden shrink-0 print:hidden',
        className,
      )}
    >
      <div className="flex-1 min-h-0">
        <ScrollArea key={activeTab} className="h-full px-2">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6 pt-4 pb-6"
          >
            {activeTab === 'personal' && <PersonalForm />}
            {activeTab === 'experience' && <ExperienceForm />}
            {activeTab === 'projects' && <ProjectsForm />}
            {activeTab === 'education' && <EducationForm />}
            {activeTab === 'skills' && <SkillsForm />}
            {activeTab === 'certifications' && <CertificationsForm />}
          </form>
        </ScrollArea>
      </div>

      <nav
        className="border-t border-border bg-muted/30 shrink-0 overflow-hidden flex items-stretch"
        aria-label={t('editor.cvSectionsAriaLabel')}
      >
        <ScrollArea orientation="horizontal" className="min-w-0 flex-1 h-14">
          <div className="flex items-center gap-1 w-max h-full px-3">
            {navTabs.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'shrink-0 h-9 px-2.5 rounded-md text-sm font-semibold transition-colors',
                    active
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(TAB_KEYS[tab])}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <TooltipIconButton
          label={t('editor.reorderSections')}
          onClick={() => setDialog('sections', true)}
          className="h-full w-12 rounded-none border-l border-border"
        >
          <ListOrdered className="w-5 h-5" />
        </TooltipIconButton>
      </nav>

      {storageError && (
        <div
          role="alert"
          className="px-5 py-2 border-t border-border bg-amber-500/10 text-amber-700 text-xs flex items-center gap-2 shrink-0"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{t('editor.storageFullWarning')}</span>
        </div>
      )}

      <footer className="px-5 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-2 shrink-0 z-10">
        <div className="flex items-center gap-2 min-w-0" aria-live="polite">
          <SaveStatus saveStatus={saveStatus} lastSavedAt={lastSavedAt} />
        </div>

        <div className="flex items-center gap-1">
          <TooltipIconButton
            label={t('editor.undo')}
            aria-keyshortcuts="Control+z Meta+z"
            onClick={undo}
            disabled={!canUndo}
          >
            <Undo2 className="w-4 h-4" />
          </TooltipIconButton>

          <TooltipIconButton
            label={t('editor.redo')}
            aria-keyshortcuts="Control+Shift+z Control+y Meta+Shift+z Meta+y"
            onClick={redo}
            disabled={!canRedo}
          >
            <Redo2 className="w-4 h-4" />
          </TooltipIconButton>

          <TooltipIconButton
            label={t('editor.versionHistory')}
            onClick={() => setDialog('history', true)}
          >
            <History className="w-4 h-4" />
          </TooltipIconButton>

          <input
            type="file"
            accept=".pdf,application/pdf"
            ref={pdfInputRef}
            onChange={fileActions.onImportPDF}
            aria-label={t('editor.importPdfAriaLabel')}
            className="hidden"
          />

          <ActionsDropdown
            pdfInputRef={pdfInputRef}
            handlePrintClick={fileActions.handlePrintClick}
          />
        </div>
      </footer>

      <SectionsOrderDialog
        open={dialogs.sections}
        onOpenChange={(open) => setDialog('sections', open)}
      />

      <VersionHistoryDialog
        open={dialogs.history}
        onOpenChange={(open) => setDialog('history', open)}
      />

      <ShareDialog
        open={dialogs.share}
        onOpenChange={(open) => setDialog('share', open)}
        cvData={cvData}
      />

      <BackupDialog
        open={dialogs.backup}
        onOpenChange={(open) => setDialog('backup', open)}
        cvData={cvData}
        onApplyCVData={onApplyCVData}
      />
    </section>
  );
}
