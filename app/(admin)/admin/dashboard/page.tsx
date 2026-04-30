'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { useOrders, useProducts } from '@/lib/hooks';
import { formatCentsToUSD } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: products, isLoading: productsLoading } = useProducts();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    if (orders && products) {
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_cents || 0), 0);
      const pendingOrders = orders.filter((order) => order.status === 'pending').length;

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        pendingOrders,
      });
    }
  }, [orders, products]);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="dashboard-grid">
        <div className="stat-card">
          <p className="stat-label">Total Revenue</p>
          <p className="stat-value">{formatCentsToUSD(stats.totalRevenue)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Orders</p>
          <p className="stat-value">{stats.totalOrders}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Products</p>
          <p className="stat-value">{stats.totalProducts}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending Orders</p>
          <p className="stat-value">{stats.pendingOrders}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="card-title">Recent Orders</h2>
          {ordersLoading ? (
            <p>Loading...</p>
          ) : orders && orders.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td className="text-sm">{order.id.slice(0, 8)}...</td>
                    <td>
                      <span className="px-2 py-1 text-xs font-bold rounded bg-light">
                        {order.status}
                      </span>
                    </td>
                    <td>{formatCentsToUSD(order.total_cents)}</td>
                    <td className="text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No orders yet</p>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Top Products</h2>
          {productsLoading ? (
            <p>Loading...</p>
          ) : products && products.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{formatCentsToUSD(product.price_cents)}</td>
                    <td>{product.in_stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No products yet</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
