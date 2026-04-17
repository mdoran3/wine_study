import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './HomePage.module.css';

export default function HomePage() {
  useEffect(() => { document.title = 'Meson Sabika Education'; }, []);
  const navigate = useNavigate();
  return (
    <section className={styles.home}>
      <button className={styles.navBtn} onClick={() => navigate('/review')}>
        Review the Wines
      </button>
      <button className={styles.navBtn} onClick={() => navigate('/test')}>
        Generate Wine Test
      </button>
      <button className={styles.navBtn} onClick={() => navigate('/pronunciation')}>
        Practice Pronunciation
      </button>
    </section>
  );
}
