import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Provider } from './providers';
import { Toaster } from '@/components/ui/toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const viewport: Viewport = {
    themeColor: '#09090b',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    title: 'Curricula',
    description:
        'An offline-first, client-side CV builder featuring an immaculate classic Harvard table-layout typography for clean print and PDF generation.',
    applicationName: 'Curricula',
    keywords: [
        'CV builder',
        'resume builder',
        'Harvard CV template',
        'offline CV editor',
        'PWA resume builder',
        'print-safe CV',
    ],
    authors: [{ name: 'Curricula Team' }],
    manifest: '/manifest.json',
    openGraph: {
        title: 'Curricula',
        description:
            'Create perfectly aligned, professional Harvard-style resumes with clean pagination and offline-ready editing.',
        type: 'website',
        siteName: 'Curricula',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Curricula',
        description:
            'Create perfectly aligned, professional Harvard-style resumes with clean pagination and offline-ready editing.',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang='en'
            className={cn(
                'dark h-full antialiased',
                geistSans.variable,
                geistMono.variable,
                'font-sans',
                inter.variable,
            )}
            suppressHydrationWarning>
            <body className='min-h-full flex flex-col'>
                <Provider>
                    {children}
                    <Toaster />
                </Provider>
            </body>
        </html>
    );
}
