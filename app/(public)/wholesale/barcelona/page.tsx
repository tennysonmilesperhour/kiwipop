import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Noto_Serif_JP } from 'next/font/google';
import { Onepager } from './Onepager';
import './barcelona.css';

const notoSerifJp = Noto_Serif_JP({
  subsets: ['latin'],
  variable: '--font-noto-serif-jp',
  display: 'swap',
  weight: ['400', '700', '900'],
});

const title = 'Kiwi Pop · Mayorista · Barcelona';
const description =
  'A functional lollipop, made for the night. Wholesale program for Barcelona venues, founding-partner terms for the first five.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/wholesale/barcelona' },
  openGraph: {
    title,
    description,
    url: '/wholesale/barcelona',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  robots: { index: false, follow: false },
};

export default function BarcelonaWholesalePage() {
  const fontVars = `${GeistSans.variable} ${GeistMono.variable} ${notoSerifJp.variable}`;
  return <Onepager fontVars={fontVars} />;
}
