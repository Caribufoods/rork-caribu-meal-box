import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Info, ShoppingBag, Scale } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { menuItems, portionSizes } from '../data/menu';
import type { MenuItem } from '../types/caribu';
import styles from './Builder.module.css';

type BuildStep = 'size' | 'starter' | 'main' | 'side';

const steps: { id: BuildStep; label: string }[] = [
  { id: 'size', label: 'Portion' },
  { id: 'starter', label: 'Starter' },
  { id: 'main', label: 'Main' },
  { id: 'side', label: 'Side' },
];

function ItemCard({
  item,
  selected,
  onSelect,
}: {
  item: MenuItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`${styles.itemCard} ${selected ? styles.itemCardSelected : ''}`}
      onClick={onSelect}
      style={{ '--accent': item.accent } as React.CSSProperties}
    >
      <div className={styles.itemImgWrap}>
        <img src={item.image} alt={item.name} className={styles.itemImg} />
        {selected && (
          <div className={styles.itemCheck}>
            <Check size={14} />
          </div>
        )}
      </div>
      <div className={styles.itemInfo}>
        <div className={styles.itemTags}>
          {item.tags?.includes('vegetarian') && (
            <span className="tag tag-vegetarian">V</span>
          )}
          {item.tags?.includes('chefs-pick') && (
            <span className="tag tag-chefs-pick">Chef's</span>
          )}
        </div>
        <div className={styles.itemName}>{item.name}</div>
        <div className={styles.itemDesc}>{item.description}</div>
        <div className={styles.itemMeta}>
          <span className={styles.itemPrice}>£{item.price.toFixed(2)}</span>
          <span className={styles.itemCal}>{item.calories} kcal</span>
        </div>
      </div>
    </button>
  );
}

