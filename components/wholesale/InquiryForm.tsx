'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { wholesaleInquirySchema, type WholesaleInquiry } from '@/lib/validators';

const BUSINESS_TYPES: Array<{
  value: NonNullable<WholesaleInquiry['business_type']>;
  label: string;
}> = [
  { value: 'retail-shop', label: 'retail shop · grocery / boutique' },
  { value: 'cafe-bar', label: 'cafe / bar / late-night spot' },
  { value: 'event-vendor', label: 'event / festival vendor' },
  { value: 'distributor', label: 'distributor / multi-account' },
  { value: 'gym-studio', label: 'gym / studio / wellness' },
  { value: 'online-store', label: 'online store' },
  { value: 'other', label: 'something else' },
];

interface FormState {
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  location: string;
  business_type: '' | NonNullable<WholesaleInquiry['business_type']>;
  looking_to_order: string;
  about_business: string;
  timeline: string;
}

const EMPTY: FormState = {
  business_name: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  location: '',
  business_type: '',
  looking_to_order: '',
  about_business: '',
  timeline: '',
};

export function InquiryForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState<string>('');

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setMessage('');

    const payload = {
      business_name: form.business_name.trim(),
      contact_name: form.contact_name.trim(),
      contact_email: form.contact_email.trim(),
      contact_phone: form.contact_phone.trim() || undefined,
      location: form.location.trim(),
      business_type: form.business_type || undefined,
      looking_to_order: form.looking_to_order.trim(),
      about_business: form.about_business.trim() || undefined,
      timeline: form.timeline.trim() || undefined,
    };

    const validation = wholesaleInquirySchema.safeParse(payload);
    if (!validation.success) {
      setStatus('err');
      setMessage(validation.error.issues[0]?.message ?? 'check the form for errors');
      return;
    }

    setStatus('sending');
    try {
      const response = await fetch('/api/wholesale/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'submission failed');
      }
      setStatus('ok');
      setMessage(
        json.message ??
          "got it. we'll be in touch with a product catalogue and to discuss.",
      );
      setForm(EMPTY);
    } catch (err) {
      setStatus('err');
      setMessage(err instanceof Error ? err.message : 'something broke');
    }
  };

  if (status === 'ok') {
    return (
      <div className="kp-page" style={{ minHeight: '60vh' }}>
        <section className="z2" style={{ display: 'block', minHeight: '60vh' }}>
          <div className="copy" style={{ maxWidth: 720, margin: '0 auto' }}>
            <span className="lab">inquiry received</span>
            <h2>
              GOT IT.
              <br />
              <span className="pk">TALK SOON.</span>
            </h2>
            <p className="lede" style={{ marginTop: 24 }}>
              <span className="em">{message}</span>
            </p>
            <p className="lede" style={{ marginTop: 12 }}>
              expect a reply from <strong>tennysontaggart@gmail.com</strong> with the
              wholesale catalogue and pricing tiers within a couple business days.
              if you don&apos;t hear from us, ping{' '}
              <a href="mailto:tennysontaggart@gmail.com" style={{ color: 'var(--lemon)' }}>
                tennysontaggart@gmail.com
              </a>
              {' '}directly.
            </p>
            <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link className="kp-fr-cta" href="/">
                ← BACK TO LANDING
              </Link>
              <Link className="kp-fr-cta primary" href="/donate">
                CONTRIBUTE TO THE FUNDRAISER →
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="kp-inquiry-form" noValidate>
      <div className="kp-inquiry-row">
        <label className="kp-inquiry-field">
          <span className="kp-inquiry-label">business name *</span>
          <input
            type="text"
            value={form.business_name}
            onChange={(e) => update('business_name', e.target.value)}
            required
            maxLength={200}
            placeholder="basement bar · greenpoint"
          />
        </label>
        <label className="kp-inquiry-field">
          <span className="kp-inquiry-label">your name *</span>
          <input
            type="text"
            value={form.contact_name}
            onChange={(e) => update('contact_name', e.target.value)}
            required
            maxLength={200}
            placeholder="alex morgan"
          />
        </label>
      </div>

      <div className="kp-inquiry-row">
        <label className="kp-inquiry-field">
          <span className="kp-inquiry-label">email *</span>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => update('contact_email', e.target.value)}
            required
            maxLength={255}
            placeholder="alex@yourbusiness.com"
            autoComplete="email"
          />
        </label>
        <label className="kp-inquiry-field">
          <span className="kp-inquiry-label">phone (optional)</span>
          <input
            type="tel"
            value={form.contact_phone}
            onChange={(e) => update('contact_phone', e.target.value)}
            maxLength={40}
            placeholder="(801) 555-0123"
            autoComplete="tel"
          />
        </label>
      </div>

      <div className="kp-inquiry-row">
        <label className="kp-inquiry-field">
          <span className="kp-inquiry-label">where are you located? *</span>
          <input
            type="text"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            required
            maxLength={200}
            placeholder="city, state · or city, country"
          />
        </label>
        <label className="kp-inquiry-field">
          <span className="kp-inquiry-label">business type</span>
          <select
            value={form.business_type}
            onChange={(e) => update('business_type', e.target.value as FormState['business_type'])}
          >
            <option value="">— pick one —</option>
            {BUSINESS_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="kp-inquiry-field">
        <span className="kp-inquiry-label">what are you looking to order? *</span>
        <textarea
          value={form.looking_to_order}
          onChange={(e) => update('looking_to_order', e.target.value)}
          required
          maxLength={2000}
          rows={4}
          placeholder="how many units roughly · which flavors interest you · variety packs · single packs · whatever you have in mind"
        />
      </label>

      <label className="kp-inquiry-field">
        <span className="kp-inquiry-label">about your business (optional)</span>
        <textarea
          value={form.about_business}
          onChange={(e) => update('about_business', e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="who are your customers, what's the vibe, anything that helps us figure out if it's a fit"
        />
      </label>

      <label className="kp-inquiry-field">
        <span className="kp-inquiry-label">timeline (optional)</span>
        <input
          type="text"
          value={form.timeline}
          onChange={(e) => update('timeline', e.target.value)}
          maxLength={200}
          placeholder="when do you need product? · asap / next month / pre-festival"
        />
      </label>

      <button
        type="submit"
        className="cta-take"
        disabled={status === 'sending'}
        style={{ width: '100%' }}
      >
        {status === 'sending'
          ? 'SENDING…'
          : 'SEND INQUIRY → forwarded to tennyson directly'}
      </button>

      {status === 'err' && message ? (
        <p className="kp-inquiry-msg err">{message}</p>
      ) : null}
    </form>
  );
}
