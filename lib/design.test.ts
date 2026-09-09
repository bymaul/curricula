import { describe, expect, it } from 'vitest';
import {
  ACCENT_COLORS,
  DEFAULT_DESIGN,
  PAGE_DIMENSIONS_PX,
  computePageCount,
  designCssVars,
  designSchema,
  getPageDimensions,
  normalizeDesign,
  printCss,
} from '@/lib/design';

describe('designSchema', () => {
  it('accepts a valid design', () => {
    const design = {
      accentColor: 'blue',
      fontFamily: 'serif',
      density: 'compact',
      pageSize: 'letter',
    };
    expect(designSchema.parse(design)).toEqual(design);
  });

  it('fills defaults for missing fields', () => {
    expect(designSchema.parse({})).toEqual(DEFAULT_DESIGN);
  });

  it('falls back per-field on unknown values instead of failing', () => {
    expect(
      designSchema.parse({
        accentColor: 'hot-pink',
        fontFamily: 'comic',
        pageSize: 'tabloid',
      }),
    ).toEqual({
      ...DEFAULT_DESIGN,
      fontFamily: 'default',
      pageSize: 'a4',
    });
  });
});

describe('normalizeDesign', () => {
  it('returns the parsed value for valid input', () => {
    const design = {
      accentColor: 'teal',
      fontFamily: 'sans',
      density: 'relaxed',
      pageSize: 'letter',
    };
    expect(normalizeDesign(design)).toEqual(design);
  });

  it('returns defaults for null, undefined, and garbage', () => {
    expect(normalizeDesign(null)).toEqual(DEFAULT_DESIGN);
    expect(normalizeDesign(undefined)).toEqual(DEFAULT_DESIGN);
    expect(normalizeDesign('nope')).toEqual(DEFAULT_DESIGN);
    expect(normalizeDesign(42)).toEqual(DEFAULT_DESIGN);
  });

  it('returns a fresh object so callers cannot mutate DEFAULT_DESIGN', () => {
    const normalized = normalizeDesign(undefined);
    normalized.accentColor = 'blue';
    expect(DEFAULT_DESIGN.accentColor).toBe('default');
  });
});

describe('designCssVars', () => {
  it('resolves template fallbacks for a default design', () => {
    const vars = designCssVars(DEFAULT_DESIGN, {
      accentFallback: '#000000',
      fontFallback: 'serif',
    });
    expect(vars['--cv-accent']).toBe('#000000');
    expect(vars['--cv-font']).toContain('Georgia');
    expect(vars['--cv-section-gap']).toBe('10pt');
    expect(vars['--cv-item-gap']).toBe('7pt');
  });

  it('resolves the palette hex for a named accent', () => {
    const vars = designCssVars(
      { ...DEFAULT_DESIGN, accentColor: 'burgundy' },
      { accentFallback: '#000000', fontFallback: 'sans' },
    );
    expect(vars['--cv-accent']).toBe('#a85d6b');
  });

  it('maps every non-default palette id to its hex', () => {
    for (const color of ACCENT_COLORS) {
      if (color.hex === null) continue;
      const vars = designCssVars(
        { ...DEFAULT_DESIGN, accentColor: color.id },
        { accentFallback: '#000000', fontFallback: 'sans' },
      );
      expect(vars['--cv-accent']).toBe(color.hex);
    }
  });

  it('applies the serif stack over a sans-default template', () => {
    const vars = designCssVars(
      { ...DEFAULT_DESIGN, fontFamily: 'serif' },
      { accentFallback: '#0369a1', fontFallback: 'sans' },
    );
    expect(vars['--cv-font']).toContain('ui-serif');
  });

  it('scales gaps with density', () => {
    const compact = designCssVars(
      { ...DEFAULT_DESIGN, density: 'compact' },
      { accentFallback: '#000', fontFallback: 'sans' },
    );
    const relaxed = designCssVars(
      { ...DEFAULT_DESIGN, density: 'relaxed' },
      { accentFallback: '#000', fontFallback: 'sans' },
    );
    expect(compact['--cv-section-gap']).toBe('7pt');
    expect(compact['--cv-item-gap']).toBe('5pt');
    expect(relaxed['--cv-section-gap']).toBe('13pt');
    expect(relaxed['--cv-item-gap']).toBe('10pt');
  });
});

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

describe('printCss', () => {
  it('sizes pages as A4 with zero margins by default', () => {
    const css = printCss();
    expect(css).toContain('@page');
    expect(css).toContain('size: A4');
    expect(css).toContain('margin: 0mm');
  });

  it('sizes pages as US Letter when requested', () => {
    expect(printCss('letter')).toContain('size: Letter');
    expect(printCss('letter')).not.toContain('size: A4');
  });

  it('repeats table headers and footers across pages', () => {
    const css = printCss();
    expect(css).toContain('thead { display: table-header-group; }');
    expect(css).toContain('tfoot { display: table-footer-group; }');
  });

  it('preserves background colors but strips background images', () => {
    const css = printCss();
    expect(css).toContain('print-color-adjust: exact');
    expect(css).toContain('background-image: none !important');
  });

  it('avoids orphaned lines and headings at page breaks', () => {
    const css = printCss();
    expect(css).toContain('orphans: 3');
    expect(css).toContain('widows: 3');
  });
});
