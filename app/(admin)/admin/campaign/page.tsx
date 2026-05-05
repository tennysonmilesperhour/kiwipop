'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminLayout } from '@/components/AdminLayout';

interface UpdateRow {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  is_milestone: boolean;
  milestone_label: string | null;
  published_at: string;
  created_at: string;
}

export default function AdminCampaignPage() {
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);
  const [milestoneLabel, setMilestoneLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/campaign-updates', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load');
      setUpdates(json.updates ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setFormMessage('title and body are required.');
      return;
    }

    setSubmitting(true);
    setFormMessage(null);
    try {
      const res = await fetch('/api/admin/campaign-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          image_url: imageUrl.trim() || undefined,
          is_milestone: isMilestone,
          milestone_label: isMilestone ? milestoneLabel.trim() || undefined : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create');

      setFormMessage('✅ Update posted!');
      setTitle('');
      setBody('');
      setImageUrl('');
      setIsMilestone(false);
      setMilestoneLabel('');
      fetchUpdates();
    } catch (err) {
      setFormMessage(`❌ ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this update?')) return;
    try {
      const res = await fetch(`/api/admin/campaign-updates/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to delete');
      }
      fetchUpdates();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 800 }}>
        <h1>Campaign Updates</h1>
        <p style={{ color: 'var(--bone-dim)', marginBottom: 24 }}>
          Post updates to the public{' '}
          <a href="/campaign" target="_blank" style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>
            /campaign
          </a>{' '}
          page. Milestones get a special badge.
        </p>

        {/* ---- CREATE FORM ---- */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={labelStyle}>
              Title *
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. First wholesale order!"
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Body *
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your update here. Newlines will be preserved as paragraphs."
                required
                rows={5}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
              />
            </label>

            <label style={labelStyle}>
              Image URL (optional)
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </label>

            <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={isMilestone}
                onChange={(e) => setIsMilestone(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#f5ff3d' }}
              />
              <span>This is a milestone 🎉</span>
            </label>

            {isMilestone && (
              <label style={labelStyle}>
                Milestone Badge Label
                <input
                  type="text"
                  value={milestoneLabel}
                  onChange={(e) => setMilestoneLabel(e.target.value)}
                  placeholder="e.g. 🎉 $500 raised!"
                  style={inputStyle}
                />
              </label>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 20px',
                background: '#f5ff3d',
                color: '#050008',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.1em',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'POSTING…' : 'POST UPDATE'}
            </button>

            {formMessage && (
              <p style={{ fontSize: 13, color: formMessage.startsWith('✅') ? '#b6ff1a' : '#ff1a8c' }}>
                {formMessage}
              </p>
            )}
          </div>
        </form>

        {/* ---- EXISTING UPDATES ---- */}
        <h2>Existing Updates ({updates.length})</h2>

        {loading && <p>Loading…</p>}
        {error && <p style={{ color: '#ff1a8c' }}>{error}</p>}

        {!loading && updates.length === 0 && (
          <p style={{ color: 'var(--bone-dim)' }}>No updates yet. Post your first one above!</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          {updates.map((u) => (
            <div
              key={u.id}
              style={{
                padding: 16,
                background: u.is_milestone
                  ? 'rgba(245, 255, 61, 0.06)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${u.is_milestone ? 'rgba(245, 255, 61, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  {u.is_milestone && u.milestone_label && (
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      background: 'rgba(245, 255, 61, 0.15)',
                      color: '#f5ff3d',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.15em',
                      marginBottom: 6,
                    }}>
                      {u.milestone_label}
                    </span>
                  )}
                  <h3 style={{ margin: '0 0 4px', color: 'var(--bone)' }}>{u.title}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--bone-dim)', whiteSpace: 'pre-wrap' }}>
                    {u.body.length > 200 ? u.body.slice(0, 200) + '…' : u.body}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--bone-mute)' }}>
                    {new Date(u.published_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(u.id)}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 26, 140, 0.4)',
                    color: '#ff1a8c',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: '#f4ecff',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#f4ecff',
  fontSize: 14,
  fontWeight: 400,
};
