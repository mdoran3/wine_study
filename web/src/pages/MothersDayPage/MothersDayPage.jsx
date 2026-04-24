import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './MothersDayPage.module.css';

export default function MothersDayPage() {
  useEffect(() => { document.title = "Meson Sabika - Mother's Day 2026"; }, []);
  const navigate = useNavigate();
  return (
    <section className={styles.page}>
      <h2 className={styles.heading}>Mother's Day 2026</h2>
      <button className={styles.navBtn} onClick={() => navigate('/holiday/mothers-day-2026/review')}>
        🌸 Review Mother's Day Menu
      </button>
      <button className={styles.navBtn} onClick={() => navigate('/holiday/mothers-day-2026/test')}>
        📝 Generate Mother's Day Test
      </button>
    </section>
  );
}
