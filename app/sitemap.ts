import type { MetadataRoute } from 'next';

const STATIC_PATHS = ['', '/cart', '/auth/signin', '/auth/signup'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'http://localhost:3000';

  const lastModified = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: path === '' ? 'daily' : 'monthly',
    priority: path === '' ? 1 : 0.5,
  }));

  // Fetch products via a lightweight, anon-keyed REST call so we don't pull
  // the full Supabase JS SDK into the sitemap build.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let productEntries: MetadataRoute.Sitemap = [];
  if (supabaseUrl && anonKey && supabaseUrl.startsWith('http')) {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/products?select=id,created_at`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          next: { revalidate: 600 },
        }
      );
      if (response.ok) {
        const rows: Array<{ id: string; created_at: string }> =
          await response.json();
        productEntries = rows.map((row) => ({
          url: `${base}/products/${row.id}`,
          lastModified: new Date(row.created_at),
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
      }
    } catch {
      /* sitemap is best-effort — never block the build */
    }
  }

  return [...staticEntries, ...productEntries];
}
