import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { cn } from '@/lib/utils';
import { Provider } from './providers';
import { Toaster } from '@/components/ui/toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Curricula',
  description:
    'An offline-first, client-side CV builder with multiple print-safe templates and clean PDF generation.',
  applicationName: 'Curricula',
  keywords: [
    'CV builder',
    'resume builder',
    'CV templates',
    'offline CV editor',
    'PWA resume builder',
    'print-safe CV',
  ],
  authors: [{ name: 'Curricula Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon-192x192.png' }, { url: '/icon-512x512.png' }],
    apple: '/apple-touch-icon.png',
  },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await headers();
  return (
    <html
      lang="en"
      className={cn(
        'dark h-full antialiased',
        geistMono.variable,
        'font-sans',
        inter.variable,
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Provider>
          {children}
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}
