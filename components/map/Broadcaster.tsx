'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveColor } from '@/lib/map';

interface PresenceConfig {
  id: string;
  label: string;
  kind: string;
  color: string;
  emoji: string;
  message: string | null;
  zone_lat: number | null;
  zone_lng: number | null;
  zone_radius_m: number | null;
  auto_off_on_exit: boolean;
  is_live: boolean;
  enabled: boolean;
}

type Status = 'idle' | 'starting' | 'live' | 'left-zone';

const PING_MS = 10000;

export function Broadcaster({ token }: { token: string }) {
  const [config, setConfig] = useState<PresenceConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [geoError, setGeoError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const [message, setMessage] = useState('');
  const [savingMsg, setSavingMsg] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const posRef = useRef<GeolocationPosition | null>(null);

  const accent = resolveColor(config?.color);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/live/${token}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'not found');
      setConfig(json.presence);
      setMessage(json.presence.message ?? '');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'failed to load');
    }
  }, [token]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const teardown = useCallback(() => {
    if (watchIdRef.current != null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const sendPing = useCallback(async () => {
    const pos = posRef.current;
    if (!pos) return;
    try {
      const res = await fetch(`/api/live/${token}/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'ping failed');
      setLastSent(new Date());
      if (json.left_zone) {
        teardown();
        setStatus('left-zone');
      }
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : 'ping failed');
    }
  }, [token, teardown]);

  const goLive = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('this device has no location support.');
      return;
    }
    setGeoError(null);
    setStatus('starting');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        posRef.current = pos;
        setAccuracy(pos.coords.accuracy);
        if (status !== 'live') setStatus('live');
        // First fix arrives → ping immediately, then on an interval.
        if (!intervalRef.current) {
          sendPing();
          intervalRef.current = setInterval(sendPing, PING_MS);
        }
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'location permission denied. enable it in your browser settings to broadcast.'
            : 'could not get your location.',
        );
        teardown();
        setStatus('idle');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }, [sendPing, status, teardown]);

  const goOffline = useCallback(async () => {
    teardown();
    posRef.current = null;
    setAccuracy(null);
    setStatus('idle');
    await fetch(`/api/live/${token}/stop`, { method: 'POST' }).catch(() => {});
  }, [teardown, token]);

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/live/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) setConfig(json.presence);
      return res.ok;
    },
    [token],
  );

  const toggleAutoOff = useCallback(async () => {
    if (!config) return;
    await patch({ auto_off_on_exit: !config.auto_off_on_exit });
  }, [config, patch]);

  const lockZoneHere = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        patch({ zone_lat: pos.coords.latitude, zone_lng: pos.coords.longitude });
      },
      () => setGeoError('could not read your location to set the zone.'),
      { enableHighAccuracy: true },
    );
  }, [patch]);

  const saveMessage = useCallback(async () => {
    setSavingMsg(true);
    await patch({ message });
    setSavingMsg(false);
  }, [message, patch]);

  if (loadError) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h1 style={{ ...h1, color: 'var(--cherry)' }}>// link inactive</h1>
          <p style={muted}>
            this broadcast link isn’t valid or has been turned off
            {loadError ? ` (${loadError})` : ''}. ask your kiwi pop admin for a fresh one.
          </p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={wrap}>
        <p style={muted}>loading…</p>
      </div>
    );
  }

  const isLive = status === 'live' || status === 'starting';

  return (
    <div style={wrap}>
      <div style={card}>
        <p style={{ ...muted, marginBottom: 4 }}>// live broadcast · {config.kind}</p>
        <h1 style={{ ...h1, color: accent }}>
          {config.emoji} {config.label}
        </h1>

        {/* Big toggle */}
        <button
          onClick={isLive ? goOffline : goLive}
          style={{
            ...bigBtn,
            background: isLive ? 'transparent' : accent,
            color: isLive ? accent : 'var(--midnight)',
            border: `2px solid ${accent}`,
            boxShadow: isLive ? `0 0 24px ${accent}55` : 'none',
          }}
        >
          {status === 'starting'
            ? 'GETTING LOCATION…'
            : isLive
              ? '● YOU ARE LIVE — TAP TO GO OFFLINE'
              : 'GO LIVE'}
        </button>

        {isLive && (
          <p style={{ ...muted, textAlign: 'center', marginTop: 12 }}>
            people can find you on the map now.
            {accuracy != null && ` accuracy ±${Math.round(accuracy)}m.`}
            {lastSent && ` last update ${lastSent.toLocaleTimeString()}.`}
          </p>
        )}

        {status === 'left-zone' && (
          <div style={{ ...notice, borderColor: 'var(--sodium)' }}>
            <strong style={{ color: 'var(--sodium)' }}>you left your zone.</strong>
            <p style={muted}>
              broadcasting paused automatically. tap GO LIVE to resume — or turn off
              “auto-off when I leave the zone” below to broadcast anywhere.
            </p>
          </div>
        )}

        {geoError && <p style={{ ...muted, color: 'var(--cherry)', marginTop: 12 }}>{geoError}</p>}

        {/* Settings */}
        <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <label style={settingRow}>
            <span>
              <strong style={{ color: 'var(--paper)' }}>auto-off when I leave the zone</strong>
              <br />
              <span style={muted}>
                {config.zone_lat != null
                  ? `zone set · radius ${config.zone_radius_m ?? '—'}m`
                  : 'no zone set — set one below'}
              </span>
            </span>
            <input
              type="checkbox"
              checked={config.auto_off_on_exit}
              onChange={toggleAutoOff}
              style={{ width: 22, height: 22, accentColor: accent }}
            />
          </label>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={lockZoneHere} style={smallBtn}>
              📍 lock zone to here
            </button>
            {config.zone_lat != null && (
              <button onClick={() => patch({ clear_zone: true })} style={smallBtn}>
                clear zone
              </button>
            )}
          </div>

          <label style={{ display: 'block', marginTop: 16 }}>
            <span style={{ ...muted, display: 'block', marginBottom: 6 }}>
              message shown on the map (optional)
            </span>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. find me by the main stage!"
              style={input}
            />
          </label>
          <button onClick={saveMessage} disabled={savingMsg} style={{ ...smallBtn, marginTop: 8 }}>
            {savingMsg ? 'saving…' : 'save message'}
          </button>
        </div>

        <p style={{ ...muted, marginTop: 20, fontSize: 11 }}>
          keep this tab open while you broadcast. closing it stops sending your location after
          ~90 seconds.
        </p>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  minHeight: '70vh',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '1.5rem 1rem',
};
const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 460,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '1.5rem',
};
const h1: React.CSSProperties = {
  fontFamily: 'var(--display)',
  fontWeight: 800,
  fontSize: 'clamp(1.5rem, 6vw, 2.2rem)',
  letterSpacing: '-0.02em',
  margin: '0 0 1rem',
};
const muted: React.CSSProperties = {
  color: 'var(--bone)',
  fontSize: 13,
  opacity: 0.85,
  margin: 0,
};
const bigBtn: React.CSSProperties = {
  width: '100%',
  padding: '1.1rem 1rem',
  fontFamily: 'var(--mono)',
  fontWeight: 700,
  fontSize: 15,
  letterSpacing: '0.08em',
  borderRadius: 10,
  cursor: 'pointer',
};
const smallBtn: React.CSSProperties = {
  padding: '0.6rem 0.9rem',
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--paper)',
  fontFamily: 'var(--mono)',
  fontSize: 12,
  borderRadius: 8,
  cursor: 'pointer',
};
const settingRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};
const input: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.8rem',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid var(--border)',
  color: 'var(--paper)',
  borderRadius: 8,
  fontSize: 14,
};
const notice: React.CSSProperties = {
  marginTop: 16,
  padding: '0.9rem',
  border: '1px solid',
  borderRadius: 10,
  background: 'rgba(255,206,31,0.06)',
};
