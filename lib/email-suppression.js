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

module.exports = {
  TRANSACTIONAL_EMAIL_TYPES,
  MARKETING_EMAIL_TYPES,
  isMarketingEmailType,
  shouldSuppressEmail,
};
