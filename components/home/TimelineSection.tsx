import { TIMELINE } from '@/lib/flavors';

export function TimelineSection() {
  return (
    <section className="timeline-section scanlines" id="timeline">
      <div className="section-header">
        <div className="section-title">
          <span className="num">/02</span>what it&apos;s actually like
        </div>
        <div className="section-meta">first lick → twenty minutes in</div>
      </div>

      <div className="timeline-grid">
        {TIMELINE.map((moment, idx) => (
          <div className="timeline-card" key={moment.index}>
            <div className="timeline-index">{moment.index}</div>
            <div className="timeline-step">
              {String(idx + 1).padStart(2, '0')}
            </div>
            <h3 className="timeline-title">{moment.title}</h3>
            <p className="timeline-body">{moment.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
