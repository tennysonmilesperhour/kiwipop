'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { formatCentsToUSD } from '@/lib/format';

interface ContactRecord {
  email: string;
  first_name: string | null;
  last_name: string | null;
  marketing_opt_in: boolean;
  source: string;
  opted_in_at: string | null;
  unsubscribed_at: string | null;
  signup_created_at: string | null;
  order_count: number;
  total_spent_cents: number;
  last_order_at: string | null;
  last_address: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  } | null;
}

interface ListResponse {
  contacts: ContactRecord[];
  totals: {
    total: number;
    opted_in: number;
    buyers: number;
    buyers_opted_in: number;
  };
  generated_at: string;
}

type FilterMode = 'all' | 'opted_in' | 'buyers' | 'never_bought';

export default function AdminListPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/admin/list', { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? 'failed to load list');
        }
        if (!cancelled) setData(json as ListResponse);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'failed to load list');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = (data?.contacts ?? []).filter((c) => {
    if (filter === 'opted_in' && !c.marketing_opt_in) return false;
    if (filter === 'buyers' && c.order_count === 0) return false;
    if (filter === 'never_bought' && c.order_count > 0) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = [
        c.email,
        c.first_name ?? '',
        c.last_name ?? '',
        c.last_address?.city ?? '',
        c.last_address?.state ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const handleExport = (optedInOnly: boolean) => {
    const url = optedInOnly
      ? '/api/admin/list/export?opted_in=1'
      : '/api/admin/list/export';
    window.location.href = url;
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Marketing list</h1>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {data && (
        <div className="dashboard-grid mb-6">
          <div className="stat-card">
            <p className="stat-label">total contacts</p>
            <p className="stat-value">{data.totals.total}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">opted in</p>
            <p className="stat-value">{data.totals.opted_in}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">buyers</p>
            <p className="stat-value">{data.totals.buyers}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">buyers opted-in</p>
            <p className="stat-value">{data.totals.buyers_opted_in}</p>
          </div>
        </div>
      )}

      <div className="card mb-4" style={{ padding: '1rem 1.25rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
          >
            {(
              [
                ['all', 'all'],
                ['opted_in', 'opted in'],
                ['buyers', 'buyers'],
                ['never_bought', 'never bought'],
              ] as Array<[FilterMode, string]>
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilter(mode)}
                className={
                  filter === mode ? 'btn btn-primary' : 'btn btn-secondary'
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleExport(true)}
              className="btn btn-primary"
              disabled={!data}
              title="Download a CSV of only the contacts who explicitly opted in to marketing — Mailchimp/Klaviyo-ready."
            >
              ⬇ csv · opted-in
            </button>
            <button
              type="button"
              onClick={() => handleExport(false)}
              className="btn btn-secondary"
              disabled={!data}
              title="Download every contact we have on file, including non-opted-in buyers."
            >
              ⬇ csv · all
            </button>
          </div>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search by email, name, or city…"
          className="form-input"
          style={{ marginTop: '0.75rem' }}
        />
      </div>

      <div className="card">
        {loading ? (
          <p>loading…</p>
        ) : filtered.length === 0 ? (
          <p>no contacts match this filter.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>email</th>
                <th>name</th>
                <th>opt-in</th>
                <th>source</th>
                <th>orders</th>
                <th>spent</th>
                <th>last order</th>
                <th>location</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.email}>
                  <td className="text-sm">{c.email}</td>
                  <td className="text-sm">
                    {[c.first_name, c.last_name].filter(Boolean).join(' ') ||
                      '—'}
                  </td>
                  <td>
                    {c.marketing_opt_in ? (
                      <span
                        className="px-2 py-1 text-xs font-bold rounded"
                        style={{ background: 'rgba(168,255,60,0.15)' }}
                      >
                        yes
                      </span>
                    ) : (
                      <span
                        className="px-2 py-1 text-xs rounded"
                        style={{ background: 'rgba(200,200,200,0.15)' }}
                      >
                        no
                      </span>
                    )}
                  </td>
                  <td className="text-sm">{c.source}</td>
                  <td>{c.order_count}</td>
                  <td>{formatCentsToUSD(c.total_spent_cents)}</td>
                  <td className="text-sm">
                    {c.last_order_at
                      ? new Date(c.last_order_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="text-sm">
                    {c.last_address?.city
                      ? `${c.last_address.city}, ${c.last_address.state ?? ''}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
