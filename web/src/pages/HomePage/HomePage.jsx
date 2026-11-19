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
    id: 'cocktail',
    label: '🍸 Cocktails',
    theme: 'cocktail',
    items: [
      { label: 'Review Cocktail Knowledge', path: '/cocktail-review' },
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

// The hero photo is cut into depth layers (see scripts/build_hero_layers.py). As you scroll, each layer
// drifts down at its own fraction of the scroll speed (the far sky most, the foreground vines least)
// and zooms in by its own amount (the foreground most), so they slide and swell past each other like a
// slow dolly shot. `zoom` is the extra scale reached once the hero has scrolled away.
// Rules that keep it gap-free: nearer layers never drift faster or zoom less than the ones behind
// them, and every layer scales around its bottom edge.
const LAYERS = [
  { id: 'sky',   speed: 0.80, zoom: 0.02 },
  { id: 'land',  speed: 0.60, zoom: 0.05 },
  { id: 'mid',   speed: 0.40, zoom: 0.09 },
  { id: 'front', speed: 0.22, zoom: 0.15 },
];
const layerSrc = (id, mobile) => `/hero-${id}${mobile ? '-mobile' : ''}.webp`;

export default function HomePage() {
  useEffect(() => { document.title = 'Meson Sabika Education'; }, []);
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const layerRefs = useRef([]);
  const [cutoutsReady, setCutoutsReady] = useState(0);
  const [showCutouts, setShowCutouts] = useState(false);
  const [nativeScroll] = useState(() => typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()'));
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const textRef = useRef(null);

  // Parallax. Where the browser supports scroll-linked CSS animations (Chrome/Edge/Android, Safari 26+)
  // the layers are driven entirely by CSS (see HomePage.module.css): the motion runs on the compositor,
  // off the main thread, so it stays smooth even while the page is busy. Everywhere else a small scroll
  // handler does the same job. Cards rise in as they scroll into view. All of it is off for people who
  // ask for reduced motion.
  const updateRef = useRef(null);
  useEffect(() => {
    if (reduceMotion) return undefined;
    const page = pageRef.current;
    let frame = 0;
    let h = heroRef.current.offsetHeight;
    let cleanup = () => {};

    if (!nativeScroll) {
      const update = () => {
        frame = 0;
        const y = window.scrollY;
        const p = Math.min(1, Math.max(0, y / h));        // 0 at the top, 1 once the hero has scrolled away
        const shift = Math.min(y, h);
        LAYERS.forEach((l, i) => {
          const el = layerRefs.current[i];
          if (el) el.style.transform = `translate3d(0, ${shift * l.speed}px, 0) scale(${1 + p * l.zoom})`;
        });
        // the title is the nearest thing: it lifts away faster than the page, and fades as it goes
        textRef.current.style.transform = `translate3d(0, ${-shift * 0.32}px, 0)`;
        textRef.current.style.opacity = String(Math.max(0, 1 - p * 1.5));
      };
      updateRef.current = update;
      const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
      // the hero's height only changes on resize, so it is measured then, not on every scroll frame
      const ro = new ResizeObserver(() => { h = heroRef.current.offsetHeight; onScroll(); });
      ro.observe(heroRef.current);
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', onScroll);
        ro.disconnect();
      };
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.setAttribute('data-in', ''); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    page.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

    return () => { cleanup(); io.disconnect(); };
  }, [reduceMotion, nativeScroll]);

  // The cut-out layers are only needed once the user starts to scroll, so they load after the first
  // paint and an idle moment, instead of competing with the sky photo and the app code for bandwidth.
  useEffect(() => {
    if (reduceMotion) return undefined;
    const go = () => setShowCutouts(true);
    if ('requestIdleCallback' in window) { const id = window.requestIdleCallback(go, { timeout: 1500 }); return () => window.cancelIdleCallback(id); }
    const t = setTimeout(go, 400);
    return () => clearTimeout(t);
  }, [reduceMotion]);
  // a layer that arrives after the page has already scrolled needs placing straight away (JS fallback only)
  useEffect(() => { if (showCutouts) updateRef.current?.(); }, [showCutouts]);

  return (
    <div className={styles.page} ref={pageRef}>
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.layers} aria-hidden="true">
          {LAYERS.map((l, i) => {
            // people who ask for reduced motion only get the sky layer (the whole photo), nothing else is downloaded
            const cutout = l.id !== 'sky';
            if (cutout && (reduceMotion || !showCutouts)) return null;
            return (
              <div
                key={l.id}
                ref={el => { layerRefs.current[i] = el; }}
                className={`${styles.layer} ${cutout ? styles.cutout : ''} ${cutout && cutoutsReady >= 3 ? styles.cutoutOn : ''}`}
                style={{ '--speed': l.speed, '--zoom': l.zoom }}
              >
                <picture>
                  <source media="(max-width: 700px)" srcSet={layerSrc(l.id, true)} />
                  <img
                    src={layerSrc(l.id, false)}
                    alt=""
                    decoding="async"
                    fetchPriority={cutout ? 'low' : 'high'}
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
