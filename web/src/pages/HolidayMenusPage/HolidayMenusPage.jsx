import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './HolidayMenusPage.module.css';

const HOLIDAYS = [
  { label: "Mother's Day 2026", path: '/holiday/mothers-day-2026' },
];

export default function HolidayMenusPage() {
  useEffect(() => { document.title = 'Meson Sabika - Holiday Menus'; }, []);
  const navigate = useNavigate();
  return (
    <section className={styles.page}>
      <h2 className={styles.heading}>Holiday Menus</h2>
      {HOLIDAYS.map(h => (
        <button key={h.path} className={styles.navBtn} onClick={() => navigate(h.path)}>
          🎉 {h.label}
        </button>
      ))}
    </section>
  );
}
