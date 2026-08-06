'use client';

import React, { forwardRef } from 'react';
import { DEFAULT_SECTION_ORDER, SectionId } from '@/lib/consts';
import { translate, TranslationKey } from '@/lib/i18n';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { CVData } from '@/lib/schema';

interface TemplateProps {
  cvData: CVData;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
  language?: ResumeLanguage;
  photo?: string;
  onSectionClick?: (sectionId: SectionId) => void;
}

type T = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

interface SectionContext {
  onClick?: (sectionId: SectionId) => void;
  t: T;
}

/**
 * Single source of truth for the Harvard template's type scale and spacing.
 * Change a value here instead of hunting through the JSX.
 *
 * Sizes follow the classic "Harvard resume" convention:
 * - Name is the only large element on the page.
 * - Everything else sits in a tight 9.5-11pt band so the page reads as one
 *   voice rather than a mix of headings.
 */
const TYPE = {
  name: 'text-[16pt] font-bold uppercase tracking-wide',
  jobTitle: 'text-[11pt] font-medium',
  contact: 'text-[9.5pt]',
  sectionTitle: 'text-[11pt] font-bold uppercase',
  itemTitle: 'text-[10.5pt] font-bold',
  itemMeta: 'text-[10pt] font-normal',
  itemSubtitle: 'text-[10pt] italic',
  body: 'text-[10pt]',
  bullet: 'text-[10pt]',
} as const;

const SPACE = {
  pageMargin: 'px-[2cm]',
  pageCap: 'h-[1.5cm]',
  sectionGap: 'mb-[10pt]',
  itemGap: 'mb-[7pt]',
  sectionTitleGap: 'mb-[3pt] pb-[1pt]',
} as const;

/**
 * Parses a free-text field into paragraphs and "- " bullet groups.
 * Defined outside the component so it isn't re-created on every render.
 */
function renderFormattedText(text: string) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentBullets: string[] = [];

  const flushBullets = (key: number) => {
    if (currentBullets.length === 0) return;
    elements.push(
      <ul
        key={`ul-${key}`}
        className={`list-disc list-outside ml-5 mt-1 ${TYPE.bullet}`}
      >
        {currentBullets.map((bullet, idx) => (
          <li key={idx} className="pl-1 mb-0.5">
            {bullet}
          </li>
        ))}
      </ul>,
    );
    currentBullets = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('-')) {
      currentBullets.push(trimmed.replace(/^-\s*/, ''));
    } else {
      flushBullets(i);
      elements.push(
        <p key={`p-${i}`} className={`mt-1 text-justify ${TYPE.body}`}>
          {trimmed}
        </p>,
      );
    }
  });

  flushBullets(lines.length);

  return <div>{elements}</div>;
}

const formatUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
};

/** Section wrapper: heading + underline, consistent across the page. */
function Section({
  id,
  title,
  avoidBreakAfter,
  onClick,
  t,
  children,
}: {
  id: SectionId;
  title: string;
  avoidBreakAfter?: boolean;
  onClick?: (sectionId: SectionId) => void;
  t: T;
  children: React.ReactNode;
}) {
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('a')) return;
    onClick?.(id);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onClick?.(id);
  };

  return (
    <section
      data-section-id={id}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? t('template.editAria', { title }) : undefined}
      className={`${SPACE.sectionGap} ${avoidBreakAfter ? 'break-after-avoid' : ''} ${onClick ? 'cursor-pointer hover:ring-1 hover:ring-primary/40 hover:rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded-sm' : ''}`}
    >
      <h2
        className={`${TYPE.sectionTitle} border-b border-black ${SPACE.sectionTitleGap} break-after-avoid`}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Bold title on the left, meta (usually a date) on the right. */
function EntryHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className={`flex justify-between ${TYPE.itemTitle}`}>
      <span>{title}</span>
      {meta && <span className={TYPE.itemMeta}>{meta}</span>}
    </div>
  );
}

