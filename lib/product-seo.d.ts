export const BRAND: 'kiwi pop';

/** Homepage meta description. Existing site wording, 150–160 characters. */
export const HOME_META_DESCRIPTION: string;

/** Product name with a leading or trailing "kiwi pop" removed. Empty when the name is only the brand. */
export function brandlessProductTitle(name: string | null | undefined): string;

export interface ProductPageTitle {
  /** Next metadata `title`. A string is passed through the `%s · kiwi pop` template. */
  metadataTitle: string | { absolute: string };
  /** Full title for Open Graph and Twitter, which do not use the template. */
  socialTitle: string;
}

export function productPageTitle(name: string): ProductPageTitle;
