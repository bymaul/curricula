import React, { forwardRef } from 'react';
import { CVData } from '@/lib/schema';

interface TemplateProps {
    cvData: CVData;
}

const FONT = {
    name: 'text-[20pt]',
    jobTitle: 'text-[13pt]',
    contact: 'text-[10pt]',
    sectionTitle: 'text-[13pt]',
    itemTitle: 'text-[11pt]',
    itemSubtitle: 'text-[10.5pt]',
    itemMeta: 'text-[10pt]',
    body: 'text-[10.5pt]',
} as const;

export const HarvardTemplate = forwardRef<HTMLDivElement, TemplateProps>(({ cvData }, ref) => {
    const renderBullets = (text: string) => {
        if (!text) return null;

        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let currentBullets: string[] = [];

        const flushBullets = (key: number) => {
            if (currentBullets.length > 0) {
                elements.push(
                    <ul key={`ul-${key}`} className={`list-disc list-outside ml-5 mt-1 ${FONT.body}`}>
                        {currentBullets.map((bullet, idx) => (
                            <li key={idx} className='pl-1 mb-0.5'>
                                {bullet}
                            </li>
                        ))}
                    </ul>,
                );
                currentBullets = [];
            }
        };

        lines.forEach((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            if (trimmed.startsWith('-')) {
                const bulletText = trimmed.replace(/^-\s*/, '');
                currentBullets.push(bulletText);
            } else {
                flushBullets(i);
                elements.push(
                    <p key={`p-${i}`} className={`mt-1 text-justify ${FONT.body}`}>
                        {trimmed}
                    </p>,
                );
            }
        });

        flushBullets(lines.length);

        return <div className='mt-1'>{elements}</div>;
    };

    const sectionTitle = `mb-2 border-b border-black pb-0.5 ${FONT.sectionTitle} font-bold uppercase break-after-avoid`;
    const itemTitle = `flex justify-between ${FONT.itemTitle} font-bold`;
    const itemMeta = `${FONT.itemMeta} font-normal`;
    const itemSubtitle = `flex justify-between ${FONT.itemSubtitle} italic`;
    const bodyText = FONT.body;
    const section = 'mb-4';
    const avoidBreak = 'break-inside-avoid';

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
                                <h1 className={`${FONT.name} font-bold uppercase tracking-wider mb-1`}>
                                    {cvData.name || 'Your Name'}
                                </h1>

                                {cvData.jobTitle && (
                                    <div className={`${FONT.jobTitle} font-medium`}>{cvData.jobTitle}</div>
                                )}

                                <div className={`mt-1 flex flex-wrap justify-center gap-x-1 ${FONT.contact}`}>
                                    {cvData.email && <span>{cvData.email}</span>}
                                    {cvData.phone && <span> | {cvData.phone}</span>}
                                    {cvData.location && <span> | {cvData.location}</span>}

                                    {cvData.links.map(
                                        (link, idx) =>
                                            link.url && (
                                                <React.Fragment key={idx}>
                                                    <span>|</span>
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
                                <section className={section}>
                                    <h2 className={sectionTitle}>Summary</h2>

                                    <p className={`${bodyText} text-justify`}>{cvData.summary}</p>
                                </section>
                            )}

                            {cvData.experience.length > 0 && (
                                <section className={section}>
                                    <h2 className={sectionTitle}>Experience</h2>

                                    {cvData.experience.map((exp, index) => (
                                        <div key={index} className={`mb-3 ${avoidBreak}`}>
                                            <div className={itemTitle}>
                                                <span>{exp.role}</span>
                                                <span className={itemMeta}>{exp.date}</span>
                                            </div>

                                            <div className={itemSubtitle}>
                                                <span>{exp.company}</span>
                                                <span>{exp.location}</span>
                                            </div>

                                            {renderBullets(exp.description)}
                                        </div>
                                    ))}
                                </section>
                            )}

                            {cvData.projects.length > 0 && (
                                <section className={section}>
                                    <h2 className={sectionTitle}>Projects</h2>

                                    {cvData.projects.map((proj, index) => (
                                        <div key={index} className={`mb-3 ${avoidBreak}`}>
                                            <div className={itemTitle}>
                                                <span>{proj.name}</span>

                                                <span className={itemMeta}>{proj.date}</span>
                                            </div>

                                            {renderBullets(proj.description)}
                                        </div>
                                    ))}
                                </section>
                            )}

                            {cvData.education.length > 0 && (
                                <section className={section}>
                                    <h2 className={sectionTitle}>Education</h2>

                                    {cvData.education.map((edu, index) => (
                                        <div key={index} className={`mb-2 ${avoidBreak}`}>
                                            <div className={itemTitle}>
                                                <span>{edu.institution}</span>

                                                <span className={itemMeta}>{edu.date}</span>
                                            </div>

                                            <div className={itemSubtitle}>
                                                <span>{edu.degree}</span>
                                                <span>{edu.location}</span>
                                            </div>

                                            {renderBullets(edu.description)}
                                        </div>
                                    ))}
                                </section>
                            )}

                            {cvData.skills.length > 0 && (
                                <section className={`${section} ${avoidBreak}`}>
                                    <h2 className={sectionTitle}>Skills</h2>

                                    <div className={bodyText}>
                                        {cvData.skills.map((skill, index) => (
                                            <div key={index} className='mb-1'>
                                                <span className='font-semibold'>{skill.category}:</span> {skill.items}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {cvData.certifications.length > 0 && (
                                <section className={`${section} ${avoidBreak}`}>
                                    <h2 className={sectionTitle}>Certifications</h2>

                                    {cvData.certifications.map((cert, index) => (
                                        <div key={index} className={`mb-1 flex justify-between ${FONT.body}`}>
                                            <span>
                                                <span className='font-semibold'>{cert.name}</span>

                                                {cert.issuer && ` | ${cert.issuer}`}
                                            </span>

                                            <span className={FONT.itemMeta}>{cert.date}</span>
                                        </div>
                                    ))}
                                </section>
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
