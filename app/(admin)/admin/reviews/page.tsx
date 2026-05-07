'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

interface ReviewRow {
  id: string;
  display_name: string;
  email: string | null;
  rating: number;
  body: string;
  status: ReviewStatus;
  source: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'pending', label: 'pending' },
  { value: 'approved', label: 'approved' },
  { value: 'rejected', label: 'rejected' },
  { value: 'all', label: 'all' },
];

function stars(n: number): string {
  return '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(5 - Math.max(0, Math.min(5, n)));
}

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [filter, setFilter] = useState<Filter>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (next: Filter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews?status=${next}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "couldn't load reviews");
      setRows(json.reviews ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  const decide = async (id: string, status: ReviewStatus) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "couldn't update review");
      await load(filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('delete this review permanently?')) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "couldn't delete review");
      await load(filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    const acc = { pending: 0, approved: 0, rejected: 0 };
    for (const r of rows) acc[r.status] += 1;
    return acc;
  }, [rows]);

  return (
    <AdminLayout>
      <div className="admin-home">
        <header className="admin-home-header">
          <p className="stat-label">// admin · reviews</p>
          <h1>reviews.</h1>
          <p className="admin-home-meta">
            user-submitted reviews from the landing page. nothing shows on
            the public site until you approve it. emails are captured
            silently for follow-up only.
          </p>
        </header>

        <div className="dashboard-grid">
          <div className="stat-card">
            <p className="stat-label">on screen</p>
            <p className="stat-value">{rows.length}</p>
          </div>
          {filter === 'all' ? (
            <>
              <div className="stat-card">
                <p className="stat-label">pending</p>
                <p className="stat-value">{counts.pending}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">approved</p>
                <p className="stat-value">{counts.approved}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">rejected</p>
                <p className="stat-value">{counts.rejected}</p>
              </div>
            </>
          ) : null}
        </div>

        <section className="card" style={{ marginTop: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '1rem',
            }}
          >
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className="btn"
                onClick={() => setFilter(f.value)}
                style={{
                  borderColor:
                    filter === f.value ? 'var(--c-lime)' : undefined,
                  color: filter === f.value ? 'var(--c-lime)' : undefined,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {error ? <p className="alert alert-error">{error}</p> : null}

          {loading ? (
            <p>loading…</p>
          ) : rows.length === 0 ? (
            <p style={{ opacity: 0.6 }}>no reviews in this bucket yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {rows.map((r) => (
                <article
                  key={r.id}
                  style={{
                    border: '1px solid rgba(244, 240, 232, 0.1)',
                    borderRadius: 8,
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div>
                      <strong>{r.display_name}</strong>{' '}
                      <span style={{ color: 'var(--c-lime)' }}>
                        {stars(r.rating)}
                      </span>
                      {r.email ? (
                        <span style={{ opacity: 0.6, marginLeft: 8 }}>
                          · {r.email}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ opacity: 0.6, fontSize: 13 }}>
                      {new Date(r.created_at).toLocaleString()} ·{' '}
                      <span
                        style={{
                          color:
                            r.status === 'approved'
                              ? 'var(--c-lime)'
                              : r.status === 'rejected'
                                ? 'var(--c-magenta)'
                                : 'var(--c-cyan)',
                        }}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap', margin: '0.5rem 0' }}>
                    {r.body}
                  </p>
                  <div
                    style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
                  >
                    {r.status !== 'approved' ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => decide(r.id, 'approved')}
                        disabled={busyId === r.id}
                      >
                        approve →
                      </button>
                    ) : null}
                    {r.status !== 'rejected' ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => decide(r.id, 'rejected')}
                        disabled={busyId === r.id}
                        style={{ color: 'var(--c-magenta-text)' }}
                      >
                        reject
                      </button>
                    ) : null}
                    {r.status !== 'pending' ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => decide(r.id, 'pending')}
                        disabled={busyId === r.id}
                      >
                        unset
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn"
                      onClick={() => remove(r.id)}
                      disabled={busyId === r.id}
                      style={{
                        marginLeft: 'auto',
                        color: 'var(--c-magenta-text)',
                      }}
                    >
                      delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
