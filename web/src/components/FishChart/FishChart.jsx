import fish from '../../data/fish.json';
import styles from './FishChart.module.css';

const OIL_ROWS = ['oily', 'semi-oily', 'lean'];
const FLAKE_COLS = ['small flakes', 'medium flakes', 'large flakes', 'fibrous'];

const FLAKE_LABELS = { 'small flakes': 'Small', 'medium flakes': 'Medium', 'large flakes': 'Large', fibrous: 'Fibrous' };
const OIL_LABELS = { oily: 'Oily', 'semi-oily': 'Semi-oily', lean: 'Lean' };
const key = oil => oil.replace('-', '_');

const fishAt = (oil, flake) =>
  fish.filter(f => f.oil_content === oil && f.flake_type === flake).sort((a, b) => a.name.localeCompare(b.name));

function Chip({ name, oil }) {
  return <span className={`${styles.chip} ${styles[`chip_${key(oil)}`]}`}>{name}</span>;
}

/*
 * Two layouts of the same data, swapped by a media query (no sideways scrolling in either):
 *   - wide screens: a matrix, oil content down the side and flake size across the top
 *   - phones: one band per oil content, listing each flake size that has fish
 */
export default function FishChart() {
  return (
    <section className={styles.wrapper} aria-labelledby="fish-chart-title">
      <h3 id="fish-chart-title" className={styles.title}>Fish by Oil Content &amp; Flake Size</h3>

      {/* wide: matrix */}
      <div className={styles.matrix} role="table" aria-label="Fish by oil content and flake size">
        <div className={styles.corner}>
          <span>Flake size →</span>
          <span>Oil content ↓</span>
        </div>
        {FLAKE_COLS.map(flake => (
          <div key={flake} className={styles.colHead} role="columnheader">{FLAKE_LABELS[flake]}</div>
        ))}
        {OIL_ROWS.map(oil => (
          <div key={oil} className={styles.row} role="row">
            <div className={`${styles.rowHead} ${styles[`head_${key(oil)}`]}`} role="rowheader">{OIL_LABELS[oil]}</div>
            {FLAKE_COLS.map(flake => (
              <div key={flake} className={`${styles.cell} ${styles[`cell_${key(oil)}`]}`} role="cell">
                {fishAt(oil, flake).map(f => <Chip key={f.id} name={f.name} oil={oil} />)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* phone: stacked bands */}
      <div className={styles.stack}>
        {OIL_ROWS.map(oil => (
          <div key={oil} className={`${styles.band} ${styles[`band_${key(oil)}`]}`}>
            <h4 className={`${styles.bandTitle} ${styles[`head_${key(oil)}`]}`}>{OIL_LABELS[oil]}</h4>
            <ul className={styles.groups}>
              {FLAKE_COLS.filter(flake => fishAt(oil, flake).length).map(flake => (
                <li key={flake} className={styles.group}>
                  <span className={styles.groupLabel}>{FLAKE_LABELS[flake]}{flake === 'fibrous' ? '' : ' flakes'}</span>
                  <span className={styles.chips}>
                    {fishAt(oil, flake).map(f => <Chip key={f.id} name={f.name} oil={oil} />)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
