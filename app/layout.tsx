import type { Metadata, Viewport } from 'next';
import {
  Bricolage_Grotesque,
  JetBrains_Mono,
  Orbitron,
  Space_Grotesk,
  Zen_Tokyo_Zoo,
} from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PostHogScript } from '@/components/PostHogScript';
import { JsonLd } from '@/components/JsonLd';
import { SiteChrome } from '@/components/SiteChrome';
import { VersionWatcher } from '@/components/VersionWatcher';
import { Providers } from './providers';
import './globals.css';
import './kp-landing.css';
import './campaign.css';

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

// Used by the landing page design tokens (kp-landing.css). Loaded here
// via next/font/google so they are self-hosted + preloaded with the rest
// of the app's typefaces, avoiding the render-blocking @import in CSS.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
  weight: ['400', '500', '700', '900'],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://www.kiwipop.fun';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'kiwi pop · lollipop shaped party supplements',
    template: '%s · kiwi pop',
  },
  description:
    "lollipop shaped party supplements. <1g of sugar, vegan, xylitol-sweetened (tooth-friendly, low-glycemic), functional lollipops with edible mica glitter and a real functional payload (theobromine, ginseng, b12, magnesium, taurine, electrolytes). candy for people who don't eat candy.",
  applicationName: 'kiwi pop',
  authors: [{ name: 'kiwi pop' }],
  alternates: {
    canonical: '/',
  },
  keywords: [
    'kiwi pop',
    'low sugar lollipops',
    'vegan lollipops',
    'functional candy',
    'theobromine lollipop',
    'rave snack',
    'after-hours candy',
  ],
  openGraph: {
    type: 'website',
    siteName: 'kiwi pop',
    title: 'kiwi pop · lollipop shaped party supplements',
    description:
      'lollipop shaped party supplements. <1g of sugar, vegan, functional lollipops.',
    url: siteUrl,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'kiwi pop — lollipop shaped party supplements',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'kiwi pop · lollipop shaped party supplements',
    description:
      'lollipop shaped party supplements. <1g of sugar, vegan, functional lollipops.',
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

const ORGANIZATION_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kiwi Pop',
  url: siteUrl,
  logo: `${siteUrl}/landing/img/kiwi-kitty-pop.webp`,
  description:
    'Lollipop shaped party supplements. Functional candy with theobromine, ginseng, B12, magnesium, taurine, and electrolytes. Sweetened with xylitol (tooth-friendly, low-glycemic) and a touch of monk fruit. Less than 1g of sugar, vegan, ~35 calories per pop.',
  foundingLocation: {
    '@type': 'Place',
    name: 'Salt Lake City, Utah',
  },
  sameAs: ['https://www.instagram.com/the.kiwi.pop/'],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'thekiwipop@gmail.com',
    contactType: 'customer service',
  },
};

const WEBSITE_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Kiwi Pop',
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/products?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${jetbrains.variable} ${zenTokyoZoo.variable} ${spaceGrotesk.variable} ${orbitron.variable}`}
    >
      <body>
        <JsonLd data={ORGANIZATION_LD} />
        <JsonLd data={WEBSITE_LD} />
        <Providers>
          <SiteChrome>{children}</SiteChrome>
          <VersionWatcher />
        </Providers>
        <Analytics />
        <SpeedInsights />
        <PostHogScript />
      </body>
    </html>
  );
}
