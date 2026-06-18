import type { FlavorLabel } from '@/lib/labels';
import { LabelQR } from './LabelQR';

interface FlavorLabelCardProps {
  label: FlavorLabel;
  /** Absolute URL the QR points at (this flavor's label page). */
  qrUrl: string;
  /**
   * 'index' renders a tighter card (used on /labels where every flavor is
   * stacked); 'detail' renders the standalone per-flavor page header.
   */
  variant?: 'index' | 'detail';
}

/**
 * The full printed-label content for one flavor: ingredient statement,
 * approximate nutrition, the functional ("nutraceutical") payload with
 * doses, the safety warnings, and a scannable QR back to this page.
 * Shared by /labels and /labels/[flavor] so the two never drift.
 */
export function FlavorLabelCard({ label, qrUrl, variant = 'index' }: FlavorLabelCardProps) {
  const { flavor, functionals, ingredients, nutrition, warnings } = label;
  const accent = flavor.color;
  const isDetail = variant === 'detail';

  return (
    <section
      id={label.slug}
      style={{
        scrollMarginTop: '5rem',
        border: '1px solid rgba(244, 236, 255, 0.16)',
        borderTop: `3px solid ${accent}`,
        borderRadius: 'var(--radius-card, 12px)',
        padding: isDetail ? '1.75rem' : '1.5rem',
        marginTop: isDetail ? 0 : '2rem',
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <p
            style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: accent,
              margin: '0 0 4px',
            }}
          >
            {flavor.feeling} · {flavor.status === 'live' ? 'live' : 'coming soon'}
          </p>
          <h2 style={{ margin: 0, textTransform: 'lowercase' }}>{flavor.name}</h2>
          <p style={{ margin: '0.4rem 0 0', opacity: 0.8 }}>{flavor.flavor}</p>
        </div>

        <div style={{ flexShrink: 0 }}>
          <LabelQR url={qrUrl} flavorName={flavor.name} accent={accent} size={isDetail ? 184 : 152} />
          <p
            style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--bone, #b4afa1)',
              textAlign: 'center',
              margin: '8px 0 0',
              maxWidth: 200,
            }}
          >
            scan / print this for the lollipop
          </p>
        </div>
      </div>

      {/* Ingredients */}
      <h3 style={labelHeadingStyle}>ingredients</h3>
      <p style={{ margin: '0.4rem 0 0', lineHeight: 1.7 }}>
        {ingredients.join(', ')}.
      </p>

      {/* Nutrition */}
      <h3 style={labelHeadingStyle}>nutrition (approx · per pop)</h3>
      <div
        style={{
          border: '1px solid rgba(244, 236, 255, 0.16)',
          borderRadius: 8,
          overflow: 'hidden',
          marginTop: '0.5rem',
          maxWidth: 420,
        }}
      >
        {nutrition.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '7px 12px',
              paddingLeft: row.indent ? 26 : 12,
              fontSize: 13,
              borderTop: i === 0 ? 'none' : '1px solid rgba(244, 236, 255, 0.08)',
              background: row.indent ? 'transparent' : 'rgba(255,255,255,0.015)',
            }}
          >
            <span style={{ opacity: row.indent ? 0.75 : 1 }}>{row.label}</span>
            <span style={{ fontFamily: 'var(--mono, monospace)' }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Nutraceutical / functional payload */}
      <h3 style={labelHeadingStyle}>functional (nutraceutical) payload</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: '0.5rem' }}>
        {functionals.map((ing) => (
          <div
            key={ing.name}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: '0.5rem 1rem',
              alignItems: 'baseline',
              borderBottom: '1px solid rgba(244, 236, 255, 0.08)',
              paddingBottom: 8,
            }}
          >
            <span style={{ fontWeight: 600, textTransform: 'lowercase' }}>{ing.name}</span>
            <span
              style={{
                fontFamily: 'var(--mono, monospace)',
                fontSize: 12,
                color: accent,
                textAlign: 'right',
                whiteSpace: 'nowrap',
              }}
            >
              {ing.amount}
            </span>
            <span style={{ gridColumn: '1 / -1', fontSize: 13, opacity: 0.8 }}>{ing.why}</span>
          </div>
        ))}
      </div>

      {/* Warnings */}
      <h3 style={labelHeadingStyle}>warnings + allergens</h3>
      <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', lineHeight: 1.65 }}>
        {warnings.map((w) => (
          <li
            key={w.text}
            style={w.danger ? { color: 'var(--magenta, #ff4fd8)', fontWeight: 600 } : undefined}
          >
            {w.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

const labelHeadingStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  marginBottom: 0,
  fontSize: 13,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bone, #b4afa1)',
};
