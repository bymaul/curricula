'use client';

import { useI18n } from '@/components/I18nProvider';
import { TEMPLATE_COMPONENTS } from '@/components/resume/registry';
import { DesignSettings } from '@/lib/design';
import { getPageDimensions } from '@/lib/pagination';
import { CVData } from '@/lib/schema';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { TEMPLATES, TemplateId } from '@/lib/templates';
import { cn } from '@/lib/utils';
import { SectionId } from '@/lib/consts';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';

interface TemplatePickerProps {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
  cvData: CVData;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
  language?: ResumeLanguage;
  photo?: string;
  design?: DesignSettings;
}

export function TemplatePicker({
  value,
  onChange,
  cvData,
  sectionOrder,
  hiddenSections,
  language,
  photo,
  design,
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
      className="grid w-full grid-cols-3 gap-2"
    >
      {TEMPLATES.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          selected={template.id === value}
          onSelect={() => onChange(template.id)}
          cvData={cvData}
          sectionOrder={sectionOrder}
          hiddenSections={hiddenSections}
          language={language}
          photo={photo}
          design={design}
        />
      ))}
    </div>
  );
}

function usePreviewScale(pageWidthPx: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / pageWidthPx);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageWidthPx]);

  return { ref, scale };
}

interface TemplateCardProps {
  template: (typeof TEMPLATES)[number];
  selected: boolean;
  onSelect: () => void;
  cvData: CVData;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
  language?: ResumeLanguage;
  photo?: string;
  design?: DesignSettings;
}

function TemplateCard({
  template,
  selected,
  onSelect,
  cvData,
  sectionOrder,
  hiddenSections,
  language,
  photo,
  design,
}: TemplateCardProps) {
  const { t } = useI18n();
  const page = getPageDimensions(design?.pageSize);
  const { ref, scale } = usePreviewScale(page.width);
  const Preview = TEMPLATE_COMPONENTS[template.id];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-value={template.id}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className={cn(
        'flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-lg p-1 text-left transition-colors outline-none',
        'focus-visible:ring-ring/50 focus-visible:ring-3',
        selected
          ? 'bg-primary/10 ring-primary/50 ring-2'
          : 'hover:bg-muted focus-visible:rounded-lg',
      )}
    >
      <div
        ref={ref}
        className="border-border relative w-full overflow-hidden rounded-md border bg-white"
        style={{ aspectRatio: `${page.width} / ${page.height}` }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 origin-top-left text-black select-none"
          style={{
            width: page.width,
            transform: `scale(${scale})`,
            visibility: scale > 0 ? 'visible' : 'hidden',
          }}
        >
          <Preview
            cvData={cvData}
            sectionOrder={sectionOrder}
            hiddenSections={hiddenSections}
            language={language}
            photo={photo}
            design={design}
          />
        </div>
      </div>
      <span
        className={cn(
          'max-w-full truncate text-xs font-medium',
          selected ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {t(`templates.${template.id}.name`)}
      </span>
    </button>
  );
}
