/**
 * Print stylesheet shared by every resume template. Injected via
 * `@media print` so it only applies when the user prints or saves as PDF.
 *
 * Kept as a string constant so it can be unit-tested (see lib/print.test.ts)
 * and so every template paginates identically.
 */
export const PRINT_CSS = `
  @page {
    size: A4;
    margin: 0mm;
  }

  /* Keep background colors (accents, highlights) in the printed PDF. */
  html, body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Repeat table headers/footers on every page (used for page caps). */
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }

  /* Strip background images but keep colors. */
  div { background-image: none !important; }

  /* Avoid single lines stranded at the top/bottom of a page break. */
  h1, h2, h3, p, li {
    orphans: 3;
    widows: 3;
  }
`;
