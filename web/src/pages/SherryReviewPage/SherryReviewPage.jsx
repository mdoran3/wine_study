import { useEffect } from 'react';
import styles from './SherryReviewPage.module.css';

export default function SherryReviewPage() {
  useEffect(() => { document.title = 'Meson Sabika - Sherry Review'; }, []);

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Sherry Review</h2>
      <p className={styles.placeholder}>Coming soon — sherry knowledge cards will appear here.</p>
    </div>
  );
}
