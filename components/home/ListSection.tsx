'use client';

import { useState } from 'react';

export function ListSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>(
    'idle'
  );
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('submitting');
    setMessage('');
    try {
      const response = await fetch('/api/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'something broke. try again.');
      }
      setStatus('done');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'something broke');
    }
  };

  return (
    <section className="list-section" id="list">
      <div className="ticker">
        get on the list · get on the list · get on the list · get on the list ·
        get on the list ·
      </div>
      <h2>get on the list.</h2>
      <p>// drops sell out in 11 minutes on average. don&apos;t be late.</p>
      <form className="list-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="your email · all lowercase"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'submitting' || status === 'done'}
          autoComplete="email"
          inputMode="email"
        />
        <button type="submit" disabled={status === 'submitting' || status === 'done'}>
          {status === 'submitting'
            ? 'wait…'
            : status === 'done'
            ? "you're in"
            : 'submit'}
        </button>
      </form>
      {status === 'error' && message ? (
        <p style={{ marginTop: '1rem', color: '#7b2dff', textTransform: 'lowercase' }}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
