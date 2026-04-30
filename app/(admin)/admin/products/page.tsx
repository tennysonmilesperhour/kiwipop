'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { useProducts } from '@/lib/hooks';
import { formatCentsToUSD } from '@/lib/format';
import { useState } from 'react';

interface ProductFormState {
  name: string;
  description: string;
  sku: string;
  priceUsd: string;
  in_stock: number;
  image_url: string;
  preorder_only: boolean;
  preorder_deadline: string;
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  description: '',
  sku: '',
  priceUsd: '',
  in_stock: 0,
  image_url: '',
  preorder_only: false,
  preorder_deadline: '',
};

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price_cents: number;
  in_stock: number;
  image_url: string | null;
  preorder_only: boolean;
  preorder_deadline: string | null;
}

export default function ProductsPage() {
  const { data: products, isLoading, refetch } = useProducts();
  const [mode, setMode] = useState<'idle' | 'create' | 'edit'>('idle');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormState>(EMPTY_FORM);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setMode('idle');
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError('');
  };

  const beginEdit = (product: ProductRow) => {
    setMode('edit');
    setEditingId(product.id);
    setError('');
    setFormData({
      name: product.name ?? '',
      description: product.description ?? '',
      sku: product.sku ?? '',
      priceUsd: (product.price_cents / 100).toFixed(2),
      in_stock: product.in_stock ?? 0,
      image_url: product.image_url ?? '',
      preorder_only: product.preorder_only ?? false,
      preorder_deadline: product.preorder_deadline
        ? product.preorder_deadline.slice(0, 16)
        : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cents = Math.round(parseFloat(formData.priceUsd) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setError('Price must be a positive number');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      sku: formData.sku.trim(),
      price_cents: cents,
      in_stock: formData.in_stock,
      image_url: formData.image_url.trim() || undefined,
      preorder_only: formData.preorder_only,
      preorder_deadline:
        formData.preorder_only && formData.preorder_deadline
          ? new Date(formData.preorder_deadline).toISOString()
          : null,
    };

    setSubmitting(true);
    try {
      const url =
        mode === 'edit' && editingId
          ? `/api/admin/products/${editingId}`
          : '/api/admin/products';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'Save failed');
      }
      await refetch();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setError('');
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'Delete failed');
      }
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      const response = await fetch('/api/admin/products/upload-image', {
        method: 'POST',
        body: data,
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'Upload failed');
      }
      setFormData((prev) => ({ ...prev, image_url: json.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {mode === 'idle' && (
        <button
          onClick={() => {
            setMode('create');
            setFormData(EMPTY_FORM);
          }}
          className="btn btn-primary mb-6"
        >
          + Add Product
        </button>
      )}

      {mode !== 'idle' && (
        <div className="card mb-6">
          <h2 className="card-title">
            {mode === 'edit' ? 'Edit Product' : 'Add New Product'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.priceUsd}
                  onChange={(e) =>
                    setFormData({ ...formData, priceUsd: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock Count *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.in_stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      in_stock: parseInt(e.target.value, 10) || 0,
                    })
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
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Image</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://… or upload below"
                className="form-input"
              />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={handleUpload}
                disabled={uploading}
                className="mt-2"
              />
              {uploading && (
                <p className="text-sm text-gray-600 mt-1">Uploading…</p>
              )}
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Product preview"
                  className="mt-2 max-h-32 rounded"
                />
              )}
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.preorder_only}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preorder_only: e.target.checked,
                    })
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
                    setFormData({
                      ...formData,
                      preorder_deadline: e.target.value,
                    })
                  }
                  className="form-input"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting
                  ? 'Saving…'
                  : mode === 'edit'
                  ? 'Save Changes'
                  : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={resetForm}
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(products as ProductRow[]).map((product) => (
                <tr key={product.id}>
                  <td className="font-medium">{product.name}</td>
                  <td className="text-sm">{product.sku}</td>
                  <td>{formatCentsToUSD(product.price_cents)}</td>
                  <td>{product.in_stock}</td>
                  <td className="text-sm">
                    {product.preorder_only ? 'Preorder' : 'Regular'}
                  </td>
                  <td className="text-sm flex gap-2">
                    <button
                      onClick={() => beginEdit(product)}
                      className="text-primary font-bold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 font-bold"
                    >
                      Delete
                    </button>
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
