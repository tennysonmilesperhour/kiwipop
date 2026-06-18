'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';

interface AdminRow {
  email: string;
  note: string | null;
  granted_at: string;
  has_account: boolean;
  display_name: string | null;
  is_owner: boolean;
  is_self: boolean;
}

export default function TeamPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/admins');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Load failed');
      setAdmins(json.admins as AdminRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), note: note.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to add admin');
      setEmail('');
      setNote('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setBusy(false);
    }
  };

  const removeAdmin = async (target: string) => {
    if (!confirm(`Remove admin access for ${target}?`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/admins?email=${encodeURIComponent(target)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to remove admin');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Admin team</h1>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <div className="card mb-6">
        <h2 className="card-title">Grant admin access</h2>
        <p className="text-sm text-gray-600 mb-3">
          Allowlist an email. If they already have an account it&apos;s promoted now; otherwise
          they become an admin automatically the moment they sign up with that email.
        </p>
        <form onSubmit={addAdmin}>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Note</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ops manager"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Add admin'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="card-title">Admins</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Note</th>
                <th>Granted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.email}>
                  <td className="font-medium">
                    {a.email}
                    {a.is_owner && <span className="text-xs text-gray-600"> · owner</span>}
                    {a.is_self && <span className="text-xs text-gray-600"> · you</span>}
                  </td>
                  <td className="text-sm">
                    {a.has_account ? (
                      <span style={{ color: 'var(--c-lime)' }}>
                        active{a.display_name ? ` · ${a.display_name}` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-600">invited (no signup yet)</span>
                    )}
                  </td>
                  <td className="text-sm">{a.note ?? '—'}</td>
                  <td className="text-sm">{new Date(a.granted_at).toLocaleDateString()}</td>
                  <td>
                    {!a.is_owner && !a.is_self ? (
                      <button
                        className="btn btn-secondary"
                        disabled={busy}
                        onClick={() => removeAdmin(a.email)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
