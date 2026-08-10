import { describe, expect, it } from 'vitest';
import { PRINT_CSS } from './print';

describe('PRINT_CSS', () => {
  it('sizes pages as A4 with zero margins', () => {
    expect(PRINT_CSS).toContain('@page');
    expect(PRINT_CSS).toContain('size: A4');
    expect(PRINT_CSS).toContain('margin: 0mm');
  });

  it('repeats table headers and footers across pages', () => {
    expect(PRINT_CSS).toContain('thead { display: table-header-group; }');
    expect(PRINT_CSS).toContain('tfoot { display: table-footer-group; }');
  });

  it('preserves background colors but strips background images', () => {
    expect(PRINT_CSS).toContain('print-color-adjust: exact');
    expect(PRINT_CSS).toContain('background-image: none !important');
  });

  it('avoids orphaned lines and headings at page breaks', () => {
    expect(PRINT_CSS).toContain('orphans: 3');
    expect(PRINT_CSS).toContain('widows: 3');
  });
});
