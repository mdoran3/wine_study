import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './HomePage.module.css';

export default function HomePage() {
  useEffect(() => { document.title = 'Meson Sabika Education'; }, []);
  const navigate = useNavigate();
  return (
    <section className={styles.home}>
      <div className={styles.divider}>
        <span>🍷 Wine</span>
      </div>
      <button className={styles.navBtn} onClick={() => navigate('/review')}>
        🍷 Review the Wines
        <span className={styles.btnSub}>by the glass</span>
      </button>
      <button className={styles.navBtn} onClick={() => navigate('/pronunciation')}>
        🗣️ Practice Wine Pronunciation
      </button>
      <button className={styles.navBtn} onClick={() => navigate('/test')}>
        📝 Generate Wine Test
        <span className={styles.btnSub}>by the glass</span>
      </button>
      <div className={styles.divider}>
        <span>🐟 Fish</span>
      </div>
      <button className={`${styles.navBtn} ${styles.fishBtn}`} onClick={() => navigate('/fish-review')}>
        🐟 Review Fish Knowledge
      </button>
      <button className={`${styles.navBtn} ${styles.fishBtn}`} onClick={() => navigate('/fish-test')}>
        📝 Generate Fish Test
      </button>
    </section>
  );
}
