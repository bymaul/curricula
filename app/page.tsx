'use client';

import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { HarvardTemplate } from '@/components/resume/HarvardTemplate';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCVAutoSave } from '@/hooks/useCVAutoSave';
import { useCVImportExport } from '@/hooks/useCVImportExport';
import { useCVPdf } from '@/hooks/useCVPdf';
import { CVData, cvSchema, initialCVState } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';

export default function Home() {
    const methods = useForm<CVData>({
        resolver: zodResolver(cvSchema),
        defaultValues: initialCVState,
        mode: 'onChange',
    });

    const { mounted, cvData } = useCVAutoSave(methods);
    const { fileInputRef, handleExportData, handleImportData } = useCVImportExport(cvData, methods.reset);
    const { handleDownloadPdf } = useCVPdf(cvData, methods);

    if (!mounted) return null;

    return (
        <FormProvider {...methods}>
            <main className='h-dvh w-full bg-background text-foreground p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden print:h-auto print:block print:p-0 print:overflow-visible print:bg-white'>
                <EditorSidebar
                    fileInputRef={fileInputRef}
                    handleExportData={handleExportData}
                    handleImportData={handleImportData}
                    handleDownloadPdf={handleDownloadPdf}
                />

                <section className='flex-1 w-full bg-muted/20 border border-border rounded-xl shadow-inner flex flex-col h-full relative overflow-hidden'>
                    <div className='flex-1 min-h-0'>
                        <ScrollArea className='h-full w-full'>
                            <div className='flex items-center justify-center min-h-full p-8 py-16'>
                                <div className='bg-white text-black shadow-2xl w-[210mm] min-h-[297mm] transition-all overflow-hidden'>
                                    <HarvardTemplate cvData={cvData} />
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                </section>
            </main>
        </FormProvider>
    );
}
