export const RETIRED_SKUS: readonly ['KP-PACK-3'];

export const RETIRED_ITEM_ERROR: 'This item is no longer available';

export function isRetiredSku(sku: string | null | undefined): boolean;

export interface RetiredCheckProduct {
  id: string;
  sku?: string | null;
}

export interface RetiredCheckoutRejection {
  status: 409;
  error: typeof RETIRED_ITEM_ERROR;
  retiredProductIds: string[];
}

/** 409 when a cart contains a retired SKU. Null when every line is still for sale. */
export function retiredCheckoutRejection(
  products: ReadonlyArray<RetiredCheckProduct>
): RetiredCheckoutRejection | null;
