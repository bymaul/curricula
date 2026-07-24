'use client';

import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { HarvardTemplate } from '@/components/resume/HarvardTemplate';
import { CVData, initialCVState } from '@/lib/types';
import { extractTextFromPDF } from '@/lib/parsePdf';

export default function Home() {
  const [cvData, setCvData] = useState<CVData>(initialCVState);
  const [rawPdfText, setRawPdfText] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${cvData.name || 'My'}_Harvard_CV`,
  });

  const handleLocalPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    try {
      const text = await extractTextFromPDF(file);
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      const guessedName = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)[0] || '';

      setCvData(prev => ({
        ...prev,
        name: guessedName,
        email: emailMatch ? emailMatch[0] : prev.email,
        phone: phoneMatch ? phoneMatch[0] : prev.phone,
      }));
      setRawPdfText(text);
    } catch (error) {
      console.error(error);
      alert('Could not read PDF text.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCvData({ ...cvData, [e.target.name]: e.target.value });
  };

  // Generic Array Updaters
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

  // Nested Achievement Updaters
  const addAchievement = (category: 'experience' | 'projects', index: number) => {
    const newArr = [...cvData[category]];
    newArr[index].achievements.push('');
    setCvData({ ...cvData, [category]: newArr });
  };
  const updateAchievement = (category: 'experience' | 'projects', itemIdx: number, achIdx: number, value: string) => {
    const newArr = [...cvData[category]];
    newArr[itemIdx].achievements[achIdx] = value;
    setCvData({ ...cvData, [category]: newArr });
  };
  const removeAchievement = (category: 'experience' | 'projects', itemIdx: number, achIdx: number) => {
    const newArr = [...cvData[category]];
    newArr[itemIdx].achievements = newArr[itemIdx].achievements.filter((_, i) => i !== achIdx);
    setCvData({ ...cvData, [category]: newArr });
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 lg:p-8 text-gray-900">
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Editor */}
        <div className="space-y-6 overflow-y-auto max-h-[90vh] pr-2 pb-12">
          
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-bold mb-2">📄 Scratchpad Upload</h2>
            <input type="file" accept="application/pdf" onChange={handleLocalPdfUpload} className="text-sm w-full" />
            {rawPdfText && <textarea readOnly className="w-full mt-2 p-2 text-xs font-mono border rounded bg-gray-50 h-32" value={rawPdfText} />}
          </div>

          {/* 1. PERSONAL DETAILS & SUMMARY */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Personal Details</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input name="name" placeholder="Full Name" value={cvData.name} onChange={handleTextChange} className="border p-2 rounded" />
              <input name="jobTitle" placeholder="Target Job Title" value={cvData.jobTitle} onChange={handleTextChange} className="border p-2 rounded" />
              <input name="email" placeholder="Email" value={cvData.email} onChange={handleTextChange} className="border p-2 rounded" />
              <input name="phone" placeholder="Phone" value={cvData.phone} onChange={handleTextChange} className="border p-2 rounded" />
            </div>

            <h3 className="font-bold mb-2 text-sm">Custom Links</h3>
            {cvData.links.map((link, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input placeholder="Label (e.g., GitHub)" value={link.label} onChange={(e) => updateArrayItem('links', i, 'label', e.target.value)} className="border p-2 rounded w-1/3" />
                <input placeholder="URL" value={link.url} onChange={(e) => updateArrayItem('links', i, 'url', e.target.value)} className="border p-2 rounded flex-1" />
                <button onClick={() => removeArrayItem('links', i)} className="bg-red-100 text-red-600 px-3 rounded">✕</button>
              </div>
            ))}
            <button onClick={() => addArrayItem('links', { label: '', url: '' })} className="text-sm text-blue-600 font-bold mb-4">+ Add Link</button>

            <h3 className="font-bold mb-2 text-sm">Summary</h3>
            <textarea name="summary" placeholder="Professional Summary..." value={cvData.summary} onChange={handleTextChange} className="border p-2 rounded w-full h-24" />
          </div>

          {/* 2. EXPERIENCE */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Experience</h2>
            {cvData.experience.map((exp, i) => (
              <div key={i} className="mb-6 p-4 border rounded bg-gray-50 relative">
                <button onClick={() => removeArrayItem('experience', i)} className="absolute top-2 right-2 text-red-500 text-sm">Remove</button>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input placeholder="Job Title" value={exp.role} onChange={(e) => updateArrayItem('experience', i, 'role', e.target.value)} className="border p-2 rounded" />
                  <input placeholder="Company" value={exp.company} onChange={(e) => updateArrayItem('experience', i, 'company', e.target.value)} className="border p-2 rounded" />
                  <input placeholder="Dates" value={exp.date} onChange={(e) => updateArrayItem('experience', i, 'date', e.target.value)} className="border p-2 rounded col-span-2" />
                </div>
                {exp.achievements.map((ach, achIdx) => (
                  <div key={achIdx} className="flex gap-2 mb-2">
                    <textarea value={ach} onChange={(e) => updateAchievement('experience', i, achIdx, e.target.value)} className="border p-2 rounded flex-1 text-sm h-10" />
                    <button onClick={() => removeAchievement('experience', i, achIdx)} className="text-red-500 px-2">✕</button>
                  </div>
                ))}
                <button onClick={() => addAchievement('experience', i)} className="text-xs font-bold">+ Add Bullet</button>
              </div>
            ))}
            <button onClick={() => addArrayItem('experience', { role: '', company: '', date: '', achievements: [''] })} className="w-full bg-black text-white p-2 rounded">Add Experience</button>
          </div>

          {/* 3. PROJECTS */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Projects</h2>
            {cvData.projects.map((proj, i) => (
              <div key={i} className="mb-6 p-4 border rounded bg-gray-50 relative">
                <button onClick={() => removeArrayItem('projects', i)} className="absolute top-2 right-2 text-red-500 text-sm">Remove</button>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input placeholder="Project Name" value={proj.name} onChange={(e) => updateArrayItem('projects', i, 'name', e.target.value)} className="border p-2 rounded" />
                  <input placeholder="Dates" value={proj.date} onChange={(e) => updateArrayItem('projects', i, 'date', e.target.value)} className="border p-2 rounded" />
                </div>
                {proj.achievements.map((ach, achIdx) => (
                  <div key={achIdx} className="flex gap-2 mb-2">
                    <textarea value={ach} onChange={(e) => updateAchievement('projects', i, achIdx, e.target.value)} className="border p-2 rounded flex-1 text-sm h-10" />
                    <button onClick={() => removeAchievement('projects', i, achIdx)} className="text-red-500 px-2">✕</button>
                  </div>
                ))}
                <button onClick={() => addAchievement('projects', i)} className="text-xs font-bold">+ Add Bullet</button>
              </div>
            ))}
            <button onClick={() => addArrayItem('projects', { name: '', date: '', achievements: [''] })} className="w-full bg-black text-white p-2 rounded">Add Project</button>
          </div>

          {/* 4. EDUCATION */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Education</h2>
            {cvData.education.map((edu, i) => (
              <div key={i} className="mb-4 flex gap-2">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <input placeholder="Institution" value={edu.institution} onChange={(e) => updateArrayItem('education', i, 'institution', e.target.value)} className="border p-2 rounded" />
                  <input placeholder="Degree" value={edu.degree} onChange={(e) => updateArrayItem('education', i, 'degree', e.target.value)} className="border p-2 rounded" />
                  <input placeholder="Date" value={edu.date} onChange={(e) => updateArrayItem('education', i, 'date', e.target.value)} className="border p-2 rounded" />
                  <input placeholder="GPA / Details (Optional)" value={edu.gpa} onChange={(e) => updateArrayItem('education', i, 'gpa', e.target.value)} className="border p-2 rounded" />
                </div>
                <button onClick={() => removeArrayItem('education', i)} className="text-red-500">✕</button>
              </div>
            ))}
            <button onClick={() => addArrayItem('education', { institution: '', degree: '', date: '', gpa: '' })} className="w-full bg-black text-white p-2 rounded">Add Education</button>
          </div>

          {/* 5. SKILLS */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Skills</h2>
            {cvData.skills.map((skill, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input placeholder="Category (e.g., Languages)" value={skill.category} onChange={(e) => updateArrayItem('skills', i, 'category', e.target.value)} className="border p-2 rounded w-1/3" />
                <input placeholder="Skills (comma separated)" value={skill.items} onChange={(e) => updateArrayItem('skills', i, 'items', e.target.value)} className="border p-2 rounded flex-1" />
                <button onClick={() => removeArrayItem('skills', i)} className="bg-red-100 text-red-600 px-3 rounded">✕</button>
              </div>
            ))}
            <button onClick={() => addArrayItem('skills', { category: '', items: '' })} className="text-sm font-bold text-blue-600">+ Add Skill Category</button>
          </div>

          {/* 6. CERTIFICATIONS */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Certifications</h2>
            {cvData.certifications.map((cert, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <input placeholder="Name" value={cert.name} onChange={(e) => updateArrayItem('certifications', i, 'name', e.target.value)} className="border p-2 rounded flex-1" />
                <input placeholder="Issuer" value={cert.issuer} onChange={(e) => updateArrayItem('certifications', i, 'issuer', e.target.value)} className="border p-2 rounded flex-1" />
                <input placeholder="Date" value={cert.date} onChange={(e) => updateArrayItem('certifications', i, 'date', e.target.value)} className="border p-2 rounded w-1/4" />
                <button onClick={() => removeArrayItem('certifications', i)} className="text-red-500">✕</button>
              </div>
            ))}
            <button onClick={() => addArrayItem('certifications', { name: '', issuer: '', date: '' })} className="text-sm font-bold text-blue-600">+ Add Certification</button>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Print Preview */}
        <div className="bg-gray-300 p-8 rounded-xl shadow-inner overflow-auto h-[90vh] flex flex-col items-center">
            <button onClick={handlePrint} className="mb-6 bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-xl sticky top-0 z-10">
              Print / Save as PDF
            </button>
            <div className="origin-top flex justify-center w-full">
              <HarvardTemplate ref={printRef} cvData={cvData} />
            </div>
        </div>

      </div>
    </main>
  );
}