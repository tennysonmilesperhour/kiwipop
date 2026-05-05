/**
 * Tiny SEO/GEO helpers shared by app routes.
 *
 * Use these to keep canonical URLs, breadcrumb structured data, and any
 * other metadata derivations consistent across pages.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://www.kiwipop.fun';

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
