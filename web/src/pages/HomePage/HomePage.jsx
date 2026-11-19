import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
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
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const imgRef = useRef(null);
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
      imgRef.current.style.transform = `translate3d(0, ${Math.min(y, h) * 0.4}px, 0)`;
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
        <picture>
          <source media="(max-width: 700px)" srcSet="/hero-mobile.webp" />
          <img ref={imgRef} className={styles.heroImg} src="/hero.webp" alt="" fetchPriority="high" style={{ objectPosition: `center ${hero.position}%` }} />
        </picture>
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
