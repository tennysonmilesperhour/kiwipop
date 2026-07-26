import 'server-only';

import {
  buyUspsLabel,
  isShipStationConfigured,
  type BuyLabelInput,
  type BuyLabelResult,
} from '@/lib/shipstation';
import {
  buyInternationalLabel,
  isEasyPostConfigured,
} from '@/lib/easypost';
import { isDomesticCountry } from '@/lib/shipping';

export interface RoutedLabelInput extends BuyLabelInput {
  customsValueCents: number;
}

export function labelProviderForCountry(country?: string | null) {
  return isDomesticCountry(country) ? 'shipstation' : 'easypost';
}

export function isLabelProviderConfigured(country?: string | null): boolean {
  return isDomesticCountry(country)
    ? isShipStationConfigured()
    : isEasyPostConfigured();
}

export function labelProviderConfigurationError(country?: string | null): string {
  return isDomesticCountry(country)
    ? 'SHIPSTATION_API_KEY / SHIPSTATION_API_SECRET are not configured.'
    : 'EASYPOST_API_KEY is not configured. Add an EasyPost production key to purchase Canada and international labels.';
}

export async function buyLabelForDestination(
  input: RoutedLabelInput,
): Promise<BuyLabelResult> {
  return isDomesticCountry(input.to.country)
    ? buyUspsLabel(input)
    : buyInternationalLabel(input);
}

