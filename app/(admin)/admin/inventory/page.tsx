'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { useProducts } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function InventoryPage() {
  const { data: products, isLoading, refetch } = useProducts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: number }>({});

  const handleUpdateStock = async (productId: string, newStock: number) => {
    const { error } = await supabase
      .from('products')
      .update({ in_stock: newStock })
      .eq('id', productId);

    if (!error) {
      setEditingId(null);
      refetch();
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Inventory</h1>

      <div className="card">
        <h2 className="card-title">Product Stock Levels</h2>

        {isLoading ? (
          <p>Loading...</p>
        ) : products && products.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Price</th>
                <th>In Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="font-medium">{product.name}</td>
                  <td className="text-sm text-gray-600">{product.sku}</td>
                  <td className="text-sm">${(product.price_cents / 100).toFixed(2)}</td>
                  <td>
                    {editingId === product.id ? (
                      <input
                        type="number"
                        value={editValues[product.id] ?? product.in_stock}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            [product.id]: parseInt(e.target.value, 10),
                          })
                        }
                        className="form-input w-20"
                      />
                    ) : (
                      <span
                        className={`px-3 py-1 rounded text-sm font-bold ${
                          product.in_stock > 10
                            ? 'bg-green-100 text-green-800'
                            : product.in_stock > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.in_stock}
                      </span>
                    )}
                  </td>
                  <td className="text-sm">
                    {editingId === product.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleUpdateStock(
                              product.id,
                              editValues[product.id] ?? product.in_stock
                            )
                          }
                          className="text-green-600 font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(product.id);
                          setEditValues({ [product.id]: product.in_stock });
                        }}
                        className="text-primary font-bold"
                      >
                        Edit
                      </button>
                    )}
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
