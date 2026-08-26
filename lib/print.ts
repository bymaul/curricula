import { PageSizeId } from '@/lib/design';

const PAGE_SIZES: Record<PageSizeId, string> = {
  a4: 'A4',
  letter: 'Letter',
};

export function printCss(pageSize: PageSizeId = 'a4'): string {
  return `
  @page {
    size: ${PAGE_SIZES[pageSize]};
    margin: 0mm;
  }

  html, body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }

  div { background-image: none !important; }

  h1, h2, h3, p, li {
    orphans: 3;
    widows: 3;
  }
`;
}
