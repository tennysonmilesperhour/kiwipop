'use client';

import Link from 'next/link';

/**
 * Floating action bar on the wholesale line sheet — print / save-as-PDF and a
 * quick link back into the apply flow. Hidden when the sheet is actually
 * printed (via the @media print rule below) so it never lands in the PDF.
 */
export function LineSheetActions(): JSX.Element {
  return (
    <div className="ls-actions">
      <style>{`
        .ls-actions {
          position: fixed;
          right: 20px;
          bottom: 20px;
          display: flex;
          gap: 10px;
          z-index: 50;
        }
        .ls-actions a,
        .ls-actions button {
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 999px;
          border: 1px solid #14121a;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
        }
        .ls-actions button { background: #14121a; color: #fff; }
        .ls-actions a { background: #fff; color: #14121a; }
        @media print { .ls-actions { display: none !important; } }
      `}</style>
      <Link href="/wholesale/apply">Apply →</Link>
      <button type="button" onClick={() => window.print()}>
        Print / Save as PDF
      </button>
    </div>
  );
}
