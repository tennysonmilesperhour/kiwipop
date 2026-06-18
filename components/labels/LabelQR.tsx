'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface LabelQRProps {
  /** The absolute URL the QR encodes (the flavor's label page). */
  url: string;
  /** Flavor name, used in the printable sheet header. */
  flavorName: string;
  /** Brand color for the chrome (QR itself stays black-on-white). */
  accent?: string;
  size?: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Black-on-white QR that points at a flavor's label page, with copy + print
 * helpers so the owner can grab it to put on the lollipops. QR stays
 * high-contrast for reliable scanning; the neon lives in the chrome only.
 */
export function LabelQR({
  url,
  flavorName,
  accent = '#a8ff3c',
  size = 168,
}: LabelQRProps) {
  const qrWrapRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const printSheet = () => {
    const svg = qrWrapRef.current?.querySelector('svg');
    if (!svg) return;
    const svgMarkup = new XMLSerializer().serializeToString(svg);
    const w = window.open('', '_blank', 'width=720,height=900');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${escapeHtml(
      flavorName,
    )} · scan for ingredients</title>
      <style>
        @page { margin: 0; }
        body { margin: 0; font-family: -apple-system, system-ui, sans-serif; background: #ffffff; color: #111;
          display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 18px; padding: 48px; box-sizing: border-box; text-align: center; }
        .kicker { letter-spacing: 0.3em; text-transform: uppercase; font-size: 13px; color: #555; }
        h1 { font-size: 36px; margin: 0; letter-spacing: -0.02em; text-transform: lowercase; }
        .qr { padding: 12px; }
        .sub { font-size: 16px; color: #444; max-width: 30ch; }
        .url { font-family: ui-monospace, monospace; font-size: 12px; color: #777; word-break: break-all; }
      </style></head><body>
        <div class="kicker">scan for ingredients + safety</div>
        <h1>${escapeHtml(flavorName)}</h1>
        <div class="qr">${svgMarkup}</div>
        <div class="sub">point your phone camera here for ingredients, nutrition, and warnings.</div>
        <div class="url">${escapeHtml(url)}</div>
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        ref={qrWrapRef}
        style={{
          background: '#fff',
          padding: 14,
          borderRadius: 6,
          display: 'inline-block',
          lineHeight: 0,
          boxShadow: `0 0 0 1px ${accent}55`,
        }}
      >
        <QRCodeSVG value={url} size={size} level="M" marginSize={0} />
      </div>
      <code
        style={{
          fontFamily: 'var(--mono, monospace)',
          fontSize: 10,
          color: 'var(--bone, #b4afa1)',
          wordBreak: 'break-all',
          maxWidth: size + 28,
          textAlign: 'center',
        }}
      >
        {url}
      </code>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button type="button" className="btn" onClick={copy} style={{ fontSize: 11 }}>
          {copied ? 'copied ✓' : 'copy link'}
        </button>
        <button type="button" className="btn" onClick={printSheet} style={{ fontSize: 11 }}>
          print qr
        </button>
      </div>
    </div>
  );
}
