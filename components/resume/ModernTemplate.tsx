'use client';

import React, { forwardRef } from 'react';
import { DEFAULT_SECTION_ORDER } from '@/lib/consts';
import { DEFAULT_DESIGN, designCssVars } from '@/lib/design';
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
  name: 'text-[17pt] font-bold text-slate-900',
  jobTitle: 'text-[10.5pt] font-medium text-slate-600',
  contact: 'text-[9pt] text-slate-700',
  sidebarTitle: 'text-[9.5pt] font-bold uppercase tracking-wide text-slate-700',
  mainTitle:
    'text-[11pt] font-bold uppercase tracking-wide [color:var(--cv-accent)]',
  itemTitle: 'text-[10.5pt] font-bold text-slate-900',
  itemMeta: 'text-[9.5pt] font-normal text-slate-500',
  itemSub: 'text-[9.5pt] italic text-slate-600',
  body: 'text-[9.5pt] leading-snug text-slate-700',
} as const;

const SPACE = {
  sectionGap: '[margin-bottom:var(--cv-section-gap)]',
  itemGap: '[margin-bottom:var(--cv-item-gap)]',
} as const;

const MAIN_HEADING =
  `${TYPE.mainTitle} mb-[6pt] break-after-avoid border-b border-slate-300 pb-[2pt]` as const;
const SIDEBAR_HEADING =
  `${TYPE.sidebarTitle} mb-[3pt] border-b border-slate-300 pb-[2pt]` as const;

const CORE_CLASSES = {
  itemTitle: TYPE.itemTitle,
  itemMeta: TYPE.itemMeta,
  itemSub: TYPE.itemSub,
  body: TYPE.body,
  itemGap: SPACE.itemGap,
} as const;

const MAIN_RENDERERS = createCoreSectionRenderers({
  headingClassName: MAIN_HEADING,
  sectionClassName: SPACE.sectionGap,
  classes: CORE_CLASSES,
});

export const ModernTemplate = forwardRef<HTMLDivElement, TemplateProps>(
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
      accentFallback: '#0369a1',
      fontFallback: 'sans',
    });

    const visible = withoutHidden(
      sectionOrder ?? DEFAULT_SECTION_ORDER,
      hiddenSections,
    );
    const mainOrder = visible.filter(
      (id) => id !== 'skills' && id !== 'certifications',
    );
    const sidebarOrder = visible.filter(
      (id) => id === 'skills' || id === 'certifications',
    );

    const context: SectionContext = { onClick: onSectionClick, t };

    const sidebarSections: Record<
      'skills' | 'certifications',
      (() => React.ReactNode) | null
    > = {
      skills: () =>
        cvData.skills.length === 0 ? null : (
          <TemplateSection
            id="skills"
            title={t('template.skills')}
            onClick={onSectionClick}
            t={t}
            headingClassName={SIDEBAR_HEADING}
            className={SPACE.sectionGap}
          >
            {cvData.skills.map((skill, index) => (
              <div key={index} className="mb-1 text-[9pt]">
                <span className="font-semibold text-slate-900">
                  {skill.category}:
                </span>{' '}
                <span className="text-slate-700">{skill.items}</span>
              </div>
            ))}
          </TemplateSection>
        ),
      certifications: () =>
        cvData.certifications.length === 0 ? null : (
          <TemplateSection
            id="certifications"
            title={t('template.certifications')}
            onClick={onSectionClick}
            t={t}
            headingClassName={SIDEBAR_HEADING}
            className={SPACE.sectionGap}
          >
            {cvData.certifications.map((cert, index) => (
              <div key={index} className="mb-1.5 text-[9pt]">
                <div className="font-semibold text-slate-900">{cert.name}</div>
                {cert.issuer && (
                  <div className="text-slate-600">{cert.issuer}</div>
                )}
                {cert.date && (
                  <div className="text-[8.5pt] text-slate-500">{cert.date}</div>
                )}
              </div>
            ))}
          </TemplateSection>
        ),
    };

    return (
      <div
        ref={ref}
        style={{ ...styleVars, fontFamily: 'var(--cv-font)' }}
        className="mx-auto bg-white shadow-2xl print:shadow-none"
      >
        <PrintStyle pageSize={design?.pageSize} />

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <td>
                <div className="h-[1cm] w-full"></div>
              </td>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="align-top">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="w-[5.5cm] bg-gray-100 px-[0.75cm] pt-[1cm] pb-[1cm] align-top">
                        <TemplateHeader
                          onClick={onSectionClick}
                          t={t}
                          className="mb-5 text-center"
                        >
                          <ResumePhoto
                            photo={photo}
                            className="mx-auto mb-3 h-[2.8cm] w-[2.8cm] rounded-full object-cover"
                          />

                          <h1 className={`${TYPE.name} mb-1 leading-tight`}>
                            {cvData.name || t('template.yourName')}
                          </h1>

                          {cvData.jobTitle && (
                            <div className={TYPE.jobTitle}>
                              {cvData.jobTitle}
                            </div>
                          )}
                        </TemplateHeader>

                        <div className="mb-4">
                          <h2
                            className={`${TYPE.sidebarTitle} mb-[3pt] border-b border-slate-300 pb-[2pt]`}
                          >
                            {t('template.contact')}
                          </h2>
                          <div className={`space-y-1 ${TYPE.contact}`}>
                            {cvData.email && <div>{cvData.email}</div>}
                            {cvData.phone && <div>{cvData.phone}</div>}
                            {cvData.location && <div>{cvData.location}</div>}
                            {cvData.links.map(
                              (link, idx) =>
                                link.url && (
                                  <a
                                    key={idx}
                                    href={formatUrl(link.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block break-all hover:underline"
                                  >
                                    {link.url}
                                  </a>
                                ),
                            )}
                          </div>
                        </div>

                        {sidebarOrder.map((id) =>
                          id === 'skills' || id === 'certifications' ? (
                            <React.Fragment key={id}>
                              {sidebarSections[
                                id as 'skills' | 'certifications'
                              ]?.()}
                            </React.Fragment>
                          ) : null,
                        )}
                      </td>

                      <td className="px-[1cm] pt-[1cm] pb-[1cm] align-top">
                        {resolveTemplateOrder(mainOrder, cvData).map((id) => {
                          const builtin = isBuiltinSection(id)
                            ? MAIN_RENDERERS[
                                id as keyof typeof MAIN_RENDERERS
                              ]?.(cvData, context)
                            : null;
                          if (builtin)
                            return (
                              <React.Fragment key={id}>
                                {builtin}
                              </React.Fragment>
                            );
                          const section = cvData.customSections?.[id];
                          if (!section) return null;
                          return (
                            <TemplateCustomSection
                              key={id}
                              section={section}
                              onClick={onSectionClick}
                              t={t}
                              headingClassName={MAIN_HEADING}
                              sectionClassName={SPACE.sectionGap}
                              classes={CORE_CLASSES}
                            />
                          );
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td>
                <div className="h-[1cm] w-full"></div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  },
);

ModernTemplate.displayName = 'ModernTemplate';
