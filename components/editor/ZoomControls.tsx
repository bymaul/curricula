'use client';

import { IconButton } from '@/components/ui/icon-button';
import { useI18n } from '@/components/I18nProvider';
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
    <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-card border border-border rounded-lg shadow-md px-1.5 py-1 print:hidden">
      <IconButton
        aria-label={t('preview.zoomOut')}
        onClick={onZoomOut}
        disabled={scale <= minScale}
        className="h-8 w-8"
      >
        <Minus className="size-4" />
      </IconButton>
      <span className="w-11 text-center text-xs font-semibold tabular-nums text-muted-foreground">
        {Math.round(scale * 100)}%
      </span>
      <IconButton
        aria-label={t('preview.zoomIn')}
        onClick={onZoomIn}
        disabled={scale >= maxScale}
        className="h-8 w-8"
      >
        <Plus className="size-4" />
      </IconButton>
      <div className="w-px h-4 bg-border mx-0.5" />
      <IconButton
        aria-label={t('preview.fitToWidth')}
        onClick={onReset}
        className="h-8 w-8"
      >
        <Maximize2 className="size-4" />
      </IconButton>
    </div>
  );
}
