'use client';

import Image from 'next/image';
import { CartItem as CartItemType, useCart } from '@/lib/store';
import { formatCentsToUSD } from '@/lib/stripe';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        {item.image ? (
          <Image src={item.image} alt={item.name} width={80} height={80} />
        ) : (
          <div className="image-placeholder">No Image</div>
        )}
      </div>
      <div className="cart-item-details">
        <h4 className="cart-item-name">{item.name}</h4>
        {item.isPreorder && (
          <p className="preorder-label">Preorder</p>
        )}
        <p className="cart-item-price">{formatCentsToUSD(item.price)}</p>
      </div>
      <div className="cart-item-actions">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) =>
            updateQuantity(item.productId, parseInt(e.target.value, 10))
          }
          className="quantity-input"
        />
        <button
          onClick={() => removeItem(item.productId)}
          className="remove-button"
        >
          Remove
        </button>
      </div>
      <div className="cart-item-total">
        {formatCentsToUSD(item.price * item.quantity)}
      </div>
    </div>
  );
}
