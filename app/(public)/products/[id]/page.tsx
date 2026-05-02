'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProduct } from '@/lib/hooks';
import { useCart } from '@/lib/store';
import { formatCentsToUSD } from '@/lib/format';
import { FLAVORS_BY_SKU, FUNCTIONALS, TIMELINE } from '@/lib/flavors';

interface ProductPageProps {
  params: { id: string };
}

export default function ProductPage({ params }: ProductPageProps) {
  const { data: product, isLoading, error } = useProduct(params.id);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="page-container loading-page">
        <p style={{ color: 'var(--bone)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          loading…
        </p>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="page-container">
        <p className="alert alert-error">product not found.</p>
        <Link href="/" className="btn btn-primary">
          back to the drop
        </Link>
      </div>
    );
  }

  const flavor = product.sku ? FLAVORS_BY_SKU[product.sku] : undefined;
  const accent = flavor?.color ?? 'var(--lime)';
  const description = product.description || flavor?.description || '';

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price_cents,
      quantity,
      image: product.image_url,
      isPreorder: product.preorder_only,
      preorderDeadline: product.preorder_deadline,
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
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={600}
              height={600}
            />
          ) : (
            <div className="product-placeholder">{product.name.toLowerCase()}</div>
          )}
          {product.preorder_only && (
            <div className="preorder-badge">preorder</div>
          )}
        </div>

        <div>
          <p className="product-eyebrow">
            {flavor ? flavor.feeling : '// kiwi pop'}
          </p>
          <h1>{product.name.toLowerCase()}</h1>
          <p className="product-price">{formatCentsToUSD(product.price_cents)}</p>

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

          {product.preorder_only && (
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
              {product.preorder_deadline
                ? new Date(product.preorder_deadline).toLocaleDateString(
                    'en-US',
                    { month: 'long', day: 'numeric', year: 'numeric' }
                  )
                : 'when the batch is ready'}
              . email goes out the day before the truck moves.
            </div>
          )}

          <div className="form-group" style={{ marginTop: '2rem' }}>
            <label className="form-label">quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(parseInt(e.target.value, 10) || 1)
              }
              className="form-input"
              style={{ width: 100 }}
            />
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="btn btn-primary btn-full"
            style={{ marginBottom: '0.5rem' }}
          >
            {added
              ? '✓ added'
              : product.preorder_only
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
            <div>sku · {product.sku}</div>
            <div>in stock · {product.in_stock}</div>
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
          kiwi powder · citric acid · pop rocks · edible mica luster dust ·
          ~35 cal · &lt;1g of sugar · ~9g net carbs · vegan
        </p>
      </div>
    </div>
  );
}
