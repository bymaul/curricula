import { describe, expect, it } from 'vitest';
import {
  ACCENT_COLORS,
  DEFAULT_DESIGN,
  designCssVars,
  designSchema,
  normalizeDesign,
} from '@/lib/design';

describe('designSchema', () => {
  it('accepts a valid design', () => {
    const design = {
      accentColor: 'blue',
      fontFamily: 'serif',
      density: 'compact',
    };
    expect(designSchema.parse(design)).toEqual(design);
  });

  it('fills defaults for missing fields', () => {
    expect(designSchema.parse({})).toEqual(DEFAULT_DESIGN);
  });

  it('falls back per-field on unknown values instead of failing', () => {
    expect(
      designSchema.parse({ accentColor: 'hot-pink', fontFamily: 'comic' }),
    ).toEqual({ ...DEFAULT_DESIGN, fontFamily: 'default' });
  });
});

describe('normalizeDesign', () => {
  it('returns the parsed value for valid input', () => {
    const design = {
      accentColor: 'teal',
      fontFamily: 'sans',
      density: 'relaxed',
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
