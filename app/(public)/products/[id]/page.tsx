'use client';

import { useProduct } from '@/lib/hooks';
import { useCart } from '@/lib/store';
import { formatCentsToUSD } from '@/lib/stripe';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const { data: product, isLoading, error } = useProduct(params.id);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const handleAddToCart = () => {
    if (product) {
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
    }
  };

  if (isLoading) return <p>Loading product...</p>;
  if (error) return <p className="alert alert-error">Error loading product</p>;
  if (!product) return <p>Product not found</p>;

  return (
    <div className="product-detail">
      <div className="product-detail-grid">
        <div className="product-detail-image">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={400}
              height={400}
              className="w-full rounded-lg"
            />
          ) : (
            <div className="product-placeholder">No Image</div>
          )}
        </div>

        <div className="product-detail-info">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          <p className="text-3xl font-bold text-pink-600 mb-4">
            {formatCentsToUSD(product.price_cents)}
          </p>

          {product.preorder_only && (
            <div className="alert alert-info mb-4">
              <strong>Preorder Item</strong>
              {product.preorder_deadline && (
                <p>Available: {new Date(product.preorder_deadline).toLocaleDateString()}</p>
              )}
            </div>
          )}

          <p className="text-gray-600 mb-4">{product.description}</p>

          <div className="form-group">
            <label className="form-label">Quantity:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="form-input"
              style={{ width: '100px' }}
            />
          </div>

          <button
            onClick={handleAddToCart}
            className="btn btn-primary btn-full mb-4"
          >
            {added ? '✓ Added to Cart' : 'Add to Cart'}
          </button>

          <button
            onClick={() => router.push('/cart')}
            className="btn btn-secondary btn-full"
          >
            View Cart
          </button>

          <div className="card mt-6">
            <h3 className="card-title">Product Details</h3>
            <p><strong>SKU:</strong> {product.sku}</p>
            <p><strong>In Stock:</strong> {product.in_stock}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
