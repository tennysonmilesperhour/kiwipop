'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';

interface SheetRow {
  slug: string;
  label: string;
  embed_url: string;
  height_px: number;
  position: number;
  updated_at?: string;
}

interface FormState {
  slug: string;
  label: string;
  embed_url: string;
  height_px: number;
  position: number;
}

const KNOWN_SECTIONS: Array<{ slug: string; label: string; hint: string }> = [
  {
    slug: 'financials',
    label: 'Financials · P&L workbook',
    hint: 'lives on the financials page · COGS, expenses, margin tracking',
  },
  {
    slug: 'manufacturing',
    label: 'Manufacturing · costing + recipes',
    hint:
      'lives on the manufacturing page · ingredient prices, per-pop recipes, batch costs',
  },
  {
    slug: 'inventory',
    label: 'Inventory · stock + projections',
    hint:
      'lives on the inventory page · counts beyond what supabase tracks, restock plans',
  },
  {
    slug: 'wholesale',
    label: 'Wholesale · pipeline tracker',
    hint: 'lives on the wholesale page · accounts, status, expected volume',
  },
];

const EMPTY_FORM: FormState = {
  slug: '',
  label: '',
  embed_url: '',
  height_px: 700,
  position: 0,
};

function buildEmpty(slug: string, label: string): FormState {
  return { ...EMPTY_FORM, slug, label };
}

export default function AdminSheetsPage(): JSX.Element {
  const params = useSearchParams();
  const focusSlug = params.get('focus');
  const [sheets, setSheets] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const sheetsBySlug = useMemo(() => {
    const m: Record<string, SheetRow> = {};
    for (const s of sheets) m[s.slug] = s;
    return m;
  }, [sheets]);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sheets', {
        cache: 'no-store',
      });
      const json = await response.json();
      if (response.ok) {
        setSheets((json.sheets as SheetRow[]) ?? []);
      } else {
        setError(json.error ?? 'failed to load sheets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load sheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  // Pre-fill form if ?focus= matches a known section.
  useEffect(() => {
    if (!focusSlug) return;
    const known = KNOWN_SECTIONS.find((s) => s.slug === focusSlug);
    const existing = sheetsBySlug[focusSlug];
    if (existing) {
      setForm({
        slug: existing.slug,
        label: existing.label,
        embed_url: existing.embed_url,
        height_px: existing.height_px,
        position: existing.position,
      });
    } else if (known) {
      setForm(buildEmpty(known.slug, known.label));
    }
  }, [focusSlug, sheetsBySlug]);

  const handleEdit = (row: SheetRow): void => {
    setForm({
      slug: row.slug,
      label: row.label,
      embed_url: row.embed_url,
      height_px: row.height_px,
      position: row.position,
    });
    setError('');
    setSuccess('');
  };

  const handleQuickAdd = (slug: string, label: string): void => {
    const existing = sheetsBySlug[slug];
    if (existing) {
      handleEdit(existing);
    } else {
      setForm(buildEmpty(slug, label));
    }
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: form.slug.trim(),
          label: form.label.trim(),
          embed_url: form.embed_url.trim(),
          height_px: form.height_px,
          position: form.position,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'save failed');
      setSuccess(`saved · /${form.slug} now renders the linked sheet.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (slug: string): Promise<void> => {
    if (!confirm(`unlink the sheet for "${slug}"? the page reverts to "no sheet linked".`))
      return;
    setError('');
    setSuccess('');
    try {
      const response = await fetch(
        `/api/admin/sheets/${encodeURIComponent(slug)}`,
        { method: 'DELETE' }
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'delete failed');
      setSuccess(`unlinked · ${slug}`);
      await refresh();
      if (form.slug === slug) setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'delete failed');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-home-header">
        <p className="stat-label">// admin · sheets</p>
        <h1>sheets.</h1>
        <p className="admin-home-meta">
          paste the Google Sheets &quot;publish to web&quot; URL for any admin
          section. the linked sheet renders inline on the matching page so you
          can keep working out of your spreadsheet without leaving the admin.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <p className="stat-label" style={{ marginBottom: '1rem' }}>
          // quick-link sections
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {KNOWN_SECTIONS.map((section) => {
            const existing = sheetsBySlug[section.slug];
            return (
              <button
                key={section.slug}
                type="button"
                onClick={() => handleQuickAdd(section.slug, section.label)}
                className="card"
                style={{
                  textAlign: 'left',
                  padding: '1rem',
                  margin: 0,
                  background: 'var(--midnight)',
                  borderColor: existing
                    ? 'var(--lime)'
                    : 'rgba(244,240,232,0.15)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--display)',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: existing ? 'var(--lime)' : 'var(--paper)',
                    marginBottom: '0.4rem',
                    textTransform: 'lowercase',
                  }}
                >
                  {section.slug}
                  {existing ? ' · linked' : ''}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    color: 'var(--bone)',
                    lineHeight: 1.5,
                  }}
                >
                  {section.hint}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <p className="stat-label" style={{ marginBottom: '1rem' }}>
          // {form.slug ? `editing · ${form.slug}` : 'add or edit a sheet'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_-]/g, ''),
                  })
                }
                className="form-input"
                required
                placeholder="financials, manufacturing, inventory…"
              />
            </div>
            <div className="form-group">
              <label className="form-label">label *</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="form-input"
                required
                placeholder="P&L workbook"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">embed url *</label>
            <input
              type="url"
              value={form.embed_url}
              onChange={(e) =>
                setForm({ ...form, embed_url: e.target.value })
              }
              className="form-input"
              required
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pubhtml?widget=true"
            />
            <p
              style={{
                marginTop: '0.5rem',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--bone)',
                lineHeight: 1.55,
              }}
            >
              // in Google Sheets: <strong>File → Share → Publish to web</strong>{' '}
              → choose tab or entire document → copy the URL. paste here.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">height (px)</label>
              <input
                type="number"
                min={200}
                max={2000}
                value={form.height_px}
                onChange={(e) =>
                  setForm({
                    ...form,
                    height_px: parseInt(e.target.value, 10) || 700,
                  })
                }
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">position</label>
              <input
                type="number"
                min={0}
                value={form.position}
                onChange={(e) =>
                  setForm({
                    ...form,
                    position: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="form-input"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'saving…' : 'save sheet'}
            </button>
            {form.slug && sheetsBySlug[form.slug] ? (
              <button
                type="button"
                onClick={() => handleDelete(form.slug)}
                className="btn"
                style={{ background: '#dc2626', color: 'var(--paper)' }}
              >
                unlink
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="btn btn-secondary"
            >
              reset
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <p className="stat-label" style={{ marginBottom: '1rem' }}>
          // linked sheets
        </p>
        {loading ? (
          <p>loading…</p>
        ) : sheets.length === 0 ? (
          <p>nothing linked yet · pick a section above to start.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>slug</th>
                <th>label</th>
                <th>height</th>
                <th>updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sheets.map((row) => (
                <tr key={row.slug}>
                  <td className="font-mono">{row.slug}</td>
                  <td>{row.label}</td>
                  <td>{row.height_px}</td>
                  <td className="text-sm">
                    {row.updated_at
                      ? new Date(row.updated_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="text-sm" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(row)}
                      className="text-primary"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      edit
                    </button>
                    <button
                      onClick={() => handleDelete(row.slug)}
                      className="text-red-600"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      unlink
                    </button>
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
