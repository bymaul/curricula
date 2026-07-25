import type { Metadata } from 'next';
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

export const metadata: Metadata = {
    title: 'CV Builder',
    description: 'ATS-Friendly Harvard style CV Builder',
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
