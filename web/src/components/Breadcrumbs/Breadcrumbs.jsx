import { Link, useLocation } from 'react-router-dom';
import styles from './Breadcrumbs.module.css';

// Each page knows its label and its parent, so "Back" always goes up one level.
const PAGES = {
  '/review': { label: 'Wines by the Glass', parent: '/' },
  '/bottle-review': { label: 'Wines by the Bottle', parent: '/' },
  '/pronunciation': { label: 'Pronunciation', parent: '/' },
  '/test': { label: 'Wine Test', parent: '/' },
  '/wine-regions': { label: 'Wine Regions of Spain', parent: '/' },
  '/tapas-review': { label: 'Tapas Review', parent: '/' },
  '/tapas-test': { label: 'Tapas Test', parent: '/' },
  '/fish-review': { label: 'Fish Review', parent: '/' },
  '/fish-test': { label: 'Fish Test', parent: '/' },
  '/sherry-review': { label: 'Sherry Review', parent: '/' },
  '/sherry-test': { label: 'Sherry Test', parent: '/' },
  '/allergy': { label: 'Allergen Guide', parent: '/' },
  '/cocktail-review': { label: 'Cocktails', parent: '/' },
  '/holiday': { label: 'Holiday Menus', parent: '/' },
  '/holiday/mothers-day-2026': { label: "Mother's Day 2026", parent: '/holiday' },
  '/holiday/mothers-day-2026/review': { label: 'Menu', parent: '/holiday/mothers-day-2026' },
  '/holiday/mothers-day-2026/test': { label: 'Test', parent: '/holiday/mothers-day-2026' },
  '/holiday/new-years-eve-2026': { label: "New Year's Eve 2026", parent: '/holiday' },
  '/holiday/new-years-eve-2026/menu': { label: 'Printed Menu', parent: '/holiday/new-years-eve-2026' },
  '/holiday/new-years-eve-2026/review': { label: 'Menu', parent: '/holiday/new-years-eve-2026' },
  '/holiday/new-years-eve-2026/test': { label: 'Test', parent: '/holiday/new-years-eve-2026' },
};

function trail(path) {
  const out = [];
  for (let p = path; PAGES[p]; p = PAGES[p].parent) out.unshift({ path: p, label: PAGES[p].label });
  return out;
}

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const crumbs = trail(path);
  if (!crumbs.length) return null;        // home page, or an unknown route
  const parent = PAGES[path].parent;
  const parentLabel = parent === '/' ? 'Home' : PAGES[parent].label;

  return (
    <nav className={styles.crumbs} aria-label="Breadcrumb">
      <div className={styles.inner}>
        <Link to={parent} className={styles.back}>← {parentLabel}</Link>
        <ol className={styles.trail}>
          <li><Link to="/">Home</Link></li>
          {crumbs.map((c, i) => (
            <li key={c.path}>
              {i === crumbs.length - 1
                ? <span aria-current="page">{c.label}</span>
                : <Link to={c.path}>{c.label}</Link>}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
