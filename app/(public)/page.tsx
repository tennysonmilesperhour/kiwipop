'use client';

import { useProducts } from '@/lib/hooks';
import { ProductCard } from '@/components/ProductCard';

export default function Home() {
  const { data: products, isLoading, error } = useProducts();

  return (
    <div>
      <section className="hero-section">
        <h1 className="text-4xl font-bold mb-4">🍭 Kiwi Pop</h1>
        <p className="text-lg text-gray-600">
          Premium party lollipops for every occasion. Retail and wholesale available.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Shop Products</h2>

        {isLoading && <p>Loading products...</p>}
        {error && <p className="alert alert-error">Error loading products</p>}

        {products && products.length > 0 ? (
          <div className="products-grid">
            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price_cents}
                image={product.image_url}
                preorderOnly={product.preorder_only}
                preorderDeadline={product.preorder_deadline}
              />
            ))}
          </div>
        ) : (
          <p>No products available yet.</p>
        )}
      </section>
    </div>
  );
}
