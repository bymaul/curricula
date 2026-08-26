'use client';

import React, { forwardRef } from 'react';
import {
  BuiltinSectionId,
  DEFAULT_SECTION_ORDER,
  SectionId,
} from '@/lib/consts';
import { DEFAULT_DESIGN, designCssVars } from '@/lib/design';
import { translate } from '@/lib/i18n';
import { CVData } from '@/lib/schema';
import {
  PrintStyle,
  TemplateProps,
  T,
  SectionContext,
  formatUrl,
  renderFormattedText,
  renderCustomItems,
  resolveTemplateOrder,
  isBuiltinSection,
  sectionClickProps,
  headerClickProps,
  INTERACTIVE_CLASSES,
  ItemHeader,
  ItemSub,
} from './shared';

const TYPE = {
  name: 'text-[20pt] font-bold text-slate-900 leading-tight',
  jobTitle: 'text-[12pt] font-medium text-slate-600',
  contact: 'text-[9.5pt] text-slate-700',
  heading:
    'text-[10.5pt] font-bold uppercase tracking-wide [color:var(--cv-accent)] border-b border-slate-300 pb-[2pt] mb-[6pt] break-after-avoid',
  itemTitle: 'text-[10.5pt] font-bold text-slate-900',
  itemMeta: 'text-[9.5pt] font-normal text-slate-500',
  itemSub: 'text-[9.5pt] italic text-slate-600',
  body: 'text-[9.5pt] leading-snug text-slate-800',
} as const;

const SPACE = {
  sectionGap: '[margin-bottom:var(--cv-section-gap)]',
  itemGap: '[margin-bottom:var(--cv-item-gap)]',
} as const;

type SectionRenderer = (
  cvData: CVData,
  context: SectionContext,
) => React.ReactNode;

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
  return (
    <section
      data-section-id={id}
      {...sectionClickProps(id, onClick)}
      aria-label={onClick ? t('template.editAria', { title }) : undefined}
      className={`${SPACE.sectionGap} ${onClick ? INTERACTIVE_CLASSES : ''}`}
    >
      <h2 className={TYPE.heading}>{title}</h2>
      {children}
    </section>
  );
}

const SECTION_RENDERERS: Record<BuiltinSectionId, SectionRenderer> = {
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
            <ItemHeader
              title={exp.role}
              meta={exp.date}
              titleClass={TYPE.itemTitle}
              metaClass={TYPE.itemMeta}
            />
            <ItemSub
              left={exp.company}
              right={exp.location}
              className={TYPE.itemSub}
            />
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
          <div key={index} className={`${SPACE.itemGap} break-inside-avoid`}>
            <ItemHeader
              title={proj.name}
              meta={proj.date}
              titleClass={TYPE.itemTitle}
              metaClass={TYPE.itemMeta}
            />
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
          <div key={index} className={`${SPACE.itemGap} break-inside-avoid`}>
            <ItemHeader
              title={edu.institution}
              meta={edu.date}
              titleClass={TYPE.itemTitle}
              metaClass={TYPE.itemMeta}
            />
            <ItemSub
              left={edu.degree}
              right={edu.location}
              className={TYPE.itemSub}
            />
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
          <div
            key={index}
            className={`${SPACE.itemGap} text-[9.5pt] break-inside-avoid`}
          >
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
    {
      cvData,
      sectionOrder,
      hiddenSections,
      language,
      photo,
      design,
      onSectionClick,
    },
    ref,
  ) => {
    const t: T = (key, params) => translate(language ?? 'en', key, params);
    const styleVars = designCssVars(design ?? DEFAULT_DESIGN, {
      accentFallback: '#0f172a',
      fontFallback: 'sans',
    });
    const hidden = new Set(hiddenSections ?? []);

    const order = (sectionOrder ?? DEFAULT_SECTION_ORDER).filter(
      (id) => !hidden.has(id),
    );

    const context: SectionContext = { onClick: onSectionClick, t };

    const contactItems: { text: string; href?: string }[] = [];
    if (cvData.email) contactItems.push({ text: cvData.email });
    if (cvData.phone) contactItems.push({ text: cvData.phone });
    if (cvData.location) contactItems.push({ text: cvData.location });
    for (const link of cvData.links) {
      if (link.url)
        contactItems.push({ text: link.url, href: formatUrl(link.url) });
    }

    return (
      <div
        ref={ref}
        style={{ ...styleVars, fontFamily: 'var(--cv-font)' }}
        className="mx-auto shadow-2xl print:shadow-none bg-white"
      >
        <PrintStyle pageSize={design?.pageSize} />

        <div className="px-[1.4cm] pt-[1cm] pb-[1cm]">
          <div
            data-section-id="summary"
            {...headerClickProps(onSectionClick)}
            aria-label={
              onSectionClick
                ? t('template.editAria', {
                    title: t('personalDetails.title'),
                  })
                : undefined
            }
            className={`mb-[12pt] ${onSectionClick ? INTERACTIVE_CLASSES : ''}`}
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

          {resolveTemplateOrder(order, cvData).map((id) => {
            const builtin = isBuiltinSection(id)
              ? SECTION_RENDERERS[id](cvData, context)
              : null;
            if (builtin)
              return <React.Fragment key={id}>{builtin}</React.Fragment>;
            const section = cvData.customSections?.[id];
            if (!section) return null;
            return (
              <Section
                key={id}
                id={section.id}
                title={section.title}
                onClick={onSectionClick}
                t={t}
              >
                {renderCustomItems(section.items, {
                  wrapper: SPACE.itemGap,
                  title: TYPE.itemTitle,
                  meta: TYPE.itemMeta,
                  sub: TYPE.itemSub,
                  body: TYPE.body,
                })}
              </Section>
            );
          })}
        </div>
      </div>
    );
  },
);

MinimalTemplate.displayName = 'MinimalTemplate';
