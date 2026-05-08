import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbLd } from '@/lib/seo';

const title = 'about · the story';
const description =
  "the founder's voice on why a refreshing club lolli exists. gum and mints just don't hit the way they used to.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/about' },
  openGraph: { title: `${title} · kiwi pop`, description, url: '/about', type: 'article' },
  twitter: { card: 'summary_large_image', title: `${title} · kiwi pop`, description },
};

const breadcrumbLd = buildBreadcrumbLd([{ name: 'About', url: '/about' }]);

export default function AboutPage() {
  return (
    <div className="page-container">
      <JsonLd data={breadcrumbLd} />
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
            light when you lick it. jambu — the brazilian buzz-button
            flower — for an electric mouth tingle on the first lick;
            it&apos;s been used for centuries in brazilian, indian, and
            east african cooking and is standard now in modern bartending.
            theobromine, ginseng, b12, magnesium, taurine, electrolytes —
            the functional payload — measured by gram, not by vibe.
            xylitol does the sweet —
            tooth-friendly, low-glycemic, no insulin spike — with a touch
            of monk fruit. isomalt does the body. one stick.
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
            <strong style={{ color: 'var(--lime)' }}>kiwi pop</strong> —
            kiwi flavor, sweet/tart/clean. three more flavors are coming:{' '}
            <strong style={{ color: 'var(--cyan)' }}>molly&apos;s mint</strong>,{' '}
            <strong style={{ color: 'var(--sodium)' }}>lemon g. luci</strong>,{' '}
            and{' '}
            <strong style={{ color: 'var(--magenta)' }}>mary caramel apple</strong>. each
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
          // contact
        </p>
        <div className="contact-grid">
          <div>
            <div className="contact-label">general · wholesale · events · press</div>
            <a className="contact-link" href="mailto:thekiwipop@gmail.com">
              thekiwipop@gmail.com
            </a>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/#drop" className="btn btn-primary">
          shop kiwi pop
        </Link>
        <Link href="/find-us" className="btn">
          find us irl
        </Link>
      </div>
    </div>
  );
}
