'use client';

import { useI18n } from '@/components/I18nProvider';
import { TEMPLATE_COMPONENTS } from '@/components/resume/registry';
import { PAGE_WIDTH_PX } from '@/lib/pagination';
import { CVData } from '@/lib/schema';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { TEMPLATES, TemplateId } from '@/lib/templates';
import { cn } from '@/lib/utils';
import { SectionId } from '@/lib/consts';
import { KeyboardEvent, useRef } from 'react';

const PREVIEW_SCALE = 0.12;

interface TemplatePickerProps {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
  cvData: CVData;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
  language?: ResumeLanguage;
  photo?: string;
}

export function TemplatePicker({
  value,
  onChange,
  cvData,
  sectionOrder,
  hiddenSections,
  language,
  photo,
}: TemplatePickerProps) {
  const { t } = useI18n();
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const directions: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    const delta = directions[event.key];
    if (!delta) return;
    event.preventDefault();
    const index = TEMPLATES.findIndex((template) => template.id === value);
    const next = (index + delta + TEMPLATES.length) % TEMPLATES.length;
    const nextId = TEMPLATES[next].id;
    onChange(nextId);
    listRef.current
      ?.querySelector<HTMLButtonElement>(`[data-value="${nextId}"]`)
      ?.focus();
  };

  return (
    <div
      ref={listRef}
      role="radiogroup"
      aria-label={t('personalDetails.templateLabel')}
      onKeyDown={handleKeyDown}
      className="flex gap-3"
    >
      {TEMPLATES.map((template) => {
        const selected = template.id === value;
        const Preview = TEMPLATE_COMPONENTS[template.id];
        return (
          <button
            key={template.id}
            type="button"
            role="radio"
            aria-checked={selected}
            data-value={template.id}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(template.id)}
            className={cn(
              'group flex flex-col items-center gap-1.5 rounded-lg p-1.5 outline-none transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:rounded-lg',
              selected
                ? 'bg-primary/10 ring-2 ring-primary/50'
                : 'hover:bg-muted cursor-pointer',
            )}
          >
            <div className="relative w-[96px] aspect-[794/1123] overflow-hidden rounded-md border border-border bg-white">
              <div
                aria-hidden="true"
                className="pointer-events-none select-none absolute top-0 left-0 origin-top-left text-black"
                style={{
                  width: PAGE_WIDTH_PX,
                  transform: `scale(${PREVIEW_SCALE})`,
                }}
              >
                <Preview
                  cvData={cvData}
                  sectionOrder={sectionOrder}
                  hiddenSections={hiddenSections}
                  language={language}
                  photo={photo}
                />
              </div>
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                selected ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {t(`templates.${template.id}.name`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
