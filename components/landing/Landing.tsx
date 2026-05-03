'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/store';
import { formatCentsToUSD } from '@/lib/format';
import { FUNCTIONALS, PULL_QUOTES, PACKS, FLAVOR_IMG } from '@/lib/flavors';
import type { LandingProducts } from '@/lib/landing-products';
import type { FundraiserSnapshot } from '@/lib/fundraiser';
import { FundraiserBar } from './FundraiserBar';
import { RaffleForm } from './RaffleForm';

interface LandingProps {
  products: LandingProducts;
  fundraiser: FundraiserSnapshot;
}

const FLAVOR_DOT_COLOR: Record<string, string> = {
  'KP-KIWI-KITTY': '#a8ff3c',
  'KP-LUCY-LEMON': '#ffce1f',
  'KP-MANGO-MOLLY': '#ff2d8a',
  'KP-MARY-MINT': '#00f0ff',
};

const FESTIVAL_TICKER = [
  'DROP 001 · KIWI KITTY · LIVE',
  '3 PREORDERS OPEN',
  'BEYOND WONDERLAND · 2026.07',
  'COACHELLA W2 · 2026.04',
  'EDC LAS VEGAS · 2026.06',
  'LIGHTNING IN A BOTTLE · 2026.08',
  '<1G SUGAR · ~35 CAL · VEGAN',
  'FREE SHIP $40+',
  'MFD NEW SHIBUYA',
];

// Eight simple neon glyphs, one per functional ingredient slot. Index aligns
// with the FUNCTIONALS array order in lib/flavors.ts.
const FUNCTIONAL_ICONS = [
  // theobromine — chocolate square
  <g key="i0">
    <rect x="5" y="5" width="14" height="14" rx="1" />
    <path d="M9 5v14M14 5v14M5 9h14M5 14h14" />
  </g>,
  // kava — calm wave
  <g key="i1">
    <path d="M3 14c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
    <path d="M3 9c2-3 4-3 6 0s4 3 6 0 4-3 6 0" opacity="0.6" />
  </g>,
  // ginseng — root
  <g key="i2">
    <path d="M12 3v8" />
    <path d="M12 11c-2 0-4 2-4 5s2 5 4 5 4-2 4-5-2-5-4-5z" />
    <path d="M9 13l-3-2M15 13l3-2M9 17l-3 2M15 17l3 2" />
  </g>,
  // b12 — bolt
  <g key="i3">
    <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" />
  </g>,
  // magnesium — capsule
  <g key="i4">
    <rect x="3" y="9" width="18" height="6" rx="3" />
    <path d="M12 9v6" />
  </g>,
  // taurine — amino chain (linked rings)
  <g key="i5">
    <circle cx="8" cy="12" r="4" />
    <circle cx="16" cy="12" r="4" />
  </g>,
  // electrolytes — droplet
  <g key="i6">
    <path d="M12 3c-3 4-6 7-6 11a6 6 0 0 0 12 0c0-4-3-7-6-11z" />
  </g>,
  // spirulina — spiral
  <g key="i7">
    <path d="M12 4a8 8 0 1 1-7.9 9.5A6 6 0 1 1 16 14a4 4 0 1 1-7-1.5" />
  </g>,
];

