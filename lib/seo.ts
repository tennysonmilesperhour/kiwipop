/**
 * Tiny SEO/GEO helpers shared by app routes.
 *
 * Use these to keep canonical URLs, breadcrumb structured data, and any
 * other metadata derivations consistent across pages.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://www.kiwipop.fun';

/**
 * Static 1200×630 share card. A new path on purpose: the old
 * `/opengraph-image` response was a 0-byte PNG cached
 * `immutable, max-age=31536000`, so scrapers must be sent somewhere else.
 */
export const SHARE_IMAGE_PATH = '/og/kiwi-pop-share.png';

/** Absolute URL for a site path or an already-absolute asset URL. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}

export interface OfferProduct {
  name: string;
  description: string;
  sku?: string | null;
  image?: string | null;
  priceCents: number;
  path: string;
  preorder: boolean;
  inStock: boolean;
}

/**
 * ItemList of Product + Offer blocks for the homepage shop. Product detail
 * pages emit their own Product node; this covers the landing page, which
 * is where the prices are actually sold.
 */
export function buildProductItemListLd(
  items: OfferProduct[],
): Record<string, unknown> | null {
  if (items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Kiwi Pop lollipops',
    itemListElement: items.map((item, idx) => {
      const availability = item.preorder
        ? 'https://schema.org/PreOrder'
        : item.inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock';

      return {
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Product',
          name: item.name,
          description: item.description,
          sku: item.sku || undefined,
          image: item.image ? [absoluteUrl(item.image)] : undefined,
          brand: { '@type': 'Brand', name: 'Kiwi Pop' },
          offers: {
            '@type': 'Offer',
            url: absoluteUrl(item.path),
            priceCurrency: 'USD',
            price: (item.priceCents / 100).toFixed(2),
            availability,
            itemCondition: 'https://schema.org/NewCondition',
          },
        },
      };
    }),
  };
}

interface BreadcrumbItem {
  name: string;
  url: string; // pathname starting with "/" — joined onto SITE_URL
}

/**
 * Build a BreadcrumbList JSON-LD payload. The first entry is automatically
 * "Home" → "/", so callers only pass the trailing crumbs.
 *
 * Example:
 *   buildBreadcrumbLd([{ name: 'About', url: '/about' }])
 */
export function buildBreadcrumbLd(items: BreadcrumbItem[]): Record<string, unknown> {
  const trail: BreadcrumbItem[] = [{ name: 'Home', url: '/' }, ...items];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
