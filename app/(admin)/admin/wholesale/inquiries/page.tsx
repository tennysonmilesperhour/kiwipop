'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';

interface InquiryRow {
  id: string;
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  location: string;
  business_type: string | null;
  looking_to_order: string;
  about_business: string | null;
  timeline: string | null;
  source: string;
  status: 'new' | 'contacted' | 'catalog_sent' | 'active' | 'declined';
  notify_status: 'pending' | 'sent' | 'failed' | 'skipped';
  notify_error: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const STATUS_OPTIONS: Array<{
  value: InquiryRow['status'];
  label: string;
  accent: string;
}> = [
  { value: 'new', label: 'new', accent: 'var(--lime)' },
  { value: 'contacted', label: 'contacted', accent: 'var(--cyan)' },
  { value: 'catalog_sent', label: 'catalog sent', accent: 'var(--sodium)' },
  { value: 'active', label: 'active', accent: 'var(--lime)' },
  { value: 'declined', label: 'declined', accent: 'var(--magenta)' },
];

const NOTIFY_LABEL: Record<InquiryRow['notify_status'], string> = {
  pending: 'pending',
  sent: 'sent',
  failed: 'failed',
  skipped: 'skipped (no api key)',
};

const NOTIFY_ACCENT: Record<InquiryRow['notify_status'], string> = {
  pending: 'var(--bone)',
  sent: 'var(--lime)',
  failed: 'var(--cherry)',
  skipped: 'var(--sodium)',
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  'retail-shop': 'retail shop',
  'cafe-bar': 'cafe / bar',
  'event-vendor': 'event vendor',
  distributor: 'distributor',
  'gym-studio': 'gym / studio',
  'online-store': 'online store',
  other: 'other',
};

const STATUS_FILTER: Array<{ value: 'all' | InquiryRow['status']; label: string }> = [
  { value: 'all', label: 'all' },
  ...STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WholesaleInquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryRow['status']>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('wholesale_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setInquiries([]);
    } else {
      setInquiries((data ?? []) as InquiryRow[]);
    }
    setLoading(false);
  };

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? inquiries
        : inquiries.filter((i) => i.status === statusFilter),
    [inquiries, statusFilter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: inquiries.length };
    for (const s of STATUS_OPTIONS) c[s.value] = 0;
    for (const i of inquiries) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [inquiries]);

  const updateStatus = async (id: string, status: InquiryRow['status']) => {
    setSubmitting(id);
    setError('');
    try {
      const response = await fetch(`/api/admin/wholesale-inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'update failed');
      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'update failed');
    } finally {
      setSubmitting(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('delete this inquiry permanently?')) return;
    setSubmitting(id);
    setError('');
    try {
      const response = await fetch(`/api/admin/wholesale-inquiries/${id}`, {
        method: 'DELETE',
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error ?? 'delete failed');
      setInquiries((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'delete failed');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-content">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              className="hero-tagline"
              style={{ color: 'var(--bone)', marginBottom: '0.25rem' }}
            >
              // wholesale · inquiries
            </p>
            <h1
              style={{
                fontFamily: 'var(--display)',
                fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                textTransform: 'lowercase',
                color: 'var(--paper)',
                margin: 0,
              }}
            >
              public contact-form intake.
            </h1>
            <p
              style={{
                marginTop: '0.5rem',
                color: 'var(--bone)',
                fontSize: 13,
                maxWidth: 720,
              }}
            >
              every submission to <code>/wholesale/contact</code> lands here
              with a copy of the email forwarded to{' '}
              <strong>tennysontaggart@gmail.com</strong>. the table is the
              durable backup of record — even when the email forward fails,
              the inquiry is here.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/admin/wholesale" className="btn">
              ← accounts &amp; pricing
            </Link>
            <button type="button" className="btn" onClick={() => void refresh()}>
              refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: '1.25rem',
          }}
        >
          {STATUS_FILTER.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className="btn"
                style={{
                  background: isActive ? 'var(--lime)' : undefined,
                  color: isActive ? 'var(--midnight)' : undefined,
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {opt.label} · {counts[opt.value] ?? 0}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p style={{ color: 'var(--bone)', letterSpacing: '0.18em' }}>loading…</p>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}>
              no inquiries{statusFilter === 'all' ? ' yet' : ' in this status'}.
            </p>
            <p style={{ color: 'var(--bone)', fontSize: 12, opacity: 0.7 }}>
              {statusFilter === 'all'
                ? 'submissions to /wholesale/contact will appear here in real time.'
                : 'try a different filter.'}
            </p>
          </div>
        ) : (
          <div
            className="card"
            style={{ padding: 0, overflow: 'hidden' }}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>received</th>
                  <th>business</th>
                  <th>location</th>
                  <th>type</th>
                  <th>email forward</th>
                  <th>status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((inquiry) => {
                  const isOpen = expanded === inquiry.id;
                  const isSubmitting = submitting === inquiry.id;
                  return (
                    <>
                      <tr
                        key={inquiry.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpanded(isOpen ? null : inquiry.id)}
                      >
                        <td className="font-mono" style={{ whiteSpace: 'nowrap' }}>
                          {formatDate(inquiry.created_at)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{inquiry.business_name}</div>
                          <div
                            style={{
                              fontSize: 11,
                              opacity: 0.75,
                              marginTop: 2,
                            }}
                          >
                            {inquiry.contact_name} ·{' '}
                            <a
                              href={`mailto:${inquiry.contact_email}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: 'var(--lime)' }}
                            >
                              {inquiry.contact_email}
                            </a>
                          </div>
                        </td>
                        <td>{inquiry.location}</td>
                        <td>
                          {inquiry.business_type
                            ? BUSINESS_TYPE_LABELS[inquiry.business_type] ?? inquiry.business_type
                            : '—'}
                        </td>
                        <td
                          style={{
                            color: NOTIFY_ACCENT[inquiry.notify_status],
                            fontFamily: 'var(--mono)',
                            fontSize: 11,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                          }}
                          title={inquiry.notify_error ?? undefined}
                        >
                          {NOTIFY_LABEL[inquiry.notify_status]}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            value={inquiry.status}
                            onChange={(e) =>
                              void updateStatus(
                                inquiry.id,
                                e.target.value as InquiryRow['status'],
                              )
                            }
                            disabled={isSubmitting}
                            style={{
                              background: 'var(--midnight)',
                              color:
                                STATUS_OPTIONS.find((s) => s.value === inquiry.status)?.accent ??
                                'var(--bone)',
                              border: '1px solid rgba(244,240,232,0.2)',
                              padding: '4px 8px',
                              fontFamily: 'var(--mono)',
                              fontSize: 11,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                            }}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>{isOpen ? '▾' : '▸'}</td>
                      </tr>
                      {isOpen ? (
                        <tr key={`${inquiry.id}-detail`}>
                          <td colSpan={7} style={{ background: 'var(--midnight)' }}>
                            <div
                              style={{
                                padding: '1.25rem 1.5rem',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '1.25rem',
                              }}
                            >
                              <div>
                                <p
                                  style={{
                                    fontFamily: 'var(--mono)',
                                    fontSize: 10,
                                    letterSpacing: '0.18em',
                                    textTransform: 'uppercase',
                                    color: 'var(--lime)',
                                    marginBottom: 8,
                                  }}
                                >
                                  // looking to order
                                </p>
                                <p
                                  style={{
                                    color: 'var(--paper)',
                                    fontSize: 14,
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {inquiry.looking_to_order}
                                </p>
                                {inquiry.timeline ? (
                                  <p
                                    style={{
                                      marginTop: 12,
                                      fontFamily: 'var(--mono)',
                                      fontSize: 11,
                                      color: 'var(--bone)',
                                    }}
                                  >
                                    timeline · <span style={{ color: 'var(--paper)' }}>{inquiry.timeline}</span>
                                  </p>
                                ) : null}
                              </div>

                              <div>
                                <p
                                  style={{
                                    fontFamily: 'var(--mono)',
                                    fontSize: 10,
                                    letterSpacing: '0.18em',
                                    textTransform: 'uppercase',
                                    color: 'var(--cyan)',
                                    marginBottom: 8,
                                  }}
                                >
                                  // about the business
                                </p>
                                <p
                                  style={{
                                    color: 'var(--paper)',
                                    fontSize: 14,
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {inquiry.about_business || <em style={{ opacity: 0.6 }}>not provided</em>}
                                </p>
                                {inquiry.contact_phone ? (
                                  <p
                                    style={{
                                      marginTop: 12,
                                      fontFamily: 'var(--mono)',
                                      fontSize: 11,
                                      color: 'var(--bone)',
                                    }}
                                  >
                                    phone · <span style={{ color: 'var(--paper)' }}>{inquiry.contact_phone}</span>
                                  </p>
                                ) : null}
                              </div>

                              <div>
                                <p
                                  style={{
                                    fontFamily: 'var(--mono)',
                                    fontSize: 10,
                                    letterSpacing: '0.18em',
                                    textTransform: 'uppercase',
                                    color: 'var(--magenta)',
                                    marginBottom: 8,
                                  }}
                                >
                                  // meta
                                </p>
                                <p
                                  style={{
                                    fontFamily: 'var(--mono)',
                                    fontSize: 11,
                                    color: 'var(--bone)',
                                    lineHeight: 1.7,
                                  }}
                                >
                                  source · {inquiry.source}
                                  <br />
                                  ip · {inquiry.ip_address ?? '—'}
                                  <br />
                                  notify · {NOTIFY_LABEL[inquiry.notify_status]}
                                  {inquiry.notify_error ? (
                                    <>
                                      <br />
                                      err · <span style={{ color: 'var(--cherry)' }}>{inquiry.notify_error}</span>
                                    </>
                                  ) : null}
                                </p>
                                <div
                                  style={{
                                    marginTop: 14,
                                    display: 'flex',
                                    gap: 8,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <a
                                    href={`mailto:${inquiry.contact_email}?subject=${encodeURIComponent(`re: kiwi pop wholesale — ${inquiry.business_name}`)}`}
                                    className="btn btn-primary"
                                    style={{ fontSize: 11 }}
                                  >
                                    reply →
                                  </a>
                                  <button
                                    type="button"
                                    className="btn"
                                    style={{
                                      fontSize: 11,
                                      borderColor: 'var(--cherry)',
                                      color: 'var(--cherry)',
                                    }}
                                    onClick={() => void remove(inquiry.id)}
                                    disabled={isSubmitting}
                                  >
                                    delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
