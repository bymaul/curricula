'use client';

import { HarvardTemplate } from '@/components/resume/HarvardTemplate';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { usePageScale } from '@/hooks/usePageScale';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import { SectionId } from '@/lib/consts';
import { CVData } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { RefObject } from 'react';
import { ZoomControls } from './ZoomControls';

const PAGE_WIDTH_PX = 794;
const GUTTER_PX = 32;
const FRAME_WIDTH_PX = PAGE_WIDTH_PX + GUTTER_PX * 2;

interface ResumePreviewProps {
    cvData: CVData;
    printRef: RefObject<HTMLDivElement | null>;
    sectionOrder?: SectionId[];
    hiddenSections?: SectionId[];
    isVisible: boolean;
    mobileActive: boolean;
}

export function ResumePreview({ cvData, printRef, sectionOrder, hiddenSections, isVisible, mobileActive }: ResumePreviewProps) {
    const { panelRef, frameRef, scale, frameHeight, zoomTo, zoomIn, zoomOut, zoomReset, minScale, maxScale } = usePageScale({
        frameWidthPx: FRAME_WIDTH_PX,
        isVisible,
    });

    const { containerRef } = usePinchZoom({ scale, minScale, maxScale, onZoomChange: zoomTo });

    const setPanelRef = (node: HTMLDivElement | null) => {
        panelRef.current = node;
        containerRef.current = node;
    };

    return (
        <section
            ref={setPanelRef}
            className={cn(
                'flex-1 w-full bg-muted/20 border border-border rounded-xl shadow-inner flex-col h-full relative overflow-hidden touch-pan-x touch-pan-y print:border-none print:shadow-none print:bg-transparent print:overflow-visible',
                mobileActive ? 'flex' : 'hidden',
                'lg:flex print:flex!',
            )}>
            <ZoomControls
                scale={scale}
                minScale={minScale}
                maxScale={maxScale}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onReset={zoomReset}
            />

            <div className='flex-1 min-h-0 print:overflow-visible'>
                <ScrollArea className='h-full w-full print:h-auto print:overflow-visible'>
                    <div className='min-h-full py-8 lg:py-16 print:p-0 print:py-0 print:block'>
                        <div
                            style={{ width: FRAME_WIDTH_PX * scale, height: frameHeight }}
                            className='relative shrink-0 mx-auto print:w-full! print:h-auto!'>
                            <div
                                ref={frameRef}
                                style={{
                                    width: FRAME_WIDTH_PX,
                                    padding: `0 ${GUTTER_PX}px`,
                                    boxSizing: 'border-box',
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top left',
                                }}
                                className='absolute top-0 left-0 print:p-0! print:w-full! print:static! print:transform-none!'>
                                <div
                                    style={{ width: PAGE_WIDTH_PX }}
                                    className='bg-white text-black shadow-2xl overflow-hidden print:w-full! print:shadow-none'>
                                    <HarvardTemplate ref={printRef} cvData={cvData} sectionOrder={sectionOrder} hiddenSections={hiddenSections} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <ScrollBar orientation='horizontal' />
                </ScrollArea>
            </div>
        </section>
    );
}
