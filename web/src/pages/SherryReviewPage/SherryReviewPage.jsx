import { useEffect } from 'react';
import sherry from '../../data/sherry.json';
import SherryCard from '../../components/SherryCard/SherryCard';
import SherryInfoPanel from '../../components/SherryInfoPanel/SherryInfoPanel';
import styles from './SherryReviewPage.module.css';

export default function SherryReviewPage() {
  useEffect(() => { document.title = 'Meson Sabika - Sherry Review'; }, []);

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Review Sherry Knowledge</h2>
      <SherryInfoPanel />
      <div className={styles.grid}>
        {sherry.map(s => (
          <SherryCard key={s.id} sherry={s} />
        ))}
      </div>
    </div>
  );
}
