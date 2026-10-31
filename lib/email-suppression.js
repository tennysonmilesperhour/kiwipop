/**
 * Which emails respect an unsubscribe, kept in plain JS so node --test can
 * check it. Marketing mail stops the moment an address unsubscribes;
 * transactional mail (receipts, wholesale approvals, the owner's sale alert)
 * still goes out, because the customer needs it to complete something they
 * asked for.
 *
 * Unknown types count as marketing, so a new email type is suppressed by
 * default until someone decides it is transactional.
 */

const TRANSACTIONAL_EMAIL_TYPES = Object.freeze([
  'order_confirmation',
  'wholesale_approved',
  'admin_sale_alert',
]);

const MARKETING_EMAIL_TYPES = Object.freeze([
  'welcome',
  'ingredient_deep_dive',
  'first_purchase_push',
  'review_request',
  'abandoned_checkout',
]);

/**
 * @param {string} emailType
 * @returns {boolean}
 */
function isMarketingEmailType(emailType) {
  return !TRANSACTIONAL_EMAIL_TYPES.includes(emailType);
}

/**
 * @param {string} emailType
 * @param {{ unsubscribed_at?: string | null } | null | undefined} signup
 * @returns {boolean} true when this email must not be sent
 */
function shouldSuppressEmail(emailType, signup) {
  if (!isMarketingEmailType(emailType)) return false;
  return Boolean(signup && signup.unsubscribed_at);
}

/**
 * What to do with an email given the unsubscribe lookup.
 *   'send'     transactional, or marketing to an address that has not
 *              unsubscribed
 *   'suppress' marketing to an address confirmed unsubscribed; cancel it
 *   'defer'    marketing, but the lookup failed: do not send now, and do
 *              not cancel either, so a transient database error never
 *              drops mail for a subscribed person. Try again next run.
 *
 * @param {string} emailType
 * @param {{ error: true } | { error?: false, signup: { unsubscribed_at?: string | null } | null }} lookup
 * @returns {'send' | 'suppress' | 'defer'}
 */
function suppressionDecision(emailType, lookup) {
  if (!isMarketingEmailType(emailType)) return 'send';
  if (lookup.error) return 'defer';
  return shouldSuppressEmail(emailType, lookup.signup) ? 'suppress' : 'send';
}

module.exports = {
  suppressionDecision,
  TRANSACTIONAL_EMAIL_TYPES,
  MARKETING_EMAIL_TYPES,
  isMarketingEmailType,
  shouldSuppressEmail,
};
