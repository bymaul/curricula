'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { SortableList, SortableRow } from '@/components/forms/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RENDERABLE_SECTIONS, SectionId } from '@/lib/consts';
import { useResumeStore } from '@/store/useResumeStore';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

interface SectionsOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SectionsOrderDialog({ open, onOpenChange }: SectionsOrderDialogProps) {
    const activeResume = useResumeStore((state) => state.resumes.find((r) => r.id === state.activeId));
    const moveSection = useResumeStore((state) => state.moveSection);
    const toggleSectionVisibility = useResumeStore((state) => state.toggleSectionVisibility);
    const resetSectionOrder = useResumeStore((state) => state.resetSectionOrder);

    const sectionOrder = activeResume?.sectionOrder ?? [];
    const hiddenSections = new Set(activeResume?.hiddenSections ?? []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Section Order</DialogTitle>
                </DialogHeader>

                <div className="min-h-0 -mx-1">
                    <ScrollArea className="h-full p-2">
                        <p className="text-xs text-muted-foreground mb-3 px-1">
                            Drag to reorder, or toggle visibility with the eye. Hidden sections stay
                            in the editor but do not appear on the resume.
                        </p>
                        <SortableList ids={sectionOrder} onMove={moveSection}>
                            {sectionOrder.map((id) => {
                                const title = RENDERABLE_SECTIONS.find((section) => section.id === id)?.title;
                                const hidden = hiddenSections.has(id);
                                return (
                                    <SortableRow
                                        key={id}
                                        id={id}
                                        className={cn('items-center', hidden && 'opacity-60')}
                                        handleClassName="mb-0"
                                    >
                                        <span className="flex-1 text-sm font-semibold">{title}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleSectionVisibility(id as SectionId)}
                                            title={hidden ? `Show ${title}` : `Hide ${title}`}
                                            aria-label={hidden ? `Show ${title}` : `Hide ${title}`}
                                            aria-pressed={!hidden}
                                            className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        >
                                            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </SortableRow>
                                );
                            })}
                        </SortableList>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={resetSectionOrder}>
                        <RotateCcw className="w-4 h-4" />
                        Reset order
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
