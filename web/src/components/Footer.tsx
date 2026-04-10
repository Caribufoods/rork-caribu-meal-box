import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>C</div>
          <div>
            <div className={styles.logoText}>Caribu</div>
            <div className={styles.tagline}>Authentic Caribbean, crafted with care</div>
          </div>
        </div>
        <div className={styles.links}>
          <a href="/menu">Menu</a>
          <a href="/builder">Build a Box</a>
          <a href="/cart">Cart</a>
        </div>
        <div className={styles.copy}>
          &copy; {new Date().getFullYear()} Caribu. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
