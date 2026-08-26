import { describe, expect, it } from 'vitest';
import {
  PAGE_DIMENSIONS_PX,
  computePageCount,
  getPageDimensions,
} from '@/lib/pagination';

describe('getPageDimensions', () => {
  it('exposes A4 dimensions at 96dpi', () => {
    expect(getPageDimensions('a4')).toEqual({ width: 794, height: 1123 });
  });

  it('exposes US Letter dimensions at 96dpi', () => {
    expect(getPageDimensions('letter')).toEqual({ width: 816, height: 1056 });
  });

  it('falls back to A4 for a missing size', () => {
    expect(getPageDimensions(undefined)).toEqual(PAGE_DIMENSIONS_PX.a4);
  });
});

describe('computePageCount', () => {
  const { height: PAGE_HEIGHT_PX } = PAGE_DIMENSIONS_PX.a4;

  it('returns 1 for empty or zero content', () => {
    expect(computePageCount(0, PAGE_HEIGHT_PX)).toBe(1);
    expect(computePageCount(-10, PAGE_HEIGHT_PX)).toBe(1);
  });

  it('returns 1 when content fits on one page', () => {
    expect(computePageCount(PAGE_HEIGHT_PX, PAGE_HEIGHT_PX)).toBe(1);
    expect(computePageCount(500, PAGE_HEIGHT_PX)).toBe(1);
  });

  it('returns 2 when content spills onto a second page', () => {
    expect(computePageCount(PAGE_HEIGHT_PX + 1, PAGE_HEIGHT_PX)).toBe(2);
    expect(computePageCount(PAGE_HEIGHT_PX * 2, PAGE_HEIGHT_PX)).toBe(2);
  });

  it('returns 3 for content spanning three pages', () => {
    expect(computePageCount(PAGE_HEIGHT_PX * 2 + 1, PAGE_HEIGHT_PX)).toBe(3);
  });

  it('returns 1 for an invalid page height', () => {
    expect(computePageCount(2000, 0)).toBe(1);
  });
});
