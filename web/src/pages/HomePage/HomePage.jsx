import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './HomePage.module.css';

const SECTIONS = [
  {
    id: 'wine',
    label: '🍷 Wine',
    theme: 'wine',
    items: [
      { label: 'Review the Wines', sub: 'by the glass', path: '/review' },
      { label: 'Review the Wines', sub: 'by the bottle', path: '/bottle-review' },
      { label: 'Practice Wine Pronunciation', path: '/pronunciation' },
      { label: 'Generate Wine Test', sub: 'by the glass', path: '/test' },
    ],
  },
  {
    id: 'map',
    label: '🗺️ Maps',
    theme: 'map',
    items: [
      { label: 'Wine Regions of Spain', sub: 'interactive map', path: '/wine-regions' },
    ],
  },
  {
    id: 'tapas',
    label: '🍽️ Tapas Menu',
    theme: 'tapas',
    items: [
      { label: 'Review Menu Knowledge', path: '/tapas-review' },
      { label: 'Generate Menu Test', path: '/tapas-test' },
    ],
  },
  {
    id: 'fish',
    label: '🐟 Fish',
    theme: 'fish',
    items: [
      { label: 'Review Fish Knowledge', path: '/fish-review' },
      { label: 'Generate Fish Test', path: '/fish-test' },
    ],
  },
  {
    id: 'sherry',
    label: '🥃 Sherry',
    theme: 'sherry',
    items: [
      { label: 'Review Sherry Knowledge', path: '/sherry-review' },
      { label: 'Generate Sherry Test', path: '/sherry-test' },
    ],
  },
  {
    id: 'holiday',
    label: '🎉 Holiday',
    theme: 'holiday',
    items: [
      { label: 'Holiday Menus', path: '/holiday' },
    ],
  },
  {
    id: 'allergy',
    label: '⚠️ Allergies',
    theme: 'allergy',
    items: [
      { label: 'Menu Allergen Guide', path: '/allergy' },
    ],
  },
];

export default function HomePage() {
  useEffect(() => { document.title = 'Meson Sabika Education'; }, []);
  const navigate = useNavigate();

  return (
    <section className={styles.home}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>Mesón Sabika · Server education</p>
        <h2 className={styles.introTitle}>What would you like to study?</h2>
        <div className={styles.introRule} />
      </div>
      <div className={styles.grid}>
        {SECTIONS.map(section => (
          <div key={section.id} className={`${styles.drawer} ${styles[`drawer_${section.theme}`]}`}>
            <div className={styles.drawerHeader}>
              <span>{section.label}</span>
            </div>
            <div className={styles.drawerItems}>
              {section.items.map(item => (
                <button
                  key={item.path}
                  className={styles.navBtn}
                  onClick={() => navigate(item.path)}
                >
                  <span className={styles.navBtnInner}>
                    {item.label}
                    {item.sub && <span className={styles.btnSub}>{item.sub}</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
