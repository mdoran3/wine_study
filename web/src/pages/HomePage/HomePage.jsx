import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './HomePage.module.css';

const SECTIONS = [
  {
    id: 'wine',
    label: '🍷 Wine',
    theme: 'wine',
    items: [
      { label: '🍷 Review the Wines', sub: 'by the glass', path: '/review' },
      { label: '🍾 Review the Wines', sub: 'by the bottle', path: '/bottle-review' },
      { label: '🗣️ Practice Wine Pronunciation', path: '/pronunciation' },
      { label: '📝 Generate Wine Test', sub: 'by the glass', path: '/test' },
    ],
  },
  {
    id: 'fish',
    label: '🐟 Fish',
    theme: 'fish',
    items: [
      { label: '🐟 Review Fish Knowledge', path: '/fish-review' },
      { label: '📝 Generate Fish Test', path: '/fish-test' },
    ],
  },
  {
    id: 'sherry',
    label: '🥃 Sherry',
    theme: 'sherry',
    items: [
      { label: '🥃 Review Sherry Knowledge', path: '/sherry-review' },
      { label: '📝 Generate Sherry Test', path: '/sherry-test' },
    ],
  },
  {
    id: 'holiday',
    label: '🎉 Holiday',
    theme: 'holiday',
    items: [
      { label: '🎉 Holiday Menus', path: '/holiday' },
    ],
  },
  {
    id: 'allergy',
    label: '⚠️ Allergies',
    theme: 'allergy',
    items: [
      { label: '⚠️ Menu Allergen Guide', path: '/allergy' },
    ],
  },
];

export default function HomePage() {
  useEffect(() => { document.title = 'Meson Sabika Education'; }, []);
  const navigate = useNavigate();
  const [open, setOpen] = useState(new Set(['wine']));

  const toggle = (id) => {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <section className={styles.home}>
      {SECTIONS.map(section => {
        const isOpen = open.has(section.id);
        return (
          <div key={section.id} className={`${styles.drawer} ${styles[`drawer_${section.theme}`]}`}>
            <button
              className={`${styles.drawerHeader} ${isOpen ? styles.drawerHeaderOpen : ''}`}
              onClick={() => toggle(section.id)}
            >
              <span>{section.label}</span>
              <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>›</span>
            </button>
            <div className={`${styles.drawerBody} ${isOpen ? styles.drawerBodyOpen : ''}`}>
              <div className={styles.drawerItems}>
                {section.items.map(item => (
                  <button
                    key={item.path}
                    className={`${styles.navBtn} ${styles[`navBtn_${section.theme}`]}`}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                    {item.sub && <span className={styles.btnSub}>{item.sub}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
