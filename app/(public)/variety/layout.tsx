import type { Metadata } from 'next';

const title = 'variety pack · try all four flavors';
const description =
  "Try all four Kiwi Pop flavors in one pack. Kiwi, lemon ginger, mango, and mint — same functional payload, equal counts. 8 / 20 / 40 sizes from $30.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/variety' },
  openGraph: {
    title: `${title} · kiwi pop`,
    description,
    url: '/variety',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} · kiwi pop`,
    description,
  },
};

export default function VarietyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
