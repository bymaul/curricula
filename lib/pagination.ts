export const PAGE_WIDTH_PX = 794;
export const PAGE_HEIGHT_PX = 1123;

export function computePageCount(
  contentHeightPx: number,
  pageHeightPx: number,
): number {
  if (contentHeightPx <= 0 || pageHeightPx <= 0) return 1;
  return Math.max(1, Math.ceil(contentHeightPx / pageHeightPx));
}
