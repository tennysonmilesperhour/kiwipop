import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'https://www.kiwipop.fun';

  const disallow = [
    '/admin',
    '/api',
    '/auth',
    '/checkout/success',
    '/checkout/cancelled',
  ];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      // Explicitly allow AI crawlers (same disallow list as humans).
      // GEO-friendly — these bots feed Perplexity, ChatGPT, Claude, etc.
      { userAgent: 'GPTBot', allow: '/', disallow },
      { userAgent: 'PerplexityBot', allow: '/', disallow },
      { userAgent: 'ClaudeBot', allow: '/', disallow },
      { userAgent: 'Google-Extended', allow: '/', disallow },
      { userAgent: 'CCBot', allow: '/', disallow },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
