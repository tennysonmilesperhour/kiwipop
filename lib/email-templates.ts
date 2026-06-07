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
      <p>kiwi pop is a <span class="highlight">lollipop-shaped party supplement</span>:
      jambu (the brazilian buzz-button flower, for an electric mouth tingle on the first lick),
      theobromine, B12, magnesium glycinate, taurine, electrolytes, edible mica glitter,
      and a flavor-specific adaptogen (ginseng + spirulina in kiwi, ashwagandha in lemon ginger,
      maca + cinnamon in caramel apple, L-theanine + chamomile in mint).
      less than 1g of sugar. vegan. ~35 calories. made in small batches in salt lake city.</p>
      <p>jambu is the same flower bartenders use for the &ldquo;electric daisy&rdquo; tingle in
      cocktails, and it&rsquo;s been studied for its effect on saliva flow and oral sensation, and
      it&rsquo;s been in the human food supply for centuries. sources cited on
      <a href="https://www.kiwipop.fun/research">kiwipop.fun/research</a>.</p>
      <p>we don't do spam. you'll hear from us when something actually matters:
      new flavors, drops, events, and the occasional secret.</p>
      <a href="https://www.kiwipop.fun" class="cta">shop now →</a>
      <div class="fact">
        <strong>use code WELCOME10</strong> for 10% off your first order.
      </div>
    `),
    text: `welcome to the club.

you just joined something small and weird and kind of beautiful.

kiwi pop is a lollipop-shaped party supplement: jambu (the brazilian buzz-button flower, for an electric mouth tingle on the first lick), theobromine, B12, magnesium glycinate, taurine, electrolytes, edible mica glitter, and a flavor-specific adaptogen (ginseng + spirulina in kiwi, ashwagandha in lemon ginger, maca + cinnamon in caramel apple, L-theanine + chamomile in mint). less than 1g of sugar. vegan. ~35 calories. made in small batches in salt lake city.

jambu is the same flower bartenders use for the "electric daisy" tingle in cocktails, and it's been studied for its effect on saliva flow and oral sensation, and it's been in the human food supply for centuries. sources cited at https://www.kiwipop.fun/research.

we don't do spam. you'll hear from us when something actually matters: new flavors, drops, events, and the occasional secret.

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
      
      <p><span class="highlight">the shared functional base, same dose in every flavor:</span></p>
      <ul>
        <li><strong>jambu</strong>: the spark. brazilian flower (acmella oleracea), also called the buzz button. wakes the palate, increases saliva flow, and produces the distinctive electric mouth tingle on the first lick. food-flavor amount, not a supplement dose; reviewed by EFSA.</li>
        <li><strong>theobromine</strong>: the gentle lift. it's what makes chocolate feel good, smooth energy without the jitters of caffeine.</li>
        <li><strong>B12</strong>: the essentials. methylcobalamin form. keeps your energy metabolism running.</li>
        <li><strong>magnesium glycinate</strong>: the one you're probably deficient in. helps with muscle relaxation, sleep, mood. glycinate form for absorption.</li>
        <li><strong>taurine</strong>: the amino acid. supports cardiovascular function and helps regulate electrolytes.</li>
        <li><strong>electrolytes</strong>: sodium + potassium blend. you sweat, we replace.</li>
      </ul>
      <p><span class="highlight">+ a flavor-specific adaptogen, tuned to direction:</span></p>
      <ul>
        <li><strong>kiwi pop</strong>: ginseng + spirulina. balanced, all-purpose.</li>
        <li><strong>luci ginger lemon</strong>: ashwagandha. calm-warming; pairs with ginger.</li>
        <li><strong>mary caramel apple cinn</strong>: maca + cinnamon. grounded energy; reinforces caramel.</li>
        <li><strong>molly matcha mint</strong>: L-theanine + chamomile. calm-focus; clean alongside mint.</li>
      </ul>
      
      <div class="fact">
        <strong>the base:</strong> isomalt (sugar alcohol), sweetened with monk fruit + xylitol. edible mica glitter swirled through the middle. that's the shimmer.
      </div>
      
      <p>less than 1g sugar. ~35 calories. vegan. no artificial colors. no corn syrup. no bs.</p>
      
      <a href="https://www.kiwipop.fun" class="cta">try one →</a>
    `),
    text: `what's actually in your mouth.

you signed up a couple days ago. here's the part where most brands would send you a coupon. instead, here's what we put in the pop and why.

the shared functional base, same dose in every flavor:

• jambu: the spark. brazilian flower (acmella oleracea), also called the buzz button. wakes the palate, increases saliva flow, and produces the distinctive electric mouth tingle on the first lick. food-flavor amount, not a supplement dose; reviewed by EFSA.
• theobromine: the gentle lift. it's what makes chocolate feel good, smooth energy without the jitters of caffeine.
• B12: methylcobalamin form. keeps your energy metabolism running.
• magnesium glycinate: helps with muscle relaxation, sleep, mood. glycinate form for absorption.
• taurine: supports cardiovascular function and electrolyte regulation.
• electrolytes: sodium + potassium blend. you sweat, we replace.

+ a flavor-specific adaptogen, tuned to direction:

• kiwi pop: ginseng + spirulina. balanced, all-purpose.
• luci ginger lemon: ashwagandha. calm-warming; pairs with ginger.
• mary caramel apple cinn: maca + cinnamon. grounded energy; reinforces caramel.
• molly matcha mint: L-theanine + chamomile. calm-focus; clean alongside mint.

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
    .map((item) => `  ${item.name} ×${item.quantity} · $${(item.priceCents / 100).toFixed(2)}`)
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

export function reviewRequestEmail(_params: {
  orderId: string;
}): { subject: string; html: string; text: string } {
  return {
    subject: 'tell us how cool you think this is · kiwi pop',
    html: layout(`
      <h1>so… how cool is it?</h1>
      <p>by now your kiwi pops should've been with you for about a week. long enough to crack one open at a party, sneak one between meetings, hand one to someone you love.</p>
      <p>we'd love to hear what you think. genuinely. we're a tiny crew making these by hand in salt lake city, and this whole thing is as much yours as it is ours. every note you send back shapes the next batch, the next flavor, the next drop.</p>

      <a href="https://www.kiwipop.fun/#reviews" class="cta">rate kiwi pop →</a>

      <p style="margin-top: 24px;">we are <em>so excited</em> to read what you have to say. tell us what hit, what missed, what you want next. we love you for being here this early, and we want to know how cool you think all of this is.</p>

      <p>or just reply to this email. it goes straight to the founder.</p>

      <div class="fact">
        <strong>this is ours together.</strong> if there's a flavor you wish existed, a packaging tweak that'd make it perfect, a friend who needs one, tell us. we're listening.
      </div>
    `),
    text: `so… how cool is it?

by now your kiwi pops should've been with you for about a week. long enough to crack one open at a party, sneak one between meetings, hand one to someone you love.

we'd love to hear what you think. genuinely. we're a tiny crew making these by hand in salt lake city, and this whole thing is as much yours as it is ours. every note you send back shapes the next batch, the next flavor, the next drop.

rate kiwi pop → https://www.kiwipop.fun/#reviews

we are so excited to read what you have to say. tell us what hit, what missed, what you want next. we love you for being here this early, and we want to know how cool you think all of this is.

or just reply to this email. it goes straight to the founder.

this is ours together. if there's a flavor you wish existed, a packaging tweak that'd make it perfect, a friend who needs one, tell us. we're listening.

---
kiwi pop · salt lake city, ut · kiwipop.fun`,
  };
}
