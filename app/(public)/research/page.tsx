import Link from 'next/link';
import type { Metadata } from 'next';
import { RESEARCH, SYNTHESIS } from '@/lib/research';

export const metadata: Metadata = {
  title: 'research + references',
  description:
    'curated research, position statements, and authoritative reviews behind every ingredient in the kiwi pop formula: jambu, chilcuague, theobromine, ginseng, b12, magnesium, taurine, electrolytes, spirulina, xylitol, isomalt, and monk fruit.',
};

export default function ResearchPage() {
  return (
    <div className="page-container legal-page">
      <p className="hero-tagline" style={{ color: 'var(--bone)' }}>
        // research + references
      </p>
      <h1 className="legal-title">we did the homework.</h1>
      <p className="legal-meta">last updated · {new Date().getFullYear()}</p>

      <div className="legal-prose">
        {SYNTHESIS.split('\n\n').map((para, i) => (
          <p key={i}>{para.replace(/\n/g, ' ')}</p>
        ))}

        <p
          style={{
            padding: '1rem 1.25rem',
            borderLeft: '3px solid var(--lemon, #f5ff3d)',
            background: 'rgba(245, 255, 61, 0.08)',
            fontWeight: 500,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <strong>note:</strong> these references describe what
          peer-reviewed studies have <em>looked at</em>. they are not a
          claim that kiwi pop will produce any specific effect. the FDA
          has not evaluated these statements and kiwi pop is not intended
          to diagnose, treat, cure, or prevent any disease. see the{' '}
          <Link href="/legal/fda-disclaimer">fda + safety</Link> page for
          the full advisory.
        </p>

        {RESEARCH.map((ingredient) => (
          <section
            key={ingredient.name}
            style={{ marginTop: '2.5rem', scrollMarginTop: '5rem' }}
            id={ingredient.name.split(' ')[0].toLowerCase()}
          >
            <h2 style={{ textTransform: 'lowercase' }}>{ingredient.name}</h2>
            <p>{ingredient.blurb}</p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginTop: '1rem',
              }}
            >
              {ingredient.studies.map((study) => (
                <details
                  key={study.title}
                  style={{
                    border: '1px solid rgba(244, 236, 255, 0.16)',
                    borderRadius: 'var(--radius-card, 12px)',
                    padding: '14px 18px',
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <summary
                    style={{
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                      letterSpacing: '0.01em',
                      listStyle: 'none',
                      color: 'var(--paper, #f4ecff)',
                      lineHeight: 1.4,
                    }}
                  >
                    {study.title}
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        fontWeight: 400,
                        color: 'var(--bone, #c8c0db)',
                        opacity: 0.8,
                      }}
                    >
                      {study.authors} · {study.journal} · {study.year}
                    </div>
                  </summary>
                  <p
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: 'var(--bone, #c8c0db)',
                    }}
                  >
                    {study.summary}
                  </p>
                  <p style={{ marginTop: 8, fontSize: 12 }}>
                    <a
                      href={study.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--lime, #c8ff3d)' }}
                    >
                      view source →
                    </a>
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <h2 style={{ marginTop: '3rem' }}>found a broken link?</h2>
        <p>
          email <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a>{' '}
          and we&apos;ll fix it. these references are curated for
          authoritative sources (NIH, EFSA, Cochrane, FDA GRAS, ACSM,
          WHO) and well-cited primary studies; if a link goes stale we
          want to know.
        </p>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
