'use client';

import { useState } from 'react';
import { useCart } from '@/lib/store';
import { useCreateOrder } from '@/lib/hooks';
import { formatCentsToUSD } from '@/lib/stripe';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCart();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const router = useRouter();
  const total = getTotalPrice();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('US');
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div>
        <p className="alert alert-error">Your cart is empty</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !firstName || !lastName || !address || !city || !state || !zip) {
      setError('Please fill in all required fields');
      return;
    }

    createOrder(
      {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          isPreorder: item.isPreorder,
        })),
        userEmail: email,
        shippingAddress: {
          firstName,
          lastName,
          address,
          city,
          state,
          zip,
          country,
        },
      },
      {
        onSuccess: (order) => {
          clearCart();
          router.push(`/order-confirmation/${order.id}`);
        },
        onError: (err) => {
          setError((err as Error).message || 'Failed to create order');
        },
      }
    );
  };

  return (
    <div className="checkout-container">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

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
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">ZIP *</label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Country *</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="form-select"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="MX">Mexico</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary btn-full"
            >
              {isPending ? 'Processing...' : 'Continue to Payment'}
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
              <span>TBD</span>
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
