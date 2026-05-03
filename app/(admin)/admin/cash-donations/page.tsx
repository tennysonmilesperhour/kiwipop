'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { formatCentsToUSD } from '@/lib/format';

interface CashDonationRow {
  id: string;
  amount_cents: number;
  donor_name: string | null;
  note: string | null;
  received_at: string;
  created_at: string;
}

interface ListResponse {
  donations: CashDonationRow[];
  totalCents: number;
}

interface ApiErrorResponse {
  error: string;
  details?: string;
  migration_pending?: boolean;
  migration?: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AdminCashDonationsPage() {
  const [rows, setRows] = useState<CashDonationRow[]>([]);
  const [totalCents, setTotalCents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [migrationPending, setMigrationPending] = useState<string | null>(null);

  const [amountUsd, setAmountUsd] = useState('');
  const [donorName, setDonorName] = useState('');
  const [note, setNote] = useState('');
  const [receivedAt, setReceivedAt] = useState(todayIso());
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/cash-donations', {
        cache: 'no-store',
      });
      const json = (await response.json()) as ListResponse | ApiErrorResponse;
      if (!response.ok || !('donations' in json)) {
        const errMsg = 'error' in json ? json.error : "couldn't load donations";
        if ('migration_pending' in json && json.migration_pending) {
          setMigrationPending(json.migration ?? '012_cash_donations.sql');
          setRows([]);
          setTotalCents(0);
          return;
        }
        throw new Error(errMsg);
      }
      setMigrationPending(null);
      setRows(json.donations);
      setTotalCents(json.totalCents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDonations();
  }, [fetchDonations]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const dollars = Number.parseFloat(amountUsd);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setFormMessage('enter a positive dollar amount.');
      return;
    }
    const amountCents = Math.round(dollars * 100);

    setSubmitting(true);
    setFormMessage(null);
    try {
      const response = await fetch('/api/admin/cash-donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: amountCents,
          donor_name: donorName.trim() || undefined,
          note: note.trim() || undefined,
          received_at: receivedAt,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "couldn't save donation");
      }
      setFormMessage(`✓ logged ${formatCentsToUSD(amountCents)}.`);
      setAmountUsd('');
      setDonorName('');
      setNote('');
      setReceivedAt(todayIso());
      await fetchDonations();
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('remove this donation? the progress bar will recalculate.')) return;
    try {
      const response = await fetch(`/api/admin/cash-donations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error ?? "couldn't delete donation");
      }
      await fetchDonations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
    }
  };

  const formDisabled = submitting || migrationPending !== null;

  return (
    <AdminLayout>
      <div className="admin-home">
        <header className="admin-home-header">
          <p className="stat-label">// admin · cash donations</p>
          <h1>cash donations.</h1>
          <p className="admin-home-meta">
            log money received in person (cash, check, venmo manually
            confirmed). every entry adds to the launch fundraiser progress
            bar on the homepage. paid stripe orders + the founder baseline
            still count automatically — these are the off-rail dollars.
          </p>
        </header>

        {migrationPending && (
          <div
            className="alert"
            style={{
              marginTop: '1rem',
              borderColor: 'var(--lemon, #f5ff3d)',
              color: 'var(--lemon, #f5ff3d)',
              background: 'rgba(245, 255, 61, 0.07)',
            }}
          >
            <strong>database migration pending.</strong> the{' '}
            <code>cash_donations</code> table doesn&apos;t exist yet. run{' '}
            <code>supabase db push</code> (or paste{' '}
            <code>supabase/migrations/{migrationPending}</code> into the
            Supabase SQL editor) to enable this page. the form is disabled
            until the table is there.
          </div>
        )}

        <div className="dashboard-grid">
          <div className="stat-card">
            <p className="stat-label">cash logged</p>
            <p className="stat-value">{formatCentsToUSD(totalCents)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">entries</p>
            <p className="stat-value">{rows.length}</p>
          </div>
        </div>

        <section className="card" style={{ marginTop: '2rem', padding: '2rem' }}>
          <h2 className="card-title">log a donation</h2>
          <form onSubmit={onSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="cd-amount">
                  amount (USD)
                </label>
                <input
                  id="cd-amount"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  className="form-input"
                  placeholder="50.00"
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(e.target.value)}
                  required
                  disabled={formDisabled}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cd-date">
                  date received
                </label>
                <input
                  id="cd-date"
                  type="date"
                  className="form-input"
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                  required
                  disabled={formDisabled}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cd-donor">
                  donor (optional)
                </label>
                <input
                  id="cd-donor"
                  type="text"
                  className="form-input"
                  placeholder="anonymous / first name / handle"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  maxLength={120}
                  disabled={formDisabled}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label" htmlFor="cd-note">
                note (optional)
              </label>
              <input
                id="cd-note"
                type="text"
                className="form-input"
                placeholder="show at the underground · check #418 · etc"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                disabled={formDisabled}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={formDisabled}
              title={
                migrationPending
                  ? 'apply the cash_donations migration to enable'
                  : undefined
              }
              style={{ marginTop: '1rem' }}
            >
              {migrationPending
                ? 'migration required'
                : submitting
                  ? 'saving…'
                  : 'add to progress bar →'}
            </button>

            {formMessage ? (
              <p
                className={`alert ${formMessage.startsWith('✓') ? 'alert-success' : 'alert-error'}`}
                style={{ marginTop: '1rem' }}
              >
                {formMessage}
              </p>
            ) : null}
          </form>
        </section>

        <section className="card" style={{ marginTop: '1.5rem' }}>
          <h2 className="card-title">log</h2>
          {error ? <p className="alert alert-error">{error}</p> : null}
          {loading ? (
            <p>loading…</p>
          ) : rows.length === 0 ? (
            <p style={{ opacity: 0.6 }}>
              no cash donations logged yet. the first one shows up on the
              homepage progress bar within a refresh.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>received</th>
                    <th>amount</th>
                    <th>donor</th>
                    <th>note</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.received_at}</td>
                      <td>{formatCentsToUSD(row.amount_cents)}</td>
                      <td>{row.donor_name ?? '—'}</td>
                      <td>{row.note ?? ''}</td>
                      <td>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => onDelete(row.id)}
                          style={{ color: 'var(--magenta)' }}
                        >
                          remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
