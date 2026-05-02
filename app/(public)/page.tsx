import Landing from '@/components/landing/Landing';
import { loadFundraiserSnapshot } from '@/lib/fundraiser';
import { loadLandingProducts } from '@/lib/landing-products';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [products, fundraiser] = await Promise.all([
    loadLandingProducts(),
    loadFundraiserSnapshot(),
  ]);

  return <Landing products={products} fundraiser={fundraiser} />;
}
