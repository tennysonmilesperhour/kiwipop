'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { LIVE_FRESH_SECONDS, MARKER_COLOR_KEYS, resolveColor } from '@/lib/map';

interface LocationRow {
  id: string;
  name: string;
  kind: string;
  description: string | null;
  address: string | null;
  lat: number;
  lng: number;
  url: string | null;
  color: string;
  is_active: boolean;
}

interface PresenceRow {
  id: string;
  label: string;
  kind: string;
  share_token: string;
  color: string;
  emoji: string;
  message: string | null;
  zone_lat: number | null;
  zone_lng: number | null;
  zone_radius_m: number | null;
  auto_off_on_exit: boolean;
  is_live: boolean;
  enabled: boolean;
  last_ping_at: string | null;
}

const LOCATION_KINDS = ['store', 'retail', 'popup', 'festival'];
const PRESENCE_KINDS = ['rover', 'booth'];

function isFresh(lastPing: string | null): boolean {
  if (!lastPing) return false;
  return Date.now() - new Date(lastPing).getTime() < LIVE_FRESH_SECONDS * 1000;
}

export default function AdminMapPage() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [presences, setPresences] = useState<PresenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // location form
  const [lName, setLName] = useState('');
  const [lKind, setLKind] = useState('retail');
  const [lColor, setLColor] = useState('lime');
  const [lLat, setLLat] = useState('');
  const [lLng, setLLng] = useState('');
  const [lAddress, setLAddress] = useState('');
  const [lDesc, setLDesc] = useState('');
  const [lUrl, setLUrl] = useState('');

  // presence form
  const [pLabel, setPLabel] = useState('');
  const [pKind, setPKind] = useState('rover');
  const [pColor, setPColor] = useState('magenta');
  const [pEmoji, setPEmoji] = useState('⭐');
  const [pMessage, setPMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [locRes, preRes] = await Promise.all([
        fetch('/api/admin/locations', { cache: 'no-store' }),
        fetch('/api/admin/presences', { cache: 'no-store' }),
      ]);
      const locJson = await locRes.json();
      const preJson = await preRes.json();
      if (locRes.ok) setLocations(locJson.locations ?? []);
      if (preRes.ok) setPresences(preJson.presences ?? []);
    } catch {
      setMsg('failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addLocation = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const lat = parseFloat(lLat);
    const lng = parseFloat(lLng);
    if (!lName.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      setMsg('name + numeric lat/lng required');
      return;
    }
    const res = await fetch('/api/admin/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: lName,
        kind: lKind,
        color: lColor,
        lat,
        lng,
        address: lAddress || undefined,
        description: lDesc || undefined,
        url: lUrl || undefined,
      }),
    });
    if (res.ok) {
      setLName('');
      setLLat('');
      setLLng('');
      setLAddress('');
      setLDesc('');
      setLUrl('');
      setMsg('✅ location added');
      load();
    } else {
      const j = await res.json();
      setMsg(`❌ ${j.error ?? 'failed'}`);
    }
  };

  const deleteLocation = async (id: string) => {
    if (!confirm('Delete this location?')) return;
    await fetch(`/api/admin/locations/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleLocationActive = async (l: LocationRow) => {
    await fetch(`/api/admin/locations/${l.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !l.is_active }),
    });
    load();
  };

  const addPresence = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!pLabel.trim()) {
      setMsg('label required');
      return;
    }
    const res = await fetch('/api/admin/presences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: pLabel,
        kind: pKind,
        color: pColor,
        emoji: pEmoji,
        message: pMessage || undefined,
      }),
    });
    if (res.ok) {
      setPLabel('');
      setPMessage('');
      setMsg('✅ presence created — copy its share link below');
      load();
    } else {
      const j = await res.json();
      setMsg(`❌ ${j.error ?? 'failed'}`);
    }
  };

  const deletePresence = async (id: string) => {
    if (!confirm('Delete this presence? Its share link will stop working.')) return;
    await fetch(`/api/admin/presences/${id}`, { method: 'DELETE' });
    load();
  };

  const togglePresenceEnabled = async (p: PresenceRow) => {
    await fetch(`/api/admin/presences/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !p.enabled }),
    });
    load();
  };

  const forceOffline = async (p: PresenceRow) => {
    await fetch(`/api/admin/presences/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_live: false }),
    });
    load();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/live/${token}`;
    navigator.clipboard?.writeText(url);
    setMsg(`📋 copied: ${url}`);
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 920 }}>
        <h1>Map &amp; Live Locations</h1>
        <p style={{ color: 'var(--admin-text-soft)', marginBottom: 20 }}>
          Manage the stars on the public{' '}
          <a href="/find-us" target="_blank" style={{ color: 'var(--c-cyan)' }}>
            /find-us
          </a>{' '}
          map. Fixed spots are stores/retail/booths with known coordinates. Live presences are
          mobile broadcasters (a booth or a roving rep) who flip themselves on from a phone via a
          share link.
        </p>

        {msg && (
          <p
            style={{
              fontSize: 13,
              color: msg.startsWith('❌') ? 'var(--c-magenta)' : 'var(--c-lime)',
              marginBottom: 16,
            }}
          >
            {msg}
          </p>
        )}

        {/* ===================== LIVE PRESENCES ===================== */}
        <section style={{ marginBottom: 40 }}>
          <h2>Live presences (mobile broadcasters)</h2>

          <form onSubmit={addPresence} style={formGrid}>
            <input
              value={pLabel}
              onChange={(e) => setPLabel(e.target.value)}
              placeholder="Label (e.g. Coachella backpack — Mia)"
              style={input}
            />
            <select value={pKind} onChange={(e) => setPKind(e.target.value)} style={input}>
              {PRESENCE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <select value={pColor} onChange={(e) => setPColor(e.target.value)} style={input}>
              {MARKER_COLOR_KEYS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              value={pEmoji}
              onChange={(e) => setPEmoji(e.target.value)}
              placeholder="emoji"
              style={{ ...input, maxWidth: 90 }}
            />
            <input
              value={pMessage}
              onChange={(e) => setPMessage(e.target.value)}
              placeholder="Map message (optional)"
              style={input}
            />
            <button type="submit" style={primaryBtn}>
              CREATE + GET LINK
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {presences.map((p) => {
              const live = p.is_live && isFresh(p.last_ping_at);
              return (
                <div key={p.id} style={{ ...rowCard, opacity: p.enabled ? 1 : 0.55 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ color: resolveColor(p.color), fontSize: 20 }}>★</span>
                    <strong style={{ color: 'var(--admin-text)' }}>
                      {p.emoji} {p.label}
                    </strong>
                    <span style={badge}>{p.kind}</span>
                    {live ? (
                      <span style={{ ...badge, color: 'var(--c-lime)', borderColor: 'var(--c-lime)' }}>
                        ● LIVE
                      </span>
                    ) : (
                      <span style={{ ...badge, color: 'var(--admin-text-muted)' }}>offline</span>
                    )}
                    {!p.enabled && (
                      <span style={{ ...badge, color: 'var(--c-magenta)' }}>disabled</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <code style={tokenBox}>/live/{p.share_token}</code>
                    <button onClick={() => copyLink(p.share_token)} style={smallBtn}>
                      copy link
                    </button>
                    <button onClick={() => togglePresenceEnabled(p)} style={smallBtn}>
                      {p.enabled ? 'disable link' : 'enable link'}
                    </button>
                    {live && (
                      <button onClick={() => forceOffline(p)} style={smallBtn}>
                        force offline
                      </button>
                    )}
                    <button onClick={() => deletePresence(p.id)} style={dangerBtn}>
                      delete
                    </button>
                  </div>
                  <p style={{ ...meta, marginTop: 6 }}>
                    {p.zone_lat != null
                      ? `geofence: ${p.zone_radius_m ?? '—'}m · auto-off ${p.auto_off_on_exit ? 'on' : 'off'}`
                      : `no geofence · auto-off ${p.auto_off_on_exit ? 'on' : 'off'}`}
                    {p.last_ping_at ? ` · last ping ${new Date(p.last_ping_at).toLocaleString()}` : ''}
                  </p>
                </div>
              );
            })}
            {!loading && presences.length === 0 && (
              <p style={meta}>No presences yet. Create one to hand out a broadcast link.</p>
            )}
          </div>
        </section>

        {/* ===================== FIXED LOCATIONS ===================== */}
        <section>
          <h2>Fixed locations</h2>
          <p style={meta}>
            Tip: grab coordinates by right-clicking a spot in Google Maps → the first line is
            “lat, lng”.
          </p>

          <form onSubmit={addLocation} style={formGrid}>
            <input
              value={lName}
              onChange={(e) => setLName(e.target.value)}
              placeholder="Name (e.g. The Store · SLC)"
              style={input}
            />
            <select value={lKind} onChange={(e) => setLKind(e.target.value)} style={input}>
              {LOCATION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <select value={lColor} onChange={(e) => setLColor(e.target.value)} style={input}>
              {MARKER_COLOR_KEYS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              value={lLat}
              onChange={(e) => setLLat(e.target.value)}
              placeholder="lat (40.7608)"
              style={input}
            />
            <input
              value={lLng}
              onChange={(e) => setLLng(e.target.value)}
              placeholder="lng (-111.891)"
              style={input}
            />
            <input
              value={lAddress}
              onChange={(e) => setLAddress(e.target.value)}
              placeholder="Address (optional)"
              style={input}
            />
            <input
              value={lDesc}
              onChange={(e) => setLDesc(e.target.value)}
              placeholder="Description (optional)"
              style={input}
            />
            <input
              value={lUrl}
              onChange={(e) => setLUrl(e.target.value)}
              placeholder="Link URL (optional)"
              style={input}
            />
            <button type="submit" style={primaryBtn}>
              ADD LOCATION
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {locations.map((l) => (
              <div key={l.id} style={{ ...rowCard, opacity: l.is_active ? 1 : 0.55 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ color: resolveColor(l.color), fontSize: 20 }}>★</span>
                  <strong style={{ color: 'var(--admin-text)' }}>{l.name}</strong>
                  <span style={badge}>{l.kind}</span>
                  {!l.is_active && (
                    <span style={{ ...badge, color: 'var(--admin-text-muted)' }}>hidden</span>
                  )}
                </div>
                <p style={{ ...meta, marginTop: 6 }}>
                  {l.lat.toFixed(5)}, {l.lng.toFixed(5)}
                  {l.address ? ` · ${l.address}` : ''}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => toggleLocationActive(l)} style={smallBtn}>
                    {l.is_active ? 'hide' : 'show'}
                  </button>
                  <button onClick={() => deleteLocation(l.id)} style={dangerBtn}>
                    delete
                  </button>
                </div>
              </div>
            ))}
            {!loading && locations.length === 0 && (
              <p style={meta}>No fixed locations yet.</p>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

const formGrid: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 12,
};
const input: React.CSSProperties = {
  padding: '9px 11px',
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid var(--admin-border-strong)',
  color: 'var(--admin-text)',
  fontSize: 13,
  borderRadius: 8,
  flex: '1 1 160px',
};
const primaryBtn: React.CSSProperties = {
  padding: '9px 16px',
  background: 'var(--c-lime)',
  color: '#050008',
  border: 'none',
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: '0.08em',
  borderRadius: 8,
  cursor: 'pointer',
};
const smallBtn: React.CSSProperties = {
  padding: '6px 12px',
  background: 'transparent',
  border: '1px solid var(--admin-border-strong)',
  color: 'var(--admin-text)',
  fontSize: 11,
  borderRadius: 6,
  cursor: 'pointer',
};
const dangerBtn: React.CSSProperties = {
  ...smallBtn,
  borderColor: 'rgba(255,45,138,0.5)',
  color: 'var(--c-magenta)',
};
const rowCard: React.CSSProperties = {
  padding: 14,
  background: 'var(--admin-surface-soft)',
  border: '1px solid var(--admin-border)',
  borderRadius: 10,
};
const badge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '2px 8px',
  border: '1px solid var(--admin-border-strong)',
  borderRadius: 999,
  color: 'var(--admin-text-soft)',
};
const tokenBox: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  color: 'var(--admin-text-soft)',
  background: 'rgba(0,0,0,0.35)',
  padding: '4px 8px',
  borderRadius: 6,
};
const meta: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--admin-text-muted)',
  margin: 0,
};
