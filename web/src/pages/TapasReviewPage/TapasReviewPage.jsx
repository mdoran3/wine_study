import { useState, useMemo, useEffect } from 'react';
import menu from '../../data/menu.json';
import styles from './TapasReviewPage.module.css';

const TYPE_LABELS = {
  cold_tapas:   'Cold Tapas',
  hot_tapas:    'Hot Tapas',
  soup:         'Soup',
  salad:        'Salad',
  paella:       'Paella',
  dessert:      'Dessert',
  lunch_entree: 'Lunch Entree',
};

const DIETARY_FILTERS = [
  { key: 'gf',  label: 'GF',  check: d => d.gluten_free || d.gluten_free_modifiable },
  { key: 'v',   label: 'V',   check: d => d.vegetarian  || d.vegetarian_modifiable  },
  { key: 've',  label: 'VE',  check: d => d.vegan        || d.vegan_modifiable       },
];

function DietaryBadges({ dietary }) {
  const badges = [];
  if (dietary.gluten_free)             badges.push({ label: 'GF',  mod: false });
  if (dietary.gluten_free_modifiable)  badges.push({ label: 'GF*', mod: true  });
  if (dietary.vegetarian)              badges.push({ label: 'V',   mod: false });
  if (dietary.vegetarian_modifiable)   badges.push({ label: 'V*',  mod: true  });
  if (dietary.vegan)                   badges.push({ label: 'VE',  mod: false });
  if (dietary.vegan_modifiable)        badges.push({ label: 'VE*', mod: true  });
  if (badges.length === 0) return null;
  return (
    <div className={styles.badges}>
      {badges.map(b => (
        <span key={b.label} className={`${styles.badge} ${b.mod ? styles.badgeMod : ''}`}>
          {b.label}
        </span>
      ))}
    </div>
  );
}

function MenuCard({ item }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <h3 className={styles.cardName}>{item.name}</h3>
        <span className={styles.typeBadge}>{TYPE_LABELS[item.type]}</span>
      </div>
      <DietaryBadges dietary={item.dietary} />
      <p className={styles.cardDesc}>{item.description}</p>
      {item.ingredients.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Ingredients</span>
          <div className={styles.chips}>
            {item.ingredients.map(ing => (
              <span key={ing} className={styles.chip}>{ing}</span>
            ))}
          </div>
        </div>
      )}
      {item.sauces.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Sauces</span>
          <div className={styles.chips}>
            {item.sauces.map(s => (
              <span key={s} className={`${styles.chip} ${styles.chipSauce}`}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TapasReviewPage() {
  useEffect(() => { document.title = 'Meson Sabika - Tapas Menu Review'; }, []);
  const [activeType, setActiveType]   = useState(null);
  const [dietaryKeys, setDietaryKeys] = useState(new Set());

  const toggleDietary = (key) => {
    setDietaryKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (key === 'v')  next.delete('ve');
        if (key === 've') next.delete('v');
        next.add(key);
      }
      return next;
    });
  };

  const grouped = useMemo(() => {
    let items = menu;
    if (activeType) items = items.filter(i => i.type === activeType);
    for (const key of dietaryKeys) {
      const filter = DIETARY_FILTERS.find(f => f.key === key);
      if (filter) items = items.filter(i => filter.check(i.dietary));
    }
    const map = new Map();
    for (const type of Object.keys(TYPE_LABELS)) {
      const group = items.filter(i => i.type === type);
      if (group.length > 0) map.set(type, group);
    }
    return map;
  }, [activeType, dietaryKeys]);

  const totalCount = useMemo(() => [...grouped.values()].reduce((n, g) => n + g.length, 0), [grouped]);

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Review Menu Knowledge</h2>

      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <button
            className={`${styles.filterBtn} ${!activeType ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveType(null)}
          >
            All
          </button>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`${styles.filterBtn} ${activeType === key ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveType(prev => prev === key ? null : key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.filterRow}>
          {DIETARY_FILTERS.map(f => (
            <button
              key={f.key}
              className={`${styles.dietaryBtn} ${dietaryKeys.has(f.key) ? styles.dietaryBtnActive : ''}`}
              onClick={() => toggleDietary(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.count}>{totalCount} item{totalCount !== 1 ? 's' : ''}</p>

      {[...grouped.entries()].map(([type, items]) => (
        <section key={type} className={styles.typeSection}>
          <div className={styles.typeDivider}>
            <h3 className={styles.typeLabel}>{TYPE_LABELS[type]}</h3>
            <div className={styles.dividerLine} />
          </div>
          <div className={styles.grid}>
            {items.map(item => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
