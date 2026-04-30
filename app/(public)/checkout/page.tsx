'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { formatCentsToUSD } from '@/lib/format';
import {
  checkoutRequestSchema,
  type ShippingAddress,
} from '@/lib/validators';

interface CheckoutResponse {
  orderId?: string;
  checkoutUrl?: string | null;
  sessionId?: string;
  error?: string;
  issues?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
}

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.getTotalPrice());
  const router = useRouter();
  const { user, profile } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasEditedEmail, setHasEditedEmail] = useState(false);

  const [email, setEmail] = useState('');
  const [address, setAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });

  useEffect(() => {
    if (!hasEditedEmail && user?.email && !email) {
      setEmail(user.email);
    }
    if (
      profile?.display_name &&
      !address.firstName &&
      !address.lastName
    ) {
      const [first, ...rest] = profile.display_name.split(' ');
      setAddress((prev) => ({
        ...prev,
        firstName: first ?? '',
        lastName: rest.join(' '),
      }));
    }
  }, [user, profile, hasEditedEmail, email, address.firstName, address.lastName]);

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <p className="alert alert-error">Your cart is empty</p>
        <button className="btn btn-primary" onClick={() => router.push('/')}>
          Browse products
        </button>
      </div>
    );
  }

  const updateAddress = <K extends keyof ShippingAddress>(
    key: K,
    value: ShippingAddress[K]
  ) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      email,
      shippingAddress: address,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    const validation = checkoutRequestSchema.safeParse(payload);
    if (!validation.success) {
      const first = validation.error.issues[0];
      setError(first?.message ?? 'Please review your details');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const json = (await response.json()) as CheckoutResponse;

      if (!response.ok || !json.checkoutUrl) {
        setError(json.error ?? 'Could not start checkout — please try again.');
        setSubmitting(false);
        return;
      }

      window.location.href = json.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not start checkout'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-container">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {!user && (
        <div
          className="alert mb-4"
          style={{ background: '#f4f4f5', borderRadius: 8, padding: 12 }}
        >
          <strong>Checking out as a guest.</strong> No account needed —
          we&apos;ll email your receipt and a tracking link.{' '}
          <Link
            href={`/auth/signin?next=${encodeURIComponent('/checkout')}`}
            className="text-primary font-bold"
          >
            Have an account? Sign in
          </Link>
          .
        </div>
      )}

      {user && (
        <div
          className="alert mb-4"
          style={{
            background: '#ecfdf5',
            borderRadius: 8,
            padding: 12,
          }}
        >
          Signed in as <strong>{user.email}</strong>. This order will be saved
          to your account.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card">
            <h2 className="card-title">Shipping Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  value={address.firstName}
                  onChange={(e) => updateAddress('firstName', e.target.value)}
                  className="form-input"
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  value={address.lastName}
                  onChange={(e) => updateAddress('lastName', e.target.value)}
                  className="form-input"
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setHasEditedEmail(true);
                }}
                className="form-input"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address *</label>
              <input
                type="text"
                value={address.address}
                onChange={(e) => updateAddress('address', e.target.value)}
                className="form-input"
                required
                autoComplete="street-address"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => updateAddress('city', e.target.value)}
                  className="form-input"
                  required
                  autoComplete="address-level2"
                />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => updateAddress('state', e.target.value)}
                  className="form-input"
                  required
                  autoComplete="address-level1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">ZIP *</label>
                <input
                  type="text"
                  value={address.zip}
                  onChange={(e) => updateAddress('zip', e.target.value)}
                  className="form-input"
                  required
                  autoComplete="postal-code"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Country *</label>
              <select
                value={address.country}
                onChange={(e) => updateAddress('country', e.target.value)}
                className="form-select"
                autoComplete="country"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="MX">Mexico</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-full"
            >
              {submitting ? 'Redirecting to payment…' : 'Continue to payment'}
            </button>
          </form>
        </div>

        <div className="cart-summary">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>

          <div className="mb-4 max-h-60 overflow-y-auto">
            {items.map((item) => (
              <div key={item.productId} className="summary-row text-sm">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>{formatCentsToUSD(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatCentsToUSD(total)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>Calculated at next step</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total:</span>
              <span>{formatCentsToUSD(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
