import type { Metadata } from 'next';
import { DonateForm } from '@/components/landing/DonateForm';
import { loadFundraiserSnapshot } from '@/lib/fundraiser';

export const dynamic = 'force-dynamic';

const title = 'donate · launch fundraiser';
const description =
  'tip jar. every dollar feeds the kiwi pop launch fundraiser via venmo @tennyson-taggart at 100% face value.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/donate' },
  openGraph: { title: `${title} · kiwi pop`, description, url: '/donate', type: 'website' },
  twitter: { card: 'summary_large_image', title: `${title} · kiwi pop`, description },
};

export default async function DonatePage() {
  const snapshot = await loadFundraiserSnapshot();
  return <DonateForm snapshot={snapshot} />;
}
