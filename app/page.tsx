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
import {
    Award,
    Briefcase,
    CheckCircle2,
    ChevronDown,
    Download,
    FolderGit2,
    GraduationCap,
    Printer,
    Upload,
    User,
    Wrench,
} from 'lucide-react';

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
import { CVData, cvSchema, initialCVState } from '@/lib/schema';

const SECTIONS = [
    { name: 'Personal', icon: User },
    { name: 'Experience', icon: Briefcase },
    { name: 'Projects', icon: FolderGit2 },
    { name: 'Education', icon: GraduationCap },
    { name: 'Skills', icon: Wrench },
    { name: 'Certifications', icon: Award },
];

export default function Home() {
    const [activeTab, setActiveTab] = useState('Personal');

    const methods = useForm<CVData>({
        resolver: zodResolver(cvSchema),
        defaultValues: initialCVState,
        mode: 'onChange',
    });

    const { mounted, cvData } = useCVAutoSave(methods);
    const { fileInputRef, handleExportData, handleImportData } = useCVImportExport(cvData, methods.reset);
    const { printRef, handlePrintClick } = useCVPrint(cvData, methods.trigger, setActiveTab);

    if (!mounted) return null;

    return (
        <FormProvider {...methods}>
            <main className='h-screen w-full bg-background text-foreground p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden'>
                <section className='w-full lg:w-[35%] xl:w-[30%] flex flex-col h-full border border-border bg-card rounded-xl shadow-lg overflow-hidden shrink-0'>
                    <header className='px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30 z-10'>
                        <h1 className='text-lg font-bold tracking-tight'>CV Builder</h1>

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        className='h-8 text-xs font-semibold gap-2 bg-background'>
                                        {activeTab}
                                        <ChevronDown className='w-3.5 h-3.5 text-muted-foreground' />
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align='end' className='w-56 p-1.5'>
                                {SECTIONS.map(({ name, icon: Icon }) => (
                                    <DropdownMenuItem
                                        key={name}
                                        onClick={() => setActiveTab(name)}
                                        className='gap-3 py-2 px-3 text-sm cursor-pointer rounded-md'>
                                        <Icon className='w-4 h-4 text-muted-foreground' />
                                        <span className={activeTab === name ? 'font-bold' : ''}>{name}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </header>

                    <div className='flex-1 min-h-0'>
                        <ScrollArea className='h-full px-6 py-6'>
                            <form onSubmit={(e) => e.preventDefault()} className='space-y-6 pb-6'>
                                {activeTab === 'Personal' && <PersonalForm />}
                                {activeTab === 'Experience' && <ExperienceForm />}
                                {activeTab === 'Projects' && <ProjectsForm />}
                                {activeTab === 'Education' && <EducationForm />}
                                {activeTab === 'Skills' && <SkillsForm />}
                                {activeTab === 'Certifications' && <CertificationsForm />}
                            </form>
                        </ScrollArea>
                    </div>

                    <footer className='px-5 py-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0 z-10'>
                        <div className='flex items-center gap-2'>
                            <CheckCircle2 className='w-4 h-4 text-green-500' />
                            <span className='text-[10px] text-muted-foreground font-medium uppercase tracking-wider'>
                                Saved
                            </span>
                        </div>

                        <div className='flex items-center gap-2'>
                            <input
                                type='file'
                                accept='.json'
                                ref={fileInputRef}
                                onChange={handleImportData}
                                className='hidden'
                            />

                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            className='h-8 w-8'
                                            onClick={() => fileInputRef.current?.click()}>
                                            <Upload className='w-4 h-4' />
                                        </Button>
                                    }
                                />
                                <TooltipContent>
                                    <p>Import JSON</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            className='h-8 w-8 mr-1'
                                            onClick={handleExportData}
                                            title=''>
                                            <Download className='w-4 h-4' />
                                        </Button>
                                    }
                                />
                                <TooltipContent>
                                    <p>Export JSON</p>
                                </TooltipContent>
                            </Tooltip>

                            <Button
                                onClick={handlePrintClick}
                                className='h-8 text-xs font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90'>
                                <Printer className='w-3.5 h-3.5' />
                                Print / PDF
                            </Button>
                        </div>
                    </footer>
                </section>

                <section className='flex-1 w-full bg-muted/20 border border-border rounded-xl shadow-inner flex flex-col h-full relative overflow-hidden'>
                    <div className='flex-1 min-h-0'>
                        <ScrollArea className='h-full w-full'>
                            <div className='flex items-center justify-center min-h-full p-8 py-16'>
                                <div className='bg-white text-black shadow-2xl w-[210mm] transition-all overflow-hidden'>
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
