'use client';

import React, { forwardRef } from 'react';
import { DEFAULT_SECTION_ORDER, SectionId } from '@/lib/consts';
import { translate } from '@/lib/i18n';
import { CVData } from '@/lib/schema';
import {
  PrintStyle,
  TemplateProps,
  T,
  SectionContext,
  formatUrl,
  renderFormattedText,
} from './shared';

const TYPE = {
  name: 'text-[20pt] font-bold text-slate-900 leading-tight',
  jobTitle: 'text-[12pt] font-medium text-slate-600',
  contact: 'text-[9.5pt] text-slate-700',
  heading:
    'text-[10.5pt] font-bold uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-[2pt] mb-[6pt] break-after-avoid',
  itemTitle: 'text-[10.5pt] font-bold text-slate-900',
  itemMeta: 'text-[9.5pt] font-normal text-slate-500',
  itemSub: 'text-[9.5pt] italic text-slate-600',
  body: 'text-[9.5pt] leading-snug text-slate-800',
} as const;

type SectionRenderer = (
  cvData: CVData,
  context: SectionContext,
) => React.ReactNode;

function sectionClickProps(id: SectionId, onClick: SectionContext['onClick']) {
  return {
    onClick: onClick
      ? (event: React.MouseEvent<HTMLElement>) => {
          if ((event.target as HTMLElement).closest('a')) return;
          onClick(id);
        }
      : undefined,
    onKeyDown: onClick
      ? (event: React.KeyboardEvent<HTMLElement>) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          onClick(id);
        }
      : undefined,
    tabIndex: onClick ? 0 : undefined,
  };
}

/** Accent-free section heading, single column throughout. */
function Section({
  id,
  title,
  onClick,
  t,
  children,
}: {
  id: SectionId;
  title: string;
  onClick?: (sectionId: SectionId) => void;
  t: T;
  children: React.ReactNode;
}) {
  const clickProps = sectionClickProps(id, onClick);
  return (
    <section
      data-section-id={id}
      {...clickProps}
      aria-label={onClick ? t('template.editAria', { title }) : undefined}
      className={`mb-[10pt] ${onClick ? 'cursor-pointer hover:ring-1 hover:ring-primary/40 hover:rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded-sm' : ''}`}
    >
      <h2 className={TYPE.heading}>{title}</h2>
      {children}
    </section>
  );
}

/** Bold title on the left, meta (usually a date) on the right. */
function ItemHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className={`flex justify-between ${TYPE.itemTitle}`}>
      <span>{title}</span>
      {meta && <span className={TYPE.itemMeta}>{meta}</span>}
    </div>
  );
}

/** Italic subtitle row, e.g. company/location or degree/location. */
function ItemSub({ left, right }: { left?: string; right?: string }) {
  if (!left && !right) return null;
  return (
    <div className={`flex justify-between ${TYPE.itemSub} mb-[2pt]`}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

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
          <div key={index} className="mb-[7pt] break-inside-avoid">
            <ItemHeader title={exp.role} meta={exp.date} />
            <ItemSub left={exp.company} right={exp.location} />
            {renderFormattedText(exp.description, TYPE.body)}
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
          <div key={index} className="mb-[7pt] break-inside-avoid">
            <ItemHeader title={proj.name} meta={proj.date} />
            {renderFormattedText(proj.description, TYPE.body)}
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
          <div key={index} className="mb-[7pt] break-inside-avoid">
            <ItemHeader title={edu.institution} meta={edu.date} />
            <ItemSub left={edu.degree} right={edu.location} />
            {renderFormattedText(edu.description, TYPE.body)}
          </div>
        ))}
      </Section>
    ) : null,
  skills: (cvData, { onClick, t }) =>
    cvData.skills.length > 0 ? (
      <Section id="skills" title={t('template.skills')} onClick={onClick} t={t}>
        {cvData.skills.map((skill, index) => (
          <div key={index} className="mb-1 text-[9.5pt]">
            <span className="font-semibold text-slate-900">
              {skill.category}:
            </span>{' '}
            <span className="text-slate-700">{skill.items}</span>
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
        t={t}
      >
        {cvData.certifications.map((cert, index) => (
          <div key={index} className="mb-[5pt] text-[9.5pt] break-inside-avoid">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-900">{cert.name}</span>
              {cert.date && <span className={TYPE.itemMeta}>{cert.date}</span>}
            </div>
            {cert.issuer && <div className="text-slate-600">{cert.issuer}</div>}
          </div>
        ))}
      </Section>
    ) : null,
};

export const MinimalTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  (
    { cvData, sectionOrder, hiddenSections, language, photo, onSectionClick },
    ref,
  ) => {
    const t: T = (key, params) => translate(language ?? 'en', key, params);
    const hidden = new Set(hiddenSections ?? []);

    const order = (sectionOrder ?? DEFAULT_SECTION_ORDER).filter(
      (id) => !hidden.has(id),
    );

    const context: SectionContext = { onClick: onSectionClick, t };

    const handleHeaderClick = () => onSectionClick?.('summary');
    const headerClickProps = {
      onClick: onSectionClick
        ? (event: React.MouseEvent<HTMLDivElement>) => {
            if ((event.target as HTMLElement).closest('a')) return;
            handleHeaderClick();
          }
        : undefined,
      onKeyDown: onSectionClick
        ? (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            handleHeaderClick();
          }
        : undefined,
      tabIndex: onSectionClick ? 0 : undefined,
    };

    const contactItems: { text: string; href?: string }[] = [];
    if (cvData.email) contactItems.push({ text: cvData.email });
    if (cvData.phone) contactItems.push({ text: cvData.phone });
    if (cvData.location) contactItems.push({ text: cvData.location });
    for (const link of cvData.links) {
      if (link.url)
        contactItems.push({ text: link.url, href: formatUrl(link.url) });
    }

    return (
      <div ref={ref} className="mx-auto shadow-2xl print:shadow-none bg-white">
        <PrintStyle />

        <div className="px-[1.4cm] pt-[1cm] pb-[1cm]">
          {/* --- HEADER --- */}
          <div
            data-section-id="summary"
            {...headerClickProps}
            aria-label={
              onSectionClick
                ? t('template.editAria', {
                    title: t('personalDetails.title'),
                  })
                : undefined
            }
            className={`mb-[12pt] ${onSectionClick ? 'cursor-pointer hover:ring-1 hover:ring-primary/40 hover:rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded-sm' : ''}`}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                className="mb-3 h-[2.4cm] w-[2.4cm] rounded-full object-cover"
              />
            ) : null}

            <h1 className={TYPE.name}>
              {cvData.name || t('template.yourName')}
            </h1>

            {cvData.jobTitle && (
              <div className={`${TYPE.jobTitle} mt-[2pt]`}>
                {cvData.jobTitle}
              </div>
            )}

            {contactItems.length > 0 && (
              <div
                className={`${TYPE.contact} mt-[6pt] flex flex-wrap gap-x-2 gap-y-0.5`}
              >
                {contactItems.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span aria-hidden="true">·</span>}
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all hover:underline"
                      >
                        {item.text}
                      </a>
                    ) : (
                      <span>{item.text}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* --- SECTIONS (single column, in section order) --- */}
          {order.map((id) => (
            <React.Fragment key={id}>
              {SECTION_RENDERERS[id](cvData, context)}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  },
);

MinimalTemplate.displayName = 'MinimalTemplate';
