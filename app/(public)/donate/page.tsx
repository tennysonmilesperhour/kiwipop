import type { Metadata } from 'next';
import { DonateForm } from '@/components/landing/DonateForm';
import { loadFundraiserSnapshot } from '@/lib/fundraiser';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'donate · launch fundraiser',
  description:
    'tip jar. every dollar feeds the kiwi pop launch fundraiser via venmo @tennyson-taggart at 100% face value.',
};

export default async function DonatePage() {
  const snapshot = await loadFundraiserSnapshot();
  return <DonateForm snapshot={snapshot} />;
}
