'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';

interface RaffleEntry {
  id: string;
  raffle_slug: string;
  name: string;
  email: string;
  phone: string | null;
  social_handle: string | null;
  source: string;
  is_winner: boolean;
  won_at: string | null;
  created_at: string;
  storage?: 'raffle_entries' | 'email_signups_fallback';
}

interface EntriesResponse {
  slug: string;
  count: number;
  winners: RaffleEntry[];
  entries: RaffleEntry[];
  storage?: {
    primary_available: boolean;
    fallback_used: boolean;
    migration_pending: boolean;
  };
}

const SLUG = 'artwork-001';

export default function AdminRafflePage() {
  const [data, setData] = useState<EntriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState('');
  const [justDrawn, setJustDrawn] = useState<RaffleEntry | null>(null);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`/api/admin/raffle/entries?slug=${SLUG}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'failed to load');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const drawWinner = async () => {
    if (!confirm('Draw a random winner? This is irreversible.')) return;
    setDrawing(true);
    setDrawError('');
    setJustDrawn(null);
    try {
      const res = await fetch('/api/admin/raffle/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: SLUG }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'draw failed');
      setJustDrawn(json.winner as RaffleEntry);
      await refresh();
    } catch (err) {
      setDrawError(err instanceof Error ? err.message : 'draw failed');
    } finally {
      setDrawing(false);
    }
  };

  const exportCsv = () => {
    if (!data || data.entries.length === 0) return;
    const header = [
      'name',
      'email',
      'phone',
      'social_handle',
      'source',
      'is_winner',
      'won_at',
      'created_at',
    ];
    const escape = (v: string | null) =>
      v == null ? '' : `"${String(v).replace(/"/g, '""')}"`;
    const rows = data.entries.map((e) =>
      [
        e.name,
        e.email,
        e.phone,
        e.social_handle,
        e.source,
        e.is_winner ? 'yes' : 'no',
        e.won_at,
        e.created_at,
      ]
        .map(escape)
        .join(','),
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raffle-${SLUG}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalEntries = data?.count ?? 0;
  const winners = data?.winners ?? [];
  const eligible = totalEntries - winners.length;

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Artwork Raffle</h1>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {data?.storage?.migration_pending && (
        <div
          className="alert"
          style={{
            marginBottom: 16,
            borderColor: 'var(--lemon, #f5ff3d)',
            color: 'var(--lemon, #f5ff3d)',
            background: 'rgba(245, 255, 61, 0.07)',
          }}
        >
          <strong>migration 010 not applied yet.</strong> entries are being
          captured into <code>email_signups</code> with the payload encoded
          into <code>source</code>; they show up in this list. apply{' '}
          <code>supabase/migrations/010_raffle_entries.sql</code> when you&apos;re
          ready, then click &ldquo;draw a winner.&rdquo; the draw RPC needs
          the real table.
        </div>
      )}

      <div className="card mb-6">
        <h2 className="card-title">Status</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <Stat label="Total entries" value={totalEntries} />
          <Stat label="Eligible" value={eligible} />
          <Stat label="Winners" value={winners.length} />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={drawWinner}
            disabled={drawing || eligible === 0 || data?.storage?.migration_pending}
            title={
              data?.storage?.migration_pending
                ? 'apply migration 010 to enable the draw RPC'
                : undefined
            }
          >
            {drawing ? 'drawing…' : 'draw a winner'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={refresh}
            disabled={loading}
          >
            refresh
          </button>
          <button
            type="button"
            className="btn"
            onClick={exportCsv}
            disabled={!data || totalEntries === 0}
          >
            export csv
          </button>
        </div>

        {drawError && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>
            {drawError}
          </div>
        )}

        {justDrawn && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              border: '1px solid var(--lime)',
              background: 'rgba(168, 255, 60, 0.06)',
            }}
          >
            <strong style={{ color: 'var(--lime)' }}>NEW WINNER →</strong>{' '}
            {justDrawn.name} · {justDrawn.email}
            {justDrawn.social_handle ? ` · ${justDrawn.social_handle}` : ''}
            {justDrawn.phone ? ` · ${justDrawn.phone}` : ''}
          </div>
        )}
      </div>

      {winners.length > 0 && (
        <div className="card mb-6">
          <h2 className="card-title">Winners</h2>
          <table className="table">
            <thead>
              <tr>
                <th>name</th>
                <th>email</th>
                <th>social</th>
                <th>phone</th>
                <th>drawn</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((w) => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>{w.email}</td>
                  <td>{w.social_handle ?? '—'}</td>
                  <td>{w.phone ?? '—'}</td>
                  <td>{w.won_at ? new Date(w.won_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">All Entries ({totalEntries})</h2>
        {loading ? (
          <p>Loading…</p>
        ) : totalEntries === 0 ? (
          <p style={{ opacity: 0.6 }}>No entries yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>name</th>
                <th>email</th>
                <th>social</th>
                <th>phone</th>
                <th>source</th>
                <th>entered</th>
                <th>winner?</th>
              </tr>
            </thead>
            <tbody>
              {data!.entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.email}</td>
                  <td>{e.social_handle ?? '—'}</td>
                  <td>{e.phone ?? '—'}</td>
                  <td>{e.source}</td>
                  <td>{new Date(e.created_at).toLocaleString()}</td>
                  <td>
                    {e.is_winner ? (
                      <span style={{ color: 'var(--lime)' }}>★ WON</span>
                    ) : (
                      '—'
                    )}
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: 16,
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        background: 'rgba(0, 0, 0, 0.25)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          opacity: 0.6,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
