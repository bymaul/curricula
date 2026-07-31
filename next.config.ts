import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';
import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const withSerwist = withSerwistInit({
    swSrc: 'app/sw.ts',
    swDest: 'public/sw.js',
    disable: process.env.NODE_ENV === 'development',
});

function copyPdfWorker() {
    const source = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
    const target = join(process.cwd(), 'public', 'pdf.worker.min.mjs');
    if (existsSync(source)) {
        cpSync(source, target);
    }
}

copyPdfWorker();

const nextConfig: NextConfig = {
    /* config options here */
};

export default withSerwist(nextConfig);
