import type { Metadata } from 'next';
import { Broadcaster } from '@/components/map/Broadcaster';

// Operator-only broadcast console — never index, never preview.
export const metadata: Metadata = {
  title: 'live broadcast',
  robots: { index: false, follow: false },
};

export default async function LiveBroadcastPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="page-container">
      <Broadcaster token={token} />
    </div>
  );
}
