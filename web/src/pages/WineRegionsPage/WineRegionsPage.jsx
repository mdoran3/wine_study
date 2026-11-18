import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import map from '../../data/spain_map.json';
import info from '../../data/wine_regions.json';
import glassWines from '../../data/wines.json';
import bottleWines from '../../data/wines_by_the_bottle.json';
import bodegas from '../../data/bodegas.json';
import media from '../../data/map_media.json';
import styles from './WineRegionsPage.module.css';

const { groups, regions } = info;
const [W, H] = map.viewBox;
const BY_ID = Object.fromEntries(regions.map(r => [r.id, r]));

const ELEV_STOPS = [[0, '#dfe3c0'], [500, '#e4d3a4'], [1200, '#cba878'], [1800, '#b48c64'], [2500, '#9c806a'], [3000, '#beb4aa'], [3700, '#f5f3f0']];

const FULL = { x: 0, y: 0, w: W, h: H };

function viewFor(id) {
  if (!id) return FULL;
  const [x, y, w, h] = map.regionViews[id];
  return { x, y, w, h };
}

const ALL_WINES = [
  ...glassWines.map(w => ({ ...w, list: 'glass' })),
  ...bottleWines.map(w => ({ ...w, list: 'bottle' })),
];
const BODEGA_BY_ID = Object.fromEntries(bodegas.map(b => [b.id, b]));
// bodega -> the wines on our lists that it makes
const bodegaWines = b => ALL_WINES.filter(w => b.wines.includes(w.name));
const onOurList = b => b.wines.length > 0;

// Wines on our list, grouped per region
function winesFor(region) {
  const names = region.dataNames;
  return [
    ...glassWines.filter(w => names.includes(w.region)).map(w => ({ ...w, list: 'glass' })),
    ...bottleWines.filter(w => names.includes(w.region)).map(w => ({ ...w, list: 'bottle' })),
  ];
}

function Callout({ label, x, y, inv, lift = 18 }) {
  const w = label.length * 6.6 + 18;
  return (
    <g className={styles.callout} transform={`translate(${x},${y - lift * inv}) scale(${inv})`} pointerEvents="none">
      <rect x={-w / 2} y={-11} width={w} height={20} rx={10} />
      <text textAnchor="middle" y={3.5}>{label}</text>
    </g>
  );
}

function Credit({ m }) {
  const author = m.author.length > 56 ? m.author.slice(0, 54) + '…' : m.author;
  return (
    <p className={styles.credit}>
      Photo: {author} ·{' '}
      <a href={m.licenseUrl || m.page} target="_blank" rel="noreferrer">{m.license}</a> ·{' '}
      <a href={m.page} target="_blank" rel="noreferrer">Wikimedia Commons</a>
    </p>
  );
}