export default function Landing({ products, fundraiser }: LandingProps) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const cartCount = useCart((s) => s.getTotalItems());
  const [mounted, setMounted] = useState(false);

  const liveFlavors = products.flavors.filter((f) => f.product);
  const initialFlavorSku = liveFlavors[0]?.sku ?? products.flavors[0]?.sku ?? '';
  const [flavorSku, setFlavorSku] = useState<string>(initialFlavorSku);
  const [packSize, setPackSize] = useState<number>(20);
  const [qty, setQty] = useState<number>(1);
  const [addState, setAddState] = useState<'idle' | 'added'>('idle');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupStatus, setSignupStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [signupMsg, setSignupMsg] = useState<string>('');

  useEffect(() => setMounted(true), []);

  const selectedFlavor = useMemo(
    () => products.flavors.find((f) => f.sku === flavorSku) ?? products.flavors[0],
    [flavorSku, products.flavors],
  );

  const selectedPack = useMemo(
    () =>
      products.packs.find((p) => p.size === packSize) ??
      products.packs[products.packs.length - 1] ??
      products.packs[0],
    [packSize, products.packs],
  );

  // For pack size 1, use the selected flavor's product directly (each flavor
  // is a single-pop SKU). For larger packs, fall back to the bundle SKU
  // since bundles aren't flavor-specific in production.
  const checkoutProduct = packSize === 1 ? selectedFlavor?.product : selectedPack?.product;
  const fallbackPriceCents = (selectedPack?.priceCents ?? 0) * qty;
  const livePriceCents = (checkoutProduct?.price_cents ?? selectedPack?.priceCents ?? 0) * qty;
  const strikeCents = packSize === 1 ? 0 : (selectedPack?.size ?? 0) * 500 * qty;

  const stockLine = (() => {
    const launch = products.flavors.find((f) => f.sku === 'KP-KIWI-KITTY');
    if (launch?.product && launch.product.in_stock > 0) {
      return `KIWI KITTY · ${launch.product.in_stock} IN STOCK`;
    }
    return 'KIWI KITTY · WAITLIST';
  })();

  const handleAddToCart = () => {
    if (!checkoutProduct) return;
    addItem({
      productId: checkoutProduct.id,
      name: checkoutProduct.name,
      price: checkoutProduct.price_cents,
      quantity: qty,
      image: checkoutProduct.image_url ?? FLAVOR_IMG[selectedFlavor?.sku ?? ''] ?? undefined,
      isPreorder: checkoutProduct.preorder_only,
    });
    setAddState('added');
    setTimeout(() => setAddState('idle'), 1600);
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signupEmail || signupStatus === 'sending') return;
    setSignupStatus('sending');
    setSignupMsg('');
    try {
      const response = await fetch('/api/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail, source: 'landing-reviews' }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'something broke. try again.');
      }
      setSignupStatus('ok');
      setSignupMsg("you're on the list");
      setSignupEmail('');
    } catch (err) {
      setSignupStatus('err');
      setSignupMsg(err instanceof Error ? err.message : 'something broke');
    }
  };

  const launchProduct = products.flavors.find((f) => f.sku === 'KP-KIWI-KITTY')?.product;

  return (
    <div className="kp-page">
      <FundraiserBar snapshot={fundraiser} varietyHalfOff={products.varietyHalfOff} />

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
          <a href="#raffle">RAFFLE</a>
          <Link href="/merch">MERCH</Link>
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
            {[...FESTIVAL_TICKER, ...FESTIVAL_TICKER].map((entry, i) => (
              <span key={i}>{entry}</span>
            ))}
          </div>
        </div>
        <span className="cn">USD ▾</span>
      </div>

      {/* ===== ZONE 1 · ARRIVAL ===== */}
      <section className="z1" data-screen-label="01 Arrival">
        <div className="cn-bg">舐夜</div>
        <div className="cn-bg2">糖</div>
        <div className="hero-img" />
        <div className="hero-pop" aria-hidden="true" />
        <div className="content">
          <span className="eyebrow">
            <span className="cn">舐</span> SUCKER-SHAPED SUPPLEMENTS YOU CAN PARTY WITH
          </span>
          <h1>
            <span style={{ color: '#f4ecff', display: 'block' }}>put this</span>
            <span className="pk" style={{ display: 'block' }}>in your mouth.</span>
            <span className="respect" style={{ color: 'rgb(155, 237, 255)' }}>respectfully</span>
          </h1>
          <p className="sub">
            <span className="em">refreshing club lolli.</span> &lt;1g of sugar · vegan · ~35 cal · theobromine + kava + ginseng + b12 + magnesium + taurine + electrolytes · edible mica glitter swirled inside.
          </p>
        </div>
        <div className="below">
          <div className="scroll">SCROLL TO ENTER</div>
          <div className="meta">
            VOL · 01 / 06 · ARRIVAL
            <br />
            <span className="kw">DROP 001 · {stockLine.split(' · ')[1]}</span>
          </div>
        </div>
      </section>

      {/* ===== ZONE 2 · ENTER ===== */}
      <section className="z2" data-screen-label="02 Enter">
        <div className="copy">
          <span className="lab">02 · ENTER</span>
          <h2>
            SUCKER-SHAPED
            <br />
            <span className="pk">SUPPLEMENTs.</span>
          </h2>
          <p className="lede">
            <span className="em">theobromine, kava, ginseng, b12, magnesium, taurine, electrolytes.</span>{' '}
            measured by gram, not by vibe. same payload, every pop.
          </p>
          <div className="ings">
            {FUNCTIONALS.map((ing) => (
              <span className="ing" key={ing.name}>
                {ing.name} · <span className="mg">{ing.amount.split(' ').slice(0, 2).join(' ')}</span>
              </span>
            ))}
          </div>
          <a className="cta" href="#inside">
            WHAT&apos;S INSIDE <span className="arr">→</span>
          </a>
        </div>
        <div className="img">
          <div className="img-cap">
            <span>001 · KIWI KITTY EDITION</span>
            <span>DROP 001</span>
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
            eternal&nbsp;<span className="lm">VIBRATIONS.</span>
          </h2>
          <div className="right">
            SWIPE → · {liveFlavors.length} OF {products.flavors.length} LIVE
            <br />
            <span className="kw">SAME FUNCTIONAL PAYLOAD</span>
            <br />
            FLAVOR DOES THE WORK
          </div>
        </div>
        <div className="rail">
          {products.flavors.map((flavor, idx) => {
            const cardSkuKey = flavor.sku === 'KP-KIWI-KITTY' ? 'cherry'
              : flavor.sku === 'KP-LUCY-LEMON' ? 'lemon'
              : flavor.sku === 'KP-MANGO-MOLLY' ? 'kiwi-flavor'
              : 'grape';
            const isLive = flavor.status === 'live' && flavor.product && !flavor.product.preorder_only;
            const href = flavor.product ? `/products/${flavor.product.id}` : '#shop';
            const inStock = flavor.product?.in_stock ?? 0;
            return (
              <Link
                key={flavor.sku}
                href={href}
                className={`fc ${cardSkuKey}`}
                aria-label={`${flavor.name} — ${isLive ? 'shop' : 'preorder'}`}
              >
                <div
                  className="img"
                  style={{ backgroundImage: `url(${FLAVOR_IMG[flavor.sku] ?? '/landing/img/lips-lollipop.jpg'})` }}
                />
                <span className={`status-pill ${isLive ? 'live' : 'soon'}`}>
                  {isLive ? `LIVE · ${inStock} LEFT` : 'PREORDER'}
                </span>
                <div className="top">
                  <span className="num">00{idx + 1} · {flavor.flavor.split(' ')[0].toUpperCase()}</span>
                  <h3>
                    {flavor.display.split('\n').map((line, i, arr) => (
                      <span key={i}>
                        {line}
                        {i < arr.length - 1 ? <br /> : null}
                      </span>
                    ))}
                  </h3>
                </div>
                <div className="bot">
                  <div className="effect">{flavor.feeling.replace(/^\/\/\s*/, '')}.</div>
                  <div className="ings">
                    {flavor.flavor}
                    <br />
                    {flavor.product
                      ? <>{formatCentsToUSD(flavor.product.price_cents).toUpperCase()} · <span className="mg">{isLive ? 'SHOP →' : 'PREORDER →'}</span></>
                      : <span className="mg">NOTIFY ME →</span>}
                  </div>
                </div>
              </Link>
            );
          })}
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
            gum and mints just don&apos;t hit the way they used to. <span className="em">a little secret</span> in your mouth — about 35 calories, &lt;1g of sugar, edible mica glitter that catches the light at the lick.
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
            six functionals doing real work, doses on the wrapper.{' '}
            <span className="em">measured by gram · not by vibe.</span>
          </div>
        </div>
        <div className="grid">
          {FUNCTIONALS.map((ing, idx) => (
            <div className="icd" key={ing.name}>
              <svg
                className="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {FUNCTIONAL_ICONS[idx] ?? <circle cx="12" cy="12" r="9" />}
              </svg>
              <div className="nm">{ing.name.toUpperCase()}</div>
              <div className="dose">{ing.amount.toUpperCase()}</div>
              <div className="desc">{ing.why}</div>
            </div>
          ))}
        </div>
        <div className="lab-band">
          <div className="item"><span className="dot" />&lt;1G SUGAR · ~35 CAL</div>
          <div className="item"><span className="dot" />VEGAN · GLUTEN FREE</div>
          <div className="item"><span className="dot" />KAVA · 750MG / POP</div>
          <div className="item"><span className="dot" />MFD NEW SHIBUYA</div>
          <div className="item"><span className="dot" />DROP 001 · {new Date().getFullYear()}</div>
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
            <div className="agg-meta">
              <span className="kw">INTEREST IN THE DMS FROM</span>
              <br />
              VIENNA · MELBOURNE · LONDON
              <br />
              <span className="kw">REPLACE WITH REAL COMMENTS</span> AS THEY COME IN
            </div>
          </div>
        </div>

        <div className="grid">
          {PULL_QUOTES.slice(0, 3).map((q, idx) => (
            <div className={`rev${q.highlight ? ' highlight' : ''}`} key={idx}>
              <div className="head-row">
                <span className="stars-sm">★ ★ ★ ★ ★</span>
                <span className="verified">{q.highlight ? 'PINNED' : 'VERIFIED'}</span>
              </div>
              <blockquote>{q.text}</blockquote>
              <div className="who">
                <span className="nm">{q.byline.replace(/^@\s*/, '@').toUpperCase()}</span>
                <span className="meta">
                  PULL QUOTE
                  <br />
                  <span className="kw">DROP 001</span>
                </span>
              </div>
            </div>
          ))}

          <div className="rev signup">
            <div className="head-row">
              <span className="stars-sm">✦ ✧ ☆</span>
              <span className="verified" style={{ color: 'var(--lemon)' }}>JOIN</span>
            </div>
            <blockquote>
              <span className="em">get on the list.</span> drops sell out in 11 minutes on average — don&apos;t be late.
            </blockquote>
            <form onSubmit={handleSignup}>
              <input
                type="email"
                placeholder="your email · all lowercase"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                disabled={signupStatus === 'sending' || signupStatus === 'ok'}
                autoComplete="email"
                inputMode="email"
                aria-label="email address"
              />
              <button type="submit" disabled={signupStatus === 'sending' || signupStatus === 'ok'}>
                {signupStatus === 'sending' ? 'WAIT…' : signupStatus === 'ok' ? "YOU'RE IN" : 'GET ON THE LIST →'}
              </button>
              {signupMsg ? (
                <span className={`msg ${signupStatus === 'ok' ? 'ok' : signupStatus === 'err' ? 'err' : ''}`}>
                  {signupMsg}
                </span>
              ) : null}
            </form>
          </div>
        </div>

        <div className="ig-row">
          <span className="item"><span className="dot" />TAG <span className="kw">@KIWIPOP</span> + #LICKTHENIGHT TO GET FEATURED</span>
          <span className="item">SOURCED FROM TIKTOK · INSTAGRAM · DMS</span>
          <span className="item">REAL REVIEWS WHEN DROP 001 SHIPS</span>
          <span className="item"><Link href="/about" className="kw">FOUNDER VOICE →</Link></span>
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
              drops sell out in <span className="em">11 minutes</span> on average. don&apos;t be late.
            </p>
            <span className="lab" style={{ borderColor: 'var(--lemon)', color: 'var(--lemon)' }}>
              SHIPS FROM NEW SHIBUYA · DOMESTIC FIRST
            </span>
          </div>
        </div>

        <div className="boxes">
          <div className="img-foot">
            <span className="ig-handle">@kiwipop · the lineup</span>
            <p className="quote">
              &ldquo;{PULL_QUOTES[0]?.text}&rdquo; <span className="em">{PULL_QUOTES[0]?.byline}</span>
            </p>
            <span className="who">— DROP 001 · KIWI KITTY · LIVE NOW</span>
          </div>

          <div className="checkout">
            <div className="row">
              <span className="label">FLAVOR</span>
              <span className="label">
                <span className="kw">{liveFlavors.length} LIVE · {products.flavors.length - liveFlavors.length} PREORDER</span>
              </span>
            </div>
            <div className="flav-pick">
              {products.flavors.map((flavor) => {
                const disabled = !flavor.product;
                return (
                  <button
                    key={flavor.sku}
                    type="button"
                    className={`flav-opt${flavorSku === flavor.sku ? ' on' : ''}`}
                    onClick={() => flavor.product && setFlavorSku(flavor.sku)}
                    disabled={disabled}
                    style={{
                      borderLeftColor: flavorSku === flavor.sku ? FLAVOR_DOT_COLOR[flavor.sku] : undefined,
                    }}
                    aria-pressed={flavorSku === flavor.sku}
                    title={flavor.status === 'soon' ? 'preorder' : 'in stock'}
                  >
                    {flavor.name.split(' ')[1] ?? flavor.name}
                  </button>
                );
              })}
            </div>

            <div className="row">
              <span className="label">PACK SIZE</span>
              <span className="label">
                <span className="kw">$5 SINGLE · 6 FOR $25 · 20 FOR $60</span>
              </span>
            </div>
            <div className="pack-pick">
              {PACKS.map((pack) => (
                <button
                  key={pack.size}
                  type="button"
                  className={`pack-opt${packSize === pack.size ? ' on' : ''}`}
                  onClick={() => setPackSize(pack.size)}
                  aria-pressed={packSize === pack.size}
                >
                  <span className="sz">{pack.size}×</span>
                  <span className="pp">{pack.label.toUpperCase()}</span>
                  <span className="pp">{formatCentsToUSD(pack.priceCents)}</span>
                </button>
              ))}
            </div>

            <div className="row">
              <span className="label">{selectedPack ? selectedPack.label.toUpperCase() : 'PACK'} · {selectedPack?.badge?.toUpperCase() ?? '12CT'}</span>
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
                {formatCentsToUSD(livePriceCents > 0 ? livePriceCents : fallbackPriceCents)}
                {strikeCents > livePriceCents && livePriceCents > 0 ? (
                  <span className="strike">{formatCentsToUSD(strikeCents)}</span>
                ) : null}
                {selectedPack?.badge ? (
                  <span className="save">{selectedPack.badge.toUpperCase()}</span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className={`cta-take${addState === 'added' ? ' added' : ''}`}
              onClick={handleAddToCart}
              disabled={!checkoutProduct}
            >
              {addState === 'added'
                ? 'ADDED → GO TO CART'
                : checkoutProduct
                  ? `TAKE ONE → ADD TO CART · ${formatCentsToUSD(livePriceCents)}`
                  : 'NOTIFY ME →'}
            </button>
            {addState === 'added' ? (
              <button
                type="button"
                className="kp-fr-cta primary"
                onClick={() => router.push('/cart')}
                style={{ alignSelf: 'flex-start' }}
              >
                GO TO CART →
              </button>
            ) : null}
            <div className="meta-row">
              <span className="item"><span className="dot" />&lt;1G SUGAR</span>
              <span className="item"><span className="dot" />~35 CAL</span>
              <span className="item"><span className="dot" />VEGAN</span>
              <span className="item"><span className="dot" />KAVA + THEOBROMINE</span>
            </div>
          </div>
        </div>
      </section>

      <RaffleForm />

      {/* ===== FOOTER ===== */}
      <footer className="kp-foot">
        <div className="col">
          <div className="brand-foot">
            <div className="kp-mark" style={{ width: 36, height: 36 }} />
            <div className="nm">KIWI<span className="pk">.</span>POP</div>
          </div>
          <p>
            made small in new shibuya, dosed for the dance floor. shipping since {new Date().getFullYear()}.
            {launchProduct ? <> drop 001 · {launchProduct.in_stock} kiwi kitty in stock.</> : null}
          </p>
        </div>
        <div className="col">
          <h4>SHOP</h4>
          {products.flavors.map((flavor) => (
            <Link
              key={flavor.sku}
              href={flavor.product ? `/products/${flavor.product.id}` : '#shop'}
            >
              {flavor.name} {flavor.status === 'soon' ? '· preorder' : null}
            </Link>
          ))}
          {products.varietyHalfOff ? (
            <Link href="/cart">variety pack · half off</Link>
          ) : null}
        </div>
        <div className="col">
          <h4>BRAND</h4>
          <a href="#inside">what&apos;s inside</a>
          <Link href="/about">a little secret</Link>
          <Link href="/find-us">find us irl</Link>
          <Link href="/wholesale">wholesale</Link>
          <Link href="/donate">donate</Link>
        </div>
        <div className="col">
          <h4>CONTACT</h4>
          <a href="mailto:hello@kiwipop.co">hello@kiwipop.co</a>
          <a href="mailto:wholesale@kiwipop.co">wholesale@kiwipop.co</a>
          <a href="mailto:events@kiwipop.co">events@kiwipop.co</a>
          <a href="mailto:press@kiwipop.co">press@kiwipop.co</a>
          <Link href="/legal/shipping">shipping</Link>
        </div>
        <div className="legal">
          <span className="kw">⚠</span> THESE STATEMENTS HAVE NOT BEEN EVALUATED BY THE FDA. THIS PRODUCT IS NOT INTENDED TO DIAGNOSE, TREAT, CURE, OR PREVENT ANY DISEASE. NOT FOR USE BY PERSONS UNDER 18. CONSULT A HEALTHCARE PROFESSIONAL BEFORE USE. CONTAINS KAVA, THEOBROMINE, GINSENG, B12, MAGNESIUM, TAURINE, ELECTROLYTES, EDIBLE MICA. SUGAR ALCOHOLS (ISOMALT, XYLITOL) MAY CAUSE GI UPSET IN LARGE QUANTITIES.
          <br />
          <br />© KIWI POP · {new Date().getFullYear()} · DROP 001 · MFD NEW SHIBUYA · <span className="kw">舐 一下</span>
        </div>
      </footer>
    </div>
  );
}
