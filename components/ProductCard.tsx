import Image from 'next/image';
import Link from 'next/link';
import { formatCentsToUSD } from '@/lib/stripe';

interface ProductCardProps {
  id: string;
  name: string;
  price: number; // in cents
  image?: string;
  preorderOnly?: boolean;
  preorderDeadline?: string;
}

export function ProductCard({
  id,
  name,
  price,
  image,
  preorderOnly,
  preorderDeadline,
}: ProductCardProps) {
  return (
    <Link href={`/products/${id}`}>
      <div className="product-card">
        <div className="product-image-container">
          {image ? (
            <Image
              src={image}
              alt={name}
              width={300}
              height={300}
              className="product-image"
            />
          ) : (
            <div className="product-placeholder">No Image</div>
          )}
          {preorderOnly && (
            <div className="preorder-badge">
              Preorder
            </div>
          )}
        </div>
        <h3 className="product-name">{name}</h3>
        <p className="product-price">{formatCentsToUSD(price)}</p>
        {preorderDeadline && (
          <p className="preorder-deadline">
            Available: {new Date(preorderDeadline).toLocaleDateString()}
          </p>
        )}
      </div>
    </Link>
  );
}
