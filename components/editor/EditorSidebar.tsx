'use client';

import { DEFAULT_SECTION_ORDER, RENDERABLE_SECTIONS } from '@/lib/consts';
import { CVData } from '@/lib/schema';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useResumeStore } from '@/store/useResumeStore';
import { useUIStore } from '@/store/useUIStore';
import { CheckCircle2, ListOrdered, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CVImportPreviewDialog } from '../import/CVImportPreviewDialog';
import { CertificationsForm } from '../forms/CertificationsForm';
import { EducationForm } from '../forms/EducationForm';
import { ExperienceForm } from '../forms/ExperienceForm';
import { PersonalForm } from '../forms/PersonalForm';
import { ProjectsForm } from '../forms/ProjectsForm';
import { SkillsForm } from '../forms/SkillsForm';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { ActionsDropdown } from './ActionsDropdown';
import { SectionsOrderDialog } from './SectionsOrderDialog';

export interface EditorFileActions {
  handleExportData: () => void;
  handlePrintClick: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportPDF: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface EditorSidebarProps {
  className?: string;
  jsonInputRef: React.RefObject<HTMLInputElement | null>;
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  fileActions: EditorFileActions;
  onApplyCVData: (data: CVData) => void;
  saveStatus: 'saving' | 'saved';
  lastSavedAt: number | null;
  pendingImport: { data: CVData; warnings: string[] } | null;
  onDiscardImport: () => void;
  onOpenAIAdjust: () => void;
  onAISettingsOpenChange: (open: boolean) => void;
  onOpenResumes?: () => void;
}

function SaveStatus({
  saveStatus,
  lastSavedAt,
}: {
  saveStatus: 'saving' | 'saved';
  lastSavedAt: number | null;
}) {
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
          Saving…
        </span>
      </>
    );
  }

  return (
    <>
      <CheckCircle2 className="w-4 h-4 text-green-500" />
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
        Saved {lastSavedAt ? formatRelativeTime(lastSavedAt, now) : ''}
      </span>
    </>
  );
}

export function EditorSidebar({
  className,
  jsonInputRef,
  pdfInputRef,
  fileActions,
  onApplyCVData,
  saveStatus,
  lastSavedAt,
  pendingImport,
  onDiscardImport,
  onOpenAIAdjust,
  onAISettingsOpenChange,
  onOpenResumes,
}: EditorSidebarProps) {
  const { activeTab, setActiveTab } = useUIStore();
  const sectionOrder =
    useResumeStore(
      (state) =>
        state.resumes.find((r) => r.id === state.activeId)?.sectionOrder,
    ) ?? DEFAULT_SECTION_ORDER;
  const [isSectionsDialogOpen, setIsSectionsDialogOpen] = useState(false);

  const navTabs = [
    { key: 'Personal', name: 'Personal' },
    ...sectionOrder
      .filter((id) => id !== 'summary')
      .map((id) => ({
        key: id,
        name:
          RENDERABLE_SECTIONS.find((section) => section.id === id)?.title ?? id,
      })),
  ];

  return (
    <section
      className={cn(
        'w-full lg:w-[35%] xl:w-[30%] flex-col border border-border bg-card rounded-xl shadow-lg overflow-hidden shrink-0 print:hidden',
        className,
      )}
    >
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full px-2">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6 pt-4 pb-6"
          >
            {activeTab === 'Personal' && <PersonalForm />}
            {activeTab === 'Experience' && <ExperienceForm />}
            {activeTab === 'Projects' && <ProjectsForm />}
            {activeTab === 'Education' && <EducationForm />}
            {activeTab === 'Skills' && <SkillsForm />}
            {activeTab === 'Certifications' && <CertificationsForm />}
          </form>
        </ScrollArea>
      </div>

      <nav
        className="border-t border-border bg-muted/30 shrink-0 overflow-hidden flex items-stretch"
        aria-label="CV sections"
      >
        <ScrollArea orientation="horizontal" className="min-w-0 flex-1 h-14">
          <div className="flex items-center gap-1 w-max h-full px-3">
            {navTabs.map(({ key, name }) => {
              const active = activeTab === name;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(name)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'shrink-0 h-9 px-2.5 rounded-md text-sm font-semibold transition-colors',
                    active
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => setIsSectionsDialogOpen(true)}
                aria-label="Reorder sections"
                className="shrink-0 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l border-border transition-colors"
              >
                <ListOrdered className="w-5 h-5" />
              </button>
            }
          />
          <TooltipContent side="top">Reorder sections</TooltipContent>
        </Tooltip>
      </nav>

      <footer className="px-5 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-2 shrink-0 z-10">
        <div className="flex items-center gap-2 min-w-0" aria-live="polite">
          <SaveStatus saveStatus={saveStatus} lastSavedAt={lastSavedAt} />
        </div>

        <div className="flex items-center gap-1">
          <input
            type="file"
            accept=".json,application/json"
            ref={jsonInputRef}
            onChange={fileActions.onImportJSON}
            aria-label="Import CV data (JSON file)"
            className="hidden"
          />
          <input
            type="file"
            accept=".pdf,application/pdf"
            ref={pdfInputRef}
            onChange={fileActions.onImportPDF}
            aria-label="Import CV data (PDF file)"
            className="hidden"
          />

          <ActionsDropdown
            jsonInputRef={jsonInputRef}
            pdfInputRef={pdfInputRef}
            handleExportData={fileActions.handleExportData}
            handlePrintClick={fileActions.handlePrintClick}
            onOpenAIAdjust={onOpenAIAdjust}
            onOpenAISettings={() => onAISettingsOpenChange(true)}
            onOpenResumes={onOpenResumes}
          />
        </div>
      </footer>

      <CVImportPreviewDialog
        cvData={pendingImport?.data ?? null}
        warnings={pendingImport?.warnings}
        onApply={() => {
          if (pendingImport) {
            onApplyCVData(pendingImport.data);
            onDiscardImport();
          }
        }}
        onDiscard={onDiscardImport}
      />

      <SectionsOrderDialog
        open={isSectionsDialogOpen}
        onOpenChange={setIsSectionsDialogOpen}
      />
    </section>
  );
}
