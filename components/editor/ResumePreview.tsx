'use client';

import { useI18n } from '@/components/I18nProvider';
import { TEMPLATE_COMPONENTS } from '@/components/resume/registry';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePageScale } from '@/hooks/usePageScale';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import {
  DESKTOP_MEDIA_QUERY,
  getSectionIdFromTab,
  SectionId,
} from '@/lib/consts';
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
  useLayoutEffect,
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
  mobileActive: boolean;
  className?: string;
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
  mobileActive,
  className,
  onSectionClick,
}: ResumePreviewProps) {
  const isLargeScreen = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const isVisible = isLargeScreen || mobileActive;

  const page = getPageDimensions(design?.pageSize);
  const frameWidthPx = page.width + GUTTER_PX * 2;

  const {
    panelRef,
    frameRef,
    scale,
    frameHeight,
    zoomTo,
    zoomIn,
    zoomOut,
    zoomReset,
    minScale,
    maxScale,
  } = usePageScale({
    frameWidthPx,
    isVisible,
  });

  const anchorRef = useRef<{
    docX: number;
    docY: number;
    viewX: number;
    viewY: number;
  } | null>(null);

  const anchoredZoom = useCallback(
    (next: number, clientX?: number, clientY?: number) => {
      const panel = panelRef.current;
      if (!panel || clientX == null || clientY == null) {
        zoomTo(next);
        return;
      }
      const viewport = panel.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      if (!viewport) {
        zoomTo(next);
        return;
      }
      const rect = viewport.getBoundingClientRect();
      const vx = clientX - rect.left;
      const vy = clientY - rect.top;
      const docX = (viewport.scrollLeft + vx) / scale;
      const docY = (viewport.scrollTop + vy) / scale;
      anchorRef.current = { docX, docY, viewX: vx, viewY: vy };
      zoomTo(next);
    },
    [scale, zoomTo, panelRef],
  );

  const { containerRef } = usePinchZoom({
    scale,
    minScale,
    maxScale,
    onZoomChange: anchoredZoom,
  });

  const setPanelRef = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    containerRef.current = node;
  };

  useLayoutEffect(() => {
    if (!anchorRef.current) return;
    const { docX, docY, viewX, viewY } = anchorRef.current;
    anchorRef.current = null;
    const panel = panelRef.current;
    if (!panel) return;
    const viewport = panel.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;
    viewport.scrollLeft = docX * scale - viewX;
    viewport.scrollTop = docY * scale - viewY;
  }, [scale, panelRef]);

  const handleZoomIn = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) {
      zoomIn();
      return;
    }
    const viewport = panel.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) {
      zoomIn();
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const current = scale;
    const next = Math.min(maxScale, +(current + 0.1).toFixed(2));
    anchoredZoom(next, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [scale, maxScale, zoomIn, anchoredZoom, panelRef]);

  const handleZoomOut = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) {
      zoomOut();
      return;
    }
    const viewport = panel.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) {
      zoomOut();
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const current = scale;
    const next = Math.max(minScale, +(current - 0.1).toFixed(2));
    anchoredZoom(next, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [scale, minScale, zoomOut, anchoredZoom, panelRef]);

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

  useEffect(() => {
    if (!isVisible) return;
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
        scale -
      SCROLL_OFFSET_PX;
    viewport.scrollTo({ top: viewport.scrollTop + delta, behavior: 'smooth' });
  }, [activeTab, isVisible, scale, panelRef]);

  return (
    <section
      ref={setPanelRef}
      data-template-id={templateId}
      className={cn(
        'flex-1 w-full bg-muted/10 border border-border rounded-xl shadow-inner flex-col h-full relative overflow-hidden touch-pan-x touch-pan-y print:border-none print:shadow-none print:bg-transparent print:overflow-visible',
        mobileActive ? 'flex' : 'hidden',
        'lg:flex',
        className,
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
        className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-card border border-border rounded-lg shadow-md px-2.5 py-1 print:hidden"
        aria-label={
          pageCount === 1
            ? t('preview.pageCountAriaOne', { count: pageCount })
            : t('preview.pageCountAriaMany', { count: pageCount })
        }
      >
        <FileText className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {pageCount} {pageCount === 1 ? t('preview.page') : t('preview.pages')}
        </span>
      </div>

      <div className="flex-1 min-h-0 print:overflow-visible">
        <ScrollArea className="h-full w-full print:h-auto print:overflow-visible">
          <div className="min-h-full py-8 lg:py-16 print:p-0 print:py-0 print:block">
            <div
              style={{ width: frameWidthPx * scale, height: frameHeight }}
              className="relative shrink-0 mx-auto print:w-full! print:h-auto!"
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
                className="absolute top-0 left-0 print:p-0! print:w-full! print:static! print:transform-none!"
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
                    className="absolute inset-0 pointer-events-none print:hidden"
                  >
                    {pageBreaks.map(({ top, label }) => (
                      <div
                        key={top}
                        style={{ top }}
                        className="absolute left-0 right-0 -translate-y-1/2 z-10 flex items-center"
                      >
                        <div className="w-full border-t-2 border-dashed border-destructive/60" />
                        <span className="absolute left-3 -translate-y-1/2 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
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
