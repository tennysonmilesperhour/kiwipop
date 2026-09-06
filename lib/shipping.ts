export const SUPPORTED_SHIPPING_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
] as const;

export type SupportedShippingCountry =
  (typeof SUPPORTED_SHIPPING_COUNTRIES)[number]['code'];

const supportedCodes = new Set<string>(
  SUPPORTED_SHIPPING_COUNTRIES.map(({ code }) => code),
);

export function normalizeCountry(country?: string | null): string {
  return (country || 'US').trim().toUpperCase();
}

export function isSupportedShippingCountry(
  country?: string | null,
): country is SupportedShippingCountry {
  return supportedCodes.has(normalizeCountry(country));
}

export function isDomesticCountry(country?: string | null): boolean {
  return normalizeCountry(country) === 'US';
}

export function shippingRegion(country?: string | null): 'domestic' | 'canada' | 'international' {
  const normalized = normalizeCountry(country);
  if (normalized === 'US') return 'domestic';
  if (normalized === 'CA') return 'canada';
  return 'international';
}

export function shippingChargeCents(
  subtotalCents: number,
  country?: string | null,
): number {
  switch (shippingRegion(country)) {
    case 'domestic':
      return subtotalCents >= 4_000 ? 0 : 499;
    case 'canada':
      return 1_499;
    case 'international':
      return 2_499;
  }
}

