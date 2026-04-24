import { useEffect } from 'react';
import menu from '../../data/mothers_day_2026.json';
import MenuItemCard from '../../components/MenuItemCard/MenuItemCard';
import styles from './MothersDayReviewPage.module.css';

const SECTIONS = [
  { type: 'cold tapa',  label: 'Cold Tapas' },
  { type: 'hot tapa',   label: 'Hot Tapas' },
  { type: 'entree',     label: 'Entrées' },
  { type: 'dessert',    label: 'Desserts' },
];

export default function MothersDayReviewPage() {
  useEffect(() => { document.title = "Meson Sabika - Mother's Day Menu"; }, []);

  return (
    <div className={styles.page}>
      {SECTIONS.map(({ type, label }) => {
        const items = menu.filter(item => item.type === type);
        return (
          <section key={type} className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupTitle}>{label}</span>
              <div className={styles.groupDivider} />
            </div>
            <div className={styles.grid}>
              {items.map(item => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
