'use client';

import { useI18n } from '@/hooks/useI18n';
import { TEMPLATE_COMPONENTS } from '@/components/resume/registry';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { usePageScale } from '@/hooks/usePageScale';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import { getSectionIdFromTab, SectionId } from '@/lib/consts';
import { DesignSettings } from '@/lib/design';
import { computePageCount, getPageDimensions } from '@/lib/pagination';
import { CVData } from '@/lib/schema';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { TemplateId } from '@/lib/templates';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { FileText } from 'lucide-react';
import {
  RefObject,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { ZoomControls } from './ZoomControls';

const GUTTER_PX = 32;
const SCROLL_OFFSET_PX = 16;

interface LiveTemplateProps {
  printRef: RefObject<HTMLDivElement | null>;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
  language?: ResumeLanguage;
  photo?: string;
  design?: DesignSettings;
  templateId: TemplateId;
  onSectionClick?: (sectionId: SectionId) => void;
}

function LiveTemplate({
  printRef,
  sectionOrder,
  hiddenSections,
  language,
  photo,
  design,
  templateId,
  onSectionClick,
}: LiveTemplateProps) {
  const { control } = useFormContext<CVData>();
  const cvData = useWatch({ control }) as CVData;
  const ResumeTemplate = TEMPLATE_COMPONENTS[templateId];

  return (
    <ResumeTemplate
      ref={printRef}
      cvData={cvData}
      sectionOrder={sectionOrder}
      hiddenSections={hiddenSections}
      language={language}
      photo={photo}
      design={design}
      onSectionClick={onSectionClick}
    />
  );
}

interface ResumePreviewProps {
  printRef: RefObject<HTMLDivElement | null>;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
  language?: ResumeLanguage;
  photo?: string;
  design?: DesignSettings;
  templateId?: TemplateId;
  onSectionClick?: (sectionId: SectionId) => void;
}

function ResumePreviewImpl({
  printRef,
  sectionOrder,
  hiddenSections,
  language,
  photo,
  design,
  templateId = 'harvard',
  onSectionClick,
}: ResumePreviewProps) {
  const page = getPageDimensions(design?.pageSize);
  const frameWidthPx = page.width + GUTTER_PX * 2;

  const {
    panelRef,
    frameRef,
    scale,
    contentHeight,
    zoomTo,
    zoomIn,
    zoomOut,
    zoomReset,
    setAnchor,
    commitScale,
    minScale,
    maxScale,
  } = usePageScale({
    frameWidthPx,
    isVisible: true,
  });

  const anchoredZoom = useCallback(
    (next: number, clientX?: number, clientY?: number, immediate?: boolean) => {
      const panel = panelRef.current;
      if (!panel || clientX == null || clientY == null) {
        zoomTo(next, immediate);
        return;
      }
      const viewport = panel.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      if (!viewport) {
        zoomTo(next, immediate);
        return;
      }
      const rect = viewport.getBoundingClientRect();
      const vx = clientX - rect.left;
      const vy = clientY - rect.top;
      const docX = (viewport.scrollLeft + vx) / scale;
      const docY = (viewport.scrollTop + vy) / scale;
      setAnchor({ docX, docY, viewX: vx, viewY: vy });
      zoomTo(next, immediate);
    },
    [scale, zoomTo, setAnchor, panelRef],
  );

  const { containerRef } = usePinchZoom({
    scale,
    minScale,
    maxScale,
    onZoomChange: anchoredZoom,
    onGestureEnd: commitScale,
  });

  const setPanelRef = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    containerRef.current = node;
  };

  const handleZoomIn = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) {
      zoomIn();
      commitScale();
      return;
    }
    const viewport = panel.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) {
      zoomIn();
      commitScale();
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const current = scale;
    const next = Math.min(maxScale, +(current + 0.1).toFixed(2));
    anchoredZoom(next, rect.left + rect.width / 2, rect.top + rect.height / 2);
    commitScale();
  }, [scale, maxScale, zoomIn, anchoredZoom, commitScale, panelRef]);

  const handleZoomOut = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) {
      zoomOut();
      commitScale();
      return;
    }
    const viewport = panel.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) {
      zoomOut();
      commitScale();
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const current = scale;
    const next = Math.max(minScale, +(current - 0.1).toFixed(2));
    anchoredZoom(next, rect.left + rect.width / 2, rect.top + rect.height / 2);
    commitScale();
  }, [scale, minScale, zoomOut, anchoredZoom, commitScale, panelRef]);

  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    const el = printRef.current;
    if (!el) return;
    const update = () => {
      setPageCount(computePageCount(el.scrollHeight, page.height));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [printRef, page.height]);

  const pageBreaks = Array.from({ length: pageCount - 1 }, (_, i) => ({
    top: (i + 1) * page.height,
    label: i + 2,
  }));

  const activeTab = useUIStore((state) => state.activeTab);
  const { t } = useI18n();

  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    const sectionId = getSectionIdFromTab(activeTab);
    if (!sectionId) return;
    const panel = panelRef.current;
    if (!panel) return;
    const target = panel.querySelector<HTMLElement>(
      `[data-section-id="${sectionId}"]`,
    );
    const viewport = panel.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!target || !viewport) return;
    const delta =
      (target.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top) /
        scaleRef.current -
      SCROLL_OFFSET_PX;
    viewport.scrollTo({ top: viewport.scrollTop + delta, behavior: 'smooth' });
  }, [activeTab, panelRef]);

  return (
    <section
      ref={setPanelRef}
      data-template-id={templateId}
      className={cn(
        'bg-muted/10 border-border relative flex h-full w-full flex-1 touch-pan-x touch-pan-y flex-col overflow-hidden rounded-xl border shadow-inner print:overflow-visible print:border-none print:bg-transparent print:shadow-none',
      )}
    >
      <ZoomControls
        scale={scale}
        minScale={minScale}
        maxScale={maxScale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={zoomReset}
      />

      <div
        className="bg-card border-border absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 shadow-md print:hidden"
        aria-label={
          pageCount === 1
            ? t('preview.pageCountAriaOne', { count: pageCount })
            : t('preview.pageCountAriaMany', { count: pageCount })
        }
      >
        <FileText className="text-muted-foreground size-3.5" />
        <span className="text-muted-foreground text-xs font-semibold tabular-nums">
          {pageCount} {pageCount === 1 ? t('preview.page') : t('preview.pages')}
        </span>
      </div>

      <div className="min-h-0 flex-1 print:overflow-visible">
        <ScrollArea className="h-full w-full print:h-auto print:overflow-visible">
          <div className="min-h-full py-8 lg:py-16 print:block print:p-0 print:py-0">
            <div
              style={{
                width: frameWidthPx * scale,
                height: contentHeight * scale,
              }}
              className="relative mx-auto shrink-0 print:h-auto! print:w-full!"
            >
              <div
                ref={frameRef}
                style={{
                  width: frameWidthPx,
                  padding: `0 ${GUTTER_PX}px`,
                  boxSizing: 'border-box',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
                className="absolute top-0 left-0 print:static! print:w-full! print:transform-none! print:p-0!"
              >
                <div
                  style={{ width: page.width }}
                  className="relative bg-white text-black shadow-2xl print:w-full! print:shadow-none"
                >
                  <div className="overflow-hidden print:overflow-visible">
                    <LiveTemplate
                      printRef={printRef}
                      sectionOrder={sectionOrder}
                      hiddenSections={hiddenSections}
                      language={language}
                      photo={photo}
                      design={design}
                      templateId={templateId}
                      onSectionClick={onSectionClick}
                    />
                  </div>

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 print:hidden"
                  >
                    {pageBreaks.map(({ top, label }) => (
                      <div
                        key={top}
                        style={{ top }}
                        className="absolute right-0 left-0 z-10 flex -translate-y-1/2 items-center"
                      >
                        <div className="border-destructive/60 w-full border-t-2 border-dashed" />
                        <span className="bg-destructive/10 text-destructive absolute left-3 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold">
                          {t('preview.pageBreak', { number: label })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}

export const ResumePreview = memo(ResumePreviewImpl);
