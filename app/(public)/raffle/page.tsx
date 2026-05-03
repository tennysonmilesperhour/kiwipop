import type { Metadata } from 'next';
import { RaffleForm } from '@/components/raffle/RaffleForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'raffle · two winners',
  description:
    'enter the kiwi pop raffle — two winners drawn at random. scan the QR code or fill in your contact info on the page.',
};

export default function RafflePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kiwipop.co';
  const entryUrl = `${siteUrl.replace(/\/$/, '')}/raffle`;

  return <RaffleForm entryUrl={entryUrl} />;
}
