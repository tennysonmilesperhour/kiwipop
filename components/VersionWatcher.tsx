'use client';

import { useCallback, useEffect, useState } from 'react';

const POLL_INTERVAL_MS = 60_000;
const DISMISS_KEY = 'kp-dismissed-sha';

interface VersionResponse {
  sha?: string;
  env?: string;
  branch?: string | null;
  now?: string;
}

function normalizeProductionUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const u = raw.startsWith('http') ? new URL(raw) : new URL(`https://${raw}`);
    return u.origin;
  } catch {
    return null;
  }
}

export function VersionWatcher() {
  const localSha = process.env.NEXT_PUBLIC_BUILD_SHA || '';
  const productionOrigin = normalizeProductionUrl(
    process.env.NEXT_PUBLIC_PRODUCTION_URL
  );

  const [latestSha, setLatestSha] = useState<string | null>(null);
  const [latestBranch, setLatestBranch] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(async () => {
    if (!productionOrigin || !localSha) return;
    try {
      const url = `${productionOrigin}/api/version?ts=${Date.now()}`;
      const response = await fetch(url, {
        cache: 'no-store',
        mode: 'cors',
        credentials: 'omit',
        // Short-circuit any service-worker caching layers
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const json: VersionResponse = await response.json();
      if (!json.sha || json.sha === 'dev') return;
      if (json.sha !== localSha) {
        setLatestSha(json.sha);
        setLatestBranch(json.branch ?? null);
        const dismissedSha =
          typeof window !== 'undefined'
            ? sessionStorage.getItem(DISMISS_KEY)
            : null;
        if (dismissedSha !== json.sha) {
          setDismissed(false);
        }
      } else {
        setLatestSha(null);
      }
    } catch {
      /* offline or CORS-blocked — silently retry on next interval */
    }
  }, [productionOrigin, localSha]);

  useEffect(() => {
    if (!productionOrigin || !localSha) return;

    void check();
    const id = window.setInterval(check, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (!document.hidden) void check();
    };
    const onOnline = () => void check();
    window.addEventListener('focus', onVisible);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check, productionOrigin, localSha]);

  if (!latestSha || dismissed || !productionOrigin) return null;

  const onSameOrigin =
    typeof window !== 'undefined' &&
    window.location.origin === productionOrigin;

  const handleRefresh = () => {
    if (typeof window === 'undefined') return;
    if (onSameOrigin) {
      window.location.reload();
      return;
    }
    const target = `${productionOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.href = target;
  };

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, latestSha);
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const shaShort = latestSha.slice(0, 7);

  return (
    <div className="version-toast" role="status" aria-live="polite">
      <div className="version-toast-content">
        <span className="version-toast-dot" aria-hidden="true" />
        <div className="version-toast-text">
          <div className="version-toast-title">new build live</div>
          <div className="version-toast-meta">
            {onSameOrigin
              ? `you're on an older build · refresh for ${shaShort}`
              : latestBranch === 'main'
                ? `main is ahead · jump to ${shaShort}`
                : `production is ahead · jump to ${shaShort}`}
          </div>
        </div>
        <div className="version-toast-actions">
          <button
            type="button"
            onClick={handleRefresh}
            className="btn btn-primary"
          >
            {onSameOrigin ? 'refresh' : 'jump to main'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="btn"
            aria-label="dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
