'use client';

import { useI18n } from '@/components/I18nProvider';
import { DEFAULT_SECTION_ORDER, SectionId, TabName } from '@/lib/consts';
import { getCustomSections } from '@/lib/schema';
import { navTabLabel } from '@/lib/i18n';
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
  Search,
  Undo2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CertificationsForm } from '../forms/CertificationsForm';
import { CustomSectionForm } from '../forms/CustomSectionForm';
import { DesignForm } from '../forms/DesignForm';
import { EducationForm } from '../forms/EducationForm';
import { ExperienceForm } from '../forms/ExperienceForm';
import { PersonalForm } from '../forms/PersonalForm';
import { ProjectsForm } from '../forms/ProjectsForm';
import { SkillsForm } from '../forms/SkillsForm';
import { ScrollArea } from '../ui/scroll-area';
import { TooltipIconButton } from '../ui/tooltip-icon-button';
import { ActionsDropdown } from './ActionsDropdown';
import { BackupDialog } from './BackupDialog';
import { EditorEmptyState } from './EditorEmptyState';
import { SectionsOrderDialog } from './SectionsOrderDialog';
import { ShareDialog } from './ShareDialog';
import { ShortcutsDialog } from './ShortcutsDialog';
import { VersionHistoryDialog } from './VersionHistoryDialog';

export interface EditorFileActions {
  handlePrintClick: () => void;
  onImportPDF: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface EditorSidebarProps {
  className?: string;
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  fileActions: EditorFileActions;
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

  const labelClass =
    'text-xs font-semibold uppercase tracking-wider text-muted-foreground';

  if (saveStatus === 'saving') {
    return (
      <>
        <Loader2 className="size-4 text-warning animate-spin" />
        <span className={labelClass}>{t('editor.saveStatus.saving')}</span>
      </>
    );
  }

  return (
    <>
      <CheckCircle2 className="size-4 text-success" />
      {lastSavedAt && (
        <span className={labelClass}>
          {t('editor.saveStatus.saved', {
            time: formatRelativeTime(lastSavedAt, now, t),
          })}
        </span>
      )}
    </>
  );
}

export function EditorSidebar({
  className,
  pdfInputRef,
  fileActions,
  saveStatus,
  lastSavedAt,
}: EditorSidebarProps) {
  const { activeTab, setActiveTab } = useUIStore();
  const { t } = useI18n();
  const storageError = useStorageError();
  const { dialogs, setDialog } = useDialogStore();
  const activeResume = useResumeStore((state) =>
    state.resumes.find((r) => r.id === state.activeId),
  );
  const sectionOrder = activeResume?.sectionOrder ?? DEFAULT_SECTION_ORDER;
  const customSections = useMemo(
    () => getCustomSections(activeResume?.data),
    [activeResume?.data],
  );
  const undo = useResumeStore((state) => state.undo);
  const redo = useResumeStore((state) => state.redo);
  const history = useResumeStore((state) =>
    state.activeId ? state.histories[state.activeId] : undefined,
  );
  const canUndo = (history?.cursor ?? 0) > 0;
  const canRedo = !!history && history.cursor < history.entries.length - 1;

  const navTabs: TabName[] = [
    'design',
    'personal',
    ...sectionOrder.filter((id) => id !== 'summary'),
  ] as TabName[];

  const activeCustomSection =
    customSections.find((s) => s.id === activeTab) ?? null;

  const data = activeResume?.data;
  const isEmptyResume =
    !!data &&
    !data.name &&
    !data.email &&
    !data.phone &&
    !data.summary &&
    data.experience.length === 0;

  useEffect(() => {
    if (activeTab === 'personal' || activeTab === 'design') return;
    if (customSections.some((s) => s.id === activeTab)) return;
    if (sectionOrder.includes(activeTab as SectionId)) return;
    setActiveTab('personal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, customSections.length]);

  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const viewport = navRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (viewport.scrollWidth <= viewport.clientWidth) return;
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <section
      className={cn(
        'flex w-full shrink-0 flex-col lg:w-[35%] xl:w-[30%] border border-border bg-card rounded-xl shadow-lg overflow-hidden print:hidden',
        className,
      )}
    >
      <div className="flex-1 min-h-0">
        <ScrollArea key={activeTab} className="h-full">
          {isEmptyResume && <EditorEmptyState />}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6 pt-4 pb-6"
          >
            {activeTab === 'personal' && <PersonalForm />}
            {activeTab === 'design' && <DesignForm />}
            {activeTab === 'experience' && <ExperienceForm />}
            {activeTab === 'projects' && <ProjectsForm />}
            {activeTab === 'education' && <EducationForm />}
            {activeTab === 'skills' && <SkillsForm />}
            {activeTab === 'certifications' && <CertificationsForm />}
            {activeCustomSection && (
              <CustomSectionForm section={activeCustomSection} />
            )}
          </form>
        </ScrollArea>
      </div>

      <nav
        ref={navRef}
        className="border-t border-border bg-muted/30 shrink-0 overflow-hidden flex items-stretch"
        aria-label={t('editor.cvSectionsAriaLabel')}
      >
        <ScrollArea orientation="horizontal" className="min-w-0 flex-1 h-14">
          <div className="flex items-stretch gap-1 w-max h-full px-4">
            {navTabs.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative shrink-0 flex items-center px-2.5 text-sm font-semibold transition-colors',
                    active
                      ? 'text-foreground after:absolute after:inset-x-2 after:bottom-2 after:h-0.5 after:rounded-full after:bg-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {navTabLabel(tab, customSections, t)}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <TooltipIconButton
          label={t('editor.reorderSections')}
          onClick={() => setDialog('sections', true)}
          className="h-full w-12 rounded-none border-0 border-l border-border"
        >
          <ListOrdered className="size-5" />
        </TooltipIconButton>
      </nav>

      {storageError && (
        <div
          role="alert"
          className="px-4 py-2 border-t border-border bg-warning/10 text-warning text-xs flex items-center gap-2 shrink-0"
        >
          <AlertTriangle className="size-4 shrink-0" />
          <span>{t('editor.storageFullWarning')}</span>
        </div>
      )}

      <footer className="px-4 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-2 shrink-0 z-10">
        <div className="flex items-center gap-2 min-w-0" aria-live="polite">
          <SaveStatus saveStatus={saveStatus} lastSavedAt={lastSavedAt} />
        </div>

        <div className="flex items-center gap-1">
          <TooltipIconButton
            label={t('editor.commandPalette')}
            aria-keyshortcuts="Control+k Meta+k"
            onClick={() => setDialog('palette', true)}
          >
            <Search className="size-4" />
          </TooltipIconButton>

          <TooltipIconButton
            label={t('editor.undo')}
            aria-keyshortcuts="Control+z Meta+z"
            onClick={undo}
            disabled={!canUndo}
          >
            <Undo2 className="size-4" />
          </TooltipIconButton>

          <TooltipIconButton
            label={t('editor.redo')}
            aria-keyshortcuts="Control+Shift+z Control+y Meta+Shift+z Meta+y"
            onClick={redo}
            disabled={!canRedo}
          >
            <Redo2 className="size-4" />
          </TooltipIconButton>

          <TooltipIconButton
            label={t('editor.versionHistory')}
            onClick={() => setDialog('history', true)}
          >
            <History className="size-4" />
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
      />

      <BackupDialog
        open={dialogs.backup}
        onOpenChange={(open) => setDialog('backup', open)}
      />

      <ShortcutsDialog
        open={dialogs.shortcuts}
        onOpenChange={(open) => setDialog('shortcuts', open)}
      />
    </section>
  );
}
