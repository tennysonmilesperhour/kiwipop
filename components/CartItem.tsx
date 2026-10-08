'use client';

import Image from 'next/image';
import { CartItem as CartItemType, useCart } from '@/lib/store';
import { formatCentsToUSD } from '@/lib/format';

interface CartItemProps {
  item: CartItemType;
  soldOut?: boolean;
  preorder?: boolean;
  note?: string | null;
}

export function CartItem({ item, soldOut = false, preorder = false, note = null }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        {item.image ? (
          <Image src={item.image} alt={item.name} width={80} height={80} />
        ) : (
          <div className="image-placeholder">●</div>
        )}
      </div>
      <div className="cart-item-details">
        {soldOut ? (
          <span className="status-badge sold-out">Sold out</span>
        ) : preorder ? (
          <span className="status-badge preorder">Preorder</span>
        ) : null}
        <h4 className="cart-item-name">{item.name}</h4>
        <p className="cart-item-price">{formatCentsToUSD(item.price)}</p>
        {note ? <p className="fulfillment-note">{note}</p> : null}
      </div>
      <div className="cart-item-actions">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) =>
            updateQuantity(item.productId, parseInt(e.target.value, 10) || 0)
          }
          className="form-input"
          style={{ width: 70, textAlign: 'center' }}
          aria-label={`quantity of ${item.name}`}
        />
        <button
          type="button"
          onClick={() => removeItem(item.productId)}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: 10 }}
        >
          remove
        </button>
        <div className="cart-item-total">
          {formatCentsToUSD(item.price * item.quantity)}
        </div>
      </div>
    </div>
  );
}
