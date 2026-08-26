import { describe, expect, it } from 'vitest';
import { printCss } from './print';

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
