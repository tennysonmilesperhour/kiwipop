import 'server-only';

import type { AddressInput, BuyLabelInput, BuyLabelResult } from '@/lib/shipstation';

const EASYPOST_BASE = 'https://api.easypost.com/v2';

interface EasyPostRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
}

interface EasyPostShipment {
  id: string;
  tracking_code: string | null;
  rates: EasyPostRate[];
  selected_rate: EasyPostRate | null;
  postage_label: {
    label_url: string | null;
    label_pdf_url: string | null;
  } | null;
  messages?: Array<{ message?: string }>;
}

interface EasyPostError {
  error?: {
    message?: string;
    errors?: Array<{ message?: string }>;
  };
}

function apiKey(): string {
  const key = process.env.EASYPOST_API_KEY;
  if (!key) {
    throw new Error(
      'EASYPOST_API_KEY is not set. Add an EasyPost production API key in Vercel.',
    );
  }
  return key;
}

async function easyPost<T>(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${EASYPOST_BASE}${path}`, {
    method: init.method ?? 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey()}:`).toString('base64')}`,
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const json = (await response.json()) as EasyPostError;
      detail =
        json.error?.errors?.map((error) => error.message).filter(Boolean).join(' · ') ||
        json.error?.message ||
        detail;
    } catch {
      // EasyPost occasionally returns an empty/non-JSON upstream error.
    }
    throw new Error(`EasyPost: ${detail}`);
  }

  return (await response.json()) as T;
}

function fromAddress(): AddressInput {
  return {
    name:
      process.env.EASYPOST_SHIP_FROM_NAME ??
      process.env.SHIPSTATION_SHIP_FROM_NAME ??
      'Kiwi Pop',
    street1:
      process.env.EASYPOST_SHIP_FROM_STREET1 ??
      process.env.SHIPSTATION_SHIP_FROM_STREET1 ??
      '',
    city:
      process.env.EASYPOST_SHIP_FROM_CITY ??
      process.env.SHIPSTATION_SHIP_FROM_CITY ??
      'Salt Lake City',
    state:
      process.env.EASYPOST_SHIP_FROM_STATE ??
      process.env.SHIPSTATION_SHIP_FROM_STATE ??
      'UT',
    zip:
      process.env.EASYPOST_SHIP_FROM_ZIP ??
      process.env.SHIPSTATION_SHIP_FROM_ZIP ??
      '',
    country: 'US',
    phone:
      process.env.EASYPOST_SHIP_FROM_PHONE ??
      process.env.SHIPSTATION_SHIP_FROM_PHONE ??
      null,
    email: process.env.EASYPOST_SHIP_FROM_EMAIL ?? null,
  };
}

function parcel() {
  return {
    length: Number(process.env.EASYPOST_PARCEL_LENGTH_IN ?? process.env.SHIPSTATION_PARCEL_LENGTH_IN ?? '6') || 6,
    width: Number(process.env.EASYPOST_PARCEL_WIDTH_IN ?? process.env.SHIPSTATION_PARCEL_WIDTH_IN ?? '4') || 4,
    height: Number(process.env.EASYPOST_PARCEL_HEIGHT_IN ?? process.env.SHIPSTATION_PARCEL_HEIGHT_IN ?? '2') || 2,
    weight: Number(process.env.EASYPOST_PARCEL_WEIGHT_OZ ?? process.env.SHIPSTATION_PARCEL_WEIGHT_OZ ?? '4') || 4,
  };
}

function toEasyPostAddress(address: AddressInput) {
  return {
    name: address.name,
    street1: address.street1,
    street2: address.street2 ?? undefined,
    city: address.city,
    state: address.state || undefined,
    zip: address.zip,
    country: address.country,
    phone: address.phone ?? undefined,
    email: address.email ?? undefined,
  };
}

function allowedCarriers(): Set<string> {
  const configured =
    process.env.EASYPOST_INTERNATIONAL_CARRIERS ?? 'UPS,DHLExpress,FedEx';
  return new Set(
    configured
      .split(',')
      .map((carrier) => carrier.trim().toLowerCase())
      .filter(Boolean),
  );
}

function chooseRate(rates: EasyPostRate[]): EasyPostRate {
  const allowed = allowedCarriers();
  const eligible = rates.filter(
    (rate) =>
      rate.currency === 'USD' &&
      [...allowed].some((carrier) =>
        rate.carrier.trim().toLowerCase().startsWith(carrier),
      ),
  );
  if (eligible.length === 0) {
    const available = [...new Set(rates.map((rate) => rate.carrier))].join(', ');
    throw new Error(
      `EasyPost: no configured non-USPS international rate was returned. Available carriers: ${available || 'none'}. Connect UPS, DHL Express, or FedEx in EasyPost, or update EASYPOST_INTERNATIONAL_CARRIERS.`,
    );
  }
  return eligible.sort((a, b) => Number(a.rate) - Number(b.rate))[0];
}

async function downloadLabelPdf(shipment: EasyPostShipment): Promise<string> {
  let withPdf = shipment;
  if (!shipment.postage_label?.label_pdf_url) {
    withPdf = await easyPost<EasyPostShipment>(
      `/shipments/${encodeURIComponent(shipment.id)}/label?file_format=PDF`,
      { method: 'GET' },
    );
  }
  const url = withPdf.postage_label?.label_pdf_url;
  if (!url) {
    throw new Error('EasyPost bought the label but could not provide a PDF label.');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EasyPost label download failed: HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer()).toString('base64');
}

function carrierSlug(carrier: string): string {
  const normalized = carrier.toLowerCase();
  if (normalized.includes('ups')) return 'ups';
  if (normalized.includes('fedex')) return 'fedex';
  if (normalized.includes('dhl')) return 'dhl';
  if (normalized.includes('canada')) return 'canadapost';
  return 'other';
}

export interface BuyInternationalLabelInput extends BuyLabelInput {
  customsValueCents: number;
}

export async function buyInternationalLabel(
  input: BuyInternationalLabelInput,
): Promise<BuyLabelResult> {
  if (!input.to.country || input.to.country.toUpperCase() === 'US') {
    throw new Error('EasyPost international labels require a non-US destination.');
  }

  const shipmentParcel = parcel();
  const from = fromAddress();
  if (!from.street1 || !from.zip) {
    throw new Error(
      'EasyPost ship-from street and ZIP are required. Configure EASYPOST_SHIP_FROM_* (or the existing SHIPSTATION_SHIP_FROM_* values).',
    );
  }

  const valueDollars = Math.max(input.customsValueCents, 1) / 100;
  const shipment = await easyPost<EasyPostShipment>('/shipments', {
    body: {
      shipment: {
        reference: input.metadata,
        to_address: toEasyPostAddress(input.to),
        from_address: toEasyPostAddress(from),
        parcel: shipmentParcel,
        options: { label_format: 'PDF', label_size: '4x6' },
        customs_info: {
          contents_type: 'merchandise',
          customs_certify: true,
          customs_signer: from.name,
          eel_pfc: 'NOEEI 30.37(a)',
          non_delivery_option: 'return',
          restriction_type: 'none',
          customs_items: [
            {
              description:
                process.env.EASYPOST_CUSTOMS_DESCRIPTION ??
                'Sugar-free confectionery',
              quantity: 1,
              weight: shipmentParcel.weight,
              value: valueDollars.toFixed(2),
              currency: 'USD',
              hs_tariff_number:
                process.env.EASYPOST_CUSTOMS_HS_TARIFF_NUMBER ?? '170490',
              origin_country:
                process.env.EASYPOST_CUSTOMS_ORIGIN_COUNTRY ?? 'US',
            },
          ],
        },
      },
    },
  });

  const rate = chooseRate(shipment.rates);
  const purchased = await easyPost<EasyPostShipment>(
    `/shipments/${encodeURIComponent(shipment.id)}/buy`,
    { body: { rate: { id: rate.id } } },
  );
  const labelDataB64 = await downloadLabelPdf(purchased);
  if (!purchased.tracking_code) {
    throw new Error('EasyPost bought the label but returned no tracking number.');
  }

  return {
    trackingNumber: purchased.tracking_code,
    providerShipmentId: purchased.id,
    carrier: carrierSlug(rate.carrier),
    serviceLevel: `${rate.carrier} ${rate.service}`,
    rateCents: Math.round(Number(rate.rate) * 100),
    labelDataB64,
  };
}

export function isEasyPostConfigured(): boolean {
  return Boolean(process.env.EASYPOST_API_KEY);
}
