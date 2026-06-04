'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_CENTER, type MapPoint } from '@/lib/map';

interface LiveMapProps {
  points: MapPoint[];
  className?: string;
}

const STAR_PATH =
  'M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88-5-4.87 7.1-1.01L12 2z';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}

function markerHtml(p: MapPoint): string {
  const live = p.live ? ' is-live' : '';
  const emoji = p.emoji && p.live ? `<span class="kp-star-emoji">${escapeHtml(p.emoji)}</span>` : '';
  return `<div class="kp-star-marker${live}" style="color:${p.color}">
    <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
      <path d="${STAR_PATH}" fill="currentColor" stroke="rgba(5,5,16,0.85)" stroke-width="1"/>
    </svg>${emoji}
  </div>`;
}

function makeIcon(p: MapPoint): L.DivIcon {
  return L.divIcon({
    className: 'kp-star-icon',
    html: markerHtml(p),
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -14],
  });
}

function popupHtml(p: MapPoint): string {
  const parts: string[] = [];
  parts.push(`<div class="kp-popup">`);
  if (p.live) {
    const seen =
      p.lastSeenMinutes != null
        ? p.lastSeenMinutes < 1
          ? 'live now'
          : `seen ${p.lastSeenMinutes}m ago`
        : 'live now';
    parts.push(`<span class="kp-popup-live" style="color:${p.color}">● ${seen}</span>`);
  }
  parts.push(`<strong class="kp-popup-name">${escapeHtml(p.name)}</strong>`);
  parts.push(`<span class="kp-popup-kind">${escapeHtml(p.kind)}</span>`);
  if (p.description) parts.push(`<p class="kp-popup-desc">${escapeHtml(p.description)}</p>`);
  if (p.address) parts.push(`<p class="kp-popup-addr">${escapeHtml(p.address)}</p>`);
  if (p.url) {
    const safe = /^https?:\/\//i.test(p.url) ? p.url : `https://${p.url}`;
    parts.push(
      `<a class="kp-popup-link" href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">open ↗</a>`,
    );
  }
  parts.push(`</div>`);
  return parts.join('');
}

export default function LiveMap({ points, className }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const didFitRef = useRef(false);

  // Init the map once.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 4,
      scrollWheelZoom: false, // friendlier on mobile / scroll
      attributionControl: true,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      },
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      didFitRef.current = false;
    };
  }, []);

  // Sync markers whenever points change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = markersRef.current;
    const seen = new Set<string>();

    for (const p of points) {
      const key = `${p.source}:${p.id}`;
      seen.add(key);
      const existing = markers.get(key);
      if (existing) {
        existing.setLatLng([p.lat, p.lng]);
        existing.setIcon(makeIcon(p));
        existing.setPopupContent(popupHtml(p));
      } else {
        const m = L.marker([p.lat, p.lng], { icon: makeIcon(p) })
          .addTo(map)
          .bindPopup(popupHtml(p));
        markers.set(key, m);
      }
    }

    // Drop markers that disappeared (e.g. a presence went offline).
    for (const [key, m] of markers) {
      if (!seen.has(key)) {
        m.remove();
        markers.delete(key);
      }
    }

    // Fit to all points once, on first non-empty render.
    if (!didFitRef.current && points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      didFitRef.current = true;
    }
  }, [points]);

  return <div ref={containerRef} className={className} />;
}
