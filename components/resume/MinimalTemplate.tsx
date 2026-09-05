'use client';

import React, { forwardRef } from 'react';
import { BuiltinSectionId, DEFAULT_SECTION_ORDER } from '@/lib/consts';
import { DEFAULT_DESIGN, designCssVars } from '@/lib/design';
import { CVData } from '@/lib/schema';
import {
  PrintStyle,
  TemplateProps,
  SectionContext,
  formatUrl,
  resolveTemplateOrder,
  isBuiltinSection,
  TemplateSection,
  TemplateHeader,
  TemplateCustomSection,
  ResumePhoto,
  templateT,
  withoutHidden,
  createCoreSectionRenderers,
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

const CORE = createCoreSectionRenderers({
  headingClassName: TYPE.heading,
  sectionClassName: SPACE.sectionGap,
  classes: {
    itemTitle: TYPE.itemTitle,
    itemMeta: TYPE.itemMeta,
    itemSub: TYPE.itemSub,
    body: TYPE.body,
    itemGap: SPACE.itemGap,
  },
});

type SectionRenderer = (
  cvData: CVData,
  context: SectionContext,
) => React.ReactNode;

const SECTION_RENDERERS: Record<BuiltinSectionId, SectionRenderer> = {
  ...CORE,
  skills: (cvData, { onClick, t }) =>
    cvData.skills.length > 0 ? (
      <TemplateSection
        id="skills"
        title={t('template.skills')}
        onClick={onClick}
        t={t}
        headingClassName={TYPE.heading}
        className={SPACE.sectionGap}
      >
        {cvData.skills.map((skill, index) => (
          <div key={index} className="mb-1 text-[9.5pt]">
            <span className="font-semibold text-slate-900">
              {skill.category}:
            </span>{' '}
            <span className="text-slate-700">{skill.items}</span>
          </div>
        ))}
      </TemplateSection>
    ) : null,
  certifications: (cvData, { onClick, t }) =>
    cvData.certifications.length > 0 ? (
      <TemplateSection
        id="certifications"
        title={t('template.certifications')}
        onClick={onClick}
        t={t}
        headingClassName={TYPE.heading}
        className={SPACE.sectionGap}
      >
        {cvData.certifications.map((cert, index) => (
          <div
            key={index}
            className={`${SPACE.itemGap} break-inside-avoid text-[9.5pt]`}
          >
            <div className="flex justify-between">
              <span className="font-semibold text-slate-900">{cert.name}</span>
              {cert.date && <span className={TYPE.itemMeta}>{cert.date}</span>}
            </div>
            {cert.issuer && <div className="text-slate-600">{cert.issuer}</div>}
          </div>
        ))}
      </TemplateSection>
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
    const t = templateT(language);
    const styleVars = designCssVars(design ?? DEFAULT_DESIGN, {
      accentFallback: '#0f172a',
      fontFallback: 'sans',
    });

    const order = withoutHidden(
      sectionOrder ?? DEFAULT_SECTION_ORDER,
      hiddenSections,
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
        className="mx-auto bg-white shadow-2xl print:shadow-none"
      >
        <PrintStyle pageSize={design?.pageSize} />

        <div className="px-[1.4cm] pt-[1cm] pb-[1cm]">
          <TemplateHeader onClick={onSectionClick} t={t} className="mb-[12pt]">
            <ResumePhoto
              photo={photo}
              className="mb-3 h-[2.4cm] w-[2.4cm] rounded-full object-cover"
            />

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
          </TemplateHeader>

          {resolveTemplateOrder(order, cvData).map((id) => {
            const builtin = isBuiltinSection(id)
              ? SECTION_RENDERERS[id](cvData, context)
              : null;
            if (builtin)
              return <React.Fragment key={id}>{builtin}</React.Fragment>;
            const section = cvData.customSections?.[id];
            if (!section) return null;
            return (
              <TemplateCustomSection
                key={id}
                section={section}
                onClick={onSectionClick}
                t={t}
                headingClassName={TYPE.heading}
                sectionClassName={SPACE.sectionGap}
                classes={{
                  itemTitle: TYPE.itemTitle,
                  itemMeta: TYPE.itemMeta,
                  itemSub: TYPE.itemSub,
                  body: TYPE.body,
                  itemGap: SPACE.itemGap,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  },
);

MinimalTemplate.displayName = 'MinimalTemplate';
