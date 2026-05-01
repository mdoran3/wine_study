import { useState, useMemo, useEffect } from 'react';
import wines from '../../data/wines_by_the_bottle.json';
import WineCard from '../../components/WineCard/WineCard';
import styles from './BottleReviewPage.module.css';

const SORT_OPTIONS = [
  { value: 'type',       label: 'Type' },
  { value: 'grapes',     label: 'Grape' },
  { value: 'region',     label: 'Region' },
  { value: 'similar_to', label: 'Similar To' },
];

const TYPE_ORDER = ['sparkling', 'rosé', 'white', 'red', 'sparkling non-alcoholic', 'white non-alcoholic', 'red non-alcoholic'];

function groupBy(arr, key) {
  const map = new Map();
  for (const item of arr) {
    const group = item[key];
    if (!map.has(group)) map.set(group, []);
    map.get(group).push(item);
  }
  return [...map.entries()].sort(([a], [b]) => {
    if (key === 'type') {
      const ai = TYPE_ORDER.indexOf(a), bi = TYPE_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
    }
    return a.localeCompare(b);
  });
}

export default function BottleReviewPage() {
  useEffect(() => { document.title = 'Meson Sabika - Wines by the Bottle'; }, []);
  const [sortBy, setSortBy] = useState(null);

  const groups = useMemo(() => {
    if (!sortBy) return [['', wines]];
    return groupBy(wines, sortBy);
  }, [sortBy]);

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Review the Wines by the Bottle</h2>
      <div className={styles.toolbar}>
        <span className={styles.sortLabel}>Sort by:</span>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`${styles.sortBtn} ${sortBy === opt.value ? styles.active : ''}`}
            onClick={() => setSortBy(prev => prev === opt.value ? null : opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {groups.map(([groupName, groupWines]) => (
        <section key={groupName} className={styles.group}>
          {groupName && (
            <div className={styles.groupHeader}>
              <span className={styles.groupTitle}>{groupName}</span>
              <div className={styles.groupDivider} />
            </div>
          )}
          <div className={styles.grid}>
            {groupWines.map(wine => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
