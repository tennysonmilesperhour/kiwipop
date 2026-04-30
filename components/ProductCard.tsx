import Image from 'next/image';
import Link from 'next/link';
import { formatCentsToUSD } from '@/lib/format';
import { FLAVORS_BY_SKU } from '@/lib/flavors';

interface ProductCardProps {
  id: string;
  sku?: string | null;
  name: string;
  price: number;
  image?: string | null;
  preorderOnly?: boolean;
  preorderDeadline?: string | null;
}

export function ProductCard({
  id,
  sku,
  name,
  price,
  image,
  preorderOnly,
  preorderDeadline,
}: ProductCardProps) {
  const flavor = sku ? FLAVORS_BY_SKU[sku] : undefined;
  const accent = flavor?.color ?? 'var(--lime)';

  return (
    <Link
      href={`/products/${id}`}
      className="flavor-card"
      style={{ '--c': accent } as React.CSSProperties}
    >
      <div className="flavor-top">
        {flavor ? (
          <div className="flavor-num">
            // {flavor.feeling.replace('// ', '')}
          </div>
        ) : (
          <div className="flavor-num">// kiwi pop</div>
        )}
        <div className="flavor-name">
          {flavor ? (
            flavor.display.split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))
          ) : (
            name.toLowerCase()
          )}
        </div>
      </div>
      <div className="flavor-bottom">
        {flavor ? (
          <div className="flavor-fn">{flavor.fn}</div>
        ) : null}
        <div className="flavor-price">
          {formatCentsToUSD(price)} · shop ↗
        </div>
        {preorderDeadline && (
          <div
            className="flavor-fn"
            style={{ marginTop: '0.4rem', background: 'var(--ultraviolet)' }}
          >
            preorder · ships {new Date(preorderDeadline).toLocaleDateString()}
          </div>
        )}
      </div>
      {preorderOnly && <div className="preorder-badge">preorder</div>}
      {image ? (
        <Image
          src={image}
          alt=""
          width={400}
          height={400}
          aria-hidden="true"
          className="product-image"
          style={{
            position: 'absolute',
            inset: 0,
            objectFit: 'cover',
            opacity: 0.18,
            mixBlendMode: 'screen',
            zIndex: 1,
          }}
        />
      ) : null}
    </Link>
  );
}
