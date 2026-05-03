'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

interface RaffleFormProps {
  entryUrl: string;
}

type Status = 'idle' | 'sending' | 'ok' | 'err';

export function RaffleForm({ entryUrl }: RaffleFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [source, setSource] = useState<'manual' | 'qr'>('manual');

  // If the visitor arrived via the QR code we encode (?via=qr), record it so
  // we can tell scanned vs. typed entries apart in the admin draw flow.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('via') === 'qr') {
      setSource('qr');
    }
  }, []);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(
    `${entryUrl}?via=qr`,
  )}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending' || status === 'ok') return;
    setStatus('sending');
    setMessage('');
    try {
      const response = await fetch('/api/raffle/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          raffle_slug: 'drop-raffle-001',
          source: source === 'qr' ? 'raffle-page-qr' : 'raffle-page',
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'something broke. try again.');
      }
      setStatus('ok');
      setMessage("you're in. two winners get drawn — we'll email if it's you.");
      setName('');
      setEmail('');
      setPhone('');
    } catch (err) {
      setStatus('err');
      setMessage(err instanceof Error ? err.message : 'something broke');
    }
  };

  return (
    <div className="page-container">
      <p className="hero-tagline" style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}>
        // raffle
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 7vw, 4.5rem)',
          letterSpacing: '-0.03em',
          textTransform: 'lowercase',
          color: 'var(--paper)',
          marginBottom: '1rem',
        }}
      >
        win a kiwi pop drop.
        <br />
        <span style={{ color: 'var(--lime)' }}>two winners.</span>
      </h1>
      <p style={{ color: 'var(--bone)', marginBottom: '2.5rem', maxWidth: 640, lineHeight: 1.6 }}>
        drop your contact below or scan the code on a friend&apos;s phone. two
        winners get drawn at random and emailed when the box ships.
      </p>

      <div
        className="raffle-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 320px) 1fr',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        <div
          className="card"
          style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'var(--paper)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt={`QR code linking to ${entryUrl}`}
            width={300}
            height={300}
            style={{ width: '100%', height: 'auto', maxWidth: 300 }}
          />
          <p
            className="stat-label"
            style={{ color: 'var(--midnight)', textAlign: 'center', margin: 0 }}
          >
            scan to enter on your phone
          </p>
          <code
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--midnight)',
              wordBreak: 'break-all',
              textAlign: 'center',
            }}
          >
            {entryUrl}
          </code>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
          <p className="stat-label" style={{ marginBottom: '1.2rem' }}>
            // or enter manually
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="raffle-name">
              name
            </label>
            <input
              id="raffle-name"
              name="name"
              type="text"
              autoComplete="name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              disabled={status === 'sending' || status === 'ok'}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="raffle-email">
              email
            </label>
            <input
              id="raffle-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              disabled={status === 'sending' || status === 'ok'}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="raffle-phone">
              phone <span style={{ opacity: 0.6 }}>· optional</span>
            </label>
            <input
              id="raffle-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={40}
              disabled={status === 'sending' || status === 'ok'}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={status === 'sending' || status === 'ok'}
            style={{ marginTop: '1rem' }}
          >
            {status === 'sending'
              ? 'entering…'
              : status === 'ok'
                ? "✓ you're in"
                : 'enter raffle →'}
          </button>

          {message ? (
            <p
              className={`alert ${status === 'ok' ? 'alert-success' : status === 'err' ? 'alert-error' : ''}`}
              style={{ marginTop: '1rem' }}
            >
              {message}
            </p>
          ) : null}

          <p
            style={{
              marginTop: '1.25rem',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--bone)',
              opacity: 0.7,
              lineHeight: 1.6,
            }}
          >
            two winners · drawn at random · one entry per email · we&apos;ll only
            contact you about this raffle. no list, no resale.
          </p>
        </form>
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/" className="btn">
          back to the drop
        </Link>
        <Link href="/about" className="btn">
          the story
        </Link>
      </div>
    </div>
  );
}
