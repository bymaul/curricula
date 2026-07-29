'use client';

import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { MobileViewToggle } from '@/components/editor/MobileViewToggle';
import { ResumePreview } from '@/components/editor/ResumePreview';
import { useCVAutoSave } from '@/hooks/useCVAutoSave';
import { useCVImportExport } from '@/hooks/useCVImportExport';
import { useCVPrint } from '@/hooks/useCVPrint';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { CVData, cvSchema, initialCVState } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

export default function Home() {
    const methods = useForm<CVData>({
        resolver: zodResolver(cvSchema),
        defaultValues: initialCVState,
        mode: 'onChange',
    });

    const { mounted, cvData } = useCVAutoSave(methods);
    const { fileInputRef, handleExportData, handleImportData } = useCVImportExport(cvData, methods.reset);
    const { printRef, handlePrintClick } = useCVPrint(cvData, methods);

    const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
    const isLargeScreen = useMediaQuery('(min-width: 1024px)');
    const isPreviewVisible = isLargeScreen || mobileView === 'preview';

    if (!mounted) return null;

    return (
        <FormProvider {...methods}>
            <main className='h-dvh w-full bg-background text-foreground flex flex-col lg:p-6 overflow-hidden print:h-auto print:block print:p-0 print:overflow-visible print:bg-white'>
                <MobileViewToggle value={mobileView} onChange={setMobileView} />

                <div className='flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-4 lg:gap-6 px-4 pb-4 lg:px-0 lg:pb-0 print:p-0 print:block'>
                    <EditorSidebar
                        className={cn('h-full', mobileView === 'edit' ? 'flex' : 'hidden', 'lg:flex')}
                        fileInputRef={fileInputRef}
                        handleExportData={handleExportData}
                        handleImportData={handleImportData}
                        handlePrintClick={handlePrintClick}
                    />

                    <ResumePreview
                        cvData={cvData}
                        printRef={printRef}
                        isVisible={isPreviewVisible}
                        mobileActive={mobileView === 'preview'}
                    />
                </div>
            </main>
        </FormProvider>
    );
}