export function Builder() {
  const navigate = useNavigate();
  const {
    selection,
    size,
    starter,
    main,
    side,
    currentUnitPrice,
    selectItem,
    chooseSize,
    setStarterOmission,
    chooseBoostTarget,
    addCurrentBoxToCart,
  } = useCart();

  const [step, setStep] = useState<BuildStep>('size');

  const starters = menuItems.filter(i => i.category === 'starters');
  const mains = menuItems.filter(i => i.category === 'mains');
  const sides = menuItems.filter(i => i.category === 'sides');

  const canProceed = () => {
    if (step === 'size') return true;
    if (step === 'starter') return selection.omitStarter || !!selection.starterId;
    if (step === 'main') return !!selection.mainId;
    if (step === 'side') return !!selection.sideId;
    return false;
  };

  const canAddToCart = !!selection.mainId && !!selection.sideId && (selection.omitStarter || !!selection.starterId);

  const nextStep = () => {
    const idx = steps.findIndex(s => s.id === step);
    if (idx < steps.length - 1) setStep(steps[idx + 1].id);
  };

  const prevStep = () => {
    const idx = steps.findIndex(s => s.id === step);
    if (idx > 0) setStep(steps[idx - 1].id);
  };

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addCurrentBoxToCart();
    navigate('/cart');
  };

  const getStepStatus = (stepId: BuildStep) => {
    const idx = steps.findIndex(s => s.id === stepId);
    const currentIdx = steps.findIndex(s => s.id === step);
    if (idx < currentIdx) return 'done';
    if (idx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className={styles.pageHead}>
          <span className="section-label">Build your box</span>
          <h1 className={styles.title}>Craft Your Perfect Box</h1>
        </div>

        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.stepper}>
              {steps.map((s, i) => {
                const status = getStepStatus(s.id);
                return (
                  <button
                    key={s.id}
                    className={`${styles.stepperItem} ${styles[`stepperItem_${status}`]}`}
                    onClick={() => setStep(s.id)}
                  >
                    <div className={styles.stepperDot}>
                      {status === 'done' ? <Check size={12} /> : i + 1}
                    </div>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>

            {step === 'size' && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Choose your portion size</h2>
                <div className={styles.sizeGrid}>
                  {portionSizes.map(ps => (
                    <button
                      key={ps.id}
                      className={`${styles.sizeCard} ${selection.sizeId === ps.id ? styles.sizeCardSelected : ''}`}
                      onClick={() => chooseSize(ps.id)}
                    >
                      <div className={styles.sizeHeader}>
                        <div className={styles.sizeName}>{ps.name}</div>
                        {ps.surcharge > 0 && (
                          <div className={styles.sizeSurcharge}>+£{ps.surcharge.toFixed(2)}</div>
                        )}
                        {selection.sizeId === ps.id && (
                          <div className={styles.sizeCheck}><Check size={14} /></div>
                        )}
                      </div>
                      <div className={styles.sizeMeta}>
                        <div className={styles.sizeMetaItem}>
                          <Scale size={14} />
                          {ps.grams}g per dish
                        </div>
                        <div className={styles.sizeMetaItem}>
                          <Info size={14} />
                          ~{ps.calories.toLocaleString()} kcal total
                        </div>
                      </div>
                      <div className={styles.sizeSubtitle}>{ps.subtitle}</div>
                    </button>
                  ))}
                </div>
                <div className={styles.sectionNote}>
                  <Info size={14} />
                  Calorie counts are estimates based on portion size and typical preparation.
                </div>
              </div>
            )}

            {step === 'starter' && (
              <div className={styles.section}>
                <div className={styles.sectionTitleRow}>
                  <h2 className={styles.sectionTitle}>Choose your starter</h2>
                  <label className={styles.omitToggle}>
                    <input
                      type="checkbox"
                      checked={selection.omitStarter}
                      onChange={e => setStarterOmission(e.target.checked)}
                    />
                    <span className={styles.omitToggleTrack} />
                    <span className={styles.omitToggleLabel}>
                      Skip starter, upsize main or side (+£2.50)
                    </span>
                  </label>
                </div>

                {selection.omitStarter ? (
                  <div className={styles.boostPanel}>
                    <h3>Which dish would you like to upsize?</h3>
                    <p>Your extra portion (+£2.50) will go to your chosen main or side.</p>
                    <div className={styles.boostOptions}>
                      <button
                        className={`${styles.boostOption} ${selection.boostTarget === 'main' ? styles.boostOptionSelected : ''}`}
                        onClick={() => chooseBoostTarget('main')}
                      >
                        {selection.boostTarget === 'main' && <Check size={14} />}
                        Upsize Main
                      </button>
                      <button
                        className={`${styles.boostOption} ${selection.boostTarget === 'side' ? styles.boostOptionSelected : ''}`}
                        onClick={() => chooseBoostTarget('side')}
                      >
                        {selection.boostTarget === 'side' && <Check size={14} />}
                        Upsize Side
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.itemGrid}>
                    {starters.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        selected={selection.starterId === item.id}
                        onSelect={() => selectItem('starters', item.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 'main' && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Choose your main</h2>
                <div className={styles.itemGrid}>
                  {mains.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      selected={selection.mainId === item.id}
                      onSelect={() => selectItem('mains', item.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 'side' && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Choose your side</h2>
                <div className={styles.itemGrid}>
                  {sides.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      selected={selection.sideId === item.id}
                      onSelect={() => selectItem('sides', item.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className={styles.navRow}>
              {step !== 'size' && (
                <button className="btn-outline" onClick={prevStep}>
                  Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              {step !== 'side' ? (
                <button
                  className="btn-primary"
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  className="btn-gold"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                >
                  <ShoppingBag size={16} />
                  Add to Cart
                </button>
              )}
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.summary}>
              <div className={styles.summaryHead}>Your Box</div>

              <div className={styles.summarySize}>
                <div className={styles.summarySizeLabel}>Portion</div>
                <div className={styles.summarySizeName}>{size.name} ({size.grams}g)</div>
              </div>

              <div className={styles.summaryItems}>
                <div className={`${styles.summaryItem} ${!selection.omitStarter && starter ? styles.summaryItemFilled : selection.omitStarter ? styles.summaryItemSkipped : styles.summaryItemEmpty}`}>
                  <span className={styles.summaryItemCat}>Starter</span>
                  <span className={styles.summaryItemName}>
                    {selection.omitStarter ? 'Skipped — boost applied' : starter?.name || 'Not selected'}
                  </span>
                </div>
                <div className={`${styles.summaryItem} ${main ? styles.summaryItemFilled : styles.summaryItemEmpty}`}>
                  <span className={styles.summaryItemCat}>Main</span>
                  <span className={styles.summaryItemName}>{main?.name || 'Not selected'}</span>
                </div>
                <div className={`${styles.summaryItem} ${side ? styles.summaryItemFilled : styles.summaryItemEmpty}`}>
                  <span className={styles.summaryItemCat}>Side</span>
                  <span className={styles.summaryItemName}>{side?.name || 'Not selected'}</span>
                </div>
              </div>

              <div className={styles.summaryPrice}>
                <span>Box total</span>
                <span className={styles.summaryTotal}>£{currentUnitPrice.toFixed(2)}</span>
              </div>

              <button
                className={`btn-gold ${styles.summaryAddBtn}`}
                onClick={handleAddToCart}
                disabled={!canAddToCart}
              >
                <ShoppingBag size={16} />
                Add to Cart
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
