'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/store';
import { formatCentsToUSD } from '@/lib/format';
import { FLAVOR_IMG, FUNCTIONALS, PACKS } from '@/lib/flavors';
import { FAQ_ITEMS, FAQ_LD } from '@/lib/faq';
import type { LandingProducts } from '@/lib/landing-products';
import type { FundraiserSnapshot } from '@/lib/fundraiser';
import { JsonLd } from '@/components/JsonLd';
import { FundraiserBar } from './FundraiserBar';
import { RaffleForm } from './RaffleForm';
import { ReelPlayer } from './ReelPlayer';
import { ReviewSubmitModal } from './ReviewSubmitModal';

interface LandingProps {
  products: LandingProducts;
  fundraiser: FundraiserSnapshot;
}

const FLAVOR_DOT_COLOR: Record<string, string> = {
  'KP-KIWI-KITTY': '#a8ff3c',
  'KP-LUCY-LEMON': '#ffce1f',
  'KP-MANGO-MOLLY': '#00f0ff',
  'KP-MARY-MINT': '#d97539',
};

const FESTIVAL_TICKER = [
  'DROP 001 · KIWI POP · LIVE',
  '3 PREORDERS OPEN',
  'HEALTH IS INEVITABLE · KINDNESS IS INVINCIBLE',
  'BEYOND WONDERLAND · 2026.07',
  'COACHELLA W2 · 2026.04',
  'EDC LAS VEGAS · 2026.06',
  'LIGHTNING IN A BOTTLE · 2026.08',
  '<1G SUGAR · ~35 CAL · VEGAN',
  'FREE SHIP $40+',
  'MFD SALT LAKE',
];

// Simple neon glyphs, one per functional ingredient slot. Index aligns
// with the FUNCTIONALS array order in lib/flavors.ts.
const FUNCTIONAL_ICONS = [
  // jambu — flower with spark petals (the buzz-button bloom)
  <g key="i0">
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M6.3 17.7l2.1-2.1M15.6 8.4l2.1-2.1" />
  </g>,
  // theobromine — chocolate square
  <g key="i1">
    <rect x="5" y="5" width="14" height="14" rx="1" />
    <path d="M9 5v14M14 5v14M5 9h14M5 14h14" />
  </g>,
  // magnesium — capsule
  <g key="i2">
    <rect x="3" y="9" width="18" height="6" rx="3" />
    <path d="M12 9v6" />
  </g>,
  // taurine — amino chain (linked rings)
  <g key="i3">
    <circle cx="8" cy="12" r="4" />
    <circle cx="16" cy="12" r="4" />
  </g>,
  // electrolytes — droplet
  <g key="i4">
    <path d="M12 3c-3 4-6 7-6 11a6 6 0 0 0 12 0c0-4-3-7-6-11z" />
  </g>,
  // b12 — bolt
  <g key="i5">
    <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" />
  </g>,
  // adaptogen — sprout (per-flavor variation)
  <g key="i6">
    <path d="M12 21v-8" />
    <path d="M12 13c-3 0-6-2-6-6 3 0 6 2 6 6z" />
    <path d="M12 13c3 0 6-2 6-6-3 0-6 2-6 6z" />
  </g>,
  // xylitol — tooth (tooth-friendly sweetener)
  <g key="i7">
    <path d="M8 3c-2 0-4 2-4 5 0 3 1 4 2 7s1 6 3 6 2-3 3-6 2-3 3 0 1 6 3 6 2-3 3-6 2-4 2-7c0-3-2-5-4-5-2 0-3 1-4 1s-2-1-4-1z" />
  </g>,
];

