import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { formatCentsToUSD } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ShippingAddress {
  firstName?: string | null;
  lastName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  kind?: string | null;
}

interface OrderRow {
  id: string;
  user_email: string | null;
  total_cents: number;
  created_at: string;
  shipping_address: ShippingAddress | null;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  quantity: number;
  price_cents: number;
  products: { name: string | null; sku: string | null } | null;
}

interface ShipmentRow {
  order_id: string;
  carrier: string | null;
  tracking_number: string | null;
}

function escape(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Returns a printable HTML page with one packing slip per requested order.
 * Admin opens in a tab and hits Cmd/Ctrl+P — the print stylesheet enforces
 * one-slip-per-page (US Letter) and hides the print button.
 *
 * Query: ?ids=uuid,uuid,uuid  (comma-separated, max 50)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const idsParam = request.nextUrl.searchParams.get('ids') ?? '';
  const orderIds = idsParam
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 50);

  if (orderIds.length === 0) {
    return new NextResponse('Pass ?ids=uuid,uuid,…', { status: 400 });
  }

  const [{ data: orders }, { data: items }, { data: shipments }] =
    await Promise.all([
      supabaseAdmin
        .from('orders')
        .select('id, user_email, total_cents, created_at, shipping_address')
        .in('id', orderIds)
        .returns<OrderRow[]>(),
      supabaseAdmin
        .from('order_items')
        .select('id, order_id, quantity, price_cents, products(name, sku)')
        .in('order_id', orderIds)
        .returns<OrderItemRow[]>(),
      supabaseAdmin
        .from('shipments')
        .select('order_id, carrier, tracking_number')
        .in('order_id', orderIds)
        .returns<ShipmentRow[]>(),
    ]);

  const itemsByOrder = new Map<string, OrderItemRow[]>();
  for (const it of items ?? []) {
    const arr = itemsByOrder.get(it.order_id) ?? [];
    arr.push(it);
    itemsByOrder.set(it.order_id, arr);
  }
  const shipmentByOrder = new Map<string, ShipmentRow>();
  for (const s of shipments ?? []) {
    shipmentByOrder.set(s.order_id, s);
  }

  // Render in the order requested by the user.
  const orderById = new Map<string, OrderRow>();
  for (const o of orders ?? []) orderById.set(o.id, o);

  const slips = orderIds
    .map((id) => orderById.get(id))
    .filter((o): o is OrderRow => Boolean(o))
    .map((order) => {
      const addr = order.shipping_address;
      const fullName =
        [addr?.firstName, addr?.lastName].filter(Boolean).join(' ').trim() ||
        'Kiwi Pop Customer';
      const orderItems = itemsByOrder.get(order.id) ?? [];
      const shipment = shipmentByOrder.get(order.id);

      const itemsRows = orderItems
        .map(
          (it) => `
            <tr>
              <td>${escape(it.products?.name ?? 'Unknown')}</td>
              <td class="r">${it.quantity}</td>
              <td class="r">${formatCentsToUSD(
                (it.price_cents ?? 0) * (it.quantity ?? 1),
              )}</td>
            </tr>`,
        )
        .join('');

      return `
        <section class="slip">
          <header class="slip-h">
            <div>
              <div class="brand">KIWI POP</div>
              <div class="muted">Salt Lake City, UT · kiwipop.fun</div>
            </div>
            <div class="r">
              <div class="muted">ORDER</div>
              <div class="mono">${escape(order.id.slice(0, 8))}</div>
              <div class="muted" style="margin-top:6px">PLACED</div>
              <div>${new Date(order.created_at).toLocaleDateString()}</div>
            </div>
          </header>

          <div class="grid">
            <div>
              <div class="muted">SHIP TO</div>
              <div><strong>${escape(fullName)}</strong></div>
              <div>${escape(addr?.address ?? '')}</div>
              <div>${escape(addr?.city ?? '')}${addr?.city ? ', ' : ''}${escape(addr?.state ?? '')} ${escape(addr?.zip ?? '')}</div>
              <div>${escape(addr?.country ?? 'US')}</div>
            </div>
            <div>
              <div class="muted">CONTACT</div>
              <div>${escape(order.user_email ?? '—')}</div>
              ${
                shipment?.tracking_number
                  ? `<div class="muted" style="margin-top:8px">TRACKING (${escape((shipment.carrier ?? 'usps').toUpperCase())})</div>
                     <div class="mono">${escape(shipment.tracking_number)}</div>`
                  : ''
              }
            </div>
          </div>

          <table class="items">
            <thead>
              <tr>
                <th>Item</th>
                <th class="r">Qty</th>
                <th class="r">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                <td class="r"><strong>Total</strong></td>
                <td class="r"><strong>${formatCentsToUSD(order.total_cents)}</strong></td>
              </tr>
            </tfoot>
          </table>

          <footer class="slip-f">
            thank you for trying kiwi pop · this is v1, made by hand · tell us what hits and what doesn't.
          </footer>
        </section>
      `;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Kiwi Pop · Packing slips</title>
  <style>
    @page { size: letter; margin: 0.5in; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #111;
      background: #f5f5f7;
      padding: 16px;
    }
    .toolbar {
      max-width: 7.5in;
      margin: 0 auto 16px;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .toolbar button {
      padding: 8px 14px;
      border-radius: 8px;
      background: #111;
      color: #fff;
      border: 0;
      cursor: pointer;
      font-weight: 600;
    }
    .slip {
      max-width: 7.5in;
      margin: 0 auto 24px;
      background: #fff;
      padding: 0.5in;
      border-radius: 8px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.06);
      page-break-after: always;
      break-after: page;
    }
    .slip:last-child { page-break-after: auto; }
    .slip-h {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 2px solid #111;
      margin-bottom: 18px;
    }
    .brand {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.04em;
    }
    .muted {
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #6b6b6b;
      font-weight: 600;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
      font-size: 14px;
    }
    .grid > div > div + div { margin-top: 4px; }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
    }
    .r { text-align: right; }
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
      font-size: 14px;
    }
    table.items th, table.items td {
      padding: 10px 6px;
      border-bottom: 1px solid #eaeaea;
    }
    table.items th {
      text-align: left;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6b6b6b;
      font-weight: 700;
      border-bottom: 1px solid #111;
    }
    table.items tfoot td { border-bottom: 0; padding-top: 16px; font-size: 16px; }
    .slip-f {
      font-size: 12px;
      color: #6b6b6b;
      text-align: center;
      font-style: italic;
      padding-top: 16px;
      border-top: 1px dashed #d4d4d4;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none; }
      .slip { box-shadow: none; padding: 0; margin: 0; max-width: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" onclick="window.print()">Print all slips →</button>
  </div>
  ${slips}
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
}
