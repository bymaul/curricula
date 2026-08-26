'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { CommandPalette } from '@/components/editor/CommandPalette';
import { EditorSkeleton } from '@/components/editor/EditorSkeleton';
import { ResumePreview } from '@/components/editor/ResumePreview';
import { CVImportPreviewDialog } from '@/components/import/CVImportPreviewDialog';
import { useCVAutoSave } from '@/hooks/useCVAutoSave';
import { useCVImportExport } from '@/hooks/useCVImportExport';
import { useCVPrint } from '@/hooks/useCVPrint';
import { useHorizontalSwipe } from '@/hooks/useHorizontalSwipe';
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

function DialogLoader() {
  return (
    <div
      role="status"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60"
    >
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

const AIAdjustDialog = dynamic(
  () => import('@/components/ai/AIAdjustDialog').then((m) => m.AIAdjustDialog),
  { ssr: false, loading: DialogLoader },
);

const AISettingsDialog = dynamic(
  () =>
    import('@/components/ai/AISettingsDialog').then((m) => m.AISettingsDialog),
  { ssr: false, loading: DialogLoader },
);

const ResumesDialog = dynamic(
  () =>
    import('@/components/editor/ResumesDialog').then((m) => m.ResumesDialog),
  { ssr: false, loading: DialogLoader },
);

export default function Home() {
  const methods = useForm<CVData>({
    resolver: zodResolver(cvSchema),
    defaultValues: initialCVState,
    mode: 'onChange',
  });

  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [paneDirection, setPaneDirection] = useState<'forward' | 'back'>(
    'forward',
  );

  const switchMobileView = useCallback((next: 'edit' | 'preview') => {
    setPaneDirection(next === 'preview' ? 'forward' : 'back');
    setMobileView((current) => (current === next ? current : next));
  }, []);

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

  const { dialogs, everOpened, setDialog } = useDialogStore();

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
    onShowShortcuts: () => setDialog('shortcuts', true),
    onTogglePalette: () => {
      const open = useDialogStore.getState().dialogs.palette;
      setDialog('palette', !open);
    },
  });

  const isLargeScreen = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const activeResume = useResumeStore((state) =>
    state.resumes.find((r) => r.id === state.activeId),
  );

  const handleSectionClick = useCallback(
    (sectionId: SectionId) => {
      useUIStore.getState().setActiveTab(getSectionTabName(sectionId));
      if (!isLargeScreen) switchMobileView('edit');
    },
    [isLargeScreen, switchMobileView],
  );

  const swipeHandlers = useHorizontalSwipe((direction) => {
    if (direction === 'left') {
      switchMobileView('preview');
    } else {
      switchMobileView('edit');
    }
  });

  // Mobile-only, direction-aware transition when a pane becomes visible.
  // The animation class is absent while the pane is hidden, so re-adding it
  // on every switch replays the entrance.
  const paneMotion = isLargeScreen
    ? ''
    : paneDirection === 'back'
      ? 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-6 motion-safe:duration-200 motion-safe:ease-out'
      : 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-6 motion-safe:duration-200 motion-safe:ease-out';

  if (!mounted || !storesHydrated) return <EditorSkeleton />;

  return (
    <FormProvider {...methods}>
      <main
        {...swipeHandlers}
        className="h-dvh w-full bg-background text-foreground flex flex-col lg:p-6 overflow-hidden print:h-auto print:block print:p-0 print:overflow-visible print:bg-white"
      >
        <Header value={mobileView} onChange={switchMobileView} />

        <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-4 lg:gap-6 px-4 pb-4 lg:px-0 lg:pb-0 print:p-0 print:block">
          <EditorSidebar
            className={cn(
              'h-full',
              mobileView === 'edit' ? 'flex' : 'hidden',
              'lg:flex',
              paneMotion,
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
            design={activeResume?.design}
            templateId={activeResume?.templateId}
            mobileActive={mobileView === 'preview'}
            className={paneMotion}
            onSectionClick={handleSectionClick}
          />
        </div>
      </main>

      {everOpened.aiAdjust && (
        <AIAdjustDialog
          open={dialogs.aiAdjust}
          onOpenChange={(open) => setDialog('aiAdjust', open)}
        />
      )}

      {everOpened.aiSettings && (
        <AISettingsDialog
          open={dialogs.aiSettings}
          onOpenChange={(open) => setDialog('aiSettings', open)}
        />
      )}

      {everOpened.resumes && (
        <ResumesDialog
          open={dialogs.resumes}
          onOpenChange={(open) => setDialog('resumes', open)}
        />
      )}

      <CommandPalette
        open={dialogs.palette}
        onOpenChange={(open) => setDialog('palette', open)}
        fileActions={{ handlePrintClick, onImportPDF: handleImportPDF }}
        pdfInputRef={pdfInputRef}
      />

      <CVImportPreviewDialog />
    </FormProvider>
  );
}
