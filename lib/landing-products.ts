import 'server-only';
import { supabaseAdmin } from './supabase-admin';
import { FLAVORS, PACKS, type FlavorBrandInfo, type PackTier } from './flavors';

export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  price_cents: number;
  preorder_only: boolean;
  in_stock: number;
  image_url: string | null;
  description: string | null;
}

export interface LandingFlavor extends FlavorBrandInfo {
  product: ProductRow | null;
}

export interface LandingPack extends PackTier {
  product: ProductRow | null;
}

export interface LandingProducts {
  flavors: LandingFlavor[];
  packs: LandingPack[];
  donation: ProductRow | null;
  varietyHalfOff: ProductRow | null;
}

const PACK_SKU_BY_SIZE: Record<number, string> = {
  1: 'KP-KIWI-KITTY',
  3: 'KP-PACK-3',
  6: 'KP-PACK-6',
  12: 'KP-PACK-12',
};

const FUNDRAISER_SKUS = {
  donation: 'KP-DONATION-1USD',
  varietyHalfOff: 'KP-VARIETY-PREORDER-HALF',
};

const ALL_SKUS = [
  ...FLAVORS.map((f) => f.sku),
  'KP-PACK-3',
  'KP-PACK-6',
  'KP-PACK-12',
  FUNDRAISER_SKUS.donation,
  FUNDRAISER_SKUS.varietyHalfOff,
];

/**
 * Loads every product the landing page needs in one round trip and resolves
 * each flavor / pack / fundraiser tier to its DB row by SKU. Returns nulls
 * for any SKU the DB hasn't been seeded with so the UI can downgrade
 * gracefully (e.g., add-to-cart button becomes a notify-me link).
 */
export async function loadLandingProducts(): Promise<LandingProducts> {
  let bySku = new Map<string, ProductRow>();

  try {
    const { data } = await supabaseAdmin
      .from('products')
      .select('id, sku, name, price_cents, preorder_only, in_stock, image_url, description')
      .in('sku', ALL_SKUS);

    if (data) {
      bySku = new Map(
        (data as ProductRow[])
          .filter((row): row is ProductRow => Boolean(row.sku))
          .map((row) => [row.sku, row]),
      );
    }
  } catch {
    // fall through to empty map; the UI handles missing rows
  }

  const flavors: LandingFlavor[] = FLAVORS.map((flavor) => ({
    ...flavor,
    product: bySku.get(flavor.sku) ?? null,
  }));

  const packs: LandingPack[] = PACKS.map((pack) => ({
    ...pack,
    product: bySku.get(PACK_SKU_BY_SIZE[pack.size] ?? '') ?? null,
  }));

  return {
    flavors,
    packs,
    donation: bySku.get(FUNDRAISER_SKUS.donation) ?? null,
    varietyHalfOff: bySku.get(FUNDRAISER_SKUS.varietyHalfOff) ?? null,
  };
}
