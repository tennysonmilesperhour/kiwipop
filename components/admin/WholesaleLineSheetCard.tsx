'use client';

import { useState } from 'react';

const LINE_SHEET_PATH = '/wholesale/line-sheet';

/**
 * Admin shortcut to the public wholesale line sheet — the shareable, printable
 * brand + pricing one-pager you hand to prospective wholesale clients. Copy the
 * link to drop in an email, or open it to print / save as PDF.
 */
export function WholesaleLineSheetCard(): JSX.Element {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}${LINE_SHEET_PATH}`
      : LINE_SHEET_PATH;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — select-and-copy the visible URL instead.
      window.prompt('Copy the line sheet link:', url);
    }
  };

  return (
    <div
      className="card"
      style={{
        marginBottom: '1.5rem',
        borderColor: 'var(--c-cyan)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div style={{ minWidth: 240 }}>
        <h2 className="card-title" style={{ marginBottom: '0.35rem' }}>
          Wholesale line sheet
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--admin-text-soft)',
            margin: 0,
            maxWidth: 520,
          }}
        >
          Shareable brand + pricing one-pager for prospects. Send the link, or
          open it and use your browser&apos;s &ldquo;Save as PDF.&rdquo; It
          pulls live tier pricing automatically.
        </p>
        <code
          style={{
            display: 'inline-block',
            marginTop: '0.6rem',
            fontSize: 12,
            color: 'var(--c-cyan)',
            wordBreak: 'break-all',
          }}
        >
          {url}
        </code>
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary" onClick={copy}>
          {copied ? 'copied ✓' : 'copy link'}
        </button>
        <a
          href={LINE_SHEET_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ textDecoration: 'none' }}
        >
          open / print →
        </a>
      </div>
    </div>
  );
}
