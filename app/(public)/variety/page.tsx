'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProductsBySkus } from '@/lib/hooks';
import { useCart } from '@/lib/store';
import { formatCentsToUSD } from '@/lib/format';
import { FLAVORS, FLAVOR_IMG, VARIETY_TIERS, type VarietyTier } from '@/lib/flavors';

const TIER_SKUS = VARIETY_TIERS.map((t) => t.sku);

export default function VarietyPage() {
  const { data: products } = useProductsBySkus(TIER_SKUS);
  const { addItem } = useCart();
  const router = useRouter();

  const [selectedSize, setSelectedSize] = useState<VarietyTier['size']>(20);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const productsBySku = useMemo(() => {
    const map = new Map<string, NonNullable<typeof products>[number]>();
    for (const row of products ?? []) {
      if (row.sku) map.set(row.sku, row);
    }
    return map;
  }, [products]);

  const selectedTier =
    VARIETY_TIERS.find((t) => t.size === selectedSize) ?? VARIETY_TIERS[1];
  const selectedProduct = productsBySku.get(selectedTier.sku);
  const linePriceCents = (selectedProduct?.price_cents ?? selectedTier.priceCents) * quantity;
  const strikeCents = selectedTier.size * 500 * quantity;

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addItem({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price_cents,
      quantity,
      image: selectedProduct.image_url ?? FLAVOR_IMG['KP-KIWI-KITTY'] ?? undefined,
      isPreorder: selectedProduct.preorder_only,
      preorderDeadline: selectedProduct.preorder_deadline,
    });
    // Jump straight to the cart so the user can finish checkout — the brief
    // "added" flash + 2s "view cart" button was easy to miss.
    router.push('/cart');
  };

  return (
    <div className="page-container">
      <Link
        href="/"
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '1.5rem', display: 'inline-block' }}
      >
        ← back to the drop
      </Link>

      <p className="stat-label" style={{ marginBottom: '0.5rem' }}>
        // variety pack · all four flavors
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: 'clamp(2.4rem, 7vw, 4.5rem)',
          letterSpacing: '-0.03em',
          textTransform: 'lowercase',
          color: 'var(--paper)',
          marginBottom: '1rem',
          lineHeight: 0.92,
        }}
      >
        try the whole drop.
      </h1>
      <p
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 14,
          lineHeight: 1.7,
          color: 'var(--bone)',
          maxWidth: 720,
          marginBottom: '2.5rem',
        }}
      >
        equal amounts of every flavor in one box · kiwi pop · lemon g. luci ·
        molly&apos;s mint · merry caramel apple · same functional payload across all
        four · ships preorder when the batch is ready.
      </p>

      <div
        className="card"
        style={{ padding: '2rem', marginBottom: '1rem' }}
      >
        <p className="stat-label" style={{ marginBottom: '1rem' }}>
          // pick a size
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          {VARIETY_TIERS.map((tier) => {
            const product = productsBySku.get(tier.sku);
            const live = !!product;
            const active = selectedSize === tier.size;
            return (
              <button
                key={tier.sku}
                type="button"
                onClick={() => setSelectedSize(tier.size)}
                disabled={!live}
                aria-pressed={active}
                style={{
                  textAlign: 'left',
                  padding: '1.2rem',
                  background: active ? 'rgba(245, 255, 61, 0.08)' : 'rgba(0, 0, 0, 0.25)',
                  border: `1.5px solid ${active ? 'var(--lemon, #f5ff3d)' : 'rgba(255,255,255,0.12)'}`,
                  cursor: live ? 'pointer' : 'not-allowed',
                  opacity: live ? 1 : 0.5,
                  fontFamily: 'var(--mono)',
                  color: 'var(--paper)',
                  transition: 'border-color 200ms ease, background 200ms ease',
                  position: 'relative',
                }}
              >
                {tier.badge ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      fontSize: 9,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--lemon, #f5ff3d)',
                      border: '1px solid var(--lemon, #f5ff3d)',
                      padding: '2px 7px',
                    }}
                  >
                    {tier.badge}
                  </span>
                ) : null}
                <div
                  style={{
                    fontFamily: 'var(--display)',
                    fontWeight: 800,
                    fontSize: 28,
                    color: active ? 'var(--lemon, #f5ff3d)' : 'var(--paper)',
                    marginBottom: 4,
                  }}
                >
                  {tier.size}×
                </div>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--bone)',
                    marginBottom: 10,
                  }}
                >
                  {tier.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--display)',
                    fontWeight: 700,
                    fontSize: 22,
                    color: 'var(--paper)',
                  }}
                >
                  {formatCentsToUSD(tier.priceCents)}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--bone)',
                    marginTop: 4,
                  }}
                >
                  {formatCentsToUSD(tier.perPopCents)}/pop · {tier.perFlavor} of each flavor
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: '2rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: '1.5rem',
          alignItems: 'center',
        }}
      >
        <div>
          <p className="stat-label" style={{ marginBottom: '0.5rem' }}>
            // your pick
          </p>
          <h2
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 800,
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              letterSpacing: '-0.02em',
              textTransform: 'lowercase',
              color: 'var(--paper)',
              marginBottom: '0.4rem',
            }}
          >
            variety pack · {selectedTier.size} pops
          </h2>
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              color: 'var(--bone)',
              marginBottom: '1rem',
            }}
          >
            {selectedTier.perFlavor} {FLAVORS.map((f) => f.name).join(' · ')}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label
              className="form-label"
              htmlFor="vp-qty"
              style={{ marginBottom: 0 }}
            >
              qty
            </label>
            <input
              id="vp-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="form-input"
              style={{ width: 90 }}
            />
            <div
              style={{
                fontFamily: 'var(--display)',
                fontWeight: 800,
                fontSize: 22,
                color: 'var(--lemon, #f5ff3d)',
              }}
            >
              {formatCentsToUSD(linePriceCents)}
            </div>
            {strikeCents > linePriceCents ? (
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  color: 'var(--bone)',
                  textDecoration: 'line-through',
                }}
              >
                {formatCentsToUSD(strikeCents)}
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={handleAddToCart}
            disabled={!selectedProduct}
          >
            {added
              ? '✓ added'
              : selectedProduct
                ? `preorder · ${formatCentsToUSD(linePriceCents)}`
                : 'unavailable'}
          </button>
          {added ? (
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => router.push('/cart')}
            >
              view cart →
            </button>
          ) : null}
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--bone)',
              opacity: 0.65,
              textAlign: 'center',
              margin: 0,
            }}
          >
            preorder · ships when the batch is ready
          </p>
        </div>
      </div>
    </div>
  );
}
