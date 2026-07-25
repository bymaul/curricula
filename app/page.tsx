'use client';

import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { HarvardTemplate } from '../components/resume/HarvardTemplate';
import { ExperienceForm } from '../components/forms/ExperienceForm'; // Import your new component
import { CVData, initialCVState } from '../lib/types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { PersonalForm } from '@/components/forms/PersonalForm';
import { ProjectsForm } from '@/components/forms/ProjectsForm';
import { EducationForm } from '@/components/forms/EducationForm';
import { SkillsForm } from '@/components/forms/SkillsForm';
import { CertificationsForm } from '@/components/forms/CertificationsForm';

const TABS = ['Personal', 'Experience', 'Projects', 'Education', 'Skills', 'Certifications'];

export default function Home() {
    // --- Auto-Save with LocalStorage ---
    const [cvData, setCvData] = useLocalStorage<CVData>('cv-builder-data', initialCVState);
    const [activeTab, setActiveTab] = useState('Personal');

    // To avoid hydration mismatch errors with localStorage, only render after mount
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `${cvData.name || 'My'}_Harvard_CV`,
    });

    // --- Generic Array Handlers (Passed down to components) ---
    const addArrayItem = (key: keyof CVData, emptyItem: any) => {
        setCvData({ ...cvData, [key]: [...(cvData[key] as any[]), emptyItem] });
    };
    const updateArrayItem = (key: keyof CVData, index: number, field: string, value: string) => {
        const newArr = [...(cvData[key] as any[])];
        newArr[index][field] = value;
        setCvData({ ...cvData, [key]: newArr });
    };
    const removeArrayItem = (key: keyof CVData, index: number) => {
        setCvData({ ...cvData, [key]: (cvData[key] as any[]).filter((_, i) => i !== index) });
    };

    if (!mounted) return null; // Prevent hydration errors

    return (
        <main className='min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row'>
            {/* SIDEBAR TABS */}
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
            </aside>

            {/* CENTER EDITOR */}
            <section className='flex-1 max-w-3xl p-8 overflow-y-auto h-screen custom-scrollbar'>
                {/* We use basic HTML5 form validation. The form won't submit, but it shows red outlines on empty required fields */}
                <form onSubmit={(e) => e.preventDefault()}>
                    {activeTab === 'Personal' && (
                        <PersonalForm
                            cvData={cvData}
                            setCvData={setCvData}
                            updateArrayItem={updateArrayItem}
                            addArrayItem={addArrayItem}
                            removeArrayItem={removeArrayItem}
                        />
                    )}
                    {activeTab === 'Experience' && (
                        <ExperienceForm
                            cvData={cvData}
                            setCvData={setCvData}
                            addArrayItem={addArrayItem}
                            updateArrayItem={updateArrayItem}
                            removeArrayItem={removeArrayItem}
                        />
                    )}
                    {activeTab === 'Projects' && (
                        <ProjectsForm
                            cvData={cvData}
                            setCvData={setCvData}
                            addArrayItem={addArrayItem}
                            updateArrayItem={updateArrayItem}
                            removeArrayItem={removeArrayItem}
                        />
                    )}
                    {activeTab === 'Education' && (
                        <EducationForm
                            cvData={cvData}
                            setCvData={setCvData}
                            addArrayItem={addArrayItem}
                            updateArrayItem={updateArrayItem}
                            removeArrayItem={removeArrayItem}
                        />
                    )}
                    {activeTab === 'Skills' && (
                        <SkillsForm
                            cvData={cvData}
                            setCvData={setCvData}
                            addArrayItem={addArrayItem}
                            updateArrayItem={updateArrayItem}
                            removeArrayItem={removeArrayItem}
                        />
                    )}
                    {activeTab === 'Certifications' && (
                        <CertificationsForm
                            cvData={cvData}
                            setCvData={setCvData}
                            addArrayItem={addArrayItem}
                            updateArrayItem={updateArrayItem}
                            removeArrayItem={removeArrayItem}
                        />
                    )}
                </form>
            </section>

            {/* RIGHT PREVIEW (PAPER ACCURATE) */}
            <section className='hidden xl:flex w-[850px] bg-gray-200 p-8 flex-col items-center overflow-y-auto h-screen border-l border-gray-300 shadow-inner'>
                <button
                    onClick={handlePrint}
                    className='mb-6 bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:bg-blue-700 transition w-full max-w-[210mm]'>
                    Print / Download PDF
                </button>

                {/* Wrapper to simulate the paper roll */}
                <div className='w-[210mm] pb-24'>
                    <HarvardTemplate ref={printRef} cvData={cvData} />
                </div>
            </section>
        </main>
    );
}
