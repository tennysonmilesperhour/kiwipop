'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { MapPoint } from '@/lib/map';

// Leaflet touches `window` at import time — load the map client-side only.
const LiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="kp-map-loading">
      <span>loading map…</span>
    </div>
  ),
});

const POLL_MS = 15000;

export function FindUsMap() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/locations', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'failed to load');
        if (!cancelled) {
          setPoints(json.points ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'failed to load');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    load();
    // Poll so live pins move and offline pins drop without a refresh.
    timerRef.current = setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const liveCount = points.filter((p) => p.live).length;
  const fixedCount = points.length - liveCount;

  return (
    <div className="kp-findus-map">
      <div className="kp-map-statusbar">
        <span>
          <span className="kp-dot kp-dot-live" /> {liveCount} live now
        </span>
        <span>
          <span className="kp-dot kp-dot-fixed" /> {fixedCount} spots
        </span>
      </div>

      <LiveMap points={points} className="kp-map-canvas" />

      {error && <p className="kp-map-error">// map offline · {error}</p>}

      {loaded && points.length === 0 && !error && (
        <p className="kp-map-empty">
          // no pops on the map right now. check back, or get on the list for drops.
        </p>
      )}

      {points.length > 0 && (
        <ul className="kp-map-list">
          {points.map((p) => (
            <li key={`${p.source}:${p.id}`} className="kp-map-list-item">
              <span className="kp-map-list-star" style={{ color: p.color }}>
                ★
              </span>
              <span className="kp-map-list-body">
                <span className="kp-map-list-name">
                  {p.name}
                  {p.live && (
                    <span className="kp-map-list-livetag" style={{ color: p.color }}>
                      {' '}
                      ● live
                    </span>
                  )}
                </span>
                <span className="kp-map-list-meta">
                  {p.kind}
                  {p.address ? ` · ${p.address}` : ''}
                  {p.live && p.lastSeenMinutes != null && p.lastSeenMinutes >= 1
                    ? ` · seen ${p.lastSeenMinutes}m ago`
                    : ''}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
