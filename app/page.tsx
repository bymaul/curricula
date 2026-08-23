'use client';

import dynamic from 'next/dynamic';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { ResumePreview } from '@/components/editor/ResumePreview';
import { CVImportPreviewDialog } from '@/components/import/CVImportPreviewDialog';
import { useCVAutoSave } from '@/hooks/useCVAutoSave';
import { useCVImportExport } from '@/hooks/useCVImportExport';
import { useCVPrint } from '@/hooks/useCVPrint';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useShareLinkImport } from '@/hooks/useShareLinkImport';
import {
  DESKTOP_MEDIA_QUERY,
  getSectionTabName,
  SectionId,
} from '@/lib/consts';
import { useDialogStore } from '@/store/useDialogStore';
import { usePhotoStore } from '@/store/usePhotoStore';
import { useResumeStore } from '@/store/useResumeStore';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { CVData } from '@/lib/schema';
import { cvSchema, initialCVState } from '@/lib/schema';
import { Header } from '@/components/Header';

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

  // The resume store defers hydration (skipHydration) so photos can be
  // reattached from the photo store during its merge. Hydrate the photo store
  // first, then the resume store.
  const [storesHydrated, setStoresHydrated] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await usePhotoStore.persist.rehydrate();
      await useResumeStore.persist.rehydrate();
      if (!cancelled) setStoresHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { dialogs, setDialog } = useDialogStore();

  const { mounted, saveStatus, lastSavedAt, saveNow } = useCVAutoSave(methods);
  const { pdfInputRef, handleImportPDF } = useCVImportExport();
  const { printRef, handlePrintClick } = useCVPrint(methods);
  useShareLinkImport();
  const undo = useResumeStore((state) => state.undo);
  const redo = useResumeStore((state) => state.redo);
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onSave: saveNow,
    onPrint: handlePrintClick,
  });

  const isLargeScreen = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const activeResume = useResumeStore((state) =>
    state.resumes.find((r) => r.id === state.activeId),
  );

  const handleSectionClick = useCallback(
    (sectionId: SectionId) => {
      useUIStore.getState().setActiveTab(getSectionTabName(sectionId));
      if (!isLargeScreen) setMobileView('edit');
    },
    [isLargeScreen],
  );

  if (!mounted || !storesHydrated) return null;

  return (
    <FormProvider {...methods}>
      <main className="h-dvh w-full bg-background text-foreground flex flex-col lg:p-6 overflow-hidden print:h-auto print:block print:p-0 print:overflow-visible print:bg-white">
        <Header value={mobileView} onChange={setMobileView} />

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
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
          />

          <ResumePreview
            printRef={printRef}
            sectionOrder={activeResume?.sectionOrder}
            hiddenSections={activeResume?.hiddenSections}
            language={activeResume?.language}
            photo={activeResume?.photo}
            templateId={activeResume?.templateId}
            mobileActive={mobileView === 'preview'}
            onSectionClick={handleSectionClick}
          />
        </div>
      </main>

      <AIAdjustDialog
        open={dialogs.aiAdjust}
        onOpenChange={(open) => setDialog('aiAdjust', open)}
      />

      <AISettingsDialog
        open={dialogs.aiSettings}
        onOpenChange={(open) => setDialog('aiSettings', open)}
      />

      <ResumesDialog
        open={dialogs.resumes}
        onOpenChange={(open) => setDialog('resumes', open)}
      />

      <CVImportPreviewDialog />
    </FormProvider>
  );
}
