import React, { forwardRef } from 'react';
import { CVData } from '@/lib/types';

interface TemplateProps {
    cvData: CVData;
}

export const HarvardTemplate = forwardRef<HTMLDivElement, TemplateProps>(({ cvData }, ref) => {
    return (
        <div
            ref={ref}
            className='font-serif bg-white text-black text-[11pt] p-[1in] w-[8.5in] min-h-[11in] mx-auto shadow-2xl box-border leading-snug'>
            {/* HEADER: Name, Job Title, Contact Info */}
            <div className='text-center mb-4'>
                <h1 className='text-3xl font-bold uppercase tracking-wider mb-1'>{cvData.name || 'Your Name'}</h1>
                {cvData.jobTitle && <div className='text-lg mb-1'>{cvData.jobTitle}</div>}

                <div className='flex flex-wrap justify-center gap-x-2 text-[10pt] mt-1'>
                    {cvData.email && <span>{cvData.email}</span>}
                    {cvData.email && cvData.phone && <span>|</span>}
                    {cvData.phone && <span>{cvData.phone}</span>}

                    {cvData.links.map(
                        (link, idx) =>
                            link.url && (
                                <React.Fragment key={idx}>
                                    <span>|</span>
                                    <a href={link.url} className='hover:underline'>
                                        {link.label}: {link.url.replace(/^https?:\/\//, '')}
                                    </a>
                                </React.Fragment>
                            ),
                    )}
                </div>
            </div>

            {/* SUMMARY */}
            {cvData.summary && (
                <div className='mb-4'>
                    <h2 className='text-[12pt] font-bold uppercase border-b border-black mb-2 pb-0.5'>Summary</h2>
                    <p className='text-[11pt] text-justify'>{cvData.summary}</p>
                </div>
            )}

            {/* WORK EXPERIENCE */}
            {cvData.experience.length > 0 && (
                <div className='mb-4'>
                    <h2 className='text-[12pt] font-bold uppercase border-b border-black mb-2 pb-0.5'>Experience</h2>
                    {cvData.experience.map((exp, index) => (
                        <div key={index} className='mb-3 break-inside-avoid'>
                            <div className='flex justify-between font-bold text-[11pt]'>
                                <span>
                                    {exp.role}{' '}
                                    {exp.company && <span className='font-normal italic'>| {exp.company}</span>}
                                </span>
                                <span>{exp.date}</span>
                            </div>
                            <ul className='list-disc list-outside ml-5 mt-1 text-[11pt]'>
                                {exp.achievements.map((ach, i) =>
                                    ach.trim() ? (
                                        <li key={i} className='pl-1'>
                                            {ach}
                                        </li>
                                    ) : null,
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* PROJECTS */}
            {cvData.projects.length > 0 && (
                <div className='mb-4'>
                    <h2 className='text-[12pt] font-bold uppercase border-b border-black mb-2 pb-0.5'>Projects</h2>
                    {cvData.projects.map((proj, index) => (
                        <div key={index} className='mb-3 break-inside-avoid'>
                            <div className='flex justify-between font-bold text-[11pt]'>
                                <span>{proj.name}</span>
                                <span>{proj.date}</span>
                            </div>
                            <ul className='list-disc list-outside ml-5 mt-1 text-[11pt]'>
                                {proj.achievements.map((ach, i) =>
                                    ach.trim() ? (
                                        <li key={i} className='pl-1'>
                                            {ach}
                                        </li>
                                    ) : null,
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* EDUCATION */}
            {cvData.education.length > 0 && (
                <div className='mb-4'>
                    <h2 className='text-[12pt] font-bold uppercase border-b border-black mb-2 pb-0.5'>Education</h2>
                    {cvData.education.map((edu, index) => (
                        <div key={index} className='mb-2 break-inside-avoid'>
                            <div className='flex justify-between font-bold text-[11pt]'>
                                <span>{edu.institution}</span>
                                <span>{edu.date}</span>
                            </div>
                            <div className='flex justify-between italic text-[11pt]'>
                                <span>{edu.degree}</span>
                                <span>{edu.gpa}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* SKILLS */}
            {cvData.skills.length > 0 && (
                <div className='mb-4 break-inside-avoid'>
                    <h2 className='text-[12pt] font-bold uppercase border-b border-black mb-2 pb-0.5'>Skills</h2>
                    <div className='text-[11pt]'>
                        {cvData.skills.map((skill, index) => (
                            <div key={index} className='mb-1'>
                                <span className='font-bold'>{skill.category}:</span> {skill.items}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CERTIFICATIONS */}
            {cvData.certifications.length > 0 && (
                <div className='mb-4 break-inside-avoid'>
                    <h2 className='text-[12pt] font-bold uppercase border-b border-black mb-2 pb-0.5'>
                        Certifications
                    </h2>
                    {cvData.certifications.map((cert, index) => (
                        <div key={index} className='flex justify-between text-[11pt] mb-1'>
                            <span>
                                <span className='font-bold'>{cert.name}</span> {cert.issuer && `| ${cert.issuer}`}
                            </span>
                            <span>{cert.date}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

HarvardTemplate.displayName = 'HarvardTemplate';
