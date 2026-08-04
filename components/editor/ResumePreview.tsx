'use client';

import { HarvardTemplate } from '@/components/resume/HarvardTemplate';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { usePageScale } from '@/hooks/usePageScale';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import { getSectionIdFromTab, SectionId } from '@/lib/consts';
import {
  PAGE_HEIGHT_PX,
  PAGE_WIDTH_PX,
  computePageCount,
} from '@/lib/pagination';
import { CVData } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { FileText } from 'lucide-react';
import { RefObject, useEffect, useState } from 'react';
import { ZoomControls } from './ZoomControls';

const GUTTER_PX = 32;
const FRAME_WIDTH_PX = PAGE_WIDTH_PX + GUTTER_PX * 2;
const SCROLL_OFFSET_PX = 16;

interface ResumePreviewProps {
  cvData: CVData;
  printRef: RefObject<HTMLDivElement | null>;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
  isVisible: boolean;
  mobileActive: boolean;
  onSectionClick?: (sectionId: SectionId) => void;
}

export function ResumePreview({
  cvData,
  printRef,
  sectionOrder,
  hiddenSections,
  isVisible,
  mobileActive,
  onSectionClick,
}: ResumePreviewProps) {
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
    frameWidthPx: FRAME_WIDTH_PX,
    isVisible,
  });

  const { containerRef } = usePinchZoom({
    scale,
    minScale,
    maxScale,
    onZoomChange: zoomTo,
  });

  const setPanelRef = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    containerRef.current = node;
  };

  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    const el = printRef.current;
    if (!el) return;
    const update = () => {
      setPageCount(computePageCount(el.scrollHeight, PAGE_HEIGHT_PX));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [printRef, cvData]);

  const pageBreaks = Array.from({ length: pageCount - 1 }, (_, i) => ({
    top: (i + 1) * PAGE_HEIGHT_PX,
    label: i + 2,
  }));

  const activeTab = useUIStore((state) => state.activeTab);

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
      className={cn(
        'flex-1 w-full bg-muted/10 border border-border rounded-xl shadow-inner flex-col h-full relative overflow-hidden touch-pan-x touch-pan-y print:border-none print:shadow-none print:bg-transparent print:overflow-visible',
        mobileActive ? 'flex' : 'hidden',
        'lg:flex print:flex!',
      )}
    >
      <ZoomControls
        scale={scale}
        minScale={minScale}
        maxScale={maxScale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={zoomReset}
      />

      <div
        className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-card border border-border rounded-lg shadow-md px-2.5 py-1 print:hidden"
        aria-label={`Resume is ${pageCount} ${pageCount === 1 ? 'page' : 'pages'} long`}
      >
        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </span>
      </div>

      <div className="flex-1 min-h-0 print:overflow-visible">
        <ScrollArea className="h-full w-full print:h-auto print:overflow-visible">
          <div className="min-h-full py-8 lg:py-16 print:p-0 print:py-0 print:block">
            <div
              style={{ width: FRAME_WIDTH_PX * scale, height: frameHeight }}
              className="relative shrink-0 mx-auto print:w-full! print:h-auto!"
            >
              <div
                ref={frameRef}
                style={{
                  width: FRAME_WIDTH_PX,
                  padding: `0 ${GUTTER_PX}px`,
                  boxSizing: 'border-box',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
                className="absolute top-0 left-0 print:p-0! print:w-full! print:static! print:transform-none!"
              >
                <div
                  style={{ width: PAGE_WIDTH_PX }}
                  className="relative bg-white text-black shadow-2xl print:w-full! print:shadow-none"
                >
                  <div className="overflow-hidden print:overflow-visible">
                    <HarvardTemplate
                      ref={printRef}
                      cvData={cvData}
                      sectionOrder={sectionOrder}
                      hiddenSections={hiddenSections}
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
                          Page {label}
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
