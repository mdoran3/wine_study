import { useState, useEffect } from 'react';
import data from '../../data/allergies.json';
import styles from './AllergyPage.module.css';

const ALLERGEN_META = {
  Dairy:     { emoji: '🥛', color: '#c0392b', bg: '#fdecea', border: '#e8a09a' },
  Eggs:      { emoji: '🥚', color: '#b8860b', bg: '#fdf6e3', border: '#e8c97a' },
  'Tree Nuts': { emoji: '🌰', color: '#5a7a00', bg: '#f4fae8', border: '#b8d878' },
  Peanuts:   { emoji: '🥜', color: '#2e7d32', bg: '#edf7ee', border: '#90c893' },
  Shellfish: { emoji: '🦐', color: '#1565c0', bg: '#e8f0fb', border: '#90b4e8' },
  Gluten:    { emoji: '🌾', color: '#6a1fa8', bg: '#f5f0fd', border: '#c8a8e8' },
};

export default function AllergyPage() {
  useEffect(() => { document.title = 'Meson Sabika - Allergy Guide'; }, []);

  const [active, setActive] = useState(new Set());

  const toggle = (a) => setActive(prev => {
    const next = new Set(prev);
    next.has(a) ? next.delete(a) : next.add(a);
    return next;
  });

  const filteredCategories = active.size === 0 ? [] : data.categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.allergens.some(a => active.has(a))),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Menu Allergen Guide</h2>
        <p className={styles.subheading}>
          Select one or more allergens to see which dishes contain them.
        </p>

        <div className={styles.chips}>
          {data.allergens.map(a => {
            const meta = ALLERGEN_META[a];
            const isOn = active.has(a);
            return (
              <button
                key={a}
                className={`${styles.chip} ${isOn ? styles.chipOn : ''}`}
                style={isOn ? {
                  background: meta.color,
                  borderColor: meta.color,
                  color: '#fff',
                } : {
                  background: meta.bg,
                  borderColor: meta.border,
                  color: meta.color,
                }}
                onClick={() => toggle(a)}
              >
                <span className={styles.chipEmoji}>{meta.emoji}</span>
                {a}
              </button>
            );
          })}
        </div>

        {active.size === 0 && (
          <div className={styles.empty}>
            <p>Select allergens above to see affected dishes.</p>
          </div>
        )}

        {active.size > 0 && filteredCategories.length === 0 && (
          <div className={styles.empty}>
            <p>No dishes found containing the selected allergens.</p>
          </div>
        )}

        {filteredCategories.map(cat => (
          <div key={cat.name} className={styles.category}>
            <h3 className={styles.categoryName}>{cat.name}</h3>
            <div className={styles.itemList}>
              {cat.items.map(item => (
                <div key={item.name} className={styles.item}>
                  <span className={styles.itemName}>{item.name}</span>
                  <div className={styles.itemTags}>
                    {item.allergens.filter(a => active.has(a)).map(a => {
                      const meta = ALLERGEN_META[a];
                      return (
                        <span
                          key={a}
                          className={styles.tag}
                          style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
                        >
                          {meta.emoji} {a}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
