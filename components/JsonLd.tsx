/**
 * Shared JSON-LD wrapper. Renders a <script type="application/ld+json">
 * tag with the given data. Use one per page-level structured-data block
 * (Organization, WebSite, Product, FAQPage, BreadcrumbList, etc.).
 *
 * Server component by default — never include user-specific data here.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is server-controlled, JSON-stringified, and never
      // user-derived, so dangerouslySetInnerHTML is the right tool here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
