'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SheetEmbedProps {
  slug: string;
  defaultLabel: string;
  hint?: string;
}

interface AdminSheetRow {
  slug: string;
  label: string;
  embed_url: string;
  height_px: number;
}

interface SheetsResponse {
  sheets?: AdminSheetRow[];
  error?: string;
}

/**
 * Renders a configured Google Sheets embed for the given slug. Fetches the
 * row from /api/admin/sheets at mount; falls back to a "link a sheet" CTA
 * pointing at /admin/sheets if nothing is configured.
 *
 * Pure client component so it slots cleanly into the existing 'use client'
 * admin pages without rewiring them as server components.
 */
export function SheetEmbed({
  slug,
  defaultLabel,
  hint,
}: SheetEmbedProps): JSX.Element {
  const [row, setRow] = useState<AdminSheetRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const response = await fetch('/api/admin/sheets', {
          cache: 'no-store',
        });
        if (!response.ok) {
          if (!cancelled) setRow(null);
          return;
        }
        const json = (await response.json()) as SheetsResponse;
        if (cancelled) return;
        const match = json.sheets?.find((s) => s.slug === slug) ?? null;
        setRow(match);
      } catch {
        if (!cancelled) setRow(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="card sheet-embed sheet-embed--loading">
        <div className="sheet-embed-header">
          <p className="stat-label">// linked sheet · {slug}</p>
        </div>
        <p className="sheet-embed-hint">checking for a linked sheet…</p>
      </section>
    );
  }

  if (!row) {
    return (
      <section className="card sheet-embed sheet-embed--empty">
        <div className="sheet-embed-header">
          <p className="stat-label">// linked sheet · {slug}</p>
          <Link
            href={`/admin/sheets?focus=${encodeURIComponent(slug)}`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: 11 }}
          >
            link a sheet →
          </Link>
        </div>
        <p className="sheet-embed-hint">
          paste a Google Sheets &quot;publish to web&quot; URL on the{' '}
          <Link href="/admin/sheets" style={{ color: 'var(--lime)' }}>
            sheets
          </Link>{' '}
          page and the live spreadsheet shows up here. nothing pinned for{' '}
          <code>{slug}</code> yet.
        </p>
        {hint ? <p className="sheet-embed-hint">{hint}</p> : null}
      </section>
    );
  }

  return (
    <section className="card sheet-embed">
      <div className="sheet-embed-header">
        <p className="stat-label">
          // linked sheet · {row.label || defaultLabel}
        </p>
        <Link
          href={`/admin/sheets?focus=${encodeURIComponent(slug)}`}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: 11 }}
        >
          edit
        </Link>
      </div>
      <iframe
        src={row.embed_url}
        title={`${row.label || defaultLabel} sheet`}
        style={{
          width: '100%',
          height: row.height_px ?? 700,
          border: '1px solid rgba(244, 240, 232, 0.1)',
          background: 'var(--paper)',
        }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        loading="lazy"
      />
    </section>
  );
}