function Gallery({ photos }) {
  const [idx, setIdx] = useState(0);
  if (!photos?.length) return null;
  const cur = photos[Math.min(idx, photos.length - 1)];
  return (
    <div className={styles.gallery}>
      <img key={cur.file} className={styles.galleryMain} src={cur.file} alt={cur.caption} loading="lazy" />
      <p className={styles.caption}>{cur.caption}</p>
      <Credit m={cur} />
      {photos.length > 1 && (
        <div className={styles.thumbs}>
          {photos.map((p, i) => (
            <button
              key={p.file}
              className={`${styles.thumb} ${i === idx ? styles.thumbActive : ''}`}
              onClick={() => setIdx(i)}
              aria-label={p.caption}
            >
              <img src={p.file} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BodegaCard({ bodega, onClose }) {
  const photo = media.bodegas?.[bodega.id]?.[0];
  const wines = bodegaWines(bodega);
  return (
    <div className={styles.bodegaCard}>
      <div className={styles.bodegaHead}>
        <div>
          <p className={styles.bodegaKicker}>Bodega</p>
          <h4 className={styles.bodegaName}>{bodega.name}</h4>
          <p className={styles.bodegaTown}>{bodega.town}</p>
        </div>
        <button className={styles.closeX} onClick={onClose} aria-label="Close bodega">✕</button>
      </div>
      {photo && (
        <>
          <img className={styles.bodegaPhoto} src={photo.file} alt={photo.caption} loading="lazy" />
          <p className={styles.caption}>{photo.caption}</p>
          <Credit m={photo} />
        </>
      )}
      <p className={styles.label}>On our list</p>
      {wines.length ? (
        <ul className={styles.wineList}>
          {wines.map(w => (
            <li key={`${w.list}-${w.id}`}>
              <span className={styles.wineName}>{w.name}</span>
              <span className={styles.wineMeta}>{w.type[0].toUpperCase() + w.type.slice(1)} · by the {w.list}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.text}>No wines from this bodega on our current lists.</p>
      )}
    </div>
  );
}

const regionBodegas = id => bodegas.filter(b => b.region === id);

function InfoPanel({ region, pinned, bodega, onSelectBodega }) {
  const g = region && groups[region.group];
  const wines = useMemo(() => (region ? winesFor(region) : []), [region]);
  const navigate = useNavigate();

  if (!region) {
    return (
      <aside className={styles.panel}>
        <h3 className={styles.panelTitle}>Explore the map</h3>
        <p className={styles.hint}>Hover over a wine region (or tap it on a phone) to see its grapes, style and the wines we pour from it. Click a region to zoom in and see photos and the bodegas.</p>
        <ul className={styles.legend}>
          {Object.values(groups).map(gr => (
            <li key={gr.label}><span className={styles.swatch} style={{ background: gr.color }} />{gr.label}</li>
          ))}
          <li><span className={`${styles.swatch} ${styles.swatchDot}`} />Bodega (shown when zoomed in)</li>
          <li><span className={`${styles.swatch} ${styles.swatchDot} ${styles.swatchGold}`} />Bodega we pour from</li>
        </ul>
        <p className={styles.note}>Region outlines are approximate and show the general area, not exact legal boundaries.</p>
      </aside>
    );
  }

  return (
    <aside className={styles.panel} style={{ borderTopColor: g.color }}>
      <div className={styles.panelHead}>
        <h3 className={styles.panelTitle}>{region.name}</h3>
        <span className={styles.tag} style={{ background: g.color }}>{g.label}</span>
      </div>
      <p className={styles.designation}>{region.designation}</p>

      {bodega && <BodegaCard bodega={bodega} onClose={() => onSelectBodega(null)} />}

      {pinned && <Gallery key={region.id} photos={media.regions?.[region.id]} />}

      <p className={styles.label}>Where</p>
      <p className={styles.text}>{region.location}</p>

      <p className={styles.label}>Grapes</p>
      <div className={styles.chips}>
        {region.grapes.map(gr => <span key={gr} className={styles.chip}>{gr}</span>)}
      </div>

      <p className={styles.label}>Style</p>
      <p className={styles.text}>{region.style}</p>

      <p className={styles.label}>Good to know</p>
      <ul className={styles.facts}>
        {region.facts.map(f => <li key={f}>{f}</li>)}
      </ul>

      <p className={styles.label}>On our list</p>
      {wines.length ? (
        <ul className={styles.wineList}>
          {wines.map(w => (
            <li key={`${w.list}-${w.id}`}>
              <span className={styles.wineName}>{w.name}</span>
              <span className={styles.wineMeta}>{w.type[0].toUpperCase() + w.type.slice(1)} · by the {w.list}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.text}>{region.noWinesText || 'No wines from this region on the current wine lists.'}</p>
      )}
      {pinned && regionBodegas(region.id).length > 0 && (
        <>
          <p className={styles.label}>Bodegas on the map</p>
          <div className={styles.bodegaChips}>
            {regionBodegas(region.id).map(b => (
              <button
                key={b.id}
                className={`${styles.bodegaChip} ${bodega?.id === b.id ? styles.bodegaChipActive : ''}`}
                onClick={() => onSelectBodega(b.id)}
              >
                {onOurList(b) && <span className={styles.goldDot} />}{b.name}
              </button>
            ))}
          </div>
        </>
      )}
      {region.link && (
        <button className={styles.linkBtn} onClick={() => navigate(region.link.path)}>{region.link.label} →</button>
      )}
    </aside>
  );
}

function DetailRelief({ id }) {
  const [loaded, setLoaded] = useState(false);
  const [x, y, w, h] = map.regionViews[id];
  return (
    <image
      href={`/relief/${id}.webp`}
      x={x}
      y={y}
      width={w}
      height={h}
      preserveAspectRatio="none"
      className={`${styles.detail} ${loaded ? styles.detailOn : ''}`}
      onLoad={() => setLoaded(true)}
    />
  );
}

export default function WineRegionsPage() {
  useEffect(() => { document.title = 'Meson Sabika - Wine Regions of Spain'; }, []);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [selBodega, setSelBodega] = useState(null);
  const [hoverBodega, setHoverBodega] = useState(null);
  const activeId = hover ?? pinned;
  const active = activeId ? BY_ID[activeId] : null;

  // Animated zoom to the pinned region
  const [view, setView] = useState(FULL);
  const viewRef = useRef(FULL);
  useEffect(() => {
    const from = viewRef.current;
    const to = viewFor(pinned);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 0 : 650;
    const t0 = performance.now();
    let raf;
    const step = now => {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const v = {
        x: from.x + (to.x - from.x) * e,
        y: from.y + (to.y - from.y) * e,
        w: from.w + (to.w - from.w) * e,
        h: from.h + (to.h - from.h) * e,
      };
      viewRef.current = v;
      setView(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [pinned]);
  const zoom = W / view.w;
  const inv = 1 / zoom;
  const zoomed = zoom > 1.6;
  const cityTier = zoom >= 2.2 ? 3 : zoom > 1.6 ? 2 : 1;

  const pinRegion = id => {
    setPinned(p => (p === id ? null : id));
    setSelBodega(null);
  };
  const clearAll = () => { setPinned(null); setSelBodega(null); };
  const chooseBodega = id => {
    if (!id) { setSelBodega(null); return; }
    setPinned(BODEGA_BY_ID[id].region);
    setSelBodega(id);
  };

  const bind = id => ({
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover(null),
    onFocus: () => setHover(id),
    onBlur: () => setHover(null),
    onClick: e => { e.stopPropagation(); pinRegion(id); },
    onKeyDown: e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pinRegion(id);
      }
    },
    tabIndex: 0,
    role: 'button',
    'aria-label': `${BY_ID[id].name}, ${BY_ID[id].designation}`,
  });

  const regionClass = id => {
    const cls = [styles.region];
    if (activeId === id) {
      cls.push(styles.regionActive);
      if (pinned === id) cls.push(styles.regionPinned);
    }
    else if (activeId) cls.push(styles.regionDim);
    return cls.join(' ');
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Wine Regions of Spain</h2>
      <div className={styles.layout}>
        <div className={styles.mapCard}>
          <svg
            className={styles.svg}
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            style={{ '--inv': inv }}
            data-zoomed={zoomed}
            role="img"
            aria-label="Map of Spain showing wine regions"
            onClick={clearAll}
          >
            <defs>
              <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#c6e0ec" />
                <stop offset="1" stopColor="#9fc9de" />
              </linearGradient>
              <linearGradient id="elev" x1="0" y1="0" x2="1" y2="0">
                {ELEV_STOPS.map(([e, c]) => (
                  <stop key={e} offset={e / 3700} stopColor={c} />
                ))}
              </linearGradient>
              <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <clipPath id="landClip">
                <path d={map.land} />
                {Object.entries(map.neighbors).map(([n, d]) => <path key={n} d={d} />)}
              </clipPath>
              <clipPath id="canaryClip">
                <path d={map.canary.land} />
              </clipPath>
            </defs>

            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#sea)" />

            {/* real shaded relief (elevation data), clipped to the coastline */}
            <g clipPath="url(#landClip)">
              <image href="/spain_relief.webp" x="0" y="0" width={W} height={H} preserveAspectRatio="none" />
              {/* sharper relief for the zoomed region, faded in once it has loaded */}
              {pinned && pinned !== 'canary-islands' && <DetailRelief key={pinned} id={pinned} />}
              {/* mute the neighbouring countries so Spain stands out */}
              {Object.entries(map.neighbors).map(([n, d]) => (
                <path key={n} d={d} className={styles.neighbor} fillRule="evenodd" />
              ))}
            </g>
            <path d={map.land} className={styles.land} fillRule="evenodd" />
            <path d={map.provinces} className={styles.provinces} />

            {/* rivers */}
            <g className={styles.rivers}>
              {map.rivers.map(r => <path key={r.name} d={r.d} />)}
            </g>

            {/* labels: seas, countries, mountain ranges, rivers */}
            <g className={styles.labels} pointerEvents="none">
              {map.labels.map(l => (
                <text
                  key={l.text}
                  x={l.x}
                  y={l.y}
                  className={`${styles[`l_${l.kind}`]} ${['ocean', 'sea', 'country', 'land'].includes(l.kind) ? styles.fadeZoom : ''}`}
                  textAnchor="middle"
                  transform={l.rot ? `rotate(${l.rot} ${l.x} ${l.y})` : undefined}
                >
                  {l.text}
                </text>
              ))}
              {map.mountains.map(m => (
                <text key={m.name} x={m.label[0]} y={m.label[1]} className={m.minor ? styles.l_mountainMinor : styles.l_mountain} textAnchor="middle">
                  {m.name}
                </text>
              ))}
              {map.riverLabels.map(r => (
                <text key={r.name} x={r.x} y={r.y} className={styles.l_river} textAnchor="middle">{r.name}</text>
              ))}
            </g>

            {/* peaks */}
            <g pointerEvents="none" className={styles.peaks}>
              {map.peaks.map(pk => (
                <g key={pk.name} transform={`translate(${pk.x},${pk.y}) scale(${inv})`}>
                  <path d="M0,-4.5 L4,2.5 L-4,2.5 Z" />
                  <text x={pk.left ? -6 : 6} y="3" textAnchor={pk.left ? 'end' : 'start'}>{pk.name} {pk.elev.toLocaleString()} m</text>
                </g>
              ))}
            </g>

            {/* wine regions */}
            <g>
              {regions.filter(r => r.id !== 'canary-islands').map(r => (
                <path
                  key={r.id}
                  d={map.regions[r.id]}
                  className={regionClass(r.id)}
                  style={{ '--c': groups[r.group].color }}
                  filter={activeId === r.id ? 'url(#glow)' : undefined}
                  {...bind(r.id)}
                />
              ))}
            </g>

            {/* cities and wine towns; smaller places appear as you zoom in */}
            <g className={styles.cities} pointerEvents="none">
              {map.cities.filter(c => c.tier <= cityTier).map(c => (
                <g key={c.name} className={styles[`city${c.tier}`]}>
                  <circle cx={c.x} cy={c.y} r={(c.tier === 1 ? 2.6 : 2) * inv} />
                  <text x={c.x + 4 * inv} y={c.y + 3 * inv}>{c.name}</text>
                </g>
              ))}
            </g>

            {/* marker dots: larger, easier targets for small regions */}
            <g>
              {regions.filter(r => r.id !== 'canary-islands').map(r => {
                const c = map.regionCenters[r.id];
                return (
                  <g
                    key={r.id}
                    {...bind(r.id)}
                    tabIndex={-1}
                    role="presentation"
                    aria-label={undefined}
                    className={`${styles.marker} ${activeId === r.id ? styles.markerActive : activeId ? styles.markerDim : ''}`}
                    style={{ '--c': groups[r.group].color }}
                  >
                    <circle cx={c[0]} cy={c[1]} r={9 * inv} className={styles.hit} />
                    <circle cx={c[0]} cy={c[1]} r={(activeId === r.id ? 4.6 : 3.2) * inv} className={styles.dot} />
                  </g>
                );
              })}
            </g>

            {/* bodegas: shown once zoomed in */}
            <g className={zoomed ? styles.bodegasOn : styles.bodegasOff}>
              {bodegas.map(b => (
                <g
                  key={b.id}
                  className={`${styles.bodega} ${onOurList(b) ? styles.bodegaGold : ''} ${selBodega === b.id ? styles.bodegaSel : ''}`}
                  style={{ '--c': groups[BY_ID[b.region].group].color }}
                  onMouseEnter={() => setHoverBodega(b.id)}
                  onMouseLeave={() => setHoverBodega(null)}
                  onFocus={() => setHoverBodega(b.id)}
                  onBlur={() => setHoverBodega(null)}
                  onClick={e => { e.stopPropagation(); chooseBodega(b.id); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chooseBodega(b.id); } }}
                  tabIndex={zoomed ? 0 : -1}
                  role="button"
                  aria-label={`Bodega ${b.name}, ${b.town}`}
                >
                  <circle cx={b.x} cy={b.y} r={9 * inv} className={styles.hit} />
                  <circle cx={b.x} cy={b.y} r={(selBodega === b.id ? 5.6 : 4.2) * inv} className={styles.bodegaRing} />
                  <circle cx={b.x} cy={b.y} r={1.9 * inv} className={styles.bodegaCore} />
                </g>
              ))}
            </g>

            {/* Canary Islands inset */}
            <g transform={`translate(${map.canary.x},${map.canary.y})`}>
              <rect width={map.canary.w} height={map.canary.h} className={styles.inset} rx={4} />
              <g clipPath="url(#canaryClip)">
                <image href="/canary_relief.webp" x="0" y="0" width={map.canary.w} height={map.canary.h} preserveAspectRatio="none" />
              </g>
              <text x={map.canary.w / 2} y={map.canary.h - 5} className={styles.l_inset} textAnchor="middle">Canary Islands</text>
              <path
                d={map.canary.land}
                className={regionClass('canary-islands')}
                style={{ '--c': groups.mixed.color }}
                filter={activeId === 'canary-islands' ? 'url(#glow)' : undefined}
                {...bind('canary-islands')}
              />
              {map.canary.peaks.map(pk => (
                <g key={pk.name} className={styles.peaks} pointerEvents="none" transform={`translate(${pk.x},${pk.y}) scale(${inv})`}>
                  <path d="M0,-4.5 L4,2.5 L-4,2.5 Z" />
                  <text x="6" y="3">{pk.name} {pk.elev.toLocaleString()} m</text>
                </g>
              ))}
            </g>

            {/* compass, scale and elevation key stay fixed in the corners of the view */}
            <g transform={`translate(${view.x + view.w - 34 * inv},${view.y + 36 * inv}) scale(${inv})`} pointerEvents="none" className={styles.compass}>
              <path d="M0,-18 L6,4 L0,0 L-6,4 Z" />
              <text y={-22} textAnchor="middle">N</text>
            </g>
            <g transform={`translate(${view.x + view.w - 130 * inv},${view.y + view.h - 22 * inv}) scale(${inv})`} pointerEvents="none" className={styles.scale}>
              <rect width="112" height="4" />
              <text x="56" y="-5" textAnchor="middle">{`≈ ${Math.round(200 / zoom)} km`}</text>
            </g>
            <g transform={`translate(${view.x + view.w - 130 * inv},${view.y + view.h - 52 * inv}) scale(${inv})`} pointerEvents="none" className={styles.scale}>
              <rect width="112" height="7" style={{ fill: 'url(#elev)', stroke: '#5b4a30', strokeWidth: 0.6 }} />
              <text x="0" y="17" textAnchor="start">0 m</text>
              <text x="112" y="17" textAnchor="end">3,700 m</text>
              <text x="56" y="-4" textAnchor="middle">Elevation</text>
            </g>

            {hoverBodega && zoomed
              ? <Callout label={BODEGA_BY_ID[hoverBodega].name} x={BODEGA_BY_ID[hoverBodega].x} y={BODEGA_BY_ID[hoverBodega].y} inv={inv} lift={14} />
              : active && <Callout
                  label={active.name}
                  x={activeId === 'canary-islands' ? map.canary.x + map.canary.w / 2 : map.regionCenters[activeId][0]}
                  y={activeId === 'canary-islands' ? map.canary.y + 8 : map.regionCenters[activeId][1]}
                  inv={inv}
                />}
          </svg>

          {pinned && (
            <button className={styles.resetBtn} onClick={clearAll}>↺ Zoom out</button>
          )}
          <div className={styles.chipsRow}>
            {regions.map(r => (
              <button
                key={r.id}
                className={`${styles.regionBtn} ${activeId === r.id ? styles.regionBtnActive : ''}`}
                style={{ '--c': groups[r.group].color }}
                onMouseEnter={() => setHover(r.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => pinRegion(r.id)}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        <InfoPanel
          region={active}
          pinned={!!pinned && activeId === pinned}
          bodega={selBodega && BODEGA_BY_ID[selBodega].region === activeId ? BODEGA_BY_ID[selBodega] : null}
          onSelectBodega={chooseBodega}
        />
      </div>
    </div>
  );
}
