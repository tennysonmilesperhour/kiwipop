'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useOrders, useOrderWithItems } from '@/lib/hooks';
import { formatCentsToUSD } from '@/lib/format';
import { useQueryClient } from '@tanstack/react-query';

interface ShippingAddress {
  firstName?: string | null;
  lastName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  kind?: string | null;
  donorName?: string | null;
  donationMessage?: string | null;
}

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  user_email: string | null;
  created_at: string;
  shipping_address: ShippingAddress | null;
  stripe_payment_intent_id?: string | null;
}

interface ShipmentRow {
  id: string;
  order_id: string;
  carrier: string | null;
  tracking_number: string | null;
  label_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

interface ReconcileSummary {
  scanned_sessions: number;
  pending_orders_before: number;
  matched: number;
  marked_paid: number;
  marked_cancelled: number;
  errors: string[];
  changes: Array<{
    order_id: string;
    new_status: string;
    payment_intent_id: string | null;
  }>;
}

interface BulkLabelResult {
  orderId: string;
  ok: boolean;
  trackingNumber?: string;
  rateCents?: number;
  error?: string;
  reused?: boolean;
}

interface BulkLabelResponse {
  results: BulkLabelResult[];
  pdfB64: string | null;
  succeeded: number;
  failed: number;
}

interface ProductionSummaryEntry {
  productId: string;
  sku: string | null;
  name: string;
  totalQuantity: number;
  orderCount: number;
}
interface FlavorSummaryEntry {
  flavorSku: string;
  label: string;
  color: string;
  totalPops: number;
}
interface ProductionSummary {
  entries: ProductionSummaryEntry[];
  flavorEntries: FlavorSummaryEntry[];
  orderCount: number;
  totalJars: number;
  totalPops: number;
}

type SectionKey =
  | 'to_fulfill'
  | 'shipped'
  | 'completed'
  | 'donations'
  | 'pending'
  | 'cancelled';

const SECTION_ORDER: SectionKey[] = [
  'to_fulfill',
  'shipped',
  'completed',
  'donations',
  'pending',
  'cancelled',
];

const SECTION_LABELS: Record<SectionKey, string> = {
  to_fulfill: 'to fulfill',
  shipped: 'shipped',
  completed: 'completed',
  donations: 'donations',
  pending: 'awaiting payment',
  cancelled: 'cancelled',
};

const SECTION_COLORS: Record<SectionKey, string> = {
  to_fulfill: 'var(--c-sodium)',
  shipped: 'var(--c-cyan)',
  completed: 'var(--c-lime)',
  donations: 'var(--c-uv)',
  pending: 'var(--c-magenta)',
  cancelled: 'var(--admin-text-soft)',
};

const SECTION_STORAGE_KEY = 'kp-admin-orders-section';

function categorize(o: OrderRow): SectionKey {
  if (o.shipping_address?.kind === 'donation') return 'donations';
  if (o.status === 'pending') return 'pending';
  if (o.status === 'cancelled') return 'cancelled';
  if (o.status === 'completed') return 'completed';
  if (o.status === 'shipped') return 'shipped';
  if (o.status === 'paid') return 'to_fulfill';
  return 'pending';
}

function fullName(addr: ShippingAddress | null | undefined): string {
  if (!addr) return '';
  if (addr.kind === 'donation') return addr.donorName?.trim() || '';
  return [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim();
}

function ageLabel(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days}d`;
  const hrs = Math.floor(ms / (60 * 60 * 1000));
  if (hrs >= 1) return `${hrs}h`;
  const mins = Math.max(1, Math.floor(ms / 60_000));
  return `${mins}m`;
}

function base64ToPdfBlob(b64: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: 'application/pdf' });
}

function downloadBase64Pdf(b64: string, filename: string) {
  const url = URL.createObjectURL(base64ToPdfBlob(b64));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 200);
}

const AUTO_PRINT_STORAGE_KEY = 'kp-admin-auto-print';

/**
 * Pop the browser print dialog for a PDF without making the admin hunt for a
 * downloaded file. Loads the PDF into an offscreen iframe and calls print()
 * once it's rendered — that routes straight to the (label) printer. If the
 * browser refuses to print the embedded PDF, we fall back to opening it in a
 * new tab so the label is never lost.
 */
function printPdfUrl(url: string, onDone?: () => void) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  iframe.src = url;
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  document.body.appendChild(iframe);
  // The print dialog blocks, so a generous timeout is plenty to clean up after.
  window.setTimeout(() => {
    iframe.remove();
    onDone?.();
  }, 60_000);
}

function printBase64Pdf(b64: string) {
  const url = URL.createObjectURL(base64ToPdfBlob(b64));
  printPdfUrl(url, () => URL.revokeObjectURL(url));
}

export default function OrdersPage() {
  const { data: orders, isLoading, refetch } = useOrders();
  const queryClient = useQueryClient();

  const [section, setSection] = useState<SectionKey>('to_fulfill');
  const [modalOrderId, setModalOrderId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] =
    useState<ReconcileSummary | null>(null);
  const [reconcileError, setReconcileError] = useState<string>('');

  const [bulkBusy, setBulkBusy] = useState<
    'labels' | 'shipped' | 'completed' | null
  >(null);
  const [bulkResult, setBulkResult] = useState<BulkLabelResponse | null>(null);
  const [bulkError, setBulkError] = useState<string>('');

  // "Buy all labels" buys postage for the whole fulfillment queue without
  // printing; "print unprinted labels" then merges everything bought-but-not-
  // yet-printed into one sheet. unprintedCount drives that button's badge.
  const [buyAllBusy, setBuyAllBusy] = useState(false);
  const [buyAllResult, setBuyAllResult] = useState<{
    succeeded: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [unprintedCount, setUnprintedCount] = useState(0);
  const [printingUnprinted, setPrintingUnprinted] = useState(false);
  const [unprintedPdf, setUnprintedPdf] = useState<string | null>(null);
  const [unprintedPrinted, setUnprintedPrinted] = useState(0);

  const [production, setProduction] = useState<ProductionSummary | null>(null);
  const [productionLoading, setProductionLoading] = useState(false);
  const [shippingRowId, setShippingRowId] = useState<string | null>(null);

  // When on, freshly-bought labels (single or bulk) auto-pop the print dialog
  // and route straight to the label printer instead of downloading a file the
  // admin has to find and open. Persisted so the preference sticks.
  const [autoPrint, setAutoPrint] = useState(true);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(AUTO_PRINT_STORAGE_KEY);
      if (stored !== null) setAutoPrint(stored === '1');
    } catch {
      // ignore
    }
  }, []);
  const toggleAutoPrint = () => {
    setAutoPrint((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(AUTO_PRINT_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Restore last-active section from localStorage so admins land where they
  // left off (usually 'to_fulfill').
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SECTION_STORAGE_KEY);
      if (
        stored &&
        (SECTION_ORDER as string[]).includes(stored)
      ) {
        setSection(stored as SectionKey);
      }
    } catch {
      // ignore
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(SECTION_STORAGE_KEY, section);
    } catch {
      // ignore
    }
    // Selection only makes sense within the current section; clear when
    // jumping tabs.
    setSelected(new Set());
    setBulkResult(null);
    setBulkError('');
    setBuyAllResult(null);
    setUnprintedPdf(null);
  }, [section]);

  // Pull the flavor-by-flavor production roll-up whenever the order list
  // changes (so it stays in sync after labels are bought / status flips).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProductionLoading(true);
      try {
        const response = await fetch('/api/admin/orders/production-summary', {
          cache: 'no-store',
        });
        const json = await response.json();
        if (!cancelled && response.ok) setProduction(json as ProductionSummary);
      } catch {
        // soft fail — card just won't render
      } finally {
        if (!cancelled) setProductionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orders]);

  // Keep the "print unprinted labels (N)" badge in sync. Refreshes on mount and
  // whenever the order list changes (i.e. after labels are bought).
  const refreshUnprintedCount = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/orders/print-unprinted-labels', {
        cache: 'no-store',
      });
      if (response.ok) {
        const json = await response.json();
        setUnprintedCount(typeof json.count === 'number' ? json.count : 0);
      }
    } catch {
      // soft fail — badge just won't update
    }
  }, []);
  useEffect(() => {
    refreshUnprintedCount();
  }, [orders, refreshUnprintedCount]);

  const handleQuickShip = async (orderId: string) => {
    if (shippingRowId) return;
    setShippingRowId(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'failed to mark shipped');
      setSelected((prev) => {
        if (!prev.has(orderId)) return prev;
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'failed to mark shipped');
    } finally {
      setShippingRowId(null);
    }
  };

  const grouped = useMemo(() => {
    const buckets: Record<SectionKey, OrderRow[]> = {
      to_fulfill: [],
      shipped: [],
      completed: [],
      donations: [],
      pending: [],
      cancelled: [],
    };
    ((orders ?? []) as OrderRow[]).forEach((o) => {
      buckets[categorize(o)].push(o);
    });
    // FIFO on to_fulfill (oldest first — that's the order to ship them).
    buckets.to_fulfill.sort(
      (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
    );
    return buckets;
  }, [orders]);

  const sectionOrders = grouped[section];
  const showCheckboxes = section === 'to_fulfill';

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === sectionOrders.length) return new Set();
      return new Set(sectionOrders.map((o) => o.id));
    });
  };

  const handleReconcile = async () => {
    if (reconciling) return;
    if (
      !confirm(
        'Pull recent Stripe Checkout Sessions (last 60 days) and update any pending orders whose payment actually completed? Safe to run repeatedly.',
      )
    )
      return;
    setReconciling(true);
    setReconcileError('');
    setReconcileResult(null);
    try {
      const response = await fetch('/api/admin/orders/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'reconcile failed');
      setReconcileResult(json.summary as ReconcileSummary);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      setReconcileError(err instanceof Error ? err.message : 'reconcile failed');
    } finally {
      setReconciling(false);
    }
  };

  const handleBulkLabels = async () => {
    if (bulkBusy || selected.size === 0) return;
    setBulkBusy('labels');
    setBulkError('');
    setBulkResult(null);
    try {
      const response = await fetch('/api/admin/orders/bulk-buy-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // When auto-printing, stamp these labels printed so they don't also
        // surface in the "print unprinted labels" batch.
        body: JSON.stringify({ orderIds: [...selected], markPrinted: autoPrint }),
      });
      const json = (await response.json()) as
        | BulkLabelResponse
        | { error: string };
      if (!response.ok) {
        throw new Error(
          'error' in json ? json.error : 'bulk-buy-labels failed',
        );
      }
      const result = json as BulkLabelResponse;
      setBulkResult(result);
      if (result.pdfB64) {
        if (autoPrint) {
          printBase64Pdf(result.pdfB64);
        } else {
          const stamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:T]/g, '-');
          downloadBase64Pdf(result.pdfB64, `kiwipop-labels-${stamp}.pdf`);
        }
      }
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await refreshUnprintedCount();
      setSelected(new Set());
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'bulk-buy-labels failed');
    } finally {
      setBulkBusy(null);
    }
  };

  // Buy postage for the entire fulfillment queue in one go. Chunks by the
  // endpoint's 50-order cap and leaves the labels UNprinted — printing is the
  // separate "print unprinted labels" step. Already-labeled orders are skipped
  // server-side, so this is safe to re-run.
  const handleBuyAll = async () => {
    if (buyAllBusy || bulkBusy) return;
    const eligible = grouped.to_fulfill.map((o) => o.id);
    if (eligible.length === 0) return;
    if (
      !confirm(
        `Buy the correct domestic or international labels for all ${eligible.length} order${
          eligible.length === 1 ? '' : 's'
        } in the fulfillment queue? Already-labeled orders are skipped. Print them with "print unprinted labels" when you're ready.`,
      )
    )
      return;
    setBuyAllBusy(true);
    setBulkError('');
    setBulkResult(null);
    setBuyAllResult(null);
    try {
      let succeeded = 0;
      let failed = 0;
      const errors: string[] = [];
      for (let i = 0; i < eligible.length; i += 50) {
        const chunk = eligible.slice(i, i + 50);
        const response = await fetch('/api/admin/orders/bulk-buy-labels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // markPrinted:false — leave these for the batch print step.
          body: JSON.stringify({ orderIds: chunk, markPrinted: false }),
        });
        const json = await response.json();
        if (!response.ok) {
          errors.push(json.error ?? 'bulk-buy-labels failed');
          failed += chunk.length;
          continue;
        }
        const result = json as BulkLabelResponse;
        succeeded += result.succeeded;
        failed += result.failed;
        for (const r of result.results) {
          if (!r.ok) errors.push(`${r.orderId.slice(0, 8)} (${r.error})`);
        }
      }
      setBuyAllResult({ succeeded, failed, errors });
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await refreshUnprintedCount();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'buy all failed');
    } finally {
      setBuyAllBusy(false);
    }
  };

  // Merge every bought-but-not-yet-printed label into one sheet, print (or
  // download) it, and mark them printed so they don't come back.
  const handlePrintUnprinted = async () => {
    if (printingUnprinted) return;
    setPrintingUnprinted(true);
    setBulkError('');
    try {
      const response = await fetch(
        '/api/admin/orders/print-unprinted-labels',
        { method: 'POST' },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'print failed');
      const pdfB64 = json.pdfB64 as string | null;
      if (pdfB64) {
        setUnprintedPdf(pdfB64);
        setUnprintedPrinted(typeof json.count === 'number' ? json.count : 0);
        if (autoPrint) {
          printBase64Pdf(pdfB64);
        } else {
          const stamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:T]/g, '-');
          downloadBase64Pdf(pdfB64, `kiwipop-unprinted-labels-${stamp}.pdf`);
        }
      }
      await refreshUnprintedCount();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'print failed');
    } finally {
      setPrintingUnprinted(false);
    }
  };

  const handleBulkStatus = async (status: 'shipped' | 'completed') => {
    if (bulkBusy || selected.size === 0) return;
    setBulkBusy(status);
    setBulkError('');
    setBulkResult(null);
    try {
      const response = await fetch('/api/admin/orders/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: [...selected], status }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'bulk status failed');
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelected(new Set());
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'bulk status failed');
    } finally {
      setBulkBusy(null);
    }
  };

  const handlePackingSlips = () => {
    if (selected.size === 0) return;
    const ids = [...selected].join(',');
    window.open(
      `/api/admin/orders/packing-slips?ids=${encodeURIComponent(ids)}`,
      '_blank',
    );
  };

  // Prev/next nav inside the modal — walks through the currently-visible
  // section orders.
  const sectionIds = useMemo(
    () => sectionOrders.map((o) => o.id),
    [sectionOrders],
  );
  // Remember where the open order sits in the section. Buying a label flips a
  // `paid` order to `shipped`, so it drops out of the `to_fulfill` list and its
  // id is no longer in `sectionIds` — without this fallback the prev/next nav
  // would dead-end the moment you print a label.
  const lastModalIndexRef = useRef(-1);
  const liveModalIdx = modalOrderId ? sectionIds.indexOf(modalOrderId) : -1;
  if (liveModalIdx >= 0) lastModalIndexRef.current = liveModalIdx;
  // When the order has left the section, its old slot now holds the order that
  // slid up into it — so `next` is that same index, `prev` is one before.
  const modalIdx = liveModalIdx >= 0 ? liveModalIdx : lastModalIndexRef.current;
  const modalInSection = liveModalIdx >= 0;
  const canGoPrev = modalIdx > 0;
  const canGoNext = modalInSection
    ? modalIdx >= 0 && modalIdx < sectionIds.length - 1
    : modalIdx >= 0 && modalIdx < sectionIds.length;
  const goToOrder = (delta: 1 | -1) => {
    if (modalIdx < 0) return;
    // If the open order is still in the section, step relative to it. If it has
    // left, index `modalIdx` already points at its successor, so only `prev`
    // needs to step back.
    const targetIdx = modalInSection
      ? modalIdx + delta
      : delta === 1
        ? modalIdx
        : modalIdx - 1;
    const next = sectionIds[targetIdx];
    if (next) setModalOrderId(next);
  };

  return (
    <AdminLayout>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <h1 className="text-3xl font-bold">Orders</h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <label
            className="orders-autoprint-toggle"
            title="Pop the print dialog automatically when a label is bought"
          >
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={toggleAutoPrint}
            />
            <span>auto-print labels</span>
          </label>
          {section === 'to_fulfill' && grouped.to_fulfill.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleBuyAll}
              disabled={buyAllBusy || !!bulkBusy}
              title="Buy the correct carrier label for every order in the fulfillment queue"
            >
              {buyAllBusy
                ? 'buying all…'
                : `buy all labels (${grouped.to_fulfill.length})`}
            </button>
          )}
          {unprintedCount > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrintUnprinted}
              disabled={printingUnprinted}
              title="Merge every bought-but-not-yet-printed label into one sheet and print it"
            >
              {printingUnprinted
                ? 'printing…'
                : `print unprinted labels (${unprintedCount})`}
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReconcile}
            disabled={reconciling}
          >
            {reconciling ? 'reconciling…' : 'reconcile with stripe'}
          </button>
        </div>
      </div>

      {reconcileError && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>
          {reconcileError}
        </div>
      )}
      {reconcileResult && (
        <div className="alert alert-success" style={{ marginBottom: 12 }}>
          scanned <b>{reconcileResult.scanned_sessions}</b> stripe sessions ·
          marked paid <b>{reconcileResult.marked_paid}</b> · cancelled{' '}
          <b>{reconcileResult.marked_cancelled}</b>
        </div>
      )}
      {buyAllResult && (
        <div className="alert alert-success" style={{ marginBottom: 12 }}>
          bought <b>{buyAllResult.succeeded}</b> label
          {buyAllResult.succeeded === 1 ? '' : 's'}
          {buyAllResult.failed > 0 ? (
            <>
              {' '}
              · <b>{buyAllResult.failed}</b> failed:{' '}
              {buyAllResult.errors.join(' · ')}
            </>
          ) : null}
          {' · '}use <b>print unprinted labels</b> when you're ready to print.
        </div>
      )}
      {unprintedPdf && (
        <div className="alert alert-success" style={{ marginBottom: 12 }}>
          {autoPrint ? 'sent ' : 'downloaded '}
          <b>{unprintedPrinted}</b> label
          {unprintedPrinted === 1 ? '' : 's'}
          {autoPrint ? ' to the printer' : ''}
          <span
            style={{
              display: 'inline-flex',
              gap: 8,
              marginLeft: 10,
              verticalAlign: 'middle',
            }}
          >
            <button
              type="button"
              className="orders-bulk-bar-clear"
              onClick={() => unprintedPdf && printBase64Pdf(unprintedPdf)}
            >
              print again
            </button>
            <button
              type="button"
              className="orders-bulk-bar-clear"
              onClick={() => {
                if (!unprintedPdf) return;
                const stamp = new Date()
                  .toISOString()
                  .slice(0, 19)
                  .replace(/[:T]/g, '-');
                downloadBase64Pdf(
                  unprintedPdf,
                  `kiwipop-unprinted-labels-${stamp}.pdf`,
                );
              }}
            >
              download
            </button>
          </span>
        </div>
      )}

      {/* Section tabs */}
      <div className="orders-section-tabs">
        {SECTION_ORDER.map((key) => {
          const count = grouped[key].length;
          const active = key === section;
          return (
            <button
              key={key}
              type="button"
              className={`orders-section-tab${active ? ' is-active' : ''}`}
              onClick={() => setSection(key)}
              style={
                {
                  '--tab-c': SECTION_COLORS[key],
                } as React.CSSProperties
              }
            >
              <span className="orders-section-tab-label">
                {SECTION_LABELS[key]}
              </span>
              <span className="orders-section-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Bulk action bar — only on to_fulfill, only when something selected */}
      {showCheckboxes && selected.size > 0 && (
        <div className="orders-bulk-bar">
          <div className="orders-bulk-bar-count">
            <strong>{selected.size}</strong> selected
          </div>
          <div className="orders-bulk-bar-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleBulkLabels}
              disabled={!!bulkBusy}
            >
              {bulkBusy === 'labels'
                ? 'buying & merging…'
                : `buy ${selected.size} shipping label${selected.size === 1 ? '' : 's'}`}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePackingSlips}
              disabled={!!bulkBusy}
            >
              print packing slips
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleBulkStatus('shipped')}
              disabled={!!bulkBusy}
            >
              {bulkBusy === 'shipped' ? '…' : 'mark shipped'}
            </button>
            <button
              type="button"
              className="orders-bulk-bar-clear"
              onClick={() => setSelected(new Set())}
            >
              clear
            </button>
          </div>
        </div>
      )}

      {bulkError && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>
          {bulkError}
        </div>
      )}
      {bulkResult && (
        <div className="alert alert-success" style={{ marginBottom: 12 }}>
          bought <b>{bulkResult.succeeded}</b> label
          {bulkResult.succeeded === 1 ? '' : 's'}
          {bulkResult.failed > 0 ? (
            <>
              {' '}
              · <b>{bulkResult.failed}</b> failed:{' '}
              {bulkResult.results
                .filter((r) => !r.ok)
                .map((r) => `${r.orderId.slice(0, 8)} (${r.error})`)
                .join(' · ')}
            </>
          ) : null}
          {bulkResult.pdfB64
            ? autoPrint
              ? ' · sending combined PDF to printer'
              : ' · combined PDF downloading'
            : ''}
          {bulkResult.pdfB64 && (
            <span
              style={{
                display: 'inline-flex',
                gap: 8,
                marginLeft: 10,
                verticalAlign: 'middle',
              }}
            >
              <button
                type="button"
                className="orders-bulk-bar-clear"
                onClick={() =>
                  bulkResult.pdfB64 && printBase64Pdf(bulkResult.pdfB64)
                }
              >
                print again
              </button>
              <button
                type="button"
                className="orders-bulk-bar-clear"
                onClick={() => {
                  if (!bulkResult.pdfB64) return;
                  const stamp = new Date()
                    .toISOString()
                    .slice(0, 19)
                    .replace(/[:T]/g, '-');
                  downloadBase64Pdf(
                    bulkResult.pdfB64,
                    `kiwipop-labels-${stamp}.pdf`,
                  );
                }}
              >
                download
              </button>
            </span>
          )}
        </div>
      )}

      {section === 'to_fulfill' && (
        <ProductionSummaryCard
          summary={production}
          loading={productionLoading}
        />
      )}

      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : sectionOrders.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--admin-text-soft)' }}>
            No {SECTION_LABELS[section]} orders.
          </p>
        ) : (
          <table className="table orders-table">
            <thead>
              <tr>
                {showCheckboxes && (
                  <th style={{ width: 32 }}>
                    <input
                      type="checkbox"
                      aria-label="select all"
                      checked={
                        selected.size === sectionOrders.length &&
                        sectionOrders.length > 0
                      }
                      onChange={toggleAll}
                    />
                  </th>
                )}
                <th>Customer</th>
                <th>Location</th>
                <th>Email</th>
                <th>Total</th>
                <th>Age</th>
                <th>Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sectionOrders.map((order) => {
                const checked = selected.has(order.id);
                return (
                  <tr
                    key={order.id}
                    onClick={() => setModalOrderId(order.id)}
                    style={{ cursor: 'pointer' }}
                    className={checked ? 'is-selected' : ''}
                  >
                    {showCheckboxes && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(order.id)}
                          aria-label={`select order ${order.id.slice(0, 8)}`}
                        />
                      </td>
                    )}
                    <td className="text-sm">
                      {fullName(order.shipping_address) || '—'}
                    </td>
                    <td className="text-sm">
                      {order.shipping_address?.city
                        ? `${order.shipping_address.city}, ${order.shipping_address.state ?? ''}`
                        : '—'}
                    </td>
                    <td className="text-sm">{order.user_email || 'N/A'}</td>
                    <td>{formatCentsToUSD(order.total_cents)}</td>
                    <td className="text-sm">{ageLabel(order.created_at)}</td>
                    <td className="text-sm font-mono" style={{ opacity: 0.65 }}>
                      {order.id.slice(0, 8)}…
                    </td>
                    <td
                      className="text-sm"
                      style={{ color: 'var(--admin-text-soft)' }}
                      onClick={(e) => {
                        if (showCheckboxes) e.stopPropagation();
                      }}
                    >
                      {showCheckboxes ? (
                        <button
                          type="button"
                          className="orders-row-ship-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickShip(order.id);
                          }}
                          disabled={shippingRowId === order.id}
                          title="mark this order as shipped"
                        >
                          {shippingRowId === order.id ? '…' : 'ship ✓'}
                        </button>
                      ) : (
                        'open ›'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOrderId && (
        <OrderModal
          orderId={modalOrderId}
          autoPrint={autoPrint}
          onClose={() => setModalOrderId(null)}
          onChanged={async () => {
            await refetch();
            await queryClient.invalidateQueries({ queryKey: ['orders'] });
          }}
          onPrev={canGoPrev ? () => goToOrder(-1) : null}
          onNext={canGoNext ? () => goToOrder(1) : null}
        />
      )}
    </AdminLayout>
  );
}

