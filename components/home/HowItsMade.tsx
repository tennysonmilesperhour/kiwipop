export function HowItsMade() {
  return (
    <section className="howitsmade-section scanlines" id="how">
      <div className="section-header">
        <div className="section-title">
          <span className="num">/04</span>it&apos;s a real lollipop
        </div>
        <div className="section-meta">
          made small · made specific · made too edible
        </div>
      </div>

      <div className="howitsmade-grid">
        <div className="howitsmade-step">
          <div className="howitsmade-step-num">01</div>
          <h3>cook the isomalt</h3>
          <p>
            sugar substitute, monk fruit, allulose. 320°f. clear and glassy.
            no traditional sugar at any point.
          </p>
        </div>
        <div className="howitsmade-step">
          <div className="howitsmade-step-num">02</div>
          <h3>fold the functionals</h3>
          <p>
            b12, electrolytes, l-tyrosine, ginkgo, turmeric. measured by gram,
            not by vibe. same payload, every pop.
          </p>
        </div>
        <div className="howitsmade-step">
          <div className="howitsmade-step-num">03</div>
          <h3>flavor + tartness</h3>
          <p>
            kiwi LorAnn oil, citric acid, ground freeze-dried fruit on the
            three flavors that get it. sweet, tart, clean.
          </p>
        </div>
        <div className="howitsmade-step">
          <div className="howitsmade-step-num">04</div>
          <h3>swirl the shimmer</h3>
          <p>
            edible mica luster dust folded through the middle right before
            molding. catches light on the lick. fully edible.
          </p>
        </div>
        <div className="howitsmade-step">
          <div className="howitsmade-step-num">05</div>
          <h3>embed the snap</h3>
          <p>
            real pop rocks crystals pressed into the mold a beat before the
            isomalt sets. they survive. they snap. the tell.
          </p>
        </div>
        <div className="howitsmade-step">
          <div className="howitsmade-step-num">06</div>
          <h3>stick · wrap · ship</h3>
          <p>
            paper stick, matte foil wrapper, sticker. small batches.
            you can taste the small batches.
          </p>
        </div>
      </div>

      <div className="howitsmade-tagline">
        the complaint we keep getting:{' '}
        <span style={{ color: 'var(--lime)' }}>too edible.</span>
      </div>
    </section>
  );
}
