'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { formatCentsToUSD } from '@/lib/format';
import type { FundraiserSnapshot } from '@/lib/fundraiser';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CampaignUpdate {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  is_milestone: boolean;
  milestone_label: string | null;
  published_at: string;
}

interface CampaignPageProps {
  snapshot: FundraiserSnapshot;
  updates: CampaignUpdate[];
  videoUrl?: string;        // YouTube embed URL
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const PRESETS = [10, 25, 50, 100, 500];

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type StripeStatus = 'idle' | 'sending' | 'err';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CampaignPage({ snapshot, updates, videoUrl }: CampaignPageProps) {
  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [stripeStatus, setStripeStatus] = useState<StripeStatus>('idle');
  const [stripeError, setStripeError] = useState<string | null>(null);

  const effectiveAmount = useMemo(() => {
    const n = Number(custom);
    if (custom && Number.isFinite(n) && n > 0) return Math.floor(n);
    return amount;
  }, [amount, custom]);

  const percent = Math.min(100, snapshot.percent);

  const handleStripe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (stripeStatus === 'sending') return;
    if (!email.trim()) {
      setStripeStatus('err');
      setStripeError('email is required for the stripe receipt.');
      return;
    }
    if (effectiveAmount < 1) {
      setStripeStatus('err');
      setStripeError('pick an amount of at least $1.');
      return;
    }

    setStripeStatus('sending');
    setStripeError(null);
    try {
      const response = await fetch('/api/donate-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountDollars: effectiveAmount,
          email: email.trim(),
          name: name.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.checkoutUrl) {
        throw new Error(json.error ?? 'could not start stripe checkout');
      }
      window.location.href = json.checkoutUrl as string;
    } catch (err) {
      setStripeStatus('err');
      setStripeError(err instanceof Error ? err.message : 'unknown error');
    }
  };

