import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { menuItems } from '../data/menu';
import type { CartItem } from '../types/caribu';
import styles from './Cart.module.css';

function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();
  const { selection } = item;

  const starter = menuItems.find(m => m.id === selection.starterId);
  const main = menuItems.find(m => m.id === selection.mainId);
  const side = menuItems.find(m => m.id === selection.sideId);

  return (
    <div className={styles.cartItem}>
      <div className={styles.cartItemImg}>
        {main && (
          <img src={main.image} alt={main.name} />
        )}
        <div className={styles.cartItemSizeTag}>
          {selection.sizeId === 'medium' ? 'M' : 'L'}
        </div>
      </div>

      <div className={styles.cartItemDetails}>
        <div className={styles.cartItemTitle}>
          {selection.sizeId === 'large' ? 'Large' : 'Medium'} Food Box
        </div>
        <div className={styles.cartItemComps}>
          {selection.omitStarter ? (
            <span className={styles.cartItemComp}>
              <span className={styles.cartItemCompCat}>Starter:</span>
              <span className={styles.cartItemCompSkip}>Skipped — {selection.boostTarget} upsized</span>
            </span>
          ) : starter ? (
            <span className={styles.cartItemComp}>
              <span className={styles.cartItemCompCat}>Starter:</span> {starter.name}
            </span>
          ) : null}
          {main && (
            <span className={styles.cartItemComp}>
              <span className={styles.cartItemCompCat}>Main:</span> {main.name}
            </span>
          )}
          {side && (
            <span className={styles.cartItemComp}>
              <span className={styles.cartItemCompCat}>Side:</span> {side.name}
            </span>
          )}
        </div>
        <div className={styles.cartItemPrice}>£{item.unitPrice.toFixed(2)} each</div>
      </div>

      <div className={styles.cartItemActions}>
        <div className={styles.quantityControl}>
          <button
            className={styles.qtyBtn}
            onClick={() => updateQuantity(item.id, -1)}
            disabled={item.quantity <= 1}
          >
            <Minus size={14} />
          </button>
          <span className={styles.qtyValue}>{item.quantity}</span>
          <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, 1)}>
            <Plus size={14} />
          </button>
        </div>
        <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>
          <Trash2 size={15} />
        </button>
      </div>

      <div className={styles.cartItemTotal}>
        £{(item.unitPrice * item.quantity).toFixed(2)}
      </div>
    </div>
  );
}

export function Cart() {
  const { cart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <ShoppingBag size={40} />
            </div>
            <h2>Your cart is empty</h2>
            <p>Start building your perfect Caribbean food box.</p>
            <Link to="/builder" className="btn-primary">
              Build a Box <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className={styles.pageHead}>
          <h1 className={styles.title}>Your Cart</h1>
          <span className={styles.count}>{cartCount} {cartCount === 1 ? 'box' : 'boxes'}</span>
        </div>

        <div className={styles.layout}>
          <div className={styles.items}>
            {cart.map(item => (
              <CartItemRow key={item.id} item={item} />
            ))}
            <div className={styles.addMore}>
              <Link to="/builder" className={styles.addMoreLink}>
                <Package size={16} />
                Add another box
              </Link>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.orderSummary}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              <div className={styles.summaryRows}>
                {cart.map(item => {
                  const main = menuItems.find(m => m.id === item.selection.mainId);
                  return (
                    <div key={item.id} className={styles.summaryRow}>
                      <span>
                        {item.selection.sizeId === 'large' ? 'Large' : 'Medium'} Box ×{item.quantity}
                        {main && <span className={styles.summaryRowSub}> — {main.name}</span>}
                      </span>
                      <span>£{(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className={styles.summaryDivider} />

              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span className={styles.totalAmount}>£{cartTotal.toFixed(2)}</span>
              </div>

              <button
                className={`btn-primary ${styles.checkoutBtn}`}
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>

              <div className={styles.summaryNote}>
                Delivery and pickup options on the next step.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
