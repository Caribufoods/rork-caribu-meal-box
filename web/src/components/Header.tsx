import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import styles from './Header.module.css';

export function Header() {
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isHome = location.pathname === '/';

  return (
    <header className={`${styles.header} ${scrolled || !isHome ? styles.solid : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>C</span>
          <span className={styles.logoText}>Caribu</span>
        </Link>

        <nav className={styles.nav}>
          <Link to="/menu" className={styles.navLink}>Menu</Link>
          <Link to="/builder" className={styles.navLink}>Build a Box</Link>
          <Link to="/cart" className={styles.cartBtn}>
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </Link>
        </nav>

        <button className={styles.menuToggle} onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/menu" className={styles.mobileLink}>Menu</Link>
          <Link to="/builder" className={styles.mobileLink}>Build a Box</Link>
          <Link to="/cart" className={styles.mobileLinkCart}>
            <ShoppingBag size={16} />
            Cart {cartCount > 0 && `(${cartCount})`}
          </Link>
        </div>
      )}
    </header>
  );
}
