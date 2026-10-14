/**
 * Product-page document titles and the homepage meta description.
 *
 * The root layout title template is `%s · kiwi pop`. Product names often
 * already start with the brand ("Kiwi Pop · 6-pack"), which would otherwise
 * render as "kiwi pop · 6-pack · kiwi pop".
 */

const BRAND = 'kiwi pop';

/**
 * Homepage `<meta name="description">`. Built only from wording already on
 * the site (layout description, homepage "~35 cal", and the existing
 * "candy for people who don't eat candy" line). 150–160 characters.
 */
const HOME_META_DESCRIPTION =
  "lollipop shaped party supplements. <1g of sugar, vegan, ~35 cal, xylitol-sweetened lollipops with edible mica glitter. candy for people who don't eat candy.";

const SEPARATOR = '(?:\\s*[·|\\-–—:]\\s*|\\s+)';

/**
 * Product name with a leading or trailing brand token removed.
 * Empty when the name is only the brand.
 *
 * @param {string | null | undefined} name
 * @returns {string}
 */
function brandlessProductTitle(name) {
  let segment = String(name ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const leading = new RegExp(`^${BRAND}${SEPARATOR}`, 'i');
  const trailing = new RegExp(`${SEPARATOR}${BRAND}$`, 'i');

  let previous = null;
  while (segment && segment !== previous) {
    previous = segment;
    segment = segment.replace(leading, '').replace(trailing, '').trim();
  }

  if (!segment || segment === BRAND) return '';
  return segment;
}

/**
 * @param {string} name
 * @returns {{
 *   metadataTitle: string | { absolute: string },
 *   socialTitle: string,
 * }}
 */
function productPageTitle(name) {
  const segment = brandlessProductTitle(name);
  if (!segment) {
    return {
      metadataTitle: { absolute: BRAND },
      socialTitle: BRAND,
    };
  }
  return {
    metadataTitle: segment,
    socialTitle: `${segment} · ${BRAND}`,
  };
}

module.exports = {
  BRAND,
  HOME_META_DESCRIPTION,
  brandlessProductTitle,
  productPageTitle,
};
