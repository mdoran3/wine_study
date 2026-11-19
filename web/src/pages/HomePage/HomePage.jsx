import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
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

// The hero photo is cut into depth layers (see scripts/build_hero_layers.py). Each drifts down at its own
// fraction of the scroll speed: the far sky moves most, the foreground vines least, so they slide past
// each other. At rest the stack is exactly the original photo.
const LAYERS = [
  { id: 'sky',   speed: 0.5 },
  { id: 'land',  speed: 0.4 },
  { id: 'mid',   speed: 0.3 },
  { id: 'front', speed: 0.2 },
];
const layerSrc = (id, mobile) => (id === 'sky' ? `/hero${mobile ? '-mobile' : ''}.webp` : `/hero-${id}${mobile ? '-mobile' : ''}.webp`);

export default function HomePage() {
  useEffect(() => { document.title = 'Meson Sabika Education'; }, []);
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const layerRefs = useRef([]);
  const [cutoutsReady, setCutoutsReady] = useState(0);
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const textRef = useRef(null);

  // Parallax: the photo drifts at 40% of the scroll speed, the title floats up and fades, and the
  // corner tilework on each card shifts a little (via --sy). Topic cards rise in as they scroll into
  // view. All of it is skipped for people who ask for reduced motion.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const page = pageRef.current;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const h = heroRef.current.offsetHeight;
      const p = Math.min(1, Math.max(0, y / h));          // 0 at the top, 1 once the hero has scrolled away
      const shift = Math.min(y, h);
      LAYERS.forEach((l, i) => {
        const el = layerRefs.current[i];
        if (el) el.style.transform = `translate3d(0, ${shift * l.speed}px, 0)`;
      });
      textRef.current.style.transform = `translate3d(0, ${p * 70}px, 0)`;
      textRef.current.style.opacity = String(Math.max(0, 1 - p * 1.15));
      page.style.setProperty('--sy', String(Math.round(y)));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.setAttribute('data-in', ''); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    page.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <div className={styles.page} ref={pageRef}>
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.layers} aria-hidden="true">
          {LAYERS.map((l, i) => {
            // people who ask for reduced motion only get the sky layer (the whole photo), nothing else is downloaded
            if (reduceMotion && l.id !== 'sky') return null;
            const cutout = l.id !== 'sky';
            return (
              <div
                key={l.id}
                ref={el => { layerRefs.current[i] = el; }}
                className={`${styles.layer} ${cutout ? styles.cutout : ''} ${cutout && cutoutsReady >= 3 ? styles.cutoutOn : ''}`}
              >
                <picture>
                  <source media="(max-width: 700px)" srcSet={layerSrc(l.id, true)} />
                  <img
                    src={layerSrc(l.id, false)}
                    alt=""
                    fetchPriority={cutout ? 'auto' : 'high'}
                    style={{ objectPosition: `center ${hero.position}%` }}
                    ref={el => { if (el && cutout && el.complete && !el.dataset.counted) { el.dataset.counted = '1'; queueMicrotask(() => setCutoutsReady(n => n + 1)); } }}
                    onLoad={e => { if (cutout && !e.currentTarget.dataset.counted) { e.currentTarget.dataset.counted = '1'; setCutoutsReady(n => n + 1); } }}
                  />
                </picture>
              </div>
            );
          })}
        </div>
        <div className={styles.heroShade} />
        <div className={styles.heroInner} ref={textRef}>
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
          {SECTIONS.map((section, i) => (
            <div
              key={section.id}
              className={`${styles.drawer} ${styles[`drawer_${section.theme}`]}`}
              data-reveal
              style={{ '--i': i % 3 }}
            >
              <div className={styles.drawerHeader}>
                <span>{section.label.replace(/^[^\p{L}]+/u, '')}</span>
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
