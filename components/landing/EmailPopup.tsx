'use client';

import { useEffect, useState, type FormEvent } from 'react';

const POPUP_DISMISSED_KEY = 'kp-email-popup-dismissed';
const POPUP_DELAY_MS = 8000; // Show after 8 seconds on page

export function EmailPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    // Don't show if already dismissed or already signed up
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(POPUP_DISMISSED_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), POPUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || status === 'sending') return;
    setStatus('sending');
    setMsg('');
    try {
      const res = await fetch('/api/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'popup-15off' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'something broke');
      setStatus('ok');
      setMsg("you're in. check your email for FIRSTPOP.");
      localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString());
      setTimeout(() => setVisible(false), 4000);
    } catch (err) {
      setStatus('err');
      setMsg(err instanceof Error ? err.message : 'something broke');
    }
  };

  if (!visible) return null;

  return (
    <>
      <div className="kp-popup-overlay" onClick={dismiss} />
      <div className="kp-popup">
        <button className="kp-popup-close" onClick={dismiss} aria-label="close popup">×</button>
        <div className="kp-popup-badge">15% OFF</div>
        <h3 className="kp-popup-title">your first pop is on&nbsp;us.</h3>
        <p className="kp-popup-sub">
          sign up and get <strong>15% off</strong> your first order. code hits your inbox instantly.
        </p>
        {status === 'ok' ? (
          <div className="kp-popup-success">{msg}</div>
        ) : (
          <form onSubmit={handleSubmit} className="kp-popup-form">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="kp-popup-input"
              required
              autoFocus
            />
            <button type="submit" className="kp-popup-submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'SENDING...' : 'GET 15% OFF →'}
            </button>
            {status === 'err' && <p className="kp-popup-err">{msg}</p>}
          </form>
        )}
        <p className="kp-popup-fine">no spam. unsubscribe anytime. we just make lollipops.</p>
      </div>
    </>
  );
}
