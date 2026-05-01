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

function CoilWire({ id }) {
  return (
    <svg className={styles.coilSvg} aria-hidden="true">
      <defs>
        <pattern id={`coil-${id}`} x="0" y="0" width="24" height="26" patternUnits="userSpaceOnUse">
          {/* Back wire — thin line at the paper edge */}
          <line x1="20" y1="0" x2="20" y2="26" stroke="#b0b0c4" strokeWidth="1.5"/>
          {/* Front coil loop — C-curve swinging left from the paper edge */}
          <path d="M20,0 C2,6 2,20 20,26" stroke="#888898" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          {/* Metallic highlight */}
          <path d="M20,0 C2,6 2,20 20,26" stroke="#dce8f8" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
        </pattern>
      </defs>
      <rect width="24" height="100%" fill={`url(#coil-${id})`}/>
    </svg>
  );
}

export default function HomePage() {
  useEffect(() => { document.title = 'Meson Sabika Education'; }, []);
  const navigate = useNavigate();

  return (
    <section className={styles.home}>
      {SECTIONS.map(section => (
        <div key={section.id} className={`${styles.drawer} ${styles[`drawer_${section.theme}`]}`}>
          <div className={styles.drawerHeader}>
            <span>{section.label}</span>
            <div className={styles.drawerRule} />
          </div>
          <div className={styles.drawerItems}>
            <CoilWire id={section.id} />
            {section.items.map(item => (
              <button
                key={item.path}
                className={`${styles.navBtn} ${styles[`navBtn_${section.theme}`]}`}
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
    </section>
  );
}
