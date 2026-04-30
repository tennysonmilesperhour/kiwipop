import type { Metadata, Viewport } from 'next';
import {
  Bricolage_Grotesque,
  JetBrains_Mono,
  Zen_Tokyo_Zoo,
} from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Providers } from './providers';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
  weight: ['400', '700', '800'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500', '700'],
});

const zenTokyoZoo = Zen_Tokyo_Zoo({
  subsets: ['latin'],
  variable: '--font-zen-tokyo-zoo',
  display: 'swap',
  weight: ['400'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'kiwi pop · suck on the future',
    template: '%s · kiwi pop',
  },
  description:
    "sugar-free, vegan, functional lollipops for the dance floor. each flavor is a feeling. each flavor does a thing. candy for people who don't eat candy.",
  applicationName: 'kiwi pop',
  authors: [{ name: 'kiwi pop' }],
  keywords: [
    'kiwi pop',
    'sugar free lollipops',
    'vegan lollipops',
    'functional candy',
    'caffeine lollipop',
    'rave snack',
    'after-hours candy',
  ],
  openGraph: {
    type: 'website',
    siteName: 'kiwi pop',
    title: 'kiwi pop · suck on the future',
    description:
      'sugar-free, vegan, functional lollipops for the dance floor.',
    url: siteUrl,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'kiwi pop — suck on the future',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'kiwi pop · suck on the future',
    description:
      'sugar-free, vegan, functional lollipops for the dance floor.',
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
  themeColor: '#050510',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${jetbrains.variable} ${zenTokyoZoo.variable}`}
    >
      <body>
        <Providers>
          <Navigation />
          <main className="main-container">{children}</main>
          <Footer />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
