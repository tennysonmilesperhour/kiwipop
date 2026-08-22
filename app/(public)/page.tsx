import Landing from '@/components/landing/Landing';
import { loadFundraiserSnapshot } from '@/lib/fundraiser';
import { loadLandingProducts } from '@/lib/landing-products';
import { getPreorderOnlyMode } from '@/lib/settings';

// Revalidate every 60s instead of force-dynamic. Product data + the
// fundraiser snapshot don't change every request; a 60s ISR cache cuts
// TTFB / improves LCP without making the homepage feel stale.
export const revalidate = 60;

export default async function HomePage() {
  const [products, fundraiser, preorderMode] = await Promise.all([
    loadLandingProducts(),
    loadFundraiserSnapshot(),
    getPreorderOnlyMode(),
  ]);

  return (
    <Landing products={products} fundraiser={fundraiser} preorderMode={preorderMode} />
  );
}
