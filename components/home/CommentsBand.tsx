import { PULL_QUOTES } from '@/lib/flavors';

export function CommentsBand() {
  return (
    <section className="comments-section" id="talking">
      <div className="section-header">
        <div className="section-title">
          <span className="num">/05</span>what people keep saying
        </div>
        <div className="section-meta">replace with real comments as they come in</div>
      </div>

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

      <div className="comments-international">
        <span className="dot" />
        <span>
          interest in the dms from{' '}
          <strong style={{ color: 'var(--lime)' }}>vienna</strong>,{' '}
          <strong style={{ color: 'var(--magenta)' }}>melbourne</strong>, and{' '}
          <strong style={{ color: 'var(--cyan)' }}>london</strong>.
          we ship domestic first. international list opens when we have stock.
        </span>
      </div>
    </section>
  );
}
