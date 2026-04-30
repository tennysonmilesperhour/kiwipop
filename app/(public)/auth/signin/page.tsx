'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const SAFE_NEXT = /^\/[a-zA-Z0-9/_\-?=&]*$/;

export default function SignIn() {
  const { signIn } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get('next');
  const next = rawNext && SAFE_NEXT.test(rawNext) ? rawNext : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push(next);
    } catch (err) {
      setError((err as Error).message || 'failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 460 }}>
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // sign in
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          letterSpacing: '-0.03em',
          textTransform: 'lowercase',
          marginBottom: '2rem',
        }}
      >
        welcome back.
      </h1>

      <div className="card">
        {next === '/checkout' && (
          <div className="alert" style={{ marginBottom: '1rem' }}>
            signing in is optional —{' '}
            <Link
              href="/checkout"
              style={{ color: 'var(--lime)', fontWeight: 700 }}
            >
              continue as a guest →
            </Link>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
            style={{ marginBottom: '1rem' }}
          >
            {loading ? 'wait…' : 'sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--bone)', fontSize: 12 }}>
          no account?{' '}
          <Link
            href="/auth/signup"
            style={{ color: 'var(--lime)', fontWeight: 700 }}
          >
            sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
