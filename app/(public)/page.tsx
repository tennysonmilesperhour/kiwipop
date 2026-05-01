'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/lib/store';

interface FlavorOption {
  id: string;
  label: string;
  productId: string;
  name: string;
  image: string;
}

const FLAVORS: FlavorOption[] = [
  { id: 'kiwi', label: 'Kiwi', productId: 'kiwi-volt', name: 'Kiwi Volt 12ct', image: '/landing/img/anime-lollipop.jpg' },
  { id: 'capple', label: 'C.apple', productId: 'caramel-apple', name: 'Caramel Apple 12ct', image: '/landing/img/lips-lollipop.jpg' },
  { id: 'mango', label: 'mango', productId: 'molly-mango', name: 'Molly Mango 12ct', image: '/landing/img/eye-galaxy.jpg' },
  { id: 'lemon', label: 'LEMOn.ging', productId: 'lucy-lemon', name: 'Lucy Lemon 12ct', image: '/landing/img/yellow-hair.jpg' },
];

const PRICE = 48;
const STRIKE = 56;

export default function Home() {
  const [flavorId, setFlavorId] = useState<string>('kiwi');
  const [qty, setQty] = useState<number>(2);
  const [mounted, setMounted] = useState(false);

  const addItem = useCart((s) => s.addItem);
  const cartCount = useCart((s) => s.getTotalItems());

  useEffect(() => setMounted(true), []);

  const selected = useMemo(
    () => FLAVORS.find((f) => f.id === flavorId) ?? FLAVORS[0],
    [flavorId],
  );

  const handleAddToCart = () => {
    addItem({
      productId: selected.productId,
      name: selected.name,
      price: PRICE,
      quantity: qty,
      image: selected.image,
      isPreorder: false,
    });
  };

  return (
    <div className="kp-page">
      {/* ===== NAV ===== */}
      <nav className="kp-nav">
        <Link href="/" className="kp-brand">
          <div className="kp-mark" />
          <div className="nm">
            KIWI POP <span className="cn">舐</span>
          </div>
        </Link>
        <div className="kp-nav-links">
          <a href="#shop">SHOP</a>
          <a href="#flavors">FLAVORS</a>
          <a href="#inside">WHAT&apos;S INSIDE</a>
          <a href="#reviews">REVIEWS</a>
          <Link href="/find-us">FIND US</Link>
        </div>
        <Link href="/cart" className="kp-cart-btn" aria-label="cart">
          CART {mounted && cartCount > 0 ? <span className="kp-cart-count">{cartCount}</span> : null}
        </Link>
      </nav>

      <div className="kp-ticker-bar">
        <span className="cn">舐一下</span>
        <div className="kp-ticker">
          <div className="kp-ticker-inner">
            <span>FREE SHIP $40+</span>·<span>CHERRY KAVA RESTOCKED</span>·<span>NEW: GRAPE VOLT</span>·<span>LAB TESTED · BATCH 042</span>·<span>SHIPS FROM BROOKLYN</span>·<span>FREE SHIP $40+</span>·<span>CHERRY KAVA RESTOCKED</span>·<span>NEW: GRAPE VOLT</span>·<span>LAB TESTED · BATCH 042</span>·<span>SHIPS FROM BROOKLYN</span>
          </div>
        </div>
        <span className="cn">USD ▾</span>
      </div>

      {/* ===== ZONE 1 · ARRIVAL ===== */}
      <section className="z1" data-screen-label="01 Arrival">
        <div className="cn-bg">舐夜</div>
        <div className="cn-bg2">糖</div>
        <div className="hero-img" />
        <div className="content">
          <span className="eyebrow">
            <span className="cn">舐</span> THE LOLLIPOP-SHAPED SUPPLEMENT
          </span>
          <h1>
            <span style={{ color: '#f4ecff', display: 'block' }}>Put this</span>
            <span className="pk" style={{ display: 'block' }}>in your mouth</span>
            <span className="respect" style={{ color: 'rgb(155, 237, 255)' }}>respectfully</span>
          </h1>
          <p className="sub">
            <span className="em">sweet stamina.</span> no comedown. monk fruit, kava, b12 — dosed for the third hour.
          </p>
        </div>
        <div className="below">
          <div className="scroll">SCROLL TO ENTER</div>
          <div className="meta">
            VOL · 01 / 06 · ARRIVAL
            <br />
            <span className="kw">BATCH 042 · MFD HKG</span>
          </div>
        </div>
      </section>

      {/* ===== ZONE 2 · ENTER ===== */}
      <section className="z2" data-screen-label="02 Enter">
        <div className="copy">
          <span className="lab">02 · ENTER</span>
          <h2>
            LOLLIPOP-SHAPED
            <br />
            <span className="pk">SUPPLEMENTs.</span>
          </h2>
          <p className="lede">
            <span className="em">monk fruit, kava, electrolytes, b12, taurine, magnesium, ginkgo, theobromine, spirulina.</span>{' '}
            why hasn&apos;t anyone done this already?
          </p>
          <div className="ings">
            <span className="ing">monk fruit · <span className="mg">120 mg</span></span>
            <span className="ing">electrolytes · <span className="mg">340 mg</span></span>
            <span className="ing">magnesium · <span className="mg">200 mg</span></span>
            <span className="ing">taurine · <span className="mg">200 mg</span></span>
            <span className="ing">kava · <span className="mg">75 mg</span></span>
            <span className="ing">theobromine · <span className="mg">22 mg</span></span>
            <span className="ing">ginkgo · <span className="mg">60 mg</span></span>
            <span className="ing">b12 · <span className="mg">500 mcg</span></span>
          </div>
          <a className="cta" href="#inside">
            WHAT&apos;S INSIDE <span className="arr">→</span>
          </a>
        </div>
        <div className="img">
          <div className="img-cap">
            <span>002 · SNAKEBITE EDITION</span>
            <span>BATCH 042</span>
          </div>
        </div>
      </section>

      {/* ===== ZONE 3 · DANCE / FLAVORS ===== */}
      <section className="z3" id="flavors" data-screen-label="03 Dance">
        <div className="ticker-cn">
          舐 一下 · 舐 一下 · 舐 一下 · 舐 一下 · 舐 一下 · 舐 一下 · 舐 一下 · 舐 一下 · 舐 一下 · 舐 一下 ·
        </div>
        <div className="head">
          <h2>
            FOUR
            <br />
            FLAVORS,
            <br />
            eternal&nbsp;<span className="lm">VIBES.</span>
          </h2>
          <div className="right">
            SWIPE → · 4 OF 4
            <br />
            <span className="kw">ALL THIRD-PARTY TESTED</span>
            <br />
            EVERY BATCH · NO EXCEPTIONS
          </div>
        </div>
        <div className="rail">
          <div className="fc cherry">
            <div className="img" />
            <div className="top">
              <span className="num">001 · CHERRY</span>
              <h3>kiwi<br />KAVA</h3>
            </div>
            <div className="bot">
              <div className="effect">calm girl, euphoric girl.</div>
              <div className="ings">
                KAVA <span className="mg">75 MG</span> · MAGNESIUM <span className="mg">200 MG</span>
                <br />
                THEOBROMINE <span className="mg">22 MG</span> · B12 · GINKGO
              </div>
            </div>
          </div>
          <div className="fc kiwi-flavor">
            <div className="img" />
            <div className="top">
              <span className="num">002 · KIWI</span>
              <h3>Mary jane&apos;s<br />caramel apple</h3>
            </div>
            <div className="bot">
              <div className="effect">stamina + focus.</div>
              <div className="ings">
                ELECTROLYTES <span className="mg">340 MG</span> · TAURINE <span className="mg">200 MG</span>
                <br />
                GINKGO <span className="mg">60 MG</span> · B12 · SPIRULINA
              </div>
            </div>
          </div>
          <div className="fc grape">
            <div className="img" />
            <div className="top">
              <span className="num">003 · GRAPE</span>
              <h3>Molly<br />mango</h3>
            </div>
            <div className="bot">
              <div className="effect">energy + euphoric.</div>
              <div className="ings">
                THEOBROMINE <span className="mg">44 MG</span>
                <br />
                TAURINE <span className="mg">400 MG</span> · B12 · GLITTER
              </div>
            </div>
          </div>
          <div className="fc lemon">
            <div className="img" />
            <div className="top">
              <span className="num">004 · LEMON</span>
              <h3>lucy<br />lemon</h3>
            </div>
            <div className="bot">
              <div className="effect">soft + warm.</div>
              <div className="ings">
                KAVA <span className="mg">100 MG</span> · MAGNESIUM <span className="mg">250 MG</span>
                <br />
                MONK FRUIT · GINKGO <span className="mg">60 MG</span> · ELECTROLYTES
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ZONE 4 · PEAK ===== */}
      <section className="z4" data-screen-label="04 Peak">
        <div className="melt-bg" />
        <div className="scan" />
        <div className="cn-huge">夜</div>
        <div className="bars">
          <b /><b /><b /><b /><b /><b /><b />
        </div>
        <div className="bars r">
          <b /><b /><b /><b /><b /><b /><b />
        </div>
        <div className="peak-content">
          <span className="lab">04 · PEAK · 03:47 AM</span>
          <h1 className="mega">
            UNTIL
            <br />
            <span className="lm">SUNRISE.</span>
          </h1>
          <p className="quote">
            made for the third hour — the bathroom mirror at <span className="em">1:47am</span>, the cab home at five, the friend who said <span className="em">&ldquo;one more&rdquo;</span>.
          </p>
        </div>
      </section>

      {/* ===== ZONE 5 · REVEAL ===== */}
      <section className="z5" id="inside" data-screen-label="05 Reveal">
        <div className="cn-bg">糖</div>
        <div className="head">
          <h2>
            WHAT&apos;S
            <br />
            ACTUALLY IN
            <br />
            YOUR <span className="lm">MOUTH.</span>
          </h2>
          <div className="right">
            third-party tested every batch, allergens disclosed, doses on the wrapper.{' '}
            <span className="em">no medical claims · no fairy dust. <br />Well, maybe fairy dust.</span>
          </div>
        </div>
        <div className="grid">
          <div className="icd">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z" /></svg>
            <div className="nm">KAVA</div>
            <div className="dose">75 MG · ROOT EXTRACT</div>
            <div className="desc">the calm without the comedown. soft warm hum, body still your body.</div>
          </div>
          <div className="icd">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="2,12 6,12 8,5 12,19 14,9 16,14 22,14" /></svg>
            <div className="nm">MAGNESIUM</div>
            <div className="dose">200 MG · GLYCINATE</div>
            <div className="desc">muscles relax, jaw unclenches. taurine in kiwi + grape stacks the focus on top.</div>
          </div>
          <div className="icd">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg>
            <div className="nm">B12</div>
            <div className="dose">500 MCG · METHYL</div>
            <div className="desc">no morning headache. the nutrient your liver wishes you took yesterday.</div>
          </div>
          <div className="icd">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 2 L13 8 L19 9 L13 11 L12 17 L11 11 L5 9 L11 8 Z" /></svg>
            <div className="nm">GLITTER</div>
            <div className="dose">EDIBLE · COSMETIC GRADE</div>
            <div className="desc">shows up on your tongue, fades the moment you walk into work.</div>
          </div>
        </div>
        <div className="lab-band">
          <div className="item"><span className="dot" />THIRD-PARTY LAB TESTED</div>
          <div className="item"><span className="dot" />VEGAN · GLUTEN FREE</div>
          <div className="item"><span className="dot" />NO ADDED SUGAR</div>
          <div className="item"><span className="dot" />MFD HONG KONG</div>
          <div className="item"><span className="dot" />BATCH 042 · 2026</div>
        </div>
      </section>

      {/* ===== ZONE 5.5 · GLAZE US (REVIEWS) ===== */}
      <section className="zr" id="reviews" data-screen-label="05b Reviews">
        <div className="cn-bg">舐</div>
        <div className="head">
          <h2>
            GLAZE
            <br />
            US <span className="glaze">HERE.</span>
          </h2>
          <div className="agg">
            <div className="stars">★ ★ ★ ★ ★</div>
            <div className="agg-num">
              4.9<span className="of">/5</span>
            </div>
            <div className="agg-meta">
              <span className="kw">2,847 REVIEWS</span> · 96% RECOMMEND
              <br />
              VERIFIED THRU SHOPIFY · NO BOTS, NO BRIBES
            </div>
          </div>
        </div>

        <div className="grid">
          <div className="rev">
            <div className="head-row">
              <span className="stars-sm">★ ★ ★ ★ ★</span>
              <span className="verified">VERIFIED</span>
            </div>
            <blockquote>
              cherry kava on the way to <span className="em">basement</span> at 11. didn&apos;t crash til 7am brunch. <span className="pk">unreal.</span>
            </blockquote>
            <div className="who">
              <span className="nm">MAYA K.</span>
              <span className="meta">CHERRY KAVA<br /><span className="kw">BROOKLYN · MAR</span></span>
            </div>
          </div>
          <div className="rev">
            <div className="head-row">
              <span className="stars-sm">★ ★ ★ ★ ★</span>
              <span className="verified">VERIFIED</span>
            </div>
            <blockquote>
              i thought this was a gimmick. it is a gimmick. <span className="em">it also works.</span> grape galaxy is my <span className="pk">girlfriend</span> now.
            </blockquote>
            <div className="who">
              <span className="nm">DEV R.</span>
              <span className="meta">GRAPE GALAXY<br /><span className="kw">LA · APR</span></span>
            </div>
          </div>
          <div className="rev">
            <div className="head-row">
              <span className="stars-sm">★ ★ ★ ★ ★</span>
              <span className="verified">VERIFIED</span>
            </div>
            <blockquote>
              kiwi volt at 2am hit different. focused enough to <span className="em">not text my ex</span>, dosed enough to dance to one more set.
            </blockquote>
            <div className="who">
              <span className="nm">SOFIA L.</span>
              <span className="meta">KIWI VOLT<br /><span className="kw">BERLIN · FEB</span></span>
            </div>
          </div>
          <div className="rev leave">
            <div className="nm">drop a <span className="it">glaze.</span></div>
            <p className="sub">
              tell us what flavor, what hour, what <span className="pk">happened.</span> we read every one.
            </p>
            <span className="arr">LEAVE A REVIEW →</span>
          </div>
        </div>

        <div className="ig-row">
          <span className="item"><span className="dot" />TAG <span className="kw">@KIWIPOPNYC</span> + #LICKTHENIGHT TO GET FEATURED</span>
          <span className="item">SORT BY · MOST RECENT ▾</span>
          <span className="item">FILTER · CHERRY · KIWI · GRAPE · LEMON</span>
          <span className="item"><span className="kw">SEE ALL 2,847 →</span></span>
        </div>
      </section>

      {/* ===== ZONE 6 · COMEDOWN / CHECKOUT ===== */}
      <section className="z6" id="shop" data-screen-label="06 Comedown">
        <div className="copy">
          <div className="copy-left">
            <span className="lab">06 · COMEDOWN</span>
            <h2>
              TAKE
              <br />
              <span className="lm">ONE.</span>
            </h2>
          </div>
          <div className="copy-right">
            <p className="line">
              or <span className="em">five.</span> the night doesn&apos;t stop because your dopamine did.
            </p>
            <span className="lab" style={{ borderColor: 'var(--lemon)', color: 'var(--lemon)' }}>
              SHIPS FROM BROOKLYN · 2 DAYS
            </span>
          </div>
        </div>

        <div className="boxes">
          <div className="img-foot">
            <span className="ig-handle">@kiwipopnyc · the lineup</span>
            <p className="quote">
              &ldquo;the rest of the night is yours. <span className="em">we&apos;re just the bridge.</span>&rdquo;
            </p>
            <span className="who">— TAGGED 4,200+ TIMES</span>
          </div>

          <div className="checkout">
            <div className="row">
              <span className="label">FLAVOR</span>
              <span className="label">
                <span className="kw">VARIETY PACK ALSO AVAILABLE</span>
              </span>
            </div>
            <div className="flav-pick">
              {FLAVORS.map((flavor) => (
                <button
                  key={flavor.id}
                  type="button"
                  className={`flav-opt${flavorId === flavor.id ? ' on' : ''}`}
                  onClick={() => setFlavorId(flavor.id)}
                  aria-pressed={flavorId === flavor.id}
                >
                  {flavor.label}
                </button>
              ))}
            </div>
            <div className="row">
              <span className="label">PACK · 12CT</span>
              <span className="label">
                <span className="kw">FREE SHIP $40+</span>
              </span>
            </div>
            <div className="qty-row">
              <div className="qty">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="decrease quantity">−</button>
                <span>{qty.toString().padStart(2, '0')}</span>
                <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="increase quantity">+</button>
              </div>
              <div className="price">
                ${PRICE * qty} <span className="strike">${STRIKE * qty}</span> <span className="save">SAVE 14%</span>
              </div>
            </div>
            <button type="button" className="cta-take" onClick={handleAddToCart}>
              TAKE ONE → ADD TO CART
            </button>
            <div className="meta-row">
              <span className="item"><span className="dot" />LAB TESTED</span>
              <span className="item"><span className="dot" />VEGAN</span>
              <span className="item"><span className="dot" />GLUTEN FREE</span>
              <span className="item"><span className="dot" />NO ADDED SUGAR</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="kp-foot">
        <div className="col">
          <div className="brand-foot">
            <div className="kp-mark" style={{ width: 36, height: 36 }} />
            <div className="nm">KIWI<span className="pk">.</span>POP</div>
          </div>
          <p>made in hong kong, dosed for the dance floor. shipping out of brooklyn since 2026.</p>
        </div>
        <div className="col">
          <h4>SHOP</h4>
          <Link href="/products">cherry kava</Link>
          <Link href="/products">kiwi volt</Link>
          <Link href="/products">grape galaxy</Link>
          <Link href="/products">lemon hum</Link>
          <Link href="/products">variety pack</Link>
        </div>
        <div className="col">
          <h4>BRAND</h4>
          <a href="#inside">what&apos;s inside</a>
          <Link href="/about">journal</Link>
          <Link href="/find-us">find us irl</Link>
          <Link href="/wholesale">wholesale</Link>
        </div>
        <div className="col">
          <h4>HELP</h4>
          <Link href="/legal/shipping">shipping</Link>
          <a href="mailto:hello@kiwipop.co">contact</a>
          <Link href="/legal">allergens</Link>
          <Link href="/legal/terms">terms</Link>
        </div>
        <div className="legal">
          <span className="kw">⚠</span> THESE STATEMENTS HAVE NOT BEEN EVALUATED BY THE FDA. THIS PRODUCT IS NOT INTENDED TO DIAGNOSE, TREAT, CURE, OR PREVENT ANY DISEASE. NOT FOR USE BY PERSONS UNDER 18, PREGNANT OR NURSING, OR THOSE TAKING PRESCRIPTION MEDICATIONS. CONSULT A HEALTHCARE PROFESSIONAL BEFORE USE. CONTAINS KAVA · MAY INTERACT WITH ALCOHOL.
          <br />
          <br />© KIWI POP HOLDINGS · {new Date().getFullYear()} · BATCH 042 · MFD HKG · <span className="kw">舐 一下</span>
        </div>
      </footer>
    </div>
  );
}
