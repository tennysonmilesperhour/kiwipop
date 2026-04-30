'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  wholesaleApplicationSchema,
  type WholesaleApplication,
} from '@/lib/validators';

const CHANNELS: Array<{ value: WholesaleApplication['channel']; label: string }> = [
  { value: 'retail-shop', label: 'retail shop · grocery / boutique' },
  { value: 'cafe-bar', label: 'cafe / bar / late-night spot' },
  { value: 'event-vendor', label: 'event / festival vendor' },
  { value: 'distributor', label: 'distributor / multi-account' },
  { value: 'other', label: 'something else' },
];

interface FormState {
  business_name: string;
  tax_id: string;
  contact_email: string;
  contact_phone: string;
  expected_monthly_units: string;
  channel: WholesaleApplication['channel'] | '';
  message: string;
}

const EMPTY_FORM: FormState = {
  business_name: '',
  tax_id: '',
  contact_email: '',
  contact_phone: '',
  expected_monthly_units: '',
  channel: '',
  message: '',
};

export default function WholesaleApplyPage(): JSX.Element {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<{
    status: 'pending' | 'approved' | 'rejected';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (user?.email && !form.contact_email) {
      setForm((prev) => ({ ...prev, contact_email: user.email ?? '' }));
    }
  }, [user, form.contact_email]);

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    const expected = form.expected_monthly_units
      ? parseInt(form.expected_monthly_units, 10)
      : undefined;

    const payload = {
      business_name: form.business_name.trim(),
      tax_id: form.tax_id.trim() || undefined,
      contact_email: form.contact_email.trim(),
      contact_phone: form.contact_phone.trim() || undefined,
      expected_monthly_units:
        expected != null && Number.isFinite(expected) ? expected : undefined,
      channel: form.channel || undefined,
      message: form.message.trim() || undefined,
    };

    const validation = wholesaleApplicationSchema.safeParse(payload);
    if (!validation.success) {
      setError(
        validation.error.issues[0]?.message ?? 'check the form for errors'
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/wholesale/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'submission failed');
      }
      setSuccess({ status: json.status, message: json.message });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ color: 'var(--bone)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          loading…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container" style={{ maxWidth: 560 }}>
        <p
          className="hero-tagline"
          style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
        >
          // wholesale · apply
        </p>
        <h1
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 800,
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            letterSpacing: '-0.03em',
            textTransform: 'lowercase',
            color: 'var(--paper)',
            marginBottom: '1rem',
          }}
        >
          sign in first.
        </h1>
        <p
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 13,
            color: 'var(--bone)',
            marginBottom: '2rem',
          }}
        >
          wholesale applications get tied to a profile so you can check status
          later. takes a minute.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            href={`/auth/signup?next=${encodeURIComponent('/wholesale/apply')}`}
            className="btn btn-primary"
          >
            create account
          </Link>
          <Link
            href={`/auth/signin?next=${encodeURIComponent('/wholesale/apply')}`}
            className="btn"
          >
            sign in
          </Link>
          <Link href="/wholesale" className="btn btn-secondary">
            back to wholesale
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-container" style={{ maxWidth: 600 }}>
        <p
          className="hero-tagline"
          style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
        >
          // wholesale · received
        </p>
        <h1
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 800,
            fontSize: 'clamp(2rem, 7vw, 4rem)',
            letterSpacing: '-0.04em',
            textTransform: 'lowercase',
            color: 'var(--lime)',
            marginBottom: '1rem',
          }}
        >
          {success.status === 'approved'
            ? "you're already in."
            : 'application received.'}
        </h1>
        <p
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 14,
            color: 'var(--paper)',
            marginBottom: '2rem',
          }}
        >
          {success.message}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/wholesale/account" className="btn btn-primary">
            view application status →
          </Link>
          <Link href="/" className="btn">
            back to dawn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // wholesale · apply
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          letterSpacing: '-0.03em',
          textTransform: 'lowercase',
          color: 'var(--paper)',
          marginBottom: '0.5rem',
        }}
      >
        tell us about your shop.
      </h1>
      <p
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 13,
          color: 'var(--bone)',
          marginBottom: '2rem',
        }}
      >
        we read every one. no template responses.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">business name *</label>
            <input
              type="text"
              value={form.business_name}
              onChange={(e) => updateField('business_name', e.target.value)}
              className="form-input"
              required
              autoComplete="organization"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">contact email *</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => updateField('contact_email', e.target.value)}
                className="form-input"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">contact phone</label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) => updateField('contact_phone', e.target.value)}
                className="form-input"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">tax id / ein</label>
              <input
                type="text"
                value={form.tax_id}
                onChange={(e) => updateField('tax_id', e.target.value)}
                className="form-input"
                placeholder="optional · helps us approve faster"
              />
            </div>
            <div className="form-group">
              <label className="form-label">expected units / month</label>
              <input
                type="number"
                min="0"
                value={form.expected_monthly_units}
                onChange={(e) =>
                  updateField('expected_monthly_units', e.target.value)
                }
                className="form-input"
                placeholder="ballpark is fine"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">channel *</label>
            <select
              value={form.channel}
              onChange={(e) =>
                updateField(
                  'channel',
                  e.target.value as WholesaleApplication['channel']
                )
              }
              className="form-select"
              required
            >
              <option value="">— pick one —</option>
              {CHANNELS.map((ch) => (
                <option key={ch.value} value={ch.value ?? ''}>
                  {ch.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">anything else?</label>
            <textarea
              value={form.message}
              onChange={(e) => updateField('message', e.target.value)}
              rows={4}
              className="form-textarea"
              placeholder="festival you're vending, the city, anything that helps us picture the spot"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
          >
            {submitting ? 'sending…' : 'submit application'}
          </button>
        </form>
      </div>

      <p
        style={{
          marginTop: '1.5rem',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--bone)',
          letterSpacing: '0.1em',
        }}
      >
        // signed in as <strong>{user.email}</strong> · this account holds your
        application status.{' '}
        <button
          type="button"
          onClick={() => router.push('/wholesale')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--lime)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          back to wholesale →
        </button>
      </p>
    </div>
  );
}
