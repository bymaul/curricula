export const PRINT_CSS = `
  @page {
    size: A4;
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
