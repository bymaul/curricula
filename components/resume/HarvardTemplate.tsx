import React, { forwardRef } from 'react';
import { CVData } from '@/lib/types';

interface TemplateProps {
    cvData: CVData;
}

export const HarvardTemplate = forwardRef<HTMLDivElement, TemplateProps>(({ cvData }, ref) => {
    const renderBullets = (text: string) => {
        if (!text) return null;

        const lines = text.split('\n').filter((line) => line.trim() !== '');
        if (lines.length === 0) return null;

        return (
            <ul className='list-disc list-outside ml-5 mt-1 text-[11pt]'>
                {lines.map((line, i) => (
                    <li key={i} className='pl-1 mb-0.5'>
                        {line.trim().replace(/^[-•*]\s*/, '')}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div ref={ref} className='mx-auto shadow-2xl print:shadow-none bg-white'>
            <style type='text/css' media='print'>
                {`
                  @page { 
                    size: A4;
                    margin: 0mm;
                  }
                  
                  thead { display: table-header-group; }
                  tfoot { display: table-footer-group; }
                  
                  div { background-image: none !important; }
                `}
            </style>

            <table className='w-full border-collapse'>
                <thead>
                    <tr>
                        <td>
                            <div className='h-[2cm] w-full'></div>
                        </td>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td className='px-[2cm] align-top font-serif text-black text-[11pt] leading-snug'>
                            <div className='text-center mb-4'>
                                <h1 className='text-2xl font-bold uppercase tracking-wider mb-1'>
                                    {cvData.name || 'Your Name'}
                                </h1>
                                {cvData.jobTitle && <div className='mb-1'>{cvData.jobTitle}</div>}

                                <div className='flex flex-wrap justify-center gap-x-1 text-[9pt] mt-1'>
                                    {cvData.email && <span>{cvData.email}</span>}
                                    {cvData.phone && <span> • {cvData.phone}</span>}
                                    {cvData.domicile && <span> • {cvData.domicile}</span>}

                                    {cvData.links.map(
                                        (link, idx) =>
                                            link.url && (
                                                <React.Fragment key={idx}>
                                                    <span>•</span>
                                                    <a
                                                        href={'https://' + link.url}
                                                        target='_blank'
                                                        className='hover:underline'>
                                                        {link.url}
                                                    </a>
                                                </React.Fragment>
                                            ),
                                    )}
                                </div>
                            </div>

                            {cvData.summary && (
                                <div className='mb-4'>
                                    <h2 className='text-[12pt] font-bold uppercase border-b border-black mb-2 pb-0.5 break-after-avoid'>
                                        Summary
                                    </h2>
                                    <p className='text-[11pt] text-justify'>{cvData.summary}</p>
                                </div>
                            )}

                            {cvData.experience.length > 0 && (
                                <div className='mb-4'>
                                    <h2 className='text-[12pt] font-bold uppercase border-b border-black mb-2 pb-0.5 break-after-avoid'>
                                        Experience
                                    </h2>
                                    {cvData.experience.map((exp, index) => (
                                        <div key={index} className='mb-3 break-inside-avoid'>
                                            <div className='flex justify-between font-bold text-[11pt]'>
                                                <span>{exp.role}</span>
                                                <span>{exp.date}</span>
                                            </div>
                                            <div className='flex justify-between italic text-[11pt]'>
                                                <span>{exp.company}</span>
                                                <span>{exp.location}</span>
                                            </div>
                                            {renderBullets(exp.description)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {cvData.projects.length > 0 && (
                                <div className='mb-4'>
                                    <h2 className='text-[12pt] font-bold uppercase border-b border-black mb-2 pb-0.5 break-after-avoid'>
                                        Projects
                                    </h2>
                                    {cvData.projects.map((proj, index) => (
                                        <div key={index} className='mb-3 break-inside-avoid'>
                                            <div className='flex justify-between font-bold text-[11pt]'>
                                                <span>{proj.name}</span>
                                                <span>{proj.date}</span>
                                            </div>
                                            {renderBullets(proj.description)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {cvData.education.length > 0 && (
                                <div className='mb-4'>
                                    <h2 className='text-[12pt] font-bold uppercase border-b border-black mb-2 pb-0.5 break-after-avoid'>
                                        Education
                                    </h2>
                                    {cvData.education.map((edu, index) => (
                                        <div key={index} className='mb-2 break-inside-avoid'>
                                            <div className='flex justify-between font-bold text-[11pt]'>
                                                <span>{edu.institution}</span>
                                                <span>{edu.date}</span>
                                            </div>
                                            <div className='flex justify-between italic text-[11pt]'>
                                                <span>{edu.degree}</span>
                                                <span>{edu.location}</span>
                                            </div>
                                            {renderBullets(edu.description)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {cvData.skills.length > 0 && (
                                <div className='mb-4 break-inside-avoid'>
                                    <h2 className='text-[12pt] font-bold uppercase border-b border-black mb-2 pb-0.5 break-after-avoid'>
                                        Skills
                                    </h2>
                                    <div className='text-[11pt]'>
                                        {cvData.skills.map((skill, index) => (
                                            <div key={index} className='mb-1'>
                                                <span className='font-bold'>{skill.category}:</span> {skill.items}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {cvData.certifications.length > 0 && (
                                <div className='mb-4 break-inside-avoid'>
                                    <h2 className='text-[12pt] font-bold uppercase border-b border-black mb-2 pb-0.5 break-after-avoid'>
                                        Certifications
                                    </h2>
                                    {cvData.certifications.map((cert, index) => (
                                        <div key={index} className='flex justify-between text-[11pt] mb-1'>
                                            <span>
                                                <span className='font-bold'>{cert.name}</span>{' '}
                                                {cert.issuer && `| ${cert.issuer}`}
                                            </span>
                                            <span>{cert.date}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </td>
                    </tr>
                </tbody>

                <tfoot>
                    <tr>
                        <td>
                            <div className='h-[2cm] w-full'></div>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
});

HarvardTemplate.displayName = 'HarvardTemplate';
