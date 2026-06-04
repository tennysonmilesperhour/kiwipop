'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface PresenceShareModalProps {
  label: string;
  emoji: string;
  url: string;
  accent: string;
  onClose: () => void;
}

/**
 * Hand-off modal for a live presence: a big QR a booth rep scans to open their
 * broadcaster console, plus one-tap share (Web Share API) / copy / printable
 * poster. QR stays black-on-white for reliable scanning; the neon is in the
 * chrome only.
 */
export function PresenceShareModal({
  label,
  emoji,
  url,
  accent,
  onClose,
}: PresenceShareModalProps) {
  const qrWrapRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const share = async () => {
    try {
      await navigator.share({
        title: `Kiwi Pop · ${label}`,
        text: `Tap to go live on the Kiwi Pop map: ${label}`,
        url,
      });
    } catch {
      /* user cancelled or unsupported */
    }
  };

  const printPoster = () => {
    const svg = qrWrapRef.current?.querySelector('svg');
    if (!svg) return;
    const svgMarkup = new XMLSerializer().serializeToString(svg);
    const w = window.open('', '_blank', 'width=720,height=900');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${escapeHtml(label)} · scan to go live</title>
      <style>
        @page { margin: 0; }
        body { margin: 0; font-family: -apple-system, system-ui, sans-serif; background: #050510; color: #f4f0e8;
          display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 24px; padding: 48px; box-sizing: border-box; text-align: center; }
        .kicker { letter-spacing: 0.3em; text-transform: uppercase; font-size: 14px; color: #a8ff3c; }
        h1 { font-size: 44px; margin: 0; letter-spacing: -0.02em; }
        .qr { background: #fff; padding: 28px; border-radius: 20px; }
        .sub { font-size: 18px; opacity: 0.8; max-width: 28ch; }
        .url { font-family: ui-monospace, monospace; font-size: 13px; opacity: 0.6; word-break: break-all; }
      </style></head><body>
        <div class="kicker">scan to find a pop</div>
        <h1>${escapeHtml(emoji)} ${escapeHtml(label)}</h1>
        <div class="qr">${svgMarkup}</div>
        <div class="sub">point your phone camera here to start broadcasting your live location on the kiwi pop map.</div>
        <div class="url">${escapeHtml(url)}</div>
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5,5,16,0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--admin-surface, #14141f)',
          border: `1px solid ${accent}`,
          boxShadow: `0 0 32px ${accent}40`,
          borderRadius: 14,
          padding: '1.5rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: accent,
            margin: '0 0 4px',
          }}
        >
          scan to go live
        </p>
        <h3 style={{ margin: '0 0 16px', color: 'var(--admin-text, #f4f0e8)', fontSize: 20 }}>
          {emoji} {label}
        </h3>

        <div
          ref={qrWrapRef}
          style={{
            background: '#fff',
            padding: 16,
            borderRadius: 12,
            display: 'inline-block',
          }}
        >
          <QRCodeSVG value={url} size={220} level="M" marginSize={0} />
        </div>

        <p
          style={{
            fontFamily: 'var(--mono, monospace)',
            fontSize: 11,
            color: 'var(--admin-text-soft, #b4afa1)',
            wordBreak: 'break-all',
            margin: '14px 0 16px',
          }}
        >
          {url}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <button onClick={copy} style={btn(accent, true)}>
            {copied ? '✓ copied' : 'copy link'}
          </button>
          {canShare && (
            <button onClick={share} style={btn(accent, false)}>
              share…
            </button>
          )}
          <button onClick={printPoster} style={btn(accent, false)}>
            print poster
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            background: 'transparent',
            border: 'none',
            color: 'var(--admin-text-muted, #7d7a70)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          close
        </button>
      </div>
    </div>
  );
}

function btn(accent: string, primary: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: primary ? accent : 'transparent',
    color: primary ? '#050008' : 'var(--admin-text, #f4f0e8)',
    border: `1px solid ${primary ? accent : 'var(--admin-border-strong, rgba(244,240,232,0.18))'}`,
    fontWeight: 700,
    fontSize: 12,
    borderRadius: 8,
    cursor: 'pointer',
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}