export default function Landing({ products, fundraiser }: LandingProps) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const cartCount = useCart((s) => s.getTotalItems());
  const [mounted, setMounted] = useState(false);

  const liveFlavors = products.flavors.filter(
    (f) => f.product && !f.product.preorder_only,
  );
  const initialFlavorSku = liveFlavors[0]?.sku ?? products.flavors[0]?.sku ?? '';
  const [flavorSku, setFlavorSku] = useState<string>(initialFlavorSku);
  // The flavor row has 5 buttons: the 4 single flavors plus VARIETY.
  // 'flavor' mode → pack-size row shows [1, 6, 20] tiers tied to flavorSku.
  // 'variety' mode → pack-size row shows the [8, 20, 40] variety tiers.
  const [kind, setKind] = useState<'flavor' | 'variety'>('flavor');
  const [packSize, setPackSize] = useState<number>(1);
  const [qty, setQty] = useState<number>(1);
  const [addState, setAddState] = useState<'idle' | 'added'>('idle');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupStatus, setSignupStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [signupMsg, setSignupMsg] = useState<string>('');

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [approvedReviews, setApprovedReviews] = useState<
    Array<{ id: string; display_name: string; rating: number; body: string; approved_at: string | null }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/reviews', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.reviews) return;
        setApprovedReviews(j.reviews);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  const selectedVariety = useMemo(
    () =>
      products.variety.find((v) => v.size === packSize) ??
      products.variety[products.variety.length - 1] ??
      products.variety[0],
    [packSize, products.variety],
  );

  // Unified "active tier" — picks from flavor packs or variety tiers based
  // on kind. Both shapes carry size / priceCents / label / badge / product
  // so the price + badge + strike math below works without branching.
  const activeTier = kind === 'variety' ? selectedVariety : selectedPack;

  // For flavor + size 1, use the selected flavor's own SKU (each flavor is a
  // single-pop SKU). For flavor packs, use the bundle SKU. For variety, use
  // the variety tier SKU directly.
  const checkoutProduct =
    kind === 'variety'
      ? selectedVariety?.product
      : packSize === 1
        ? selectedFlavor?.product
        : selectedPack?.product;
  const fallbackPriceCents = (activeTier?.priceCents ?? 0) * qty;
  const livePriceCents =
    (checkoutProduct?.price_cents ?? activeTier?.priceCents ?? 0) * qty;
  // Single flavor (1-pop) has no strike-through; everything else strikes
  // size × $5/pop so the discount is visible.
  const strikeCents =
    kind === 'flavor' && packSize === 1
      ? 0
      : (activeTier?.size ?? 0) * 500 * qty;

  // Switching between flavor and variety modes — make sure the current
  // pack size still exists in the new mode's tier list, otherwise reset
  // to a sensible default (20 is shared by both).
  const FLAVOR_SIZES = [1, 6, 20] as const;
  const VARIETY_SIZES = [8, 20, 40] as const;
  const handleSelectFlavor = (sku: string) => {
    setKind('flavor');
    setFlavorSku(sku);
    if (!FLAVOR_SIZES.includes(packSize as (typeof FLAVOR_SIZES)[number])) {
      setPackSize(20);
    }
  };
  const handleSelectVariety = () => {
    setKind('variety');
    if (!VARIETY_SIZES.includes(packSize as (typeof VARIETY_SIZES)[number])) {
      setPackSize(20);
    }
  };

  const stockLine = (() => {
    const launch = products.flavors.find((f) => f.sku === 'KP-KIWI-KITTY');
    if (launch?.product && launch.product.in_stock > 0) {
      return `KIWI POP · ${launch.product.in_stock} IN STOCK`;
    }
    return 'KIWI POP · WAITLIST';
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
      {/* ===== NAV ===== */}
      <nav className="kp-nav">
        <Link href="/" className="kp-brand">
          <img
            src="/landing/img/kiwi-kitty-pop.webp"
            alt=""
            className="kp-mark"
            aria-hidden="true"
          />
          <div className="nm">
            KIWI POP <span className="cn">舐</span>
          </div>
        </Link>
        <div className="kp-nav-links">
          <a href="#shop">SHOP</a>
          <a href="#inside">WHAT&apos;S INSIDE</a>
          <Link href="/merch">MERCH</Link>
          {/* secondary links: hidden on desktop (live in MORE menu); shown inline on mobile scroll-strip */}
          <a href="#founders" className="kp-nav-link--secondary">FOUNDERS</a>
          <a href="#flavors" className="kp-nav-link--secondary">FLAVORS</a>
          <a href="#reviews" className="kp-nav-link--secondary">REVIEWS</a>
          <Link href="/campaign" className="kp-nav-link--secondary">CAMPAIGN</Link>
          <Link href="/raffle" className="kp-nav-link--secondary">RAFFLE</Link>
          <Link href="/variety" className="kp-nav-link--secondary">VARIETY</Link>
          <Link href="/wholesale" className="kp-nav-link--secondary">WHOLESALE</Link>
          <Link href="/find-us" className="kp-nav-link--secondary">FIND US</Link>
          <div className="kp-nav-more">
            <button
              type="button"
              className="kp-nav-more__btn"
              aria-haspopup="true"
            >
              MORE <span aria-hidden="true">▾</span>
            </button>
            <div className="kp-nav-more__panel" role="menu">
              <a href="#founders" role="menuitem">FOUNDERS</a>
              <a href="#flavors" role="menuitem">FLAVORS</a>
              <a href="#reviews" role="menuitem">REVIEWS</a>
              <Link href="/campaign" role="menuitem">CAMPAIGN</Link>
              <Link href="/raffle" role="menuitem">RAFFLE</Link>
              <Link href="/variety" role="menuitem">VARIETY</Link>
              <Link href="/wholesale" role="menuitem">WHOLESALE</Link>
              <Link href="/find-us" role="menuitem">FIND US</Link>
            </div>
          </div>
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
        {/* Hero portrait + lollipop product photo, swapped from CSS
            background-image to <Image> tags so crawlers (and AI crawlers
            like GPTBot/PerplexityBot) can read the product imagery.
            The CSS classes keep the same layout, mask, drop-shadows. */}
        <div className="hero-img">
          <Image
            src="/landing/img/lips-lollipop.jpg"
            alt="Kiwi Pop hero — anime portrait holding a swirl lollipop"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
        <div className="hero-pop" aria-hidden="true">
          <Image
            src="/landing/img/kiwi-kitty-pop.webp"
            alt=""
            fill
            priority
            aria-hidden="true"
            sizes="(max-width: 1024px) 80vw, 40vw"
            style={{ objectFit: 'contain', objectPosition: 'bottom center' }}
          />
        </div>
        <div className="content">
          <span className="eyebrow">
            <span className="cn">舐</span> LOLLIPOP SHAPED PARTY SUPPLEMENTS
          </span>
          <h1>
            <span style={{ color: '#f4ecff', display: 'block' }}>put this</span>
            <span className="pk" style={{ display: 'block' }}>in your mouth.</span>
            <span className="respect" style={{ color: 'rgb(155, 237, 255)' }}>respectfully</span>
          </h1>
          <p className="sub">
            <span className="em">here to make you more kissable.</span>{' '}
            <span className="sub-hl">
              &lt;1g of sugar · vegan · ~35 cal · jambu (the buzz-button flower — wakes the palate, increases salivation) + theobromine + b12 + magnesium glycinate + taurine + electrolytes + a flavor-specific adaptogen (ginseng/spirulina, ashwagandha, maca + cinnamon, or L-theanine + chamomile) · xylitol-sweetened (tooth-friendly) · edible mica glitter swirled inside.
            </span>
          </p>
          <p className="sub" style={{ marginTop: '0.6rem', opacity: 0.78 }}>
            <span className="em">heads up · v1.</span>{' '}
            this is the first version we&apos;re shipping — first batch of {launchProduct?.in_stock ?? 200}, made small.
            we&apos;re already tuning the next one. tell us what hits and what doesn&apos;t.
          </p>
          <div className="hero-ctas">
            <a href="#shop" className="hero-cta-primary">SHOP NOW · FROM $5</a>
          </div>
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

      {/* ===== ZONE 2 · COMEDOWN / CHECKOUT ===== */}
      <section className="z6" id="shop" data-screen-label="02 Comedown">
        <div className="copy">
          <div className="copy-left">
            <span className="lab">02 · COMEDOWN</span>
            <h2>
              TAKE
              <br />
              <span className="lm">ONE.</span>
            </h2>
          </div>
          <div className="copy-right">
            <span className="lab" style={{ borderColor: 'var(--lemon)', color: 'var(--lemon)' }}>
              SHIPS FROM SALT LAKE · DOMESTIC FIRST
            </span>
          </div>
        </div>

        <div className="boxes">
          <div className="img-foot">
            <span className="ig-handle">@the.kiwi.pop · the lineup</span>
            <p className="quote">
              made by hand in salt lake city. <span className="em">drop 001 · live now.</span>
            </p>
            <span className="who">— DROP 001 · KIWI POP · LIVE NOW</span>
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
                const selected = kind === 'flavor' && flavorSku === flavor.sku;
                return (
                  <button
                    key={flavor.sku}
                    type="button"
                    className={`flav-opt${selected ? ' on' : ''}`}
                    onClick={() => flavor.product && handleSelectFlavor(flavor.sku)}
                    disabled={disabled}
                    aria-label={`select ${flavor.pickerLabel} flavor`}
                    style={{
                      borderLeftColor: selected ? FLAVOR_DOT_COLOR[flavor.sku] : undefined,
                    }}
                    aria-pressed={selected}
                    title={flavor.status === 'soon' ? 'preorder' : 'in stock'}
                  >
                    {flavor.pickerLabel}
                  </button>
                );
              })}
              {/* 5th option: variety. Selecting it swaps the pack-size row
                  to the variety tiers (8 / 20 / 40) and the take-one button
                  pushes the variety SKU into the cart instead of a flavor. */}
              <button
                key="variety"
                type="button"
                className={`flav-opt${kind === 'variety' ? ' on' : ''}`}
                onClick={handleSelectVariety}
                aria-label="select variety pack"
                aria-pressed={kind === 'variety'}
                title="all four flavors, equal counts"
                style={{
                  borderLeftColor:
                    kind === 'variety' ? 'var(--lemon, #f5ff3d)' : undefined,
                }}
              >
                variety
              </button>
            </div>

            <div className="row">
              <span className="label">PACK SIZE</span>
              <span className="label">
                <span className="kw">
                  {kind === 'variety'
                    ? '8 FOR $30 · 20 FOR $60 · 40 FOR $100 · PREORDER'
                    : '$5 SINGLE · 6 FOR $25 · 20 FOR $60'}
                </span>
              </span>
            </div>
            <div className="pack-pick">
              {(kind === 'variety' ? products.variety : PACKS).map((tier) => (
                <button
                  key={tier.size}
                  type="button"
                  className={`pack-opt${packSize === tier.size ? ' on' : ''}`}
                  onClick={() => setPackSize(tier.size)}
                  aria-pressed={packSize === tier.size}
                  aria-label={`select ${tier.label} (${tier.size} pops, ${formatCentsToUSD(tier.priceCents)})`}
                  title={
                    kind === 'variety' && 'perFlavor' in tier
                      ? `${tier.perFlavor} of each flavor`
                      : undefined
                  }
                >
                  <span className="sz">{tier.size}×</span>
                  <span className="pp">{tier.label.toUpperCase()}</span>
                  <span className="pp">{formatCentsToUSD(tier.priceCents)}</span>
                </button>
              ))}
            </div>

            <div className="row">
              <span className="label">
                {activeTier ? activeTier.label.toUpperCase() : 'PACK'}
                {activeTier?.badge ? ` · ${activeTier.badge.toUpperCase()}` : ''}
              </span>
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
                {activeTier?.badge ? (
                  <span className="save">{activeTier.badge.toUpperCase()}</span>
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
              <span className="item"><span className="dot" />THEOBROMINE + ADAPTOGEN</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ZONE 2.5 · FOUNDERS / STORY ===== */}
      <section className="zvid" id="founders" data-screen-label="02b Founders">
        <div className="zvid-head">
          <span className="zvid-eyebrow">// founders</span>
          <h2 className="zvid-title">
            A story unfolding.
            <br />
            <span className="zvid-grad">Meet our founders.</span>
          </h2>
        </div>
        <div className="zvid-feature">
          <ReelPlayer src="/videos/kp-reel-1.mp4" label="FIRST VIRAL KP REEL" />
          <div className="zvid-copy">
            <span className="zvid-copy-tag">// the one that did it</span>
            <h3 className="zvid-copy-h">
              this is how
              <br />
              <span className="zvid-grad">it started.</span>
            </h3>
            <p>
              one little reel, zero plan, and then the internet absolutely lost it. we did NOT see this coming —
              but we&apos;re running with it full speed.
            </p>
            <p className="zvid-copy-cta">
              tap play, flip the sound on, scrub around. check it out →
            </p>
          </div>
        </div>

        <div className="zvid-feature is-reversed">
          <div className="zvid-placeholder" aria-label="founder reel placeholder">
            <span>Coming soon</span>
          </div>
          <div className="zvid-copy">
            <span className="zvid-copy-tag">// cofounder · tennyson</span>
            <h3 className="zvid-copy-h">
              Is my wizard
              <br />
              <span className="zvid-grad">friend AI?</span>
            </h3>
            <p>
              nope — just my cofounder Tennyson.
            </p>
          </div>
        </div>
      </section>

      <FundraiserBar snapshot={fundraiser} />

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
            <span className="kw">SHARED FUNCTIONAL BASE</span>
            <br />
            ADAPTOGEN TUNED PER FLAVOR
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
                <div className="img">
                  {/* CSS-bg → <Image> swap. The .img class keeps
                      position: absolute / inset: 0 / saturate filter,
                      and Image fills it with object-fit: cover. */}
                  <Image
                    src={FLAVOR_IMG[flavor.sku] ?? '/landing/img/lips-lollipop.jpg'}
                    alt={`${flavor.name} kiwi pop flavor — ${flavor.flavor}`}
                    fill
                    sizes="(max-width: 768px) 80vw, 25vw"
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                  />
                </div>
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
                    <span className="mg">+ {flavor.adaptogen} · {flavor.direction}</span>
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
          {/* This was an h1; demoted to h2 because the homepage already
              has a true h1 in the arrival hero. One h1 per page is the
              SEO rule, plus the section is semantically a sub-heading. */}
          <h2 className="mega">
            UNTIL
            <br />
            <span className="lm">SUNRISE.</span>
          </h2>
          <p className="quote">
            gum and mints just don&apos;t hit the way they used to. <span className="em">a little secret</span> in your mouth — about 35 calories, &lt;1g of sugar, edible mica glitter that catches the light at the lick, and a small electric tingle from the jambu flower.
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
            every functional doing real work, doses on the wrapper.{' '}
            <span className="em">measured by gram · not by vibe.</span>
            <br />
            <span style={{ display: 'inline-block', marginTop: '0.5rem', opacity: 0.85 }}>
              the headline is jambu — a brazilian flower used in cocktails and oral-care for the way it lights up the mouth. sources cited on the{' '}
              <Link href="/research" style={{ color: 'var(--lime)' }}>
                research page
              </Link>
              .
            </span>
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
          <div className="item"><span className="dot" />MFD SALT LAKE</div>
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
        </div>

        <div className="grid">
          {approvedReviews.length === 0 ? (
            <div className="rev highlight">
              <div className="head-row">
                <span className="stars-sm">✦ ✧ ☆</span>
                <span className="verified">SOON</span>
              </div>
              <blockquote>
                real reviews from real humans land here once drop 001 reaches you. yours could be the first one we read out loud at the warehouse.
              </blockquote>
              <div className="who">
                <span className="nm">YOUR VOICE</span>
                <span className="meta">
                  COMING SOON
                  <br />
                  <span className="kw">DROP 001</span>
                </span>
              </div>
            </div>
          ) : (
            approvedReviews.map((r) => {
              const filled = '★'.repeat(Math.max(0, Math.min(5, r.rating)));
              const empty = '☆'.repeat(5 - Math.max(0, Math.min(5, r.rating)));
              return (
                <div key={r.id} className="rev">
                  <div className="head-row">
                    <span className="stars-sm">{filled}{empty}</span>
                    <span className="verified">VERIFIED</span>
                  </div>
                  <blockquote>{r.body}</blockquote>
                  <div className="who">
                    <span className="nm">{r.display_name}</span>
                    <span className="meta">
                      KIWI POP
                      <br />
                      <span className="kw">DROP 001</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}

          <button
            type="button"
            className="rev leave"
            onClick={() => setReviewModalOpen(true)}
            aria-label="leave a review"
          >
            <span className="nm">
              leave a <span className="it">review.</span>
            </span>
            <span className="sub">
              tell us what you actually thought —{' '}
              <span className="pk">we&apos;ll read every one.</span>
            </span>
            <span className="arr">drop a review →</span>
          </button>

          <div className="rev signup">
            <div className="head-row">
              <span className="stars-sm">✦ ✧ ☆</span>
              <span className="verified" style={{ color: 'var(--lemon)' }}>JOIN</span>
            </div>
            <blockquote>
              <span className="em">get on the list.</span> first to know when a new flavor drops, when we hit a festival, when there&apos;s anything worth a tap.
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
              <button
                type="submit"
                disabled={signupStatus === 'sending' || signupStatus === 'ok'}
                aria-label="join the kiwi pop email list"
              >
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
          <span className="item"><span className="dot" />TAG <span className="kw">@THE.KIWI.POP</span> + #POPOFF TO GET FEATURED</span>
          <span className="item">SOURCED FROM TIKTOK · INSTAGRAM · DMS</span>
          <span className="item">REAL REVIEWS WHEN DROP 001 SHIPS</span>
          <span className="item"><Link href="/about" className="kw">FOUNDER VOICE →</Link></span>
        </div>
      </section>

      {/* ===== ZONE 5.6 · INSTAGRAM ===== */}
      <section className="zig" id="instagram" data-screen-label="05c Instagram">
        <div className="zig-head">
          <span className="zig-eyebrow">// instagram · live feed</span>
          <h2 className="zig-title">
            FOLLOW ON
            <br />
            <span className="zig-grad">INSTAGRAM.</span>
          </h2>
          <p className="zig-lede">
            posts · stills · drop announcements · festival activations.{' '}
            <span className="zig-em">@the.kiwi.pop</span> on instagram. tag{' '}
            <span className="zig-em">#popoff</span> to get featured here when
            we ship.
          </p>
        </div>

        <a
          className="zig-cta"
          href="https://www.instagram.com/the.kiwi.pop/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="follow @the.kiwi.pop on instagram"
        >
          <svg
            className="zig-ig-mark"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
          </svg>
          <span className="zig-handle">@the.kiwi.pop</span>
          <span className="zig-arrow" aria-hidden="true">→</span>
        </a>

        <div className="zig-grid" role="list">
          {[
            'KIWI · DROP 001',
            'BEHIND THE BATCH',
            'FESTIVAL POP-UP',
            'POP × LIPS',
            'GLITTER MICA · MACRO',
            '03:47 AM · SUNRISE',
          ].map((label, idx) => (
            <a
              key={label}
              className={`zig-tile zig-tile-${idx % 4}`}
              href="https://www.instagram.com/the.kiwi.pop/"
              target="_blank"
              rel="noopener noreferrer"
              role="listitem"
              aria-label={`${label} — open @the.kiwi.pop`}
            >
              <span className="zig-tile-label">{label}</span>
              <span className="zig-tile-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </section>

      <RaffleForm />

      {/* ===== ZONE 7 · FAQ ===== */}
      <section
        className="zfaq"
        id="faq"
        data-screen-label="07 FAQ"
        style={{
          padding: 'clamp(48px, 8vw, 96px) clamp(20px, 5vw, 64px)',
          background: 'var(--ink, #0a0014)',
          color: 'var(--bone, #f4ecff)',
          fontFamily: 'var(--mono)',
        }}
      >
        <JsonLd data={FAQ_LD} />
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <span
            className="lab"
            style={{ display: 'inline-block', marginBottom: 16 }}
          >
            07 · FAQ
          </span>
          <h2
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 800,
              fontSize: 'clamp(2.2rem, 6vw, 4rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              textTransform: 'lowercase',
              marginBottom: '1.5rem',
            }}
          >
            asked &amp;
            <br />
            <span style={{ color: 'var(--lemon, #f5ff3d)' }}>answered.</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
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
                    fontSize: 15,
                    letterSpacing: '0.02em',
                    listStyle: 'none',
                    color: 'var(--paper, #f4ecff)',
                  }}
                >
                  {item.q}
                </summary>
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: 'var(--bone, #c8c0db)',
                  }}
                >
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="kp-foot">
        <div className="col">
          <div className="brand-foot">
            <img
              src="/landing/img/kiwi-kitty-pop.webp"
              alt=""
              className="kp-mark"
              aria-hidden="true"
              style={{ width: 36, height: 36 }}
            />
            <div className="nm">KIWI<span className="pk">.</span>POP</div>
          </div>
          <p>
            made small in salt lake, dosed for the dance floor. shipping since {new Date().getFullYear()}.
            {launchProduct ? <> drop 001 · {launchProduct.in_stock} kiwi pop in stock.</> : null}
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
        </div>
        <div className="col">
          <h4>BRAND</h4>
          <a href="#inside">what&apos;s inside</a>
          <Link href="/about">a little secret</Link>
          <Link href="/find-us">find us irl</Link>
          <Link href="/wholesale">wholesale</Link>
          <Link href="/faq">faq</Link>
          <Link href="/research">research</Link>
          <Link href="/donate">donate</Link>
        </div>
        <div className="col">
          <h4>CONTACT</h4>
          <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a>
        </div>
        <div className="col">
          <h4>LEGAL</h4>
          <Link href="/legal/fda-disclaimer">fda + safety</Link>
          <Link href="/legal/terms">terms</Link>
          <Link href="/legal/privacy">privacy</Link>
          <Link href="/legal/shipping">shipping</Link>
          <Link href="/legal/refund">refunds</Link>
          <Link href="/legal/accessibility">accessibility</Link>
        </div>
        <div className="legal">
          <span className="kw">⚠</span> THESE STATEMENTS HAVE NOT BEEN EVALUATED BY THE FDA. THIS PRODUCT IS NOT INTENDED TO DIAGNOSE, TREAT, CURE, OR PREVENT ANY DISEASE. NOT FOR USE BY PERSONS UNDER 18. PREGNANT OR NURSING PERSONS SHOULD CONSULT A HEALTHCARE PROFESSIONAL BEFORE USE. CONTAINS JAMBU (ACMELLA OLERACEA), THEOBROMINE, B12, MAGNESIUM GLYCINATE, TAURINE, ELECTROLYTES, EDIBLE MICA + A PER-FLAVOR ADAPTOGEN (GINSENG/SPIRULINA, ASHWAGANDHA, MACA/CINNAMON, OR L-THEANINE/CHAMOMILE). SUGAR ALCOHOLS (ISOMALT, XYLITOL) MAY CAUSE GI UPSET IN LARGE QUANTITIES. <strong>XYLITOL IS TOXIC TO DOGS — KEEP AWAY FROM PETS.</strong> CALIFORNIA RESIDENTS: SEE PROP 65 NOTICE ON THE <Link href="/legal/fda-disclaimer" className="kw">FDA + SAFETY</Link> PAGE.
          <br />
          <br />© KIWI POP&trade; · {new Date().getFullYear()} · DROP 001 · MFD SALT LAKE · ALL RIGHTS RESERVED · <span className="kw">舐 一下</span>
        </div>
      </footer>

      <ReviewSubmitModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
      />
    </div>
  );
}
