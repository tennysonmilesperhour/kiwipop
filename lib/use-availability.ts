'use client';

import { useEffect, useState } from 'react';

export interface AvailabilityProduct {
  id: string;
  in_stock: number;
  preorder_only: boolean;
  preorder_deadline: string | null;
}

export interface StorefrontAvailability {
  preorderOnlyMode: boolean;
  products: AvailabilityProduct[];
}

/**
 * Live stock and preorder flags for the cart and checkout. The cart only
 * remembers what was true when the item was added.
 */
export function useStorefrontAvailability(productIds: string[]): {
  availability: StorefrontAvailability | null;
  loading: boolean;
} {
  const key = [...productIds].sort().join(',');
  const [availability, setAvailability] = useState<StorefrontAvailability | null>(null);
  const [loading, setLoading] = useState(productIds.length > 0);

  useEffect(() => {
    if (!key) {
      setAvailability(null);
      setLoading(false);
      return;
    }
    let cancel = false;
    setLoading(true);
    fetch('/api/storefront/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: key.split(',') }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('availability failed');
        return (await response.json()) as StorefrontAvailability;
      })
      .then((json) => {
        if (!cancel) setAvailability(json);
      })
      .catch(() => {
        if (!cancel) setAvailability(null);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [key]);

  return { availability, loading };
}
