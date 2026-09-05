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
  name: 'text-[16pt] font-bold uppercase tracking-wide',
  jobTitle: 'text-[11pt] font-medium',
  contact: 'text-[9.5pt]',
  sectionTitle: 'text-[11pt] font-bold uppercase [color:var(--cv-accent)]',
  itemTitle: 'text-[10.5pt] font-bold',
  itemMeta: 'text-[10pt] font-normal',
  itemSubtitle: 'text-[10pt] italic',
  body: 'text-[10pt]',
} as const;

const SPACE = {
  pageMargin: 'px-[2cm]',
  pageCap: 'h-[1.5cm]',
  sectionGap: '[margin-bottom:var(--cv-section-gap)]',
  itemGap: '[margin-bottom:var(--cv-item-gap)]',
  sectionTitleGap: 'mb-[3pt] pb-[1pt]',
} as const;

const HEADING =
  `${TYPE.sectionTitle} border-b [border-color:var(--cv-accent)] ${SPACE.sectionTitleGap} break-after-avoid` as const;

const CORE = createCoreSectionRenderers({
  headingClassName: HEADING,
  sectionClassName: SPACE.sectionGap,
  classes: {
    itemTitle: TYPE.itemTitle,
    itemMeta: TYPE.itemMeta,
    itemSub: TYPE.itemSubtitle,
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
        headingClassName={HEADING}
        className={SPACE.sectionGap}
        avoidBreakAfter
      >
        {cvData.skills.map((skill, index) => (
          <div key={index} className="mb-1 text-[10.5pt]">
            <span className="font-semibold">{skill.category}:</span>{' '}
            {skill.items}
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
        headingClassName={HEADING}
        className={SPACE.sectionGap}
        avoidBreakAfter
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
      </TemplateSection>
    ) : null,
};

export const HarvardTemplate = forwardRef<HTMLDivElement, TemplateProps>(
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
      accentFallback: '#000000',
      fontFallback: 'serif',
    });

    const order = withoutHidden(
      sectionOrder ?? DEFAULT_SECTION_ORDER,
      hiddenSections,
    );

    const context: SectionContext = { onClick: onSectionClick, t };

    return (
      <div
        ref={ref}
        style={styleVars}
        className="mx-auto bg-white shadow-2xl print:shadow-none"
      >
        <PrintStyle pageSize={design?.pageSize} />

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
                className={`${SPACE.pageMargin} align-top leading-snug text-black`}
                style={{ fontFamily: 'var(--cv-font)' }}
              >
                <TemplateHeader
                  onClick={onSectionClick}
                  t={t}
                  className="mb-4 text-center"
                >
                  <ResumePhoto
                    photo={photo}
                    className="mx-auto mb-2 h-[3cm] w-[3cm] rounded-full object-cover"
                  />

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
                      headingClassName={HEADING}
                      sectionClassName={SPACE.sectionGap}
                      classes={{
                        itemTitle: TYPE.itemTitle,
                        itemMeta: TYPE.itemMeta,
                        itemSub: TYPE.itemSubtitle,
                        body: TYPE.body,
                        itemGap: SPACE.itemGap,
                      }}
                    />
                  );
                })}
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
