import { useEffect } from 'react';
import data from '../../data/new_years_eve_2026.json';
import MenuItemCard from '../../components/MenuItemCard/MenuItemCard';
import styles from './NewYearsEveReviewPage.module.css';

const { event, menus, items } = data;

const SECTIONS = [
  { type: 'cold tapa', label: 'Cold Tapas (all three selections)' },
  { type: 'hot tapa',  label: 'Hot Tapas (all three selections, four-course only)' },
  { type: 'entree',    label: 'Entrée' },
  { type: 'dessert',   label: 'Desserts (both selections)' },
];

export default function NewYearsEveReviewPage() {
  useEffect(() => { document.title = "Meson Sabika - New Year's Eve Menu"; }, []);

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>New Year's Eve Menu</h2>
      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <span className={styles.groupTitle}>Details</span>
          <div className={styles.groupDivider} />
        </div>
        <div className={styles.grid}>
          {menus.map(m => (
            <article key={m.id} className={styles.infoCard}>
              <h3 className={styles.infoTitle}>{m.name}</h3>
              <p>{m.time} · {m.price}</p>
              <p>{m.courses.join(' → ')}</p>
            </article>
          ))}
          <article className={styles.infoCard}>
            <h3 className={styles.infoTitle}>{event.entertainment}</h3>
            <p>{event.entertainment_time}</p>
            <p>Photo booth {event.photo_booth}</p>
            <p>{event.special_menus}</p>
          </article>
        </div>
      </section>
      {SECTIONS.map(({ type, label }) => (
        <section key={type} className={styles.group}>
          <div className={styles.groupHeader}>
            <span className={styles.groupTitle}>{label}</span>
            <div className={styles.groupDivider} />
          </div>
          <div className={styles.grid}>
            {items.filter(i => i.type === type).map(item => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
