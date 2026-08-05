'use client';

import dynamic from 'next/dynamic';
import { BrandMark } from '@/components/BrandHeader';
import { Button } from '@/components/ui/button';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { MobileTopBar } from '@/components/editor/MobileTopBar';
import { ResumePreview } from '@/components/editor/ResumePreview';
import { useCVAutoSave } from '@/hooks/useCVAutoSave';
import { useCVImportExport } from '@/hooks/useCVImportExport';
import { useCVPrint } from '@/hooks/useCVPrint';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useShareLinkImport } from '@/hooks/useShareLinkImport';
import { CVData, cvSchema, initialCVState } from '@/lib/schema';
import { getSectionTabName, SectionId } from '@/lib/consts';
import { useDialogStore } from '@/store/useDialogStore';
import { useResumeStore } from '@/store/useResumeStore';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';
import { ChevronsUpDown, FileText } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

const AIAdjustDialog = dynamic(
  () => import('@/components/ai/AIAdjustDialog').then((m) => m.AIAdjustDialog),
  { ssr: false },
);

const AISettingsDialog = dynamic(
  () =>
    import('@/components/ai/AISettingsDialog').then((m) => m.AISettingsDialog),
  { ssr: false },
);

const ResumesDialog = dynamic(
  () =>
    import('@/components/editor/ResumesDialog').then((m) => m.ResumesDialog),
  { ssr: false },
);

export default function Home() {
  const methods = useForm<CVData>({
    resolver: zodResolver(cvSchema),
    defaultValues: initialCVState,
    mode: 'onChange',
  });

  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [pendingImport, setPendingImport] = useState<{
    data: CVData;
    warnings: string[];
  } | null>(null);

  const { dialogs, setDialog } = useDialogStore();

  const { mounted, cvData, saveStatus, lastSavedAt } = useCVAutoSave(methods);
  const { pdfInputRef, handleImportPDF } = useCVImportExport({
    onPDFImported: setPendingImport,
  });
  const { printRef, handlePrintClick } = useCVPrint(cvData, methods);
  useShareLinkImport();

  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const isPreviewVisible = isLargeScreen || mobileView === 'preview';
  const activeResume = useResumeStore((state) =>
    state.resumes.find((r) => r.id === state.activeId),
  );
  const activeResumeTitle = activeResume?.title ?? 'Untitled CV';

  const handlePreviewSectionClick = (sectionId: SectionId) => {
    useUIStore.getState().setActiveTab(getSectionTabName(sectionId));
    if (!isLargeScreen) setMobileView('edit');
  };

  if (!mounted) return null;

  return (
    <FormProvider {...methods}>
      <main className="h-dvh w-full bg-background text-foreground flex flex-col lg:p-6 overflow-hidden print:h-auto print:block print:p-0 print:overflow-visible print:bg-white">
        <MobileTopBar value={mobileView} onChange={setMobileView} />

        <header className="hidden lg:flex items-center justify-between shrink-0 mb-6 print:hidden">
          <BrandMark />

          <Button
            variant="ghost"
            type="button"
            onClick={() => setDialog('resumes', true)}
          >
            <FileText className="w-4 h-4" data-icon="inline-start" />
            <span className="truncate">{activeResumeTitle}</span>
            <ChevronsUpDown className="w-4 h-4" data-icon="inline-end" />
          </Button>
        </header>

        <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-4 lg:gap-6 px-4 pb-4 lg:px-0 lg:pb-0 print:p-0 print:block">
          <EditorSidebar
            className={cn(
              'h-full',
              mobileView === 'edit' ? 'flex' : 'hidden',
              'lg:flex',
            )}
            pdfInputRef={pdfInputRef}
            fileActions={{
              handlePrintClick,
              onImportPDF: handleImportPDF,
            }}
            cvData={cvData}
            onApplyCVData={(data) => methods.reset(data)}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
            pendingImport={pendingImport}
            onDiscardImport={() => setPendingImport(null)}
          />

          <ResumePreview
            cvData={cvData}
            printRef={printRef}
            sectionOrder={activeResume?.sectionOrder}
            hiddenSections={activeResume?.hiddenSections}
            isVisible={isPreviewVisible}
            mobileActive={mobileView === 'preview'}
            onSectionClick={handlePreviewSectionClick}
          />
        </div>
      </main>

      <AIAdjustDialog
        open={dialogs.aiAdjust}
        onOpenChange={(open) => setDialog('aiAdjust', open)}
        cvData={cvData}
        onApply={(data) => methods.reset(data)}
      />

      <AISettingsDialog
        open={dialogs.aiSettings}
        onOpenChange={(open) => setDialog('aiSettings', open)}
      />

      <ResumesDialog
        open={dialogs.resumes}
        onOpenChange={(open) => setDialog('resumes', open)}
      />
    </FormProvider>
  );
}
