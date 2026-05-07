'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

interface ReviewSubmitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

type Status = 'idle' | 'sending' | 'ok' | 'err';

export function ReviewSubmitModal({
  open,
  onClose,
  onSubmitted,
}: ReviewSubmitModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [body, setBody] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [msg, setMsg] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => firstFieldRef.current?.focus(), 30);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setMsg('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: name.trim(),
          email: email.trim(),
          rating,
          body: body.trim(),
          website,
          source: 'landing-modal',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "couldn't submit review");
      setStatus('ok');
      setMsg(
        "thanks. we'll read it and post it after a quick look — usually within a day."
      );
      onSubmitted?.();
    } catch (err) {
      setStatus('err');
      setMsg(err instanceof Error ? err.message : 'something went wrong');
    }
  };

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <div
      ref={dialogRef}
      className="rsm-backdrop"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rsm-title"
    >
      <div className="rsm-dialog">
        <button
          type="button"
          className="rsm-close"
          aria-label="close"
          onClick={onClose}
        >
          ×
        </button>
        <h3 id="rsm-title" className="rsm-title">
          leave a review.
        </h3>
        <p className="rsm-sub">
          tell us what you actually thought. we&apos;ll read every one — and
          post it on the site after a quick look.
        </p>

        {status === 'ok' ? (
          <div className="rsm-success">
            <p className="rsm-success-line">{msg}</p>
            <button
              type="button"
              className="rsm-btn rsm-btn-primary"
              onClick={onClose}
            >
              done →
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="rsm-form">
            <label className="rsm-label">
              <span>your name</span>
              <input
                ref={firstFieldRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="how should we credit you?"
                required
                maxLength={60}
                disabled={status === 'sending'}
              />
            </label>

            <label className="rsm-label">
              <span>email (private — for follow-up only)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@somewhere.com"
                maxLength={255}
                inputMode="email"
                autoComplete="email"
                disabled={status === 'sending'}
              />
            </label>

            <fieldset className="rsm-stars" disabled={status === 'sending'}>
              <legend>rating</legend>
              <div className="rsm-stars-row" role="radiogroup" aria-label="rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                    className={`rsm-star ${rating >= n ? 'on' : ''}`}
                    onClick={() => setRating(n)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="rsm-label">
              <span>your review</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="favorite flavor? how it actually felt? whatever — keep it real."
                required
                minLength={4}
                maxLength={1200}
                rows={5}
                disabled={status === 'sending'}
              />
            </label>

            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="rsm-honeypot"
              name="website"
            />

            <div className="rsm-actions">
              <button
                type="button"
                className="rsm-btn"
                onClick={onClose}
                disabled={status === 'sending'}
              >
                cancel
              </button>
              <button
                type="submit"
                className="rsm-btn rsm-btn-primary"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'sending…' : 'submit review →'}
              </button>
            </div>

            {status === 'err' && msg ? (
              <p className="rsm-err">{msg}</p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}
