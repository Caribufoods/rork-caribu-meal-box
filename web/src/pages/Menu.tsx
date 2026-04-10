import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';
import { menuItems, sauceOptions } from '../data/menu';
import type { MenuItem } from '../types/caribu';
import styles from './Menu.module.css';

const categories = [
  { id: 'starters', label: 'Starters' },
  { id: 'mains', label: 'Mains' },
  { id: 'sides', label: 'Sides' },
] as const;

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <div className={styles.menuCard}>
      <div className={styles.menuImgWrap}>
        <img src={item.image} alt={item.name} className={styles.menuImg} />
      </div>
      <div className={styles.menuInfo}>
        <div className={styles.menuHeader}>
          <div>
            <div className={styles.menuTags}>
              {item.tags?.includes('vegetarian') && (
                <span className="tag tag-vegetarian">Vegetarian</span>
              )}
              {item.tags?.includes('chefs-pick') && (
                <span className="tag tag-chefs-pick">Chef's Pick</span>
              )}
            </div>
            <h3 className={styles.menuName}>{item.name}</h3>
          </div>
          <div className={styles.menuPrice}>£{item.price.toFixed(2)}</div>
        </div>
        <p className={styles.menuDesc}>{item.description}</p>
        <div className={styles.menuFooter}>
          <span className={styles.menuCal}>{item.calories} kcal</span>
          <Link to="/builder" className={styles.menuAdd}>
            Add to Box <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Menu() {
  const [activeCategory, setActiveCategory] = useState<'starters' | 'mains' | 'sides'>('starters');

  const filtered = menuItems.filter(i => i.category === activeCategory);

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className={styles.pageHead}>
          <span className="section-label">Full menu</span>
          <h1 className={styles.title}>Our Caribbean Kitchen</h1>
          <p className={styles.subtitle}>
            Every dish is freshly prepared with authentic Caribbean ingredients and spices.
          </p>
        </div>

        <div className={styles.tabs}>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`${styles.tab} ${activeCategory === cat.id ? styles.tabActive : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {filtered.map(item => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>

        <div className={styles.sauceSection}>
          <div className={styles.sauceSectionHead}>
            <span className="section-label">Heat level</span>
            <h2>Choose your sauce</h2>
            <p>Select your preferred sauce intensity when building your box.</p>
          </div>
          <div className={styles.sauceGrid}>
            {sauceOptions.map(sauce => (
              <div key={sauce.id} className={styles.sauceCard}>
                <div className={styles.sauceFlames}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Flame
                      key={i}
                      size={16}
                      className={i < sauce.intensity ? styles.flameLit : styles.flameDim}
                    />
                  ))}
                </div>
                <div className={styles.sauceName}>{sauce.name}</div>
                <div className={styles.sauceDesc}>{sauce.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.buildCta}>
          <div className={styles.buildCtaInner}>
            <h2>Ready to build your box?</h2>
            <p>Combine your favourite starter, main, and side into one perfectly portioned box.</p>
            <Link to="/builder" className="btn-primary">
              Build a Box <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
