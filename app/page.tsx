'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { HarvardTemplate } from '@/components/resume/HarvardTemplate';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCVAutoSave } from '@/hooks/useCVAutoSave';
import { useCVImportExport } from '@/hooks/useCVImportExport';
import { useCVPrint } from '@/hooks/useCVPrint';
import { CVData, cvSchema, initialCVState } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Pencil, Eye } from 'lucide-react';

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

    if (!mounted) return null;

    return (
        <FormProvider {...methods}>
            <main className='h-dvh w-full bg-background text-foreground flex flex-col lg:p-6 overflow-hidden print:h-auto print:block print:p-0 print:overflow-visible print:bg-white'>
                <div className='lg:hidden shrink-0 px-4 pt-4 pb-2 print:hidden'>
                    <div className='grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg'>
                        {(['edit', 'preview'] as const).map((view) => (
                            <button
                                key={view}
                                type='button'
                                onClick={() => setMobileView(view)}
                                className={cn(
                                    'flex items-center justify-center gap-1.5 h-10 rounded-md text-sm font-semibold transition-colors',
                                    mobileView === view
                                        ? 'bg-foreground text-primary-foreground shadow-sm '
                                        : 'text-muted-foreground',
                                )}>
                                {view === 'edit' ? <Pencil className='w-3.5 h-3.5' /> : <Eye className='w-3.5 h-3.5' />}
                                {view === 'edit' ? 'Edit' : 'Preview'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className='flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-4 lg:gap-6 px-4 pb-4 lg:px-0 lg:pb-0 print:p-0 print:block'>
                    <EditorSidebar
                        className={cn('h-full', mobileView === 'edit' ? 'flex' : 'hidden', 'lg:flex')}
                        fileInputRef={fileInputRef}
                        handleExportData={handleExportData}
                        handleImportData={handleImportData}
                        handlePrintClick={handlePrintClick}
                    />

                    <section
                        className={cn(
                            'flex-1 w-full bg-muted/20 border border-border rounded-xl shadow-inner flex-col h-full relative overflow-hidden print:border-none print:shadow-none print:bg-transparent print:overflow-visible',
                            mobileView === 'preview' ? 'flex' : 'hidden',
                            'lg:flex',
                        )}>
                        <div className='flex-1 min-h-0 print:overflow-visible'>
                            <ScrollArea className='h-full w-full print:h-auto print:overflow-visible'>
                                <div className='flex items-center justify-center min-h-full p-8 py-16 print:p-0 print:py-0 print:block'>
                                    <div className='bg-white text-black shadow-2xl w-[210mm] transition-all overflow-hidden print:shadow-none print:w-full'>
                                        <HarvardTemplate ref={printRef} cvData={cvData} />
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </section>
                </div>
            </main>
        </FormProvider>
    );
}
