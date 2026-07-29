'use client';

import { Maximize2, Minus, Plus } from 'lucide-react';

interface ZoomControlsProps {
    scale: number;
    minScale: number;
    maxScale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
}

export function ZoomControls({ scale, minScale, maxScale, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
    return (
        <div className='absolute top-3 right-3 z-20 flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-md p-1 print:hidden'>
            <button
                type='button'
                onClick={onZoomOut}
                disabled={scale <= minScale}
                className='h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent'>
                <Minus className='w-3.5 h-3.5' />
            </button>
            <span className='w-11 text-center text-xs font-semibold tabular-nums text-muted-foreground'>
                {Math.round(scale * 100)}%
            </span>
            <button
                type='button'
                onClick={onZoomIn}
                disabled={scale >= maxScale}
                className='h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent'>
                <Plus className='w-3.5 h-3.5' />
            </button>
            <div className='w-px h-4 bg-border mx-0.5' />
            <button
                type='button'
                onClick={onReset}
                title='Fit to width'
                className='h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground'>
                <Maximize2 className='w-3.5 h-3.5' />
            </button>
        </div>
    );
}
