import { PageSizeId } from '@/lib/design';

export const PAGE_DIMENSIONS_PX = {
  a4: { width: 794, height: 1123 },
  letter: { width: 816, height: 1056 },
} as const;

export function getPageDimensions(pageSize: PageSizeId = 'a4') {
  return PAGE_DIMENSIONS_PX[pageSize] ?? PAGE_DIMENSIONS_PX.a4;
}

export function computePageCount(
  contentHeightPx: number,
  pageHeightPx: number,
): number {
  if (contentHeightPx <= 0 || pageHeightPx <= 0) return 1;
  return Math.max(1, Math.ceil(contentHeightPx / pageHeightPx));
}
