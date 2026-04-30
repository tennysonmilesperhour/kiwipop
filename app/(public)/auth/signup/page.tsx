'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, displayName);
      setSuccess(true);
      setTimeout(() => router.push('/auth/signin'), 1800);
    } catch (err) {
      setError((err as Error).message || 'failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-container" style={{ maxWidth: 460, textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 800,
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            letterSpacing: '-0.03em',
            textTransform: 'lowercase',
            color: 'var(--lime)',
          }}
        >
          you&apos;re in.
        </h1>
        <p style={{ color: 'var(--bone)', marginTop: '0.5rem' }}>
          check your inbox if confirmation email is on. redirecting…
        </p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 460 }}>
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // sign up
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
        join the list.
      </h1>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="form-input"
              required
              autoComplete="nickname"
            />
          </div>

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
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
            style={{ marginBottom: '1rem' }}
          >
            {loading ? 'wait…' : 'create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--bone)', fontSize: 12 }}>
          already in?{' '}
          <Link
            href="/auth/signin"
            style={{ color: 'var(--lime)', fontWeight: 700 }}
          >
            sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
