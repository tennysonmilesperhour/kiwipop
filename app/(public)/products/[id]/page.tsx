'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProduct, useProductsBySkus } from '@/lib/hooks';
import { useCart } from '@/lib/store';
import { formatCentsToUSD } from '@/lib/format';
import { FLAVORS_BY_SKU, FUNCTIONALS, TIMELINE, imageForProduct } from '@/lib/flavors';

interface ProductPageProps {
  params: { id: string };
}

const PACK_LADDER_SKUS = ['KP-KIWI-KITTY', 'KP-PACK-6', 'KP-PACK-20'] as const;

interface PackTile {
  sku: string;
  size: 1 | 6 | 20;
  label: string;
  perPopCents?: number;
  badge?: string;
}

const PACK_TILES: readonly PackTile[] = [
  { sku: 'KP-KIWI-KITTY', size: 1, label: 'single' },
  { sku: 'KP-PACK-6', size: 6, label: '6-pack', perPopCents: 417, badge: 'share size' },
  { sku: 'KP-PACK-20', size: 20, label: 'party pack', perPopCents: 300, badge: 'best value' },
];

export default function ProductPage({ params }: ProductPageProps) {
  const { data: pageProduct, isLoading, error } = useProduct(params.id);
  const { data: packProducts } = useProductsBySkus(PACK_LADDER_SKUS);
  const { addItem } = useCart();
  const [packSize, setPackSize] = useState<1 | 6 | 20>(1);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const packProductBySku = useMemo(() => {
    const map = new Map<string, NonNullable<typeof packProducts>[number]>();
    for (const row of packProducts ?? []) {
      if (row.sku) map.set(row.sku, row);
    }
    return map;
  }, [packProducts]);

  const isKiwiKittyFamily =
    pageProduct?.sku === 'KP-KIWI-KITTY' ||
    pageProduct?.sku === 'KP-PACK-6' ||
    pageProduct?.sku === 'KP-PACK-20';

  const selectedTile = PACK_TILES.find((t) => t.size === packSize) ?? PACK_TILES[0];
  const selectedPackProduct = packProductBySku.get(selectedTile.sku);

  const checkoutProduct = isKiwiKittyFamily ? selectedPackProduct : pageProduct;
  const linePriceCents = (checkoutProduct?.price_cents ?? 0) * quantity;

  if (isLoading) {
    return (
      <div className="page-container loading-page">
        <p style={{ color: 'var(--bone)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          loading…
        </p>
      </div>
    );
  }
  if (error || !pageProduct) {
    return (
      <div className="page-container">
        <p className="alert alert-error">product not found.</p>
        <Link href="/" className="btn btn-primary">
          back to the drop
        </Link>
      </div>
    );
  }

  const flavor = pageProduct.sku ? FLAVORS_BY_SKU[pageProduct.sku] : undefined;
  const accent = flavor?.color ?? 'var(--lime)';
  const description = pageProduct.description || flavor?.description || '';
  // Resolve the hero image SKU-aware: prefer the DB image_url if set, else
  // fall back to the brand asset for this flavor's SKU. Bundle SKUs (e.g.
  // KP-PACK-6 / KP-PACK-20) inherit the page flavor's photo because there's
  // no separate bundle photography yet.
  const heroImage =
    imageForProduct(pageProduct.sku, pageProduct.image_url) ??
    '/landing/img/kiwi-kitty-pop.webp';

  const handleAddToCart = () => {
    if (!checkoutProduct) return;
    addItem({
      productId: checkoutProduct.id,
      name: checkoutProduct.name,
      price: checkoutProduct.price_cents,
      quantity,
      // Bundles fall back to the page hero (the flavor photo) so the cart
      // line item shows something recognizable.
      image: imageForProduct(checkoutProduct.sku, checkoutProduct.image_url) ?? heroImage,
      isPreorder: checkoutProduct.preorder_only,
      preorderDeadline: checkoutProduct.preorder_deadline,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="page-container">
      <Link
        href="/#drop"
        className="hero-tagline"
        style={{
          color: 'var(--bone)',
          marginBottom: '1.5rem',
          display: 'inline-block',
        }}
      >
        ← back to the drop
      </Link>

      <div className="product-detail">
        <div
          className="product-image-wrap"
          style={{
            background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15), ${accent} 40%, color-mix(in srgb, ${accent}, black 60%) 100%)`,
          }}
        >
          <Image
            src={heroImage}
            alt={pageProduct.name}
            width={600}
            height={600}
          />
          {pageProduct.preorder_only && (
            <div className="preorder-badge">preorder</div>
          )}
        </div>

        <div>
          <p className="product-eyebrow">
            {flavor ? flavor.feeling : '// kiwi pop'}
          </p>
          <h1>{pageProduct.name.toLowerCase()}</h1>
          <p className="product-price">
            {checkoutProduct
              ? formatCentsToUSD(checkoutProduct.price_cents)
              : formatCentsToUSD(pageProduct.price_cents)}
            {isKiwiKittyFamily && selectedTile.size > 1 && selectedTile.perPopCents ? (
              <span
                style={{
                  fontSize: '0.45em',
                  marginLeft: '0.6rem',
                  color: 'var(--bone)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                · {formatCentsToUSD(selectedTile.perPopCents)}/pop
              </span>
            ) : null}
          </p>

          {description && <p className="product-description">{description}</p>}

          {flavor && (
            <div
              className="card"
              style={{ marginTop: '1.5rem', background: 'var(--midnight)' }}
            >
              <div className="spec-grid" style={{ border: 'none' }}>
                <div className="spec-cell" style={{ borderRight: 0 }}>
                  <div className="spec-label">function</div>
                  <div
                    className="spec-value"
                    style={{ fontSize: '1.1rem', color: accent }}
                  >
                    {flavor.fn}
                  </div>
                </div>
              </div>
            </div>
          )}

          {pageProduct.preorder_only && (
            <div
              className="alert"
              style={{
                marginTop: '1rem',
                borderColor: 'var(--ultraviolet)',
                color: 'var(--ultraviolet)',
              }}
            >
              <strong style={{ letterSpacing: '0.15em' }}>
                PREORDER ·
              </strong>{' '}
              charged now, ships{' '}
              {pageProduct.preorder_deadline
                ? new Date(pageProduct.preorder_deadline).toLocaleDateString(
                    'en-US',
                    { month: 'long', day: 'numeric', year: 'numeric' }
                  )
                : 'when the batch is ready'}
              . email goes out the day before the truck moves.
            </div>
          )}

          {isKiwiKittyFamily && (
            <div className="form-group" style={{ marginTop: '2rem' }}>
              <label className="form-label">pack size</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                }}
              >
                {PACK_TILES.map((tile) => {
                  const tileProduct = packProductBySku.get(tile.sku);
                  const tilePriceCents = tileProduct?.price_cents ?? 0;
                  const isOn = packSize === tile.size;
                  return (
                    <button
                      key={tile.sku}
                      type="button"
                      onClick={() => setPackSize(tile.size)}
                      aria-pressed={isOn}
                      style={{
                        padding: '0.9rem 0.5rem',
                        background: isOn ? 'var(--midnight)' : 'transparent',
                        border: `1px solid ${isOn ? 'var(--lemon)' : 'rgba(244,240,232,0.2)'}`,
                        color: isOn ? 'var(--lemon)' : 'var(--bone)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontFamily: 'var(--mono)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                        {tile.size}×
                      </div>
                      <div style={{ fontSize: '0.65rem', marginTop: '0.2rem', opacity: 0.7 }}>
                        {tile.label}
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                        {tilePriceCents ? formatCentsToUSD(tilePriceCents) : '—'}
                      </div>
                      {tile.badge && (
                        <div
                          style={{
                            fontSize: '0.55rem',
                            marginTop: '0.25rem',
                            color: isOn ? 'var(--lemon)' : 'var(--lime)',
                            opacity: 0.85,
                          }}
                        >
                          {tile.badge}
                        </div>
                      )}
                    </button>
                  );
                })}

                <Link
                  href="/wholesale/apply"
                  style={{
                    padding: '0.9rem 0.5rem',
                    background: 'transparent',
                    border: '1px dashed rgba(244,240,232,0.35)',
                    color: 'var(--bone)',
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontFamily: 'var(--mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                    50+
                  </div>
                  <div style={{ fontSize: '0.65rem', marginTop: '0.2rem', opacity: 0.7 }}>
                    wholesale
                  </div>
                  <div style={{ fontSize: '0.6rem', marginTop: '0.3rem', opacity: 0.85 }}>
                    apply →
                  </div>
                </Link>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="form-label">quantity</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="decrease quantity"
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.9rem' }}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="form-input"
                style={{ width: 80, textAlign: 'center' }}
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="increase quantity"
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.9rem' }}
              >
                +
              </button>
              {linePriceCents > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--bone)',
                  }}
                >
                  line · {formatCentsToUSD(linePriceCents)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!checkoutProduct}
            aria-disabled={!checkoutProduct}
            className="btn btn-primary btn-full"
            style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}
          >
            {added
              ? '✓ added'
              : checkoutProduct?.preorder_only
              ? 'preorder now'
              : 'add to cart'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/cart')}
            className="btn btn-secondary btn-full"
          >
            view cart
          </button>

          <div
            style={{
              marginTop: '2rem',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--bone)',
            }}
          >
            <div>sku · {checkoutProduct?.sku ?? pageProduct.sku}</div>
            <div>in stock · {checkoutProduct?.in_stock ?? pageProduct.in_stock}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '3rem' }}>
        <p className="stat-label" style={{ marginBottom: '1.2rem' }}>
          // what it&apos;s actually like
        </p>
        <div className="timeline-grid">
          {TIMELINE.map((m, idx) => (
            <div className="timeline-card" key={m.index}>
              <div className="timeline-index">{m.index}</div>
              <div className="timeline-step">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <h3 className="timeline-title">{m.title}</h3>
              <p className="timeline-body">{m.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <p className="stat-label" style={{ marginBottom: '1.2rem' }}>
          // six things, doing real work
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {FUNCTIONALS.map((ing) => (
            <div
              key={ing.name}
              style={{
                padding: '1rem',
                border: '1px solid rgba(244,240,232,0.1)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--display)',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  textTransform: 'lowercase',
                  color: 'var(--lime)',
                }}
              >
                {ing.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--bone)',
                  marginTop: '0.4rem',
                }}
              >
                {ing.amount}
              </div>
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  marginTop: '0.5rem',
                  lineHeight: 1.6,
                }}
              >
                {ing.why}
              </p>
            </div>
          ))}
        </div>
        <p
          style={{
            marginTop: '1rem',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--bone)',
            opacity: 0.7,
          }}
        >
          // base: isomalt · xylitol · monk fruit extract · coconut oil ·
          kiwi powder · citric acid · edible mica luster dust ·
          ~35 cal · &lt;1g of sugar · ~9g net carbs · vegan
        </p>
      </div>
    </div>
  );
}
