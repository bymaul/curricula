'use client';

import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { CertificationsForm } from '@/components/forms/CertificationsForm';
import { EducationForm } from '@/components/forms/EducationForm';
import { ExperienceForm } from '@/components/forms/ExperienceForm';
import { PersonalForm } from '@/components/forms/PersonalForm';
import { ProjectsForm } from '@/components/forms/ProjectsForm';
import { SkillsForm } from '@/components/forms/SkillsForm';
import { HarvardTemplate } from '@/components/resume/HarvardTemplate';

import { CVData, cvSchema, initialCVState } from '@/lib/schema';
import { useCVAutoSave } from '@/hooks/useCVAutoSave';
import { useCVImportExport } from '@/hooks/useCVImportExport';
import { useCVPrint } from '@/hooks/useCVPrint';

const TABS = ['Personal', 'Experience', 'Projects', 'Education', 'Skills', 'Certifications'];

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
            <main className='min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row'>
                <aside className='w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-2 shadow-sm z-10'>
                    <div className='mb-6'>
                        <h1 className='text-xl font-black tracking-tight'>CV Builder.</h1>
                        <p className='text-xs text-green-600 font-semibold mt-1'>● Auto-saving</p>
                    </div>
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                            }`}>
                            {tab}
                        </button>
                    ))}

                    <div className='mt-4'>
                        <h3 className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-3'>
                            Data Management
                        </h3>
                        <button
                            onClick={handleExportData}
                            className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-2'>
                            ↓ Export JSON Backup
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md'>
                            ↑ Import JSON Backup
                        </button>
                        <input
                            type='file'
                            accept='.json'
                            ref={fileInputRef}
                            onChange={handleImportData}
                            className='hidden'
                        />
                    </div>
                </aside>

                <section className='flex-1 max-w-3xl p-8 overflow-y-auto h-screen custom-scrollbar'>
                    <form onSubmit={(e) => e.preventDefault()}>
                        {activeTab === 'Personal' && <PersonalForm />}
                        {activeTab === 'Experience' && <ExperienceForm />}
                        {activeTab === 'Projects' && <ProjectsForm />}
                        {activeTab === 'Education' && <EducationForm />}
                        {activeTab === 'Skills' && <SkillsForm />}
                        {activeTab === 'Certifications' && <CertificationsForm />}
                    </form>
                </section>

                <section className='hidden xl:flex w-212.5 bg-gray-200 p-8 flex-col items-center overflow-y-auto h-screen border-l border-gray-300 shadow-inner'>
                    <button
                        onClick={handlePrintClick}
                        className='mb-6 bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:bg-blue-700 transition w-full max-w-[210mm]'>
                        Print / Download PDF
                    </button>

                    <div className='w-[210mm] pb-24'>
                        <HarvardTemplate ref={printRef} cvData={cvData} />
                    </div>
                </section>
            </main>
        </FormProvider>
    );
}
