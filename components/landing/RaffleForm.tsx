'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'sending' | 'ok' | 'err';

export function RaffleForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [social, setSocial] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
          social_handle: social.trim() || undefined,
          source: 'landing-raffle',
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.error ?? 'something broke. try again.');
      }

      setStatus('ok');
      setMessage("you're in. we'll DM the winner.");
    } catch (err) {
      setStatus('err');
      setMessage(err instanceof Error ? err.message : 'something broke');
    }
  };

  const locked = status === 'sending' || status === 'ok';

  return (
    <section className="zraffle" id="raffle" data-screen-label="07 Raffle">
      <div className="cn-bg" aria-hidden="true">运</div>

      <div className="head">
        <span className="lab">07 · ARTWORK RAFFLE</span>
        <h2>
          WIN THE
          <br />
          <span className="lm">ARTWORK.</span>
        </h2>
        <p className="lede">
          one original kiwi pop piece, one winner.{' '}
          <span className="em">free to enter.</span> drop your info, we&apos;ll
          pick at random and DM the winner. promise we won&apos;t sell your data —
          we&apos;ll just tag you in the post.
        </p>
      </div>

      <form className="raffle-form" onSubmit={onSubmit}>
        <label className="field">
          <span className="label">NAME</span>
          <input
            type="text"
            placeholder="who do we tag"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={locked}
            maxLength={120}
            autoComplete="name"
            aria-label="your name"
          />
        </label>

        <label className="field">
          <span className="label">EMAIL</span>
          <input
            type="email"
            placeholder="for the announcement"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={locked}
            maxLength={255}
            autoComplete="email"
            inputMode="email"
            aria-label="your email"
          />
        </label>

        <label className="field">
          <span className="label">
            PHONE <span className="opt">· OPTIONAL</span>
          </span>
          <input
            type="tel"
            placeholder="if you'd rather text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={locked}
            maxLength={40}
            autoComplete="tel"
            inputMode="tel"
            aria-label="phone number (optional)"
          />
        </label>

        <label className="field">
          <span className="label">
            SOCIAL <span className="opt">· OPTIONAL</span>
          </span>
          <input
            type="text"
            placeholder="@handle so we can tag you"
            value={social}
            onChange={(e) => setSocial(e.target.value)}
            disabled={locked}
            maxLength={120}
            aria-label="social handle (optional)"
          />
        </label>

        <button type="submit" className="cta" disabled={locked}>
          {status === 'sending'
            ? 'ENTERING…'
            : status === 'ok'
              ? "YOU'RE IN ✓"
              : 'ENTER THE RAFFLE →'}
        </button>

        {message ? (
          <span className={`msg ${status === 'ok' ? 'ok' : status === 'err' ? 'err' : ''}`}>
            {message}
          </span>
        ) : null}

        <p className="fine">
          one entry per email. winner drawn at random. void where prohibited.
          must be 18+. we&apos;ll never share your contact info.
        </p>
      </form>
    </section>
  );
}
