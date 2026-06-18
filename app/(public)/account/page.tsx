'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { formatCentsToUSD } from '@/lib/format';
import { POINTS_PER_REWARD, REWARD_VALUE_CENTS } from '@/lib/rewards';

interface RewardCode {
  id: string;
  code: string;
  amount_off_cents: number;
  redeemed_at: string | null;
  created_at: string;
}

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--bone)',
};

export default function AccountPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [codes, setCodes] = useState<RewardCode[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState('');
  const [justRedeemed, setJustRedeemed] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/signin?next=/account');
  }, [loading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    const [codesRes, ordersRes] = await Promise.all([
      supabase
        .from('reward_codes')
        .select('id, code, amount_off_cents, redeemed_at, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('id, status, total_cents, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);
    setCodes((codesRes.data ?? []) as RewardCode[]);
    setOrders((ordersRes.data ?? []) as OrderRow[]);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const balance = profile?.points_balance ?? 0;
  const canRedeem = balance >= POINTS_PER_REWARD;
  const progress = Math.min(100, Math.round((balance / POINTS_PER_REWARD) * 100));

  const handleRedeem = async () => {
    setError('');
    setRedeeming(true);
    setJustRedeemed(null);
    try {
      const res = await fetch('/api/account/redeem-points', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Redeem failed');
      setJustRedeemed(json.code as string);
      // Refresh the profile (points balance) and reward codes.
      await supabase.auth.refreshSession();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Redeem failed');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="page-container">
        <p style={{ color: 'var(--bone)' }}>loading…</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <p className="hero-tagline" style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}>
        // your account
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          letterSpacing: '-0.03em',
          textTransform: 'lowercase',
          color: 'var(--lime)',
          marginBottom: '0.25rem',
        }}
      >
        {profile?.display_name || user.email}
      </h1>
      <p style={{ ...labelStyle, marginBottom: '2rem' }}>
        {profile?.account_type === 'wholesale' ? 'wholesale account' : 'retail account'}
        {' · '}
        <button
          type="button"
          onClick={() => signOut()}
          style={{ ...labelStyle, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          sign out
        </button>
      </p>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Rewards */}
      <div className="card" style={{ background: 'var(--midnight)', padding: '2rem', marginBottom: '1.5rem' }}>
        <p style={labelStyle}>// kiwi rewards</p>
        <div
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 800,
            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
            color: 'var(--lime)',
            lineHeight: 1,
            margin: '0.5rem 0',
          }}
        >
          {balance.toLocaleString()} <span style={{ fontSize: '1.5rem' }}>pts</span>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
            margin: '1rem 0 0.5rem',
          }}
        >
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--lime)' }} />
        </div>
        <p style={{ color: 'var(--paper)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          {canRedeem
            ? `you've got enough to redeem ${formatCentsToUSD(REWARD_VALUE_CENTS)} off.`
            : `${POINTS_PER_REWARD - balance} more points to your next ${formatCentsToUSD(
                REWARD_VALUE_CENTS
              )} reward.`}
        </p>
        <button
          type="button"
          onClick={handleRedeem}
          disabled={!canRedeem || redeeming}
          className="btn btn-primary"
          style={{ marginTop: '1rem', opacity: canRedeem ? 1 : 0.5 }}
        >
          {redeeming
            ? 'redeeming…'
            : `redeem ${POINTS_PER_REWARD} pts → ${formatCentsToUSD(REWARD_VALUE_CENTS)} off`}
        </button>
        {justRedeemed && (
          <p style={{ color: 'var(--lime)', fontFamily: 'var(--mono)', fontSize: 13, marginTop: '1rem' }}>
            done — your code <strong>{justRedeemed}</strong> is ready. apply it at checkout.
          </p>
        )}
      </div>

      {/* Reward codes */}
      {codes.length > 0 && (
        <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <p style={{ ...labelStyle, marginBottom: '1rem' }}>// your reward codes</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {codes.map((c) => (
              <div
                key={c.id}
                style={{
                  border: '1px solid var(--lime)',
                  borderRadius: 8,
                  padding: '0.85rem 1rem',
                  background: 'var(--midnight)',
                  opacity: c.redeemed_at ? 0.45 : 1,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--lime)',
                    textDecoration: c.redeemed_at ? 'line-through' : 'none',
                  }}
                >
                  {c.code}
                </div>
                <div style={{ ...labelStyle, marginTop: '0.35rem' }}>
                  {formatCentsToUSD(c.amount_off_cents)} off{c.redeemed_at ? ' · used' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders */}
      <div className="card" style={{ padding: '2rem' }}>
        <p style={{ ...labelStyle, marginBottom: '1rem' }}>// recent orders</p>
        {orders.length === 0 ? (
          <p style={{ color: 'var(--bone)', fontFamily: 'var(--mono)', fontSize: 13 }}>
            no orders yet.{' '}
            <Link href="/" style={{ color: 'var(--lime)' }}>
              grab some pops →
            </Link>
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>date</th>
                <th>status</th>
                <th>total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>{o.status}</td>
                  <td>{formatCentsToUSD(o.total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
