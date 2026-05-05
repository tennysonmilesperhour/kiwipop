import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { FLAVORS_BY_SKU, FLAVOR_SKU_FOR, imageForProduct } from '@/lib/flavors';
import { buildBreadcrumbLd, SITE_URL } from '@/lib/seo';
import { supabaseAdmin } from '@/lib/supabase-admin';
import ProductClient from './ProductClient';

interface ProductPageProps {
  params: { id: string };
}

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price_cents: number;
  in_stock: number;
  preorder_only: boolean;
  image_url: string | null;
}

async function loadProduct(id: string): Promise<ProductRow | null> {
  try {
    const { data } = await supabaseAdmin
      .from('products')
      .select('id, name, description, sku, price_cents, in_stock, preorder_only, image_url')
      .eq('id', id)
      .maybeSingle();
    return (data as ProductRow | null) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await loadProduct(params.id);
  if (!product) {
    return {
      title: 'product · kiwi pop',
      description: 'lollipop shaped party supplements.',
    };
  }

  const flavorSku = product.sku ? FLAVOR_SKU_FOR[product.sku] ?? product.sku : undefined;
  const flavor = flavorSku ? FLAVORS_BY_SKU[flavorSku] : undefined;
  const description =
    product.description?.trim() ||
    flavor?.description ||
    'lollipop shaped party supplements — kiwi pop.';
  const image = imageForProduct(product.sku, product.image_url);
  const title = product.name.toLowerCase();

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      title: `${title} · kiwi pop`,
      description,
      url: `/products/${product.id}`,
      type: 'website',
      images: image ? [{ url: image, width: 1200, height: 1200, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · kiwi pop`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await loadProduct(params.id);

  // Build Product JSON-LD with whatever data we have. If the row is
  // missing, fall through and let the client component render the
  // existing "product not found" state — no schema in that case.
  let productLd: Record<string, unknown> | null = null;
  let breadcrumbLd: Record<string, unknown> | null = null;
  if (product) {
    const flavorSku = product.sku ? FLAVOR_SKU_FOR[product.sku] ?? product.sku : undefined;
    const flavor = flavorSku ? FLAVORS_BY_SKU[flavorSku] : undefined;
    const description =
      product.description?.trim() ||
      flavor?.description ||
      'kiwi pop functional lollipop supplement.';
    const image = imageForProduct(product.sku, product.image_url);
    const priceUsd = (product.price_cents / 100).toFixed(2);
    const availability = product.preorder_only
      ? 'https://schema.org/PreOrder'
      : product.in_stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock';

    productLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description,
      sku: product.sku ?? undefined,
      image: image ? [`${SITE_URL}${image.startsWith('http') ? '' : ''}${image}`] : undefined,
      brand: { '@type': 'Brand', name: 'Kiwi Pop' },
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/products/${product.id}`,
        priceCurrency: 'USD',
        price: priceUsd,
        availability,
        itemCondition: 'https://schema.org/NewCondition',
      },
    };

    breadcrumbLd = buildBreadcrumbLd([
      { name: product.name, url: `/products/${product.id}` },
    ]);
  }

  return (
    <>
      {productLd ? <JsonLd data={productLd} /> : null}
      {breadcrumbLd ? <JsonLd data={breadcrumbLd} /> : null}
      <ProductClient params={params} />
    </>
  );
}
