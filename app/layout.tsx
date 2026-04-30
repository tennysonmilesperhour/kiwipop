import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Navigation } from '@/components/Navigation';
import { Providers } from './providers';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Kiwi Pop | Premium Party Lollipops',
    template: '%s | Kiwi Pop',
  },
  description:
    'Sugar-free, vegan, functional lollipops for every occasion. Premium party pops crafted with real flavor.',
  applicationName: 'Kiwi Pop',
  authors: [{ name: 'Kiwi Pop' }],
  keywords: [
    'lollipops',
    'sugar-free candy',
    'vegan candy',
    'party favors',
    'functional candy',
    'kiwi pop',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Kiwi Pop',
    title: 'Kiwi Pop | Premium Party Lollipops',
    description: 'Sugar-free, vegan, functional lollipops for every occasion.',
    url: siteUrl,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kiwi Pop premium party lollipops',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kiwi Pop | Premium Party Lollipops',
    description: 'Sugar-free, vegan, functional lollipops for every occasion.',
    images: ['/og-image.png'],
  },
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navigation />
          <main className="main-container">{children}</main>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