/* -----------------------------------------------------------
   PRODUCTION SUMMARY — flavor counts for the to-fulfill bucket
   ----------------------------------------------------------- */

function ProductionSummaryCard({
  summary,
  loading,
}: {
  summary: ProductionSummary | null;
  loading: boolean;
}) {
  if (loading && !summary) {
    return (
      <div className="orders-production-card">
        <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-soft)' }}>
          tallying flavors…
        </p>
      </div>
    );
  }
  if (!summary || summary.entries.length === 0) {
    return (
      <div className="orders-production-card">
        <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-soft)' }}>
          nothing to produce — to-fulfill is empty.
        </p>
      </div>
    );
  }

  return (
    <div className="orders-production-card">
      <div className="orders-production-header">
        <h2 className="orders-production-title">to produce</h2>
        <div className="orders-production-stats">
          <span>
            <strong>{summary.totalJars}</strong> jars
          </span>
          <span style={{ color: 'var(--admin-text-soft)' }}>·</span>
          <span>
            <strong>{summary.orderCount}</strong> order
            {summary.orderCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      <ul className="orders-production-list">
        {summary.entries.map((entry) => (
          <li key={entry.productId} className="orders-production-item">
            <span className="orders-production-qty">{entry.totalQuantity}</span>
            <span className="orders-production-name">
              {entry.name}
              {entry.sku ? (
                <span className="orders-production-sku"> {entry.sku}</span>
              ) : null}
            </span>
            <span className="orders-production-orders">
              {entry.orderCount} order{entry.orderCount === 1 ? '' : 's'}
            </span>
          </li>
        ))}
      </ul>

      {summary.flavorEntries.length > 0 && (
        <div className="orders-flavor-breakdown">
          <div className="orders-flavor-breakdown-header">
            <h3 className="orders-flavor-breakdown-title">raw pops by flavor</h3>
            <span className="orders-flavor-breakdown-total">
              <strong>{summary.totalPops}</strong> pops total
            </span>
          </div>
          <ul className="orders-flavor-list">
            {summary.flavorEntries.map((f) => (
              <li
                key={f.flavorSku}
                className="orders-flavor-item"
                style={{ '--flavor-c': f.color } as React.CSSProperties}
              >
                <span className="orders-flavor-swatch" />
                <span className="orders-flavor-qty">{f.totalPops}</span>
                <span className="orders-flavor-label">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* -----------------------------------------------------------
   ORDER MODAL — full shipping/items detail + actions + nav
   ----------------------------------------------------------- */

interface OrderModalProps {
  orderId: string;
  autoPrint: boolean;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}

function OrderModal({
  orderId,
  autoPrint,
  onClose,
  onChanged,
  onPrev,
  onNext,
}: OrderModalProps) {
  const queryClient = useQueryClient();
  const { data: order, refetch: refetchOrder } = useOrderWithItems(orderId);

  const [shipment, setShipment] = useState<ShipmentRow | null>(null);
  const [shipmentLoading, setShipmentLoading] = useState(true);

  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string>('');

  const [labelLoading, setLabelLoading] = useState(false);
  const [labelError, setLabelError] = useState<string>('');
  const [labelMeta, setLabelMeta] = useState<{
    rateCents?: number;
    serviceLevel?: string;
  }>({});

  // Esc to close, ←/→ to nav, lock scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext]);

  // Reset modal state when navigating between orders
  useEffect(() => {
    setShipment(null);
    setShipmentLoading(true);
    setLabelError('');
    setLabelMeta({});
    setStatusError('');
    setPendingStatus(null);
  }, [orderId]);

  // Fetch existing shipment record
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setShipmentLoading(true);
      try {
        const response = await fetch(`/api/admin/orders/${orderId}/shipment`, {
          cache: 'no-store',
        });
        const json = await response.json();
        if (!cancelled && response.ok) {
          setShipment(json.shipment as ShipmentRow | null);
        }
      } catch {
        // soft fail
      } finally {
        if (!cancelled) setShipmentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const isDonation = order?.shipping_address?.kind === 'donation';

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    setStatusError('');
    setPendingStatus(newStatus);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'Failed to update order');
      }
      await refetchOrder();
      await queryClient.invalidateQueries({ queryKey: ['order', order.id] });
      await onChanged();
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : 'Failed to update order',
      );
    } finally {
      setPendingStatus(null);
    }
  };

  const handleBuyLabel = async () => {
    if (!order || labelLoading) return;
    setLabelLoading(true);
    setLabelError('');
    try {
      const response = await fetch(
        `/api/admin/orders/${order.id}/buy-label`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Stamp printed when we're about to auto-print, so it doesn't also
          // land in the "print unprinted labels" batch.
          body: JSON.stringify({ markPrinted: autoPrint }),
        },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'failed to buy label');
      const boughtShipment = json.shipment as ShipmentRow;
      setShipment(boughtShipment);
      setLabelMeta({
        rateCents: json.rateCents,
        serviceLevel: json.serviceLevel,
      });
      // Send the fresh label straight to the printer when auto-print is on.
      if (autoPrint && boughtShipment?.label_url) {
        printPdfUrl(boughtShipment.label_url);
      }
      await refetchOrder();
      await onChanged();
    } catch (err) {
      setLabelError(err instanceof Error ? err.message : 'failed to buy label');
    } finally {
      setLabelLoading(false);
    }
  };

  return (
    <div className="orders-modal-overlay" onClick={onClose}>
      <div
        className="orders-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="order details"
      >
        <div className="orders-modal-nav">
          <button
            type="button"
            className="orders-modal-nav-btn"
            onClick={() => onPrev && onPrev()}
            disabled={!onPrev}
            aria-label="previous order"
            title="previous (←)"
          >
            ‹
          </button>
          <button
            type="button"
            className="orders-modal-nav-btn"
            onClick={() => onNext && onNext()}
            disabled={!onNext}
            aria-label="next order"
            title="next (→)"
          >
            ›
          </button>
          <button
            type="button"
            className="orders-modal-close"
            onClick={onClose}
            aria-label="close"
            title="close (Esc)"
          >
            ×
          </button>
        </div>

        {!order ? (
          <p style={{ padding: '2rem' }}>loading…</p>
        ) : (
          <>
            <header className="orders-modal-header">
              <span
                className="orders-modal-tag"
                style={{
                  color: SECTION_COLORS[categorize(order as OrderRow)],
                  borderColor: SECTION_COLORS[categorize(order as OrderRow)],
                }}
              >
                {SECTION_LABELS[categorize(order as OrderRow)]}
              </span>
              <h2 className="card-title" style={{ margin: 0 }}>
                Order {order.id.slice(0, 8)}…
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'var(--admin-text-soft)',
                  fontFamily: 'var(--mono)',
                }}
              >
                placed {new Date(order.created_at).toLocaleString()}
              </p>
            </header>

            <div className="orders-modal-grid">
              <section>
                <h3 className="orders-modal-section-title">Customer</h3>
                <p style={{ margin: '0 0 4px' }}>
                  <strong>{fullName(order.shipping_address) || '—'}</strong>
                </p>
                <p style={{ margin: 0, fontSize: 13 }}>
                  {order.user_email ?? 'no email'}
                </p>

                {isDonation ? (
                  <>
                    <h3 className="orders-modal-section-title" style={{ marginTop: 18 }}>
                      Donation
                    </h3>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      <em>no shipping — fundraiser tip</em>
                    </p>
                    {order.shipping_address?.donationMessage && (
                      <p
                        style={{
                          marginTop: 8,
                          padding: '8px 10px',
                          background: 'var(--admin-surface-soft)',
                          borderRadius: 8,
                          fontSize: 13,
                          fontStyle: 'italic',
                          borderLeft: '3px solid var(--c-uv)',
                        }}
                      >
                        “{order.shipping_address.donationMessage}”
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="orders-modal-section-title" style={{ marginTop: 18 }}>
                      Ship to
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                      {order.shipping_address?.address || '—'}
                      <br />
                      {order.shipping_address?.city}
                      {order.shipping_address?.city ? ', ' : ''}
                      {order.shipping_address?.state}{' '}
                      {order.shipping_address?.zip}
                      <br />
                      {order.shipping_address?.country || 'US'}
                    </p>
                  </>
                )}
              </section>

              <section>
                <h3 className="orders-modal-section-title">Items</h3>
                <div className="orders-modal-items">
                  {order.items?.length ? (
                    order.items.map((item: any) => (
                      <div key={item.id} className="orders-modal-item">
                        <span className="orders-modal-item-name">
                          {item.products?.name ?? 'Unknown'}{' '}
                          <span style={{ color: 'var(--admin-text-soft)' }}>
                            × {item.quantity}
                          </span>
                        </span>
                        <span className="orders-modal-item-price">
                          {formatCentsToUSD(
                            (item.price_cents ?? 0) * (item.quantity ?? 1),
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 13 }}>no items</p>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    marginTop: 10,
                    borderTop: '1px solid var(--admin-border)',
                    fontWeight: 700,
                  }}
                >
                  <span>Total</span>
                  <span>{formatCentsToUSD(order.total_cents)}</span>
                </div>
                {order.stripe_payment_intent_id && (
                  <p
                    style={{
                      marginTop: 10,
                      fontSize: 11,
                      fontFamily: 'var(--mono)',
                      color: 'var(--admin-text-soft)',
                      wordBreak: 'break-all',
                    }}
                  >
                    pi: {order.stripe_payment_intent_id}
                  </p>
                )}
              </section>
            </div>

            {!isDonation && (
              <section className="orders-modal-shipping">
                <h3 className="orders-modal-section-title" style={{ marginTop: 0 }}>
                  Shipping label
                </h3>

                {shipmentLoading ? (
                  <p style={{ fontSize: 13 }}>checking…</p>
                ) : shipment && shipment.label_url ? (
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 13 }}>
                      <strong>{(shipment.carrier || '').toUpperCase()}</strong>{' '}
                      · tracking{' '}
                      <span style={{ fontFamily: 'var(--mono)' }}>
                        {shipment.tracking_number}
                      </span>
                      {shipment.shipped_at && (
                        <>
                          {' '}
                          · shipped{' '}
                          {new Date(shipment.shipped_at).toLocaleDateString()}
                        </>
                      )}
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        shipment.label_url && printPdfUrl(shipment.label_url)
                      }
                    >
                      Print label
                    </button>{' '}
                    <a
                      href={shipment.label_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      Open PDF ↗
                    </a>{' '}
                    <a
                      href={`/api/admin/orders/packing-slips?ids=${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      Packing slip
                    </a>
                  </div>
                ) : (
                  <div>
                    <p
                      style={{
                        margin: '0 0 10px',
                        fontSize: 13,
                        color: 'var(--admin-text-soft)',
                      }}
                    >
                      U.S. orders use USPS via ShipStation. Canada and other
                      international orders use the cheapest configured UPS,
                      DHL Express, or FedEx rate via EasyPost, including customs
                      paperwork. Buying a label marks the order shipped.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleBuyLabel}
                      disabled={
                        labelLoading ||
                        (order.status !== 'paid' && order.status !== 'shipped')
                      }
                    >
                      {labelLoading
                        ? 'buying label…'
                        : order.status === 'paid' || order.status === 'shipped'
                          ? 'buy shipping label'
                          : `cannot buy — order is ${order.status}`}
                    </button>{' '}
                    <a
                      href={`/api/admin/orders/packing-slips?ids=${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      Packing slip
                    </a>
                    {labelError && (
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          color: 'var(--c-magenta-text)',
                        }}
                      >
                        {labelError}
                      </p>
                    )}
                    {labelMeta.rateCents != null && (
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: 'var(--admin-text-soft)',
                        }}
                      >
                        bought {labelMeta.serviceLevel} for{' '}
                        {formatCentsToUSD(labelMeta.rateCents)}
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}

            <section className="orders-modal-status">
              <h3 className="orders-modal-section-title" style={{ marginTop: 0 }}>
                Status
              </h3>
              <select
                value={pendingStatus ?? order.status}
                disabled={!!pendingStatus}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                className="form-select"
                style={{ maxWidth: 320 }}
              >
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="shipped">shipped</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled (refunds Stripe)</option>
              </select>
              {statusError && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: 'var(--c-magenta-text)',
                  }}
                >
                  {statusError}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
