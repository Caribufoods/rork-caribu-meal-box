import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, User, FileText, Truck, Store, ArrowRight, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import styles from './Checkout.module.css';

export function Checkout() {
  const { details, updateDetails, cartTotal, cartCount, submitOrder } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!details.name.trim()) errs.name = 'Your name is required';
    if (!details.phone.trim()) errs.phone = 'Phone number is required';
    if (details.fulfilment === 'delivery' && !details.address.trim()) {
      errs.address = 'Delivery address is required';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await submitOrder();
      navigate('/confirmation');
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className={styles.pageHead}>
          <span className="section-label">Almost there</span>
          <h1 className={styles.title}>Your Details</h1>
        </div>

        <div className={styles.layout}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formCard}>
              <h2 className={styles.cardTitle}>Fulfilment Method</h2>
              <div className={styles.fulfilmentOptions}>
                <button
                  type="button"
                  className={`${styles.fulfilmentOption} ${details.fulfilment === 'delivery' ? styles.fulfilmentOptionActive : ''}`}
                  onClick={() => updateDetails({ fulfilment: 'delivery' })}
                >
                  <Truck size={20} />
                  <div>
                    <div className={styles.fulfilmentName}>Home Delivery</div>
                    <div className={styles.fulfilmentDesc}>We'll bring it to your door</div>
                  </div>
                </button>
                <button
                  type="button"
                  className={`${styles.fulfilmentOption} ${details.fulfilment === 'pickup' ? styles.fulfilmentOptionActive : ''}`}
                  onClick={() => updateDetails({ fulfilment: 'pickup' })}
                >
                  <Store size={20} />
                  <div>
                    <div className={styles.fulfilmentName}>Collect In Store</div>
                    <div className={styles.fulfilmentDesc}>Pick up with your QR code</div>
                  </div>
                </button>
              </div>
            </div>

            <div className={styles.formCard}>
              <h2 className={styles.cardTitle}>Contact Information</h2>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label}>
                    <User size={14} />
                    Full Name
                  </label>
                  <input
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    type="text"
                    placeholder="e.g. Marcus Williams"
                    value={details.name}
                    onChange={e => {
                      updateDetails({ name: e.target.value });
                      setErrors(prev => ({ ...prev, name: '' }));
                    }}
                  />
                  {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    <Phone size={14} />
                    Phone Number
                  </label>
                  <input
                    className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                    type="tel"
                    placeholder="e.g. 07700 900 000"
                    value={details.phone}
                    onChange={e => {
                      updateDetails({ phone: e.target.value });
                      setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                  />
                  {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
                </div>

                {details.fulfilment === 'delivery' && (
                  <div className={styles.field}>
                    <label className={styles.label}>
                      <MapPin size={14} />
                      Delivery Address
                    </label>
                    <textarea
                      className={`${styles.input} ${styles.textarea} ${errors.address ? styles.inputError : ''}`}
                      placeholder="Street address, city, postcode"
                      value={details.address}
                      rows={3}
                      onChange={e => {
                        updateDetails({ address: e.target.value });
                        setErrors(prev => ({ ...prev, address: '' }));
                      }}
                    />
                    {errors.address && <span className={styles.errorMsg}>{errors.address}</span>}
                  </div>
                )}

                <div className={styles.field}>
                  <label className={styles.label}>
                    <FileText size={14} />
                    Special Instructions <span className={styles.optional}>(optional)</span>
                  </label>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    placeholder="Allergies, dietary needs, or anything we should know..."
                    value={details.notes}
                    rows={2}
                    onChange={e => updateDetails({ notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {errors.general && (
              <div className={styles.generalError}>{errors.general}</div>
            )}

            <button
              type="submit"
              className={`btn-primary ${styles.submitBtn}`}
              disabled={loading || cartCount === 0}
            >
              {loading ? 'Placing order...' : (
                <>
                  <Lock size={15} />
                  Place Order — £{cartTotal.toFixed(2)}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <aside className={styles.sidebar}>
            <div className={styles.orderCard}>
              <h3 className={styles.orderCardTitle}>Order Summary</h3>
              <div className={styles.orderCardRow}>
                <span>{cartCount} {cartCount === 1 ? 'box' : 'boxes'}</span>
                <span className={styles.orderCardTotal}>£{cartTotal.toFixed(2)}</span>
              </div>
              <div className={styles.orderNote}>
                {details.fulfilment === 'delivery'
                  ? 'Delivery fee calculated at checkout based on your location.'
                  : 'No delivery fee — collect in store with your QR code.'}
              </div>
            </div>

            <div className={styles.trustBadges}>
              <div className={styles.trustBadge}>
                <Lock size={14} />
                Secure checkout
              </div>
              <div className={styles.trustBadge}>
                <Store size={14} />
                Made fresh to order
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
