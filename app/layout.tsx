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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const SITE_TITLE = 'Curricula';

const SITE_DESCRIPTION =
  'Build professional resumes and CVs in your browser with Harvard-style print-safe templates, clean PDF output, AI import, and fully offline editing. No account needed.';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Curricula',
  url: SITE_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  description: SITE_DESCRIPTION,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'Harvard-style print-safe resume templates',
    'Offline-first editing with autosave',
    'AI CV parsing and adjustment',
    'PDF import and browser printing',
    'Multi-resume management with version history',
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | Curricula',
  },
  description: SITE_DESCRIPTION,
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
  creator: 'Curricula Team',
  manifest: '/manifest.json',
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [{ url: '/icon-192x192.png' }, { url: '/icon-512x512.png' }],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: 'website',
    siteName: 'Curricula',
    locale: 'en_US',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

const THEME_BOOTSTRAP = `(function(){try{var s=JSON.parse(localStorage.getItem('curricula-ui-state')||'{}').state||{};var t=s.theme;var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? '';
  return (
    <html
      lang="en"
      className={cn(
        'h-full antialiased',
        geistMono.variable,
        'font-sans',
        inter.variable,
      )}
      suppressHydrationWarning
    >
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }}
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <Provider>
          {children}
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}
