import type { Metadata } from 'next';
import { DonateForm } from '@/components/landing/DonateForm';
import { loadFundraiserSnapshot } from '@/lib/fundraiser';
import { loadLandingProducts } from '@/lib/landing-products';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'donate · launch fundraiser',
  description:
    'tip jar. every dollar feeds the kiwi pop launch fundraiser. processed via stripe, counts toward the live $5,000 goal at 100% face value.',
};

export default async function DonatePage() {
  const [products, snapshot] = await Promise.all([
    loadLandingProducts(),
    loadFundraiserSnapshot(),
  ]);

  return <DonateForm product={products.donation} snapshot={snapshot} />;
}
