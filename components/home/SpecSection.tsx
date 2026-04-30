interface Spec {
  label: string;
  value: string;
  unit: string;
}

const SPECS: Spec[] = [
  { label: 'sugar', value: '0', unit: 'g' },
  { label: 'calories', value: '5', unit: 'kcal' },
  { label: 'animals harmed', value: '0', unit: 'count' },
  { label: 'b12', value: '25', unit: 'mcg' },
  { label: 'electrolytes', value: '250', unit: 'mg' },
  { label: 'pop rocks', value: '2', unit: 'g real' },
  { label: 'flavors', value: '4', unit: 'live + soon' },
  { label: 'made / drop', value: '800', unit: 'units' },
];

export function SpecSection() {
  return (
    <section className="spec-section scanlines" id="spec">
      <div className="section-header">
        <div className="section-title">
          <span className="num">/06</span>the spec
        </div>
        <div className="section-meta">no notes · just facts</div>
      </div>

      <div className="spec-grid">
        {SPECS.map((spec) => (
          <div className="spec-cell" key={spec.label}>
            <div className="spec-label">{spec.label}</div>
            <div className="spec-value">
              {spec.value}
              <span className="spec-unit">{spec.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
