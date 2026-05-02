import Link from 'next/link';
import type { Metadata } from 'next';
import { PULL_QUOTES } from '@/lib/flavors';

export const metadata: Metadata = {
  title: 'about · the story',
  description:
    "the founder's voice on why a refreshing club lolli exists. gum and mints just don't hit the way they used to.",
};

export default function AboutPage() {
  return (
    <div className="page-container">
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // about
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 7vw, 4.5rem)',
          letterSpacing: '-0.03em',
          textTransform: 'lowercase',
          color: 'var(--paper)',
          marginBottom: '2.5rem',
        }}
      >
        a little secret
        <br />
        in your mouth.
      </h1>

      <div className="card" style={{ padding: '2rem' }}>
        <p
          className="stat-label"
          style={{ marginBottom: '1.2rem' }}
        >
          // founder voice · uncut
        </p>
        <div className="story-prose">
          <p>
            gum and mints just don&apos;t hit the way they used to. that&apos;s
            the whole thing. that&apos;s how it started.
          </p>
          <p>
            i wanted something to put in my mouth at 1am that didn&apos;t
            wreck me. nothing on the shelf was right. wellness candy was
            polite. energy chews tasted like a gym towel. mints came with
            barely any flavor and nothing else.
          </p>
          <p>
            so i made one. about thirty-five calories. less than a gram of
            sugar. edible mica glitter swirled through so it catches
            light when you lick it. theobromine, kava, ginseng, b12,
            magnesium, taurine, electrolytes — the functional payload —
            measured by gram, not by vibe. monk fruit and a touch of xylitol
            do the sweet, no insulin spike. isomalt does the body. one stick.
            small batch. you can taste the small batch.
          </p>
          <p>
            <strong style={{ color: 'var(--lime)' }}>
              make it shimmer. make it hydrating.
            </strong>{' '}
            that was the brief i kept giving myself.
          </p>
          <p>
            and that was the birth of the kiwi pop.
          </p>
          <p>
            the original is{' '}
            <strong style={{ color: 'var(--lime)' }}>kiwi kitty</strong> —
            kiwi flavor, sweet/tart/clean. three more flavors are coming:{' '}
            <strong style={{ color: 'var(--magenta)' }}>mango molly</strong>,{' '}
            <strong style={{ color: 'var(--sodium)' }}>lucy lemon</strong>,{' '}
            and{' '}
            <strong style={{ color: 'var(--cyan)' }}>mary mint</strong>. each
            built around a small obsession. same functional payload across
            the four. flavor does the work.
          </p>
          <p>
            we&apos;re launching soooon.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <p className="stat-label" style={{ marginBottom: '1.2rem' }}>
          // what people keep saying
        </p>
        <div className="comments-grid">
          {PULL_QUOTES.map((q, idx) => (
            <blockquote
              key={idx}
              className={`comment-card${q.highlight ? ' comment-card--highlight' : ''}`}
            >
              <p className="comment-text">{q.text}</p>
              <cite className="comment-byline">{q.byline}</cite>
            </blockquote>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <p className="stat-label" style={{ marginBottom: '1.2rem' }}>
          // contact
        </p>
        <div className="contact-grid">
          <div>
            <div className="contact-label">general</div>
            <a className="contact-link" href="mailto:hello@kiwipop.co">
              hello@kiwipop.co
            </a>
          </div>
          <div>
            <div className="contact-label">wholesale</div>
            <a className="contact-link" href="mailto:wholesale@kiwipop.co">
              wholesale@kiwipop.co
            </a>
          </div>
          <div>
            <div className="contact-label">events / festival</div>
            <a className="contact-link" href="mailto:events@kiwipop.co">
              events@kiwipop.co
            </a>
          </div>
          <div>
            <div className="contact-label">press</div>
            <a className="contact-link" href="mailto:press@kiwipop.co">
              press@kiwipop.co
            </a>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/#drop" className="btn btn-primary">
          shop kiwi kitty
        </Link>
        <Link href="/find-us" className="btn">
          find us irl
        </Link>
      </div>
    </div>
  );
}
