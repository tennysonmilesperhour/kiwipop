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
      setError((err as Error).message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>

        {next === '/checkout' && (
          <div
            className="alert mb-4"
            style={{ background: '#f4f4f5', padding: 12, borderRadius: 8 }}
          >
            Signing in is optional — you can also{' '}
            <Link href="/checkout" className="text-primary font-bold">
              continue as a guest
            </Link>
            .
          </div>
        )}

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full mb-4"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-600">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-primary font-bold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
