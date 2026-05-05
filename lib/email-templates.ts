import 'server-only';

/* =========================================================
   KIWI POP — Transactional & drip email templates
   =========================================================
   All emails use the same base layout. Brand colors and voice
   match the site — dark bg, neon accents, lowercase copy.
   ========================================================= */

// ---- layout wrapper ----

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>kiwi pop</title>
<style>
  body { margin: 0; padding: 0; background: #050510; color: #f4f0e8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
  .logo { font-size: 22px; font-weight: 800; letter-spacing: 0.04em; color: #a8ff3c; margin-bottom: 32px; }
  h1 { font-size: 26px; font-weight: 800; line-height: 1.2; margin: 0 0 16px; color: #f4f0e8; }
  p { margin: 0 0 14px; color: #d8d2c4; }
  .highlight { color: #a8ff3c; font-weight: 600; }
  .cta { display: inline-block; margin: 24px 0; padding: 14px 36px; background: #a8ff3c; color: #050510; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; text-decoration: none; border-radius: 4px; }
  .cta:hover { background: #c2ff6e; }
  .divider { border: none; border-top: 1px solid rgba(244,240,232,0.12); margin: 32px 0; }
  .footer { font-size: 12px; color: #877a9e; margin-top: 40px; }
  .footer a { color: #877a9e; text-decoration: underline; }
  .fact { background: rgba(168,255,60,0.08); border-left: 3px solid #a8ff3c; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #d8d2c4; }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; color: #d8d2c4; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="logo">kiwi pop ·</div>
  ${body}
  <hr class="divider" />
  <div class="footer">
    <p>kiwi pop · salt lake city, ut · <a href="https://www.kiwipop.fun">kiwipop.fun</a></p>
    <p><a href="https://www.instagram.com/the.kiwi.pop/">instagram</a></p>
    <p style="margin-top: 12px; font-size: 11px;">you're getting this because you signed up at kiwipop.fun. if this wasn't you, just ignore this email.</p>
  </div>
</div>
</body>
</html>`;
}

// ---- templates ----

export function welcomeEmail(email: string): { subject: string; html: string; text: string } {
  return {
    subject: 'welcome to the club · kiwi pop',
    html: layout(`
      <h1>welcome to the club.</h1>
      <p>you just joined something small and weird and kind of beautiful.</p>
      <p>kiwi pop is a <span class="highlight">lollipop-shaped party supplement</span> — 
      750mg kava, theobromine, ginseng, B12, magnesium, taurine, and edible mica glitter. 
      less than 1g of sugar. vegan. ~35 calories. made in small batches in salt lake city.</p>
      <p>we don't do spam. you'll hear from us when something actually matters — 
      new flavors, drops, events, and the occasional secret.</p>
      <a href="https://www.kiwipop.fun" class="cta">shop now →</a>
      <div class="fact">
        <strong>use code WELCOME10</strong> for 10% off your first order.
      </div>
    `),
    text: `welcome to the club.

you just joined something small and weird and kind of beautiful.

kiwi pop is a lollipop-shaped party supplement — 750mg kava, theobromine, ginseng, B12, magnesium, taurine, and edible mica glitter. less than 1g of sugar. vegan. ~35 calories. made in small batches in salt lake city.

we don't do spam. you'll hear from us when something actually matters — new flavors, drops, events, and the occasional secret.

shop now → https://www.kiwipop.fun

use code WELCOME10 for 10% off your first order.

---
kiwi pop · salt lake city, ut · kiwipop.fun
instagram: https://www.instagram.com/the.kiwi.pop/`,
  };
}

export function ingredientDeepDiveEmail(): { subject: string; html: string; text: string } {
  return {
    subject: "what's actually in your mouth · kiwi pop",
    html: layout(`
      <h1>what's actually in your mouth.</h1>
      <p>you signed up a couple days ago. here's the part where most brands would send you a coupon. instead, here's what we put in the pop and why.</p>
      
      <p><span class="highlight">the functional payload — 6 ingredients per pop:</span></p>
      <ul>
        <li><strong>kava (750mg)</strong> — the calm. extracted from the root of piper methysticum. pacific islanders have been drinking it for thousands of years. we put it in candy.</li>
        <li><strong>theobromine</strong> — the gentle lift. it's what makes chocolate feel good — smooth energy without the jitters of caffeine.</li>
        <li><strong>ginseng</strong> — the ancient one. adaptogen that helps your body deal with stress. pairs with kava like a dream.</li>
        <li><strong>B12</strong> — the essentials. methylcobalamin form. keeps your energy metabolism running.</li>
        <li><strong>magnesium</strong> — the one you're probably deficient in. helps with muscle relaxation, sleep, mood. we use magnesium citrate.</li>
        <li><strong>taurine</strong> — the amino acid. supports cardiovascular function and helps regulate electrolytes.</li>
      </ul>
      
      <div class="fact">
        <strong>the base:</strong> isomalt (sugar alcohol), sweetened with monk fruit + xylitol. edible mica glitter swirled through the middle. that's the shimmer.
      </div>
      
      <p>less than 1g sugar. ~35 calories. vegan. no artificial colors. no corn syrup. no bs.</p>
      
      <a href="https://www.kiwipop.fun" class="cta">try one →</a>
    `),
    text: `what's actually in your mouth.

you signed up a couple days ago. here's the part where most brands would send you a coupon. instead, here's what we put in the pop and why.

the functional payload — 6 ingredients per pop:

• kava (750mg) — the calm. extracted from the root of piper methysticum. pacific islanders have been drinking it for thousands of years. we put it in candy.
• theobromine — the gentle lift. it's what makes chocolate feel good — smooth energy without the jitters of caffeine.
• ginseng — the ancient one. adaptogen that helps your body deal with stress.
• B12 — methylcobalamin form. keeps your energy metabolism running.
• magnesium — helps with muscle relaxation, sleep, mood. magnesium citrate.
• taurine — supports cardiovascular function and electrolyte regulation.

the base: isomalt (sugar alcohol), sweetened with monk fruit + xylitol. edible mica glitter swirled through the middle.

less than 1g sugar. ~35 calories. vegan. no artificial colors. no corn syrup. no bs.

try one → https://www.kiwipop.fun

---
kiwi pop · salt lake city, ut · kiwipop.fun`,
  };
}

export function firstPurchasePushEmail(): { subject: string; html: string; text: string } {
  return {
    subject: 'your move · kiwi pop',
    html: layout(`
      <h1>your move.</h1>
      <p>we've been talking for a few days now. you know what's in the pop. you know why it exists.</p>
      <p>here's the deal:</p>
      <ul>
        <li><span class="highlight">$5</span> for a single pop</li>
        <li><span class="highlight">$25</span> for a 6-pack</li>
        <li><span class="highlight">$60</span> for the 20-pack party pack</li>
        <li>free shipping on orders over $40</li>
      </ul>
      <p>your <strong>WELCOME10</strong> code is still active. 10% off your first order.</p>
      <a href="https://www.kiwipop.fun" class="cta">take one →</a>
      <p style="font-size: 13px; color: #877a9e; margin-top: 24px;">this is the last email in the welcome series. from here you'll only hear about new flavors and drops. no spam. promise.</p>
    `),
    text: `your move.

we've been talking for a few days now. you know what's in the pop. you know why it exists.

here's the deal:
• $5 for a single pop
• $25 for a 6-pack
• $60 for the 20-pack party pack
• free shipping on orders over $40

your WELCOME10 code is still active. 10% off your first order.

take one → https://www.kiwipop.fun

this is the last email in the welcome series. from here you'll only hear about new flavors and drops. no spam. promise.

---
kiwi pop · salt lake city, ut · kiwipop.fun`,
  };
}

export function orderConfirmationEmail(params: {
  orderId: string;
  email: string;
  totalCents: number;
  items: Array<{ name: string; quantity: number; priceCents: number }>;
}): { subject: string; html: string; text: string } {
  const total = (params.totalCents / 100).toFixed(2);
  const itemRows = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 0; color: #d8d2c4; border-bottom: 1px solid rgba(244,240,232,0.06);">${item.name}</td>
          <td style="padding: 8px 0; color: #d8d2c4; text-align: center; border-bottom: 1px solid rgba(244,240,232,0.06);">×${item.quantity}</td>
          <td style="padding: 8px 0; color: #a8ff3c; text-align: right; border-bottom: 1px solid rgba(244,240,232,0.06);">$${(item.priceCents / 100).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const itemsText = params.items
    .map((item) => `  ${item.name} ×${item.quantity} — $${(item.priceCents / 100).toFixed(2)}`)
    .join('\n');

  return {
    subject: `order confirmed · #${params.orderId.slice(0, 8)} · kiwi pop`,
    html: layout(`
      <h1>it's yours.</h1>
      <p>order <span class="highlight">#${params.orderId.slice(0, 8)}</span> is confirmed. we're getting it ready.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px 0; color: #877a9e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid rgba(244,240,232,0.12);">item</th>
            <th style="text-align: center; padding: 8px 0; color: #877a9e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid rgba(244,240,232,0.12);">qty</th>
            <th style="text-align: right; padding: 8px 0; color: #877a9e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid rgba(244,240,232,0.12);">price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 12px 0; color: #f4f0e8; font-weight: 700;">total</td>
            <td style="padding: 12px 0; color: #a8ff3c; font-weight: 700; text-align: right;">$${total}</td>
          </tr>
        </tfoot>
      </table>
      
      <p>you'll get a shipping confirmation with tracking once it's on its way. most orders ship within 1–3 business days.</p>
      
      <div class="fact">
        <strong>tip:</strong> kiwi pop tastes best when you're about to do something fun. save it for the right moment.
      </div>
      
      <a href="https://www.kiwipop.fun" class="cta">back to shop →</a>
    `),
    text: `it's yours.

order #${params.orderId.slice(0, 8)} is confirmed. we're getting it ready.

${itemsText}

total: $${total}

you'll get a shipping confirmation with tracking once it's on its way. most orders ship within 1-3 business days.

tip: kiwi pop tastes best when you're about to do something fun. save it for the right moment.

---
kiwi pop · salt lake city, ut · kiwipop.fun`,
  };
}

export function reviewRequestEmail(params: {
  orderId: string;
}): { subject: string; html: string; text: string } {
  return {
    subject: 'how was it? · kiwi pop',
    html: layout(`
      <h1>how was it?</h1>
      <p>your order from a few days ago — did it hit?</p>
      <p>we're a tiny brand making these by hand in salt lake city. every review, every share, every DM actually matters to us. if you liked it, tell someone. if you didn't, tell us.</p>
      
      <a href="https://www.instagram.com/the.kiwi.pop/" class="cta">tell us on IG →</a>
      
      <p style="margin-top: 24px;">or just reply to this email. it goes straight to the founder.</p>
      
      <div class="fact">
        <strong>share the vibe:</strong> if you have friends who'd be into this, send them to <a href="https://www.kiwipop.fun" style="color: #a8ff3c;">kiwipop.fun</a>. word of mouth is everything for us right now.
      </div>
    `),
    text: `how was it?

your order from a few days ago — did it hit?

we're a tiny brand making these by hand in salt lake city. every review, every share, every DM actually matters to us. if you liked it, tell someone. if you didn't, tell us.

tell us on IG → https://www.instagram.com/the.kiwi.pop/

or just reply to this email. it goes straight to the founder.

share the vibe: if you have friends who'd be into this, send them to kiwipop.fun. word of mouth is everything for us right now.

---
kiwi pop · salt lake city, ut · kiwipop.fun`,
  };
}
