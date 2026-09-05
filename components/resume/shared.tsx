'use client';

import React from 'react';
import { DesignSettings, PageSizeId } from '@/lib/design';
import { BuiltinSectionId, SectionId } from '@/lib/consts';
import { TranslationKey, translate } from '@/lib/i18n';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { printCss } from '@/lib/print';
import { CVData, CustomSectionItem } from '@/lib/schema';

export interface TemplateProps {
  cvData: CVData;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
  language?: ResumeLanguage;
  photo?: string;
  design?: DesignSettings;
  onSectionClick?: (sectionId: SectionId) => void;
}

export type T = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

export interface SectionContext {
  onClick?: (sectionId: SectionId) => void;
  t: T;
}

export function renderFormattedText(text: string, textClassName = '') {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentBullets: string[] = [];

  const flushBullets = (key: number) => {
    if (currentBullets.length === 0) return;
    elements.push(
      <ul
        key={`ul-${key}`}
        className={`mt-1 ml-5 list-outside list-disc ${textClassName}`}
      >
        {currentBullets.map((bullet, idx) => (
          <li key={idx} className="mb-0.5 pl-1">
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
        <p key={`p-${i}`} className={`mt-1 text-justify ${textClassName}`}>
          {trimmed}
        </p>,
      );
    }
  });

  flushBullets(lines.length);

  return <div>{elements}</div>;
}

export const formatUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
};

export const INTERACTIVE_CLASSES =
  'cursor-pointer hover:outline-dashed hover:outline-1 hover:-outline-offset-1 hover:outline-black/25 focus:outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-black/40';

