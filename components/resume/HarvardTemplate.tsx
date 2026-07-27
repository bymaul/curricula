import { Box } from '@/components/universal/Box';
import { Text } from '@/components/universal/Text';
import { CVData } from '@/lib/schema';
import { Fragment } from 'react/jsx-runtime';

interface TemplateProps {
    cvData: CVData;
    isPdf?: boolean;
}

export const HarvardTemplate = ({ cvData, isPdf = false }: TemplateProps) => {
    const renderBullets = (text: string) => {
        if (!text) return null;

        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let currentBullets: string[] = [];

        const flushBullets = (key: number) => {
            if (currentBullets.length > 0) {
                elements.push(
                    <Box isPdf={isPdf} key={`ul-${key}`} className='text-[10pt]'>
                        {currentBullets.map((bullet, idx) => (
                            <Box isPdf={isPdf} key={idx} className='flex flex-row mb-[1pt]'>
                                <Text isPdf={isPdf} className='mr-1'>
                                    •
                                </Text>
                                <Text isPdf={isPdf} className='flex-1'>
                                    {bullet}
                                </Text>
                            </Box>
                        ))}
                    </Box>,
                );
                currentBullets = [];
            }
        };

        lines.forEach((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            if (trimmed.startsWith('-')) {
                currentBullets.push(trimmed.replace(/^-\s*/, ''));
            } else {
                flushBullets(i);
                elements.push(
                    <Box isPdf={isPdf} key={`p-${i}`} className='mt-1'>
                        <Text isPdf={isPdf} className='text-justify text-[10pt]'>
                            {trimmed}
                        </Text>
                    </Box>,
                );
            }
        });

        flushBullets(lines.length);

        return (
            <Box isPdf={isPdf} className='mt-1'>
                {elements}
            </Box>
        );
    };

    const sectionTitle = 'mb-1.5 border-b border-black pb-0.5 text-[12pt] font-bold uppercase';
    const itemTitle = 'flex flex-row justify-between text-[10.5pt] font-bold';
    const itemMeta = 'text-[9.5pt] font-normal';
    const itemSubtitle = 'flex flex-row justify-between text-[10pt] italic';
    const sectionClass = 'mb-3';

    return (
        <Box isPdf={isPdf} className={`mx-auto bg-white text-black ${!isPdf ? 'font-serif p-[2cm]' : ''}`}>
            {/* --- HEADER SECTION --- */}
            <Box isPdf={isPdf} className='text-center mb-4'>
                <Text isPdf={isPdf} block className='text-[20pt] font-bold uppercase tracking-wider mb-1'>
                    {cvData.name || 'Your Name'}
                </Text>

                {cvData.jobTitle && (
                    <Text isPdf={isPdf} block className='text-[13pt] font-medium'>
                        {cvData.jobTitle}
                    </Text>
                )}

                <Box isPdf={isPdf} className='mt-1 flex flex-row flex-wrap justify-center gap-x-1 text-[10pt]'>
                    {cvData.email && <Text isPdf={isPdf}>{cvData.email}</Text>}
                    {cvData.phone && <Text isPdf={isPdf}> | {cvData.phone}</Text>}
                    {cvData.location && <Text isPdf={isPdf}> | {cvData.location}</Text>}

                    {cvData.links.map(
                        (link, idx) =>
                            link.url && (
                                <Fragment key={idx}>
                                    <Text isPdf={isPdf}> | </Text>
                                    <Text isPdf={isPdf}>{link.url}</Text>
                                </Fragment>
                            ),
                    )}
                </Box>
            </Box>

            {/* --- SUMMARY SECTION --- */}
            {cvData.summary && (
                <Box isPdf={isPdf} className={sectionClass}>
                    {/* summary */}
                    <Text isPdf={isPdf} block className={sectionTitle}>
                        Summary
                    </Text>
                    <Text isPdf={isPdf} block className='text-[10.5pt] text-justify'>
                        {cvData.summary}
                    </Text>
                </Box>
            )}

            {/* --- EXPERIENCE SECTION --- */}
            {cvData.experience.length > 0 && (
                <Box isPdf={isPdf} className={sectionClass}>
                    <Text isPdf={isPdf} block className={sectionTitle}>
                        Experience
                    </Text>

                    {cvData.experience.map((exp, index) => (
                        <Box isPdf={isPdf} key={index} className='mb-2' wrap={false}>
                            <Box isPdf={isPdf} className={itemTitle}>
                                <Text isPdf={isPdf}>{exp.role}</Text>
                                <Text isPdf={isPdf} className={itemMeta}>
                                    {exp.date}
                                </Text>
                            </Box>

                            <Box isPdf={isPdf} className={itemSubtitle}>
                                <Text isPdf={isPdf}>{exp.company}</Text>
                                <Text isPdf={isPdf}>{exp.location}</Text>
                            </Box>

                            {renderBullets(exp.description)}
                        </Box>
                    ))}
                </Box>
            )}

            {/* --- PROJECTS SECTION --- */}
            {cvData.projects.length > 0 && (
                <Box isPdf={isPdf} className={sectionClass}>
                    <Text isPdf={isPdf} block className={sectionTitle}>
                        Projects
                    </Text>

                    {cvData.projects.map((proj, index) => (
                        <Box isPdf={isPdf} key={index} className='mb-2' wrap={false}>
                            <Box isPdf={isPdf} className={itemTitle}>
                                <Text isPdf={isPdf}>{proj.name}</Text>
                                <Text isPdf={isPdf} className={itemMeta}>
                                    {proj.date}
                                </Text>
                            </Box>

                            {renderBullets(proj.description)}
                        </Box>
                    ))}
                </Box>
            )}

            {/* --- EDUCATION SECTION --- */}
            {cvData.education.length > 0 && (
                <Box isPdf={isPdf} className={sectionClass}>
                    <Text isPdf={isPdf} block className={sectionTitle}>
                        Education
                    </Text>

                    {cvData.education.map((edu, index) => (
                        <Box isPdf={isPdf} key={index} className='mb-2' wrap={false}>
                            <Box isPdf={isPdf} className={itemTitle}>
                                <Text isPdf={isPdf}>{edu.institution}</Text>
                                <Text isPdf={isPdf} className={itemMeta}>
                                    {edu.date}
                                </Text>
                            </Box>

                            <Box isPdf={isPdf} className={itemSubtitle}>
                                <Text isPdf={isPdf}>{edu.degree}</Text>
                                <Text isPdf={isPdf}>{edu.location}</Text>
                            </Box>

                            {renderBullets(edu.description)}
                        </Box>
                    ))}
                </Box>
            )}

            {/* --- SKILLS SECTION --- */}
            {cvData.skills.length > 0 && (
                <Box isPdf={isPdf} className={sectionClass} wrap={false}>
                    <Text isPdf={isPdf} block className={sectionTitle}>
                        Skills
                    </Text>

                    <Box isPdf={isPdf} className='text-[10.5pt]'>
                        {cvData.skills.map((skill, index) => (
                            <Text isPdf={isPdf} key={index} block className='mb-1'>
                                <Text isPdf={isPdf} className='font-semibold'>
                                    {skill.category}:{' '}
                                </Text>
                                {skill.items}
                            </Text>
                        ))}
                    </Box>
                </Box>
            )}

            {/* --- CERTIFICATIONS SECTION --- */}
            {cvData.certifications.length > 0 && (
                <Box isPdf={isPdf} className={sectionClass} wrap={false}>
                    <Text isPdf={isPdf} block className={sectionTitle}>
                        Certifications
                    </Text>

                    {cvData.certifications.map((cert, index) => (
                        <Box isPdf={isPdf} key={index} className='mb-1 flex flex-row justify-between text-[10.5pt]'>
                            <Text isPdf={isPdf} className='flex-1 mr-2'>
                                <Text isPdf={isPdf} className='font-semibold'>
                                    {cert.name}
                                </Text>
                                {cert.issuer && ` | ${cert.issuer}`}
                            </Text>

                            <Text isPdf={isPdf} className={`${itemMeta} shrink-0`}>
                                {cert.date}
                            </Text>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};
