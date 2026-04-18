import fish from '../../data/fish.json';
import styles from './FishChart.module.css';

const OIL_ROWS = ['oily', 'semi-oily', 'lean'];
const FLAKE_COLS = ['small flakes', 'medium flakes', 'large flakes', 'fibrous'];

const FLAKE_LABELS = {
  'small flakes': 'Small',
  'medium flakes': 'Medium',
  'large flakes': 'Large',
  'fibrous': 'Fibrous',
};

const OIL_LABELS = {
  'oily': 'Oily',
  'semi-oily': 'Semi-Oily',
  'lean': 'Lean',
};

export default function FishChart() {
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Fish by Oil Content &amp; Flake Size</h3>
      <div className={styles.inner}>

        {/* Y-axis label + row labels — pinned left, never scrolls */}
        <div className={styles.yAxisLabel}>Oil Content</div>
        <div className={styles.yLabels}>
          {OIL_ROWS.map(oil => (
            <div key={oil} className={styles.yLabel}>{OIL_LABELS[oil]}</div>
          ))}
        </div>

        {/* Only the grid + x-labels scroll */}
        <div className={styles.scrollArea}>
          <div className={styles.gridAndX}>
            <div className={styles.grid}>
              {OIL_ROWS.map(oil =>
                FLAKE_COLS.map(flake => {
                  const matches = fish.filter(f => f.oil_content === oil && f.flake_type === flake);
                  return (
                    <div key={`${oil}-${flake}`} className={`${styles.cell} ${styles[oil.replace('-', '_')]}`}>
                      {matches.map(f => (
                        <span key={f.id} className={`${styles.dot} ${styles[`dot_${oil.replace('-', '_')}`]}` }>{f.name}</span>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
            <div className={styles.xLabels}>
              {FLAKE_COLS.map(flake => (
                <div key={flake} className={styles.xLabel}>{FLAKE_LABELS[flake]}</div>
              ))}
            </div>
            <div className={styles.xAxisLabel}>Flake Size</div>
          </div>
        </div>

      </div>
    </div>
  );
}