export function sectionClickProps(
  id: SectionId,
  onClick?: (sectionId: SectionId) => void,
) {
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

export function headerClickProps(onClick?: (sectionId: SectionId) => void) {
  return sectionClickProps('summary', onClick);
}

export function ItemHeader({
  title,
  meta,
  titleClass = '',
  metaClass = '',
}: {
  title: string;
  meta?: string;
  titleClass?: string;
  metaClass?: string;
}) {
  return (
    <div className={`flex justify-between ${titleClass}`}>
      <span>{title}</span>
      {meta && <span className={metaClass}>{meta}</span>}
    </div>
  );
}

export function ItemSub({
  left,
  right,
  className = '',
}: {
  left?: string;
  right?: string;
  className?: string;
}) {
  if (!left && !right) return null;
  return (
    <div className={`mb-[2pt] flex justify-between ${className}`}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

export function PrintStyle({ pageSize }: { pageSize?: PageSizeId }) {
  return (
    <style type="text/css" media="print">
      {printCss(pageSize ?? 'a4')}
    </style>
  );
}

export function resolveTemplateOrder(order: SectionId[], cvData: CVData) {
  const known = new Set(order);
  const missing = Object.keys(cvData.customSections ?? {}).filter(
    (id) => !known.has(id),
  );
  return [...order, ...missing];
}

export function isBuiltinSection(id: SectionId): id is BuiltinSectionId {
  return SECTION_BUILTIN_SET.has(id as BuiltinSectionId);
}

const SECTION_BUILTIN_SET = new Set<BuiltinSectionId>([
  'summary',
  'experience',
  'projects',
  'education',
  'skills',
  'certifications',
]);

interface CustomItemClassNames {
  wrapper?: string;
  title?: string;
  meta?: string;
  sub?: string;
  body?: string;
}

export function renderCustomItems(
  items: CustomSectionItem[],
  classNames: CustomItemClassNames,
) {
  return items.map((item, index) => (
    <div
      key={index}
      className={`${classNames.wrapper ?? 'mb-[7pt]'} break-inside-avoid`}
    >
      {(item.title || item.date) && (
        <ItemHeader
          title={item.title}
          meta={item.date}
          titleClass={classNames.title}
          metaClass={classNames.meta}
        />
      )}
      <ItemSub
        left={item.subtitle}
        right={item.location}
        className={classNames.sub}
      />
      {renderFormattedText(item.description ?? '', classNames.body)}
    </div>
  ));
}

export function templateT(language?: ResumeLanguage): T {
  return (key, params) => translate(language ?? 'en', key, params);
}

export function withoutHidden(
  order: SectionId[],
  hidden?: SectionId[],
): SectionId[] {
  if (!hidden || hidden.length === 0) return [...order];
  const set = new Set(hidden);
  return order.filter((id) => !set.has(id));
}

export function ResumePhoto({
  photo,
  className,
}: {
  photo?: string;
  className: string;
}) {
  if (!photo) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={photo} alt="" className={className} />;
}

export function TemplateSection({
  id,
  title,
  onClick,
  t,
  headingClassName,
  className = '',
  avoidBreakAfter = false,
  children,
}: {
  id: SectionId;
  title: string;
  onClick?: (sectionId: SectionId) => void;
  t: T;
  headingClassName: string;
  className?: string;
  avoidBreakAfter?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      data-section-id={id}
      {...sectionClickProps(id, onClick)}
      aria-label={onClick ? t('template.editAria', { title }) : undefined}
      className={`${className} ${avoidBreakAfter ? 'break-after-avoid' : ''} ${onClick ? INTERACTIVE_CLASSES : ''}`}
    >
      <h2 className={headingClassName}>{title}</h2>
      {children}
    </section>
  );
}

export function TemplateHeader({
  onClick,
  t,
  className,
  children,
}: {
  onClick?: (sectionId: SectionId) => void;
  t: T;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-section-id="summary"
      {...headerClickProps(onClick)}
      aria-label={
        onClick
          ? t('template.editAria', { title: t('personalDetails.title') })
          : undefined
      }
      className={`${className} ${onClick ? INTERACTIVE_CLASSES : ''}`}
    >
      {children}
    </div>
  );
}

export interface CoreItemClasses {
  itemTitle: string;
  itemMeta: string;
  itemSub: string;
  body: string;
  itemGap: string;
}

export interface CoreSectionsOptions {
  headingClassName: string;
  sectionClassName: string;
  classes: CoreItemClasses;
}

type CoreSectionId = 'summary' | 'experience' | 'projects' | 'education';

export function createCoreSectionRenderers({
  headingClassName,
  sectionClassName,
  classes,
}: CoreSectionsOptions): Record<
  CoreSectionId,
  (cvData: CVData, context: SectionContext) => React.ReactNode
> {
  const section = (
    id: SectionId,
    title: string,
    context: SectionContext,
    children: React.ReactNode,
  ) => (
    <TemplateSection
      id={id}
      title={title}
      onClick={context.onClick}
      t={context.t}
      headingClassName={headingClassName}
      className={sectionClassName}
    >
      {children}
    </TemplateSection>
  );

  return {
    summary: (cvData, context) =>
      cvData.summary ? (
        <>
          {section(
            'summary',
            context.t('template.summary'),
            context,
            <p className={`text-justify ${classes.body}`}>{cvData.summary}</p>,
          )}
        </>
      ) : null,
    experience: (cvData, context) =>
      cvData.experience.length > 0 ? (
        <>
          {section(
            'experience',
            context.t('template.experience'),
            context,
            <>
              {cvData.experience.map((exp, index) => (
                <div
                  key={index}
                  className={`${classes.itemGap} break-inside-avoid`}
                >
                  <ItemHeader
                    title={exp.role}
                    meta={exp.date}
                    titleClass={classes.itemTitle}
                    metaClass={classes.itemMeta}
                  />
                  <ItemSub
                    left={exp.company}
                    right={exp.location}
                    className={classes.itemSub}
                  />
                  {renderFormattedText(exp.description, classes.body)}
                </div>
              ))}
            </>,
          )}
        </>
      ) : null,
    projects: (cvData, context) =>
      cvData.projects.length > 0 ? (
        <>
          {section(
            'projects',
            context.t('template.projects'),
            context,
            <>
              {cvData.projects.map((proj, index) => (
                <div
                  key={index}
                  className={`${classes.itemGap} break-inside-avoid`}
                >
                  <ItemHeader
                    title={proj.name}
                    meta={proj.date}
                    titleClass={classes.itemTitle}
                    metaClass={classes.itemMeta}
                  />
                  {renderFormattedText(proj.description, classes.body)}
                </div>
              ))}
            </>,
          )}
        </>
      ) : null,
    education: (cvData, context) =>
      cvData.education.length > 0 ? (
        <>
          {section(
            'education',
            context.t('template.education'),
            context,
            <>
              {cvData.education.map((edu, index) => (
                <div
                  key={index}
                  className={`${classes.itemGap} break-inside-avoid`}
                >
                  <ItemHeader
                    title={edu.institution}
                    meta={edu.date}
                    titleClass={classes.itemTitle}
                    metaClass={classes.itemMeta}
                  />
                  <ItemSub
                    left={edu.degree}
                    right={edu.location}
                    className={classes.itemSub}
                  />
                  {renderFormattedText(edu.description, classes.body)}
                </div>
              ))}
            </>,
          )}
        </>
      ) : null,
  };
}

export function TemplateCustomSection({
  section,
  onClick,
  t,
  headingClassName,
  sectionClassName = '',
  classes,
}: {
  section: { id: string; title: string; items: CustomSectionItem[] };
  onClick?: (sectionId: SectionId) => void;
  t: T;
  headingClassName: string;
  sectionClassName?: string;
  classes: CoreItemClasses;
}) {
  return (
    <TemplateSection
      id={section.id}
      title={section.title}
      onClick={onClick}
      t={t}
      headingClassName={headingClassName}
      className={sectionClassName}
    >
      {renderCustomItems(section.items, {
        wrapper: classes.itemGap,
        title: classes.itemTitle,
        meta: classes.itemMeta,
        sub: classes.itemSub,
        body: classes.body,
      })}
    </TemplateSection>
  );
}
