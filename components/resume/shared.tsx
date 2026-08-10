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

/** Shared print CSS so every template paginates identically in the browser. */
export function PrintStyle() {
  return (
    <style type="text/css" media="print">
      {PRINT_CSS}
    </style>
  );
}
