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

interface OrderStats {
  orders: number;
  places: number;
  regions: number;
}

// Orders don't move in real time; refresh occasionally so new buys land
// without a hard reload.
const POLL_MS = 60000;

export function OrderMap() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/order-map', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'failed to load');
        if (!cancelled) {
          setPoints(json.points ?? []);
          setStats(json.stats ?? null);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'failed to load');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    load();
    timerRef.current = setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const topPlaces = points.slice(0, 12);

  return (
    <div className="kp-findus-map">
      <div className="kp-map-statusbar">
        <span>
          <span className="kp-dot kp-dot-live" style={{ background: 'var(--cherry)', boxShadow: '0 0 8px var(--cherry)' }} />{' '}
          {stats?.orders ?? 0} pops shipped
        </span>
        <span>
          <span className="kp-dot kp-dot-fixed" /> {stats?.places ?? 0} places
        </span>
        <span>
          <span className="kp-dot" style={{ background: 'var(--cyan)' }} /> {stats?.regions ?? 0} states + regions
        </span>
      </div>

      <LiveMap points={points} className="kp-map-canvas" />

      {error && <p className="kp-map-error">// map offline · {error}</p>}

      {loaded && points.length === 0 && !error && (
        <p className="kp-map-empty">
          // no pops on the map yet. be the first dot — grab a drop.
        </p>
      )}

      {topPlaces.length > 0 && (
        <ul className="kp-map-list">
          {topPlaces.map((p) => (
            <li key={p.id} className="kp-map-list-item">
              <span className="kp-map-list-star" style={{ color: p.color }}>
                ★
              </span>
              <span className="kp-map-list-body">
                <span className="kp-map-list-name">{p.name}</span>
                <span className="kp-map-list-meta" style={{ color: p.color, opacity: 1 }}>
                  {p.count === 1 ? '1 order' : `${p.count} orders`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
