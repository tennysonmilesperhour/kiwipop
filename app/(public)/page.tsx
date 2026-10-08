import { JsonLd } from '@/components/JsonLd';
import Landing from '@/components/landing/Landing';
import { imageForProduct } from '@/lib/flavors';
import { loadFundraiserSnapshot } from '@/lib/fundraiser';
import { loadLandingProducts, type ProductRow } from '@/lib/landing-products';
import { buildProductItemListLd, type OfferProduct } from '@/lib/seo';
import { getPreorderOnlyMode } from '@/lib/settings';

// Revalidate every 60s instead of force-dynamic. Product data + the
// fundraiser snapshot don't change every request; a 60s ISR cache cuts
// TTFB / improves LCP without making the homepage feel stale.
export const revalidate = 60;

function offerForProduct(input: {
  product: ProductRow | null;
  name: string;
  description: string;
  sku: string;
  fallbackPriceCents: number;
  fallbackImageSku?: string;
  preorderMode: boolean;
}): OfferProduct {
  const { product, preorderMode } = input;
  const sku = product?.sku || input.sku;
  return {
    name: product?.name || input.name,
    description: product?.description?.trim() || input.description,
    sku,
    image:
      imageForProduct(sku, product?.image_url) ??
      (input.fallbackImageSku ? imageForProduct(input.fallbackImageSku, null) : null),
    priceCents: product?.price_cents ?? input.fallbackPriceCents,
    path: product ? `/products/${product.id}` : '/#shop',
    // Missing rows still describe a preorder: the shop sells ahead of stock.
    preorder: preorderMode || product?.preorder_only === true || !product,
    inStock: (product?.in_stock ?? 0) > 0,
  };
}

export default async function HomePage() {
  const [products, fundraiser, preorderMode] = await Promise.all([
    loadLandingProducts(),
    loadFundraiserSnapshot(),
    getPreorderOnlyMode(),
  ]);

  const seen = new Set<string>();
  const offers: OfferProduct[] = [];
  const push = (offer: OfferProduct) => {
    const key = offer.sku || offer.name;
    if (seen.has(key)) return;
    seen.add(key);
    offers.push(offer);
  };

  for (const flavor of products.flavors) {
    push(
      offerForProduct({
        product: flavor.product,
        name: flavor.name,
        description: flavor.description,
        sku: flavor.sku,
        fallbackPriceCents: 500,
        preorderMode,
      }),
    );
  }
  for (const pack of products.packs) {
    if (pack.size === 1) continue;
    push(
      offerForProduct({
        product: pack.product,
        name: `kiwi pop ${pack.label}`,
        description: `${pack.label} of kiwi pop lollipops.`,
        sku: pack.product?.sku ?? `KP-PACK-${pack.size}`,
        fallbackPriceCents: pack.priceCents,
        fallbackImageSku: 'KP-KIWI-KITTY',
        preorderMode,
      }),
    );
  }
  for (const tier of products.variety) {
    push(
      offerForProduct({
        product: tier.product,
        name: `kiwi pop ${tier.label}`,
        description: `${tier.label}: ${tier.size} pops, ${tier.perFlavor} of each flavor.`,
        sku: tier.sku,
        fallbackPriceCents: tier.priceCents,
        fallbackImageSku: 'KP-KIWI-KITTY',
        preorderMode,
      }),
    );
  }

  const productLd = buildProductItemListLd(offers);

  return (
    <>
      {productLd ? <JsonLd data={productLd} /> : null}
      <Landing products={products} fundraiser={fundraiser} preorderMode={preorderMode} />
    </>
  );
}
