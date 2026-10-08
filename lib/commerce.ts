/**
 * Storefront availability. Uses products.in_stock, products.preorder_only,
 * products.preorder_deadline, and the site-wide preorder-only setting.
 * A preorder is never treated as sold out.
 */

export function isPreorderItem(input: {
  preorderOnly: boolean;
  sitePreorderMode?: boolean;
}): boolean {
  return Boolean(input.sitePreorderMode) || input.preorderOnly;
}

export function isSoldOut(input: {
  inStock: number;
  preorderOnly: boolean;
  sitePreorderMode?: boolean;
}): boolean {
  if (isPreorderItem(input)) return false;
  return input.inStock <= 0;
}

function shipWindow(deadline?: string | null): string | null {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Plain-language preorder promise. A deadline on the product is the
 * estimated ship window. Without one, we don't invent a date.
 */
export function classifyCartLine(
  item: { productId: string; isPreorder: boolean; preorderDeadline?: string | null },
  live: {
    preorderOnlyMode: boolean;
    products: Array<{
      id: string;
      in_stock: number;
      preorder_only: boolean;
      preorder_deadline: string | null;
    }>;
  } | null
): { preorder: boolean; soldOut: boolean; note: string | null } {
  const row = live?.products.find((product) => product.id === item.productId);
  if (!row || !live) {
    const preorder = item.isPreorder;
    return {
      preorder,
      soldOut: false,
      note: preorder ? preorderFulfillmentNote(item.preorderDeadline) : null,
    };
  }
  const preorder = isPreorderItem({
    preorderOnly: row.preorder_only,
    sitePreorderMode: live.preorderOnlyMode,
  });
  return {
    preorder,
    soldOut: isSoldOut({
      inStock: row.in_stock,
      preorderOnly: row.preorder_only,
      sitePreorderMode: live.preorderOnlyMode,
    }),
    note: preorder
      ? preorderFulfillmentNote(row.preorder_deadline ?? item.preorderDeadline)
      : null,
  };
}

export function preorderFulfillmentNote(deadline?: string | null): string {
  const window = shipWindow(deadline);
  if (window) {
    return `Your card is charged today. Estimated ship window: ${window}. Ships when that batch is ready, we'll email you.`;
  }
  return "Your card is charged today. Ships when ready, we'll email you.";
}
