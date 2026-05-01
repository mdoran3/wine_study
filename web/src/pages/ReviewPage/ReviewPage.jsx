import { useState, useMemo, useEffect } from 'react';
import wines from '../../data/wines.json';
import WineCard from '../../components/WineCard/WineCard';
import styles from './ReviewPage.module.css';

const SORT_OPTIONS = [
  { value: 'type',       label: 'Type' },
  { value: 'grapes',     label: 'Grape' },
  { value: 'region',     label: 'Region' },
  { value: 'similar_to', label: 'Similar To' },
];

function groupBy(arr, key) {
  const map = new Map();
  for (const item of arr) {
    const group = item[key];
    if (!map.has(group)) map.set(group, []);
    map.get(group).push(item);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default function ReviewPage() {
  useEffect(() => { document.title = 'Meson Sabika - Wine Review'; }, []);
  const [sortBy, setSortBy] = useState(null);

  const groups = useMemo(() => {
    if (!sortBy) return [['', wines]];
    return groupBy(wines, sortBy);
  }, [sortBy]);

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Review the Wines by the Glass</h2>
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
