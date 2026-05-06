#!/usr/bin/env node
/**
 * Kava state checker
 *
 * Determines whether kava is still in the active product formulation by
 * grepping the canonical product-copy files. When kava has been removed from
 * those files but legal/marketing pages still reference it, this script
 * exits non-zero with a checklist of files that need updating.
 *
 * Used by .github/workflows/kava-policy-sync.yml.
 */
const fs = require('fs');
const path = require('path');

// Canonical product-copy files. If kava is here, we're still selling kava.
const PRODUCT_COPY_FILES = [
  'lib/flavors.ts',
  'components/landing/Landing.tsx',
  'stripe-product-feed.csv',
];

// Files that reference kava and must be updated once kava is removed
// from product copy. The script reports any of these still mentioning
// kava when product copy no longer does.
const POLICY_AND_MARKETING_FILES = [
  'app/(public)/legal/terms/page.tsx',
  'app/(public)/legal/privacy/page.tsx',
  'app/(public)/legal/refund/page.tsx',
  'app/(public)/legal/fda-disclaimer/page.tsx',
  'app/(public)/about/page.tsx',
  'app/layout.tsx',
  'app/opengraph-image.tsx',
  'lib/email-templates.ts',
  'app/(admin)/admin/pitch/page.tsx',
  'README.md',
  'shopify_launch_spec.md',
];

const KAVA_PATTERN = /kava/i;

function fileMentionsKava(relativePath) {
  const full = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(full)) return false;
  const content = fs.readFileSync(full, 'utf8');
  return KAVA_PATTERN.test(content);
}

function main() {
  const productStillHasKava = PRODUCT_COPY_FILES.some(fileMentionsKava);

  if (productStillHasKava) {
    console.log('✓ kava is still in active product copy. no policy sync needed.');
    process.exit(0);
  }

  // Product copy has dropped kava — verify policy/marketing files have too.
  const stalePages = POLICY_AND_MARKETING_FILES.filter(fileMentionsKava);

  if (stalePages.length === 0) {
    console.log('✓ kava has been fully removed across product copy and policy pages.');
    process.exit(0);
  }

  console.error('');
  console.error('⚠ kava removed from product copy but still referenced in policy/marketing files.');
  console.error('');
  console.error('Files still mentioning kava:');
  for (const file of stalePages) {
    console.error(`  - ${file}`);
  }
  console.error('');
  console.error('Replacement ingredient: jambu (Acmella oleracea).');
  console.error('Action: update each file above to remove kava references and (where');
  console.error('appropriate) introduce jambu. Drop the FDA kava advisory section.');
  console.error('Re-evaluate the 18+ age gate — it was previously justified by kava.');
  console.error('');
  process.exit(1);
}

main();
