import 'server-only';

/* =========================================================
   Shippo — USPS label buying for the admin orders dashboard
   ---------------------------------------------------------
   Shippo wraps USPS / UPS / FedEx behind one REST API and
   ships back a PDF label URL we can hand to the admin to
   print. We pin to USPS-only and the cheapest service rate
   so the admin doesn't have to think.

   Required env:
     - SHIPPO_API_KEY                 (server-only)
   Optional (sensible defaults baked in):
     - SHIPPO_SHIP_FROM_NAME
     - SHIPPO_SHIP_FROM_STREET1
     - SHIPPO_SHIP_FROM_CITY
     - SHIPPO_SHIP_FROM_STATE
     - SHIPPO_SHIP_FROM_ZIP
     - SHIPPO_SHIP_FROM_PHONE
     - SHIPPO_SHIP_FROM_EMAIL
     - SHIPPO_PARCEL_LENGTH_IN  (default 6)
     - SHIPPO_PARCEL_WIDTH_IN   (default 4)
     - SHIPPO_PARCEL_HEIGHT_IN  (default 2)
     - SHIPPO_PARCEL_WEIGHT_OZ  (default 4 — small candy box)
   ========================================================= */

const SHIPPO_BASE = 'https://api.goshippo.com';

export interface AddressInput {
  name: string;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
  country?: string;
  phone?: string | null;
  email?: string | null;
}

export interface BuyLabelInput {
  to: AddressInput;
  /** Per-package metadata so the admin's email shows up on the label. */
  metadata?: string;
}

export interface BuyLabelResult {
  trackingNumber: string;
  labelUrl: string;
  carrier: 'usps';
  serviceLevel: string;
  rateCents: number;
  shippoTransactionId: string;
}

function getKey(): string {
  const key = process.env.SHIPPO_API_KEY;
  if (!key) {
    throw new Error(
      'SHIPPO_API_KEY is not set. Add it in Vercel → Project Settings → Environment Variables to enable USPS label printing.',
    );
  }
  return key;
}

function fromAddress(): AddressInput {
  return {
    name: process.env.SHIPPO_SHIP_FROM_NAME ?? 'Kiwi Pop',
    street1: process.env.SHIPPO_SHIP_FROM_STREET1 ?? '',
    city: process.env.SHIPPO_SHIP_FROM_CITY ?? 'Salt Lake City',
    state: process.env.SHIPPO_SHIP_FROM_STATE ?? 'UT',
    zip: process.env.SHIPPO_SHIP_FROM_ZIP ?? '',
    country: 'US',
    phone: process.env.SHIPPO_SHIP_FROM_PHONE ?? null,
    email: process.env.SHIPPO_SHIP_FROM_EMAIL ?? null,
  };
}

function defaultParcel() {
  return {
    length: process.env.SHIPPO_PARCEL_LENGTH_IN ?? '6',
    width: process.env.SHIPPO_PARCEL_WIDTH_IN ?? '4',
    height: process.env.SHIPPO_PARCEL_HEIGHT_IN ?? '2',
    distance_unit: 'in',
    weight: process.env.SHIPPO_PARCEL_WEIGHT_OZ ?? '4',
    mass_unit: 'oz',
  };
}

interface ShippoRate {
  object_id: string;
  amount: string;
  currency: string;
  provider: string;
  servicelevel: { name: string; token: string };
}

interface ShippoShipmentResponse {
  object_id: string;
  rates: ShippoRate[];
  messages?: Array<{ source: string; code: string; text: string }>;
}

interface ShippoTransactionResponse {
  object_id: string;
  status: string;
  tracking_number: string;
  label_url: string;
  rate: string;
  messages?: Array<{ source: string; code: string; text: string }>;
}

async function postShippo<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${SHIPPO_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `ShippoToken ${getKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const detail =
      (json && typeof json === 'object' && 'detail' in json && typeof json.detail === 'string'
        ? json.detail
        : null) ?? `Shippo HTTP ${response.status}`;
    throw new Error(`Shippo: ${detail}`);
  }
  return json as T;
}

/**
 * Buy the cheapest USPS label for an address. Returns tracking + a PDF
 * URL the admin can open to print.
 */
export async function buyUspsLabel(input: BuyLabelInput): Promise<BuyLabelResult> {
  const ship = await postShippo<ShippoShipmentResponse>('/shipments/', {
    address_from: fromAddress(),
    address_to: input.to,
    parcels: [defaultParcel()],
    async: false,
    metadata: input.metadata,
  });

  const uspsRates = (ship.rates ?? [])
    .filter((r) => r.provider?.toUpperCase() === 'USPS')
    .map((r) => ({ ...r, _amount: Number(r.amount) }))
    .filter((r) => Number.isFinite(r._amount) && r._amount > 0)
    .sort((a, b) => a._amount - b._amount);

  if (uspsRates.length === 0) {
    const msg =
      ship.messages?.map((m) => m.text).join(' · ') ||
      'no USPS rates returned (verify the from-address is in the US and ZIP is valid)';
    throw new Error(`Shippo: ${msg}`);
  }

  const cheapest = uspsRates[0]!;

  const tx = await postShippo<ShippoTransactionResponse>('/transactions/', {
    rate: cheapest.object_id,
    label_file_type: 'PDF',
    async: false,
  });

  if (tx.status !== 'SUCCESS') {
    const msg =
      tx.messages?.map((m) => m.text).join(' · ') ||
      `transaction status ${tx.status}`;
    throw new Error(`Shippo transaction: ${msg}`);
  }

  return {
    trackingNumber: tx.tracking_number,
    labelUrl: tx.label_url,
    carrier: 'usps',
    serviceLevel: cheapest.servicelevel.name,
    rateCents: Math.round(cheapest._amount * 100),
    shippoTransactionId: tx.object_id,
  };
}

export function isShippoConfigured(): boolean {
  return Boolean(process.env.SHIPPO_API_KEY);
}
