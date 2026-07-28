'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, ChevronDown, Download, Printer, Upload } from 'lucide-react';

import { CertificationsForm } from '@/components/forms/CertificationsForm';
import { EducationForm } from '@/components/forms/EducationForm';
import { ExperienceForm } from '@/components/forms/ExperienceForm';
import { PersonalForm } from '@/components/forms/PersonalForm';
import { ProjectsForm } from '@/components/forms/ProjectsForm';
import { SkillsForm } from '@/components/forms/SkillsForm';
import { HarvardTemplate } from '@/components/resume/HarvardTemplate';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCVAutoSave } from '@/hooks/useCVAutoSave';
import { useCVImportExport } from '@/hooks/useCVImportExport';
import { useCVPrint } from '@/hooks/useCVPrint';
import { SECTIONS } from '@/lib/consts';
import { CVData, cvSchema, initialCVState } from '@/lib/schema';
import { EditorSidebar } from '@/components/editor/EditorSidebar';

export default function Home() {
    const methods = useForm<CVData>({
        resolver: zodResolver(cvSchema),
        defaultValues: initialCVState,
        mode: 'onChange',
    });

    const { mounted, cvData } = useCVAutoSave(methods);
    const { fileInputRef, handleExportData, handleImportData } = useCVImportExport(cvData, methods.reset);
    const { printRef, handlePrintClick } = useCVPrint(cvData, methods);

    if (!mounted) return null;

    return (
        <FormProvider {...methods}>
            <main className='h-dvh w-full bg-background text-foreground p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden print:h-auto print:block print:p-0 print:overflow-visible print:bg-white'>
                <EditorSidebar
                    fileInputRef={fileInputRef}
                    handleExportData={handleExportData}
                    handleImportData={handleImportData}
                    handlePrintClick={handlePrintClick}
                />

                <section className='flex-1 w-full bg-muted/20 border border-border rounded-xl shadow-inner flex flex-col h-full relative overflow-hidden print:border-none print:shadow-none print:bg-transparent print:overflow-visible'>
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
            </main>
        </FormProvider>
    );
}
