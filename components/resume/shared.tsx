'use client';

import React from 'react';
import { SectionId } from '@/lib/consts';
import { TranslationKey } from '@/lib/i18n';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { PRINT_CSS } from '@/lib/print';
import { CVData } from '@/lib/schema';

export interface TemplateProps {
  cvData: CVData;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
  language?: ResumeLanguage;
  photo?: string;
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

/**
 * Parses a free-text field into paragraphs and "- " bullet groups.
 * Defined here so every template shares the same formatting rules.
 * `textClassName` is applied to paragraphs and bullet lists so each
 * template can keep its own type scale.
 */
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
        className={`list-disc list-outside ml-5 mt-1 ${textClassName}`}
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
  'cursor-pointer hover:ring-1 hover:ring-primary/40 hover:rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded-sm';

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

/** Bold title on the left, meta (usually a date) on the right. */
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

/** Italic subtitle row, e.g. company/location or degree/location. */
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
    <div className={`flex justify-between mb-[2pt] ${className}`}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

/** Shared print CSS so every template paginates identically in the browser. */
export function PrintStyle() {
  return (
    <style type="text/css" media="print">
      {PRINT_CSS}
    </style>
  );
}
