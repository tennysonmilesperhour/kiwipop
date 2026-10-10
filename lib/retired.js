/**
 * Catalog SKUs that stay in the database but are no longer for sale.
 * There is no visibility column; this list is the storefront hide switch.
 */
const RETIRED_SKUS = Object.freeze(['KP-PACK-3']);

const RETIRED_ITEM_ERROR = 'This item is no longer available';

/**
 * @param {string | null | undefined} sku
 * @returns {boolean}
 */
function isRetiredSku(sku) {
  return typeof sku === 'string' && RETIRED_SKUS.includes(sku);
}

/**
 * @param {ReadonlyArray<{ id: string, sku?: string | null }>} products
 * @returns {{ status: 409, error: string, retiredProductIds: string[] } | null}
 */
function retiredCheckoutRejection(products) {
  const retiredProductIds = products
    .filter((product) => isRetiredSku(product.sku))
    .map((product) => product.id);
  if (retiredProductIds.length === 0) return null;
  return {
    status: 409,
    error: RETIRED_ITEM_ERROR,
    retiredProductIds,
  };
}

module.exports = {
  RETIRED_SKUS,
  RETIRED_ITEM_ERROR,
  isRetiredSku,
  retiredCheckoutRejection,
};
