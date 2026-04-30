'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { useProducts } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { formatCentsToUSD } from '@/lib/format';
import { useState } from 'react';

export default function ProductsPage() {
  const { data: products, isLoading, refetch } = useProducts();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price_cents: 0,
    in_stock: 0,
    image_url: '',
    preorder_only: false,
    preorder_deadline: '',
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('products').insert([formData]);

    if (!error) {
      setFormData({
        name: '',
        description: '',
        sku: '',
        price_cents: 0,
        in_stock: 0,
        image_url: '',
        preorder_only: false,
        preorder_deadline: '',
      });
      setShowForm(false);
      refetch();
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn btn-primary mb-6">
          + Add Product
        </button>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="card-title">Add New Product</h2>

          <form onSubmit={handleAddProduct}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_cents / 100}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_cents: Math.round(parseFloat(e.target.value) * 100),
                    })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock Count *</label>
                <input
                  type="number"
                  value={formData.in_stock}
                  onChange={(e) =>
                    setFormData({ ...formData, in_stock: parseInt(e.target.value, 10) })
                  }
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.preorder_only}
                  onChange={(e) =>
                    setFormData({ ...formData, preorder_only: e.target.checked })
                  }
                />
                <span>Preorder Only</span>
              </label>
            </div>

            {formData.preorder_only && (
              <div className="form-group">
                <label className="form-label">Preorder Deadline</label>
                <input
                  type="datetime-local"
                  value={formData.preorder_deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, preorder_deadline: e.target.value })
                  }
                  className="form-input"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                Add Product
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">All Products</h2>

        {isLoading ? (
          <p>Loading...</p>
        ) : products && products.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="font-medium">{product.name}</td>
                  <td className="text-sm">{product.sku}</td>
                  <td>{formatCentsToUSD(product.price_cents)}</td>
                  <td>{product.in_stock}</td>
                  <td className="text-sm">
                    {product.preorder_only ? 'Preorder' : 'Regular'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No products yet</p>
        )}
      </div>
    </AdminLayout>
  );
}
