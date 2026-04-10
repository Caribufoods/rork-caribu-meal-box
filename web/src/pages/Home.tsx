import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ChefHat, Package, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { menuItems } from '../data/menu';
import styles from './Home.module.css';

const featuredItems = menuItems.filter(i =>
  ['main-jerk-chicken', 'main-oxtail', 'main-channa-aloo'].includes(i.id)
);

export function Home() {
  const { cartCount } = useCart();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <img
          src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Vibrant Caribbean food spread"
          className={styles.heroBg}
        />
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroBadge}>
            <Leaf size={12} />
            Authentic Caribbean
          </div>
          <h1 className={styles.heroTitle}>
            Real Flavours.<br />
            <em>Crafted for You.</em>
          </h1>
          <p className={styles.heroSub}>
            Build your own food box — choose a starter, main, and side. Premium Caribbean cooking, portioned and packed to perfection.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/builder" className="btn-gold">
              Build Your Box <ArrowRight size={16} />
            </Link>
            <Link to="/menu" className={styles.heroSecondary}>
              Browse the Menu
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.how}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="section-label">How it works</span>
            <h2>Three steps to your perfect box</h2>
          </div>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <ChefHat size={26} />
              </div>
              <h3>Choose your items</h3>
              <p>Pick one starter, one main, and one side from our Caribbean menu — or skip the starter and upsize your main or side.</p>
            </div>
            <div className={styles.stepDivider} />
            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <Package size={26} />
              </div>
              <h3>Select your portion</h3>
              <p>Medium (200g, ~1250 kcal) or Large (300g, ~1850 kcal). Full calorie and gram details on every dish.</p>
            </div>
            <div className={styles.stepDivider} />
            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <Truck size={26} />
              </div>
              <h3>Delivery or pickup</h3>
              <p>Choose home delivery or collect from us. Your order confirmation includes a QR code for seamless pickup.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.featured}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="section-label">From the kitchen</span>
            <h2>Signature dishes</h2>
          </div>
          <div className={styles.featuredGrid}>
            {featuredItems.map(item => (
              <Link to="/menu" key={item.id} className={styles.featuredCard}>
                <div className={styles.featuredImgWrap}>
                  <img src={item.image} alt={item.name} className={styles.featuredImg} />
                  {item.tags?.includes('chefs-pick') && (
                    <span className={`tag tag-chefs-pick ${styles.featuredTag}`}>Chef's Pick</span>
                  )}
                  {item.tags?.includes('vegetarian') && (
                    <span className={`tag tag-vegetarian ${styles.featuredTag}`}>Vegetarian</span>
                  )}
                </div>
                <div className={styles.featuredInfo}>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className={styles.featuredMeta}>
                    <span className={styles.featuredPrice}>from £{item.price.toFixed(2)}</span>
                    <span className={styles.featuredCal}>{item.calories} kcal</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className={styles.featuredCta}>
            <Link to="/menu" className="btn-outline">
              See full menu <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaBox}>
            <div className={styles.ctaContent}>
              <span className="section-label" style={{ color: 'var(--gold-light)' }}>Ready to order?</span>
              <h2 className={styles.ctaTitle}>Build your food box today</h2>
              <p className={styles.ctaSub}>Mix and match from starters, mains, and sides. Every box made fresh to order.</p>
            </div>
            <div className={styles.ctaBtns}>
              <Link to="/builder" className="btn-gold">
                Start building <ArrowRight size={16} />
              </Link>
              {cartCount > 0 && (
                <Link to="/cart" className={styles.ctaViewCart}>
                  View cart ({cartCount})
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
