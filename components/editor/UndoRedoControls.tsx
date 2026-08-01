'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Redo2, Undo2 } from 'lucide-react';

interface UndoRedoControlsProps {
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    className?: string;
}

export function UndoRedoControls({ onUndo, onRedo, canUndo, canRedo, className }: UndoRedoControlsProps) {
    return (
        <div className={cn('flex items-center gap-1', className)}>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <button
                            type="button"
                            onClick={onUndo}
                            disabled={!canUndo}
                            aria-label="Undo (Ctrl+Z)"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                    }
                />
                <TooltipContent side="top">Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger
                    render={
                        <button
                            type="button"
                            onClick={onRedo}
                            disabled={!canRedo}
                            aria-label="Redo (Ctrl+Shift+Z)"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    }
                />
                <TooltipContent side="top">Redo (Ctrl+Shift+Z)</TooltipContent>
            </Tooltip>
        </div>
    );
}
