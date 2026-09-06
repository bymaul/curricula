'use client';

import { IconButton } from '@/components/ui/icon-button';
import { useI18n } from '@/hooks/useI18n';
import { Maximize2, Minus, Plus } from 'lucide-react';

interface ZoomControlsProps {
  scale: number;
  minScale: number;
  maxScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({
  scale,
  minScale,
  maxScale,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  const { t } = useI18n();
  return (
    <div className="bg-card border-border absolute right-3 bottom-3 z-20 flex items-center gap-1 rounded-lg border px-1 py-0.5 shadow-md print:hidden">
      <IconButton
        aria-label={t('preview.zoomOut')}
        onClick={onZoomOut}
        disabled={scale <= minScale}
        className="h-7 w-7"
      >
        <Minus className="size-3.5" />
      </IconButton>
      <span className="text-muted-foreground w-10 text-center text-xs font-semibold tabular-nums">
        {Math.round(scale * 100)}%
      </span>
      <IconButton
        aria-label={t('preview.zoomIn')}
        onClick={onZoomIn}
        disabled={scale >= maxScale}
        className="h-7 w-7"
      >
        <Plus className="size-3.5" />
      </IconButton>
      <div className="bg-border mx-0.5 h-4 w-px" />
      <IconButton
        aria-label={t('preview.fitToWidth')}
        onClick={onReset}
        className="h-7 w-7"
      >
        <Maximize2 className="size-3.5" />
      </IconButton>
    </div>
  );
}