/** Italic subtitle row, e.g. company/location or degree/location. */
function EntrySubheader({ left, right }: { left?: string; right?: string }) {
  if (!left && !right) return null;
  return (
    <div className={`flex justify-between ${TYPE.itemSubtitle} mb-[2pt]`}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

type SectionRenderer = (
  cvData: CVData,
  context: SectionContext,
) => React.ReactNode;

const SECTION_RENDERERS: Record<SectionId, SectionRenderer> = {
  summary: (cvData, { onClick, t }) =>
    cvData.summary ? (
      <Section
        id="summary"
        title={t('template.summary')}
        onClick={onClick}
        t={t}
      >
        <p className={`text-justify ${TYPE.body}`}>{cvData.summary}</p>
      </Section>
    ) : null,
  experience: (cvData, { onClick, t }) =>
    cvData.experience.length > 0 ? (
      <Section
        id="experience"
        title={t('template.experience')}
        onClick={onClick}
        t={t}
      >
        {cvData.experience.map((exp, index) => (
          <div key={index} className={`${SPACE.itemGap} break-inside-avoid`}>
            <EntryHeader title={exp.role} meta={exp.date} />
            <EntrySubheader left={exp.company} right={exp.location} />
            {renderFormattedText(exp.description)}
          </div>
        ))}
      </Section>
    ) : null,
  projects: (cvData, { onClick, t }) =>
    cvData.projects.length > 0 ? (
      <Section
        id="projects"
        title={t('template.projects')}
        onClick={onClick}
        t={t}
      >
        {cvData.projects.map((proj, index) => (
          <div key={index} className={`${SPACE.itemGap} break-inside-avoid`}>
            <EntryHeader title={proj.name} meta={proj.date} />
            {renderFormattedText(proj.description)}
          </div>
        ))}
      </Section>
    ) : null,
  education: (cvData, { onClick, t }) =>
    cvData.education.length > 0 ? (
      <Section
        id="education"
        title={t('template.education')}
        onClick={onClick}
        t={t}
      >
        {cvData.education.map((edu, index) => (
          <div key={index} className={`${SPACE.itemGap} break-inside-avoid`}>
            <EntryHeader title={edu.institution} meta={edu.date} />
            <EntrySubheader left={edu.degree} right={edu.location} />
            {renderFormattedText(edu.description)}
          </div>
        ))}
      </Section>
    ) : null,
  skills: (cvData, { onClick, t }) =>
    cvData.skills.length > 0 ? (
      <Section
        id="skills"
        title={t('template.skills')}
        onClick={onClick}
        avoidBreakAfter
        t={t}
      >
        {cvData.skills.map((skill, index) => (
          <div key={index} className="mb-1 text-[10.5pt]">
            <span className="font-semibold">{skill.category}:</span>{' '}
            {skill.items}
          </div>
        ))}
      </Section>
    ) : null,
  certifications: (cvData, { onClick, t }) =>
    cvData.certifications.length > 0 ? (
      <Section
        id="certifications"
        title={t('template.certifications')}
        onClick={onClick}
        avoidBreakAfter
        t={t}
      >
        {cvData.certifications.map((cert, index) => (
          <div
            key={index}
            className={`mb-1 flex justify-between text-[10.5pt]`}
          >
            <span>
              <span className="font-semibold">{cert.name}</span>
              {cert.issuer && ` | ${cert.issuer}`}
            </span>
            <span className={TYPE.itemMeta}>{cert.date}</span>
          </div>
        ))}
      </Section>
    ) : null,
};

export const HarvardTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  (
    { cvData, sectionOrder, hiddenSections, language, photo, onSectionClick },
    ref,
  ) => {
    const t = (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(language ?? 'en', key, params);

    const order = (sectionOrder ?? DEFAULT_SECTION_ORDER).filter(
      (id) => !hiddenSections?.includes(id),
    );

    const context: SectionContext = { onClick: onSectionClick, t };

    const handleHeaderClick = () => onSectionClick?.('summary');

    const handleHeaderKeyDown = (
      event: React.KeyboardEvent<HTMLDivElement>,
    ) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onSectionClick?.('summary');
    };

    return (
      <div ref={ref} className="mx-auto shadow-2xl print:shadow-none bg-white">
        <style type="text/css" media="print">
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

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <td>
                <div className={`${SPACE.pageCap} w-full`}></div>
              </td>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                className={`${SPACE.pageMargin} align-top font-serif text-black leading-snug`}
              >
                {/* --- HEADER SECTION --- */}
                <div
                  data-section-id="personal"
                  onClick={onSectionClick ? handleHeaderClick : undefined}
                  onKeyDown={onSectionClick ? handleHeaderKeyDown : undefined}
                  tabIndex={onSectionClick ? 0 : undefined}
                  aria-label={
                    onSectionClick
                      ? t('template.editAria', {
                          title: t('personalDetails.title'),
                        })
                      : undefined
                  }
                  className={`text-center mb-4 ${onSectionClick ? 'cursor-pointer hover:ring-1 hover:ring-primary/40 hover:rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded-sm' : ''}`}
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt=""
                      className="mx-auto mb-2 h-[3cm] w-[3cm] rounded-full object-cover"
                    />
                  ) : null}

                  <h1 className={`${TYPE.name} mb-1`}>
                    {cvData.name || t('template.yourName')}
                  </h1>

                  {cvData.jobTitle && (
                    <div className={TYPE.jobTitle}>{cvData.jobTitle}</div>
                  )}

                  <div
                    className={`mt-1 flex flex-wrap justify-center gap-x-1 ${TYPE.contact}`}
                  >
                    {cvData.email && <span>{cvData.email}</span>}
                    {cvData.phone && <span> | {cvData.phone}</span>}
                    {cvData.location && <span> | {cvData.location}</span>}

                    {cvData.links.map(
                      (link, idx) =>
                        link.url && (
                          <React.Fragment key={idx}>
                            <span>|</span>
                            <a
                              href={formatUrl(link.url)}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {link.url}
                            </a>
                          </React.Fragment>
                        ),
                    )}
                  </div>
                </div>

                {/* --- CONTENT SECTIONS (ordered) --- */}
                {order.map((id) => (
                  <React.Fragment key={id}>
                    {SECTION_RENDERERS[id](cvData, context)}
                  </React.Fragment>
                ))}
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td>
                <div className={`${SPACE.pageCap} w-full`}></div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  },
);

HarvardTemplate.displayName = 'HarvardTemplate';
