import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import hero from '../../data/hero.json';
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
    <div className={styles.page}>
      <section className={styles.hero}>
        <picture>
          <source media="(max-width: 700px)" srcSet="/hero-mobile.webp" />
          <img className={styles.heroImg} src="/hero.webp" alt="" fetchPriority="high" style={{ objectPosition: `center ${hero.position}%` }} />
        </picture>
        <div className={styles.heroShade} />
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Mesón Sabika · Server education</p>
          <h2 className={styles.heroTitle}>What are we studying today?</h2>
          <p className={styles.heroSub}>Pick a topic, review it, then test yourself.</p>
        </div>
        <p className={styles.credit}>
          {hero.caption} · Photo: {hero.author} ·{' '}
          <a href={hero.licenseUrl} target="_blank" rel="noreferrer">{hero.license}</a> ·{' '}
          <a href={hero.page} target="_blank" rel="noreferrer">Wikimedia Commons</a>
        </p>
      </section>

      <section className={styles.home}>
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
    </div>
  );
}
