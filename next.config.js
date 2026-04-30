/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

let supabaseHostname = '';
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  }
} catch {
  /* leave unset; user can add it later */
}

const remotePatterns = [];
if (supabaseHostname) {
  remotePatterns.push({ protocol: 'https', hostname: supabaseHostname });
}
remotePatterns.push({ protocol: 'https', hostname: '*.supabase.co' });

// VERCEL_PROJECT_PRODUCTION_URL is the project's production hostname
// (e.g. "kiwipop.com" or "kiwipop.vercel.app"), available even on preview
// builds. Fall back to NEXT_PUBLIC_SITE_URL for local dev.
const rawProductionUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  '';
const productionUrl = rawProductionUrl.startsWith('http')
  ? rawProductionUrl.replace(/\/$/, '')
  : rawProductionUrl
    ? `https://${rawProductionUrl.replace(/\/$/, '')}`
    : '';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  env: {
    // Baked into the client bundle so the running tab knows which build it is.
    NEXT_PUBLIC_BUILD_SHA:
      process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || '',
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || '',
    NEXT_PUBLIC_PRODUCTION_URL: productionUrl,
  },
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Allow cross-origin reads of the version endpoint so older
        // deployments can poll the production deployment's sha.
        source: '/api/version',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Cache-Control', value: 'no-store, no-cache, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
