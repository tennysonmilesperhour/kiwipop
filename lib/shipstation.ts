import 'server-only';

/* =========================================================
   ShipStation V1 — USPS label buying + on-demand PDF fetch.
   ---------------------------------------------------------
   ShipStation handles carrier billing on their side: you
   connect Stamps.com (USPS) inside the ShipStation dashboard
   once, then this module just calls /shipments/createlabel
   with the to/from/dimensions and gets back a base64 label
   PDF + tracking number.

   Why ShipStation over Shippo: ShipStation's commercial USPS
   rates have no per-label markup (Shippo adds $0.05/label).
   On a $10/mo plan that pays for itself past ~150 labels.

   Required env:
     - SHIPSTATION_API_KEY
     - SHIPSTATION_API_SECRET
   Optional (sensible defaults baked in):
     - SHIPSTATION_CARRIER_CODE      (default: stamps_com)
     - SHIPSTATION_SERVICE_CODE      (default: usps_ground_advantage)
     - SHIPSTATION_PACKAGE_CODE      (default: package)
     - SHIPSTATION_SHIP_FROM_NAME, _STREET1, _CITY, _STATE, _ZIP, _PHONE
     - SHIPSTATION_PARCEL_LENGTH_IN  (default 6)
     - SHIPSTATION_PARCEL_WIDTH_IN   (default 4)
     - SHIPSTATION_PARCEL_HEIGHT_IN  (default 2)
     - SHIPSTATION_PARCEL_WEIGHT_OZ  (default 4 — small candy box)
   ========================================================= */

const SHIPSTATION_BASE = 'https://ssapi.shipstation.com';

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
  /** Free-form note attached to the ShipStation shipment record. */
  metadata?: string;
}

export interface BuyLabelResult {
  trackingNumber: string;
  /** ShipStation shipmentId (numeric, but stored as string for safety). */
  providerShipmentId: string;
  carrier: string;
  serviceLevel: string;
  rateCents: number;
  /** base64 PDF — the modal uses our own server endpoint to re-fetch
   *  on demand instead of stuffing this in the DB row. */
  labelDataB64: string;
}

function basicAuthHeader(): string {
  const key = process.env.SHIPSTATION_API_KEY;
  const secret = process.env.SHIPSTATION_API_SECRET;
  if (!key || !secret) {
    throw new Error(
      'SHIPSTATION_API_KEY / SHIPSTATION_API_SECRET are not set. Add them in Vercel → Project Settings → Environment Variables.',
    );
  }
  const token = Buffer.from(`${key}:${secret}`).toString('base64');
  return `Basic ${token}`;
}

function fromAddress(): AddressInput {
  return {
    name: process.env.SHIPSTATION_SHIP_FROM_NAME ?? 'Kiwi Pop',
    street1: process.env.SHIPSTATION_SHIP_FROM_STREET1 ?? '',
    city: process.env.SHIPSTATION_SHIP_FROM_CITY ?? 'Salt Lake City',
    state: process.env.SHIPSTATION_SHIP_FROM_STATE ?? 'UT',
    zip: process.env.SHIPSTATION_SHIP_FROM_ZIP ?? '',
    country: 'US',
    phone: process.env.SHIPSTATION_SHIP_FROM_PHONE ?? null,
  };
}

function defaultParcel() {
  return {
    weight: {
      value: Number(process.env.SHIPSTATION_PARCEL_WEIGHT_OZ ?? '4') || 4,
      units: 'ounces',
    },
    dimensions: {
      units: 'inches',
      length: Number(process.env.SHIPSTATION_PARCEL_LENGTH_IN ?? '6') || 6,
      width: Number(process.env.SHIPSTATION_PARCEL_WIDTH_IN ?? '4') || 4,
      height: Number(process.env.SHIPSTATION_PARCEL_HEIGHT_IN ?? '2') || 2,
    },
  };
}

interface CreateLabelResponse {
  shipmentId: number;
  orderId: number | null;
  carrierCode: string;
  serviceCode: string;
  shipmentCost: number;
  insuranceCost?: number;
  trackingNumber: string;
  /** base64-encoded PDF (default) */
  labelData: string;
}

interface ShipStationErrorResponse {
  Message?: string;
  ExceptionMessage?: string;
  ModelState?: Record<string, string[]>;
}

async function postShipStation<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${SHIPSTATION_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const json = (await response.json()) as ShipStationErrorResponse;
      detail =
        json.ExceptionMessage ??
        json.Message ??
        (json.ModelState
          ? Object.values(json.ModelState).flat().join(' · ')
          : detail);
    } catch {
      // body wasn't JSON
    }
    throw new Error(`ShipStation: ${detail}`);
  }

  return (await response.json()) as T;
}

/**
 * Buy the cheapest USPS service label for an address. Returns tracking +
 * the base64 label PDF plus a ShipStation shipmentId we can use later
 * to re-fetch the label PDF on demand.
 */
export async function buyUspsLabel(input: BuyLabelInput): Promise<BuyLabelResult> {
  const carrierCode = process.env.SHIPSTATION_CARRIER_CODE ?? 'stamps_com';
  const serviceCode =
    process.env.SHIPSTATION_SERVICE_CODE ?? 'usps_ground_advantage';
  const packageCode = process.env.SHIPSTATION_PACKAGE_CODE ?? 'package';
  const parcel = defaultParcel();

  const today = new Date().toISOString().slice(0, 10);

  const body = {
    carrierCode,
    serviceCode,
    packageCode,
    confirmation: 'none',
    shipDate: today,
    weight: parcel.weight,
    dimensions: parcel.dimensions,
    shipFrom: {
      name: fromAddress().name,
      street1: fromAddress().street1,
      city: fromAddress().city,
      state: fromAddress().state,
      postalCode: fromAddress().zip,
      country: fromAddress().country ?? 'US',
      phone: fromAddress().phone ?? undefined,
    },
    shipTo: {
      name: input.to.name,
      street1: input.to.street1,
      street2: input.to.street2 ?? undefined,
      city: input.to.city,
      state: input.to.state,
      postalCode: input.to.zip,
      country: input.to.country ?? 'US',
      phone: input.to.phone ?? undefined,
    },
    testLabel: false,
  };

  const label = await postShipStation<CreateLabelResponse>(
    '/shipments/createlabel',
    body,
  );

  return {
    trackingNumber: label.trackingNumber,
    providerShipmentId: String(label.shipmentId),
    carrier: 'usps',
    serviceLevel: serviceCode,
    rateCents: Math.round((label.shipmentCost ?? 0) * 100),
    labelDataB64: label.labelData,
  };
}

export function isShipStationConfigured(): boolean {
  return Boolean(
    process.env.SHIPSTATION_API_KEY && process.env.SHIPSTATION_API_SECRET,
  );
}
