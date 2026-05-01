import { useEffect } from 'react';
import styles from './SherryTestPage.module.css';

export default function SherryTestPage() {
  useEffect(() => { document.title = 'Meson Sabika - Sherry Test'; }, []);

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Sherry Test</h2>
      <p className={styles.placeholder}>Coming soon — sherry quiz questions will appear here.</p>
    </div>
  );
}
