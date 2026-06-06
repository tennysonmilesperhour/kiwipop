import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { loadFundraiserSnapshot } from '@/lib/fundraiser';
import { CampaignPage, type CampaignUpdate } from '@/components/campaign/CampaignPage';

export const revalidate = 60;

const title = 'campaign · launch the kiwi';
const description =
  'Help launch Kiwi Pop, functional lollipops for festivals, shelves, and every hand that needs a better alternative. Donate, follow our progress, and join the movement.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/campaign' },
  openGraph: {
    title: `${title} · kiwi pop`,
    description,
    url: '/campaign',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: `${title} · kiwi pop`, description },
};

async function loadUpdates(): Promise<CampaignUpdate[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('campaign_updates')
      .select('id, title, body, image_url, is_milestone, milestone_label, published_at')
      .order('published_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data as CampaignUpdate[];
  } catch {
    return [];
  }
}

export default async function CampaignRoute() {
  const [snapshot, updates] = await Promise.all([
    loadFundraiserSnapshot(),
    loadUpdates(),
  ]);

  // TODO: Replace with actual YouTube embed URL when video is ready
  const videoUrl = undefined;

  return <CampaignPage snapshot={snapshot} updates={updates} videoUrl={videoUrl} />;
}
