import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Package, ArrowRight, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import styles from './Confirmation.module.css';

export function Confirmation() {
  const { lastOrder } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!lastOrder) {
      navigate('/', { replace: true });
    }
  }, [lastOrder, navigate]);

  if (!lastOrder) return null;

  const qrData = JSON.stringify({
    ref: lastOrder.reference,
    total: lastOrder.total,
    boxes: lastOrder.itemCount,
    ts: lastOrder.createdAt,
  });

  const formattedDate = new Date(lastOrder.createdAt).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className={styles.page}>
          <div className={styles.iconWrap}>
            <CheckCircle size={48} className={styles.checkIcon} />
          </div>

          <span className="section-label">Order confirmed</span>
          <h1 className={styles.title}>Your box is being prepared</h1>
          <p className={styles.subtitle}>
            Thank you for your order! We've received your request and our kitchen is getting started.
          </p>

          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <div className={styles.refLabel}>Order Reference</div>
              <div className={styles.refCode}>{lastOrder.reference}</div>
              <div className={styles.refDate}>{formattedDate}</div>

              <div className={styles.meta}>
                <div className={styles.metaItem}>
                  <Package size={15} className={styles.metaIcon} />
                  <div>
                    <div className={styles.metaLabel}>Boxes</div>
                    <div className={styles.metaValue}>{lastOrder.itemCount}</div>
                  </div>
                </div>
                <div className={styles.metaDivider} />
                <div className={styles.metaItem}>
                  <Clock size={15} className={styles.metaIcon} />
                  <div>
                    <div className={styles.metaLabel}>Est. ready</div>
                    <div className={styles.metaValue}>25–35 min</div>
                  </div>
                </div>
                <div className={styles.metaDivider} />
                <div className={styles.metaItem}>
                  <div>
                    <div className={styles.metaLabel}>Total paid</div>
                    <div className={`${styles.metaValue} ${styles.metaTotal}`}>
                      £{lastOrder.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={`${styles.stepDot} ${styles.stepDotActive}`} />
                  <div>
                    <div className={styles.stepLabel}>Order received</div>
                    <div className={styles.stepDesc}>Confirmed and sent to kitchen</div>
                  </div>
                </div>
                <div className={styles.stepLine} />
                <div className={styles.step}>
                  <div className={styles.stepDot} />
                  <div>
                    <div className={styles.stepLabel}>Being prepared</div>
                    <div className={styles.stepDesc}>Fresh Caribbean cooking</div>
                  </div>
                </div>
                <div className={styles.stepLine} />
                <div className={styles.step}>
                  <div className={styles.stepDot} />
                  <div>
                    <div className={styles.stepLabel}>Ready for collection</div>
                    <div className={styles.stepDesc}>Show your QR code</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.cardRight}>
              <div className={styles.qrWrap}>
                <div className={styles.qrLabel}>Show this QR code to collect your order</div>
                <div className={styles.qrBox}>
                  <QRCodeSVG
                    value={qrData}
                    size={180}
                    fgColor="#1B4332"
                    bgColor="#FDF8F0"
                    level="M"
                  />
                </div>
                <div className={styles.qrRef}>{lastOrder.reference}</div>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link to="/" className="btn-outline">
              Back to Home
            </Link>
            <Link to="/builder" className="btn-primary">
              Order again <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
