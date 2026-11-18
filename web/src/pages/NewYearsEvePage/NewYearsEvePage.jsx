import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './NewYearsEvePage.module.css';

export default function NewYearsEvePage() {
  useEffect(() => { document.title = "Meson Sabika - New Year's Eve 2026"; }, []);
  const navigate = useNavigate();
  return (
    <section className={styles.page}>
      <h2 className={styles.heading}>New Year's Eve 2026</h2>
      <button className={styles.navBtn} onClick={() => navigate('/holiday/new-years-eve-2026/menu')}>
        📄 View Printed Menu
      </button>
      <button className={styles.navBtn} onClick={() => navigate('/holiday/new-years-eve-2026/review')}>
        🥂 Review New Year's Eve Menu
      </button>
      <button className={styles.navBtn} onClick={() => navigate('/holiday/new-years-eve-2026/test')}>
        📝 Generate New Year's Eve Test
      </button>
    </section>
  );
}
