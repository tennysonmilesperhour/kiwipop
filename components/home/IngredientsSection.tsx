import { FUNCTIONALS } from '@/lib/flavors';

export function IngredientsSection() {
  return (
    <section className="ingredients-section" id="ingredients">
      <div className="section-header">
        <div className="section-title">
          <span className="num">/03</span>six things, doing real work
        </div>
        <div className="section-meta">
          functional payload · same on every flavor
        </div>
      </div>

      <div className="ingredients-grid">
        {FUNCTIONALS.map((ing, idx) => (
          <div className="ingredient-card" key={ing.name}>
            <div className="ingredient-num">/0{idx + 1}</div>
            <h3 className="ingredient-name">{ing.name}</h3>
            <div className="ingredient-amount">{ing.amount}</div>
            <p className="ingredient-why">{ing.why}</p>
          </div>
        ))}
      </div>

      <p className="ingredients-footnote">
        // base: isomalt · monk fruit + allulose · liquid sunflower lecithin
        <br />
        // five calories · zero sugar · vegan · all flavors share the same
        functional payload
      </p>
    </section>
  );
}