  return (
    <div className="kp-page campaign-page">
      {/* ---- NAV (minimal) ---- */}
      <nav className="cp-nav">
        <Link href="/" className="cp-nav-brand">
          <span className="cn">舐</span> KIWI POP
        </Link>
        <div className="cp-nav-links">
          <Link href="/">SHOP</Link>
        </div>
      </nav>

      {/* ---- HERO: VIDEO + PROGRESS ---- */}
      <section className="cp-hero">
        {videoUrl ? (
          <div className="cp-video-wrap">
            <iframe
              src={videoUrl}
              title="Kiwi Pop Campaign Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="cp-video-placeholder">
            <div className="cp-vp-inner">
              <span className="cp-vp-icon">▶</span>
              <span className="cp-vp-label">VIDEO COMING SOON</span>
            </div>
          </div>
        )}

        {/* Progress tracker */}
        <div className="cp-progress">
          <div className="cp-progress-amounts">
            <span className="cp-raised">{formatCentsToUSD(snapshot.raisedCents)}</span>
            <span className="cp-goal">
              raised of {formatCentsToUSD(snapshot.goalCents)} goal
            </span>
          </div>
          <div className="cp-bar-track" role="progressbar" aria-valuenow={snapshot.raisedCents} aria-valuemin={0} aria-valuemax={snapshot.goalCents}>
            <div className="cp-bar-fill" style={{ width: `${Math.max(percent, 1.5)}%` }} />
          </div>
          <div className="cp-progress-meta">
            <span className="cp-pct">{percent < 1 ? '<1' : Math.round(percent)}% funded</span>
            <span className="cp-remaining">{formatCentsToUSD(snapshot.remainingCents)} to go</span>
          </div>
        </div>
      </section>

      {/* ---- MAIN CONTENT ---- */}
      <div className="cp-body">
        {/* LEFT: Story + Updates */}
        <main className="cp-main">
          {/* Story section */}
          <section className="cp-story">
            <h1 className="cp-title">LAUNCH THE KIWI</h1>
            <p className="cp-subtitle">
              Help us bring functional lollipops to every festival, every shelf, every hand that needs a better alternative.
            </p>
            <div className="cp-story-body">
              <p>
                <strong>Kiwi Pop</strong> is a lollipop-shaped party supplement — functional candy with less than 1g of sugar,
                packed with kava, theobromine, ginseng, B12, magnesium, taurine, and electrolytes. 
                We launched three days ago and our first video hit <strong>70,000 views</strong>. 
                People want this. Now we need to scale.
              </p>
              <p>
                Every dollar goes directly toward production runs, FDA-compliant packaging, 
                copacker deposits, and getting Kiwi Pop on shelves at shops and festivals 
                across the country. We&apos;re bootstrapping this with real love and real hustle.
              </p>
              <p>
                <span className="cp-highlight">Health is inevitable. Kindness is invincible.</span> 💚
              </p>
            </div>
          </section>

          {/* Updates feed */}
          <section className="cp-updates" id="updates">
            <h2 className="cp-section-title">
              <span className="cp-section-icon">📣</span>
              UPDATES
              {updates.length > 0 && <span className="cp-count">{updates.length}</span>}
            </h2>

            {updates.length === 0 ? (
              <div className="cp-empty-feed">
                <p>No updates yet — check back soon for launch milestones and news!</p>
              </div>
            ) : (
              <div className="cp-feed">
                {updates.map((update) => (
                  <article
                    key={update.id}
                    className={`cp-update-card${update.is_milestone ? ' milestone' : ''}`}
                  >
                    {update.is_milestone && update.milestone_label && (
                      <div className="cp-milestone-badge">
                        <span className="cp-milestone-icon">🎉</span>
                        {update.milestone_label}
                      </div>
                    )}
                    <div className="cp-update-header">
                      <h3 className="cp-update-title">{update.title}</h3>
                      <time className="cp-update-time" dateTime={update.published_at}>
                        {timeAgo(update.published_at)}
                      </time>
                    </div>
                    {update.image_url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={update.image_url}
                        alt={update.title}
                        className="cp-update-img"
                        loading="lazy"
                      />
                    )}
                    <div className="cp-update-body">
                      {update.body.split('\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        {/* RIGHT SIDEBAR: Donate */}
        <aside className="cp-sidebar">
          <div className="cp-donate-card">
            <h2 className="cp-donate-title">BACK THIS PROJECT</h2>

            <form onSubmit={handleStripe}>
              <div className="cp-presets">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`cp-preset${!custom && amount === preset ? ' on' : ''}`}
                    onClick={() => { setAmount(preset); setCustom(''); }}
                    aria-pressed={!custom && amount === preset}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="custom amount"
                className="cp-input"
                aria-label="custom donation amount in dollars"
              />

              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email · for receipt"
                className="cp-input"
                aria-label="email for stripe receipt"
              />

              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="name · optional"
                maxLength={120}
                className="cp-input"
                aria-label="donor name"
              />

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="leave a message · optional"
                maxLength={500}
                className="cp-input"
                aria-label="optional message"
              />

              <button
                type="submit"
                className="cp-cta primary"
                disabled={stripeStatus === 'sending'}
              >
                {stripeStatus === 'sending'
                  ? 'STARTING…'
                  : `DONATE ${formatCentsToUSD(effectiveAmount * 100)}`}
              </button>

              {stripeError && (
                <p className="cp-error">{stripeError}</p>
              )}
            </form>

            <p className="cp-fine-print">
              secure card checkout via stripe · ~2.9% + 30¢ processing fee.
              donate any amount you like.
            </p>
          </div>

          {/* Mini stats */}
          <div className="cp-stats-card">
            <div className="cp-stat">
              <span className="cp-stat-value">{formatCentsToUSD(snapshot.raisedCents)}</span>
              <span className="cp-stat-label">RAISED</span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-value">{Math.round(percent)}%</span>
              <span className="cp-stat-label">FUNDED</span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-value">{formatCentsToUSD(snapshot.remainingCents)}</span>
              <span className="cp-stat-label">TO GO</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="cp-links-card">
            <Link href="/" className="cp-link">🛒 SHOP KIWI POP</Link>
            <Link href="/wholesale/apply" className="cp-link">📦 WHOLESALE PREORDER</Link>
            <a
              href="https://instagram.com/the.kiwi.pop"
              target="_blank"
              rel="noopener noreferrer"
              className="cp-link"
            >
              📸 @THE.KIWI.POP
            </a>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="cp-footer">
        <div className="cp-footer-inner">
          <span className="cn">舐</span> KIWI POP · SALT LAKE CITY, UT
          <span className="cp-footer-sep">·</span>
          <Link href="/legal/terms">TERMS</Link>
          <span className="cp-footer-sep">·</span>
          <Link href="/legal/privacy">PRIVACY</Link>
          <span className="cp-footer-sep">·</span>
          <Link href="/legal/fda-disclaimer">FDA DISCLAIMER</Link>
        </div>
      </footer>
    </div>
  );
}
