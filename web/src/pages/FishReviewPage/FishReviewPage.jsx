import { useState, useMemo, useEffect } from 'react';
import fish from '../../data/fish.json';
import FishCard from '../../components/FishCard/FishCard';
import FishChart from '../../components/FishChart/FishChart';
import styles from './FishReviewPage.module.css';

const SORT_OPTIONS = [
  { value: 'oil_content', label: 'Oil Content' },
  { value: 'firmness',    label: 'Firmness' },
  { value: 'flake_type',  label: 'Flake Size' },
];

const GROUP_ORDER = {
  oil_content: ['lean', 'semi-oily', 'oily'],
  firmness:    ['medium', 'firm'],
  flake_type:  ['small flakes', 'medium flakes', 'large flakes', 'fibrous'],
};

function groupBy(arr, key) {
  const map = new Map();
  for (const item of arr) {
    const group = item[key];
    if (!map.has(group)) map.set(group, []);
    map.get(group).push(item);
  }
  const order = GROUP_ORDER[key];
  return [...map.entries()].sort(([a], [b]) => {
    if (order) {
      const ai = order.indexOf(a), bi = order.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
    }
    return a.localeCompare(b);
  });
}

export default function FishReviewPage() {
  useEffect(() => { document.title = 'Meson Sabika - Fish Review'; }, []);
  const [sortBy, setSortBy] = useState(null);

  const groups = useMemo(() => {
    if (!sortBy) return [['', fish]];
    return groupBy(fish, sortBy);
  }, [sortBy]);

  return (
    <div className={styles.page}>
      <FishChart />
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

      {groups.map(([groupName, groupFish]) => (
        <section key={groupName} className={styles.group}>
          {groupName && (
            <div className={styles.groupHeader}>
              <span className={styles.groupTitle}>{groupName}</span>
              <div className={styles.groupDivider} />
            </div>
          )}
          <div className={styles.grid}>
            {groupFish.map(f => (
              <FishCard key={f.id} fish={f} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
