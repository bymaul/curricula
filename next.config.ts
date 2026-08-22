import { withSerwist } from '@serwist/turbopack';
import type { NextConfig } from 'next';
import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function copyPdfWorker() {
  const source = join(
    process.cwd(),
    'node_modules',
    'pdfjs-dist',
    'build',
    'pdf.worker.min.mjs',
  );
  const target = join(process.cwd(), 'public', 'pdf.worker.min.mjs');
  if (existsSync(source)) {
    cpSync(source, target);
  }
}

copyPdfWorker();

const securityHeaders: Array<{ key: string; value: string }> = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  headers: async () => [{ source: '/:path*', headers: securityHeaders }],
};

export default withSerwist(nextConfig);
