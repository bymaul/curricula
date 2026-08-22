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
  sectionClickProps,
  headerClickProps,
  INTERACTIVE_CLASSES,
  ItemHeader,
  ItemSub,
} from './shared';

type MainSectionId = Exclude<SectionId, 'skills' | 'certifications'>;

const TYPE = {
  name: 'text-[17pt] font-bold text-slate-900',
  jobTitle: 'text-[10.5pt] font-medium text-slate-600',
  contact: 'text-[9pt] text-slate-700',
  sidebarTitle: 'text-[9.5pt] font-bold uppercase tracking-wide text-slate-700',
  mainTitle: 'text-[11pt] font-bold uppercase tracking-wide text-sky-700',
  itemTitle: 'text-[10.5pt] font-bold text-slate-900',
  itemMeta: 'text-[9.5pt] font-normal text-slate-500',
  itemSub: 'text-[9.5pt] italic text-slate-600',
  body: 'text-[9.5pt] leading-snug text-slate-700',
} as const;

type SectionRenderer = (
  cvData: CVData,
  context: SectionContext,
) => React.ReactNode;

/** Accent-underlined section heading for the main column. */
function MainSection({
  id,
  title,
  onClick,
  t,
  children,
}: {
  id: MainSectionId;
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
      className={`mb-[10pt] ${onClick ? INTERACTIVE_CLASSES : ''}`}
    >
      <h2
        className={`${TYPE.mainTitle} border-b border-slate-300 pb-[2pt] mb-[6pt] break-after-avoid`}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Understated heading for the sidebar. */
function SidebarSection({
  id,
  title,
  onClick,
  t,
  children,
}: {
  id: 'skills' | 'certifications';
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
      className={`mb-4 ${onClick ? INTERACTIVE_CLASSES : ''}`}
    >
      <h2
        className={`${TYPE.sidebarTitle} border-b border-slate-300 pb-[2pt] mb-[3pt]`}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

const MAIN_SECTION_RENDERERS: Record<MainSectionId, SectionRenderer> = {
  summary: (cvData, { onClick, t }) =>
    cvData.summary ? (
      <MainSection
        id="summary"
        title={t('template.summary')}
        onClick={onClick}
        t={t}
      >
        <p className={`text-justify ${TYPE.body}`}>{cvData.summary}</p>
      </MainSection>
    ) : null,
  experience: (cvData, { onClick, t }) =>
    cvData.experience.length > 0 ? (
      <MainSection
        id="experience"
        title={t('template.experience')}
        onClick={onClick}
        t={t}
      >
        {cvData.experience.map((exp, index) => (
          <div key={index} className="mb-[7pt] break-inside-avoid">
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
      </MainSection>
    ) : null,
  projects: (cvData, { onClick, t }) =>
    cvData.projects.length > 0 ? (
      <MainSection
        id="projects"
        title={t('template.projects')}
        onClick={onClick}
        t={t}
      >
        {cvData.projects.map((proj, index) => (
          <div key={index} className="mb-[7pt] break-inside-avoid">
            <ItemHeader
              title={proj.name}
              meta={proj.date}
              titleClass={TYPE.itemTitle}
              metaClass={TYPE.itemMeta}
            />
            {renderFormattedText(proj.description, TYPE.body)}
          </div>
        ))}
      </MainSection>
    ) : null,
  education: (cvData, { onClick, t }) =>
    cvData.education.length > 0 ? (
      <MainSection
        id="education"
        title={t('template.education')}
        onClick={onClick}
        t={t}
      >
        {cvData.education.map((edu, index) => (
          <div key={index} className="mb-[7pt] break-inside-avoid">
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
      </MainSection>
    ) : null,
};

export const ModernTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  (
    { cvData, sectionOrder, hiddenSections, language, photo, onSectionClick },
    ref,
  ) => {
    const t: T = (key, params) => translate(language ?? 'en', key, params);
    const hidden = new Set(hiddenSections ?? []);

    const mainOrder = (sectionOrder ?? DEFAULT_SECTION_ORDER).filter(
      (id) => !hidden.has(id) && id !== 'skills' && id !== 'certifications',
    );
    const sidebarOrder = (sectionOrder ?? DEFAULT_SECTION_ORDER).filter(
      (id) => !hidden.has(id) && (id === 'skills' || id === 'certifications'),
    );

    const context: SectionContext = { onClick: onSectionClick, t };

    const sidebarSections: Record<
      'skills' | 'certifications',
      (() => React.ReactNode) | null
    > = {
      skills: () =>
        cvData.skills.length === 0 ? null : (
          <SidebarSection
            id="skills"
            title={t('template.skills')}
            onClick={onSectionClick}
            t={t}
          >
            {cvData.skills.map((skill, index) => (
              <div key={index} className="mb-1 text-[9pt]">
                <span className="font-semibold text-slate-900">
                  {skill.category}:
                </span>{' '}
                <span className="text-slate-700">{skill.items}</span>
              </div>
            ))}
          </SidebarSection>
        ),
      certifications: () =>
        cvData.certifications.length === 0 ? null : (
          <SidebarSection
            id="certifications"
            title={t('template.certifications')}
            onClick={onSectionClick}
            t={t}
          >
            {cvData.certifications.map((cert, index) => (
              <div key={index} className="mb-1.5 text-[9pt]">
                <div className="font-semibold text-slate-900">{cert.name}</div>
                {cert.issuer && (
                  <div className="text-slate-600">{cert.issuer}</div>
                )}
                {cert.date && (
                  <div className="text-slate-500 text-[8.5pt]">{cert.date}</div>
                )}
              </div>
            ))}
          </SidebarSection>
        ),
    };

    return (
      <div ref={ref} className="mx-auto shadow-2xl print:shadow-none bg-white">
        <PrintStyle />

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
                      <td className="w-[5.5cm] align-top bg-gray-100 px-[0.75cm] pt-[1cm] pb-[1cm]">
                        {/* --- SIDEBAR HEADER --- */}
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
                          className={`text-center mb-5 ${onSectionClick ? INTERACTIVE_CLASSES : ''}`}
                        >
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo}
                              alt=""
                              className="mx-auto mb-3 h-[2.8cm] w-[2.8cm] rounded-full object-cover"
                            />
                          ) : null}

                          <h1 className={`${TYPE.name} mb-1 leading-tight`}>
                            {cvData.name || t('template.yourName')}
                          </h1>

                          {cvData.jobTitle && (
                            <div className={TYPE.jobTitle}>
                              {cvData.jobTitle}
                            </div>
                          )}
                        </div>

                        {/* --- SIDEBAR CONTACT --- */}
                        <div className="mb-4">
                          <h2
                            className={`${TYPE.sidebarTitle} border-b border-slate-300 pb-[2pt] mb-[3pt]`}
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

                        {/* --- SIDEBAR SECTIONS (skills/certifications) --- */}
                        {sidebarOrder.map((id) =>
                          id === 'skills' || id === 'certifications' ? (
                            <React.Fragment key={id}>
                              {sidebarSections[id]?.()}
                            </React.Fragment>
                          ) : null,
                        )}
                      </td>

                      {/* --- MAIN CONTENT --- */}
                      <td className="align-top px-[1cm] pt-[1cm] pb-[1cm]">
                        {mainOrder.map((id) => (
                          <React.Fragment key={id}>
                            {MAIN_SECTION_RENDERERS[id as MainSectionId]?.(
                              cvData,
                              context,
                            )}
                          </React.Fragment>
                        ))}
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
